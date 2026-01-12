# 구매관리 API

## 1. 발주서 조회 (GetPurchasesOrderList)

### 개요
외부 서비스와 연계를 통해서 ERP의 발주서를 조회할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/Purchases/GetPurchasesOrderList?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/Purchases/GetPurchasesOrderList?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10분에 1회 |

### Request Parameters
| 변수 | 변수명 | 자릿수 | 필수 | 설명 |
|------|--------|--------|------|------|
| SESSION_ID | 세션ID | STRING(50) | Y | 로그인 API 호출 후 받은 SESSION_ID |
| PROD_CD | 품목코드 | STRING(1000) | N | 여러 품목 검색 시 '∬'로 구분. 최대 20자 |
| CUST_CD | 거래처코드 | STRING(1000) | N | 여러 거래처 검색 시 '∬'로 구분. 최대 30자 |

#### ListParam
| 변수 | 변수명 | 자릿수 | 필수 | 설명 |
|------|--------|--------|------|------|
| BASE_DATE_FROM | 검색 시작일시 | STRING(8) | Y | YYYYMMDD 형식 |
| BASE_DATE_TO | 검색 종료일시 | STRING(8) | Y | YYYYMMDD 형식. 최대 30일까지 조회 가능 |
| PAGE_CURRENT | 페이지번호 | INT | N | 기본값 1 |
| PAGE_SIZE | 표시줄수 | INT | N | 기본값 26, 최대값 100 |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.TotalCnt | 성공건수 | Y | 조회된 총 건수 |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 허용 수량 정보 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |
| Data.Result[] | 결과 목록 | Y | 발주서 목록 |

### Result 항목
| 변수 | 변수명 | 설명 |
|------|--------|------|
| ORD_NO | 발주번호 | 발주번호 |
| ORD_DATE | 일자 | 발주일자 |
| WH_CD | 창고코드 | 창고코드 |
| WH_DES | 창고명 | 창고명 |
| PJT_CD | 프로젝트코드 | 프로젝트코드 |
| PJT_DES | 프로젝트명 | 프로젝트명 |
| EMP_CD | 담당자코드 | 담당자코드 |
| CUST_NAME | 담당자명 | 담당자명 |
| CUST | 거래처코드 | 거래처코드 |
| CUST_DES | 거래처명 | 거래처명 |
| FOREIGN_FLAG | 내.외자구분 | 0:내자, 1:외자 |
| EXCHANGE_TYPE | 외화종류 | 외화코드 |
| CODE_DES | 외화명 | 외화명 |
| EXCHANGE_RATE | 환율 | 환율 |
| REF_DES | 참조 | 참조사항 |
| P_DES1~6 | 문자형식1~6 | 추가 문자 항목 |
| P_FLAG | 상태구분 | 1:진행중, 9:종결 |
| IO_TYPE | 거래유형 | 1:영업, 2:구매, 4:생산 |
| SEND_FLAG | 발주서발송 | 0:미전송, E:전송 |
| PROD_DES | 품목명[규격명] | 품목정보 |
| EDMS_DATE | 전자결재일자 | 전자결재일자 |
| EDMS_NO | 전자결재번호 | 전자결재번호 |
| EDMS_APP_TYPE | 전자결재상태 | 0:기안중, 1:결재중, 3:반려, 9:결재완료 |
| IO_DATE | 발주계획일자 | 발주계획일자 |
| IO_NO | 발주계획번호 | 발주계획번호 |
| WRITER_ID | 최초작성자 | 최초작성자 |
| WRITE_DT | 최초작성일자 | 최초작성일자 |
| LOGID | 최종수정자 | 최종수정자 |
| UPDATE_DATE | 최종수정일자 | 최종수정일자 |
| UQTY | 수량합계(추가수량) | 추가수량 합계 |
| QTY | 발주수량합계 | 발주수량 합계 |
| BUY_AMT | 발주공급가액합계 | 공급가액 합계 |
| VAT_AMT | 발주부가세합계 | 부가세 합계 |
| BUY_AMT_F | 발주외화금액합계 | 외화금액 합계 |
| TTL_CTT | 제목 | 제목 |
| TIME_DATE | 납기일자 | 납기일자 |

