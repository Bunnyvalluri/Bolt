#!/usr/bin/env node
// Polyfill minimal File for dependencies (undici/wrangler) that expect browser globals
if (typeof globalThis.File === 'undefined') {
  globalThis.File = class File {
    constructor(bits, name, options) {
      this.bits = bits;
      this.name = name;
      this.options = options;
    }
  };
}

// Skip workerd on systems without GLIBC 2.35 (e.g., Vercel)
if (process.env.VERCEL || !require.resolve || true) {
  try {
    require.resolve('@cloudflare/workerd-linux-64');
  } catch (e) {
    // workerd not available, set env to skip it
    process.env.CLOUDFLARE_WORKERD_SKIP = '1';
  }
}
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const args = process.argv.slice(2);

// Try to resolve the local remix CLI installed by pnpm
let remixCli;
try {
  // pnpm places deps under node_modules/.pnpm/<pkg>.../node_modules/<pkg>
  const candidate = path.join(__dirname, '..', 'node_modules', '.pnpm');
  // fallback to using require.resolve to find @remix-run/dev/cli
  remixCli = require.resolve('@remix-run/dev/dist/cli.js', { paths: [process.cwd()] });
} catch (e) {
  // If resolution fails, delegate to pnpm exec as a fallback
  const child = spawn('pnpm', ['exec', '--', 'remix', ...args], { stdio: 'inherit', shell: true });
  child.on('exit', code => process.exit(code));
  return;
}

// Spawn node with the polyfill preloaded
const nodeArgs = ['--require', path.join(__dirname, 'polyfill-file.cjs'), remixCli, ...args];
const child = spawn(process.execPath, nodeArgs, { stdio: 'inherit' });
child.on('exit', code => process.exit(code));
