/**
 * ECOUNT API Rate Limiter
 *
 * 이카운트 OpenAPI의 엄격한 Rate Limit을 관리
 *
 * Rate Limit 정책:
 * - Zone/로그인: 10분에 1회
 * - 조회 API (다건): 10분에 1회
 * - 조회 API (단건): 1초에 1회
 * - 저장 API: 10초에 1회
 */

import { EcountRateLimitError } from '../utils/errors.js';
import { getLogger } from '../utils/logger.js';

/**
 * API 타입별 Rate Limit 설정
 */
export type RateLimitType = 'zone' | 'login' | 'query' | 'query_single' | 'save';

interface RateLimitConfig {
  /** 호출 간격 (밀리초) */
  intervalMs: number;
  /** 설명 */
  description: string;
}

const RATE_LIMITS: Record<RateLimitType, RateLimitConfig> = {
  zone: {
    intervalMs: 10 * 60 * 1000, // 10분
    description: 'Zone 조회',
  },
  login: {
    intervalMs: 10 * 60 * 1000, // 10분
    description: '로그인',
  },
  query: {
    intervalMs: 10 * 60 * 1000, // 10분
    description: '다건 조회',
  },
  query_single: {
    intervalMs: 1000, // 1초
    description: '단건 조회',
  },
  save: {
    intervalMs: 10 * 1000, // 10초
    description: '저장',
  },
};

/**
 * 테스트 서버용 Rate Limit (더 관대함)
 */
const TEST_RATE_LIMITS: Record<RateLimitType, RateLimitConfig> = {
  zone: {
    intervalMs: 10 * 1000, // 10초
    description: 'Zone 조회 (테스트)',
  },
  login: {
    intervalMs: 10 * 1000, // 10초
    description: '로그인 (테스트)',
  },
  query: {
    intervalMs: 10 * 1000, // 10초
    description: '다건 조회 (테스트)',
  },
  query_single: {
    intervalMs: 1000, // 1초
    description: '단건 조회 (테스트)',
  },
  save: {
    intervalMs: 10 * 1000, // 10초
    description: '저장 (테스트)',
  },
};

/**
 * Rate Limiter 클래스
 *
 * 각 API 타입별로 마지막 호출 시간을 추적하고
 * Rate Limit 초과 시 에러를 던짐
 */
export class RateLimiter {
  private lastCallTimes: Map<RateLimitType, number> = new Map();
  private limits: Record<RateLimitType, RateLimitConfig>;
  private logger = getLogger();

  constructor(options: { useTestServer?: boolean } = {}) {
    this.limits = options.useTestServer ? TEST_RATE_LIMITS : RATE_LIMITS;
    this.logger.debug('RateLimiter initialized', {
      useTestServer: options.useTestServer ?? false,
    });
  }

  /**
   * API 호출이 가능한지 확인
   * @returns true면 호출 가능, false면 대기 필요
   */
  canCall(type: RateLimitType): boolean {
    const lastCall = this.lastCallTimes.get(type);
    if (!lastCall) return true;

    const elapsed = Date.now() - lastCall;
    return elapsed >= this.limits[type].intervalMs;
  }

  /**
   * 다음 호출까지 대기해야 하는 시간 (밀리초)
   */
  getWaitTime(type: RateLimitType): number {
    const lastCall = this.lastCallTimes.get(type);
    if (!lastCall) return 0;

    const elapsed = Date.now() - lastCall;
    const remaining = this.limits[type].intervalMs - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * API 호출 전 Rate Limit 체크
   * Rate Limit 초과 시 에러를 던짐
   */
  checkLimit(type: RateLimitType): void {
    if (!this.canCall(type)) {
      const waitTime = this.getWaitTime(type);
      this.logger.warn('Rate limit exceeded', {
        type,
        description: this.limits[type].description,
        waitTimeMs: waitTime,
      });
      throw EcountRateLimitError.forApiType(type, waitTime);
    }
  }

  /**
   * API 호출 성공 후 마지막 호출 시간 기록
   */
  recordCall(type: RateLimitType): void {
    this.lastCallTimes.set(type, Date.now());
    this.logger.debug('API call recorded', { type });
  }

  /**
   * Rate Limit을 확인하고 호출을 기록하는 래퍼
   * @param type API 타입
   * @param fn 실행할 함수
   */
  async execute<T>(type: RateLimitType, fn: () => Promise<T>): Promise<T> {
    this.checkLimit(type);
    const result = await fn();
    this.recordCall(type);
    return result;
  }

  /**
   * 특정 타입의 Rate Limit 상태 초기화
   * (테스트나 세션 재설정 시 사용)
   */
  reset(type?: RateLimitType): void {
    if (type) {
      this.lastCallTimes.delete(type);
    } else {
      this.lastCallTimes.clear();
    }
    this.logger.debug('Rate limit reset', { type: type ?? 'all' });
  }

  /**
   * 현재 Rate Limit 상태 조회
   */
  getStatus(): Record<RateLimitType, { canCall: boolean; waitTimeMs: number }> {
    const status: Record<string, { canCall: boolean; waitTimeMs: number }> = {};
    for (const type of Object.keys(this.limits) as RateLimitType[]) {
      status[type] = {
        canCall: this.canCall(type),
        waitTimeMs: this.getWaitTime(type),
      };
    }
    return status as Record<RateLimitType, { canCall: boolean; waitTimeMs: number }>;
  }
}

/**
 * 기본 Rate Limiter 인스턴스
 */
let defaultRateLimiter: RateLimiter | null = null;
let defaultRateLimiterTestMode: boolean | undefined;

export function getRateLimiter(options?: { useTestServer?: boolean }): RateLimiter {
  const useTestServer = options?.useTestServer;

  // 옵션이 변경되면 인스턴스 재생성
  if (defaultRateLimiter && defaultRateLimiterTestMode !== useTestServer) {
    defaultRateLimiter = null;
  }

  if (!defaultRateLimiter) {
    defaultRateLimiter = new RateLimiter(options);
    defaultRateLimiterTestMode = useTestServer;
  }
  return defaultRateLimiter;
}

export function resetRateLimiter(): void {
  defaultRateLimiter = null;
  defaultRateLimiterTestMode = undefined;
}
