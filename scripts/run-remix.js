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
const { spawn } = require('child_process');
const args = process.argv.slice(2);
// Delegate to the local remix binary via pnpm exec
const child = spawn('pnpm', ['exec', '--', 'remix', ...args], { stdio: 'inherit', shell: true });
child.on('exit', code => process.exit(code));
