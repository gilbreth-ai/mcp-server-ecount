# 기타 API (쇼핑몰, 근태, 게시판)

## 1. 쇼핑몰 주문 입력 (SaveOpenMarketOrderNew)

### 개요
외부 서비스와 연계를 통해서 ERP의 주문(쇼핑몰관리)을 입력할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/OpenMarket/SaveOpenMarketOrderNew?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/OpenMarket/SaveOpenMarketOrderNew?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| OPENMARKET_CD | 쇼핑몰코드 | STRING(5) | 쇼핑몰코드 |

#### ORDERS 배열 (필수)
> OPENMARKET_CD, GROUP_NO, ORDER_NO 조합으로 중복 체크

| 변수 | 변수명 | 자릿수 | 필수 | 설명 |
|------|--------|--------|------|------|
| GROUP_NO | 묶음주문번호 | STRING(500) | Y | 묶음주문번호 |
| ORDER_NO | 주문번호 | STRING(500) | Y | 주문번호 |
| ORDER_DATE | 주문일자 | DATETIME | Y | 주문일자 |
| PAY_DATE | 결제일자 | DATETIME | Y | 결제일자 |
| PROD_CD | 쇼핑몰상품코드 | STRING(100) | Y | 쇼핑몰상품코드 |
| PROD_NM | 쇼핑몰상품명 | STRING(500) | Y | 쇼핑몰상품명 |
| PROD_OPT | 주문옵션 | STRING(500) | Y | 주문옵션 |
| ORDER_QTY | 수량 | NUMERIC(28,10) | Y | 수량 |
| ORDER_AMT | 주문금액 | NUMERIC(28,4) | Y | 주문금액 |
| ORDERER | 주문자 | STRING(500) | Y | 주문자 |
| ORDERER_TEL | 주문자연락처 | STRING(500) | Y | 주문자연락처 |
| RECEIVER | 수취인 | STRING(500) | Y | 수취인 |
| RECEIVER_TEL | 수취인연락처1 | STRING(500) | Y | 수취인연락처1 |
| ADDR | 주소 | STRING(1000) | Y | 주소 |
| SHOP_NM | 쇼핑몰명 | STRING(400) | Y | 쇼핑몰명 |
| RECEIVER_TEL2 | 수취인연락처2 | STRING(500) | N | 수취인연락처2 |
| ZIP_CODE | 우편번호 | STRING(500) | N | 우편번호 |
| DELIVERY_REQUEST | 배송요청사항 | STRING(4000) | N | 배송요청사항 |
| SHIPPING_CHARGE_TYPE | 배송비구분 | STRING(1) | N | P:선불, A:착불 |
| SHIPPING_CHARGE | 배송비금액 | NUMERIC(28,4) | N | 배송비금액 |
| MEMO | 메모 | STRING(500) | N | 메모 |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 허용 수량 정보 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |
| Data.ResultDetails[] | 결과 목록 | Y | 처리 결과 목록 |

### ResultDetails 항목
| 변수 | 변수명 | 설명 |
|------|--------|------|
| OPENMARKET_CD | 쇼핑몰코드 | 쇼핑몰코드 |
| SLIP_NO | ECOUNT 주문번호 | ECOUNT 주문번호 |
| SLIP_SER | ECOUNT 순번 | ECOUNT 순번 |
| GROUP_NO | 묶음주문번호 | 묶음주문번호 |
| ORDER_NO | 주문번호 | 주문번호 |
| Result | 결과 메시지 | 결과 메시지 |

### Example Request
```json
{
  "OPENMARKET_CD": "00001",
  "ORDERS": [{
    "GROUP_NO": "1212121222342343",
    "ORDER_NO": "12122323223423423",
    "ORDER_DATE": "2018-05-25 13:06:29.000",
    "PAY_DATE": "2018-05-25 13:06:29.000",
    "PROD_CD": "1372431020",
    "PROD_NM": "TEST 상품",
    "PROD_OPT": "색상:빨간색,사이즈:A1",
    "ORDER_QTY": 10,
    "ORDER_AMT": 100000,
    "ORDERER": "TEST",
    "ORDERER_TEL": "010-0000-0000",
    "RECEIVER": "TEST",
    "RECEIVER_TEL": "010-0000-0000",
    "RECEIVER_TEL2": "010-0000-0000",
    "ZIP_CODE": "",
    "ADDR": "서울특별시 구로구 디지털로26길 61 에이스하이엔드타워",
    "DELIVERY_REQUEST": "빠른 배송 해주세요.",
    "SHIPPING_CHARGE_TYPE": "P",
    "SHIPPING_CHARGE": "2500",
    "MEMO": "",
    "SHOP_NM": "이카운트쇼핑몰"
  }]
}
```

