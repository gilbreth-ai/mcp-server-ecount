# 영업관리 API

## 1. 견적서 입력 (SaveQuotation)

### 개요
외부 서비스와 연계를 통해서 ERP의 견적을 입력할 수 있습니다.

> **주의**: ERP 내 기본 입력화면 양식에 추가된 항목만 입력할 수 있습니다. 입력 API의 양식필수 항목은 회사코드별로 상이하며, 입력화면 양식에 추가되지 않은 항목 전송 시 해당 항목의 데이터는 입력되지 않습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/Quotation/SaveQuotation?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/Quotation/SaveQuotation?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| UPLOAD_SER_NO | 순번 | SMALLINT(4,0) | 동일한 전표로 묶고자 하는 경우 동일 순번 부여. 최대 4자 |
| PROD_CD | 품목코드 | STRING(20) | ERP 품목코드 |
| QTY | 수량 | NUMERIC(28,10) | 견적수량 |

#### 상단 항목 (전표 정보)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| IO_DATE | 일자 | STRING(8) | 견적서일자. YYYYMMDD. 미입력시 현재일 |
| CUST | 거래처코드 | STRING(30) | 견적거래처코드 |
| CUST_DES | 거래처명 | STRING(100) | 견적거래처명. 미입력시 거래처코드에 해당하는 명 입력 |
| EMP_CD | 담당자 | STRING(30) | 담당자코드 |
| WH_CD | 출하창고 | STRING(5) | 출하창고코드 |
| IO_TYPE | 구분(거래유형) | STRING(2) | 부가세유형코드 |
| EXCHANGE_TYPE | 외화종류 | STRING(5) | 외자인 경우 외화코드 |
| EXCHANGE_RATE | 환율 | NUMERIC(18,4) | 외자인 경우 환율 |
| PJT_CD | 프로젝트 | STRING(14) | 프로젝트코드 |
| DOC_NO | 견적No. | STRING(30) | 견적번호 (직접입력 설정시) |
| TTL_CTT | 제목 | STRING(200) | 제목 |
| REF_DES | 참조 | STRING(200) | 참조사항 |
| COLL_TERM | 결제조건 | STRING(200) | 결제조건 |
| AGREE_TERM | 유효기간 | STRING(200) | 유효기간 |
| U_MEMO1~5 | 문자형식1~5 | STRING(200) | 추가 문자 항목 |
| U_TXT1 | 장문형식1 | STRING(2000) | 장문 항목 |

#### 하단 항목 (품목 정보)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| PROD_DES | 품목명 | STRING(100) | 품목명. 미입력시 품목코드에 해당하는 명 입력 |
| SIZE_DES | 규격 | STRING(100) | 규격 |
| UQTY | 추가수량 | NUMERIC(28,10) | 추가수량 (설정시에만) |
| PRICE | 단가 | NUMERIC(18,6) | 견적단가 |
| USER_PRICE_VAT | 단가(VAT포함) | NUMERIC(28,10) | VAT포함 단가 |
| SUPPLY_AMT | 공급가액(원화) | NUMERIC(28,4) | 공급가액 |
| SUPPLY_AMT_F | 공급가액(외화) | NUMERIC(28,4) | 외화 공급가액 |
| VAT_AMT | 부가세 | NUMERIC(28,4) | 부가세 |
| REMARKS | 적요 | STRING(200) | 적요 |
| ITEM_CD | 관리항목 | STRING(14) | 관리항목코드 |
| P_AMT1~2 | 금액1~2 | NUMERIC(28,10) | 추가 금액 항목 |
| P_REMARKS1~3 | 적요1~3 | STRING(100) | 추가 적요 항목 |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.SuccessCnt | 성공건수 | Y | 성공한 건수 |
| Data.FailCnt | 실패건수 | Y | 실패한 건수 |
| Data.ResultDetails | 처리결과 | Y | 상세 처리 결과 (JSON 배열) |
| Data.SlipNos | 견적번호 | Y | ERP 견적번호 (실패시 공백) |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 1시간, 1일 동안 전송할 수 있는 허용 수량 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |

