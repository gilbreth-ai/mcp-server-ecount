import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { withRetry, createRetryConfig, DEFAULT_RETRY_CONFIG } from './retry.js';

// Logger 모킹
vi.mock('./logger.js', () => ({
  getLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('successful execution', () => {
    it('should return result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn, {
        shouldRetry: () => true,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should not call onRetry when no retry needed', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const onRetry = vi.fn();

      await withRetry(fn, {
        shouldRetry: () => true,
        onRetry,
      });

      expect(onRetry).not.toHaveBeenCalled();
    });
  });

  describe('retry behavior', () => {
    it('should retry on failure and succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const onRetry = vi.fn();

      const promise = withRetry(fn, {
        config: { jitterFactor: 0 }, // 테스트 예측성을 위해 jitter 제거
        shouldRetry: () => true,
        onRetry,
      });

      // 첫 번째 재시도 대기
      await vi.advanceTimersByTimeAsync(2000);
      // 두 번째 재시도 대기
      await vi.advanceTimersByTimeAsync(4000);

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it('should pass correct context to onRetry', async () => {
      const fn = vi.fn().mockRejectedValueOnce(new Error('test error')).mockResolvedValue('success');

      const contexts: Array<{ attempt: number; maxAttempts: number; delayMs: number }> = [];
      const onRetry = vi.fn((ctx) => {
        contexts.push({
          attempt: ctx.attempt,
          maxAttempts: ctx.maxAttempts,
          delayMs: ctx.delayMs,
        });
      });

      const promise = withRetry(fn, {
        config: { maxAttempts: 3, jitterFactor: 0 },
        shouldRetry: () => true,
        onRetry,
      });

      await vi.advanceTimersByTimeAsync(2000);
      await promise;

      expect(contexts[0].attempt).toBe(1);
      expect(contexts[0].maxAttempts).toBe(3);
      expect(contexts[0].delayMs).toBe(2000);
    });
  });

  describe('exhausted attempts', () => {
    it('should throw after max attempts exhausted', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));

      const promise = withRetry(fn, {
        config: { maxAttempts: 2, jitterFactor: 0 },
        shouldRetry: () => true,
      });

      // catch를 먼저 연결하고 타이머 진행
      const resultPromise = promise.catch((e) => e);

      // 첫 번째 재시도 대기
      await vi.advanceTimersByTimeAsync(2000);
      // 두 번째 재시도 대기
      await vi.advanceTimersByTimeAsync(4000);

      const error = await resultPromise;
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('always fails');
      // 1 초기 시도 + 2 재시도 = 3번
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw last error after exhaustion', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('error 1'))
        .mockRejectedValueOnce(new Error('error 2'))
        .mockRejectedValue(new Error('error 3'));

      const promise = withRetry(fn, {
        config: { maxAttempts: 2, jitterFactor: 0 },
        shouldRetry: () => true,
      });

      // catch를 먼저 연결하고 타이머 진행
      const resultPromise = promise.catch((e) => e);

      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      const error = await resultPromise;
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('error 3');
    });
  });

  describe('shouldRetry behavior', () => {
    it('should not retry when shouldRetry returns false', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('non-retryable'));

      await expect(
        withRetry(fn, {
          shouldRetry: () => false,
        })
      ).rejects.toThrow('non-retryable');

      expect(fn).toHaveBeenCalledOnce();
    });

    it('should call shouldRetry with error and context', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('test error'));
      const shouldRetry = vi.fn().mockReturnValue(false);

      await expect(
        withRetry(fn, {
          shouldRetry,
        })
      ).rejects.toThrow('test error');

      expect(shouldRetry).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          attempt: 1,
          maxAttempts: 3,
          delayMs: expect.any(Number),
          error: expect.any(Error),
        })
      );
    });

    it('should stop retrying when shouldRetry changes to false', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('error'));
      let retryCount = 0;
      const shouldRetry = vi.fn(() => {
        retryCount++;
        return retryCount < 2; // 첫 번째 재시도만 허용
      });

      const promise = withRetry(fn, {
        config: { maxAttempts: 5, jitterFactor: 0 },
        shouldRetry,
      });

      // catch를 먼저 연결하고 타이머 진행
      const resultPromise = promise.catch((e) => e);

      await vi.advanceTimersByTimeAsync(2000);

      const error = await resultPromise;
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('error');
      expect(fn).toHaveBeenCalledTimes(2); // 초기 + 1 재시도
    });
  });

  describe('exponential backoff', () => {
    it('should use exponential backoff delays', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const delays: number[] = [];
      const onRetry = vi.fn((ctx) => delays.push(ctx.delayMs));

      const promise = withRetry(fn, {
        config: {
          initialDelayMs: 1000,
          multiplier: 2,
          maxDelayMs: 10000,
          jitterFactor: 0,
          maxAttempts: 3,
        },
        shouldRetry: () => true,
        onRetry,
      });

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      await promise;

      expect(delays[0]).toBe(1000); // 1000 * 2^0
      expect(delays[1]).toBe(2000); // 1000 * 2^1
      expect(delays[2]).toBe(4000); // 1000 * 2^2
    });

    it('should cap delay at maxDelayMs', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const delays: number[] = [];
      const onRetry = vi.fn((ctx) => delays.push(ctx.delayMs));

      const promise = withRetry(fn, {
        config: {
          initialDelayMs: 5000,
          multiplier: 2,
          maxDelayMs: 8000,
          jitterFactor: 0,
          maxAttempts: 3,
        },
        shouldRetry: () => true,
        onRetry,
      });

      await vi.advanceTimersByTimeAsync(5000);
      await vi.advanceTimersByTimeAsync(8000);
      await vi.advanceTimersByTimeAsync(8000);

      await promise;

      expect(delays[0]).toBe(5000);
      expect(delays[1]).toBe(8000); // capped
      expect(delays[2]).toBe(8000); // capped
    });
  });

  describe('jitter', () => {
    it('should apply jitter within expected range', async () => {
      const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('success');

      const delays: number[] = [];
      const onRetry = vi.fn((ctx) => delays.push(ctx.delayMs));

      // 여러 번 실행하여 jitter 범위 확인
      for (let i = 0; i < 10; i++) {
        fn.mockReset();
        fn.mockRejectedValueOnce(new Error('fail')).mockResolvedValue('success');

        const promise = withRetry(fn, {
          config: {
            initialDelayMs: 1000,
            multiplier: 2,
            maxDelayMs: 10000,
            jitterFactor: 0.1, // ±10%
            maxAttempts: 1,
          },
          shouldRetry: () => true,
          onRetry,
        });

        await vi.advanceTimersByTimeAsync(1200); // 최대 jitter 포함
        await promise;
      }

      // 모든 딜레이가 ±10% 범위 내
      delays.forEach((delay) => {
        expect(delay).toBeGreaterThanOrEqual(900); // 1000 - 10%
        expect(delay).toBeLessThanOrEqual(1100); // 1000 + 10%
      });
    });
  });

  describe('error handling', () => {
    it('should convert non-Error to Error', async () => {
      const fn = vi.fn().mockRejectedValue('string error');

      await expect(
        withRetry(fn, {
          shouldRetry: () => false,
        })
      ).rejects.toThrow('string error');
    });

    it('should preserve original error type on throw', async () => {
      class CustomError extends Error {
        constructor(
          message: string,
          public code: string
        ) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const fn = vi.fn().mockRejectedValue(new CustomError('custom', 'CODE'));

      try {
        await withRetry(fn, {
          shouldRetry: () => false,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
        expect((error as CustomError).code).toBe('CODE');
      }
    });
  });
});

describe('createRetryConfig', () => {
  it('should return default config when no overrides', () => {
    const config = createRetryConfig();
    expect(config).toEqual(DEFAULT_RETRY_CONFIG);
  });

  it('should allow partial overrides', () => {
    const config = createRetryConfig({
      maxAttempts: 5,
      initialDelayMs: 1000,
    });

    expect(config.maxAttempts).toBe(5);
    expect(config.initialDelayMs).toBe(1000);
    expect(config.multiplier).toBe(DEFAULT_RETRY_CONFIG.multiplier);
    expect(config.maxDelayMs).toBe(DEFAULT_RETRY_CONFIG.maxDelayMs);
    expect(config.jitterFactor).toBe(DEFAULT_RETRY_CONFIG.jitterFactor);
  });

  it('should override all values', () => {
    const config = createRetryConfig({
      maxAttempts: 5,
      initialDelayMs: 500,
      multiplier: 3,
      maxDelayMs: 30000,
      jitterFactor: 0.2,
    });

    expect(config.maxAttempts).toBe(5);
    expect(config.initialDelayMs).toBe(500);
    expect(config.multiplier).toBe(3);
    expect(config.maxDelayMs).toBe(30000);
    expect(config.jitterFactor).toBe(0.2);
  });
});

describe('DEFAULT_RETRY_CONFIG', () => {
  it('should have expected default values', () => {
    expect(DEFAULT_RETRY_CONFIG.maxAttempts).toBe(3);
    expect(DEFAULT_RETRY_CONFIG.initialDelayMs).toBe(2000);
    expect(DEFAULT_RETRY_CONFIG.multiplier).toBe(2);
    expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(8000);
    expect(DEFAULT_RETRY_CONFIG.jitterFactor).toBe(0.1);
  });
});
