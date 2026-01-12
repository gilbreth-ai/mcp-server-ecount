import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { vol } from 'memfs';
import { SessionManager } from './session-manager.js';
import { resetCache } from './cache.js';
import { resetRateLimiter } from './rate-limiter.js';
import { EcountAuthError } from '../utils/errors.js';

// node:fs/promises를 memfs로 모킹
vi.mock('node:fs/promises', async () => {
  const memfs = await import('memfs');
  return memfs.fs.promises;
});

// Logger 모킹
vi.mock('../utils/logger.js', () => ({
  getLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// fetch 모킹
const mockFetch = vi.fn() as Mock;
vi.stubGlobal('fetch', mockFetch);

describe('SessionManager', () => {
  const testCredentials = {
    comCode: 'TEST001',
    userId: 'testuser',
    apiCertKey: 'test-api-key-12345',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    vol.reset();
    vol.mkdirSync('/tmp', { recursive: true });
    resetCache();
    resetRateLimiter();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with credentials', () => {
      const manager = new SessionManager({
        credentials: testCredentials,
      });
      expect(manager.zone).toBeNull();
      expect(manager.sessionId).toBeNull();
    });

    it('should accept useTestServer option', () => {
      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });
      // 테스트 서버는 초기에 테스트 base URL 사용
      expect(manager.getBaseUrl()).toBe('https://sboapi.ecount.com');
    });
  });

  describe('getBaseUrl', () => {
    it('should return production URL without zone', () => {
      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: false,
      });
      expect(manager.getBaseUrl()).toBe('https://oapi.ecount.com');
    });

    it('should return test URL without zone', () => {
      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });
      expect(manager.getBaseUrl()).toBe('https://sboapi.ecount.com');
    });
  });

  describe('initialize', () => {
    it('should fetch zone if not cached', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Status: 200,
            Data: { ZONE: 'BB' },
          }),
      });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      await manager.initialize();

      expect(manager.zone).toBe('BB');
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('should load session from file if valid', async () => {
      const futureExpiry = Date.now() + 10 * 60 * 60 * 1000; // 10시간 후
      const sessionData = {
        comCode: 'TEST001',
        zone: 'AA',
        sessionId: 'saved-session-id',
        expiresAt: futureExpiry,
        savedAt: Date.now(),
      };

      vol.writeFileSync('/tmp/session.json', JSON.stringify(sessionData));

      const manager = new SessionManager({
        credentials: testCredentials,
        sessionFilePath: '/tmp/session.json',
      });

      await manager.initialize();

      expect(manager.zone).toBe('AA');
      expect(manager.sessionId).toBe('saved-session-id');
      expect(manager.isSessionValid).toBe(true);
      // fetch가 호출되지 않아야 함 (파일에서 로드)
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not load session from file if expired', async () => {
      const pastExpiry = Date.now() - 60 * 60 * 1000; // 1시간 전 만료
      const sessionData = {
        comCode: 'TEST001',
        zone: 'CC',
        sessionId: 'expired-session',
        expiresAt: pastExpiry,
        savedAt: Date.now() - 2 * 60 * 60 * 1000,
      };

      vol.writeFileSync('/tmp/session.json', JSON.stringify(sessionData));

      // Zone 조회 응답 설정
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Status: 200,
            Data: { ZONE: 'DD' },
          }),
      });

      const manager = new SessionManager({
        credentials: testCredentials,
        sessionFilePath: '/tmp/session.json',
        useTestServer: true,
      });

      await manager.initialize();

      // 파일에서 Zone은 로드했지만 세션은 무효
      expect(manager.zone).toBe('CC');
      expect(manager.isSessionValid).toBe(false);
    });
  });

  describe('login', () => {
    it('should obtain session ID on successful login', async () => {
      // Zone 응답
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Status: 200,
            Data: { ZONE: 'EE' },
          }),
      });

      // Login 응답
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Status: 200,
            Data: {
              Code: '00',
              SESSION_ID: 'new-session-id-12345',
            },
          }),
      });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      const sessionId = await manager.login();

      expect(sessionId).toBe('new-session-id-12345');
      expect(manager.isSessionValid).toBe(true);
    });

    it('should save session to file after login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Status: 200,
            Data: { ZONE: 'FF' },
          }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Status: 200,
            Data: {
              Code: '00',
              SESSION_ID: 'persisted-session',
            },
          }),
      });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
        sessionFilePath: '/tmp/new-session.json',
      });

      await manager.login();

      // 파일 저장 확인
      const fileExists = vol.existsSync('/tmp/new-session.json');
      expect(fileExists).toBe(true);

      const content = vol.readFileSync('/tmp/new-session.json', 'utf-8');
      const savedData = JSON.parse(content as string);
      expect(savedData.sessionId).toBe('persisted-session');
      expect(savedData.zone).toBe('FF');
    });

    it('should throw EcountAuthError on invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Status: 200,
            Data: { ZONE: 'GG' },
          }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      await expect(manager.login()).rejects.toThrow(EcountAuthError);
    });

    it('should throw EcountAuthError on login API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Status: 200,
            Data: { ZONE: 'HH' },
          }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Status: 400,
            Data: {
              Code: '99',
              Message: 'Invalid credentials',
            },
          }),
      });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      await expect(manager.login()).rejects.toThrow(EcountAuthError);
    });
  });

  describe('ensureSession', () => {
    it('should return existing valid session', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { ZONE: 'II' },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { Code: '00', SESSION_ID: 'first-session' },
            }),
        });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      const session1 = await manager.ensureSession();
      const session2 = await manager.ensureSession();

      expect(session1).toBe('first-session');
      expect(session2).toBe('first-session');
      // Zone + Login = 2 호출, 두 번째 ensureSession은 호출 없음
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should re-authenticate when session expired', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { ZONE: 'JJ' },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { Code: '00', SESSION_ID: 'old-session' },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { Code: '00', SESSION_ID: 'new-session' },
            }),
        });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      await manager.ensureSession();

      // 세션 만료 (12시간 + 여유 5분)
      vi.advanceTimersByTime(13 * 60 * 60 * 1000);

      // Rate Limiter도 reset
      resetRateLimiter();

      const newSession = await manager.ensureSession();
      expect(newSession).toBe('new-session');
    });
  });

  describe('clearSession', () => {
    it('should invalidate session', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { ZONE: 'KK' },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { Code: '00', SESSION_ID: 'to-be-cleared' },
            }),
        });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      await manager.login();
      expect(manager.isSessionValid).toBe(true);

      manager.clearSession();
      expect(manager.isSessionValid).toBe(false);
      expect(manager.sessionId).toBeNull();
    });
  });

  describe('isSessionValid', () => {
    it('should return false when no session', () => {
      const manager = new SessionManager({
        credentials: testCredentials,
      });
      expect(manager.isSessionValid).toBe(false);
    });

    it('should return true for valid session', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { ZONE: 'LL' },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { Code: '00', SESSION_ID: 'valid-session' },
            }),
        });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      await manager.login();
      expect(manager.isSessionValid).toBe(true);
    });

    it('should return false when session about to expire (5 min margin)', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { ZONE: 'MM' },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { Code: '00', SESSION_ID: 'soon-expired' },
            }),
        });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      await manager.login();

      // 11시간 55분 진행 (5분 여유 내)
      vi.advanceTimersByTime(11 * 60 * 60 * 1000 + 56 * 60 * 1000);

      expect(manager.isSessionValid).toBe(false);
    });
  });

  describe('getState', () => {
    it('should return current session state', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { ZONE: 'NN' },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { Code: '00', SESSION_ID: 'state-session' },
            }),
        });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      await manager.login();

      const state = manager.getState();
      expect(state.zone).toBe('NN');
      expect(state.sessionId).toBe('state-session');
      expect(state.comCode).toBe('TEST001');
      expect(state.expiresAt).toBeDefined();
    });
  });

  describe('testConnection', () => {
    it('should return success on valid connection', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { ZONE: 'OO' },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { Code: '00', SESSION_ID: 'test-conn-session' },
            }),
        });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      const result = await manager.testConnection();

      expect(result.success).toBe(true);
      expect(result.zone).toBe('OO');
      expect(result.sessionId).toBe('test-conn-session');
    });

    it('should return failure on connection error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      const result = await manager.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('timeout handling', () => {
    it('should throw EcountAuthError on zone fetch timeout', async () => {
      // AbortError 시뮬레이션
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      await expect(manager.initialize()).rejects.toThrow(EcountAuthError);
    });

    it('should throw EcountAuthError on login timeout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Status: 200,
            Data: { ZONE: 'PP' },
          }),
      });

      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      await expect(manager.login()).rejects.toThrow(EcountAuthError);
    });
  });

  describe('various response formats', () => {
    it('should handle Data.ZONE format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Status: 200,
            Data: { ZONE: 'QQ' },
          }),
      });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      await manager.initialize();
      expect(manager.zone).toBe('QQ');
    });

    it('should handle Data.Zone format (lowercase)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            Status: 200,
            Data: { Zone: 'RR' },
          }),
      });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      await manager.initialize();
      expect(manager.zone).toBe('RR');
    });

    it('should handle Data.Datas.SESSION_ID format', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: { ZONE: 'SS' },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              Status: 200,
              Data: {
                Code: '00',
                Datas: { SESSION_ID: 'nested-session' },
              },
            }),
        });

      const manager = new SessionManager({
        credentials: testCredentials,
        useTestServer: true,
      });

      const sessionId = await manager.login();
      expect(sessionId).toBe('nested-session');
    });
  });
});
