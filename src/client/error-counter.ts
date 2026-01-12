/**
 * ECOUNT API Error Counter
 *
 * 연속 오류 한도 관리 (시간당 30건 제한)
 * 25건에 도달하면 경고, 이후 API 호출 차단
 */

import { EcountErrorLimitError } from '../utils/errors.js';
import { getLogger } from '../utils/logger.js';

/**
 * 오류 카운터 설정
 */
interface ErrorCounterOptions {
  /** 최대 허용 오류 수 (기본: 30) */
  maxErrors?: number;
  /** 경고 임계값 (기본: 25) */
  warningThreshold?: number;
  /** 카운터 리셋 간격 (밀리초, 기본: 1시간) */
  resetIntervalMs?: number;
}

/**
 * 연속 오류 카운터
 *
 * 이카운트 API는 시간당 연속 오류 30건 시 차단됨
 * 이를 방지하기 위해 오류를 추적하고 한도에 근접하면 경고
 */
export class ErrorCounter {
  private errorCount: number = 0;
  private lastResetTime: number = Date.now();
  private readonly maxErrors: number;
  private readonly warningThreshold: number;
  private readonly resetIntervalMs: number;
  private logger = getLogger();

  constructor(options: ErrorCounterOptions = {}) {
    this.maxErrors = options.maxErrors ?? 30;
    this.warningThreshold = options.warningThreshold ?? 25;
    this.resetIntervalMs = options.resetIntervalMs ?? 60 * 60 * 1000; // 1시간
  }

  /**
   * 시간 기반 자동 리셋 확인
   */
  private checkAutoReset(): void {
    const now = Date.now();
    if (now - this.lastResetTime >= this.resetIntervalMs) {
      this.logger.debug('Error counter auto-reset', {
        previousCount: this.errorCount,
      });
      this.errorCount = 0;
      this.lastResetTime = now;
    }
  }

  /**
   * 오류 기록
   * @throws {EcountErrorLimitError} 오류 한도에 근접하면 예외 발생
   */
  recordError(): void {
    this.checkAutoReset();
    this.errorCount++;

    // 일반 에러는 debug 레벨로 (로그 spam 방지)
    this.logger.debug('API error recorded', {
      errorCount: this.errorCount,
      maxErrors: this.maxErrors,
    });

    // 경고 임계값의 80%에 도달하면 warn
    const warnAt = Math.floor(this.warningThreshold * 0.8);
    if (this.errorCount === warnAt) {
      this.logger.warn('Approaching error limit', {
        errorCount: this.errorCount,
        warningAt: this.warningThreshold,
        maxErrors: this.maxErrors,
      });
    }

    // 경고 임계값 도달
    if (this.errorCount >= this.warningThreshold) {
      this.logger.error('Error threshold reached', {
        errorCount: this.errorCount,
        threshold: this.warningThreshold,
        maxErrors: this.maxErrors,
      });

      throw new EcountErrorLimitError(this.errorCount);
    }
  }

  /**
   * 성공 시 카운터 리셋
   */
  recordSuccess(): void {
    if (this.errorCount > 0) {
      this.logger.debug('Error counter reset on success', {
        previousCount: this.errorCount,
      });
      this.errorCount = 0;
    }
  }

  /**
   * 현재 오류 수 조회
   */
  getCount(): number {
    this.checkAutoReset();
    return this.errorCount;
  }

  /**
   * 추가 호출 가능 여부 확인
   */
  canProceed(): boolean {
    this.checkAutoReset();
    return this.errorCount < this.warningThreshold;
  }

  /**
   * 카운터 상태 조회
   */
  getStatus(): {
    errorCount: number;
    maxErrors: number;
    warningThreshold: number;
    canProceed: boolean;
    nextResetAt: Date;
  } {
    this.checkAutoReset();
    return {
      errorCount: this.errorCount,
      maxErrors: this.maxErrors,
      warningThreshold: this.warningThreshold,
      canProceed: this.canProceed(),
      nextResetAt: new Date(this.lastResetTime + this.resetIntervalMs),
    };
  }

  /**
   * 수동 리셋
   */
  reset(): void {
    this.errorCount = 0;
    this.lastResetTime = Date.now();
    this.logger.debug('Error counter manually reset');
  }
}

// 기본 인스턴스
let defaultErrorCounter: ErrorCounter | null = null;

export function getErrorCounter(): ErrorCounter {
  if (!defaultErrorCounter) {
    defaultErrorCounter = new ErrorCounter();
  }
  return defaultErrorCounter;
}

export function resetErrorCounter(): void {
  if (defaultErrorCounter) {
    defaultErrorCounter.reset();
  }
  defaultErrorCounter = null;
}
