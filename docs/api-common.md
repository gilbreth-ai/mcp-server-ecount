# 공통(필수) API

## 1. Zone API

### 개요
외부 서비스와 연계를 위한 호스트정보인 Zone API를 제공합니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi.ecount.com/OAPI/V2/Zone` |
| Request URL | `https://oapi.ecount.com/OAPI/V2/Zone` |

### Request Parameters
| 변수 | 변수명 | 자릿수 | 필수 | 설명 |
|------|--------|--------|------|------|
| COM_CODE | 회사코드 | 6 | Y | 이카운트 ERP 로그인할 때 사용하는 회사코드 |

### Response
| 변수 | 변수명 | 자릿수 | 필수 | 설명 |
|------|--------|--------|------|------|
| Status | 처리결과 | | Y | 200(정상) |
| Error | 오류 | | N | 오류가 발생할 경우 |
| Error.Code | 오류코드 | | | |
| Error.Message | 오류내용 | | | |
| Error.MessageDetail | 오류상세정보 | | | |
| Data.ZONE | Sub domain Zone | 6 | Y | 로그인API 호출시 사용될 Zone 정보 |
| Data.DOMAIN | Domain | 30 | Y | 로그인API 호출시 사용될 도메인 정보 |
| Data.EXPIRE_DATE | 만료일 | | Y | API 현재버전 서비스 종료일 |

### Example Request
```json
{
  "COM_CODE": "80001"
}
```

### Example Response (Success)
```json
{
  "Data": {
    "EXPIRE_DATE": "",
    "ZONE": "A",
    "DOMAIN": ".ecount.com"
  },
  "Status": "200",
  "Error": null,
  "Timestamp": "2018년 6월 11일 오후 1:09:21"
}
```

### Example Response (Fail)
```json
{
  "Data": null,
  "Status": "500",
  "Error": {
    "Code": 201,
    "Message": "Zone 정보가 없습니다.",
    "MessageDetail": ""
  },
  "Timestamp": null
}
```

### 오류 코드
| Status | Error.Code | 설명 |
|--------|------------|------|
| 200 | - | 정상 처리된 경우 |
| 404 | - | API path가 잘못되어 존재하지 않는 API를 호출한 경우 |
| 412 | - | API 전송 횟수 기준을 넘은 경우 |
| 500 | 100 | Zone 정보가 없습니다 |

> **주의**: 서버요청 제한 건수를 초과하는 경우 HTTP 412 Forbidden, 302 Object Moved 오류가 발생합니다.

---

## 2. 로그인 API

### 개요
외부 서비스와 연계를 위해서 로그인 API를 제공합니다.

### 요청 정보
| 항목 | 설명 |
|------|------|
| 호출방식 | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi{ZONE}.ecount.com/OAPI/V2/OAPILogin` |
| Request URL | `https://oapi{ZONE}.ecount.com/OAPI/V2/OAPILogin` |

### Request Parameters
| 변수 | 변수명 | 자릿수 | 필수 | 설명 |
|------|--------|--------|------|------|
| COM_CODE | 회사코드 | 6 | Y | 이카운트 ERP 로그인할 때 사용하는 회사코드 |
| USER_ID | 사용자ID | 30 | Y | API_CERT_KEY를 발급받은 이카운트 ID |
| API_CERT_KEY | 인증키 | 50 | Y | Self-Customizing > 정보관리 > API인증키발급에서 발급받은 인증키 |
| LAN_TYPE | 언어설정 | 50 | Y | ko-KR(한국어), en-US(English), zh-CN(简体中文), zh-TW(繁体中文), ja-JP(日本語), vi-VN(Việt Nam), es(Español), id-ID(Indonesian) |
| ZONE | ZONE | 2 | Y | Zone API에서 받은 ZONE 정보 |

### Response
| 변수 | 변수명 | 자릿수 | 필수 | 설명 |
|------|--------|--------|------|------|
| Status | 처리결과 | | Y | 200(정상) |
| Error | 오류 | | N | 오류가 발생할 경우 |
| Error.Code | 오류코드 | | | |
| Error.Message | 오류내용 | | | |
| Error.MessageDetail | 오류상세정보 | | | |
| Data.COM_CODE | 회사코드 | 6 | Y | 입력한 회사코드 |
| Data.USER_ID | 사용자ID | 30 | Y | 입력한 사용자ID |
| Data.SESSION_ID | 세션ID | 50 | Y | 이후 API 호출에 사용하는 세션ID |
| Data.EXPIRE_DATE | 만료일 | | Y | API 현재버전 서비스 종료일 |
| Data.NOTICE | 공지사항 | | Y | 이카운트 API 공지사항 |

### Example Request
```json
{
  "COM_CODE": "80001",
  "USER_ID": "USER_ID",
  "API_CERT_KEY": "{API_CERT_KEY}",
  "LAN_TYPE": "ko-KR",
  "ZONE": "C"
}
```

### Example Response (Success)
```json
{
  "Data": {
    "EXPIRE_DATE": "",
    "NOTICE": "",
    "Code": "00",
    "Datas": {
      "COM_CODE": "80001",
      "USER_ID": "USER_ID",
      "SESSION_ID": "39313231367c256562253866253939256563253838253938:0HDD9DBtZt2e"
    },
    "Message": "",
    "RedirectUrl": ""
  },
  "Status": "200",
  "Error": null,
  "Timestamp": "2018년 6월 11일 오후 1:09:21"
}
```

### Example Response (Fail)
```json
{
  "Data": null,
  "Status": "200",
  "Error": {
    "Code": 201,
    "Message": "API_CERT_KEY가 유효하지 않습니다.",
    "MessageDetail": ""
  },
  "Timestamp": null
}
```

### 오류 코드
| Status | Error.Code | 설명 |
|--------|------------|------|
| 200 | - | 정상 처리된 경우 |
| 404 | - | API path가 잘못되어 존재하지 않는 API를 호출한 경우 |
| 412 | - | API 전송 횟수 기준을 넘은 경우 |
| 200 | 20 | 올바른 Code, ID, PW를 입력해주세요 |
| 200 | 21 | 임시접속차단이 설정되어 접속이 차단되었습니다 |
| 200 | 22 | [개인-접속제한시간설정] 로그인 제한 시간 |
| 200 | 23 | [회사-접속제한시간설정] 로그인 제한 시간 |
| 200 | 24 | [개인-IP별차단기능] 해당 IP에서 로그인 불가 |
| 200 | 25 | [회사-IP별차단기능] 해당 IP에서 로그인 불가 |
| 200 | 26 | 어플리케이션 사용이 제한되어 접속 불가 |
| 200 | 27 | [모바일 로그인] 모바일로그인 허용 요청 필요 |
| 200 | 81, 82, 83 | 미수차단되어 API 이용 불가 |
| 200 | 84 | 가입비 미수차단되어 API 이용 불가 |
| 200 | 85 | 사용차단되어 API 이용 불가 |
| 200 | 89 | 탈퇴처리 되어 API 이용 불가 |
| 200 | 98 | 비밀번호를 5회 이상 잘못 입력 |
| 200 | 99 | 해당 아이디가 존재하지 않습니다 |
| 200 | 201 | API_CERT_KEY가 유효하지 않습니다 |
| 200 | 204 | 테스트용/실서버용 인증키 불일치 |

> **주의**: 서버요청 제한 건수를 초과하는 경우 HTTP 412 Forbidden, 302 Object Moved 오류가 발생합니다.

