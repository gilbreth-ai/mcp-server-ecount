/**
 * ECOUNT API Rate Limiter
 *
 * 이카운트 OpenAPI의 엄격한 Rate Limit을 관리
 *
 * 특징:
 * - API별 독립적인 Rate Limit (각 API가 자체 타이머 보유)
 * - 파일 기반 상태 저장 (멀티 프로세스 지원)
 * - 자동 대기 큐 (짧은 간격용)
 * - 안전 마진 적용 (100ms)
 *
 * Rate Limit 정책 (API별 독립):
 * - Zone/로그인: 10분에 1회
 * - 다건 조회 API (각각): 10분에 1회
 * - 단건 조회 API (각각): 1초에 1회
 * - 저장 API (각각): 10초에 1회
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { EcountRateLimitError } from '../utils/errors.js';
import { getLogger } from '../utils/logger.js';

/**
 * API별 Rate Limit 타입
 *
 * 각 API가 독립적인 Rate Limit을 가짐
 */
export type RateLimitType =
  // 인증 (10분)
  | 'zone'
  | 'login'
  // 다건 조회 (10분) - 각각 독립
  | 'query_products'
  | 'query_inventory'
  | 'query_inventory_warehouse'
  | 'query_purchase_orders'
  // 단건 조회 (1초) - 각각 독립
  | 'query_single_product'
  | 'query_single_inventory'
  | 'query_single_inventory_warehouse'
  // 저장 (10초) - 각각 독립
  | 'save_customer'
  | 'save_product'
  | 'save_quotation'
  | 'save_sale_order'
  | 'save_sale'
  | 'save_purchase'
  | 'save_job_order'
  | 'save_goods_issued'
  | 'save_goods_receipt'
  | 'save_invoice'
  | 'save_openmarket_order'
  | 'save_clock_in_out'
  | 'save_board_post';

interface RateLimitConfig {
  /** 호출 간격 (밀리초) */
  intervalMs: number;
  /** 설명 */
  description: string;
  /** 자동 대기 허용 여부 */
  autoWait: boolean;
  /** 최대 자동 대기 시간 (밀리초) */
  maxAutoWaitMs: number;
}

// 안전 마진: 100ms 추가 (네트워크 지연 대비)
const SAFETY_MARGIN_MS = 100;

// 간격 상수
const INTERVAL_10MIN = 10 * 60 * 1000 + SAFETY_MARGIN_MS;
const INTERVAL_10SEC = 10 * 1000 + SAFETY_MARGIN_MS;
const INTERVAL_1SEC = 1000 + SAFETY_MARGIN_MS;

// 테스트 서버 간격
const TEST_INTERVAL_10MIN = 10 * 1000 + SAFETY_MARGIN_MS; // 10분 → 10초
const TEST_INTERVAL_10SEC = 10 * 1000 + SAFETY_MARGIN_MS;
const TEST_INTERVAL_1SEC = 1000 + SAFETY_MARGIN_MS;

/**
 * Rate Limit 설정 생성 헬퍼
 */
function createConfig(
  intervalMs: number,
  description: string,
  autoWait: boolean,
  maxAutoWaitMs: number
): RateLimitConfig {
  return { intervalMs, description, autoWait, maxAutoWaitMs };
}

