# 생산관리 API

## 1. 작업지시서 입력 (SaveJobOrder)

### 개요
외부 서비스와 연계를 통해서 ERP의 작업지시서를 입력할 수 있습니다.

> **주의**: ERP 내 기본 입력화면 양식에 추가된 항목만 입력할 수 있습니다. 입력 API의 양식필수 항목은 회사코드별로 상이합니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/JobOrder/SaveJobOrder?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/JobOrder/SaveJobOrder?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| UPLOAD_SER_NO | 순번 | SMALLINT(4,0) | 동일한 전표로 묶고자 하는 경우 동일 순번 부여. 최대 4자 |
| PROD_CD | 품목코드 | STRING(20) | ERP 품목코드 |

#### 상단 항목 (전표 정보)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| IO_DATE | 일자 | STRING(8) | 작업지시서일자. YYYYMMDD. 미입력시 현재일 |
| CUST | 납품처코드 | STRING(30) | 납품처코드 |
| CUST_DES | 납품처명 | STRING(100) | 납품처명 |
| EMP_CD | 담당자 | STRING(30) | 담당자코드 |
| PJT_CD | 프로젝트 | STRING(14) | 프로젝트코드 |
| DOC_NO | 작업지시서No. | STRING(30) | 작업지시서 번호 |
| TTL_CTT | 제목 | STRING(200) | 제목 |
| TIME_DATE | 납기일자 | STRING(8) | 납기일자. YYYYMMDD |
| U_MEMO1~5 | 문자형식1~5 | STRING(200) | 추가 문자 항목 |
| U_TXT1 | 장문형식1 | STRING(2000) | 장문 항목 |

#### 하단 항목 (품목 정보)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| PROD_DES | 품목명 | STRING(100) | 품목명. 미입력시 품목코드에 해당하는 명 입력 |
| SIZE_DES | 규격 | STRING(100) | 규격 |
| UQTY | 추가수량 | NUMERIC(28,10) | 추가수량 |
| QTY | 수량 | NUMERIC(28,10) | 작업지시수량 |
| WH_CD | 창고코드 | STRING(5) | 작업지시 창고코드 |
| REMARKS | 적요 | STRING(200) | 적요 |
| ITEM_CD | 관리항목 | STRING(14) | 관리항목코드 |
| P_AMT1~2 | 금액1~2 | NUMERIC(28,10) | 추가 금액 항목 |
| P_REMARKS1~3 | 적요1~3 | STRING(100) | 추가 적요 항목 |
| PROD_BOM_DES | BOM버전 | STRING(100) | 생산품 BOM 버전. 미입력시 기본 BOM 버전 |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.SuccessCnt | 성공건수 | Y | 성공한 건수 |
| Data.FailCnt | 실패건수 | Y | 실패한 건수 |
| Data.ResultDetails | 처리결과 | Y | 상세 처리 결과 |
| Data.SlipNos | 작업지시서번호 | Y | ERP 작업지시서번호 (실패시 공백) |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 허용 수량 정보 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |

### Example Request
```json
{
  "JobOrderList": [{
    "BulkDatas": {
      "IO_DATE": "20180612",
      "UPLOAD_SER_NO": "1",
      "PROD_CD": "00001",
      "PROD_DES": "test",
      "QTY": "1",
      "WH_CD": "00001"
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
    "ResultDetails": "[{\"IsSuccess\": true, \"TotalError\": \"[전표묶음1] OK\", \"Errors\": [], \"Code\": null}]",
    "SlipNos": "[\"20180612-1\"]"
  },
  "Status": "200",
  "Error": null
}
```

---

## 2. 생산불출 입력 (SaveGoodsIssued)

### 개요
외부 서비스와 연계를 통해서 ERP의 생산불출을 입력할 수 있습니다.

> **주의**: ERP 내 기본 입력화면 양식에 추가된 항목만 입력할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/GoodsIssued/SaveGoodsIssued?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/GoodsIssued/SaveGoodsIssued?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| UPLOAD_SER_NO | 순번 | SMALLINT(4,0) | 동일한 전표로 묶고자 하는 경우 동일 순번 부여 |
| WH_CD_F | 보내는창고 | STRING(5) | 보내는창고 코드 |
| WH_CD_T | 받는공장 | STRING(5) | 받는공장 코드 |
| PROD_CD | 품목코드 | STRING(20) | ERP 품목코드 |
| QTY | 수량 | NUMERIC(28,10) | 생산불출수량 |

#### 상단 항목 (전표 정보)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| IO_DATE | 일자 | STRING(8) | 생산불출일자. YYYYMMDD. 미입력시 현재일 |
| EMP_CD | 담당자 | STRING(30) | 담당자코드 |
| PJT_CD | 프로젝트 | STRING(14) | 프로젝트코드 |
| DOC_NO | 생산불출No. | STRING(30) | 생산불출 번호 |
| TTL_CTT | 제목 | STRING(200) | 제목 |
| U_MEMO1~5 | 문자형식1~5 | STRING(200) | 추가 문자 항목 |
| U_TXT1 | 장문형식1 | STRING(2000) | 장문 항목 |

#### 하단 항목 (품목 정보)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| PLAN_DATE | 작업지시서일자 | STRING(8) | 작업지시서일자. YYYYMMDD |
| PLAN_NO | 작업지시서번호 | NUMERIC(5,0) | 작업지시서번호 |
| PLAN_PROD | 작업지시품목 | STRING(20) | 작업지시품목코드 |
| PROD_DES | 품목명 | STRING(100) | 품목명 |
| SIZE_DES | 규격 | STRING(100) | 규격 |
| UQTY | 추가수량 | NUMERIC(28,10) | 추가수량 |
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
| Data.SlipNos | 생산불출번호 | Y | ERP 생산불출번호 (실패시 공백) |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 허용 수량 정보 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |

