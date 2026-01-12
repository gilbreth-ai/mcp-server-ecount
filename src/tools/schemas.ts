/**
 * MCP Tool Schemas
 *
 * Zod 스키마를 사용한 도구 파라미터 정의
 * 모든 필드에 상세한 설명 포함 - Claude Code가 올바르게 사용할 수 있도록
 */

import { z } from 'zod';

// ============================================================================
// 공통 스키마
// ============================================================================

/**
 * 날짜 문자열 (YYYYMMDD)
 */
export const DateString = z
  .string()
  .regex(/^\d{8}$/, '날짜는 YYYYMMDD 형식이어야 합니다')
  .describe('날짜 (YYYYMMDD 형식). 예: 20240115는 2024년 1월 15일');

/**
 * 선택적 날짜 (기본값: 오늘)
 */
export const OptionalDateString = z
  .string()
  .regex(/^\d{8}$/, '날짜는 YYYYMMDD 형식이어야 합니다')
  .optional()
  .describe('날짜 (YYYYMMDD 형식). 생략시 오늘 날짜 사용. 예: 20240115');

/**
 * Y/N 플래그
 */
export const YNFlag = z
  .enum(['Y', 'N'])
  .default('N')
  .describe('Y 또는 N. 생략시 N');

/**
 * 품목코드
 */
export const ProductCode = z
  .string()
  .max(20)
  .describe('ECOUNT에 등록된 품목코드. 최대 20자. 예: RP61G4');

/**
 * 거래처코드
 */
export const CustomerCode = z
  .string()
  .max(30)
  .describe('ECOUNT에 등록된 거래처코드. 최대 30자');

/**
 * 창고코드
 */
export const WarehouseCode = z
  .string()
  .max(5)
  .describe('ECOUNT에 등록된 창고코드. 최대 5자. 예: WH01');

/**
 * 수량 (문자열로 전송)
 */
export const Quantity = z
  .string()
  .describe('수량. 문자열로 입력. 예: "10", "100.5"');

/**
 * 금액 (문자열로 전송)
 */
export const Amount = z
  .string()
  .describe('금액. 문자열로 입력. 예: "10000", "15000.50"');

/**
 * 순번 (전표 묶음용)
 */
export const UploadSerNo = z
  .string()
  .max(4)
  .default('1')
  .describe('전표 묶음 순번. 같은 순번의 항목들은 하나의 전표로 묶임. 기본값: "1"');

// ============================================================================
// 품목 스키마
// ============================================================================

export const GetProductSchema = {
  prodCode: ProductCode.describe(
    '조회할 품목코드 (필수). ECOUNT에 등록된 정확한 품목코드 입력. 예: RP61G4'
  ),
};

export const GetProductsSchema = {
  prodCodes: z
    .array(ProductCode)
    .optional()
    .describe(
      '조회할 품목코드 목록. 생략하면 전체 품목 조회. 여러 품목 지정 가능'
    ),
  prodType: z
    .string()
    .optional()
    .describe(
      '품목구분. 0:원재료, 1:제품, 2:반제품, 3:상품, 4:부재료, 7:무형상품'
    ),
};

export const CreateProductSchema = {
  products: z
    .array(
      z.object({
        PROD_CD: ProductCode.describe('품목코드 (필수). 신규 등록할 고유 코드'),
        PROD_DES: z.string().max(100).describe('품목명 (필수). 최대 100자'),
        SIZE_DES: z.string().max(100).optional().describe('규격 (선택). 최대 100자'),
        UNIT: z.string().max(10).optional().describe('단위 (선택). 예: EA, BOX, KG'),
        CLASS_CD: z.string().max(10).optional().describe('분류코드 (선택). ECOUNT에 등록된 분류코드'),
        IN_PRICE: Amount.optional().describe('매입단가 (선택). 문자열로 입력'),
        OUT_PRICE: Amount.optional().describe('판매단가 (선택). 문자열로 입력'),
        REMARKS: z.string().max(200).optional().describe('비고 (선택). 최대 200자'),
        USE_YN: YNFlag.optional().describe('사용여부 (선택). Y: 사용, N: 미사용. 기본값: Y'),
      })
    )
    .min(1)
    .max(300)
    .describe('등록할 품목 목록. 1~300건까지 한 번에 등록 가능'),
};

