#!/usr/bin/env node
import { BlockbenchMCPServer } from './mcp/server.js';

async function main() {
  const server = new BlockbenchMCPServer();
  await server.start();
}

main().catch((err) => {
  console.error('Fatal error in Blockbench MCP Server:', err);
  process.exit(1);
});
