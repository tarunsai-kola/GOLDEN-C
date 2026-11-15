const isDev = process.env.NODE_ENV === 'development';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
};

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info: (msg, ...args) => {
    console.log(`${colors.cyan}[INFO]${colors.reset} ${colors.gray}${timestamp()}${colors.reset} ${msg}`, ...args);
  },
  warn: (msg, ...args) => {
    console.warn(`${colors.yellow}[WARN]${colors.reset} ${colors.gray}${timestamp()}${colors.reset} ${msg}`, ...args);
  },
  error: (msg, ...args) => {
    console.error(`${colors.red}[ERROR]${colors.reset} ${colors.gray}${timestamp()}${colors.reset} ${msg}`, ...args);
  },
  debug: (msg, ...args) => {
    if (isDev) {
      console.log(`${colors.green}[DEBUG]${colors.reset} ${colors.gray}${timestamp()}${colors.reset} ${msg}`, ...args);
    }
  },
  success: (msg, ...args) => {
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${colors.gray}${timestamp()}${colors.reset} ${msg}`, ...args);
  },
};

module.exports = logger;