// ============================================================================
// 거래처 스키마
// ============================================================================

export const CreateCustomerSchema = {
  customers: z
    .array(
      z.object({
        CUST_CD: CustomerCode.describe('거래처코드 (필수). 신규 등록할 고유 코드'),
        CUST_DES: z.string().max(100).describe('거래처명 (필수). 최대 100자'),
        CEO: z.string().max(50).optional().describe('대표자명 (선택)'),
        CUST_ADDR: z.string().max(200).optional().describe('주소 (선택)'),
        TEL: z.string().max(50).optional().describe('전화번호 (선택). 예: 02-1234-5678'),
        EMAIL: z.string().email().optional().describe('이메일 (선택). 유효한 이메일 형식'),
        BUSINESS_NO: z.string().max(20).optional().describe('사업자번호 (선택). 예: 123-45-67890'),
        UPTAE: z.string().max(100).optional().describe('업태 (선택). 예: 제조업'),
        JONGMOK: z.string().max(100).optional().describe('종목 (선택). 예: 도자기'),
        REMARKS: z.string().max(200).optional().describe('비고 (선택)'),
      })
    )
    .min(1)
    .max(300)
    .describe('등록할 거래처 목록. 1~300건까지 한 번에 등록 가능'),
};

// ============================================================================
// 재고현황 스키마
// ============================================================================

export const GetInventorySchema = {
  baseDate: DateString.describe(
    '조회 기준일 (필수). YYYYMMDD 형식. 해당 일자 기준 재고 수량 조회. 예: 20240115'
  ),
  prodCode: ProductCode.describe(
    '품목코드 (필수). 재고를 조회할 품목. 예: RP61G4'
  ),
  whCode: WarehouseCode.optional().describe(
    '창고코드 (선택). 특정 창고의 재고만 조회. 생략시 전체 창고 합계'
  ),
};

export const GetInventoryListSchema = {
  baseDate: DateString.describe(
    '조회 기준일 (필수). YYYYMMDD 형식. 예: 20240115'
  ),
  prodCodes: z.array(ProductCode).optional().describe(
    '품목코드 목록 (선택). 생략하면 전체 품목의 재고 조회'
  ),
  whCode: WarehouseCode.optional().describe(
    '창고코드 (선택). 특정 창고의 재고만 조회. 생략시 전체 창고'
  ),
  includeZeroStock: z.boolean().default(false).describe(
    '재고 0인 품목 포함 여부 (선택). true: 포함, false: 제외. 기본값: false'
  ),
  includeBalanceExcluded: z.boolean().default(false).describe(
    '수량관리 제외품목 포함 여부 (선택). true: 포함, false: 제외. 기본값: false'
  ),
  includeDiscontinued: z.boolean().default(false).describe(
    '사용중단 품목 포함 여부 (선택). true: 포함, false: 제외. 기본값: false'
  ),
};

// ============================================================================
// 영업관리 스키마
// ============================================================================

const SalesItemBase = z.object({
  UPLOAD_SER_NO: UploadSerNo.describe(
    '전표 묶음 순번. 같은 번호의 항목들은 하나의 전표로 묶임. 기본값: "1"'
  ),
  IO_DATE: OptionalDateString.describe('전표일자 (선택). 생략시 오늘'),
  CUST: CustomerCode.optional().describe('거래처코드 (선택). ECOUNT에 등록된 코드'),
  CUST_DES: z.string().max(100).optional().describe('거래처명 (선택). 거래처코드 없을 때 사용'),
  EMP_CD: z.string().max(30).optional().describe('담당자코드 (선택)'),
  PJT_CD: z.string().max(14).optional().describe('프로젝트코드 (선택)'),
  WH_CD: WarehouseCode.optional().describe('창고코드 (선택)'),
  PROD_CD: ProductCode.describe('품목코드 (필수)'),
  PROD_DES: z.string().max(100).optional().describe('품목명 (선택). 품목코드 없을 때 사용'),
  SIZE_DES: z.string().max(100).optional().describe('규격 (선택)'),
  QTY: Quantity.optional().describe('수량 (선택). 문자열로 입력'),
  PRICE: Amount.optional().describe('단가 (선택). 문자열로 입력'),
  SUPPLY_AMT: Amount.optional().describe('공급가액 (선택). 문자열로 입력'),
  VAT_AMT: Amount.optional().describe('부가세 (선택). 문자열로 입력'),
  REMARKS: z.string().max(200).optional().describe('적요/비고 (선택)'),
});

