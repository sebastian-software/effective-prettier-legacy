export type Messages = (string | number)[]

export interface LoggingApi {
  warn: (...messages: Messages) => void
  error: (...messages: Messages) => void
  info: (...messages: Messages) => void
  debug: (...messages: Messages) => void
}

const impl: LoggingApi = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
}

export function connectLogger(api: LoggingApi): void {
  if (api.warn) {
    impl.warn = api.warn
  }

  if (api.error) {
    impl.error = api.error
  }

  if (api.info) {
    impl.info = api.info
  }

  if (api.debug) {
    impl.debug = api.debug
  }
}

export function warn(...messages: Messages): void {
  impl.warn(...messages)
}

export function error(...messages: Messages): void {
  impl.error(...messages)
}

export function info(...messages: Messages): void {
  impl.info(...messages)
}

export function debug(...messages: Messages): void {
  impl.debug(...messages)
}
