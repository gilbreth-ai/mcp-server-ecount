# ECOUNT MCP 서버

[English](README.md) | [한국어](README_KO.md)

[ECOUNT ERP](https://www.ecount.com/) OpenAPI를 위한 Model Context Protocol (MCP) 서버입니다.

[![npm version](https://badge.fury.io/js/mcp-server-ecount.svg)](https://www.npmjs.com/package/mcp-server-ecount)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 개요

이 MCP 서버는 Claude와 같은 AI 어시스턴트가 자연어로 ECOUNT ERP와 상호작용할 수 있게 해줍니다. ECOUNT OpenAPI를 세션 관리, 호출 제한, 캐싱 기능과 함께 래핑합니다.

### 주요 기능

- **22개 도구** - 품목, 거래처, 재고, 판매, 구매, 생산, 회계, 오픈마켓, 근태, 게시판
- **자동 세션 관리** - Zone 캐싱, 만료 시 자동 갱신, 파일 기반 영속성
- **스마트 쓰로틀링** - 지능형 대기로 호출 제한 자동 관리 (수동 재시도 불필요)
- **멀티 프로세스 지원** - 파일 기반 호출 제한 상태 공유
- **응답 캐싱** - 조회 결과 10분 캐싱
- **에러 처리** - 연속 에러 모니터링 및 사용자 친화적 메시지

## 빠른 시작

### 사전 요구사항

- Master ID 권한이 있는 **ECOUNT ERP 계정**
- **API 인증키** ([발급 방법](#api-인증키-발급))
- **Node.js 18 이상**

### 설치

#### Claude Desktop

`claude_desktop_config.json`에 추가:

```json
{
  "mcpServers": {
    "ecount": {
      "command": "npx",
      "args": ["-y", "mcp-server-ecount"],
      "env": {
        "ECOUNT_COM_CODE": "회사코드",
        "ECOUNT_USER_ID": "사용자ID",
        "ECOUNT_API_CERT_KEY": "API인증키"
      }
    }
  }
}
```

#### Claude Code

```bash
claude mcp add mcp-server-ecount -e ECOUNT_COM_CODE=회사코드 -e ECOUNT_USER_ID=사용자ID -e ECOUNT_API_CERT_KEY=인증키
```

또는 프로젝트의 `.mcp.json`에 추가:

```json
{
  "mcpServers": {
    "ecount": {
      "command": "npx",
      "args": ["-y", "mcp-server-ecount"],
      "env": {
        "ECOUNT_COM_CODE": "회사코드",
        "ECOUNT_USER_ID": "사용자ID",
        "ECOUNT_API_CERT_KEY": "API인증키"
      }
    }
  }
}
```

## 도구 목록

### 연결 및 상태

| 도구                      | 설명                                           |
| ------------------------- | ---------------------------------------------- |
| `ecount_test_connection`  | API 연결 테스트                                |
| `ecount_get_session_info` | 현재 세션 상태 조회                            |
| `ecount_server_status`    | 서버 내부 상태 조회 (호출 제한, 캐시, 에러 등) |

### 품목

| 도구                    | 설명             | 호출 제한 |
| ----------------------- | ---------------- | --------- |
| `ecount_get_product`    | 단일 품목 조회   | 1초       |
| `ecount_get_products`   | 품목 목록 조회   | 10분      |
| `ecount_create_product` | 품목 등록        | 10초      |

### 거래처

| 도구                     | 설명        | 호출 제한 |
| ------------------------ | ----------- | --------- |
| `ecount_create_customer` | 거래처 등록 | 10초      |

### 재고

| 도구                                     | 설명                         | 호출 제한 |
| ---------------------------------------- | ---------------------------- | --------- |
| `ecount_get_inventory`                   | 단일 품목 재고 조회          | 1초       |
| `ecount_get_inventory_list`              | 품목 목록 재고 조회          | 10분      |
| `ecount_get_inventory_by_warehouse`      | 창고별 재고 조회 (단일)      | 1초       |
| `ecount_get_inventory_by_warehouse_list` | 창고별 재고 조회 (복수)      | 10분      |

### 판매

| 도구                       | 설명        | 호출 제한 |
| -------------------------- | ----------- | --------- |
| `ecount_create_quotation`  | 견적서 등록 | 10초      |
| `ecount_create_sale_order` | 수주 등록   | 10초      |
| `ecount_create_sale`       | 판매 전표 등록 | 10초   |

### 구매

| 도구                         | 설명           | 호출 제한 |
| ---------------------------- | -------------- | --------- |
| `ecount_get_purchase_orders` | 발주 목록 조회 | 10분      |
| `ecount_create_purchase`     | 구매 전표 등록 | 10초      |

### 생산

| 도구                          | 설명           | 호출 제한 |
| ----------------------------- | -------------- | --------- |
| `ecount_create_job_order`     | 작업지시 등록  | 10초      |
| `ecount_create_goods_issued`  | 불출 전표 등록 | 10초      |
| `ecount_create_goods_receipt` | 생산 입고 등록 | 10초      |

### 회계

| 도구                    | 설명                                | 호출 제한 |
| ----------------------- | ----------------------------------- | --------- |
| `ecount_create_invoice` | 매출/매입 세금계산서 등록 (자동 분개) | 10초    |

### 오픈마켓

| 도구                             | 설명                     | 호출 제한 |
| -------------------------------- | ------------------------ | --------- |
| `ecount_create_openmarket_order` | 오픈마켓 주문 연동       | 10초      |

### 근태

| 도구                         | 설명        | 호출 제한 |
| ---------------------------- | ----------- | --------- |
| `ecount_create_clock_in_out` | 출퇴근 기록 | 10초      |

### 게시판

| 도구                       | 설명          | 호출 제한 |
| -------------------------- | ------------- | --------- |
| `ecount_create_board_post` | 게시글 등록   | 10초      |

## 설정

### 환경 변수

| 변수                     | 필수 | 설명                                |
| ------------------------ | ---- | ----------------------------------- |
| `ECOUNT_COM_CODE`        | 예   | ECOUNT 회사코드 (6자리)             |
| `ECOUNT_USER_ID`         | 예   | ECOUNT 사용자 ID (Master ID만 가능) |
| `ECOUNT_API_CERT_KEY`    | 예   | API 인증키                          |
| `ECOUNT_USE_TEST_SERVER` | 아니오 | 테스트 서버 사용 (`true`)         |
| `ECOUNT_SESSION_FILE`    | 아니오 | 세션 파일 경로 (영속성)           |
| `ECOUNT_RATE_LIMIT_FILE` | 아니오 | 호출 제한 상태 파일 (멀티 프로세스) |
| `DEBUG`                  | 아니오 | 디버그 로깅 활성화 (`true`)       |

### API 인증키 발급

1. **Master ID**로 ECOUNT ERP 로그인
2. `자체설정` > `외부연결설정` > `Open API 관리` 이동
3. API 사용 신청 후 인증키 발급
4. 개발 시에는 테스트키로 시작하고, 검증 후 운영키 발급

> **참고**: Master ID만 API 인증키를 발급받을 수 있습니다.

## 호출 제한

ECOUNT OpenAPI는 엄격한 호출 제한이 있습니다:

| API 유형     | 운영 서버 | 테스트 서버 |
| ------------ | --------- | ----------- |
| Zone/로그인  | 10분      | 10초        |
| 일괄 조회    | 10분      | 10초        |
| 단일 조회    | 1초       | 1초         |
| 저장         | 10초      | 10초        |

### 추가 제한

- 시간당 연속 에러: **30회** (초과 시 차단)
- 일일 API 호출: **5,000회**
- 저장 시 최대 항목: **300개**

### 스마트 쓰로틀링

이 MCP 서버는 지능적인 호출 제한 관리 기능을 제공합니다:

| API 유형         | 자동 대기 | 최대 대기 |
| ---------------- | --------- | --------- |
| 단일 조회 (1초)  | ✅ 예     | 5초       |
| 저장 (10초)      | ✅ 예     | 15초      |
| 일괄 조회 (10분) | ❌ 아니오 | 에러      |
| Zone/로그인 (10분) | ❌ 아니오 | 에러    |

- **자동 대기**: 짧은 간격(1초, 10초)의 경우 서버가 자동으로 대기 후 재시도
- **멀티 프로세스 안전**: `ECOUNT_RATE_LIMIT_FILE` 설정 시 모든 인스턴스 간 호출 제한 상태 공유
- **100ms 안전 마진**: 모든 간격에 안전 마진 포함

자동 대기 임계값을 초과하면 남은 대기 시간과 함께 친절한 에러 메시지가 반환됩니다.

## 보안

**절대로 API 자격증명을 코드에 직접 작성하지 마세요!**

```bash
# 개발용 .env 파일 생성
ECOUNT_COM_CODE=회사코드
ECOUNT_USER_ID=사용자ID
ECOUNT_API_CERT_KEY=인증키

# .gitignore에 추가
echo ".env" >> .gitignore
```

> **경고**: ECOUNT 자격증명이 유출되면 전체 ERP 시스템이 위험에 노출될 수 있습니다.

## 개발

```bash
# 저장소 클론
git clone https://github.com/gilbreth-ai/mcp-server-ecount.git
cd mcp-server-ecount

# 의존성 설치
npm install

# 빌드
npm run build

# 개발 모드
npm run dev

# MCP Inspector로 테스트
npm run inspect
```

### 프로젝트 구조

```
mcp-server-ecount/
├── src/
│   ├── index.ts              # 진입점
│   ├── server.ts             # MCP 서버 설정
│   ├── client/
│   │   ├── ecount-client.ts  # API 클라이언트
│   │   ├── session-manager.ts
│   │   ├── rate-limiter.ts
│   │   ├── cache.ts
│   │   └── error-counter.ts
│   ├── tools/
│   │   ├── register.ts       # 도구 등록
│   │   └── schemas.ts        # Zod 스키마
│   ├── types/
│   └── utils/
├── docs/                     # API 문서
├── package.json
└── README.md
```

## 사용 예시

### 재고 확인

```
사용자: "품목 A001의 창고별 재고 현황 알려줘"

Claude가 ecount_get_inventory_by_warehouse 도구를 사용합니다.

결과:
- 본사 창고: 100개
- 물류센터: 50개
- 매장: 25개
합계: 175개
```

### 판매 전표 등록

```
사용자: "거래처 C001에 품목 A001 10개를 개당 1,000원에 판매 등록해줘"

Claude가 ecount_create_sale 도구를 사용합니다.

결과:
- 전표번호: 20240115-1
- 성공: 1건
```

### 재고 부족 알림 및 발주 의사결정 지원

```
사용자: "재고 5개 미만인 품목들 보여주고,
       최근 구매 단가랑 함께 적정 발주량 추천해줘"

Claude가 ecount_get_inventory_list, ecount_get_products 도구를 사용합니다.

결과:
- 품목 A: 재고 3개, 최근 단가 5,000원 → 추천 발주량: 20개
- 품목 B: 재고 2개, 최근 단가 12,000원 → 추천 발주량: 15개
- 품목 C: 재고 1개, 최근 단가 8,000원 → 추천 발주량: 25개
예상 총 비용: 456,000원
```

### 자연어 거래처 등록

```
사용자: "새 거래처 등록해줘: ABC상사, 사업자번호 123-45-67890,
       대표자 홍길동, 주소 서울시 강남구 테헤란로 123"

Claude가 ecount_create_customer 도구를 사용합니다.

결과:
- 거래처 코드: C0042 (자동 생성)
- 등록 완료
```

### 분석 결과를 ERP 게시판에 게시

```
사용자: "매출 추이 분석 결과를 정리해서 사내 게시판에 올려줘"

Claude가 ecount_create_board_post 도구를 사용합니다.

결과:
- 게시판: 공지사항
- 제목: [분석] 상반기 매출 추이 요약
- 게시 완료
```

## 문제 해결

### 저장 시 "항목을 찾을 수 없음" 에러

ECOUNT ERP에서 "웹데이터 업로드" 설정이 필요합니다:

1. 해당 입력 메뉴로 이동 (예: 판매 > 판매입력)
2. 하단의 "웹데이터 업로드" 버튼 클릭
3. "업로드 항목 추가"로 필요한 항목 추가

### 세션이 자주 만료됨

ERP 설정에서 자동 로그아웃 시간을 늘리세요:

- `ERP설정` > `보안설정` > `자동 로그아웃 시간`

### 호출 제한 초과

쿨다운 기간 동안 대기하세요. `ecount_server_status`로 현재 호출 제한 상태를 확인할 수 있습니다.

## 면책 조항

이 프로젝트는 ECOUNT와 공식적인 제휴 관계가 없는 커뮤니티 프로젝트입니다.
ECOUNT OpenAPI 사용에는 유효한 ECOUNT 계정과 API 인증키가 필요합니다.
모든 API 사용은 ECOUNT 이용약관의 적용을 받습니다.

## 라이선스

MIT

## 기여하기

버그 리포트, 기능 요청, PR을 환영합니다!

- [이슈](https://github.com/gilbreth-ai/mcp-server-ecount/issues)
- [풀 리퀘스트](https://github.com/gilbreth-ai/mcp-server-ecount/pulls)
