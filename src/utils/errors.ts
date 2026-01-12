/**
 * ECOUNT MCP Error Classes
 *
 * 계층적 에러 처리를 위한 커스텀 에러 클래스들
 */

/**
 * 기본 ECOUNT 에러
 */
export class EcountError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EcountError';
    // V8 엔진에서만 사용 가능
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * 인증 관련 에러
 * - 세션 만료
 * - 잘못된 인증키
 * - Zone 조회 실패
 */
export class EcountAuthError extends EcountError {
  constructor(
    message: string,
    code?: string,
    public readonly isSessionExpired: boolean = false
  ) {
    super(message, code);
    this.name = 'EcountAuthError';
  }

  static sessionExpired(reason?: string): EcountAuthError {
    const message = reason || '세션이 만료되었습니다. 재로그인이 필요합니다.';
    return new EcountAuthError(
      message,
      'SESSION_EXPIRED',
      true
    );
  }

  static timeout(operation: string): EcountAuthError {
    return new EcountAuthError(
      `${operation} 요청 타임아웃. 네트워크 상태를 확인하세요.`,
      'TIMEOUT',
      false
    );
  }

  static invalidCredentials(): EcountAuthError {
    return new EcountAuthError(
      '인증 정보가 올바르지 않습니다. 회사코드, 사용자ID, API인증키를 확인하세요.',
      'INVALID_CREDENTIALS'
    );
  }

  static zoneNotFound(): EcountAuthError {
    return new EcountAuthError(
      'Zone 정보를 찾을 수 없습니다. 회사코드를 확인하세요.',
      'ZONE_NOT_FOUND'
    );
  }
}

/**
 * Rate Limit 에러
 * - 10분/1회 제한 초과 (조회 API)
 * - 10초/1회 제한 초과 (저장 API)
 * - 1초/1회 제한 초과 (단건 조회)
 */
export class EcountRateLimitError extends EcountError {
  constructor(
    message: string,
    public readonly retryAfterMs: number,
    public readonly apiType: 'zone' | 'login' | 'query' | 'query_single' | 'save'
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', { retryAfterMs, apiType });
    this.name = 'EcountRateLimitError';
  }

  static forApiType(
    apiType: 'zone' | 'login' | 'query' | 'query_single' | 'save',
    retryAfterMs: number
  ): EcountRateLimitError {
    const apiNames: Record<string, string> = {
      zone: 'Zone 조회',
      login: '로그인',
      query: '다건 조회',
      query_single: '단건 조회',
      save: '저장',
    };

    const waitSeconds = Math.ceil(retryAfterMs / 1000);
    return new EcountRateLimitError(
      `Rate Limit 초과 (${apiNames[apiType]}). ${waitSeconds}초 후 재시도 가능.`,
      retryAfterMs,
      apiType
    );
  }
}

/**
 * 입력 검증 에러
 * - 필수 파라미터 누락
 * - 잘못된 형식
 */
export class EcountValidationError extends EcountError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'EcountValidationError';
  }

  static required(field: string): EcountValidationError {
    return new EcountValidationError(`필수 항목이 누락되었습니다: ${field}`, field);
  }

  static invalidFormat(field: string, expected: string): EcountValidationError {
    return new EcountValidationError(
      `잘못된 형식입니다: ${field} (예상: ${expected})`,
      field
    );
  }
}

/**
 * API 호출 에러
 * - HTTP 에러
 * - 네트워크 에러
 * - 응답 파싱 에러
 */
export class EcountApiCallError extends EcountError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly endpoint?: string,
    public readonly traceId?: string
  ) {
    super(message, 'API_CALL_ERROR', { statusCode, endpoint, traceId });
    this.name = 'EcountApiCallError';
  }

  static httpError(statusCode: number, endpoint: string): EcountApiCallError {
    return new EcountApiCallError(
      `HTTP ${statusCode} 에러가 발생했습니다.`,
      statusCode,
      endpoint
    );
  }

  static networkError(endpoint: string, cause?: Error): EcountApiCallError {
    const error = new EcountApiCallError(
      `네트워크 에러가 발생했습니다: ${cause?.message || 'Unknown'}`,
      undefined,
      endpoint
    );
    if (cause) error.cause = cause;
    return error;
  }

  static parseError(endpoint: string): EcountApiCallError {
    return new EcountApiCallError(
      '응답을 파싱할 수 없습니다. API 응답 형식이 예상과 다릅니다.',
      undefined,
      endpoint
    );
  }
}

/**
 * 연속 오류 한도 초과 에러
 * 시간당 30건 오류 시 차단
 */
export class EcountErrorLimitError extends EcountError {
  constructor(public readonly errorCount: number) {
    super(
      `연속 오류 한도(30건)에 근접했습니다. 현재 ${errorCount}건. 잠시 후 다시 시도하세요.`,
      'ERROR_LIMIT_EXCEEDED',
      { errorCount }
    );
    this.name = 'EcountErrorLimitError';
  }
}

/**
 * 에러가 재시도 가능한지 확인
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof EcountAuthError && error.isSessionExpired) {
    return true;
  }
  if (error instanceof EcountRateLimitError) {
    return false; // Rate Limit은 즉시 실패
  }
  if (error instanceof EcountApiCallError && error.statusCode) {
    // 5xx 에러는 재시도 가능
    return error.statusCode >= 500 && error.statusCode < 600;
  }
  return false;
}

/**
 * 에러 메시지를 사용자 친화적으로 변환
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof EcountError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
