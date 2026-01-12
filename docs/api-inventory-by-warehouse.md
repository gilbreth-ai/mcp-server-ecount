# 창고별 재고현황 API

## 1. 창고별재고현황 (단건)

### 개요
외부 서비스와 연계를 통해서 ERP의 재고현황을 조회할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/InventoryBalance/ViewInventoryBalanceStatusByLocation?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/InventoryBalance/ViewInventoryBalanceStatusByLocation?SESSION_ID={SESSION_ID}` |
| Rate Limit | 1초에 1회 |

### Request Parameters
| 변수 | 변수명 | 자릿수 | 필수 | 설명 |
|------|--------|--------|------|------|
| SESSION_ID | 세션ID | STRING(50) | Y | 로그인 API 호출 후 받은 SESSION_ID |
| BASE_DATE | 검색 일시 | STRING(8) | Y | YYYYMMDD 형식 |
| PROD_CD | 품목코드 | STRING(2000) | Y | 기 등록된 품목코드. 최대 20자 |
| WH_CD | 창고코드 | STRING(700) | N | 기 등록된 창고코드. 최대 20자 |
| BAL_FLAG | 수량관리제외품목포함 | CHAR(1) | N | 기본값 'N'. 입력값 'Y', 'N' |
| DEL_GUBUN | 사용중단품목포함 | CHAR(1) | N | 기본값 'N'. 입력값 'Y', 'N' |
| DEL_LOCATION_YN | 사용중단/삭제창고포함 | CHAR(1) | N | 기본값 'N'. 입력값 'Y', 'N' |

### Response
| 변수 | 변수명 | 자릿수 | 필수 | 설명 |
|------|--------|--------|------|------|
| Status | 처리결과 | | Y | 200(정상) |
| Error | 오류 | | N | 오류가 발생할 경우 |
| Data.EXPIRE_DATE | 만료일 | | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | | Y | 1시간, 1일 동안 전송할 수 있는 허용 수량 |
| Data.TRACE_ID | 로그확인용 일련번호 | | Y | 오류발생시 로그 확인용 |
| Data.TotalCnt | 성공건수 | Int | Y | 조회에 성공한 창고별 품목 수 |
| Data.Result[] | 결과 목록 | Array | Y | |

### Result 항목
| 변수 | 변수명 | 자릿수 | 필수 | 설명 |
|------|--------|--------|------|------|
| WH_CD | 창고코드 | STRING(20) | Y | 창고코드 |
| WH_DES | 창고명 | STRING(100) | Y | 창고명 |
| PROD_CD | 품목코드 | STRING(20) | Y | 품목코드 |
| PROD_DES | 품목명 | STRING(100) | Y | 품목명 |
| PROD_SIZE_DES | 품목명[규격] | STRING(100) | Y | 품목명[규격] |
| BAL_QTY | 재고수량 | INT | Y | 재고수량 |

### Example Request
```json
{
  "PROD_CD": "00001",
  "WH_CD": "",
  "BASE_DATE": "20210629"
}
```

### Example Response (Success)
```json
{
  "Data": {
    "IsSuccess": true,
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 0/30, 1시간 허용량: 8/6000, 1일 허용량: 8/10000",
    "TRACE_ID": "db6138411aad40e42dc5e209f65f6f3c",
    "TotalCnt": 3,
    "Result": [
      {"WH_CD": "00035", "WH_DES": "123", "PROD_CD": "00016", "PROD_DES": "new", "PROD_SIZE_DES": "new", "BAL_QTY": "3.0000000000"},
      {"WH_CD": "00033", "WH_DES": "22323", "PROD_CD": "00016", "PROD_DES": "new", "PROD_SIZE_DES": "new", "BAL_QTY": "1.0000000000"},
      {"WH_CD": "00014", "WH_DES": "창고14", "PROD_CD": "00016", "PROD_DES": "new", "PROD_SIZE_DES": "new", "BAL_QTY": "-1.0000000000"}
    ]
  },
  "Status": "200",
  "Error": null
}
```

---

## 2. 창고별재고현황 (다건)

### 개요
외부 서비스와 연계를 통해서 ERP의 재고현황을 조회할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/InventoryBalance/GetListInventoryBalanceStatusByLocation?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/InventoryBalance/GetListInventoryBalanceStatusByLocation?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10분에 1회 |

### Request Parameters
| 변수 | 변수명 | 자릿수 | 필수 | 설명 |
|------|--------|--------|------|------|
| SESSION_ID | 세션ID | STRING(50) | Y | 로그인 API 호출 후 받은 SESSION_ID |
| BASE_DATE | 검색 일시 | STRING(8) | Y | YYYYMMDD 형식 |
| WH_CD | 창고코드 | STRING(700) | N | 기 등록된 창고코드. 최대 20자 |
| PROD_CD | 품목코드 | STRING(2000) | N | 기 등록된 품목코드. 최대 20자 |
| BAL_FLAG | 수량관리제외품목포함 | CHAR(1) | N | 기본값 'N'. 입력값 'Y', 'N' |
| DEL_GUBUN | 사용중단품목포함 | CHAR(1) | N | 기본값 'N'. 입력값 'Y', 'N' |
| DEL_LOCATION_YN | 사용중단/삭제창고포함 | CHAR(1) | N | 기본값 'N'. 입력값 'Y', 'N' |

### Response
(단건과 동일)

### Result 항목
(단건과 동일)

### Example Request
```json
{
  "PROD_CD": "",
  "WH_CD": "",
  "BASE_DATE": "20210629"
}
```

### Example Response (Success)
(단건과 동일한 형식)
