import { promises as fs } from "fs"
import path from "path"

import globby from "globby"
import globParent from "glob-parent"
import isPathInside from "is-path-inside"
import meow from "meow"
import prettier from "prettier"
import PQueue from "p-queue"

import { getEslintInstance } from "./eslint"

const FILE_OPTIONS = { encoding: "utf-8" }
const CWD = process.cwd()

function verifyInput(paths) {
  let hasExprError = false
  paths.forEach((expr) => {
    const exprParent = globParent(expr)
    if (!isPathInside(exprParent, CWD)) {
      console.error(`Input is outside of working directory: ${expr}!`)
      hasExprError = true
    }
  })
  if (hasExprError) {
    process.exit(1)
  }
}

function processFileFactory(fileName, cli) {
  return async () => {
    console.log(`Processing: ${fileName}...`)

    const filePath = path.resolve(fileName)
    const fixingEslint = getEslintInstance(filePath, cli.flags)

    const fileInput = await fs.readFile(filePath, FILE_OPTIONS)

    const prettierConfig = await prettier.resolveConfig(filePath)
    const formattedByPrettier = prettier.format(fileInput, {
      ...prettierConfig,
      filepath: filePath
    })

    const report = fixingEslint.executeOnText(formattedByPrettier, filePath)

    if (report.usedDeprecatedRules) {
      report.usedDeprecatedRules.forEach((deprecationMessage) => {
        console.warn(`Configuration uses deprecated rule: ${deprecationMessage.ruleId}!`)
      })
    }

    const fileResult = report.results[0]
    if (fileResult) {
      if (fileResult.messages) {
        fileResult.messages.forEach((messageEntry) => {
          console.log(messageEntry)
        })
      }

      const fileOutput = fileResult.output
      if (!fileOutput) {
        // Nothing was changed!
        return
      }

      if (fileInput !== fileOutput) {
        if (cli.flags.verbose) {
          console.log(`Writing changes to: ${filePath}...`)
        }

        await fs.writeFile(filePath, fileOutput, FILE_OPTIONS)
      }
    }
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
          default: 10
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
