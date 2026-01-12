/**
 * ECOUNT MCP Logger
 *
 * MCP 서버에서는 stdout이 JSON-RPC 통신에 사용되므로
 * 모든 로그는 반드시 stderr로 출력해야 함
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

/**
 * 로거 인터페이스
 */
export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: unknown): void;
}

/**
 * 기본 로거 구현
 * 모든 출력을 stderr로 보냄
 */
class ConsoleLogger implements Logger {
  private enabled: boolean;
  private minLevel: LogLevel;

  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(options: { enabled?: boolean; minLevel?: LogLevel } = {}) {
    this.enabled = options.enabled ?? true;
    this.minLevel = options.minLevel ?? 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    return `${prefix} ${entry.message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    // 항상 stderr로 출력 (stdout은 MCP JSON-RPC 전용)
    console.error(this.formatEntry(entry));
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: unknown): void {
    let errorData: Record<string, unknown> | undefined;

    if (error instanceof Error) {
      errorData = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error !== undefined) {
      errorData = { error: String(error) };
    }

    this.log('error', message, errorData);
  }
}

/**
 * Null 로거 (로깅 비활성화)
 */
class NullLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

// 글로벌 로거 인스턴스
let globalLogger: Logger = new ConsoleLogger({
  enabled: true,
  minLevel: process.env.DEBUG === 'true' ? 'debug' : 'info',
});

/**
 * 글로벌 로거 가져오기
 */
export function getLogger(): Logger {
  return globalLogger;
}

/**
 * 글로벌 로거 설정
 */
export function setLogger(logger: Logger): void {
  globalLogger = logger;
}

/**
 * 로거 생성
 */
export function createLogger(options?: {
  enabled?: boolean;
  minLevel?: LogLevel;
}): Logger {
  if (options?.enabled === false) {
    return new NullLogger();
  }
  return new ConsoleLogger(options);
}

export default getLogger;