const RATE_LIMITS: Record<RateLimitType, RateLimitConfig> = {
  // 인증 (10분, 자동대기 불가)
  zone: createConfig(INTERVAL_10MIN, 'Zone 조회', false, 0),
  login: createConfig(INTERVAL_10MIN, '로그인', false, 0),

  // 다건 조회 (10분, 자동대기 불가)
  query_products: createConfig(INTERVAL_10MIN, '품목 다건 조회', false, 0),
  query_inventory: createConfig(INTERVAL_10MIN, '재고 다건 조회', false, 0),
  query_inventory_warehouse: createConfig(INTERVAL_10MIN, '창고별 재고 다건 조회', false, 0),
  query_purchase_orders: createConfig(INTERVAL_10MIN, '발주서 조회', false, 0),

  // 단건 조회 (1초, 자동대기 가능)
  query_single_product: createConfig(INTERVAL_1SEC, '품목 단건 조회', true, 5000),
  query_single_inventory: createConfig(INTERVAL_1SEC, '재고 단건 조회', true, 5000),
  query_single_inventory_warehouse: createConfig(INTERVAL_1SEC, '창고별 재고 단건 조회', true, 5000),

  // 저장 (10초, 자동대기 가능)
  save_customer: createConfig(INTERVAL_10SEC, '거래처 등록', true, 15000),
  save_product: createConfig(INTERVAL_10SEC, '품목 등록', true, 15000),
  save_quotation: createConfig(INTERVAL_10SEC, '견적서 입력', true, 15000),
  save_sale_order: createConfig(INTERVAL_10SEC, '주문서 입력', true, 15000),
  save_sale: createConfig(INTERVAL_10SEC, '판매 입력', true, 15000),
  save_purchase: createConfig(INTERVAL_10SEC, '구매 입력', true, 15000),
  save_job_order: createConfig(INTERVAL_10SEC, '작업지시서 입력', true, 15000),
  save_goods_issued: createConfig(INTERVAL_10SEC, '생산불출 입력', true, 15000),
  save_goods_receipt: createConfig(INTERVAL_10SEC, '생산입고 입력', true, 15000),
  save_invoice: createConfig(INTERVAL_10SEC, '전표 입력', true, 15000),
  save_openmarket_order: createConfig(INTERVAL_10SEC, '쇼핑몰 주문 입력', true, 15000),
  save_clock_in_out: createConfig(INTERVAL_10SEC, '출퇴근 기록', true, 15000),
  save_board_post: createConfig(INTERVAL_10SEC, '게시글 입력', true, 15000),
};

/**
 * 테스트 서버용 Rate Limit (더 관대함)
 */
const TEST_RATE_LIMITS: Record<RateLimitType, RateLimitConfig> = {
  // 인증 (10초, 자동대기 가능)
  zone: createConfig(TEST_INTERVAL_10MIN, 'Zone 조회 (테스트)', true, 15000),
  login: createConfig(TEST_INTERVAL_10MIN, '로그인 (테스트)', true, 15000),

  // 다건 조회 (10초, 자동대기 가능)
  query_products: createConfig(TEST_INTERVAL_10MIN, '품목 다건 조회 (테스트)', true, 15000),
  query_inventory: createConfig(TEST_INTERVAL_10MIN, '재고 다건 조회 (테스트)', true, 15000),
  query_inventory_warehouse: createConfig(TEST_INTERVAL_10MIN, '창고별 재고 다건 조회 (테스트)', true, 15000),
  query_purchase_orders: createConfig(TEST_INTERVAL_10MIN, '발주서 조회 (테스트)', true, 15000),

  // 단건 조회 (1초, 자동대기 가능)
  query_single_product: createConfig(TEST_INTERVAL_1SEC, '품목 단건 조회 (테스트)', true, 5000),
  query_single_inventory: createConfig(TEST_INTERVAL_1SEC, '재고 단건 조회 (테스트)', true, 5000),
  query_single_inventory_warehouse: createConfig(TEST_INTERVAL_1SEC, '창고별 재고 단건 조회 (테스트)', true, 5000),

  // 저장 (10초, 자동대기 가능)
  save_customer: createConfig(TEST_INTERVAL_10SEC, '거래처 등록 (테스트)', true, 15000),
  save_product: createConfig(TEST_INTERVAL_10SEC, '품목 등록 (테스트)', true, 15000),
  save_quotation: createConfig(TEST_INTERVAL_10SEC, '견적서 입력 (테스트)', true, 15000),
  save_sale_order: createConfig(TEST_INTERVAL_10SEC, '주문서 입력 (테스트)', true, 15000),
  save_sale: createConfig(TEST_INTERVAL_10SEC, '판매 입력 (테스트)', true, 15000),
  save_purchase: createConfig(TEST_INTERVAL_10SEC, '구매 입력 (테스트)', true, 15000),
  save_job_order: createConfig(TEST_INTERVAL_10SEC, '작업지시서 입력 (테스트)', true, 15000),
  save_goods_issued: createConfig(TEST_INTERVAL_10SEC, '생산불출 입력 (테스트)', true, 15000),
  save_goods_receipt: createConfig(TEST_INTERVAL_10SEC, '생산입고 입력 (테스트)', true, 15000),
  save_invoice: createConfig(TEST_INTERVAL_10SEC, '전표 입력 (테스트)', true, 15000),
  save_openmarket_order: createConfig(TEST_INTERVAL_10SEC, '쇼핑몰 주문 입력 (테스트)', true, 15000),
  save_clock_in_out: createConfig(TEST_INTERVAL_10SEC, '출퇴근 기록 (테스트)', true, 15000),
  save_board_post: createConfig(TEST_INTERVAL_10SEC, '게시글 입력 (테스트)', true, 15000),
};

