/**
 * ECOUNT API Client
 *
 * 이카운트 OpenAPI 호출을 위한 핵심 클라이언트
 *
 * 특징:
 * - 자동 세션 관리 (만료 시 자동 재로그인)
 * - Rate Limit 준수
 * - 응답 캐싱
 * - 에러 카운터 관리
 */

import type { EcountMcpConfig } from '../types/config.js';

// 기본 타임아웃: 180초 (ECOUNT API가 느릴 수 있음, 특히 전체 조회 시)
const DEFAULT_TIMEOUT_MS = 180000;

import type {
  EcountApiResponse,
  SaveApiResponseData,
  EcountProduct,
  SaveProductRequest,
  SaveCustomerRequest,
  InventoryRequest,
  InventoryResponseData,
  EcountInventory,
  EcountInventoryByWarehouse,
  SaveQuotationRequest,
  SaveSaleOrderRequest,
  SaveSaleRequest,
  EcountPurchaseOrder,
  SavePurchaseRequest,
  SaveJobOrderRequest,
  SaveGoodsIssuedRequest,
  SaveGoodsReceiptRequest,
  SaveInvoiceAutoRequest,
  SaveOpenMarketOrderRequest,
  SaveClockInOutRequest,
  SaveBoardPostRequest,
} from '../types/api.js';
import {
  EcountError,
  EcountApiCallError,
  EcountRateLimitError,
  formatErrorMessage,
} from '../utils/errors.js';
import { getLogger, type Logger } from '../utils/logger.js';
import { SessionManager } from './session-manager.js';
import { getCache, type ApiCache } from './cache.js';
import { getRateLimiter, type RateLimiter, type RateLimitType } from './rate-limiter.js';
import { getErrorCounter, type ErrorCounter } from './error-counter.js';

/**
 * 타임아웃이 있는 fetch 래퍼
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
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
 * ECOUNT API 클라이언트
 */
export class EcountClient {
  private sessionManager: SessionManager;
  private cache: ApiCache;
  private rateLimiter: RateLimiter;
  private errorCounter: ErrorCounter;
  private logger: Logger;
  private initialized: boolean = false;

  constructor(config: EcountMcpConfig) {
    this.logger = getLogger();

    const useTestServer = config.server?.useTestServer ?? false;

    this.sessionManager = new SessionManager({
      credentials: config.credentials,
      useTestServer,
      sessionFilePath: config.server?.sessionFilePath,
    });

    this.cache = getCache();
    this.rateLimiter = getRateLimiter({
      useTestServer,
      stateFilePath: config.server?.rateLimitFilePath,
    });
    this.errorCounter = getErrorCounter();
  }

  /**
   * 클라이언트 초기화
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.logger.info('Initializing ECOUNT client');
    await this.sessionManager.initialize();
    this.initialized = true;
    this.logger.info('ECOUNT client initialized');
  }

  /**
   * 세션 확보
   */
  private async ensureSession(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.sessionManager.ensureSession();
  }