### Example Request
```json
{
  "QuotationList": [{
    "BulkDatas": {
      "IO_DATE": "20200213",
      "UPLOAD_SER_NO": "1",
      "CUST": "00001",
      "WH_CD": "00001",
      "PROD_CD": "00001",
      "PROD_DES": "테스트품목",
      "QTY": "10",
      "PRICE": "1000"
    }
  }]
}
```

### Example Response (Success)
```json
{
  "Data": {
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 1/30, 1시간 허용량: 3/6000, 1일 허용량: 3/10000",
    "TRACE_ID": "db6138411aad40e42dc5e209f65f6f3c",
    "SuccessCnt": 2,
    "FailCnt": 0,
    "ResultDetails": "[{\"IsSuccess\": true, \"TotalError\": \"[전표묶음 0] OK\", \"Errors\": [], \"Code\": null}]",
    "SlipNos": "[\"20200213-2\"]"
  },
  "Status": "200",
  "Error": null
}
```

### Example Response (Fail)
```json
{
  "Data": {
    "SuccessCnt": 0,
    "FailCnt": 2,
    "ResultDetails": "[{\"IsSuccess\": false, \"TotalError\": \"[전표묶음 0] 일자 (편집제한일자)\", \"Errors\": [{\"ColCd\": \"IO_DATE\", \"Message\": \"일자 (편집제한일자)\"}], \"Code\": null}]",
    "SlipNos": null
  },
  "Status": "200",
  "Error": null
}
```

---

## 2. 주문서 입력 (SaveSaleOrder)

### 개요
외부 서비스와 연계를 통해서 ERP의 주문을 입력할 수 있습니다.

> **주의**: ERP 내 기본 입력화면 양식에 추가된 항목만 입력할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/SaleOrder/SaveSaleOrder?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/SaleOrder/SaveSaleOrder?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| UPLOAD_SER_NO | 순번 | SMALLINT(4,0) | 동일한 전표로 묶고자 하는 경우 동일 순번 부여 |
| CUST | 거래처코드 | STRING(30) | 주문거래처코드 |
| WH_CD | 출하창고 | STRING(5) | 출하창고코드 |
| PROD_CD | 품목코드 | STRING(20) | ERP 품목코드 |
| QTY | 수량 | NUMERIC(28,10) | 주문수량 |

#### 상단 항목 (전표 정보)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| IO_DATE | 일자 | STRING(8) | 주문일자. YYYYMMDD. 미입력시 현재일 |
| CUST_DES | 거래처명 | STRING(100) | 주문거래처명 |
| EMP_CD | 담당자 | STRING(30) | 담당자코드 |
| IO_TYPE | 구분(거래유형) | STRING(2) | 부가세유형코드 |
| EXCHANGE_TYPE | 외화종류 | STRING(5) | 외자인 경우 외화코드 |
| EXCHANGE_RATE | 환율 | NUMERIC(18,4) | 외자인 경우 환율 |
| PJT_CD | 프로젝트 | STRING(14) | 프로젝트코드 |
| DOC_NO | 주문No. | STRING(30) | 주문번호 (직접입력 설정시) |
| TTL_CTT | 제목 | STRING(200) | 제목 |
| REF_DES | 참조 | STRING(200) | 참조사항 |
| COLL_TERM | 결제조건 | STRING(200) | 결제조건 |
| AGREE_TERM | 유효기간 | STRING(200) | 유효기간 |
| TIME_DATE | 납기일자 | STRING(8) | 납기일자. YYYYMMDD |
| REMARKS_WIN | 검색창내용 | STRING(50) | 검색창내용 |
| U_MEMO1~5 | 문자형식1~5 | STRING(200) | 추가 문자 항목 |
| U_TXT1 | 장문형식1 | STRING(2000) | 장문 항목 |

