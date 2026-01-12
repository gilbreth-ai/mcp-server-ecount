/**
 * ECOUNT MCP Server Configuration Types
 */

/**
 * ECOUNT API 인증 설정
 */
export interface EcountCredentials {
  /** 회사코드 (6자리) */
  comCode: string;
  /** 사용자 ID (마스터 ID) */
  userId: string;
  /** API 인증키 */
  apiCertKey: string;
}

/**
 * 서버 환경 설정
 */
export interface ServerConfig {
  /** 테스트 서버 사용 여부 (기본: false) */
  useTestServer?: boolean;
  /** 디버그 로깅 활성화 (기본: false) */
  debug?: boolean;
  /** 세션 파일 저장 경로 */
  sessionFilePath?: string;
  /** 캐시 TTL (밀리초, 기본: 10분) */
  cacheTtlMs?: number;
}

/**
 * 전체 MCP 서버 설정
 */
export interface EcountMcpConfig {
  credentials: EcountCredentials;
  server?: ServerConfig;
}

/**
 * 환경변수에서 설정 로드
 */
export function loadConfigFromEnv(): EcountMcpConfig {
  const comCode = process.env.ECOUNT_COM_CODE;
  const userId = process.env.ECOUNT_USER_ID;
  const apiCertKey = process.env.ECOUNT_API_CERT_KEY;

  if (!comCode || !userId || !apiCertKey) {
    throw new Error(
      'Missing required environment variables: ECOUNT_COM_CODE, ECOUNT_USER_ID, ECOUNT_API_CERT_KEY'
    );
  }

  return {
    credentials: {
      comCode,
      userId,
      apiCertKey,
    },
    server: {
      useTestServer: process.env.ECOUNT_USE_TEST_SERVER === 'true',
      debug: process.env.DEBUG === 'true',
      sessionFilePath: process.env.ECOUNT_SESSION_FILE,
      cacheTtlMs: process.env.ECOUNT_CACHE_TTL_MS
        ? parseInt(process.env.ECOUNT_CACHE_TTL_MS, 10)
        : undefined,
    },
  };
}