  /**
   * API 요청 실행
   *
   * Rate Limit 자동 대기 기능:
   * - query_single: 최대 5초까지 자동 대기
   * - save: 최대 15초까지 자동 대기
   * - zone/login/query: 10분이라 자동 대기 불가 (에러 반환)
   */
  private async request<T>(
    endpoint: string,
    body: unknown,
    options: {
      rateLimitType: RateLimitType;
      useCache?: boolean;
      cacheKey?: Record<string, unknown>;
      isSingleQuery?: boolean;
    }
  ): Promise<T> {
    const { rateLimitType, useCache = false, cacheKey, isSingleQuery = false } = options;

    // 캐시 확인
    if (useCache && cacheKey) {
      const cached = this.cache.getApiResponse<T>(endpoint, cacheKey);
      if (cached) {
        this.logger.debug('Cache hit', { endpoint });
        return cached;
      }
    }

    // Rate Limit 자동 대기 + 실행
    return this.rateLimiter.execute(
      rateLimitType,
      async () => {
        // 세션 확보
        const sessionId = await this.ensureSession();
        const baseUrl = this.sessionManager.getBaseUrl();
        const url = `${baseUrl}${endpoint}?SESSION_ID=${sessionId}`;

        this.logger.debug('API request', { endpoint, rateLimitType });

        let response: Response;
        try {
          response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
        } catch (fetchError) {
          // 타임아웃 에러
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            throw new EcountError(
              `API 요청 타임아웃 (${DEFAULT_TIMEOUT_MS / 1000}초 초과): ${endpoint}`,
              'TIMEOUT',
              { endpoint }
            );
          }
          // 네트워크 에러 (DNS 실패, 연결 거부 등)
          throw EcountApiCallError.networkError(
            endpoint,
            fetchError instanceof Error ? fetchError : undefined
          );
        }

        // HTTP 에러 처리
        if (response.status === 302 || response.status === 412) {
          throw EcountRateLimitError.forApiType(
            rateLimitType,
            this.rateLimiter.getWaitTime(rateLimitType)
          );
        }

        if (!response.ok) {
          throw EcountApiCallError.httpError(response.status, endpoint);
        }

        // 응답 파싱
        let data: EcountApiResponse<T>;
        try {
          data = await response.json() as EcountApiResponse<T>;
        } catch {
          throw EcountApiCallError.parseError(endpoint);
        }

        // API 레벨 에러 처리 (Status는 숫자 또는 문자열일 수 있음)
        const isSuccess = data.Status === 200 || data.Status === '200';
        if (!isSuccess) {
          const apiError = data.Error;

          // 세션 만료 감지
          if (
            apiError?.Message?.includes('SESSION') ||
            apiError?.Message?.includes('세션') ||
            apiError?.Code === 401
          ) {
            this.sessionManager.clearSession();
            // 세션 만료시 재시도
            return this.retryWithNewSession<T>(endpoint, body, options);
          }

          this.errorCounter.recordError();
          throw new EcountError(
            apiError?.Message || 'API 호출 실패',
            String(apiError?.Code),
            { endpoint, response: data }
          );
        }

        // 성공 - 에러 카운터 리셋
        this.errorCounter.recordSuccess();

        // 캐시 저장
        if (useCache && cacheKey && data.Data) {
          this.cache.setApiResponse(endpoint, cacheKey, data.Data, isSingleQuery);
        }

        return data.Data;
      },
      // 대기 시 로깅 (Claude에게 상태 보고)
      (waitTimeMs, description) => {
        this.logger.info(`Rate limit 대기 중: ${description} (${Math.ceil(waitTimeMs / 1000)}초)`);
      }
    );
  }

  /**
   * 새 세션으로 재시도
   * 주의: 이 메서드는 execute 내부에서 호출되므로 Rate Limit은 이미 처리됨
   */
  private async retryWithNewSession<T>(
    endpoint: string,
    body: unknown,
    options: {
      rateLimitType: RateLimitType;
      useCache?: boolean;
      cacheKey?: Record<string, unknown>;
      isSingleQuery?: boolean;
    }
  ): Promise<T> {
    this.logger.warn('Session expired, retrying with new session');

    const newSessionId = await this.sessionManager.login();
    const baseUrl = this.sessionManager.getBaseUrl();
    const retryUrl = `${baseUrl}${endpoint}?SESSION_ID=${newSessionId}`;

    let retryResponse: Response;
    try {
      retryResponse = await fetchWithTimeout(retryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new EcountError(
          `API 요청 타임아웃 (${DEFAULT_TIMEOUT_MS / 1000}초 초과): ${endpoint}`,
          'TIMEOUT',
          { endpoint }
        );
      }
      throw EcountApiCallError.networkError(
        endpoint,
        fetchError instanceof Error ? fetchError : undefined
      );
    }

    if (!retryResponse.ok) {
      throw EcountApiCallError.httpError(retryResponse.status, endpoint);
    }

    const retryData = await retryResponse.json() as EcountApiResponse<T>;
    const retrySuccess = retryData.Status === 200 || retryData.Status === '200';
    if (!retrySuccess) {
      this.errorCounter.recordError();
      throw new EcountError(
        retryData.Error?.Message || 'API 호출 실패',
        String(retryData.Error?.Code)
      );
    }

    this.errorCounter.recordSuccess();

    // 재시도 성공 시에도 캐시 저장
    if (options.useCache && options.cacheKey && retryData.Data) {
      this.cache.setApiResponse(
        endpoint,
        options.cacheKey,
        retryData.Data,
        options.isSingleQuery
      );
    }

    return retryData.Data;
  }

  // ============================================================================
  // 연결 테스트
  // ============================================================================

  /**
   * 연결 테스트
   */
  async testConnection(): Promise<{
    success: boolean;
    zone?: string;
    sessionId?: string;
    message: string;
  }> {
    try {
      const result = await this.sessionManager.testConnection();
      return {
        ...result,
        message: result.success
          ? 'ECOUNT 연결 성공'
          : result.error || 'ECOUNT 연결 실패',
      };
    } catch (error) {
      return {
        success: false,
        message: formatErrorMessage(error),
      };
    }
  }

  /**
   * 세션 정보 조회
   */
  getSessionInfo(): {
    zone: string | null;
    sessionId: string | null;
    expiresAt: Date | null;
    isValid: boolean;
    comCode: string;
  } {
    const state = this.sessionManager.getState();
    return {
      zone: state.zone,
      sessionId: state.sessionId ? '***' + state.sessionId.slice(-8) : null,
      expiresAt: state.expiresAt ? new Date(state.expiresAt) : null,
      isValid: this.sessionManager.isSessionValid,
      comCode: state.comCode,
    };
  }

  // ============================================================================
  // 품목 (Product) API
  // ============================================================================

  /**
   * 품목 단건 조회
   * 주의: 품목코드를 지정해서 조회해야 함
   */
  async getProduct(prodCode: string): Promise<EcountProduct | null> {
    // 단건 조회도 다건 조회 API 사용 (InventoryBasic)
    const data = await this.request<{ Result: EcountProduct[] }>(
      '/OAPI/V2/InventoryBasic/GetBasicProductsList',
      { PROD_CD: prodCode },
      {
        rateLimitType: 'query_single_product',
        useCache: true,
        cacheKey: { prodCode },
        isSingleQuery: true,
      }
    );

    return data?.Result?.[0] ?? null;
  }

  /**
   * 품목 다건 조회
   * 주의: prodCodes를 지정하지 않으면 전체 조회 (Rate Limit 주의)
   */
  async getProducts(params?: {
    prodCodes?: string[];
    prodType?: string;
  }): Promise<EcountProduct[]> {
    const body: Record<string, string> = {};

    if (params?.prodCodes?.length) {
      // 품목코드는 '∬' 구분자로 연결 (Ecount API 규격)
      body.PROD_CD = params.prodCodes.join('∬');
    }
    if (params?.prodType) {
      body.PROD_TYPE = params.prodType;
    }

    const data = await this.request<{ Result: EcountProduct[] }>(
      '/OAPI/V2/InventoryBasic/GetBasicProductsList',
      body,
      {
        rateLimitType: 'query_products',
        useCache: true,
        cacheKey: params,
      }
    );

    return data?.Result ?? [];
  }

  /**
   * 품목 등록
   */
  async createProduct(
    products: SaveProductRequest[]
  ): Promise<SaveApiResponseData> {
    const body = {
      ProductList: products.map((p) => ({ BulkDatas: p })),
    };

    return this.request<SaveApiResponseData>(
      '/OAPI/V2/BasicProduct/SaveBasicProduct',
      body,
      { rateLimitType: 'save_product' }
    );
  }

  // ============================================================================
  // 거래처 (Customer) API
  // ============================================================================

  /**
   * 거래처 등록
   */
  async createCustomer(
    customers: SaveCustomerRequest[]
  ): Promise<SaveApiResponseData> {
    const body = {
      CustList: customers.map((c) => ({ BulkDatas: c })),
    };

    return this.request<SaveApiResponseData>(
      '/OAPI/V2/BasicCust/SaveBasicCust',
      body,
      { rateLimitType: 'save_customer' }
    );
  }

  // ============================================================================
  // 재고현황 (Inventory) API
  // ============================================================================

  /**
   * 재고현황 단건 조회
   */
  async getInventory(params: InventoryRequest): Promise<EcountInventory[]> {
    const data = await this.request<InventoryResponseData>(
      '/OAPI/V2/InventoryBalance/ViewInventoryBalanceStatus',
      params,
      {
        rateLimitType: 'query_single_inventory',
        useCache: true,
        cacheKey: params as unknown as Record<string, unknown>,
        isSingleQuery: true,
      }
    );

    return (data?.Result as EcountInventory[]) ?? [];
  }

  /**
   * 재고현황 다건 조회
   */
  async getInventoryList(params: Omit<InventoryRequest, 'PROD_CD'> & { PROD_CD?: string }): Promise<EcountInventory[]> {
    const data = await this.request<InventoryResponseData>(
      '/OAPI/V2/InventoryBalance/GetListInventoryBalanceStatus',
      params,
      {
        rateLimitType: 'query_inventory',
        useCache: true,
        cacheKey: params,
      }
    );

    return (data?.Result as EcountInventory[]) ?? [];
  }

  /**
   * 창고별 재고현황 단건 조회
   */
  async getInventoryByWarehouse(
    params: InventoryRequest
  ): Promise<EcountInventoryByWarehouse[]> {
    const data = await this.request<InventoryResponseData>(
      '/OAPI/V2/InventoryBalance/ViewInventoryBalanceStatusByLocation',
      params,
      {
        rateLimitType: 'query_single_inventory_warehouse',
        useCache: true,
        cacheKey: params as unknown as Record<string, unknown>,
        isSingleQuery: true,
      }
    );

    return (data?.Result as EcountInventoryByWarehouse[]) ?? [];
  }

  /**
   * 창고별 재고현황 다건 조회
   */
  async getInventoryByWarehouseList(
    params: Omit<InventoryRequest, 'PROD_CD'> & { PROD_CD?: string }
  ): Promise<EcountInventoryByWarehouse[]> {
    const data = await this.request<InventoryResponseData>(
      '/OAPI/V2/InventoryBalance/GetListInventoryBalanceStatusByLocation',
      params,
      {
        rateLimitType: 'query_inventory_warehouse',
        useCache: true,
        cacheKey: params,
      }
    );

    return (data?.Result as EcountInventoryByWarehouse[]) ?? [];
  }

  // ============================================================================
  // 영업관리 (Sales) API
  // ============================================================================

  /**
   * 견적서 입력
   */
  async createQuotation(
    items: SaveQuotationRequest[]
  ): Promise<SaveApiResponseData> {
    const body = {
      QuotationList: items.map((i) => ({ BulkDatas: i })),
    };

    return this.request<SaveApiResponseData>(
      '/OAPI/V2/Quotation/SaveQuotation',
      body,
      { rateLimitType: 'save_quotation' }
    );
  }

  /**
   * 주문서 입력
   */
  async createSaleOrder(
    items: SaveSaleOrderRequest[]
  ): Promise<SaveApiResponseData> {
    const body = {
      SaleOrderList: items.map((i) => ({ BulkDatas: i })),
    };

    return this.request<SaveApiResponseData>(
      '/OAPI/V2/SaleOrder/SaveSaleOrder',
      body,
      { rateLimitType: 'save_sale_order' }
    );
  }

  /**
   * 판매 입력
   */
  async createSale(items: SaveSaleRequest[]): Promise<SaveApiResponseData> {
    const body = {
      SaleList: items.map((i) => ({ BulkDatas: i })),
    };

    return this.request<SaveApiResponseData>(
      '/OAPI/V2/Sale/SaveSale',
      body,
      { rateLimitType: 'save_sale' }
    );
  }

  // ============================================================================
  // 구매관리 (Purchases) API
  // ============================================================================

  /**
   * 발주서 조회
   */
  async getPurchaseOrders(params: {
    BASE_DATE_FROM: string;
    BASE_DATE_TO: string;
    CUST?: string;
    PROD_CD?: string;
  }): Promise<EcountPurchaseOrder[]> {
    const data = await this.request<{ Result: EcountPurchaseOrder[] }>(
      '/OAPI/V2/PurchasesOrder/GetPurchasesOrderList',
      params,
      {
        rateLimitType: 'query_purchase_orders',
        useCache: true,
        cacheKey: params,
      }
    );

    return data?.Result ?? [];
  }

  /**
   * 구매 입력
   */
  async createPurchase(
    items: SavePurchaseRequest[]
  ): Promise<SaveApiResponseData> {
    const body = {
      PurchasesList: items.map((i) => ({ BulkDatas: i })),
    };

    return this.request<SaveApiResponseData>(
      '/OAPI/V2/Purchases/SavePurchases',
      body,
      { rateLimitType: 'save_purchase' }
    );
  }

  // ============================================================================
  // 생산관리 (Production) API
  // ============================================================================

  /**
   * 작업지시서 입력
   */
  async createJobOrder(
    items: SaveJobOrderRequest[]
  ): Promise<SaveApiResponseData> {
    const body = {
      JobOrderList: items.map((i) => ({ BulkDatas: i })),
    };

    return this.request<SaveApiResponseData>(
      '/OAPI/V2/JobOrder/SaveJobOrder',
      body,
      { rateLimitType: 'save_job_order' }
    );
  }

  /**
   * 생산불출 입력
   */
  async createGoodsIssued(
    items: SaveGoodsIssuedRequest[]
  ): Promise<SaveApiResponseData> {
    const body = {
      GoodsIssuedList: items.map((i) => ({ BulkDatas: i })),
    };

    return this.request<SaveApiResponseData>(
      '/OAPI/V2/GoodsIssued/SaveGoodsIssued',
      body,
      { rateLimitType: 'save_goods_issued' }
    );
  }

  /**
   * 생산입고 I 입력
   */
  async createGoodsReceipt(
    items: SaveGoodsReceiptRequest[]
  ): Promise<SaveApiResponseData> {
    const body = {
      GoodsReceiptList: items.map((i) => ({ BulkDatas: i })),
    };

    return this.request<SaveApiResponseData>(
      '/OAPI/V2/GoodsReceipt/SaveGoodsReceipt',
      body,
      { rateLimitType: 'save_goods_receipt' }
    );
  }

  // ============================================================================
  // 회계 (Accounting) API
  // ============================================================================

  /**
   * 매출·매입전표 II 자동분개
   */
  async createInvoice(
    items: SaveInvoiceAutoRequest[]
  ): Promise<SaveApiResponseData> {
    const body = {
      InvoiceAutoList: items.map((i) => ({ BulkDatas: i })),
    };

    return this.request<SaveApiResponseData>(
      '/OAPI/V2/InvoiceAuto/SaveInvoiceAuto',
      body,
      { rateLimitType: 'save_invoice' }
    );
  }

  // ============================================================================
  // 쇼핑몰 (OpenMarket) API
  // ============================================================================

  /**
   * 쇼핑몰 주문 입력
   */
  async createOpenMarketOrder(
    order: SaveOpenMarketOrderRequest
  ): Promise<SaveApiResponseData> {
    return this.request<SaveApiResponseData>(
      '/OAPI/V2/OpenMarket/SaveOpenMarketOrderNew',
      order,
      { rateLimitType: 'save_openmarket_order' }
    );
  }

  // ============================================================================
  // 근태관리 (Time Management) API
  // ============================================================================

  /**
   * 출퇴근 기록 입력
   */
  async createClockInOut(
    items: SaveClockInOutRequest[]
  ): Promise<SaveApiResponseData> {
    const body = {
      ClockInOutList: items.map((i) => ({ BulkDatas: i })),
    };

    return this.request<SaveApiResponseData>(
      '/OAPI/V2/TimeMgmt/SaveClockInOut',
      body,
      { rateLimitType: 'save_clock_in_out' }
    );
  }

  // ============================================================================
  // 게시판 (Board) API
  // ============================================================================

  /**
   * 게시글 입력
   * 주의: 다른 API와 URL 패턴이 다름
   */
  async createBoardPost(
    posts: SaveBoardPostRequest[]
  ): Promise<{ data: Array<{ seq: number; result: string; error?: unknown }> }> {
    return this.rateLimiter.execute(
      'save_board_post',
      async () => {
        const sessionId = await this.ensureSession();
        const baseUrl = this.sessionManager.getBaseUrl();
        const url = `${baseUrl}/ec5/api/app.oapi.v3/action/CreateOApiBoardAction?session_Id=${sessionId}`;

        let response: Response;
        try {
          response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: posts }),
          });
        } catch (fetchError) {
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            throw new EcountError(
              `API 요청 타임아웃 (${DEFAULT_TIMEOUT_MS / 1000}초 초과): CreateOApiBoardAction`,
              'TIMEOUT'
            );
          }
          throw fetchError;
        }

        if (!response.ok) {
          throw EcountApiCallError.httpError(response.status, 'CreateOApiBoardAction');
        }

        return response.json() as Promise<{ data: Array<{ seq: number; result: string; error?: unknown }> }>;
      },
      (waitTimeMs, description) => {
        this.logger.info(`Rate limit 대기 중: ${description} (${Math.ceil(waitTimeMs / 1000)}초)`);
      }
    );
  }

  // ============================================================================
  // 유틸리티
  // ============================================================================

  /**
   * 캐시 무효화
   */
  invalidateCache(endpoint?: string): void {
    if (endpoint) {
      this.cache.invalidateEndpoint(endpoint);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Rate Limit 상태 조회
   */
  getRateLimitStatus(): Record<
    RateLimitType,
    { canCall: boolean; waitTimeMs: number; autoWait: boolean }
  > {
    return this.rateLimiter.getStatus();
  }

  /**
   * 에러 카운터 상태 조회
   */
  getErrorCounterStatus(): {
    errorCount: number;
    maxErrors: number;
    canProceed: boolean;
  } {
    return this.errorCounter.getStatus();
  }

  /**
   * 캐시 상태 조회
   */
  getCacheStatus(): {
    entries: number;
    maxEntries: number;
  } {
    const stats = this.cache.getStats();
    return {
      entries: stats.size,
      maxEntries: stats.maxSize,
    };
  }
}
