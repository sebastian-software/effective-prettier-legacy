import path from "path"

import meow from "meow"
import { CLIEngine } from "eslint"
import prettier from "prettier"
import PQueue from "p-queue"

async function main() {
  const cli = meow(
    `
  Usage
    $ prettier-eslint <input>

  Options
    --verbose, -v  Increase log level

  Examples
    $ lean-prettier-eslint filename.js --verbose
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
    console.log("Processing: ", fileName)

    const fileConfig = eslint.getConfigForFile(path.resolve(fileName))

    const localEslint = new CLIEngine({
      plugins: fileConfig.plugins
    })
    const rules = localEslint.getRules()
    const fileRules = fileConfig.rules

    Object.entries(fileRules).forEach(([ name, rule ]) => {
      const ruleImpl = rules.get(name)
      if (ruleImpl) {
        // console.log(ruleImpl.meta)
        if (ruleImpl.meta && ruleImpl.meta.fixable) {
          if (cli.flags.verbose) {
            // console.log("- Auto fixing: " + name)
          }
        } else {
          // Disable all non-fixable rules
          fileRules[name] = "off"
        }
      } else {
        console.log("Did not found:", name)
        // process.exit(1)
      }
    })

    // console.log("Config", fileConfig)
  })

  const queue = new PQueue({ concurrency: cli.flags.concurrency })
  queue.on("active", () => {
    console.log(`Queue Size: ${queue.size} / Pending: ${queue.pending}`)
  })

  await queue.addAll(fileTasks)
}

main()