### Example Response (Success)
```json
{
  "Data": {
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 0/30, 1시간 허용량: 2/6000, 1일 허용량: 6/10000",
    "TRACE_ID": "db6138411aad40e42dc5e209f65f6f3c",
    "ResultDetails": [{
      "OPENMARKET_CD": "1",
      "SLIP_NO": "123456",
      "SLIP_SER": "1",
      "GROUP_NO": "12356966",
      "ORDER_NO": "2018052822222",
      "Result": ""
    }]
  },
  "Status": "200",
  "Error": null
}
```

### Example Response (Fail)
```json
{
  "Data": {
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 1/30, 1시간 허용량: 6/6000, 1일 허용량: 11/10000",
    "ResultDetails": [{
      "OPENMARKET_CD": "1",
      "SLIP_NO": "123456",
      "SLIP_SER": "1",
      "GROUP_NO": "12356966",
      "ORDER_NO": "2018052822222",
      "Result": "중복 주문"
    }]
  },
  "Status": "200",
  "Error": null
}
```

---

## 2. 출퇴근 기록 입력 (SaveClockInOut)

### 개요
외부 서비스와 연계를 통해서 ERP의 출퇴근 기록을 입력할 수 있습니다.

> **주의**: ERP 내 기본 입력화면 양식에 추가된 항목만 입력할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/TimeMgmt/SaveClockInOut?SESSION_ID={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/TimeMgmt/SaveClockInOut?SESSION_ID={SESSION_ID}` |
| Rate Limit | 10초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| EMP_CD | 사원번호 | STRING(50) | 사원코드. 최대 14자(코드), 50자(명) |
| ATTDC_DTM_I | 출근일시 | STRING(30) | 출근일시 (YYYY-MM-DD HH:MM:SS) |
| ATTDC_DTM_O | 퇴근일시 | STRING(30) | 퇴근일시 (YYYY-MM-DD HH:MM:SS) |
| HDOFF_TYPE_CD_I | 출근시오전반차여부 | STRING(1) | Y:오전반차, N:아님 |
| HDOFF_TYPE_CD_O | 퇴근시오후반차여부 | STRING(1) | Y:오후반차, N:아님 |
| OUT_WORK_TF | 출근시외근구분 | STRING(1) | Y:외근, N:내근 |

#### 선택 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| ATTDC_PLACE_I | 출근장소 | STRING(100) | 출근장소. 최대 100자 |
| ATTDC_PLACE_O | 퇴근장소 | STRING(100) | 퇴근장소. 최대 100자 |
| ATTDC_RSN_I | 출근사유 | STRING(400) | 출근사유. 최대 400자 |
| ATTDC_RSN_O | 퇴근사유 | STRING(400) | 퇴근사유. 최대 400자 |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| Data.SuccessCnt | 성공건수 | Y | 성공한 건수 |
| Data.FailCnt | 실패건수 | Y | 실패한 건수 |
| Data.ResultDetails | 처리결과 | Y | 상세 처리 결과 |
| Data.SlipNos | 전표번호 | Y | 전표번호 (실패시 공백) |
| Data.EXPIRE_DATE | 만료일 | Y | API 현재버전 서비스 종료일 |
| Data.QUANTITY_INFO | 허용수량 | Y | 허용 수량 정보 |
| Data.TRACE_ID | 로그확인용 일련번호 | Y | 오류발생시 로그 확인용 |

### Example Request
```json
{
  "ClockInOutList": [{
    "BulkDatas": {
      "ATTDC_DTM_I": "2025-02-12 08:25:47",
      "ATTDC_DTM_O": "2025-02-12 18:17:48",
      "ATTDC_PLACE_I": "",
      "ATTDC_PLACE_O": "",
      "ATTDC_RSN_I": "",
      "ATTDC_RSN_O": "",
      "EMP_CD": "00001",
      "HDOFF_TYPE_CD_I": "N",
      "HDOFF_TYPE_CD_O": "N",
      "OUT_WORK_TF": "N"
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
    "ResultDetails": [
      {"IsSuccess": true, "TotalError": "[전표묶음1] OK", "Errors": [], "Code": null}
    ],
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
    "EXPIRE_DATE": "",
    "QUANTITY_INFO": "시간당 연속 오류 제한 건수: 1/30, 1시간 허용량: 3/6000, 1일 허용량: 3/10000",
    "SuccessCnt": 0,
    "FailCnt": 1,
    "ResultDetails": [
      {"IsSuccess": false, "TotalError": "[전표묶음1] 사원번호 (필수)", "Errors": [{"ColCd": "EMP_CD", "Message": "사원번호 (필수)"}], "Code": null}
    ],
    "SlipNos": null
  },
  "Status": "200",
  "Error": null
}
```

---

## 3. 게시글 입력 (CreateOApiBoardAction)

### 개요
외부 서비스와 연계를 통해서 ERP의 게시판을 입력할 수 있습니다.

> **주의**:
> - 다른 API와 URL 패턴이 다릅니다 (`/ec5/api/app.oapi.v3/action/`)
> - ERP 내 기본 입력화면 양식에 추가된 항목만 입력할 수 있습니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/ec5/api/app.oapi.v3/action/CreateOApiBoardAction?session_Id={SESSION_ID}` |
| Request URL | `https://oapi{ZONE}.ecount.com/ec5/api/app.oapi.v3/action/CreateOApiBoardAction?session_Id={SESSION_ID}` |
| Rate Limit | 10초에 1회 |

### Request Parameters

#### 필수 항목
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| SESSION_ID | 세션ID | STRING(50) | 로그인 API 호출 후 받은 SESSION_ID |
| bizz_sid | 게시판 ID | STRING(15) | 게시판 ID |

#### 선택 항목 (master)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| title | 제목 | STRING(200) | 제목. 최대 200자 |
| body_ctt | 내용 | TEXT(5MB) | 내용. 텍스트 형식, 최대 5MB |
| progress_status | 진행상태 | STRING(100) | 진행상태 코드 또는 명. 최대 20자(코드), 100자(명) |
| label | 라벨 | STRING(20) | 라벨 코드 또는 명. 최대 5자(코드), 20자(명) |
| cust | 거래처코드 | STRING(30) | 거래처코드. 최대 30자 |
| cust_nm | 거래처명 | STRING(100) | 거래처명. 최대 100자 |
| prod | 품목코드 | STRING(20) | 품목코드. 최대 20자 |
| prod_nm | 품목명 | STRING(100) | 품목명. 최대 100자 |
| dept | 부서코드 | STRING(14) | 부서코드. 최대 14자 |
| dept_nm | 부서명 | STRING(50) | 부서명. 최대 50자 |
| pjt | 프로젝트코드 | STRING(14) | 프로젝트코드. 최대 14자 |
| pjt_nm | 프로젝트명 | STRING(50) | 프로젝트명. 최대 50자 |
| pic | 담당자코드 | STRING(30) | 담당자코드. 최대 30자 |
| pic_nm | 담당자명 | STRING(50) | 담당자명. 최대 50자 |
| complt_dtm | 완료일시 | STRING(14) | YYYYMMDD HH:MM 형식 |
| record_range_dtm | 날짜/시간 | STRING(20) | YYYYMMDD HH:MM HH:MM 형식 |

#### 추가항목 (선택)
| 변수 | 변수명 | 자릿수 | 설명 |
|------|--------|--------|------|
| txt_001 ~ txt_020 | 문자형식1~20 | STRING(200) | 문자형식. 최대 200자 |
| num_001 ~ num_020 | 숫자형식1~20 | NUMERIC(15,2) | 숫자형식. 정수 15자리, 소수 3자리 |
| tf_001 ~ tf_020 | Y/N 1~20 | STRING(1) | Y 또는 N |
| date_001 ~ date_020 | 일자형식1~20 | STRING(8) | YYYYMMDD 형식 |
| cd_001 ~ cd_020 | 코드형식1~20 코드 | STRING(100) | 코드. 최대 20자(코드), 100자(명) |
| cd_nm_001 ~ cd_nm_020 | 코드형식1~20 명 | STRING(100) | 명. 최대 100자 |

### Response
| 변수 | 변수명 | 필수 | 설명 |
|------|--------|------|------|
| Status | 처리결과 | Y | 200(정상) |
| Error | 오류 | N | 오류가 발생할 경우 |
| expire_date | 인증키유효기간 | Y | API 현재버전 서비스 종료일 |
| data[].seq | 순번 | Y | 순번 |
| data[].result | 일자-번호 | Y | 생성된 게시글 번호 |
| data[].error | 오류상세정보 | N | 오류 발생시 상세 정보 |

### Example Request
```json
{
  "data": [{
    "master": {
      "bizz_sid": "B_000000E072000",
      "title": "title test",
      "body_ctt": "body test",
      "progress_status": "1",
      "label": "",
      "cust": "",
      "cust_nm": "",
      "prod": "",
      "prod_nm": "",
      "dept": "",
      "dept_nm": "",
      "pjt": "",
      "pjt_nm": "",
      "pic": "",
      "pic_nm": "",
      "complt_dtm": "20250807 12:34",
      "record_range_dtm": "20250807 12:34 23:45",
      "txt_001": "",
      "num_001": "",
      "tf_001": "",
      "dt_001": "",
      "cd_001": "",
      "cd_nm_001": ""
    }
  }]
}
```

### Example Response (Success)
```json
{
  "Status": 200,
  "data": [{"seq": 0, "result": "20250819-9"}],
  "expire_date": "20250902",
  "time_stamp": "2025-08-19 16:24:14",
  "trace_id": "CreateOApiBoardAction::T_1755588254708"
}
```

### Example Response (Fail)
```json
{
  "Status": "500",
  "data": [{
    "seq": 0,
    "result": "",
    "error": [
      {"target": "num_001", "code": "", "message": "숫자형식 1(필수)"},
      {"target": "txt_001", "code": "", "message": "문자형식 1(필수)"}
    ]
  }],
  "expire_date": "20250902",
  "Error": {
    "Code": "EXP0001",
    "Message": "숫자형식 1(필수)"
  }
}
```
