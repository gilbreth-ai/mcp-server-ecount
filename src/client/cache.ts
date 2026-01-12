/**
 * ECOUNT API Response Cache
 *
 * 조회 API의 Rate Limit(10분/1회)을 효율적으로 활용하기 위한 캐싱 레이어
 *
 * 캐싱 전략:
 * - Zone: 영구 캐싱 (회사별 고정값)
 * - Session: 만료 시간까지 캐싱
 * - 조회 결과: 10분 TTL (Rate Limit에 맞춤)
 * - 단건 조회: 1분 TTL (빈번한 조회용)
 */

import { getLogger } from '../utils/logger.js';

/**
 * 캐시 엔트리
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

/**
 * 캐시 키 생성 옵션
 */
interface CacheKeyOptions {
  endpoint: string;
  params?: Record<string, unknown>;
}

/**
 * 메모리 캐시 구현
 *
 * 특징:
 * - TTL 기반 자동 만료
 * - 최대 크기 제한 (LRU 방식)
 * - 키 프리픽스 지원
 */
export class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private logger = getLogger();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;

  constructor(options: { maxSize?: number; defaultTtlMs?: number } = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.defaultTtlMs = options.defaultTtlMs ?? 10 * 60 * 1000; // 10분
    this.logger.debug('Cache initialized', {
      maxSize: this.maxSize,
      defaultTtlMs: this.defaultTtlMs,
    });
  }

  /**
   * 캐시에서 값 조회
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return undefined;
    }

    // 만료 확인
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.logger.debug('Cache expired', { key });
      return undefined;
    }

    this.logger.debug('Cache hit', { key });
    return entry.value;
  }

  /**
   * 캐시에 값 저장
   * @param key 캐시 키
   * @param value 저장할 값
   * @param ttlMs TTL (밀리초, 기본값: defaultTtlMs)
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    // 최대 크기 초과 시 가장 오래된 항목 제거 (LRU)
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.logger.debug('Cache evicted (LRU)', { key: oldestKey });
      }
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
      createdAt: Date.now(),
    };

    this.cache.set(key, entry);
    this.logger.debug('Cache set', { key, ttlMs: ttlMs ?? this.defaultTtlMs });
  }

  /**
   * 캐시에서 값 삭제
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug('Cache deleted', { key });
    }
    return deleted;
  }

  /**
   * 패턴에 매칭되는 키들 삭제
   */
  deleteByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      this.logger.debug('Cache deleted by prefix', { prefix, count });
    }
    return count;
  }

  /**
   * 전체 캐시 초기화
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.debug('Cache cleared', { entriesRemoved: size });
  }

  /**
   * 만료된 엔트리 정리
   */
  cleanup(): number {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.logger.debug('Cache cleanup', { entriesRemoved: count });
    }
    return count;
  }

  /**
   * 캐시 상태 조회
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * 캐시 키 존재 여부 확인
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
}

/**
 * API 응답 캐시를 위한 특화된 래퍼
 */
export class ApiCache {
  private cache: MemoryCache;

  // TTL 상수
  static readonly TTL_PERMANENT = Number.MAX_SAFE_INTEGER;
  static readonly TTL_QUERY = 10 * 60 * 1000; // 10분
  static readonly TTL_QUERY_SINGLE = 60 * 1000; // 1분
  static readonly TTL_SESSION = 24 * 60 * 60 * 1000; // 24시간

  constructor(options?: { maxSize?: number }) {
    this.cache = new MemoryCache({
      maxSize: options?.maxSize ?? 500,
      defaultTtlMs: ApiCache.TTL_QUERY,
    });
  }

  /**
   * API 응답 캐시 키 생성
   */
  private createKey(options: CacheKeyOptions): string {
    const paramStr = options.params
      ? JSON.stringify(options.params, Object.keys(options.params).sort())
      : '';
    return `api:${options.endpoint}:${paramStr}`;
  }

  /**
   * Zone 캐시 (영구)
   */
  getZone(comCode: string): string | undefined {
    return this.cache.get<string>(`zone:${comCode}`);
  }

  setZone(comCode: string, zone: string): void {
    this.cache.set(`zone:${comCode}`, zone, ApiCache.TTL_PERMANENT);
  }

  /**
   * 세션 캐시
   */
  getSession(comCode: string): { sessionId: string; expiresAt: number } | undefined {
    return this.cache.get(`session:${comCode}`);
  }

  setSession(
    comCode: string,
    sessionId: string,
    expiresAt: number
  ): void {
    const ttl = expiresAt - Date.now();
    if (ttl > 0) {
      this.cache.set(`session:${comCode}`, { sessionId, expiresAt }, ttl);
    }
  }

  clearSession(comCode: string): void {
    this.cache.delete(`session:${comCode}`);
  }

  /**
   * API 응답 캐시
   */
  getApiResponse<T>(endpoint: string, params?: Record<string, unknown>): T | undefined {
    const key = this.createKey({ endpoint, params });
    return this.cache.get<T>(key);
  }

  setApiResponse<T>(
    endpoint: string,
    params: Record<string, unknown> | undefined,
    data: T,
    isSingleQuery: boolean = false
  ): void {
    const key = this.createKey({ endpoint, params });
    const ttl = isSingleQuery ? ApiCache.TTL_QUERY_SINGLE : ApiCache.TTL_QUERY;
    this.cache.set(key, data, ttl);
  }

  /**
   * 특정 엔드포인트의 캐시 무효화
   */
  invalidateEndpoint(endpoint: string): number {
    return this.cache.deleteByPrefix(`api:${endpoint}`);
  }

  /**
   * 전체 캐시 초기화
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 캐시 상태 조회
   */
  getStats(): { size: number; maxSize: number } {
    return this.cache.getStats();
  }

  /**
   * 만료된 엔트리 정리
   */
  cleanup(): number {
    return this.cache.cleanup();
  }
}

// 기본 캐시 인스턴스
let defaultCache: ApiCache | null = null;
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function getCache(): ApiCache {
  if (!defaultCache) {
    defaultCache = new ApiCache();

    // 5분마다 만료된 엔트리 정리 (메모리 누수 방지)
    if (!cleanupInterval) {
      cleanupInterval = setInterval(() => {
        defaultCache?.cleanup();
      }, 5 * 60 * 1000);

      // 프로세스 종료 시 인터벌 정리
      if (typeof process !== 'undefined') {
        process.on('beforeExit', () => {
          if (cleanupInterval) {
            clearInterval(cleanupInterval);
            cleanupInterval = null;
          }
        });
      }
    }
  }
  return defaultCache;
}

export function resetCache(): void {
  if (defaultCache) {
    defaultCache.clear();
  }
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  defaultCache = null;
}
