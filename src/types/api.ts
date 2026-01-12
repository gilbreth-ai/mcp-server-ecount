/**
 * ECOUNT OpenAPI Types
 *
 * 이카운트 OpenAPI의 요청/응답 타입 정의
 * 모든 필드명은 API 스펙에 맞춰 대문자 사용
 */

// ============================================================================
// 공통 타입
// ============================================================================

/**
 * API 공통 응답 구조
 */
export interface EcountApiResponse<T = unknown> {
  Status: string | number;  // API가 숫자 또는 문자열로 반환
  Error: EcountApiError | null;
  Data: T;
  Timestamp: string;
}

/**
 * API 에러 객체
 */
export interface EcountApiError {
  Code: number;
  Message: string;
  MessageDetail: string;
}

/**
 * 저장 API 공통 응답 데이터
 */
export interface SaveApiResponseData {
  SuccessCnt: number;
  FailCnt: number;
  ResultDetails: SaveResultDetail[];
  SlipNos: string[] | null;
  EXPIRE_DATE: string;
  QUANTITY_INFO: string;
  TRACE_ID: string;
}

/**
 * 저장 결과 상세
 */
export interface SaveResultDetail {
  IsSuccess: boolean;
  TotalError: string;
  Errors: Array<{ ColCd: string; Message: string }>;
  Code: string | null;
}

// ============================================================================
// Zone API
// ============================================================================

export interface ZoneRequest {
  COM_CODE: string;
}

export interface ZoneResponseData {
  ZONE: string;
  DOMAIN: string;
  EXPIRE_DATE: string;
}

// ============================================================================
// Login API
// ============================================================================

export interface LoginRequest {
  COM_CODE: string;
  USER_ID: string;
  API_CERT_KEY: string;
  LAN_TYPE: string;
  ZONE: string;
}

export interface LoginResponseData {
  SESSION_ID: string;
  ZONE: string;
  DOMAIN: string;
  EXPIRE_DATE: string;
}

// ============================================================================
// 품목 (Product) API
// ============================================================================

/**
 * 품목 조회 응답 (단건/다건)
 */
export interface EcountProduct {
  PROD_CD: string;
  PROD_DES: string;
  SIZE_DES?: string;
  UNIT?: string;
  IN_PRICE?: string;
  OUT_PRICE?: string;
  OUT_PRICE1?: string;
  OUT_PRICE2?: string;
  OUT_PRICE3?: string;
  OUT_PRICE4?: string;
  OUT_PRICE5?: string;
  CLASS_CD?: string;
  CLASS_DES?: string;
  USE_YN?: string;
  REMARKS?: string;
  BAL_FLAG?: string;
  WHOUSE_CD?: string;
  TAX_YN?: string;
  CUSTOMS_FLAG?: string;
  PROD_CD2?: string;
  SET_FLAG?: string;
  BAR_CODE?: string;
  QC_YN?: string;
  SERIAL_TYPE?: string;
}

/**
 * 품목 등록 요청 (BulkDatas)
 */
export interface SaveProductRequest {
  PROD_CD: string;
  PROD_DES: string;
  SIZE_DES?: string;
  UNIT?: string;
  CLASS_CD?: string;
  IN_PRICE?: string;
  OUT_PRICE?: string;
  OUT_PRICE1?: string;
  OUT_PRICE2?: string;
  REMARKS?: string;
  WHOUSE_CD?: string;
  TAX_YN?: string;
  BAL_FLAG?: string;
  USE_YN?: string;
}

// ============================================================================
// 거래처 (Customer) API
// ============================================================================

/**
 * 거래처 등록 요청
 */
export interface SaveCustomerRequest {
  CUST_CD: string;
  CUST_DES: string;
  CEO?: string;
  CUST_ADDR?: string;
  TEL?: string;
  FAX?: string;
  EMAIL?: string;
  BUSINESS_NO?: string;
  UPTAE?: string;
  JONGMOK?: string;
  USE_YN?: string;
  REMARKS?: string;
}

// ============================================================================
// 재고현황 (Inventory) API
// ============================================================================

/**
 * 재고현황 조회 요청
 */
