import path from "path"

import globby from "globby"
import globParent from "glob-parent"
import isPathInside from "is-path-inside"
import meow from "meow"
import PQueue from "p-queue"

import { formatFile } from '.'

const CWD = process.cwd()

function verifyInput(paths) {
  let hasExprError = false
  paths.forEach((expr) => {
    const exprParent = path.resolve(globParent(expr))
    if (exprParent !== CWD && !isPathInside(exprParent, CWD)) {
      console.error(`Input is outside of working directory: ${expr}!`)
      hasExprError = true
    }
  })
  if (hasExprError) {
    process.exit(1)
  }
}

function processFileFactory(fileName, options) {
  return async () => {
    console.log(`Processing: ${fileName}...`)

    const filePath = path.resolve(fileName)
    await formatFile(filePath, options)
  }
}

async function main() {
  const cli = meow(
    `
  Usage
    $ prettier-eslint <input>

  Options
    --verbose, -v  Increase log level

  Examples
    $ prettier-eslint filename.js --verbose
`,
    {
      flags: {
        verbose: {
          type: "boolean",
          alias: "v"
        },

        concurrency: {
          type: "number",
          default: 4
        }
      }
    }
  )

  if (cli.flags.verbose) {
    console.log("Files: ", cli.input)
    console.log("Flags: ", cli.flags)
  }

  verifyInput(cli.input)

  const fileNames = await globby(cli.input, { gitignore: true })
  const fileTasks = fileNames.map((fileName) => processFileFactory(fileName, cli))

  const queue = new PQueue({ concurrency: cli.flags.concurrency })
  if (cli.flags.verbose) {
    queue.on("active", () => {
      console.log(`Queue Size: ${queue.size}`)
    })
  }

  await queue.addAll(fileTasks)
}

main()
