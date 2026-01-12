# 기초등록 API

## 1. 거래처등록 (SaveBasicCust)

### 개요
외부 서비스와 연계를 통해서 ERP에 거래처를 등록할 수 있습니다.

> **주의**: ERP 내 등록화면에 기본탭으로 설정된 항목만 등록할 수 있습니다. 입력필수 항목은 회사코드별로 상이하며, 기본탭에 없는 항목 전송 시 해당 항목의 데이터는 등록되지 않습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/AccountBasic/SaveBasicCust?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/AccountBasic/SaveBasicCust?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| BUSINESS_NO | 사업자등록번호 | STRING(30) | ERP 거래처코드. 일반적으로 사업자번호 10자리 |
| CUST_NAME | 회사명 | STRING(100) | 회사명 최대 100자 |

#### 선택 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| BOSS_NAME | 대표자명 | STRING(50) | 대표자명 |
| UPTAE | 업태 | STRING(50) | 업태 |
| JONGMOK | 종목 | STRING(50) | 종목 |
| TEL | 전화번호 | STRING(50) | 전화번호 |
| EMAIL | 이메일 | STRING(100) | 이메일 |
| POST_NO | 우편번호 | STRING(8) | 우편번호 |
| ADDR | 주소 | STRING(500) | 주소 |
| G_GUBUN | 거래처코드구분 | STRING(2) | 01:사업자등록번호, 02:주민등록번호, 03:외국인. 기본값 01 |
| G_BUSINESS_TYPE | 세무신고거래처구분 | STRING(1) | 1/NULL:거래처동일, 2:검색입력, 3:직접입력 |
| G_BUSINESS_CD | 세무신고거래처코드 | STRING(30) | 검색입력 시 기 등록된 거래처 코드/명 입력 |
| TAX_REG_ID | 종사업장번호 | NUMERIC(4,0) | 종사업장번호 |
| FAX | Fax | STRING(50) | Fax |
| HP_NO | 모바일 | STRING(50) | 모바일 |
| DM_POST | DM우편번호 | STRING(8) | 주소2 우편번호 |
| DM_ADDR | DM주소 | STRING(500) | 주소2 주소 |
| REMARKS_WIN | 검색창내용 | STRING(50) | 검색창내용 |
| GUBUN | 구분 | STRING(2) | 11:일반거래처, 13:관세사거래처. 기본값 11 |
| FOREIGN_FLAG | 외환거래처사용여부 | STRING(1) | Y/N. 기본값 N |
| EXCHANGE_CODE | 외화코드 | STRING(30) | 외화거래처사용여부가 Y인 경우 입력 |
| CUST_GROUP1 | 업무관련그룹 | STRING(50) | 거래처그룹1코드 |
| CUST_GROUP2 | 회계관련그룹 | STRING(50) | 거래처그룹2코드 |
| URL_PATH | 홈페이지 | STRING(100) | 홈페이지 |
| REMARKS | 적요 | STRING(2000) | 적요 |
| OUTORDER_YN | 출하대상거래처구분 | STRING(1) | Y/N. 기본값 N |
| IO_CODE_SL_BASE_YN | 거래유형(영업)기본여부 | STRING(1) | Y/N. 기본값 Y |
| IO_CODE_SL | 거래유형(영업) | STRING(1) | 부가세코드 |
| IO_CODE_BY_BASE_YN | 거래유형(구매)기본여부 | STRING(1) | Y/N. 기본값 Y |
| IO_CODE_BY | 거래유형(구매) | STRING(50) | 부가세코드 |
| EMP_CD | 담당자코드 | STRING(50) | 담당자코드 |
| MANAGE_BOND_NO | 채권번호관리 | STRING(1) | B:기본설정, M:필수입력, Y:선택입력, N:사용안함 |
| MANAGE_DEBIT_NO | 채무번호관리 | STRING(1) | B:기본설정, M:필수입력, Y:선택입력, N:사용안함 |
| CUST_LIMIT | 거래처별여신한도 | NUMERIC(18,2) | 여신한도 |
| O_RATE | 출고조정률 | NUMERIC(5,2) | 출고조정률 |
| I_RATE | 입고조정률 | NUMERIC(5,2) | 입고조정률 |
| PRICE_GROUP | 영업단가그룹 | STRING(40) | 영업단가그룹 |
| PRICE_GROUP2 | 구매단가그룹 | STRING(40) | 구매단가그룹 |
| CUST_LIMIT_TERM | 여신기간 | NUMERIC(3,0) | 최대 365일 |
| CONT1~CONT6 | 문자형추가항목1~6 | STRING(100) | 문자형추가항목 |
| NO_CUST_USER1~3 | 숫자형추가항목1~3 | NUMERIC(18,6) | 숫자형추가항목 |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.SuccessCnt | 성공건수 | Y | 성공한 건수 |
| Data.FailCnt | 실패건수 | Y | 실패한 건수 |
| Data.ResultDetails | 처리결과 | Y | 상세 처리 결과 (JSON 배열) |
| Data.SlipNos | 전표번호 | Y | 전표번호 (실패시 공백) |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 1시간, 1일 동안 전송할 수 있는 허용 수량 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |

