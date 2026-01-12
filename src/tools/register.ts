/**
 * MCP Tools Registration
 *
 * 모든 ECOUNT MCP 도구를 등록하는 모듈
 * 각 도구에 상세한 설명 포함 - Claude Code가 올바른 도구를 선택할 수 있도록
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { EcountClient } from '../client/ecount-client.js';
import { formatErrorMessage } from '../utils/errors.js';
import { getLogger } from '../utils/logger.js';

import * as schemas from './schemas.js';

const logger = getLogger();

/**
 * 도구 실행 결과 형식화
 */
function formatResult(data: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * 에러 결과 형식화
 */
function formatError(error: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
} {
  return {
    content: [{ type: 'text' as const, text: formatErrorMessage(error) }],
    isError: true,
  };
}

/**
 * 모든 도구 등록
 */
export function registerTools(server: McpServer, client: EcountClient): void {
  logger.info('Registering MCP tools');

  // ============================================================================
  // 인증/연결 도구
  // ============================================================================

  server.tool(
    'ecount_test_connection',
    'ECOUNT ERP 연결 테스트. API 인증 정보(회사코드, 사용자ID, API키)가 올바른지 확인하고, ' +
    'Zone 조회와 로그인이 성공하는지 테스트합니다. 다른 ECOUNT 도구 사용 전에 먼저 실행하세요. ' +
    '인자 없이 호출합니다.',
    {},
    async () => {
      try {
        const result = await client.testConnection();
        return formatResult({
          success: result.success,
          message: result.message,
          zone: result.zone,
          sessionId: result.sessionId ? '***' + result.sessionId.slice(-8) : null,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'ecount_get_session_info',
    '현재 ECOUNT 세션 상태 조회. Zone 정보, 세션 유효 여부, 만료 시간을 확인합니다. ' +
    '세션이 만료되었는지 확인하거나 디버깅할 때 사용합니다. 인자 없이 호출합니다.',
    {},
    async () => {
      try {
        const info = client.getSessionInfo();
        return formatResult({
          ...info,
          expiresAt: info.expiresAt?.toISOString() ?? null,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'ecount_server_status',
    'MCP 서버 내부 상태 조회. Rate Limit 현황, 에러 카운터, 캐시 상태, 서버 버전을 확인합니다. ' +
    'API 호출이 차단되거나 느린 원인을 파악할 때 사용합니다. 인자 없이 호출합니다.',
    {},
    async () => {
      try {
        return formatResult({
          version: '0.1.0',
          rateLimits: client.getRateLimitStatus(),
          errorCounter: client.getErrorCounterStatus(),
          cache: client.getCacheStatus(),
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============================================================================
  // 품목 도구
  // ============================================================================

  server.tool(
    'ecount_get_product',
    '품목 단건 조회. 특정 품목코드의 상세 정보를 조회합니다. ' +
    '정확한 품목코드를 알고 있을 때 사용하세요. ' +
    '품목코드를 모르면 ecount_get_products로 검색하거나 전체 목록을 조회하세요. ' +
    '[Rate Limit: 1초/1회] ' +
    '[Response: PROD_CD(품목코드), PROD_DES(품목명), SIZE_DES(규격), UNIT(단위), ' +
    'PROD_TYPE(품목구분: 0=원재료,1=제품,2=반제품,3=상품,4=부재료,7=무형상품), ' +
    'IN_PRICE(입고단가), OUT_PRICE(출고단가), CLASS_CD(그룹코드), BAR_CODE(바코드), ' +
    'BAL_FLAG(재고수량관리: 0=제외,1=대상), SET_FLAG(세트여부), TAX(부가세율), REMARKS(적요)]',
    schemas.GetProductSchema,
    async ({ prodCode }) => {
      try {
        const product = await client.getProduct(prodCode);
        if (!product) {
          return formatResult({ message: `품목을 찾을 수 없습니다: ${prodCode}` });
        }
        return formatResult(product);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'ecount_get_products',
    '품목 다건 조회. 여러 품목을 한 번에 조회합니다. ' +
    'prodCodes로 특정 품목들을 조회하거나, prodType으로 품목구분별 조회 가능. ' +
    '인자 없이 호출하면 전체 품목 조회. ' +
    '[Rate Limit: 10분/1회, 결과 10분간 캐싱됨] ' +
    '[Response: count(조회건수), products 배열 - 각 품목: PROD_CD(품목코드), PROD_DES(품목명), ' +
    'SIZE_DES(규격), UNIT(단위), PROD_TYPE(품목구분), IN_PRICE(입고단가), OUT_PRICE(출고단가), ' +
    'CLASS_CD(그룹코드), BAR_CODE(바코드), BAL_FLAG(재고수량관리), REMARKS(적요)]',
    schemas.GetProductsSchema,
    async ({ prodCodes, prodType }) => {
      try {
        const products = await client.getProducts({ prodCodes, prodType });
        return formatResult({
          count: products.length,
          products,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'ecount_create_product',
    '품목 등록. 새로운 품목을 ECOUNT에 등록합니다. ' +
    '품목코드(PROD_CD)와 품목명(PROD_DES)은 필수이며, 규격/단위/단가 등은 선택입니다. ' +
    '최대 300건까지 한 번에 등록할 수 있습니다. ' +
    '[Rate Limit: 10초/1회] ' +
    '[Response: success(성공건수), failed(실패건수), slipNos(전표번호 배열), ' +
    'details(상세결과 - IsSuccess, TotalError, Errors 배열)]',
    schemas.CreateProductSchema,
    async ({ products }) => {
      try {
        const result = await client.createProduct(products);
        return formatResult({
          success: result.SuccessCnt,
          failed: result.FailCnt,
          slipNos: result.SlipNos,
          details: result.ResultDetails,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============================================================================
  // 거래처 도구
  // ============================================================================

  server.tool(
    'ecount_create_customer',
    '거래처 등록. 새로운 거래처(고객사/협력사)를 ECOUNT에 등록합니다. ' +
    '거래처코드(CUST_CD)와 거래처명(CUST_DES)은 필수이며, ' +
    '대표자/주소/연락처/사업자번호 등은 선택입니다. 최대 300건까지 한 번에 등록 가능합니다. ' +
    '[Rate Limit: 10초/1회] ' +
    '[Response: success(성공건수), failed(실패건수), slipNos(전표번호 배열), ' +
    'details(상세결과 - IsSuccess, TotalError, Errors 배열)]',
    schemas.CreateCustomerSchema,
    async ({ customers }) => {
      try {
        const result = await client.createCustomer(customers);
        return formatResult({
          success: result.SuccessCnt,
          failed: result.FailCnt,
          slipNos: result.SlipNos,
          details: result.ResultDetails,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============================================================================
  // 재고현황 도구
  // ============================================================================

  server.tool(
    'ecount_get_inventory',
    '재고현황 단건 조회. 특정 품목의 특정 일자 기준 재고 수량을 조회합니다. ' +
    '기준일(baseDate)과 품목코드(prodCode)는 필수입니다. ' +
    '창고코드(whCode)를 지정하면 해당 창고의 재고만, 생략하면 전체 창고 합계를 반환합니다. ' +
    '[Rate Limit: 1초/1회] ' +
    '[Response: date(조회기준일), prodCode(품목코드), warehouseCode(창고코드), ' +
    'inventory 배열 - 각 항목: PROD_CD(품목코드), BAL_QTY(재고수량)]',
    schemas.GetInventorySchema,
    async ({ baseDate, prodCode, whCode }) => {
      try {
        const inventory = await client.getInventory({
          BASE_DATE: baseDate,
          PROD_CD: prodCode,
          WH_CD: whCode,
        });
        return formatResult({
          date: baseDate,
          prodCode,
          warehouseCode: whCode,
          inventory,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'ecount_get_inventory_list',
    '재고현황 다건 조회. 여러 품목 또는 전체 품목의 재고를 한 번에 조회합니다. ' +
    '기준일(baseDate)은 필수입니다. ' +
    '품목코드 목록(prodCodes)을 생략하면 전체 품목의 재고를 조회합니다. ' +
    'includeZeroStock=true로 재고 0인 품목도 포함할 수 있습니다. ' +
    '[Rate Limit: 10분/1회, 결과 10분간 캐싱됨] ' +
    '[Response: date(조회기준일), count(조회건수), inventory 배열 - 각 항목: PROD_CD(품목코드), BAL_QTY(재고수량)]',
    schemas.GetInventoryListSchema,
    async ({ baseDate, prodCodes, whCode, includeZeroStock, includeBalanceExcluded, includeDiscontinued }) => {
      try {
        const inventory = await client.getInventoryList({
          BASE_DATE: baseDate,
          PROD_CD: prodCodes?.join('∬'),
          WH_CD: whCode,
          ZERO_FLAG: includeZeroStock ? 'Y' : 'N',
          BAL_FLAG: includeBalanceExcluded ? 'Y' : 'N',
          DEL_GUBUN: includeDiscontinued ? 'Y' : 'N',
        });
        return formatResult({
          date: baseDate,
          count: inventory.length,
          inventory,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'ecount_get_inventory_by_warehouse',
    '창고별 재고현황 단건 조회. 특정 품목의 각 창고별 재고 수량을 조회합니다. ' +
    '여러 창고에 분산된 재고를 창고별로 확인할 때 사용합니다. ' +
    '기준일(baseDate)과 품목코드(prodCode)는 필수입니다. ' +
    '[Rate Limit: 1초/1회] ' +
    '[Response: date(조회기준일), prodCode(품목코드), inventory 배열 - 각 항목: ' +
    'WH_CD(창고코드), WH_DES(창고명), PROD_CD(품목코드), PROD_DES(품목명), PROD_SIZE_DES(품목명[규격]), BAL_QTY(재고수량)]',
    schemas.GetInventorySchema,
    async ({ baseDate, prodCode, whCode }) => {
      try {
        const inventory = await client.getInventoryByWarehouse({
          BASE_DATE: baseDate,
          PROD_CD: prodCode,
          WH_CD: whCode,
        });
        return formatResult({
          date: baseDate,
          prodCode,
          inventory,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'ecount_get_inventory_by_warehouse_list',
    '창고별 재고현황 다건 조회. 여러 품목의 창고별 재고를 한 번에 조회합니다. ' +
    '전체 창고의 재고 현황을 파악할 때 사용합니다. 기준일(baseDate)은 필수입니다. ' +
    '품목코드 목록(prodCodes)을 생략하면 전체 품목을 조회합니다. ' +
    '[Rate Limit: 10분/1회, 결과 10분간 캐싱됨] ' +
    '[Response: date(조회기준일), count(조회건수), inventory 배열 - 각 항목: ' +
    'WH_CD(창고코드), WH_DES(창고명), PROD_CD(품목코드), PROD_DES(품목명), PROD_SIZE_DES(품목명[규격]), BAL_QTY(재고수량)]',
    schemas.GetInventoryListSchema,
    async ({ baseDate, prodCodes, whCode, includeZeroStock, includeBalanceExcluded, includeDiscontinued }) => {
      try {
        const inventory = await client.getInventoryByWarehouseList({
          BASE_DATE: baseDate,
          PROD_CD: prodCodes?.join('∬'),
          WH_CD: whCode,
          ZERO_FLAG: includeZeroStock ? 'Y' : 'N',
          BAL_FLAG: includeBalanceExcluded ? 'Y' : 'N',
          DEL_GUBUN: includeDiscontinued ? 'Y' : 'N',
        });
        return formatResult({
          date: baseDate,
          count: inventory.length,
          inventory,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============================================================================
  // 영업관리 도구
  // ============================================================================

  server.tool(
    'ecount_create_quotation',
    '견적서 입력. 고객에게 제시할 견적서를 ECOUNT에 등록합니다. ' +
    '각 항목에 품목코드(PROD_CD)는 필수이며, 거래처/수량/단가/금액 등을 입력합니다. ' +
    'UPLOAD_SER_NO가 같은 항목들은 하나의 견적서로 묶입니다. 최대 300건까지 등록 가능. ' +
    '[Rate Limit: 10초/1회] ' +
    '[Response: success(성공건수), failed(실패건수), slipNos(전표번호 배열 - YYYYMMDD-N 형식), ' +
    'details(상세결과 - IsSuccess, TotalError, Errors 배열)]',
    schemas.CreateQuotationSchema,
    async ({ items }) => {
      try {
        const result = await client.createQuotation(items);
        return formatResult({
          success: result.SuccessCnt,
          failed: result.FailCnt,
          slipNos: result.SlipNos,
          details: result.ResultDetails,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'ecount_create_sale_order',
    '주문서 입력. 고객으로부터 받은 주문을 ECOUNT에 등록합니다. ' +
    '견적서가 확정되어 주문으로 전환될 때 사용합니다. ' +
    '품목코드(PROD_CD)는 필수이며, 납기일(DUE_DATE)을 지정할 수 있습니다. ' +
    'UPLOAD_SER_NO가 같은 항목들은 하나의 주문서로 묶입니다. ' +
    '[Rate Limit: 10초/1회] ' +
    '[Response: success(성공건수), failed(실패건수), slipNos(전표번호 배열 - YYYYMMDD-N 형식), ' +
    'details(상세결과 - IsSuccess, TotalError, Errors 배열)]',
    schemas.CreateSaleOrderSchema,
    async ({ items }) => {
      try {
        const result = await client.createSaleOrder(items);
        return formatResult({
          success: result.SuccessCnt,
          failed: result.FailCnt,
          slipNos: result.SlipNos,
          details: result.ResultDetails,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'ecount_create_sale',
    '판매 입력. 실제 판매(출고) 전표를 ECOUNT에 등록합니다. ' +
    '주문이 출고되어 매출이 발생했을 때 사용합니다. ' +
    '품목코드(PROD_CD)는 필수이며, 수량/단가/금액을 입력합니다. ' +
    'UPLOAD_SER_NO가 같은 항목들은 하나의 판매전표로 묶입니다. ' +
    '[Rate Limit: 10초/1회] ' +
    '[Response: success(성공건수), failed(실패건수), slipNos(전표번호 배열 - YYYYMMDD-N 형식), ' +
    'details(상세결과 - IsSuccess, TotalError, Errors 배열)]',
    schemas.CreateSaleSchema,
    async ({ items }) => {
      try {
        const result = await client.createSale(items);
        return formatResult({
          success: result.SuccessCnt,
          failed: result.FailCnt,
          slipNos: result.SlipNos,
          details: result.ResultDetails,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============================================================================
  // 구매관리 도구
  // ============================================================================

  server.tool(
    'ecount_get_purchase_orders',
    '발주서 조회. 특정 기간의 발주서 목록을 조회합니다. ' +
    '조회 시작일(baseDateFrom)과 종료일(baseDateTo)은 필수입니다. YYYYMMDD 형식. 최대 30일 조회 가능. ' +
    '거래처코드나 품목코드로 필터링할 수 있습니다. ' +
    '[Rate Limit: 10분/1회, 결과 10분간 캐싱됨] ' +
    '[Response: period(조회기간), count(조회건수), orders 배열 - 각 발주서: ' +
    'ORD_NO(발주번호), ORD_DATE(발주일자), CUST(거래처코드), CUST_DES(거래처명), ' +
    'WH_CD(창고코드), WH_DES(창고명), QTY(발주수량합계), BUY_AMT(공급가액합계), VAT_AMT(부가세합계), ' +
    'P_FLAG(상태: 1=진행중,9=종결), TIME_DATE(납기일자), TTL_CTT(제목)]',
    schemas.GetPurchaseOrdersSchema,
    async ({ baseDateFrom, baseDateTo, customerCode, prodCode }) => {
      try {
        const orders = await client.getPurchaseOrders({
          BASE_DATE_FROM: baseDateFrom,
          BASE_DATE_TO: baseDateTo,
          CUST: customerCode,
          PROD_CD: prodCode,
        });
        return formatResult({
          period: { from: baseDateFrom, to: baseDateTo },
          count: orders.length,
          orders,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'ecount_create_purchase',
    '구매 입력. 구매(입고) 전표를 ECOUNT에 등록합니다. ' +
    '협력사로부터 물품을 구매하여 입고받았을 때 사용합니다. ' +
    '품목코드(PROD_CD)는 필수이며, 수량/단가/금액을 입력합니다. ' +
    'UPLOAD_SER_NO가 같은 항목들은 하나의 구매전표로 묶입니다. ' +
    '[Rate Limit: 10초/1회] ' +
    '[Response: success(성공건수), failed(실패건수), slipNos(전표번호 배열 - YYYYMMDD-N 형식), ' +
    'details(상세결과 - IsSuccess, TotalError, Errors 배열)]',
    schemas.CreatePurchaseSchema,
    async ({ items }) => {
      try {
        const result = await client.createPurchase(items);
        return formatResult({
          success: result.SuccessCnt,
          failed: result.FailCnt,
          slipNos: result.SlipNos,
          details: result.ResultDetails,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============================================================================
  // 생산관리 도구
  // ============================================================================

  server.tool(
    'ecount_create_job_order',
    '작업지시서 입력. 생산 계획을 ECOUNT에 등록합니다. ' +
    '어떤 제품을 얼마나 생산할지 지시하는 문서입니다. ' +
    '생산할 품목코드(PROD_CD)는 필수이며, 수량/납기일/BOM버전 등을 지정합니다. ' +
    '[Rate Limit: 10초/1회] ' +
    '[Response: success(성공건수), failed(실패건수), slipNos(전표번호 배열 - YYYYMMDD-N 형식), ' +
    'details(상세결과 - IsSuccess, TotalError, Errors 배열)]',
    schemas.CreateJobOrderSchema,
    async ({ items }) => {
      try {
        const result = await client.createJobOrder(items);
        return formatResult({
          success: result.SuccessCnt,
          failed: result.FailCnt,
          slipNos: result.SlipNos,
          details: result.ResultDetails,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'ecount_create_goods_issued',
    '생산불출 입력. 생산을 위해 자재를 출고하는 전표를 등록합니다. ' +
    '창고에서 생산 공장으로 원자재를 불출할 때 사용합니다. ' +
    '품목코드(PROD_CD), 출고창고(WH_CD_F), 입고공장(WH_CD_T), 수량(QTY)이 필수입니다. ' +
    '[Rate Limit: 10초/1회] ' +
    '[Response: success(성공건수), failed(실패건수), slipNos(전표번호 배열 - YYYYMMDD-N 형식), ' +
    'details(상세결과 - IsSuccess, TotalError, Errors 배열)]',
    schemas.CreateGoodsIssuedSchema,
    async ({ items }) => {
      try {
        const result = await client.createGoodsIssued(items);
        return formatResult({
          success: result.SuccessCnt,
          failed: result.FailCnt,
          slipNos: result.SlipNos,
          details: result.ResultDetails,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'ecount_create_goods_receipt',
    '생산입고 I 입력. 생산 완료된 완제품을 입고하는 전표를 등록합니다. ' +
    '생산이 완료되어 완제품이 창고에 입고될 때 사용합니다. ' +
    '완제품 품목코드(PROD_CD)는 필수이며, 입고수량/단가 등을 지정합니다. ' +
    '[Rate Limit: 10초/1회] ' +
    '[Response: success(성공건수), failed(실패건수), slipNos(전표번호 배열 - YYYYMMDD-N 형식), ' +
    'details(상세결과 - IsSuccess, TotalError, Errors 배열)]',
    schemas.CreateGoodsReceiptSchema,
    async ({ items }) => {
      try {
        const result = await client.createGoodsReceipt(items);
        return formatResult({
          success: result.SuccessCnt,
          failed: result.FailCnt,
          slipNos: result.SlipNos,
          details: result.ResultDetails,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============================================================================
  // 회계 도구
  // ============================================================================

  server.tool(
    'ecount_create_invoice',
    '매출·매입전표 II 자동분개. 회계 전표(세금계산서)를 ECOUNT에 등록합니다. ' +
    'TAX_GUBUN으로 매출/매입 구분을 지정합니다: 11=과세매출, 21=과세매입, 14=카드매출 등. ' +
    '매출시 CR_CODE(매출계정), 매입시 DR_CODE(매입계정)를 지정합니다. ' +
    '공급가액(SUPPLY_AMT)과 부가세(VAT_AMT)를 입력합니다. ' +
    '[Rate Limit: 10초/1회] ' +
    '[Response: success(성공건수), failed(실패건수), slipNos(전표번호 배열 - YYYYMMDD-N 형식), ' +
    'details(상세결과 - IsSuccess, TotalError, Errors 배열)]',
    schemas.CreateInvoiceSchema,
    async ({ items }) => {
      try {
        const result = await client.createInvoice(items);
        return formatResult({
          success: result.SuccessCnt,
          failed: result.FailCnt,
          slipNos: result.SlipNos,
          details: result.ResultDetails,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============================================================================
  // 쇼핑몰 도구
  // ============================================================================

  server.tool(
    'ecount_create_openmarket_order',
    '쇼핑몰 주문 입력. 네이버스토어, 쿠팡 등 외부 쇼핑몰 주문을 ECOUNT에 등록합니다. ' +
    '쇼핑몰코드(openmarketCode)는 ECOUNT에 미리 등록된 코드입니다. ' +
    '주문번호, 상품정보, 주문자/수취인 정보, 배송정보 등을 입력합니다. ' +
    '쇼핑몰 주문 연동 자동화에 사용합니다. ' +
    '[Rate Limit: 10초/1회] ' +
    '[Response: ResultDetails 배열 - 각 주문: OPENMARKET_CD(쇼핑몰코드), SLIP_NO(ECOUNT주문번호), ' +
    'SLIP_SER(순번), GROUP_NO(묶음주문번호), ORDER_NO(주문번호), Result(결과메시지 - 성공시 빈문자열, 실패시 에러메시지)]',
    schemas.CreateOpenMarketOrderSchema,
    async ({ openmarketCode, orders }) => {
      try {
        const result = await client.createOpenMarketOrder({
          OPENMARKET_CD: openmarketCode,
          ORDERS: orders,
        });
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============================================================================
  // 근태관리 도구
  // ============================================================================

  server.tool(
    'ecount_create_clock_in_out',
    '출퇴근 기록 입력. 직원의 출퇴근 시간을 ECOUNT에 등록합니다. ' +
    '사원번호(EMP_CD), 출근일시(ATTDC_DTM_I), 퇴근일시(ATTDC_DTM_O)가 필수입니다. ' +
    '일시 형식은 YYYY-MM-DD HH:mm:ss 입니다. ' +
    '반차 여부(HDOFF_TYPE_CD_I/O)와 외근 구분(OUT_WORK_TF)도 지정합니다. ' +
    '[Rate Limit: 10초/1회] ' +
    '[Response: success(성공건수), failed(실패건수), details(상세결과 - IsSuccess, TotalError, Errors 배열)]',
    schemas.CreateClockInOutSchema,
    async ({ items }) => {
      try {
        const result = await client.createClockInOut(items);
        return formatResult({
          success: result.SuccessCnt,
          failed: result.FailCnt,
          details: result.ResultDetails,
        });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ============================================================================
  // 게시판 도구
  // ============================================================================

  server.tool(
    'ecount_create_board_post',
    '게시글 입력. ECOUNT ERP 게시판에 글을 등록합니다. ' +
    '게시판 ID(bizz_sid)는 ECOUNT에 등록된 게시판의 식별코드입니다. ' +
    '제목(title), 내용(body_ctt)을 입력하며, 관련 거래처/품목/담당자를 연결할 수 있습니다. ' +
    '사내 공지나 업무 기록을 남길 때 사용합니다. ' +
    '[Rate Limit: 10초/1회] ' +
    '[Response: data 배열 - 각 게시글: seq(순번), result(일자-번호 형식, 예: 20250819-9), error(에러시 상세정보)]',
    schemas.CreateBoardPostSchema,
    async ({ posts }) => {
      try {
        const formattedPosts = posts.map((p) => ({ master: p }));
        const result = await client.createBoardPost(formattedPosts);
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  logger.info('All MCP tools registered', { count: 22 });
}