export const CreateQuotationSchema = {
  items: z.array(SalesItemBase).min(1).max(300).describe(
    '견적 품목 목록. 1~300건. UPLOAD_SER_NO가 같은 항목들은 하나의 견적서로 묶임'
  ),
};

export const CreateSaleOrderSchema = {
  items: z
    .array(
      SalesItemBase.extend({
        DUE_DATE: OptionalDateString.describe('납기일 (선택). YYYYMMDD 형식'),
      })
    )
    .min(1)
    .max(300)
    .describe('주문 품목 목록. 1~300건. UPLOAD_SER_NO가 같은 항목들은 하나의 주문서로 묶임'),
};

export const CreateSaleSchema = {
  items: z.array(SalesItemBase).min(1).max(300).describe(
    '판매 품목 목록. 1~300건. UPLOAD_SER_NO가 같은 항목들은 하나의 판매전표로 묶임'
  ),
};

// ============================================================================
// 구매관리 스키마
// ============================================================================

export const GetPurchaseOrdersSchema = {
  baseDateFrom: DateString.describe('조회 시작일 (필수). YYYYMMDD 형식. 예: 20240101'),
  baseDateTo: DateString.describe('조회 종료일 (필수). YYYYMMDD 형식. 예: 20240131'),
  customerCode: CustomerCode.optional().describe('거래처코드 (선택). 특정 거래처 발주만 조회'),
  prodCode: ProductCode.optional().describe('품목코드 (선택). 특정 품목 발주만 조회'),
};

export const CreatePurchaseSchema = {
  items: z.array(SalesItemBase).min(1).max(300).describe(
    '구매 품목 목록. 1~300건. UPLOAD_SER_NO가 같은 항목들은 하나의 구매전표로 묶임'
  ),
};

// ============================================================================
// 생산관리 스키마
// ============================================================================

export const CreateJobOrderSchema = {
  items: z
    .array(
      z.object({
        UPLOAD_SER_NO: UploadSerNo,
        IO_DATE: OptionalDateString.describe('지시일자 (선택). 생략시 오늘'),
        CUST: CustomerCode.optional().describe('납품처코드 (선택)'),
        EMP_CD: z.string().max(30).optional().describe('담당자코드 (선택)'),
        PJT_CD: z.string().max(14).optional().describe('프로젝트코드 (선택)'),
        DOC_NO: z.string().max(30).optional().describe('작업지시서 No. (선택). 자동생성 가능'),
        TIME_DATE: OptionalDateString.describe('납기일 (선택)'),
        PROD_CD: ProductCode.describe('생산할 품목코드 (필수)'),
        PROD_DES: z.string().max(100).optional().describe('품목명 (선택)'),
        QTY: Quantity.optional().describe('작업지시수량 (선택)'),
        WH_CD: WarehouseCode.optional().describe('입고창고코드 (선택)'),
        REMARKS: z.string().max(200).optional().describe('적요 (선택)'),
        PROD_BOM_DES: z.string().max(100).optional().describe('BOM버전 (선택). 자재명세서 버전'),
      })
    )
    .min(1)
    .max(300)
    .describe('작업지시서 품목 목록. 생산 계획 등록용'),
};