### Example Request
```json
{
  "CustList": [{
    "BulkDatas": {
      "BUSINESS_NO": "00001",
      "CUST_NAME": "Test Cust",
      "BOSS_NAME": "",
      "UPTAE": "",
      "JONGMOK": "",
      "TEL": "",
      "EMAIL": ""
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
    "ResultDetails": "[{\"IsSuccess\": true, \"TotalError\": \"[1] OK\", \"Errors\": [], \"Code\": null}]",
    "SlipNos": null
  },
  "Status": "200",
  "Error": null
}
```

### Example Response (Fail - Validation)
```json
{
  "Data": {
    "SuccessCnt": 0,
    "FailCnt": 2,
    "ResultDetails": "[{\"IsSuccess\": false, \"TotalError\": \"[1]거래처코드 (필수)\", \"Errors\": [{\"ColCd\": \"BUSINESS_NO\", \"Message\": \"거래처코드 (필수)\"}], \"Code\": null}]"
  },
  "Status": "200",
  "Error": null
}
```

---

## 2. 품목등록 (SaveBasicProduct)

### 개요
외부 서비스와 연계를 통해서 ERP에 품목을 등록할 수 있습니다.

> **주의**: ERP 내 등록화면에 기본탭으로 설정된 항목만 등록할 수 있습니다. 입력필수 항목은 회사코드별로 상이하며, 기본탭에 없는 항목 전송 시 해당 항목의 데이터는 등록되지 않습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/InventoryBasic/SaveBasicProduct?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/InventoryBasic/SaveBasicProduct?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| PROD_CD | 품목코드 | STRING(20) | 품목코드 |
| PROD_DES | 품목명 | STRING(100) | 품목명 |

