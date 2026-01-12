/**
 * ECOUNT Session Manager
 *
 * 세션 상태 관리 및 영속화
 * - Zone 조회 및 캐싱
 * - 로그인 및 세션 ID 관리
 * - 세션 만료 감지 및 자동 갱신
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { EcountCredentials } from '../types/config.js';
import { EcountAuthError } from '../utils/errors.js';
import { getLogger, type Logger } from '../utils/logger.js';
import { getCache, type ApiCache } from './cache.js';
import { getRateLimiter, type RateLimiter } from './rate-limiter.js';

// 기본 타임아웃: 30초 (Zone/Login은 빠르게 처리됨)
const AUTH_TIMEOUT_MS = 30000;

/**
 * 타임아웃이 있는 fetch 래퍼
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = AUTH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 세션 상태
 */
export interface SessionState {
  zone: string | null;
  sessionId: string | null;
  expiresAt: number | null;
  comCode: string;
}

/**
 * 세션 파일 형식
 */
interface SessionFileData {
  comCode: string;
  zone: string;
  sessionId: string;
  expiresAt: number;
  savedAt: number;
}

/**
 * 세션 매니저 옵션
 */
interface SessionManagerOptions {
  credentials: EcountCredentials;
  useTestServer?: boolean;
  sessionFilePath?: string;
}

/**
 * 세션 매니저
 *
 * 책임:
 * 1. Zone 조회 및 캐싱
 * 2. 로그인 및 세션 ID 발급
 * 3. 세션 상태 파일 저장/로드
 * 4. 세션 만료 확인 및 갱신
 */
export class SessionManager {
  private credentials: EcountCredentials;
  private useTestServer: boolean;
  private sessionFilePath?: string;
  private cache: ApiCache;
  private rateLimiter: RateLimiter;
  private logger: Logger;

  // 세션 상태
  private _zone: string | null = null;
  private _sessionId: string | null = null;
  private _expiresAt: number | null = null;

  // API 베이스 URL
  private readonly testBaseUrl = 'https://sboapi.ecount.com';
  private readonly prodZoneUrl = 'https://oapi.ecount.com';

  constructor(options: SessionManagerOptions) {
    this.credentials = options.credentials;
    this.useTestServer = options.useTestServer ?? false;
    this.sessionFilePath = options.sessionFilePath;
    this.cache = getCache();
    this.rateLimiter = getRateLimiter({ useTestServer: this.useTestServer });
    this.logger = getLogger();
  }

  /**
   * Zone 정보 가져오기 (캐시 우선)
   */
  get zone(): string | null {
    return this._zone;
  }

  /**
   * 현재 세션 ID
   */
  get sessionId(): string | null {
    return this._sessionId;
  }

  /**
   * 세션 만료 시간
   */
  get expiresAt(): number | null {
    return this._expiresAt;
  }

  /**
   * 세션 유효 여부 확인
   */
  get isSessionValid(): boolean {
    if (!this._sessionId || !this._expiresAt) return false;
    // 5분 여유를 두고 만료 확인
    return Date.now() < this._expiresAt - 5 * 60 * 1000;
  }

  /**
   * API 베이스 URL 가져오기
   */
  getBaseUrl(): string {
    // Zone은 소문자로 변환 (BB -> bb)
    const zone = this._zone?.toLowerCase();
    if (this.useTestServer) {
      return zone
        ? `https://sboapi${zone}.ecount.com`
        : this.testBaseUrl;
    }
    return zone
      ? `https://oapi${zone}.ecount.com`
      : this.prodZoneUrl;
  }

  /**
   * 세션 초기화 (파일에서 로드 또는 새로 생성)
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing session manager');

    // 1. 캐시에서 Zone 확인
    const cachedZone = this.cache.getZone(this.credentials.comCode);
    if (cachedZone) {
      this._zone = cachedZone;
      this.logger.debug('Zone loaded from cache', { zone: this._zone });
    }

    // 2. 세션 파일에서 로드 시도
    if (this.sessionFilePath) {
      const loaded = await this.loadSessionFromFile();
      if (loaded && this.isSessionValid) {
        this.logger.info('Session restored from file');
        return;
      }
    }

    // 3. 캐시에서 세션 확인
    const cachedSession = this.cache.getSession(this.credentials.comCode);
    if (cachedSession && Date.now() < cachedSession.expiresAt) {
      this._sessionId = cachedSession.sessionId;
      this._expiresAt = cachedSession.expiresAt;
      this.logger.debug('Session loaded from cache');
      return;
    }

    // 4. Zone이 없으면 조회
    if (!this._zone) {
      await this.fetchZone();
    }

    this.logger.info('Session manager initialized', {
      zone: this._zone,
      hasSession: !!this._sessionId,
    });
  }

  /**
   * Zone 조회
   */
  private async fetchZone(): Promise<string> {
    this.logger.info('Fetching zone info');

    await this.rateLimiter.execute('zone', async () => {
      const url = this.useTestServer
        ? `${this.testBaseUrl}/OAPI/V2/Zone`
        : `${this.prodZoneUrl}/OAPI/V2/Zone`;

      let response: Response;
      try {
        response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ COM_CODE: this.credentials.comCode }),
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw EcountAuthError.timeout('Zone 조회');
        }
        throw error;
      }

      if (!response.ok) {
        throw EcountAuthError.zoneNotFound();
      }

      const data = await response.json() as Record<string, unknown>;

      this.logger.debug('Zone API response', { data });

      // 다양한 응답 형식 처리 (Ecount API가 일관적이지 않음)
      const status = data.Status;
      const dataObj = data.Data as Record<string, unknown> | undefined;
      const zone = dataObj?.ZONE || dataObj?.Zone || (data as Record<string, unknown>).ZONE || (data as Record<string, unknown>).Zone;

