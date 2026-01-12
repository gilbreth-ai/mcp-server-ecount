#!/usr/bin/env node
/**
 * ECOUNT MCP Server
 *
 * 이카운트 ERP OpenAPI를 위한 MCP (Model Context Protocol) 서버
 *
 * 사용법:
 *   ECOUNT_COM_CODE=회사코드 ECOUNT_USER_ID=사용자ID ECOUNT_API_CERT_KEY=인증키 npx ecount-mcp
 *
 * 환경변수:
 *   ECOUNT_COM_CODE     - 이카운트 회사코드 (필수)
 *   ECOUNT_USER_ID      - 이카운트 사용자 ID (필수, 마스터 ID)
 *   ECOUNT_API_CERT_KEY - API 인증키 (필수)
 *   ECOUNT_USE_TEST_SERVER - 테스트 서버 사용 여부 (선택, 'true')
 *   ECOUNT_SESSION_FILE - 세션 파일 경로 (선택)
 *   DEBUG               - 디버그 로깅 활성화 (선택, 'true')
 */

// .env 파일 로드 (개발용)
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv(); // .env도 로드

import { loadConfigFromEnv } from './types/config.js';
import { runServer } from './server.js';

// 버전 정보
const VERSION = '0.1.0';
const NAME = 'ecount-mcp';

async function main(): Promise<void> {
  // 도움말 출력
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
${NAME} v${VERSION}

ECOUNT ERP OpenAPI를 위한 MCP (Model Context Protocol) 서버

사용법:
  ECOUNT_COM_CODE=회사코드 \\
  ECOUNT_USER_ID=사용자ID \\
  ECOUNT_API_CERT_KEY=인증키 \\
  npx ${NAME}

환경변수:
  ECOUNT_COM_CODE        이카운트 회사코드 (필수)
  ECOUNT_USER_ID         이카운트 사용자 ID (필수, 마스터 ID)
  ECOUNT_API_CERT_KEY    API 인증키 (필수)
  ECOUNT_USE_TEST_SERVER 테스트 서버 사용 여부 (선택, 'true')
  ECOUNT_SESSION_FILE    세션 파일 경로 (선택)
  DEBUG                  디버그 로깅 활성화 (선택, 'true')

Claude Desktop 설정:
  {
    "mcpServers": {
      "ecount": {
        "command": "npx",
        "args": ["-y", "${NAME}"],
        "env": {
          "ECOUNT_COM_CODE": "회사코드",
          "ECOUNT_USER_ID": "사용자ID",
          "ECOUNT_API_CERT_KEY": "API인증키"
        }
      }
    }
  }

제공 도구:
  - 인증/연결: ecount_test_connection, ecount_get_session_info, ecount_server_status
  - 품목: ecount_get_product, ecount_get_products, ecount_create_product
  - 거래처: ecount_create_customer
  - 재고: ecount_get_inventory, ecount_get_inventory_list, ecount_get_inventory_by_warehouse, ecount_get_inventory_by_warehouse_list
  - 영업: ecount_create_quotation, ecount_create_sale_order, ecount_create_sale
  - 구매: ecount_get_purchase_orders, ecount_create_purchase
  - 생산: ecount_create_job_order, ecount_create_goods_issued, ecount_create_goods_receipt
  - 회계: ecount_create_invoice
  - 쇼핑몰: ecount_create_openmarket_order
  - 근태: ecount_create_clock_in_out
  - 게시판: ecount_create_board_post

Rate Limit 주의:
  - Zone/로그인: 10분에 1회
  - 다건 조회: 10분에 1회 (결과 캐싱됨)
  - 단건 조회: 1초에 1회
  - 저장: 10초에 1회
  - 연속 오류 30건 시 차단됨

자세한 정보: https://github.com/gilbreth/ecount-mcp
`);
    process.exit(0);
  }

  // 버전 출력
  if (process.argv.includes('--version') || process.argv.includes('-v')) {
    console.log(VERSION);
    process.exit(0);
  }

  try {
    // 환경변수에서 설정 로드
    const config = loadConfigFromEnv();

    // 서버 실행
    await runServer({
      config,
      name: NAME,
      version: VERSION,
    });
  } catch (error) {
    // stderr로 에러 출력 (stdout은 MCP 통신용)
    console.error('Failed to start ECOUNT MCP server:', error);
    process.exit(1);
  }
}

// 메인 실행
main();

// 모듈 export
export { createServer, runServer } from './server.js';
export { EcountClient } from './client/index.js';
export * from './types/index.js';
export * from './utils/index.js';
