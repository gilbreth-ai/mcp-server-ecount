import { describe, it, expect } from 'vitest';
import {
  EcountError,
  EcountAuthError,
  EcountApiCallError,
  EcountRateLimitError,
  EcountValidationError,
  EcountErrorLimitError,
  isRetryableError,
  isTransientError,
  isTimeoutError,
  isNetworkError,
  formatErrorMessage,
} from './errors.js';

describe('EcountError', () => {
  it('should create error with message and code', () => {
    const error = new EcountError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('EcountError');
  });

  it('should create error with details', () => {
    const error = new EcountError('Test', 'CODE', { foo: 'bar' });
    expect(error.details).toEqual({ foo: 'bar' });
  });

  it('should serialize to JSON', () => {
    const error = new EcountError('Test', 'CODE', { foo: 'bar' });
    const json = error.toJSON();
    expect(json.name).toBe('EcountError');
    expect(json.message).toBe('Test');
    expect(json.code).toBe('CODE');
    expect(json.details).toEqual({ foo: 'bar' });
  });
});

describe('EcountAuthError', () => {
  it('should create session expired error', () => {
    const error = EcountAuthError.sessionExpired();
    expect(error.isSessionExpired).toBe(true);
    expect(error.code).toBe('SESSION_EXPIRED');
    expect(error.name).toBe('EcountAuthError');
  });

  it('should create session expired error with custom reason', () => {
    const error = EcountAuthError.sessionExpired('Custom reason');
    expect(error.message).toBe('Custom reason');
    expect(error.isSessionExpired).toBe(true);
  });

  it('should create timeout error', () => {
    const error = EcountAuthError.timeout('Login');
    expect(error.code).toBe('TIMEOUT');
    expect(error.message).toContain('Login');
    expect(error.isSessionExpired).toBe(false);
  });

  it('should create invalid credentials error', () => {
    const error = EcountAuthError.invalidCredentials();
    expect(error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should create zone not found error', () => {
    const error = EcountAuthError.zoneNotFound();
    expect(error.code).toBe('ZONE_NOT_FOUND');
  });
});

describe('EcountApiCallError', () => {
  it('should create HTTP error', () => {
    const error = EcountApiCallError.httpError(500, '/api/test');
    expect(error.statusCode).toBe(500);
    expect(error.endpoint).toBe('/api/test');
    expect(error.message).toContain('500');
    expect(error.name).toBe('EcountApiCallError');
  });

  it('should create network error without cause', () => {
    const error = EcountApiCallError.networkError('/api/test');
    expect(error.statusCode).toBeUndefined();
    expect(error.endpoint).toBe('/api/test');
    expect(error.message).toContain('네트워크 에러');
  });

  it('should create network error with cause', () => {
    const cause = new Error('Connection refused');
    const error = EcountApiCallError.networkError('/api/test', cause);
    expect(error.statusCode).toBeUndefined();
    expect(error.endpoint).toBe('/api/test');
    expect(error.cause).toBe(cause);
    expect(error.message).toContain('Connection refused');
  });

  it('should create parse error', () => {
    const error = EcountApiCallError.parseError('/api/test');
    expect(error.endpoint).toBe('/api/test');
    expect(error.message).toContain('파싱');
  });
});

describe('EcountRateLimitError', () => {
  it('should create rate limit error', () => {
    const error = new EcountRateLimitError('Rate limit', 5000, 'save_product');
    expect(error.retryAfterMs).toBe(5000);
    expect(error.apiType).toBe('save_product');
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(error.name).toBe('EcountRateLimitError');
  });

  it('should create rate limit error for API type', () => {
    const error = EcountRateLimitError.forApiType('query_products', 60000);
    expect(error.retryAfterMs).toBe(60000);
    expect(error.apiType).toBe('query_products');
    expect(error.message).toContain('60');
  });
});

describe('EcountValidationError', () => {
  it('should create required field error', () => {
    const error = EcountValidationError.required('PROD_CD');
    expect(error.field).toBe('PROD_CD');
    expect(error.message).toContain('PROD_CD');
    expect(error.name).toBe('EcountValidationError');
  });

  it('should create invalid format error', () => {
    const error = EcountValidationError.invalidFormat('date', 'YYYYMMDD');
    expect(error.field).toBe('date');
    expect(error.message).toContain('YYYYMMDD');
  });
});

describe('EcountErrorLimitError', () => {
  it('should create error limit error', () => {
    const error = new EcountErrorLimitError(25);
    expect(error.errorCount).toBe(25);
    expect(error.code).toBe('ERROR_LIMIT_EXCEEDED');
    expect(error.name).toBe('EcountErrorLimitError');
  });
});

describe('isRetryableError', () => {
  it('should return true for session expired', () => {
    const error = EcountAuthError.sessionExpired();
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return false for rate limit', () => {
    const error = new EcountRateLimitError('Rate limit', 5000, 'save_product');
    expect(isRetryableError(error)).toBe(false);
  });

  it('should return true for 5xx errors', () => {
    expect(isRetryableError(EcountApiCallError.httpError(500, '/test'))).toBe(true);
    expect(isRetryableError(EcountApiCallError.httpError(502, '/test'))).toBe(true);
    expect(isRetryableError(EcountApiCallError.httpError(503, '/test'))).toBe(true);
    expect(isRetryableError(EcountApiCallError.httpError(599, '/test'))).toBe(true);
  });

  it('should return false for 4xx errors', () => {
    expect(isRetryableError(EcountApiCallError.httpError(400, '/test'))).toBe(false);
    expect(isRetryableError(EcountApiCallError.httpError(404, '/test'))).toBe(false);
    expect(isRetryableError(EcountApiCallError.httpError(429, '/test'))).toBe(false);
  });

  it('should return false for generic errors', () => {
    expect(isRetryableError(new Error('Generic error'))).toBe(false);
    expect(isRetryableError(new EcountError('Generic'))).toBe(false);
  });
});

describe('isTimeoutError', () => {
  it('should return true for EcountError with TIMEOUT code', () => {
    const error = new EcountError('Timeout', 'TIMEOUT');
    expect(isTimeoutError(error)).toBe(true);
  });

  it('should return true for EcountAuthError timeout', () => {
    const error = EcountAuthError.timeout('Login');
    expect(isTimeoutError(error)).toBe(true);
  });

  it('should return true for AbortError', () => {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    expect(isTimeoutError(error)).toBe(true);
  });

  it('should return false for other errors', () => {
    expect(isTimeoutError(new Error('Other'))).toBe(false);
    expect(isTimeoutError(new EcountError('Error', 'OTHER'))).toBe(false);
    expect(isTimeoutError(EcountApiCallError.httpError(500, '/test'))).toBe(false);
  });
});

describe('isNetworkError', () => {
  it('should return true for network error without status code', () => {
    const error = EcountApiCallError.networkError('/test');
    expect(isNetworkError(error)).toBe(true);
  });

  it('should return true for network error with cause', () => {
    const error = EcountApiCallError.networkError('/test', new Error('DNS failed'));
    expect(isNetworkError(error)).toBe(true);
  });

  it('should return false for HTTP error with status code', () => {
    const error = EcountApiCallError.httpError(500, '/test');
    expect(isNetworkError(error)).toBe(false);
  });

  it('should return true for TypeError with fetch message', () => {
    const error = new TypeError('Failed to fetch');
    expect(isNetworkError(error)).toBe(true);
  });

  it('should return false for other TypeError', () => {
    const error = new TypeError('Cannot read property');
    expect(isNetworkError(error)).toBe(false);
  });
});

describe('isTransientError', () => {
  describe('5xx errors', () => {
    it('should return true for 500 Internal Server Error', () => {
      expect(isTransientError(EcountApiCallError.httpError(500, '/test'))).toBe(true);
    });

    it('should return true for 502 Bad Gateway', () => {
      expect(isTransientError(EcountApiCallError.httpError(502, '/test'))).toBe(true);
    });

    it('should return true for 503 Service Unavailable', () => {
      expect(isTransientError(EcountApiCallError.httpError(503, '/test'))).toBe(true);
    });

    it('should return true for 504 Gateway Timeout', () => {
      expect(isTransientError(EcountApiCallError.httpError(504, '/test'))).toBe(true);
    });
  });

  describe('timeout errors', () => {
    it('should return true for EcountError TIMEOUT', () => {
      const error = new EcountError('Timeout', 'TIMEOUT');
      expect(isTransientError(error)).toBe(true);
    });

    it('should return true for AbortError', () => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      expect(isTransientError(error)).toBe(true);
    });
  });

  describe('network errors', () => {
    it('should return true for network error', () => {
      const error = EcountApiCallError.networkError('/test');
      expect(isTransientError(error)).toBe(true);
    });

    it('should return true for fetch TypeError', () => {
      const error = new TypeError('Failed to fetch');
      expect(isTransientError(error)).toBe(true);
    });
  });

  describe('non-transient errors', () => {
    it('should return false for 4xx errors', () => {
      expect(isTransientError(EcountApiCallError.httpError(400, '/test'))).toBe(false);
      expect(isTransientError(EcountApiCallError.httpError(404, '/test'))).toBe(false);
      expect(isTransientError(EcountApiCallError.httpError(429, '/test'))).toBe(false);
    });

    it('should return false for rate limit errors', () => {
      const error = new EcountRateLimitError('Rate limit', 5000, 'save_product');
      expect(isTransientError(error)).toBe(false);
    });

    it('should return false for validation errors', () => {
      const error = EcountValidationError.required('PROD_CD');
      expect(isTransientError(error)).toBe(false);
    });

    it('should return false for session expired (handled by different mechanism)', () => {
      const error = EcountAuthError.sessionExpired();
      expect(isTransientError(error)).toBe(false);
    });

    it('should return false for generic errors', () => {
      expect(isTransientError(new Error('Generic'))).toBe(false);
    });
  });
});

describe('formatErrorMessage', () => {
  it('should return message from EcountError', () => {
    const error = new EcountError('Test message');
    expect(formatErrorMessage(error)).toBe('Test message');
  });

  it('should return message from regular Error', () => {
    const error = new Error('Regular error');
    expect(formatErrorMessage(error)).toBe('Regular error');
  });

  it('should stringify string values', () => {
    expect(formatErrorMessage('string error')).toBe('string error');
  });

  it('should stringify number values', () => {
    expect(formatErrorMessage(123)).toBe('123');
  });

  it('should stringify null and undefined', () => {
    expect(formatErrorMessage(null)).toBe('null');
    expect(formatErrorMessage(undefined)).toBe('undefined');
  });
});
