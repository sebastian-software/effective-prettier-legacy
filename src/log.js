let vscode
try {
  // eslint-disable-next-line global-require
  vscode = require("vscode")
} catch (importError) {
  // pass
}

let impl
if (vscode && vscode.window && vscode.window.createOutputChannel) {
  const channel = window.createOutputChannel("Prettier ESLint")
  impl = (...messages) => {
    channel.appendLine(messages.join("\n"))
  }
} else {
  impl = console.log.bind(console)
}

export function debug(...messages) {
  impl(...messages)
}
