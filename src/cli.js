import { promises as fs } from "fs"
import path from "path"

import meow from "meow"
import { CLIEngine } from "eslint"
import prettier from "prettier"
import PQueue from "p-queue"

const FILE_OPTIONS = { encoding: "utf-8" }

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

  const eslintOptions = {
    cwd: process.cwd(),
    useEslintrc: true
  }
  const eslint = new CLIEngine(eslintOptions)

  const fileTasks = cli.input.map((fileName) => async () => {
    console.log(`Processing: ${fileName}...`)

    const filePath = path.resolve(fileName)
    const fileConfig = eslint.getConfigForFile(filePath)

    const localEslint = new CLIEngine({
      useEslintrc: false,
      plugins: fileConfig.plugins
    })
    const rules = localEslint.getRules()
    const fileRules = fileConfig.rules

    Object.entries(fileRules).forEach(([ name, rule ]) => {
      const ruleImpl = rules.get(name)
      if (ruleImpl) {
        if (fileRules[name] === "off" || fileRules[name][0] === "off") {
          delete fileRules[name]
          return
        }

        // console.log(ruleImpl.meta)
        if (ruleImpl.meta && ruleImpl.meta.fixable) {
          if (cli.flags.verbose) {
            // console.log("- Auto fixing: " + name)
          }
        } else {
          // Disable all non-fixable rules
          // fileRules[name] = "off"
          delete fileRules[name]
        }
      } else {
        console.log(`Did not found rule ${name}!`)
      }
    })

    // console.log('Config', fileConfig)

    const fixingEslint = new CLIEngine({
      ...fileConfig,
      useEslintrc: false,
      // plugins: fileConfig.plugins,
      fix: true,
      globals: [],
      rules: fileRules
    })

    const fileInput = await fs.readFile(filePath, FILE_OPTIONS)
    const report = fixingEslint.executeOnText(fileInput, filePath)
    console.log(report)

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
        console.warn(`Issues during processing eslint for ${filePath}!`)
        return
      }

      if (fileInput !== fileOutput) {
        if (cli.flags.verbose) {
          console.log(`Writing changes to: ${filePath}...`)
        }

        await fs.writeFile(filePath, fileOutput, FILE_OPTIONS)
      }
    }
  })

  const queue = new PQueue({ concurrency: cli.flags.concurrency })
  queue.on("active", () => {
    console.log(`Queue Size: ${queue.size} / Pending: ${queue.pending}`)
  })

  await queue.addAll(fileTasks)
}

main()
