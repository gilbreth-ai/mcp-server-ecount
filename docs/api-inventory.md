# 출력물 API (재고현황)

## 1. 재고현황 조회 - 단건 (ViewInventoryBalanceStatus)

### 개요
외부 서비스와 연계를 통해서 ERP의 재고현황을 조회할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/InventoryBalance/ViewInventoryBalanceStatus?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/InventoryBalance/ViewInventoryBalanceStatus?SESSION_ID={SESSION_ID}` |
| Rate Limit | 1초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| BASE_DATE | 검색일시 | STRING(8) | YYYYMMDD 형식 |
| PROD_CD | 품목코드 | TEXT | 조회할 품목코드. 최대 20자 |

#### 선택 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| WH_CD | 창고코드 | STRING(8000) | 조회할 창고코드. 최대 20자 |
| ZERO_FLAG | 재고수량0포함 | CHAR(1) | Y/N (기본값: N) |
| BAL_FLAG | 수량관리제외품목포함 | CHAR(1) | Y/N (기본값: N) |
| DEL_GUBUN | 사용중단품목포함 | CHAR(1) | Y/N (기본값: N) |
| SAFE_FLAG | 안전재고설정미만표시 | CHAR(1) | Y/N (기본값: N) |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 허용 수량 정보 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |
| Data.TotalCnt | 성공건수 | Y | 조회 성공한 창고별 품목 수 |
| Data.Result[] | 결과 목록 | Y | 재고 목록 |

### Result 항목
| 변수 | 변수명 | 설명 |
|------|--------|------|
| PROD_CD | 품목코드 | 품목코드 |
| BAL_QTY | 재고수량 | 재고수량 |

### Example Request
```json
{
  "PROD_CD": "00001",
  "WH_CD": "",
  "BASE_DATE": "20190606"
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
    "TotalCnt": 1,
    "Result": [
      {
        "PROD_CD": "00001",
        "BAL_QTY": "-1.0000000000"
      }
    ]
  },
  "Status": "200",
  "Error": null
}
```

### Example Response (Fail)
```json
{
  "Data": null,
  "Status": "500",
  "Error": {
    "Code": 0,
    "Message": "Check Parameter [BASE_DATE]",
    "MessageDetail": ""
  }
}
```

---

## 2. 재고현황 조회 - 다건 (GetListInventoryBalanceStatus)

### 개요
외부 서비스와 연계를 통해서 ERP의 재고현황을 조회할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/InventoryBalance/GetListInventoryBalanceStatus?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/InventoryBalance/GetListInventoryBalanceStatus?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10분에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| BASE_DATE | 검색일시 | STRING(8) | YYYYMMDD 형식 |

#### 선택 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| PROD_CD | 품목코드 | TEXT | 조회할 품목코드. 최대 20자 |
| WH_CD | 창고코드 | STRING(8000) | 조회할 창고코드. 최대 20자 |
| ZERO_FLAG | 재고수량0포함 | CHAR(1) | Y/N (기본값: N) |
| BAL_FLAG | 수량관리제외품목포함 | CHAR(1) | Y/N (기본값: N) |
| DEL_GUBUN | 사용중단품목포함 | CHAR(1) | Y/N (기본값: N) |
| SAFE_FLAG | 안전재고설정미만표시 | CHAR(1) | Y/N (기본값: N) |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 허용 수량 정보 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |
| Data.TotalCnt | 성공건수 | Y | 조회 성공한 창고별 품목 수 |
| Data.Result[] | 결과 목록 | Y | 재고 목록 |

### Result 항목
| 변수 | 변수명 | 설명 |
|------|--------|------|
| PROD_CD | 품목코드 | 품목코드 |
| BAL_QTY | 재고수량 | 재고수량 |

### Example Request
```json
{
  "PROD_CD": "",
  "WH_CD": "",
  "BASE_DATE": "20190606"
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
    "TotalCnt": 1,
    "Result": [
      {
        "PROD_CD": "00001",
        "BAL_QTY": "-1.0000000000"
      }
    ]
  },
  "Status": "200",
  "Error": null
}
```

### Example Response (Fail)
```json
{
  "Data": null,
  "Status": "500",
  "Error": {
    "Code": 0,
    "Message": "Check Parameter [BASE_DATE]",
    "MessageDetail": ""
  }
}
```

---

## 3. 창고별 재고현황 조회 - 단건 (ViewInventoryBalanceStatusByLocation)

### 개요
외부 서비스와 연계를 통해서 ERP의 창고별 재고현황을 조회할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/InventoryBalance/ViewInventoryBalanceStatusByLocation?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/InventoryBalance/ViewInventoryBalanceStatusByLocation?SESSION_ID={SESSION_ID}` |
| Rate Limit | 1초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| BASE_DATE | 검색일시 | STRING(8) | YYYYMMDD 형식 |
| PROD_CD | 품목코드 | STRING(2000) | 조회할 품목코드. 최대 20자 |