/**
 * 파일에 저장되는 Rate Limit 상태
 */
interface RateLimitFileData {
  lastCallTimes: Record<string, number>;
  updatedAt: number;
}

/**
 * sleep 유틸리티
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Rate Limiter 클래스
 *
 * 각 API별로 마지막 호출 시간을 추적하고
 * Rate Limit 초과 시 자동 대기 또는 에러를 던짐
 *
 * 멀티 프로세스 지원을 위해 파일 기반으로 상태 저장
 */
export class RateLimiter {
  private lastCallTimes: Map<RateLimitType, number> = new Map();
  private limits: Record<RateLimitType, RateLimitConfig>;
  private logger = getLogger();
  private stateFilePath: string | null = null;
  private useFileState: boolean = false;

  constructor(options: { useTestServer?: boolean; stateFilePath?: string } = {}) {
    this.limits = options.useTestServer ? TEST_RATE_LIMITS : RATE_LIMITS;
    this.stateFilePath = options.stateFilePath ?? null;
    this.useFileState = !!this.stateFilePath;

    this.logger.debug('RateLimiter initialized', {
      useTestServer: options.useTestServer ?? false,
      useFileState: this.useFileState,
      apiCount: Object.keys(this.limits).length,
    });
  }

  /**
   * 파일에서 상태 로드
   */
  private async loadState(): Promise<void> {
    if (!this.useFileState || !this.stateFilePath) return;

    try {
      const content = await readFile(this.stateFilePath, 'utf-8');
      const data: RateLimitFileData = JSON.parse(content);

      // 파일에서 로드한 시간을 메모리에 병합 (더 최신 값 사용)
      for (const [type, time] of Object.entries(data.lastCallTimes)) {
        const currentTime = this.lastCallTimes.get(type as RateLimitType) ?? 0;
        if (time > currentTime) {
          this.lastCallTimes.set(type as RateLimitType, time);
        }
      }

      this.logger.debug('Rate limit state loaded from file');
    } catch {
      // 파일이 없거나 파싱 실패 - 무시
      this.logger.debug('No rate limit state file found or invalid');
    }
  }

