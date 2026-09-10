#!/usr/bin/env node
/**
 * Quantum-Trade Model Context Protocol (MCP) Stdio Bridge for Claude Desktop
 * 
 * Petunjuk Penggunaan dengan Claude Desktop:
 * 1. Letakkan file ini di komputer Anda atau referensikan path file ini.
 * 2. Tambahkan ke file claude_desktop_config.json:
 *    - macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
 *    - Windows: %APPDATA%\Claude\claude_desktop_config.json
 * 
 * Contoh Konfigurasi:
 * {
 *   "mcpServers": {
 *     "quantum-trade": {
 *       "command": "node",
 *       "args": ["/path/to/mcp-bridge.cjs"],
 *       "env": {
 *         "SYSTEM_URL": "https://ais-dev-gvh6t645h5tqg2vbp5ngd7-668283931978.asia-southeast1.run.app"
 *       }
 *     }
 *   }
 * }
 */

const readline = require('readline');
const http = require('http');
const https = require('https');

const SYSTEM_URL = process.env.SYSTEM_URL || 'http://localhost:3000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

async function forwardToMcpServer(request) {
  return new Promise((resolve) => {
    try {
      const url = new URL('/api/mcp', SYSTEM_URL);
      const postData = JSON.stringify(request);
      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
          timeout: 10000,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              resolve(parsed);
            } catch {
              resolve({
                jsonrpc: '2.0',
                id: request.id,
                error: { code: -32603, message: 'Invalid JSON response from Quantum-Trade server' },
              });
            }
          });
        }
      );

      req.on('error', (err) => {
        resolve({
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32000, message: `Connection error: ${err.message}` },
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32000, message: 'Request to Quantum-Trade server timed out' },
        });
      });

      req.write(postData);
      req.end();
    } catch (err) {
      resolve({
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32603, message: err.message },
      });
    }
  });
}

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const request = JSON.parse(trimmed);
    const response = await forwardToMcpServer(request);
    if (response) {
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  } catch (err) {
    process.stdout.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error: ' + err.message },
      }) + '\n'
    );
  }
});