#### 하단 항목 (품목 정보)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| PROD_DES | 품목명 | STRING(100) | 품목명 |
| SIZE_DES | 규격 | STRING(100) | 규격 |
| UQTY | 추가수량 | NUMERIC(28,10) | 추가수량 |
| PRICE | 단가 | NUMERIC(18,6) | 주문단가 |
| USER_PRICE_VAT | 단가(VAT포함) | NUMERIC(28,10) | VAT포함 단가 |
| SUPPLY_AMT | 공급가액(원화) | NUMERIC(28,4) | 공급가액 |
| SUPPLY_AMT_F | 공급가액(외화) | NUMERIC(28,4) | 외화 공급가액 |
| VAT_AMT | 부가세 | NUMERIC(28,4) | 부가세 |
| ITEM_TIME_DATE | 품목별납기일자 | STRING(8) | 품목별납기일자. YYYYMMDD |
| REMARKS | 적요 | STRING(200) | 적요 |
| ITEM_CD | 관리항목 | STRING(14) | 관리항목코드 |
| REL_DATE | 견적일자 | STRING(8) | 견적일자 |
| REL_NO | 견적번호 | NUMERIC(5,0) | 견적번호 |
| P_AMT1~2 | 금액1~2 | NUMERIC(28,10) | 추가 금액 항목 |
| P_REMARKS1~3 | 적요1~3 | STRING(100) | 추가 적요 항목 |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.SuccessCnt | 성공건수 | Y | 성공한 건수 |
| Data.FailCnt | 실패건수 | Y | 실패한 건수 |
| Data.ResultDetails | 처리결과 | Y | 상세 처리 결과 |
| Data.SlipNos | 주문번호 | Y | ERP 주문번호 (실패시 공백) |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 허용 수량 정보 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |

### Example Request
```json
{
  "SaleOrderList": [{
    "BulkDatas": {
      "IO_DATE": "20180612",
      "UPLOAD_SER_NO": "1",
      "CUST": "00016",
      "CUST_DES": "(주)동희산업",
      "WH_CD": "00009",
      "PROD_CD": "00001",
      "PROD_DES": "test",
      "QTY": "1",
      "PRICE": "1000"
    }
  }]
}
```

### Example Response (Success)
```json
{
  "Data": {
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 1/30, 1시간 허용량: 8/6000, 1일 허용량: 8/10000",
    "TRACE_ID": "db6138411aad40e42dc5e209f65f6f3c",
    "SuccessCnt": 2,
    "FailCnt": 0,
    "ResultDetails": "[{\"IsSuccess\": true, \"TotalError\": \"[전표묶음0] OK\", \"Errors\": [], \"Code\": null}]",
    "SlipNos": "[\"20180612-2\"]"
  },
  "Status": "200",
  "Error": null
}
```

---

## 3. 판매 입력 (SaveSale)

### 개요
외부 서비스와 연계를 통해서 ERP의 판매를 입력할 수 있습니다.

> **주의**: ERP 내 기본 입력화면 양식에 추가된 항목만 입력할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/Sale/SaveSale?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/Sale/SaveSale?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| UPLOAD_SER_NO | 순번 | SMALLINT(4,0) | 동일한 전표로 묶고자 하는 경우 동일 순번 부여 |
| WH_CD | 출하창고 | STRING(5) | 출하창고코드 |
| PROD_CD | 품목코드 | STRING(20) | ERP 품목코드 |
| QTY | 수량 | NUMERIC(28,10) | 판매수량 |