export interface InventoryRequest {
  BASE_DATE: string;
  PROD_CD?: string;
  WH_CD?: string;
  ZERO_FLAG?: 'Y' | 'N';
  BAL_FLAG?: 'Y' | 'N';
  DEL_GUBUN?: 'Y' | 'N';
  SAFE_FLAG?: 'Y' | 'N';
}

/**
 * 재고현황 조회 응답
 */
export interface EcountInventory {
  PROD_CD: string;
  BAL_QTY: string;
}

/**
 * 창고별 재고현황 조회 응답
 */
export interface EcountInventoryByWarehouse {
  WH_CD: string;
  WH_DES: string;
  PROD_CD: string;
  PROD_DES: string;
  PROD_SIZE_DES: string;
  BAL_QTY: string;
}

/**
 * 재고현황 조회 응답 데이터
 */
export interface InventoryResponseData {
  IsSuccess: boolean;
  EXPIRE_DATE: string;
  QUANTITY_INFO: string;
  TRACE_ID: string;
  TotalCnt: number;
  Result: EcountInventory[] | EcountInventoryByWarehouse[];
}

// ============================================================================
// 영업관리 (Sales) API
// ============================================================================

/**
 * 견적서 입력 요청
 */
export interface SaveQuotationRequest {
  UPLOAD_SER_NO: string;
  IO_DATE?: string;
  CUST?: string;
  CUST_DES?: string;
  EMP_CD?: string;
  PJT_CD?: string;
  WH_CD?: string;
  PROD_CD: string;
  PROD_DES?: string;
  SIZE_DES?: string;
  QTY?: string;
  PRICE?: string;
  SUPPLY_AMT?: string;
  VAT_AMT?: string;
  REMARKS?: string;
}

/**
 * 주문서 입력 요청
 */
export interface SaveSaleOrderRequest {
  UPLOAD_SER_NO: string;
  IO_DATE?: string;
  CUST?: string;
  CUST_DES?: string;
  EMP_CD?: string;
  PJT_CD?: string;
  WH_CD?: string;
  PROD_CD: string;
  PROD_DES?: string;
  SIZE_DES?: string;
  QTY?: string;
  PRICE?: string;
  SUPPLY_AMT?: string;
  VAT_AMT?: string;
  REMARKS?: string;
  DUE_DATE?: string;
}

/**
 * 판매 입력 요청
 */
export interface SaveSaleRequest {
  UPLOAD_SER_NO: string;
  IO_DATE?: string;
  CUST?: string;
  CUST_DES?: string;
  EMP_CD?: string;
  PJT_CD?: string;
  WH_CD?: string;
  PROD_CD: string;
  PROD_DES?: string;
  SIZE_DES?: string;
  QTY?: string;
  PRICE?: string;
  SUPPLY_AMT?: string;
  VAT_AMT?: string;
  REMARKS?: string;
}

// ============================================================================
// 구매관리 (Purchases) API
// ============================================================================

/**
 * 발주서 조회 응답
 */
export interface EcountPurchaseOrder {
  LINE_NO: string;
  IO_DATE: string;
  IO_NO: string;
  CUST: string;
  CUST_DES: string;
  PROD_CD: string;
  PROD_DES: string;
  SIZE_DES: string;
  QTY: string;
  PRICE: string;
  SUPPLY_AMT: string;
  VAT_AMT: string;
  WH_CD: string;
  WH_DES: string;
  REMARKS: string;
}

/**
 * 구매 입력 요청
 */
export interface SavePurchaseRequest {
  UPLOAD_SER_NO: string;
  IO_DATE?: string;
  CUST?: string;
  CUST_DES?: string;
  EMP_CD?: string;
  PJT_CD?: string;
  WH_CD?: string;
  PROD_CD: string;
  PROD_DES?: string;
  SIZE_DES?: string;
  QTY?: string;
  PRICE?: string;
  SUPPLY_AMT?: string;
  VAT_AMT?: string;
  REMARKS?: string;
}

// ============================================================================
// 생산관리 (Production) API
// ============================================================================

/**
 * 작업지시서 입력 요청
 */
export interface SaveJobOrderRequest {
  UPLOAD_SER_NO: string;
  IO_DATE?: string;
  CUST?: string;
  CUST_DES?: string;
  EMP_CD?: string;
  PJT_CD?: string;
  DOC_NO?: string;
  TIME_DATE?: string;
  PROD_CD: string;
  PROD_DES?: string;
  SIZE_DES?: string;
  QTY?: string;
  WH_CD?: string;
  REMARKS?: string;
  PROD_BOM_DES?: string;
}

