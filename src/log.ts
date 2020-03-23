// eslint-disable-next-line import/no-unresolved
import type { OutputChannel } from "vscode"

let channel
try {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const vscode = require("vscode")
  channel = vscode.createOutputChannel("Prettier ESLint") as OutputChannel
} catch (importError) {
  // pass
}

let impl
if (channel) {
  impl = (...messages) => {
    channel.appendLine(messages.join("\n"))
  }
} else {
  impl = console.log.bind(console)
}

export function debug(...messages) {
  impl(...messages)
}
