/**
 * ECOUNT MCP Server
 *
 * 이카운트 ERP OpenAPI를 위한 MCP 서버
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { EcountMcpConfig } from './types/config.js';
import { EcountClient } from './client/ecount-client.js';
import { registerTools } from './tools/register.js';
import { getLogger, createLogger, setLogger } from './utils/logger.js';

/**
 * MCP 서버 옵션
 */
interface ServerOptions {
  config: EcountMcpConfig;
  name?: string;
  version?: string;
}

/**
 * MCP 서버 생성 및 시작
 */
export async function createServer(options: ServerOptions): Promise<McpServer> {
  const { config, name = 'ecount-mcp', version = '0.1.0' } = options;

  // 로거 설정
  const logger = createLogger({
    enabled: true,
    minLevel: config.server?.debug ? 'debug' : 'info',
  });
  setLogger(logger);

  logger.info('Creating ECOUNT MCP server', { name, version });

  // MCP 서버 생성
  const server = new McpServer({
    name,
    version,
  });

  // ECOUNT 클라이언트 생성
  const client = new EcountClient(config);

  // 클라이언트 초기화
  await client.initialize();

  // 도구 등록
  registerTools(server, client);

  logger.info('ECOUNT MCP server created successfully');

  return server;
}

/**
 * Stdio 트랜스포트로 서버 실행
 */
export async function runServer(options: ServerOptions): Promise<void> {
  const logger = getLogger();
  const server = await createServer(options);

  // Stdio 트랜스포트 연결
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('ECOUNT MCP server running on stdio');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down server...');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', reason);
  });
}