  /**
   * 파일에 상태 저장
   */
  private async saveState(): Promise<void> {
    if (!this.useFileState || !this.stateFilePath) return;

    try {
      const data: RateLimitFileData = {
        lastCallTimes: Object.fromEntries(this.lastCallTimes),
        updatedAt: Date.now(),
      };

      await mkdir(dirname(this.stateFilePath), { recursive: true });
      await writeFile(this.stateFilePath, JSON.stringify(data, null, 2));

      this.logger.debug('Rate limit state saved to file');
    } catch (error) {
      this.logger.warn('Failed to save rate limit state', { error });
    }
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
  async recordCall(type: RateLimitType): Promise<void> {
    this.lastCallTimes.set(type, Date.now());
    this.logger.debug('API call recorded', { type });

    // 파일에 상태 저장 (비동기, 에러 무시)
    this.saveState().catch(() => {});
  }

  /**
   * Rate Limit을 확인하고 필요시 대기 후 호출을 실행하는 래퍼
   *
   * @param type API 타입
   * @param fn 실행할 함수
   * @param onWaiting 대기 시작 시 호출되는 콜백 (Claude에게 상태 보고용)
   */
  async execute<T>(
    type: RateLimitType,
    fn: () => Promise<T>,
    onWaiting?: (waitTimeMs: number, description: string) => void
  ): Promise<T> {
    // 파일에서 최신 상태 로드 (멀티 프로세스 동기화)
    await this.loadState();

    const waitTime = this.getWaitTime(type);
    const config = this.limits[type];

    if (waitTime > 0) {
      // 자동 대기 가능하고, 최대 대기 시간 이내인 경우
      if (config.autoWait && waitTime <= config.maxAutoWaitMs) {
        this.logger.info('Auto-waiting for rate limit', {
          type,
          description: config.description,
          waitTimeMs: waitTime,
        });

        // 대기 콜백 호출 (Claude에게 알림)
        if (onWaiting) {
          onWaiting(waitTime, config.description);
        }

        await sleep(waitTime);
      } else {
        // 자동 대기 불가 - 에러 던짐
        this.logger.warn('Rate limit exceeded, cannot auto-wait', {
          type,
          description: config.description,
          waitTimeMs: waitTime,
          maxAutoWaitMs: config.maxAutoWaitMs,
        });
        throw EcountRateLimitError.forApiType(type, waitTime);
      }
    }

    // 함수 실행
    const result = await fn();

    // 호출 시간 기록
    await this.recordCall(type);

    return result;
  }

  /**
   * 특정 타입의 Rate Limit 상태 초기화
   * (테스트나 세션 재설정 시 사용)
   */
  async reset(type?: RateLimitType): Promise<void> {
    if (type) {
      this.lastCallTimes.delete(type);
    } else {
      this.lastCallTimes.clear();
    }
    this.logger.debug('Rate limit reset', { type: type ?? 'all' });

    // 파일에도 반영
    await this.saveState();
  }

  /**
   * 현재 Rate Limit 상태 조회
   */
  getStatus(): Record<RateLimitType, { canCall: boolean; waitTimeMs: number; autoWait: boolean }> {
    const status: Record<string, { canCall: boolean; waitTimeMs: number; autoWait: boolean }> = {};
    for (const type of Object.keys(this.limits) as RateLimitType[]) {
      status[type] = {
        canCall: this.canCall(type),
        waitTimeMs: this.getWaitTime(type),
        autoWait: this.limits[type].autoWait,
      };
    }
    return status as Record<RateLimitType, { canCall: boolean; waitTimeMs: number; autoWait: boolean }>;
  }
}

/**
 * 기본 Rate Limiter 인스턴스
 */
let defaultRateLimiter: RateLimiter | null = null;
let defaultRateLimiterOptions: { useTestServer?: boolean; stateFilePath?: string } | undefined;

export function getRateLimiter(options?: { useTestServer?: boolean; stateFilePath?: string }): RateLimiter {
  // 옵션이 변경되면 인스턴스 재생성
  const optionsChanged =
    defaultRateLimiter &&
    (defaultRateLimiterOptions?.useTestServer !== options?.useTestServer ||
      defaultRateLimiterOptions?.stateFilePath !== options?.stateFilePath);

  if (optionsChanged) {
    defaultRateLimiter = null;
  }

  if (!defaultRateLimiter) {
    defaultRateLimiter = new RateLimiter(options);
    defaultRateLimiterOptions = options;
  }
  return defaultRateLimiter;
}

export function resetRateLimiter(): void {
  defaultRateLimiter = null;
  defaultRateLimiterOptions = undefined;
}
