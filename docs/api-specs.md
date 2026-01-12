# ECOUNT OpenAPI 스펙 정리

## 공통 정보

### URL 구조
| 환경 | URL |
|------|-----|
| 테스트 | `https://sboapi.ecount.com` |
| 실서버 (Zone 조회) | `https://oapi.ecount.com` |
| 실서버 (기타 API) | `https://oapi{ZONE}.ecount.com` |

### 공통 응답 구조
```json
{
  "Status": "200",
  "Error": null | { "Code": number, "Message": string, "MessageDetail": string },
  "Data": { ... },
  "Timestamp": "2018년 6월 11일 오후 1:09:21"
}
```

### 공통 에러 코드
| HTTP Status | Error Code | 설명 |
|-------------|------------|------|
| 200 | - | 정상 |
| 302 | - | Rate Limit 초과 |
| 404 | - | 잘못된 API path |
| 412 | - | Rate Limit 초과 |
| 500 | 다양 | 서버 오류 |

---

## 1. Zone API

### 개요
외부 서비스 연계를 위한 호스트 정보(Zone) 조회

### 요청
| 항목 | 값 |
|------|-----|
| Method | POST |
| Content-Type | application/json |
| Test URL | `https://sboapi.ecount.com/OAPI/V2/Zone` |
| Prod URL | `https://oapi.ecount.com/OAPI/V2/Zone` |

### 요청 파라미터
| 변수 | 변수명 | 자릿수 | 필수 | 설명 |
|------|--------|--------|------|------|
| COM_CODE | 회사코드 | 6 | Y | 이카운트 ERP 로그인 시 사용하는 회사코드 |

### 응답 데이터
| 변수 | 변수명 | 설명 |
|------|--------|------|
| ZONE | Sub domain Zone | 로그인 API 호출시 사용될 Zone 정보 |
| DOMAIN | Domain | 로그인 API 호출시 사용될 도메인 정보 |
| EXPIRE_DATE | 만료일 | API 현재 버전 서비스 종료일 |

### 예시

**요청**
```json
{
  "COM_CODE": "80001"
}
```

**성공 응답**
```json
{
  "Status": "200",
  "Error": null,
  "Data": {
    "ZONE": "A",
    "DOMAIN": ".ecount.com",
    "EXPIRE_DATE": ""
  },
  "Timestamp": "2018년 6월 11일 오후 1:09:21"
}
```

**실패 응답**
```json
{
  "Status": "500",
  "Error": {
    "Code": 201,
    "Message": "Zone 정보가 없습니다.",
    "MessageDetail": ""
  },
  "Data": null,
  "Timestamp": null
}
```

### 에러 코드
| Status | Error Code | 설명 |
|--------|------------|------|
| 500 | 100 | Zone 정보가 없습니다 |

### Rate Limit
- 실서버: 1회 / 10분
- 테스트: 1회 / 10초

---

## 2. 로그인 API

> (대기 중)

---

## 3. 품목 조회 API

> (대기 중)

---

## 4. 재고 현황 API

> (대기 중)

---

(추가 API 스펙은 사용자 제공 후 업데이트)
