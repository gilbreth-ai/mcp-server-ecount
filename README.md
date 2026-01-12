# ECOUNT MCP Server

A Model Context Protocol (MCP) server for [ECOUNT ERP](https://www.ecount.co.kr/) OpenAPI integration.

[![npm version](https://badge.fury.io/js/ecount-mcp.svg)](https://www.npmjs.com/package/ecount-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

This MCP server enables AI assistants like Claude to interact with ECOUNT ERP through natural language. It wraps ECOUNT's OpenAPI with proper session management, rate limiting, and caching.

### Features

- **22 Tools** - Products, customers, inventory, sales, purchases, production, accounting, e-commerce, attendance, bulletin board
- **Automatic Session Management** - Zone caching, session auto-renewal on expiry
- **Rate Limit Compliance** - Built-in rate limiter respecting ECOUNT's API limits
- **Response Caching** - 10-minute cache for query results
- **Error Handling** - Continuous error monitoring with user-friendly messages

## Quick Start

### Prerequisites

- **ECOUNT ERP Account** with Master ID privileges
- **API Certificate Key** ([How to get one](#api-certificate-key))
- **Node.js 18+**

### Installation

#### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ecount": {
      "command": "npx",
      "args": ["-y", "ecount-mcp"],
      "env": {
        "ECOUNT_COM_CODE": "your_company_code",
        "ECOUNT_USER_ID": "your_user_id",
        "ECOUNT_API_CERT_KEY": "your_api_key"
      }
    }
  }
}
```

#### Claude Code

```bash
claude mcp add ecount-mcp -e ECOUNT_COM_CODE=회사코드 -e ECOUNT_USER_ID=사용자ID -e ECOUNT_API_CERT_KEY=인증키
```

Or add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "ecount": {
      "command": "npx",
      "args": ["-y", "ecount-mcp"],
      "env": {
        "ECOUNT_COM_CODE": "your_company_code",
        "ECOUNT_USER_ID": "your_user_id",
        "ECOUNT_API_CERT_KEY": "your_api_key"
      }
    }
  }
}
```

## Tools

### Connection & Status

| Tool | Description |
|------|-------------|
| `ecount_test_connection` | Test API connection |
| `ecount_get_session_info` | Get current session status |
| `ecount_server_status` | Get server internal status (rate limits, cache, errors) |

### Products

| Tool | Description | Rate Limit |
|------|-------------|------------|
| `ecount_get_product` | Get single product details | 1s |
| `ecount_get_products` | Get multiple products | 10min |
| `ecount_create_product` | Create new products | 10s |

### Customers

| Tool | Description | Rate Limit |
|------|-------------|------------|
| `ecount_create_customer` | Create new customers | 10s |

### Inventory

| Tool | Description | Rate Limit |
|------|-------------|------------|
| `ecount_get_inventory` | Get inventory for single product | 1s |
| `ecount_get_inventory_list` | Get inventory for multiple products | 10min |
| `ecount_get_inventory_by_warehouse` | Get warehouse-level inventory (single) | 1s |
| `ecount_get_inventory_by_warehouse_list` | Get warehouse-level inventory (multiple) | 10min |

### Sales

| Tool | Description | Rate Limit |
|------|-------------|------------|
| `ecount_create_quotation` | Create quotation | 10s |
| `ecount_create_sale_order` | Create sales order | 10s |
| `ecount_create_sale` | Create sales slip | 10s |

### Purchases

| Tool | Description | Rate Limit |
|------|-------------|------------|
| `ecount_get_purchase_orders` | Get purchase orders | 10min |
| `ecount_create_purchase` | Create purchase slip | 10s |

### Production

| Tool | Description | Rate Limit |
|------|-------------|------------|
| `ecount_create_job_order` | Create job order | 10s |
| `ecount_create_goods_issued` | Create goods issued slip | 10s |
| `ecount_create_goods_receipt` | Create goods receipt slip | 10s |

### Accounting

| Tool | Description | Rate Limit |
|------|-------------|------------|
| `ecount_create_invoice` | Create sales/purchase invoice (auto journal) | 10s |

### E-Commerce

| Tool | Description | Rate Limit |
|------|-------------|------------|
| `ecount_create_openmarket_order` | Import orders from online marketplaces | 10s |

### Attendance

| Tool | Description | Rate Limit |
|------|-------------|------------|
| `ecount_create_clock_in_out` | Record attendance | 10s |

### Bulletin Board

| Tool | Description | Rate Limit |
|------|-------------|------------|
| `ecount_create_board_post` | Create board post | 10s |

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ECOUNT_COM_CODE` | Yes | ECOUNT company code (6 digits) |
| `ECOUNT_USER_ID` | Yes | ECOUNT user ID (must be Master ID) |
| `ECOUNT_API_CERT_KEY` | Yes | API certificate key |
| `ECOUNT_USE_TEST_SERVER` | No | Use test server (`true`) |
| `ECOUNT_SESSION_FILE` | No | Session file path for persistence |
| `DEBUG` | No | Enable debug logging (`true`) |

### API Certificate Key

1. Login to ECOUNT ERP with **Master ID**
2. Navigate to `Self-Customizing` > `External Connection Settings` > `Open API Management`
3. Apply for API usage and get certificate key
4. Start with test key for development, then get production key after verification

> **Note**: Only Master ID can issue API certificate keys.

## Rate Limits

ECOUNT OpenAPI has strict rate limits:

| API Type | Production | Test Server |
|----------|------------|-------------|
| Zone/Login | 10min | 10s |
| Batch Query | 10min | 10s |
| Single Query | 1s | 1s |
| Save | 10s | 10s |

### Additional Limits

- Consecutive errors per hour: **30** (blocked if exceeded)
- Daily API calls: **5,000**
- Max items per save: **300**

This MCP server automatically manages rate limits and returns friendly error messages when limits are reached.

## Security

**Never hardcode API credentials!**

```bash
# Create .env file for development
ECOUNT_COM_CODE=your_code
ECOUNT_USER_ID=your_id
ECOUNT_API_CERT_KEY=your_key

# Add to .gitignore
echo ".env" >> .gitignore
```

> **Warning**: Leaked ECOUNT credentials can compromise your entire ERP system.

## Development

```bash
# Clone repository
git clone https://github.com/gilbreth-ai/mcp-server-ecount.git
cd ecount-mcp

# Install dependencies
npm install

# Build
npm run build

# Development mode
npm run dev

# Test with MCP Inspector
npm run inspect
```

### Project Structure

```
ecount-mcp/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # MCP server setup
│   ├── client/
│   │   ├── ecount-client.ts  # API client
│   │   ├── session-manager.ts
│   │   ├── rate-limiter.ts
│   │   ├── cache.ts
│   │   └── error-counter.ts
│   ├── tools/
│   │   ├── register.ts       # Tool registration
│   │   └── schemas.ts        # Zod schemas
│   ├── types/
│   └── utils/
├── docs/                     # API documentation
├── package.json
└── README.md
```

## Usage Examples

### Check Inventory

```
User: "What's the inventory for product A001 across all warehouses?"

Claude uses ecount_get_inventory_by_warehouse tool.

Result:
- Main Warehouse: 100 units
- Distribution Center: 50 units
- Store: 25 units
Total: 175 units
```

### Create Sales Slip

```
User: "Create a sale for customer C001, product A001, 10 units at 1000 won each"

Claude uses ecount_create_sale tool.

Result:
- Slip No: 20240115-1
- Success: 1 item
```

## Troubleshooting

### "Item not found" error when saving

You need to configure "Web Data Upload" in ECOUNT ERP:
1. Go to the input menu (e.g., Sales > Sales Input)
2. Click "Web Data Upload" button at the bottom
3. Add required fields with "Add Upload Items"

### Session expires frequently

Increase auto-logout time in ERP settings:
- `ERP Settings` > `Security Settings` > `Auto Logout Time`

### Rate limit exceeded

Wait for the cooldown period. Use `ecount_server_status` to check current rate limit status.

## Disclaimer

This is a community project with no official affiliation to ECOUNT.
Using ECOUNT OpenAPI requires a valid ECOUNT account and API certificate key.
All API usage is subject to ECOUNT's terms of service.

## License

MIT

## Contributing

Bug reports, feature requests, and PRs are welcome!

- [Issues](https://github.com/gilbreth-ai/mcp-server-ecount/issues)
- [Pull Requests](https://github.com/gilbreth-ai/mcp-server-ecount/pulls)