### Example Request
```json
{
  "PROD_CD": "",
  "CUST_CD": "",
  "ListParam": {
    "PAGE_CURRENT": 1,
    "PAGE_SIZE": 100,
    "BASE_DATE_FROM": "20190701",
    "BASE_DATE_TO": "20190730"
  }
}
```

### Example Response (Success)
```json
{
  "Data": {
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 0/30, 1시간 허용량: 3/6000, 1일 허용량: 11/10000",
    "TRACE_ID": "db6138411aad40e42dc5e209f65f6f3c",
    "Result": [
      {
        "ORD_NO": 2,
        "ORD_DATE": "20190729",
        "WH_CD": "00001",
        "WH_DES": "test",
        "PJT_CD": "00001",
        "PJT_DES": "프로젝트A",
        "EMP_CD": "100",
        "CUST_NAME": "테스트",
        "CUST": "2312891",
        "CUST_DES": "bmt",
        "FOREIGN_FLAG": "0",
        "P_FLAG": "9",
        "IO_TYPE": "21",
        "SEND_FLAG": "0",
        "QTY": "11.0000000000",
        "BUY_AMT": "0.0000",
        "VAT_AMT": "0.0000",
        "TTL_CTT": "2019/07/29-2 20190212",
        "TIME_DATE": "20190729"
      }
    ],
    "TotalCnt": 10
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
    "Message": "Search Range Is Less Than 31",
    "MessageDetail": ""
  }
}
```

---

## 2. 구매 입력 (SavePurchases)

### 개요
외부 서비스와 연계를 통해서 ERP의 구매를 입력할 수 있습니다.

> **주의**: ERP 내 기본 입력화면 양식에 추가된 항목만 입력할 수 있습니다. 입력 API의 양식필수 항목은 회사코드별로 상이합니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/Purchases/SavePurchases?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/Purchases/SavePurchases?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| UPLOAD_SER_NO | 순번 | SMALLINT(4,0) | 동일한 전표로 묶고자 하는 경우 동일 순번 부여. 최대 4자 |
| PROD_CD | 품목코드 | STRING(20) | ERP 품목코드. 최대 20자 |
| QTY | 수량 | NUMERIC(28,10) | 구매수량. 정수 최대 12자리, 소수 최대 2자리 |

#### 상단 항목 (전표 정보)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| IO_DATE | 일자 | STRING(8) | 구매일자. YYYYMMDD. 미입력시 현재일 |
| CUST | 거래처코드 | STRING(30) | 구매거래처코드. 최대 30자 |
| CUST_DES | 거래처명 | STRING(100) | 구매거래처명. 최대 100자 |
| EMP_CD | 담당자 | STRING(30) | 담당자코드. 최대 30자 |
| WH_CD | 입고창고 | STRING(5) | 입고창고코드. 최대 5자 |
| IO_TYPE | 구분(거래유형) | STRING(2) | 부가세유형코드 |
| EXCHANGE_TYPE | 외화종류 | STRING(5) | 외자인 경우 외화코드 |
| EXCHANGE_RATE | 환율 | NUMERIC(18,4) | 외자인 경우 환율. 정수 14자리, 소수 4자리 |
| SITE | 부서 | STRING(100) | 부서코드 |
| PJT_CD | 프로젝트 | STRING(14) | 프로젝트코드. 최대 14자 |
| DOC_NO | 구매No. | STRING(30) | 구매번호. 최대 30자 |
| TTL_CTT | 제목 | STRING(200) | 제목 |
| U_MEMO1~5 | 문자형식1~5 | STRING(200) | 추가 문자 항목. 최대 200자 |
| U_TXT1 | 장문형식1 | STRING(2000) | 장문 항목. 최대 2000자 |
| ORD_DATE | 발주일자 | STRING(20) | 발주내역 연동 시 발주일자. YYYYMMDD |
| ORD_NO | 발주번호 | SMALLINT(4,0) | 발주내역 연동 시 발주번호 |

