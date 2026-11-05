/**
 * Lightweight logger utility.
 * Wraps console methods with a structured prefix and respects NODE_ENV.
 */

const isDev = process.env.NODE_ENV !== 'production';

function formatMessage(level: string, message: string): string {
  return `[${new Date().toISOString()}] [${level}] ${message}`;
}

export const logger = {
  info(...args: unknown[]): void {
    if (isDev) {
      console.info(formatMessage('INFO', String(args[0])), ...args.slice(1));
    }
  },
  warn(...args: unknown[]): void {
    console.warn(formatMessage('WARN', String(args[0])), ...args.slice(1));
  },
  error(...args: unknown[]): void {
    console.error(formatMessage('ERROR', String(args[0])), ...args.slice(1));
  },
  debug(...args: unknown[]): void {
    if (isDev) {
      console.debug(formatMessage('DEBUG', String(args[0])), ...args.slice(1));
    }
  },
};

