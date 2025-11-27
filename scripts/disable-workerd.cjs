// Disable workerd binary execution by intercepting child_process
const Module = require('module');
const originalRequire = Module.prototype.require;
const { Readable, Writable } = require('stream');

// Create a mock child process that satisfies miniflare's expectations
function createMockProcess() {
  const EventEmitter = require('events');
  const mockProcess = new EventEmitter();
  
  // Create proper stream objects
  mockProcess.stdout = new Readable();
  mockProcess.stderr = new Readable();
  mockProcess.stdin = new Writable();
  
  // Add required methods
  mockProcess.kill = function(signal) {
    this.emit('exit', 0);
    return true;
  };
  mockProcess.on = EventEmitter.prototype.on;
  mockProcess.once = EventEmitter.prototype.once;
  mockProcess.off = EventEmitter.prototype.off;
  mockProcess.removeListener = EventEmitter.prototype.removeListener;
  mockProcess.removeAllListeners = EventEmitter.prototype.removeAllListeners;
  mockProcess.emit = EventEmitter.prototype.emit;
  mockProcess.listeners = EventEmitter.prototype.listeners;
  mockProcess.rawListeners = EventEmitter.prototype.rawListeners;
  mockProcess.listenerCount = EventEmitter.prototype.listenerCount;
  mockProcess.prependListener = EventEmitter.prototype.prependListener;
  mockProcess.prependOnceListener = EventEmitter.prototype.prependOnceListener;
  
  // End streams immediately
  mockProcess.stdout.push(null);
  mockProcess.stderr.push(null);
  
  return mockProcess;
}

// Intercept require to stub out workerd spawn attempts
Module.prototype.require = function(id) {
  const module = originalRequire.apply(this, arguments);
  
  if (id === 'child_process' || id.includes('child_process')) {
    // Wrap spawn to prevent workerd from running
    const spawn = module.spawn;
    module.spawn = function(...args) {
      const cmd = args[0];
      if (typeof cmd === 'string' && cmd.includes('workerd')) {
        console.warn(`[WORKERD-SKIP] Intercepted workerd spawn: ${cmd}`);
        // Return a mock child process that immediately exits with success
        const mockProcess = createMockProcess();
        process.nextTick(() => mockProcess.emit('exit', 0));
        return mockProcess;
      }
      return spawn.apply(module, arguments);
    };
  }
  
  return module;
};

// Also set environment variable
process.env.CLOUDFLARE_WORKERD_SKIP = '1';