#### 상단 항목 (전표 정보)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| IO_DATE | 판매일자 | STRING(8) | 판매일자. YYYYMMDD. 미입력시 현재일 |
| CUST | 거래처코드 | STRING(30) | 판매거래처코드 |
| CUST_DES | 거래처명 | STRING(50) | 판매거래처명 |
| EMP_CD | 담당자 | STRING(30) | 담당자코드 |
| IO_TYPE | 구분(거래유형) | STRING(2) | 부가세유형코드 |
| EXCHANGE_TYPE | 외화종류 | STRING(5) | 외자인 경우 외화코드 |
| EXCHANGE_RATE | 환율 | NUMERIC(18,4) | 외자인 경우 환율 |
| SITE | 부서 | STRING(100) | 부서코드 |
| PJT_CD | 프로젝트 | STRING(14) | 프로젝트코드 |
| DOC_NO | 판매No. | STRING(30) | 판매번호 (직접입력 설정시) |
| TTL_CTT | 제목 | STRING(200) | 제목 |
| U_MEMO1~5 | 문자형식1~5 | STRING(200) | 추가 문자 항목 |
| U_TXT1 | 장문형식1 | STRING(2000) | 장문 항목 |

#### 하단 항목 (품목 정보)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| PROD_DES | 품목명 | STRING(100) | 품목명 |
| SIZE_DES | 규격 | STRING(100) | 규격 |
| UQTY | 추가수량 | NUMERIC(28,10) | 추가수량 |
| PRICE | 단가 | NUMERIC(28,10) | 판매단가 |
| USER_PRICE_VAT | 단가(VAT포함) | NUMERIC(28,10) | VAT포함 단가 |
| SUPPLY_AMT | 공급가액(원화) | NUMERIC(28,4) | 공급가액 |
| SUPPLY_AMT_F | 공급가액(외화) | NUMERIC(28,4) | 외화 공급가액 |
| VAT_AMT | 부가세 | NUMERIC(28,4) | 부가세 |
| REMARKS | 적요 | STRING(200) | 적요 |
| ITEM_CD | 관리항목 | STRING(14) | 관리항목코드 |
| P_AMT1~2 | 금액1~2 | NUMERIC(28,10) | 추가 금액 항목 |
| P_REMARKS1~3 | 적요1~3 | STRING(100) | 추가 적요 항목 |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.SuccessCnt | 성공건수 | Y | 성공한 건수 |
| Data.FailCnt | 실패건수 | Y | 실패한 건수 |
| Data.ResultDetails | 처리결과 | Y | 상세 처리 결과 |
| Data.SlipNos | 판매번호 | Y | ERP 판매번호 (실패시 공백) |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 허용 수량 정보 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |

### Example Request
```json
{
  "SaleList": [{
    "BulkDatas": {
      "IO_DATE": "20180612",
      "UPLOAD_SER_NO": "1",
      "CUST": "00001",
      "WH_CD": "00009",
      "PROD_CD": "00001",
      "PROD_DES": "test",
      "QTY": "1",
      "PRICE": "1000"
    }
  }]
}
```

### Example Response (Success)
```json
{
  "Data": {
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 0/30, 1시간 허용량: 9/6000, 1일 허용량: 9/10000",
    "TRACE_ID": "db6138411aad40e42dc5e209f65f6f3c",
    "SuccessCnt": 2,
    "FailCnt": 0,
    "ResultDetails": "[{\"IsSuccess\": true, \"TotalError\": \"[전표묶음0] OK\", \"Errors\": [], \"Code\": null}]",
    "SlipNos": "[\"20180612-2\"]"
  },
  "Status": "200",
  "Error": null
}
```

### Example Response (Fail)
```json
{
  "Data": {
    "SuccessCnt": 0,
    "FailCnt": 2,
    "ResultDetails": "[{\"IsSuccess\": false, \"TotalError\": \"[전표묶음0] 품목코드 (필수), 품목명 (필수), 수량 (필수)\", \"Errors\": [{\"ColCd\": \"PROD_CD\", \"Message\": \"품목코드 (필수)\"}, {\"ColCd\": \"PROD_DES\", \"Message\": \"품목명 (필수)\"}], \"Code\": null}]",
    "SlipNos": null
  },
  "Status": "200",
  "Error": null
}
```

