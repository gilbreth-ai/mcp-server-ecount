/**
 * Exponential Backoff Retry Utility
 *
 * 일시적 에러(5xx, 타임아웃, 네트워크 에러) 발생 시
 * 지수 백오프를 적용하여 자동 재시도
 */

import { getLogger, type Logger } from './logger.js';

/**
 * 재시도 설정
 */
export interface RetryConfig {
  /** 최대 재시도 횟수 (기본: 3) */
  maxAttempts: number;
  /** 초기 대기 시간 ms (기본: 2000) */
  initialDelayMs: number;
  /** 지수 배수 (기본: 2) */
  multiplier: number;
  /** 최대 대기 시간 ms (기본: 8000) */
  maxDelayMs: number;
  /** Jitter 팩터 0-1 (기본: 0.1 = ±10%) */
  jitterFactor: number;
}

/**
 * 재시도 컨텍스트 (콜백에 전달)
 */
export interface RetryContext {
  /** 현재 시도 횟수 (1부터 시작) */
  attempt: number;
  /** 최대 재시도 횟수 */
  maxAttempts: number;
  /** 다음 재시도까지 대기 시간 ms */
  delayMs: number;
  /** 발생한 에러 */
  error: Error;
}

/**
 * 재시도 여부 판단 함수 타입
 */
export type ShouldRetryFn = (error: unknown, context: RetryContext) => boolean;

/**
 * 재시도 시 호출되는 콜백 타입
 */
export type OnRetryFn = (context: RetryContext) => void;

/**
 * withRetry 옵션
 */
export interface WithRetryOptions {
  /** 재시도 설정 (부분 적용 가능) */
  config?: Partial<RetryConfig>;
  /** 재시도 여부 판단 함수 */
  shouldRetry: ShouldRetryFn;
  /** 재시도 시 호출되는 콜백 (로깅 등) */
  onRetry?: OnRetryFn;
  /** 로거 인스턴스 */
  logger?: Logger;
}

/**
 * 기본 재시도 설정
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 2000,
  multiplier: 2,
  maxDelayMs: 8000,
  jitterFactor: 0.1,
};

/**
 * Jitter를 적용한 대기 시간 계산
 *
 * @param attempt - 현재 시도 횟수 (1부터 시작)
 * @param config - 재시도 설정
 * @returns 대기 시간 (ms)
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  // 지수 백오프: initialDelay * multiplier^(attempt-1)
  const baseDelay = config.initialDelayMs * Math.pow(config.multiplier, attempt - 1);

  // 최대 대기 시간 제한
  const cappedDelay = Math.min(baseDelay, config.maxDelayMs);

  // Jitter 적용 (±jitterFactor)
  // Thundering herd 문제 방지
  const jitterRange = cappedDelay * config.jitterFactor;
  const jitter = (Math.random() * 2 - 1) * jitterRange;

  return Math.round(cappedDelay + jitter);
}

/**
 * 지정된 시간만큼 대기
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 지수 백오프 재시도를 적용하여 함수 실행
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetch('/api/data'),
 *   {
 *     shouldRetry: (error) => isTransientError(error),
 *     onRetry: (ctx) => console.log(`Retry ${ctx.attempt}/${ctx.maxAttempts}`),
 *   }
 * );
 * ```
 *
 * @param fn - 실행할 비동기 함수
 * @param options - 재시도 옵션
 * @returns 함수 실행 결과
 * @throws 모든 재시도 실패 시 마지막 에러
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: WithRetryOptions
): Promise<T> {
  const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...options.config };
  const logger = options.logger ?? getLogger();

  let lastError: Error | undefined;

  // 최초 시도 + maxAttempts 재시도
  const totalAttempts = config.maxAttempts + 1;

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 마지막 시도였으면 에러 던지기
      if (attempt >= totalAttempts) {
        logger.warn('모든 재시도 실패', {
          totalAttempts,
          error: lastError.message,
        });
        throw lastError;
      }

      const delayMs = calculateDelay(attempt, config);
      const context: RetryContext = {
        attempt,
        maxAttempts: config.maxAttempts,
        delayMs,
        error: lastError,
      };

      // 재시도 가능한 에러인지 확인
      if (!options.shouldRetry(error, context)) {
        throw lastError;
      }

      // 재시도 콜백 호출
      if (options.onRetry) {
        options.onRetry(context);
      }

      logger.info('일시적 에러 발생, 재시도 예정', {
        attempt,
        maxAttempts: config.maxAttempts,
        delayMs,
        errorMessage: lastError.message,
      });

      await sleep(delayMs);
    }
  }

  // 여기 도달하면 안 되지만, TypeScript 만족용
  throw lastError ?? new Error('Unknown retry error');
}

/**
 * 기본 설정을 오버라이드하여 새 설정 생성
 */
export function createRetryConfig(overrides?: Partial<RetryConfig>): RetryConfig {
  return { ...DEFAULT_RETRY_CONFIG, ...overrides };
}