#### 선택 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| WH_CD | 창고코드 | STRING(700) | 조회할 창고코드. 최대 20자 |
| BAL_FLAG | 수량관리제외품목포함 | CHAR(1) | Y/N (기본값: N) |
| DEL_GUBUN | 사용중단품목포함 | CHAR(1) | Y/N (기본값: N) |
| DEL_LOCATION_YN | 사용중단/삭제창고포함 | CHAR(1) | Y/N (기본값: N) |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 허용 수량 정보 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |
| Data.TotalCnt | 성공건수 | Y | 조회 성공한 창고별 품목 수 |
| Data.Result[] | 결과 목록 | Y | 창고별 재고 목록 |

### Result 항목
| 변수 | 변수명 | 설명 |
|------|--------|------|
| WH_CD | 창고코드 | 창고코드 |
| WH_DES | 창고명 | 창고명 |
| PROD_CD | 품목코드 | 품목코드 |
| PROD_DES | 품목명 | 품목명 |
| PROD_SIZE_DES | 품목명[규격] | 품목명[규격] |
| BAL_QTY | 재고수량 | 재고수량 |

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
      {
        "WH_CD": "00035",
        "WH_DES": "123",
        "PROD_CD": "00016",
        "PROD_DES": "new",
        "PROD_SIZE_DES": "new",
        "BAL_QTY": "3.0000000000"
      },
      {
        "WH_CD": "00033",
        "WH_DES": "22323",
        "PROD_CD": "00016",
        "PROD_DES": "new",
        "PROD_SIZE_DES": "new",
        "BAL_QTY": "1.0000000000"
      },
      {
        "WH_CD": "00014",
        "WH_DES": "창고14",
        "PROD_CD": "00016",
        "PROD_DES": "new",
        "PROD_SIZE_DES": "new",
        "BAL_QTY": "-1.0000000000"
      }
    ]
  },
  "Status": "200",
  "Error": null
}
```

### Example Response (Fail)
```json
{
  "Data": null,
  "Status": "500",
  "Error": {
    "Code": 0,
    "Message": "Check Parameter [BASE_DATE]",
    "MessageDetail": ""
  }
}
```

---

## 4. 창고별 재고현황 조회 - 다건 (GetListInventoryBalanceStatusByLocation)

### 개요
외부 서비스와 연계를 통해서 ERP의 창고별 재고현황을 조회할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/InventoryBalance/GetListInventoryBalanceStatusByLocation?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/InventoryBalance/GetListInventoryBalanceStatusByLocation?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10분에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| BASE_DATE | 검색일시 | STRING(8) | YYYYMMDD 형식 |

#### 선택 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| PROD_CD | 품목코드 | STRING(2000) | 조회할 품목코드. 최대 20자 |
| WH_CD | 창고코드 | STRING(700) | 조회할 창고코드. 최대 20자 |
| BAL_FLAG | 수량관리제외품목포함 | CHAR(1) | Y/N (기본값: N) |
| DEL_GUBUN | 사용중단품목포함 | CHAR(1) | Y/N (기본값: N) |
| DEL_LOCATION_YN | 사용중단/삭제창고포함 | CHAR(1) | Y/N (기본값: N) |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 허용 수량 정보 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |
| Data.TotalCnt | 성공건수 | Y | 조회 성공한 창고별 품목 수 |
| Data.Result[] | 결과 목록 | Y | 창고별 재고 목록 |

### Result 항목
| 변수 | 변수명 | 설명 |
|------|--------|------|
| WH_CD | 창고코드 | 창고코드 |
| WH_DES | 창고명 | 창고명 |
| PROD_CD | 품목코드 | 품목코드 |
| PROD_DES | 품목명 | 품목명 |
| PROD_SIZE_DES | 품목명[규격] | 품목명[규격] |
| BAL_QTY | 재고수량 | 재고수량 |

### Example Request
```json
{
  "PROD_CD": "",
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
      {
        "WH_CD": "00035",
        "WH_DES": "123",
        "PROD_CD": "00016",
        "PROD_DES": "new",
        "PROD_SIZE_DES": "new",
        "BAL_QTY": "3.0000000000"
      },
      {
        "WH_CD": "00033",
        "WH_DES": "22323",
        "PROD_CD": "00016",
        "PROD_DES": "new",
        "PROD_SIZE_DES": "new",
        "BAL_QTY": "1.0000000000"
      },
      {
        "WH_CD": "00014",
        "WH_DES": "창고14",
        "PROD_CD": "00016",
        "PROD_DES": "new",
        "PROD_SIZE_DES": "new",
        "BAL_QTY": "-1.0000000000"
      }
    ]
  },
  "Status": "200",
  "Error": null
}
```

### Example Response (Fail)
```json
{
  "Data": null,
  "Status": "500",
  "Error": {
    "Code": 0,
    "Message": "Check Parameter [BASE_DATE]",
    "MessageDetail": ""
  }
}
```