export const CreateGoodsIssuedSchema = {
  items: z
    .array(
      z.object({
        UPLOAD_SER_NO: UploadSerNo,
        IO_DATE: OptionalDateString.describe('불출일자 (선택). 생략시 오늘'),
        EMP_CD: z.string().max(30).optional().describe('담당자코드 (선택)'),
        WH_CD_F: WarehouseCode.describe('출고창고코드 (필수). 자재를 보내는 창고'),
        WH_CD_T: WarehouseCode.describe('입고공장코드 (필수). 자재를 받는 공장'),
        PJT_CD: z.string().max(14).optional().describe('프로젝트코드 (선택)'),
        PROD_CD: ProductCode.describe('자재 품목코드 (필수)'),
        PROD_DES: z.string().max(100).optional().describe('품목명 (선택)'),
        QTY: Quantity.describe('불출수량 (필수)'),
        REMARKS: z.string().max(200).optional().describe('적요 (선택)'),
      })
    )
    .min(1)
    .max(300)
    .describe('생산불출 품목 목록. 생산을 위해 자재를 출고하는 전표'),
};

export const CreateGoodsReceiptSchema = {
  items: z
    .array(
      z.object({
        UPLOAD_SER_NO: UploadSerNo,
        IO_DATE: OptionalDateString.describe('입고일자 (선택). 생략시 오늘'),
        EMP_CD: z.string().max(30).optional().describe('담당자코드 (선택)'),
        WH_CD_F: WarehouseCode.optional().describe('생산공장코드 (선택). 제품이 생산된 공장'),
        WH_CD_T: WarehouseCode.optional().describe('입고창고코드 (선택). 완제품 입고 창고'),
        PJT_CD: z.string().max(14).optional().describe('프로젝트코드 (선택)'),
        PROD_CD: ProductCode.describe('완제품 품목코드 (필수)'),
        PROD_DES: z.string().max(100).optional().describe('품목명 (선택)'),
        QTY: Quantity.optional().describe('생산입고수량 (선택)'),
        PRICE: Amount.optional().describe('단가 (선택)'),
        SUPPLY_AMT: Amount.optional().describe('공급가액 (선택)'),
        REMARKS: z.string().max(200).optional().describe('적요 (선택)'),
        BOM_NO: z.string().max(100).optional().describe('BOM버전 (선택)'),
      })
    )
    .min(1)
    .max(300)
    .describe('생산입고 품목 목록. 생산 완료된 제품을 입고하는 전표'),
};

// ============================================================================
// 회계 스키마
// ============================================================================

export const CreateInvoiceSchema = {
  items: z
    .array(
      z.object({
        TRX_DATE: OptionalDateString.describe('전표일자 (선택). 생략시 오늘'),
        TAX_GUBUN: z
          .string()
          .describe(
            '매출/매입 구분코드 (필수). ' +
            '11: 과세매출, 12: 영세매출, 13: 면세매출, ' +
            '21: 과세매입, 22: 영세매입, 23: 면세매입, ' +
            '14: 신용카드매출, 24: 신용카드매입'
          ),
        CUST: CustomerCode.optional().describe('거래처코드 (선택)'),
        CUST_DES: z.string().max(50).optional().describe('거래처명 (선택)'),
        CR_CODE: z.string().max(8).optional().describe(
          '매출계정코드 (매출시 필수). ECOUNT 계정과목코드. 예: 4019'
        ),
        DR_CODE: z.string().max(8).optional().describe(
          '매입계정코드 (매입시 필수). ECOUNT 계정과목코드. 예: 1469'
        ),
        SUPPLY_AMT: Amount.optional().describe('공급가액 (선택). 부가세 제외 금액'),
        VAT_AMT: Amount.optional().describe('부가세 (선택). 부가세 금액'),
        REMARKS: z.string().max(200).optional().describe('적요 (선택)'),
        SITE_CD: z.string().max(14).optional().describe('부서코드 (선택)'),
        PJT_CD: z.string().max(14).optional().describe('프로젝트코드 (선택)'),
      })
    )
    .min(1)
    .max(300)
    .describe('회계 전표 목록. 매출/매입 세금계산서 등록용'),
};

// ============================================================================
// 쇼핑몰 스키마
// ============================================================================