#### 하단 항목 (품목 정보)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| PROD_DES | 품목명 | STRING(100) | 품목명. 최대 100자 |
| SIZE_DES | 규격 | STRING(100) | 규격. 최대 100자 |
| UQTY | 추가수량 | NUMERIC(28,10) | 추가수량. 정수 12자리, 소수 6자리 |
| PRICE | 단가 | NUMERIC(18,6) | 구매단가. 정수 12자리, 소수 0자리 |
| USER_PRICE_VAT | 단가(VAT포함) | NUMERIC(28,10) | VAT포함 단가. 정수 12자리, 소수 4자리 |
| SUPPLY_AMT | 공급가액(원화) | NUMERIC(28,4) | 공급가액. 정수 12자리, 소수 0자리 |
| SUPPLY_AMT_F | 공급가액(외화) | NUMERIC(28,4) | 외화 공급가액. 정수 15자리, 소수 4자리 |
| VAT_AMT | 부가세 | NUMERIC(28,4) | 부가세. 정수 12자리, 소수 0자리 |
| REMARKS | 적요 | STRING(200) | 적요. 최대 200자 |
| ITEM_CD | 관리항목 | STRING(14) | 관리항목코드. 최대 14자 |
| P_AMT1~2 | 금액1~2 | NUMERIC(28,10) | 추가 금액 항목. 정수 15자리, 소수 6자리 |
| P_REMARKS1~3 | 적요1~3 | STRING(100) | 추가 적요 항목. 최대 100자 |
| CUST_AMT | 부대비용 | NUMERIC(28,10) | 부대비용. 정수 12자리, 소수 0자리 |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.SuccessCnt | 성공건수 | Y | 성공한 건수 |
| Data.FailCnt | 실패건수 | Y | 실패한 건수 |
| Data.ResultDetails | 처리결과 | Y | 상세 처리 결과 |
| Data.SlipNos | 구매번호 | Y | ERP 구매번호 (실패시 공백) |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 허용 수량 정보 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |

### Example Request
```json
{
  "PurchasesList": [{
    "BulkDatas": {
      "IO_DATE": "20191012",
      "UPLOAD_SER_NO": "1",
      "CUST": "00001",
      "CUST_DES": "(주)OO산업",
      "WH_CD": "00001",
      "PROD_CD": "00001",
      "PROD_DES": "test",
      "QTY": "1",
      "PRICE": "1000",
      "SUPPLY_AMT": "1000",
      "VAT_AMT": "100"
    }
  }]
}
```

### Example Response (Success)
```json
{
  "Data": {
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 0/30, 1시간 허용량: 5/6000, 1일 허용량: 12/10000",
    "TRACE_ID": "db6138411aad40e42dc5e209f65f6f3c",
    "SuccessCnt": 1,
    "FailCnt": 0,
    "ResultDetails": "[{\"IsSuccess\": true, \"TotalError\": \"[전표묶음1] OK\", \"Errors\": [], \"Code\": null}]",
    "SlipNos": null
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
    "FailCnt": 1,
    "ResultDetails": "[{\"IsSuccess\": false, \"TotalError\": \"[전표묶음1] 품목코드 (필수), 품목명 (필수), 수량 (필수)\", \"Errors\": [{\"ColCd\": \"PROD_CD\", \"Message\": \"품목코드 (필수)\"}, {\"ColCd\": \"PROD_DES\", \"Message\": \"품목명 (필수)\"}], \"Code\": null}]",
    "SlipNos": null
  },
  "Status": "200",
  "Error": null
}
```