/**
 * 생산불출 입력 요청
 */
export interface SaveGoodsIssuedRequest {
  UPLOAD_SER_NO: string;
  IO_DATE?: string;
  EMP_CD?: string;
  WH_CD_F: string;
  WH_CD_T: string;
  PJT_CD?: string;
  DOC_NO?: string;
  PROD_CD: string;
  PROD_DES?: string;
  SIZE_DES?: string;
  QTY: string;
  REMARKS?: string;
}

/**
 * 생산입고 I 입력 요청
 */
export interface SaveGoodsReceiptRequest {
  UPLOAD_SER_NO: string;
  IO_DATE?: string;
  EMP_CD?: string;
  WH_CD_F?: string;
  WH_CD_T?: string;
  PJT_CD?: string;
  DOC_NO?: string;
  PROD_CD: string;
  PROD_DES?: string;
  SIZE_DES?: string;
  QTY?: string;
  PRICE?: string;
  SUPPLY_AMT?: string;
  VAT_AMT?: string;
  REMARKS?: string;
  BOM_NO?: string;
}

// ============================================================================
// 회계 (Accounting) API
// ============================================================================

/**
 * 매출·매입전표 II 자동분개 요청
 */
export interface SaveInvoiceAutoRequest {
  TRX_DATE?: string;
  ACCT_DOC_NO?: string;
  TAX_GUBUN: string;
  S_NO?: string;
  CUST?: string;
  CUST_DES?: string;
  CR_CODE?: string;
  DR_CODE?: string;
  SUPPLY_AMT?: string;
  VAT_AMT?: string;
  ACCT_NO?: string;
  REMARKS_CD?: string;
  REMARKS?: string;
  SITE_CD?: string;
  PJT_CD?: string;
}

// ============================================================================
// 쇼핑몰 (OpenMarket) API
// ============================================================================

/**
 * 쇼핑몰 주문 입력 요청
 */
export interface SaveOpenMarketOrderRequest {
  OPENMARKET_CD: string;
  ORDERS: OpenMarketOrder[];
}

export interface OpenMarketOrder {
  GROUP_NO: string;
  ORDER_NO: string;
  ORDER_DATE: string;
  PAY_DATE: string;
  PROD_CD: string;
  PROD_NM: string;
  PROD_OPT: string;
  ORDER_QTY: number;
  ORDER_AMT: number;
  ORDERER: string;
  ORDERER_TEL: string;
  RECEIVER: string;
  RECEIVER_TEL: string;
  RECEIVER_TEL2?: string;
  ZIP_CODE?: string;
  ADDR: string;
  DELIVERY_REQUEST?: string;
  SHIPPING_CHARGE_TYPE?: 'P' | 'A';
  SHIPPING_CHARGE?: string;
  MEMO?: string;
  SHOP_NM: string;
}

// ============================================================================
// 근태관리 (Time Management) API
// ============================================================================

/**
 * 출퇴근 기록 입력 요청
 */
export interface SaveClockInOutRequest {
  ATTDC_DTM_I: string;
  ATTDC_DTM_O: string;
  ATTDC_PLACE_I?: string;
  ATTDC_PLACE_O?: string;
  ATTDC_RSN_I?: string;
  ATTDC_RSN_O?: string;
  EMP_CD: string;
  HDOFF_TYPE_CD_I: 'Y' | 'N';
  HDOFF_TYPE_CD_O: 'Y' | 'N';
  OUT_WORK_TF: 'Y' | 'N';
}

// ============================================================================
// 게시판 (Board) API
// ============================================================================

/**
 * 게시글 입력 요청
 */
export interface SaveBoardPostRequest {
  master: {
    bizz_sid: string;
    title?: string;
    body_ctt?: string;
    progress_status?: string;
    label?: string;
    cust?: string;
    cust_nm?: string;
    prod?: string;
    prod_nm?: string;
    dept?: string;
    dept_nm?: string;
    pjt?: string;
    pjt_nm?: string;
    pic?: string;
    pic_nm?: string;
    complt_dtm?: string;
    record_range_dtm?: string;
    [key: string]: string | undefined;
  };
}
