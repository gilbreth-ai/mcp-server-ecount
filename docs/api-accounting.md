# 회계 API

## 1. 매출·매입전표 II 자동분개 (SaveInvoiceAuto)

### 개요
외부 서비스와 연계를 통해서 ERP의 회계전표를 입력할 수 있습니다.
- 회계I > FastEntry > 일반전표 > 매출전표II, 매입전표II 형태로 입력
- 양식필수 값은 회사코드별로 상이합니다. 기본입력양식설정의 필수값을 확인바랍니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/InvoiceAuto/SaveInvoiceAuto?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/InvoiceAuto/SaveInvoiceAuto?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| TAX_GUBUN | 매출/매입구분 | STRING(2) | 부가세유형코드 (아래 참조) |
| CR_CODE | 매출계정코드 | STRING(8) | 매출 시: 매출계정코드 (예: 4019-상품매출) |
| DR_CODE | 매입계정코드 | STRING(8) | 매입 시: 매입계정코드 (예: 1469-상품) |

#### TAX_GUBUN 코드
| 구분 | 코드 | 설명 |
|------|------|------|
| 매출 | 11 | 과세매출 |
| 매입 | 21 | 과세매입 |

> 기타 코드는 Self-Customizing > 환경설정 > 기능설정 > 공통탭 > 회계-부가세 설정에서 확인

#### 선택 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| TRX_DATE | 일자 | STRING(8) | 전표일자 (YYYYMMDD). 미입력시 현재일 |
| ACCT_DOC_NO | 회계전표No. | STRING(30) | 회계관리번호 |
| S_NO | 지급구분 | STRING(20) | 신용카드 또는 승인번호 |
| CUST | 거래처 | STRING(30) | 거래처코드 |
| CUST_DES | 거래처명 | STRING(50) | 거래처명 |
| SUPPLY_AMT | 공급가액 | NUMERIC(16,0) | 공급가액 |
| VAT_AMT | 부가세 | NUMERIC(16,0) | 부가세 |
| ACCT_NO | 수금구분 | STRING(30) | 매입: 돈들어온계좌 / 매출: 돈나간계좌 코드 또는 명 |
| REMARKS_CD | 적요코드 | STRING(2) | 적요코드 |
| REMARKS | 적요 | STRING(200) | 적요 |
| SITE_CD | 부서코드 | STRING(14) | 부서코드 |
| PJT_CD | 프로젝트 | STRING(14) | 프로젝트코드 |
| ITEM1_CD | 추가항목1 | STRING(10) | 추가항목1 (코드형) |
| ITEM2_CD | 추가항목2 | STRING(10) | 추가항목2 (코드형) |
| ITEM3_CD | 추가항목3 | STRING(10) | 추가항목3 (코드형) |
| ITEM4 | 추가항목4 | STRING(100) | 추가항목4 (문자형) |
| ITEM5 | 추가항목5 | STRING(100) | 추가항목5 (문자형) |
| ITEM6 | 추가항목6 | NUMERIC(16,0) | 추가항목6 (숫자형) |
| ITEM7 | 추가항목7 | NUMERIC(16,0) | 추가항목7 (숫자형) |
| ITEM8 | 추가항목8 | STRING(8) | 추가항목8 (일자형). 미입력시 현재일 |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.SuccessCnt | 성공건수 | Y | 성공한 건수 |
| Data.FailCnt | 실패건수 | Y | 실패한 건수 |
| Data.ResultDetails | 처리결과 | Y | 상세 처리 결과 |
| Data.SlipNos | 전표번호 | Y | ERP 전표번호 (실패시 공백) |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 허용 수량 정보 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |

### Example Request (매출전표 II)
```json
{
  "InvoiceAutoList": [{
    "BulkDatas": {
      "TRX_DATE": "20181113",
      "ACCT_DOC_NO": "",
      "TAX_GUBUN": "11",
      "S_NO": "",
      "CUST": "0017",
      "CUST_DES": "",
      "SUPPLY_AMT": "50000",
      "VAT_AMT": "5000",
      "ACCT_NO": "",
      "CR_CODE": "4019",
      "DR_CODE": "",
      "REMARKS_CD": "",
      "REMARKS": "",
      "SITE_CD": "",
      "PJT_CD": ""
    }
  }]
}
```

### Example Request (매입전표 II)
```json
{
  "InvoiceAutoList": [{
    "BulkDatas": {
      "TRX_DATE": "20181113",
      "ACCT_DOC_NO": "",
      "TAX_GUBUN": "21",
      "S_NO": "",
      "CUST": "0017",
      "CUST_DES": "",
      "SUPPLY_AMT": "50000",
      "VAT_AMT": "5000",
      "ACCT_NO": "",
      "CR_CODE": "",
      "DR_CODE": "1469",
      "REMARKS_CD": "",
      "REMARKS": "",
      "SITE_CD": "",
      "PJT_CD": ""
    }
  }]
}
```

### Example Response (Success)
```json
{
  "Data": [{
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 0/30, 1시간 허용량: 10/6000, 1일 허용량: 12/10000",
    "TRACE_ID": "db6138411aad40e42dc5e209f65f6f3c",
    "SuccessCnt": 2,
    "FailCnt": 0,
    "ResultDetails": "[{\"IsSuccess\": true, \"TotalError\": \"OK\", \"Errors\": [], \"Code\": null}, {\"IsSuccess\": true, \"TotalError\": \"OK\", \"Errors\": [], \"Code\": null}]",
    "SlipNos": "[\"20181113-1\", \"20181113-2\"]"
  }],
  "Status": "200",
  "Error": null
}
```

### Example Response (Fail)
```json
{
  "Data": [{
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 0/30, 1시간 허용량: 10/6000, 1일 허용량: 12/10000",
    "SuccessCnt": 0,
    "FailCnt": 2,
    "ResultDetails": "[{\"IsSuccess\": false, \"TotalError\": \"거래처\", \"Errors\": [{\"ColCd\": \"CUST\", \"Message\": \"거래처\"}], \"Code\": null}]",
    "SlipNos": "[]"
  }],
  "Status": "200",
  "Error": null
}
```