### Example Request
```json
{
  "GoodsIssuedList": [{
    "BulkDatas": {
      "IO_DATE": "20180612",
      "UPLOAD_SER_NO": "1",
      "WH_CD_F": "00009",
      "WH_CD_T": "00022",
      "PROD_CD": "00002",
      "PROD_DES": "테스트",
      "QTY": "1"
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
    "ResultDetails": "[{\"IsSuccess\": true, \"TotalError\": \"[전표묶음1] OK\", \"Errors\": [], \"Code\": null}]",
    "SlipNos": "[\"20180612-1\"]"
  },
  "Status": "200",
  "Error": null
}
```

---

## 3. 생산입고 I 입력 (SaveGoodsReceipt)

### 개요
외부 서비스와 연계를 통해서 ERP의 생산입고I을 입력할 수 있습니다.

> **주의**: ERP 내 기본 입력화면 양식에 추가된 항목만 입력할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/GoodsReceipt/SaveGoodsReceipt?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/GoodsReceipt/SaveGoodsReceipt?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| UPLOAD_SER_NO | 순번 | SMALLINT(4,0) | 동일한 전표로 묶고자 하는 경우 동일 순번 부여 |
| PROD_CD | 품목코드 | STRING(20) | ERP 품목코드 |

#### 상단 항목 (전표 정보)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| IO_DATE | 일자 | STRING(8) | 생산입고I일자. YYYYMMDD. 미입력시 현재일 |
| EMP_CD | 담당자 | STRING(30) | 담당자코드 |
| SITE | 부서 | STRING(100) | 부서코드 |
| PJT_CD | 프로젝트 | STRING(14) | 프로젝트코드 |
| WH_CD_F | 생산된공장 | STRING(14) | 생산된공장 코드 |
| WH_CD_T | 받는창고 | STRING(14) | 받는창고 코드 |
| DOC_NO | 생산입고No. | STRING(30) | 생산입고 번호 |
| TTL_CTT | 제목 | STRING(200) | 제목 |
| U_MEMO1~5 | 문자형식1~5 | STRING(200) | 추가 문자 항목 |
| U_TXT1 | 장문형식1 | STRING(2000) | 장문 항목 |

#### 하단 항목 (품목 정보)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| PLAN_DATE | 작지(일자-번호 품목) | STRING(30) | 작업지시서 일자 |
| PLAN_NO | 작업지시서번호 | STRING(30) | 작업지시서번호 |
| PLAN_PROD | 작업지시품목코드 | STRING(30) | 작업지시품목코드 |
| PROD_DES | 품목명 | STRING(100) | 품목명 |
| SIZE_DES | 규격 | STRING(100) | 규격 |
| BOM_NO | BOM버전 | STRING(100) | 생산품의 BOM버전. 미입력시 기본 BOM버전 |
| QTY | 수량 | NUMERIC(28,10) | 작업지시수량 |
| UQTY | 추가수량 | NUMERIC(28,10) | 추가수량 |
| PRICE | 단가 | NUMERIC(28,10) | 단가 |
| USER_PRICE_VAT | 단가(VAT포함) | NUMERIC(28,10) | VAT포함 단가 |
| SUPPLY_AMT | 공급가액(원화) | NUMERIC(28,4) | 공급가액 |
| SUPPLY_AMT_F | 공급가액(외화) | NUMERIC(28,4) | 외화 공급가액 |
| VAT_AMT | 부가세 | NUMERIC(28,4) | 부가세 |
| ITEM_CD | 관리항목 | STRING(14) | 관리항목코드 |
| OTH_NUM | 노무시간 | STRING(200) | 노무시간. 정수 8자리, 소수 4자리 |
| REMARKS | 적요 | STRING(200) | 적요 |
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
| Data.SlipNos | 작업지시서번호 | Y | ERP 작업지시서번호 (실패시 공백) |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 허용 수량 정보 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |

### Example Request
```json
{
  "GoodsReceiptList": [{
    "BulkDatas": {
      "IO_DATE": "20210627",
      "UPLOAD_SER_NO": "1",
      "EMP_CD": "94830",
      "WH_CD_F": "00002",
      "WH_CD_T": "100",
      "PJT_CD": "00001",
      "PROD_CD": "01249",
      "PROD_DES": "세트0",
      "SIZE_DES": "1",
      "QTY": "1",
      "PRICE": "3000",
      "SUPPLY_AMT": "3000",
      "VAT_AMT": "30",
      "OTH_NUM": "1"
    }
  }]
}
```

### Example Response (Success)
```json
{
  "Data": {
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 0/30, 1시간 허용량: 2/30000, 1일 허용량: 3/100000",
    "TRACE_ID": "db6138411aad40e42dc5e209f65f6f3c",
    "SuccessCnt": 2,
    "FailCnt": 0,
    "ResultDetails": "[{\"IsSuccess\": true, \"TotalError\": \"[전표묶음0] OK\", \"Errors\": null, \"Code\": null}]",
    "SlipNos": "[\"20210627-3\", \"20210627-4\"]"
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
    "ResultDetails": "[{\"IsSuccess\": false, \"TotalError\": \"[전표묶음0] 담당자(미등록코드[7777])\", \"Errors\": null, \"Code\": null}]",
    "SlipNos": "[]"
  },
  "Status": "200",
  "Error": null
}
```