#### 선택 항목 (주요)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SIZE_FLAG | 규격구분 | STRING(1) | 1:규격명, 2:규격그룹, 3:규격계산, 4:규격계산그룹 |
| SIZE_DES | 규격 | STRING(100) | 규격 |
| UNIT | 단위 | STRING(6) | 단위 |
| PROD_TYPE | 품목구분 | STRING(1) | 0:원재료, 1:제품, 2:반제품, 3:상품, 4:부재료, 7:무형상품. 기본값 3 |
| SET_FLAG | 세트여부 | STRING(1) | 1:사용, 0:미사용 |
| BAL_FLAG | 재고수량관리 | STRING(1) | 0:수량관리제외, 1:수량관리대상 |
| WH_CD | 생산공정 | STRING(5) | 생산공정코드 |
| IN_PRICE | 입고단가 | NUMERIC(18,6) | 입고단가 |
| IN_PRICE_VAT | 입고단가VAT포함여부 | STRING(1) | 0:미포함, 1:포함. 기본값 0 |
| OUT_PRICE | 출고단가 | NUMERIC(18,6) | 출고단가 |
| OUT_PRICE_VAT | 출고단가VAT포함여부 | STRING(1) | 0:미포함, 1:포함. 기본값 0 |
| REMARKS_WIN | 검색창내용 | STRING(100) | 검색창내용 |
| CLASS_CD | 그룹코드 | STRING(5) | 품목그룹1코드 |
| CLASS_CD2 | 그룹코드2 | STRING(5) | 품목그룹2코드 |
| CLASS_CD3 | 그룹코드3 | STRING(5) | 품목그룹3코드 |
| BAR_CODE | 바코드 | STRING(30) | 바코드 |
| TAX | 부가가치세율 | NUMERIC(6,3) | 판매전표 입력시 반영될 부가세율 |
| VAT_RATE_BY | 부가세율(매입) | NUMERIC(6,3) | 구매전표 입력시 반영될 부가세율 |
| CS_FLAG | C-Portal사용여부 | STRING(1) | 1:사용, 0:미사용 |
| REMARKS | 적요 | STRING(100) | 적요 |
| CUST | 구매처 | STRING(30) | 구매처 |

#### 단가 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| OUT_PRICE1~10 | 단가A~J | NUMERIC(18,6) | 단가A~J |
| OUT_PRICE1_VAT_YN~10 | 단가A~J VAT포함여부 | STRING(1) | N:포함안함, Y:포함 |
| OUTSIDE_PRICE | 외주비단가 | NUMERIC(18,6) | 외주비단가 |

#### 표준원가 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| MATERIAL_COST | 재료비표준원가 | NUMERIC(18,6) | 재료비표준원가 |
| EXPENSE_COST | 경비표준원가 | NUMERIC(18,6) | 경비표준원가 |
| LABOR_COST | 노무비표준원가 | NUMERIC(18,6) | 노무비표준원가 |
| OUT_COST | 외주비표준원가 | NUMERIC(18,6) | 외주비표준원가 |

#### 추가항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| CONT1~CONT6 | 문자형추가항목1~6 | STRING(100) | 문자형추가항목 |
| NO_USER1~NO_USER10 | 숫자형추가항목1~10 | NUMERIC(18,6) | 숫자형추가항목 |
| ITEM_TYPE | 관리항목 | STRING(1) | B:기본설정, M:필수입력, Y:선택입력, N:사용안함 |
| SERIAL_TYPE | 시리얼/로트 | STRING(1) | B:기본설정, M:필수입력, Y:선택입력, N:사용안함 |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.SuccessCnt | 성공건수 | Y | 성공한 건수 |
| Data.FailCnt | 실패건수 | Y | 실패한 건수 |
| Data.ResultDetails | 처리결과 | Y | 상세 처리 결과 (JSON 배열) |
| Data.SlipNos | 전표번호 | Y | 전표번호 (실패시 공백) |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 1시간, 1일 동안 전송할 수 있는 허용 수량 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |

### Example Request
```json
{
  "ProductList": [{
    "BulkDatas": {
      "PROD_CD": "00001",
      "PROD_DES": "Test Product",
      "SIZE_DES": "",
      "UNIT": "EA",
      "PROD_TYPE": "3",
      "IN_PRICE": "1000",
      "OUT_PRICE": "1500"
    }
  }]
}
```

### Example Response (Success)
```json
{
  "Data": {
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 1/30, 1시간 허용량: 3/6000, 1일 허용량: 13/10000",
    "TRACE_ID": "db6138411aad40e42dc5e209f65f6f3c",
    "SuccessCnt": 2,
    "FailCnt": 0,
    "ResultDetails": "[{\"IsSuccess\": true, \"TotalError\": \"[1] OK\", \"Errors\": [], \"Code\": null}]",
    "SlipNos": null
  },
  "Status": "200",
  "Error": null
}
```

---

## 3. 품목조회 - 단건 (ViewBasicProduct)