      if ((status !== '200' && status !== 200) || !zone) {
        this.logger.error('Zone fetch failed', { response: data });
        throw EcountAuthError.zoneNotFound();
      }

      const zoneData = { ZONE: zone as string };
      this._zone = zoneData.ZONE;

      // 캐시에 영구 저장
      this.cache.setZone(this.credentials.comCode, this._zone);

      this.logger.info('Zone fetched successfully', { zone: this._zone });
    });

    return this._zone!;
  }

  /**
   * 로그인 및 세션 ID 발급
   */
  async login(): Promise<string> {
    this.logger.info('Logging in to ECOUNT');

    // Zone 없으면 먼저 조회
    if (!this._zone) {
      await this.fetchZone();
    }

    await this.rateLimiter.execute('login', async () => {
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/OAPI/V2/OAPILogin`;

      let response: Response;
      try {
        response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            COM_CODE: this.credentials.comCode,
            USER_ID: this.credentials.userId,
            API_CERT_KEY: this.credentials.apiCertKey,
            LAN_TYPE: 'ko-KR',
            ZONE: this._zone,
          }),
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw EcountAuthError.timeout('로그인');
        }
        throw error;
      }

      if (!response.ok) {
        throw EcountAuthError.invalidCredentials();
      }

      const data = await response.json() as Record<string, unknown>;

      // 다양한 응답 형식 처리
      const status = data.Status;
      const dataObj = data.Data as Record<string, unknown> | undefined;
      const datasObj = dataObj?.Datas as Record<string, unknown> | undefined;

      // SESSION_ID는 Data.SESSION_ID 또는 Data.Datas.SESSION_ID에 있을 수 있음
      const sessionId = dataObj?.SESSION_ID || datasObj?.SESSION_ID;
      const code = dataObj?.Code;

      this.logger.debug('Login response parsed', { status, code, hasSessionId: !!sessionId });

      // Status 200이고 Code가 '00'이면 성공 (또는 SESSION_ID가 있으면 성공)
      const isSuccess = (status === '200' || status === 200) && (code === '00' || sessionId);

      if (!isSuccess || !sessionId) {
        this.logger.error('Login failed', { status, code, hasSessionId: !!sessionId });
        throw EcountAuthError.invalidCredentials();
      }

      const loginData = { SESSION_ID: sessionId as string };
      this._sessionId = loginData.SESSION_ID;

      // 세션 만료 시간 설정 (기본 24시간, 12시간 여유)
      this._expiresAt = Date.now() + 12 * 60 * 60 * 1000;

      // 캐시에 저장
      this.cache.setSession(
        this.credentials.comCode,
        this._sessionId,
        this._expiresAt
      );

      // 파일에 저장
      if (this.sessionFilePath) {
        await this.saveSessionToFile();
      }

      this.logger.info('Login successful');
    });

    return this._sessionId!;
  }

  /**
   * 세션 확보 (필요시 로그인)
   */
  async ensureSession(): Promise<string> {
    if (this.isSessionValid) {
      return this._sessionId!;
    }

    this.logger.info('Session invalid or expired, re-authenticating');
    this.clearSession();
    return this.login();
  }

  /**
   * 세션 초기화
   */
  clearSession(): void {
    this._sessionId = null;
    this._expiresAt = null;
    this.cache.clearSession(this.credentials.comCode);
    this.logger.debug('Session cleared');
  }

  /**
   * 세션 파일에서 로드
   */
  private async loadSessionFromFile(): Promise<boolean> {
    if (!this.sessionFilePath) return false;

    try {
      const content = await readFile(this.sessionFilePath, 'utf-8');
      const data: SessionFileData = JSON.parse(content);

      // 회사코드 일치 확인
      if (data.comCode !== this.credentials.comCode) {
        this.logger.debug('Session file company code mismatch');
        return false;
      }

      this._zone = data.zone;
      this._sessionId = data.sessionId;
      this._expiresAt = data.expiresAt;

      // 캐시에도 저장
      this.cache.setZone(this.credentials.comCode, this._zone);
      if (this.isSessionValid) {
        this.cache.setSession(
          this.credentials.comCode,
          this._sessionId,
          this._expiresAt
        );
      }

      this.logger.debug('Session loaded from file', {
        zone: this._zone,
        expiresAt: new Date(this._expiresAt).toISOString(),
      });

      return true;
    } catch {
      this.logger.debug('No session file found or invalid');
      return false;
    }
  }

  /**
   * 세션 파일에 저장
   */
  private async saveSessionToFile(): Promise<void> {
    if (!this.sessionFilePath || !this._zone || !this._sessionId || !this._expiresAt) {
      return;
    }

    try {
      const data: SessionFileData = {
        comCode: this.credentials.comCode,
        zone: this._zone,
        sessionId: this._sessionId,
        expiresAt: this._expiresAt,
        savedAt: Date.now(),
      };

      // 디렉토리 생성
      await mkdir(dirname(this.sessionFilePath), { recursive: true });
      await writeFile(this.sessionFilePath, JSON.stringify(data, null, 2));

      this.logger.debug('Session saved to file');
    } catch (error) {
      this.logger.warn('Failed to save session file', { error });
    }
  }

  /**
   * 현재 세션 상태 조회
   */
  getState(): SessionState {
    return {
      zone: this._zone,
      sessionId: this._sessionId,
      expiresAt: this._expiresAt,
      comCode: this.credentials.comCode,
    };
  }

  /**
   * 연결 테스트
   */
  async testConnection(): Promise<{
    success: boolean;
    zone?: string;
    sessionId?: string;
    error?: string;
  }> {
    try {
      await this.initialize();
      const sessionId = await this.ensureSession();
      return {
        success: true,
        zone: this._zone ?? undefined,
        sessionId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
