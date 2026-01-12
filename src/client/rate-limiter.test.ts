import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { vol } from 'memfs';
import { RateLimiter, getRateLimiter, resetRateLimiter } from './rate-limiter.js';
import { EcountRateLimitError } from '../utils/errors.js';

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

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vol.reset();
    resetRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should use production limits by default', () => {
      const limiter = new RateLimiter();
      const status = limiter.getStatus();
      // 프로덕션: query_products는 자동대기 불가
      expect(status.query_products.autoWait).toBe(false);
    });

    it('should use test limits when useTestServer is true', () => {
      const limiter = new RateLimiter({ useTestServer: true });
      const status = limiter.getStatus();
      // 테스트: query_products도 자동대기 가능
      expect(status.query_products.autoWait).toBe(true);
    });
  });

  describe('canCall', () => {
    it('should allow first call for any type', () => {
      const limiter = new RateLimiter();
      expect(limiter.canCall('query_single_product')).toBe(true);
      expect(limiter.canCall('save_product')).toBe(true);
      expect(limiter.canCall('query_products')).toBe(true);
    });

    it('should block call within interval', async () => {
      const limiter = new RateLimiter();
      await limiter.recordCall('query_single_product');
      expect(limiter.canCall('query_single_product')).toBe(false);
    });

    it('should allow call after interval passes', async () => {
      const limiter = new RateLimiter();
      await limiter.recordCall('query_single_product');

      // 1초 + 안전마진(100ms) = 1100ms 후
      vi.advanceTimersByTime(1200);

      expect(limiter.canCall('query_single_product')).toBe(true);
    });

    it('should track different types independently', async () => {
      const limiter = new RateLimiter();
      await limiter.recordCall('query_single_product');
      await limiter.recordCall('save_product');

      expect(limiter.canCall('query_single_product')).toBe(false);
      expect(limiter.canCall('save_product')).toBe(false);
      expect(limiter.canCall('save_customer')).toBe(true); // 다른 타입

      // 1.2초 후: query_single_product만 가능
      vi.advanceTimersByTime(1200);
      expect(limiter.canCall('query_single_product')).toBe(true);
      expect(limiter.canCall('save_product')).toBe(false); // 10초 필요
    });
  });

  describe('getWaitTime', () => {
    it('should return 0 for first call', () => {
      const limiter = new RateLimiter();
      expect(limiter.getWaitTime('save_product')).toBe(0);
    });

    it('should return remaining time after call', async () => {
      const limiter = new RateLimiter();
      await limiter.recordCall('save_product');

      // 2초 대기
      vi.advanceTimersByTime(2000);

      const waitTime = limiter.getWaitTime('save_product');
      // 10초 + 100ms 안전마진 - 2초 = 약 8100ms
      expect(waitTime).toBeGreaterThan(8000);
      expect(waitTime).toBeLessThanOrEqual(8200);
    });

    it('should return 0 after interval passes', async () => {
      const limiter = new RateLimiter();
      await limiter.recordCall('query_single_product');

      vi.advanceTimersByTime(1200);

      expect(limiter.getWaitTime('query_single_product')).toBe(0);
    });
  });

  describe('checkLimit', () => {
    it('should not throw when call is allowed', () => {
      const limiter = new RateLimiter();
      expect(() => limiter.checkLimit('save_product')).not.toThrow();
    });

    it('should throw EcountRateLimitError when rate limited', async () => {
      const limiter = new RateLimiter();
      await limiter.recordCall('save_product');

      expect(() => limiter.checkLimit('save_product')).toThrow(EcountRateLimitError);
    });

    it('should include wait time in error', async () => {
      const limiter = new RateLimiter();
      await limiter.recordCall('save_product');

      try {
        limiter.checkLimit('save_product');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(EcountRateLimitError);
        const rateLimitError = error as EcountRateLimitError;
        expect(rateLimitError.retryAfterMs).toBeGreaterThan(0);
        expect(rateLimitError.apiType).toBe('save_product');
      }
    });
  });

  describe('execute', () => {
    it('should execute function immediately when no rate limit', async () => {
      const limiter = new RateLimiter();
      const fn = vi.fn().mockResolvedValue('result');

      const result = await limiter.execute('query_single_product', fn);

      expect(result).toBe('result');
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should auto-wait for short intervals', async () => {
      const limiter = new RateLimiter();
      await limiter.recordCall('query_single_product');

      const fn = vi.fn().mockResolvedValue('result');
      const onWaiting = vi.fn();

      // 비동기 실행 시작
      const executePromise = limiter.execute('query_single_product', fn, onWaiting);

      // 시간 진행
      await vi.advanceTimersByTimeAsync(1200);

      const result = await executePromise;

      expect(result).toBe('result');
      expect(onWaiting).toHaveBeenCalled();
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should throw for long intervals without auto-wait (production)', async () => {
      const limiter = new RateLimiter({ useTestServer: false });
      await limiter.recordCall('query_products'); // 10분 간격, 자동대기 불가

      const fn = vi.fn().mockResolvedValue('result');

      await expect(limiter.execute('query_products', fn)).rejects.toThrow(EcountRateLimitError);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should call onWaiting with correct parameters', async () => {
      const limiter = new RateLimiter();
      await limiter.recordCall('save_product');

      const fn = vi.fn().mockResolvedValue('result');
      const onWaiting = vi.fn();

      const executePromise = limiter.execute('save_product', fn, onWaiting);

      await vi.advanceTimersByTimeAsync(11000);

      await executePromise;

      expect(onWaiting).toHaveBeenCalledWith(expect.any(Number), expect.stringContaining('품목 등록'));
    });

    it('should record call after successful execution', async () => {
      const limiter = new RateLimiter();
      const fn = vi.fn().mockResolvedValue('result');

      expect(limiter.canCall('save_product')).toBe(true);
      await limiter.execute('save_product', fn);
      expect(limiter.canCall('save_product')).toBe(false);
    });
  });

  describe('test server mode', () => {
    it('should use shorter intervals in test mode', async () => {
      const limiter = new RateLimiter({ useTestServer: true });
      await limiter.recordCall('query_products');

      // 테스트 모드: 10분 → 10초
      expect(limiter.canCall('query_products')).toBe(false);

      vi.advanceTimersByTime(10200);

      expect(limiter.canCall('query_products')).toBe(true);
    });

    it('should allow auto-wait for all types in test mode', async () => {
      const limiter = new RateLimiter({ useTestServer: true });
      await limiter.recordCall('query_products');

      const fn = vi.fn().mockResolvedValue('result');

      const executePromise = limiter.execute('query_products', fn);

      await vi.advanceTimersByTimeAsync(15000);

      const result = await executePromise;

      expect(result).toBe('result');
      expect(fn).toHaveBeenCalledOnce();
    });
  });

  describe('file-based state', () => {
    it('should save state to file after recordCall', async () => {
      const stateFilePath = '/tmp/rate-limit-state.json';
      vol.mkdirSync('/tmp', { recursive: true });

      const limiter = new RateLimiter({ stateFilePath });
      await limiter.recordCall('save_product');

      // 파일 저장은 비동기로 실행됨
      await vi.advanceTimersByTimeAsync(100);

      const fileExists = vol.existsSync(stateFilePath);
      expect(fileExists).toBe(true);

      const content = vol.readFileSync(stateFilePath, 'utf-8');
      const data = JSON.parse(content as string);
      expect(data.lastCallTimes).toHaveProperty('save_product');
    });

    it('should load state from file on execute', async () => {
      const stateFilePath = '/tmp/rate-limit-state.json';
      vol.mkdirSync('/tmp', { recursive: true });

      // 먼저 상태 저장
      const now = Date.now();
      const initialData = {
        lastCallTimes: { save_product: now },
        updatedAt: now,
      };
      vol.writeFileSync(stateFilePath, JSON.stringify(initialData));

      // 새 인스턴스 생성
      const limiter = new RateLimiter({ stateFilePath });

      const fn = vi.fn().mockResolvedValue('result');
      const onWaiting = vi.fn();

      // execute가 파일에서 상태를 로드함
      const executePromise = limiter.execute('save_product', fn, onWaiting);

      await vi.advanceTimersByTimeAsync(11000);

      await executePromise;

      // onWaiting이 호출되었다면 대기가 발생한 것
      expect(onWaiting).toHaveBeenCalled();
    });

    it('should handle missing state file gracefully', async () => {
      const stateFilePath = '/tmp/nonexistent/rate-limit-state.json';

      const limiter = new RateLimiter({ stateFilePath });
      const fn = vi.fn().mockResolvedValue('result');

      // 파일이 없어도 에러 없이 실행
      const result = await limiter.execute('save_product', fn);
      expect(result).toBe('result');
    });
  });

  describe('reset', () => {
    it('should clear specific type', async () => {
      const limiter = new RateLimiter();
      await limiter.recordCall('save_product');
      await limiter.recordCall('save_customer');

      await limiter.reset('save_product');

      expect(limiter.canCall('save_product')).toBe(true);
      expect(limiter.canCall('save_customer')).toBe(false);
    });

    it('should clear all types when no argument', async () => {
      const limiter = new RateLimiter();
      await limiter.recordCall('save_product');
      await limiter.recordCall('save_customer');
      await limiter.recordCall('query_single_product');

      await limiter.reset();

      expect(limiter.canCall('save_product')).toBe(true);
      expect(limiter.canCall('save_customer')).toBe(true);
      expect(limiter.canCall('query_single_product')).toBe(true);
    });
  });

  describe('getStatus', () => {
    it('should return status for all API types', async () => {
      const limiter = new RateLimiter();
      await limiter.recordCall('save_product');

      const status = limiter.getStatus();

      expect(status.save_product.canCall).toBe(false);
      expect(status.save_product.waitTimeMs).toBeGreaterThan(0);
      expect(status.save_product.autoWait).toBe(true);

      expect(status.query_products.canCall).toBe(true);
      expect(status.query_products.waitTimeMs).toBe(0);
      expect(status.query_products.autoWait).toBe(false); // 프로덕션
    });

    it('should include all defined rate limit types', () => {
      const limiter = new RateLimiter();
      const status = limiter.getStatus();

      // 주요 타입들 확인
      expect(status).toHaveProperty('zone');
      expect(status).toHaveProperty('login');
      expect(status).toHaveProperty('query_products');
      expect(status).toHaveProperty('query_single_product');
      expect(status).toHaveProperty('save_product');
      expect(status).toHaveProperty('save_customer');
    });
  });

  describe('singleton', () => {
    it('should return same instance from getRateLimiter', () => {
      const limiter1 = getRateLimiter();
      const limiter2 = getRateLimiter();
      expect(limiter1).toBe(limiter2);
    });

    it('should create new instance after resetRateLimiter', () => {
      const limiter1 = getRateLimiter();
      resetRateLimiter();
      const limiter2 = getRateLimiter();
      expect(limiter2).not.toBe(limiter1);
    });

    it('should recreate instance when options change', () => {
      const limiter1 = getRateLimiter({ useTestServer: false });
      const limiter2 = getRateLimiter({ useTestServer: true });
      expect(limiter2).not.toBe(limiter1);
    });

    it('should return same instance for same options', () => {
      const limiter1 = getRateLimiter({ useTestServer: true });
      const limiter2 = getRateLimiter({ useTestServer: true });
      expect(limiter1).toBe(limiter2);
    });
  });

  describe('interval timing', () => {
    it('should use correct intervals for different API types', async () => {
      const limiter = new RateLimiter();

      // 단건 조회: 1초 + 100ms
      await limiter.recordCall('query_single_product');
      vi.advanceTimersByTime(1000);
      expect(limiter.canCall('query_single_product')).toBe(false);
      vi.advanceTimersByTime(200);
      expect(limiter.canCall('query_single_product')).toBe(true);
    });

    it('should respect save API 10 second interval', async () => {
      const limiter = new RateLimiter();

      await limiter.recordCall('save_product');
      vi.advanceTimersByTime(10000);
      expect(limiter.canCall('save_product')).toBe(false);
      vi.advanceTimersByTime(200);
      expect(limiter.canCall('save_product')).toBe(true);
    });
  });
});