### 개요
외부 서비스와 연계를 통해서 ERP의 품목을 조회할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/InventoryBasic/ViewBasicProduct?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/InventoryBasic/ViewBasicProduct?SESSION_ID={SESSION_ID}` |
| Rate Limit | 1초에 1회 |

### Request Parameters
| 변수 | 변수명 | 자릿수 | 필수 | 설명 |
|------|--------|--------|------|------|
| SESSION_ID | 세션ID | STRING(50) | Y | 로그인 API 호출 후 받은 SESSION_ID |
| PROD_CD | 품목코드 | STRING(20) | Y | 조회하기 원하는 품목 코드. 최대 20자 |
| PROD_TYPE | 품목구분 | STRING(20) | N | 0:원재료, 1:제품, 2:반제품, 3:상품, 4:부재료, 7:무형상품. 여러 품목타입 검색 시 '∬'로 구분 |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 1시간, 1일 동안 전송할 수 있는 허용 수량 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |
| Data.Result[] | 결과 목록 | Y | 품목 정보 배열 |

### Result 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| PROD_CD | 품목코드 | STRING(20) | 품목코드 |
| PROD_DES | 품목명 | STRING(100) | 품목명 |
| SIZE_FLAG | 규격구분 | STRING(1) | 1:규격명, 2:규격그룹, 3:규격계산, 4:규격계산그룹 |
| SIZE_DES | 규격 | STRING(100) | 규격 |
| UNIT | 단위 | STRING(6) | 단위 |
| PROD_TYPE | 품목구분 | STRING(1) | 0:원재료, 1:제품, 2:반제품, 3:상품, 4:부재료, 7:무형상품 |
| SET_FLAG | 세트여부 | STRING(1) | 1:사용, 0:미사용 |
| BAL_FLAG | 재고수량관리 | STRING(1) | 0:수량관리제외, 1:수량관리대상 |
| WH_CD | 생산공정 | STRING(5) | 생산공정코드 |
| IN_PRICE | 입고단가 | NUMERIC(18,6) | 입고단가 |
| IN_PRICE_VAT | 입고단가VAT포함여부 | STRING(1) | 0:미포함, 1:포함 |
| OUT_PRICE | 출고단가 | NUMERIC(18,6) | 출고단가 |
| OUT_PRICE_VAT | 출고단가VAT포함여부 | STRING(1) | 0:미포함, 1:포함 |
| REMARKS_WIN | 검색창내용 | STRING(100) | 검색창내용 |
| CLASS_CD | 그룹코드 | STRING(5) | 품목그룹1코드 |
| CLASS_CD2 | 그룹코드2 | STRING(5) | 품목그룹2코드 |
| CLASS_CD3 | 그룹코드3 | STRING(5) | 품목그룹3코드 |
| BAR_CODE | 바코드 | STRING(30) | 바코드 |
| TAX | 부가가치세율 | NUMERIC(6,3) | 판매전표 부가세율 |
| VAT_RATE_BY | 부가세율(매입) | NUMERIC(6,3) | 구매전표 부가세율 |
| CS_FLAG | C-Portal사용여부 | STRING(1) | 1:사용, 0:미사용 |
| REMARKS | 적요 | STRING(100) | 적요 |
| CUST | 구매처 | STRING(30) | 구매처 |
| OUT_PRICE1~10 | 단가A~J | NUMERIC(18,6) | 단가A~J |
| OUT_PRICE1_VAT_YN~10 | 단가A~J VAT포함여부 | STRING(1) | N:포함안함, Y:포함 |
| MATERIAL_COST | 재료비표준원가 | NUMERIC(18,6) | 재료비표준원가 |
| EXPENSE_COST | 경비표준원가 | NUMERIC(18,6) | 경비표준원가 |
| LABOR_COST | 노무비표준원가 | NUMERIC(18,6) | 노무비표준원가 |
| OUT_COST | 외주비표준원가 | NUMERIC(18,6) | 외주비표준원가 |
| CONT1~CONT6 | 문자형추가항목1~6 | STRING(100) | 문자형추가항목 |
| NO_USER1~NO_USER10 | 숫자형추가항목1~10 | NUMERIC(18,6) | 숫자형추가항목 |
| ITEM_TYPE | 관리항목 | STRING(1) | B:기본설정, M:필수입력, Y:선택입력, N:사용안함 |
| SERIAL_TYPE | 시리얼/로트 | STRING(1) | B:기본설정, M:필수입력, Y:선택입력, N:사용안함 |

### Example Request
```json
{
  "PROD_CD": "00001",
  "PROD_TYPE": "0"
}
```

### Example Response (Success)
```json
{
  "Data": {
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 0/30, 1시간 허용량: 3/6000, 1일 허용량: 4/10000",
    "TRACE_ID": "db6138411aad40e42dc5e209f65f6f3c",
    "Result": [{
      "PROD_CD": "00001",
      "PROD_DES": "test123",
      "SIZE_FLAG": "1",
      "SIZE_DES": "6",
      "UNIT": "EA",
      "PROD_TYPE": "3",
      "SET_FLAG": "1",
      "BAL_FLAG": "1",
      "WH_CD": "00002",
      "IN_PRICE": "700.0000000000",
      "IN_PRICE_VAT": "1",
      "OUT_PRICE": "12000.0000000000",
      "OUT_PRICE_VAT": "1",
      "REMARKS_WIN": "test",
      "CLASS_CD": "00001",
      "BAR_CODE": "8801166053051",
      "TAX": "20.000",
      "REMARKS": "123"
    }]
  },
  "Status": "200",
  "Error": null
}
```

---

## 4. 품목조회 - 다건 (GetBasicProductsList)

### 개요
외부 서비스와 연계를 통해서 ERP의 품목을 조회할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/InventoryBasic/GetBasicProductsList?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/InventoryBasic/GetBasicProductsList?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10분에 1회 |

### Request Parameters
| 변수 | 변수명 | 자릿수 | 필수 | 설명 |
|------|--------|--------|------|------|
| SESSION_ID | 세션ID | STRING(50) | Y | 로그인 API 호출 후 받은 SESSION_ID |
| PROD_CD | 품목코드 | STRING(20000) | N | 여러 품목 검색 시 '∬'로 구분. 최대 20000자 |
| COMMA_FLAG | Comma포함여부 | CHAR(1) | N | 품목코드에 콤마가 포함된 경우 Y. 기본값 N |
| PROD_TYPE | 품목구분 | STRING(20) | N | 0:원재료, 1:제품, 2:반제품, 3:상품, 4:부재료, 7:무형상품. 여러 품목타입 검색 시 '∬'로 구분 |
| FROM_PROD_CD | 품목코드(시작) | STRING(20) | N | 조회 시작 품목코드 |
| TO_PROD_CD | 품목코드(끝) | STRING(20) | N | 조회 끝 품목코드 |

### Response
단건 조회와 동일한 형식

### Result 항목
단건 조회와 동일

### Example Request
```json
{
  "PROD_CD": "00001∬00002",
  "PROD_TYPE": ""
}
```

### Example Response (Success)
```json
{
  "Data": {
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 0/30, 1시간 허용량: 3/6000, 1일 허용량: 4/10000",
    "TRACE_ID": "db6138411aad40e42dc5e209f65f6f3c",
    "Result": [
      {
        "PROD_CD": "00001",
        "PROD_DES": "test123",
        "SIZE_FLAG": "1",
        "SIZE_DES": "6",
        "UNIT": "EA",
        "PROD_TYPE": "3"
      },
      {
        "PROD_CD": "00002",
        "PROD_DES": "test456",
        "SIZE_FLAG": "1",
        "SIZE_DES": "",
        "UNIT": "BOX",
        "PROD_TYPE": "3"
      }
    ]
  },
  "Status": "200",
  "Error": null
}
```

