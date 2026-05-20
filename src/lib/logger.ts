/**
 * Debug-level logging utility.
 *
 * Wraps console methods so we have a single place to control
 * logging behaviour (e.g. suppress in production, mock in tests).
 * Error-level messages are always emitted and never suppressed.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error']
const noop = () => {}

let minIdx = LEVELS.indexOf('warn')

function enabled(level: LogLevel): boolean {
  return LEVELS.indexOf(level) >= minIdx
}

export const logger = {
  get debug() { return enabled('debug') ? console.debug.bind(console) : noop },
  get info() { return enabled('info') ? console.info.bind(console) : noop },
  get warn() { return enabled('warn') ? console.warn.bind(console) : noop },
  get error() { return console.error.bind(console) },
}

export const debug = logger.debug
export const info = logger.info
export const warn = logger.warn
export const error = logger.error

export function setLoggerMinLevel(level: LogLevel) {
  minIdx = LEVELS.indexOf(level)
}