export const CreateOpenMarketOrderSchema = {
  openmarketCode: z.string().max(5).describe(
    '쇼핑몰코드 (필수). ECOUNT에 등록된 쇼핑몰 식별코드. 최대 5자'
  ),
  orders: z
    .array(
      z.object({
        GROUP_NO: z.string().max(500).describe('묶음주문번호 (필수). 쇼핑몰의 묶음주문 식별번호'),
        ORDER_NO: z.string().max(500).describe('주문번호 (필수). 쇼핑몰의 개별주문 식별번호'),
        ORDER_DATE: z.string().describe('주문일시 (필수). YYYY-MM-DD HH:mm:ss 형식'),
        PAY_DATE: z.string().describe('결제일시 (필수). YYYY-MM-DD HH:mm:ss 형식'),
        PROD_CD: z.string().max(100).describe('쇼핑몰상품코드 (필수). 쇼핑몰에서 사용하는 상품코드'),
        PROD_NM: z.string().max(500).describe('쇼핑몰상품명 (필수)'),
        PROD_OPT: z.string().max(500).describe('주문옵션 (필수). 색상, 사이즈 등'),
        ORDER_QTY: z.number().describe('주문수량 (필수). 숫자'),
        ORDER_AMT: z.number().describe('주문금액 (필수). 숫자'),
        ORDERER: z.string().max(500).describe('주문자명 (필수)'),
        ORDERER_TEL: z.string().max(500).describe('주문자연락처 (필수)'),
        RECEIVER: z.string().max(500).describe('수취인명 (필수)'),
        RECEIVER_TEL: z.string().max(500).describe('수취인연락처 (필수)'),
        ADDR: z.string().max(1000).describe('배송주소 (필수)'),
        SHOP_NM: z.string().max(400).describe('쇼핑몰명 (필수). 예: 네이버스토어, 쿠팡'),
        DELIVERY_REQUEST: z.string().max(4000).optional().describe('배송요청사항 (선택)'),
        SHIPPING_CHARGE_TYPE: z.enum(['P', 'A']).optional().describe(
          '배송비유형 (선택). P: 선불(Prepaid), A: 착불(Arrival)'
        ),
        SHIPPING_CHARGE: Amount.optional().describe('배송비금액 (선택)'),
      })
    )
    .min(1)
    .describe('쇼핑몰 주문 목록. 외부 쇼핑몰 주문을 ECOUNT에 등록'),
};

// ============================================================================
// 근태관리 스키마
// ============================================================================

export const CreateClockInOutSchema = {
  items: z
    .array(
      z.object({
        EMP_CD: z.string().max(50).describe('사원번호 (필수). ECOUNT에 등록된 사원코드'),
        ATTDC_DTM_I: z.string().describe('출근일시 (필수). YYYY-MM-DD HH:mm:ss 형식'),
        ATTDC_DTM_O: z.string().describe('퇴근일시 (필수). YYYY-MM-DD HH:mm:ss 형식'),
        ATTDC_PLACE_I: z.string().max(100).optional().describe('출근장소 (선택)'),
        ATTDC_PLACE_O: z.string().max(100).optional().describe('퇴근장소 (선택)'),
        HDOFF_TYPE_CD_I: YNFlag.describe('오전반차여부 (필수). Y: 반차, N: 정상출근'),
        HDOFF_TYPE_CD_O: YNFlag.describe('오후반차여부 (필수). Y: 반차, N: 정상퇴근'),
        OUT_WORK_TF: YNFlag.describe('외근구분 (필수). Y: 외근, N: 사내근무'),
      })
    )
    .min(1)
    .describe('출퇴근 기록 목록. 직원 출퇴근 시간 등록용'),
};

// ============================================================================
// 게시판 스키마
// ============================================================================

export const CreateBoardPostSchema = {
  posts: z
    .array(
      z.object({
        bizz_sid: z.string().max(15).describe('게시판 ID (필수). ECOUNT 게시판 식별코드'),
        title: z.string().max(200).optional().describe('제목 (선택)'),
        body_ctt: z.string().optional().describe('내용 (선택). HTML 형식 가능'),
        progress_status: z.string().max(100).optional().describe('진행상태 (선택)'),
        cust: CustomerCode.optional().describe('거래처코드 (선택). 관련 거래처 연결'),
        prod: ProductCode.optional().describe('품목코드 (선택). 관련 품목 연결'),
        pic: z.string().max(30).optional().describe('담당자코드 (선택)'),
      })
    )
    .min(1)
    .describe('게시글 목록. ERP 게시판에 글 등록용'),
};
