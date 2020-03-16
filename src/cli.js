import { promises as fs } from "fs"
import path from "path"

import globby from "globby"
import meow from "meow"
import { CLIEngine } from "eslint"
import prettier from "prettier"
import PQueue from "p-queue"

const FILE_OPTIONS = { encoding: "utf-8" }

const warnedOnRules = new Set()
function warnRuleNotFound(ruleId) {
  if (warnedOnRules.has(ruleId)) {
    return
  }

  console.log(`Did not found rule ${ruleId}!`)
  warnedOnRules.add(ruleId)
}

const eslintOptions = {
  cwd: process.cwd(),
  useEslintrc: true
}
const cwdEsLint = new CLIEngine(eslintOptions)

const eslintConfigCache = new Map()

function getFileConfig(filePath, flags) {
  const rawFileConfig = cwdEsLint.getConfigForFile(filePath)
  const stringifiedFileConfig = JSON.stringify(rawFileConfig)

  const fileConfigCached = eslintConfigCache.get(stringifiedFileConfig)
  if (fileConfigCached) {
    // console.log("Use config cache!")
    return fileConfigCached
  }

  const localEslint = new CLIEngine({
    useEslintrc: false,
    plugins: rawFileConfig.plugins
  })
  const rules = localEslint.getRules()
  const fileRules = rawFileConfig.rules

  Object.entries(fileRules).forEach(([ name, rule ]) => {
    const ruleImpl = rules.get(name)
    if (ruleImpl) {
      if (fileRules[name] === "off" || fileRules[name][0] === "off") {
        delete fileRules[name]
        return
      }

      // console.log(ruleImpl.meta)
      if (ruleImpl.meta && ruleImpl.meta.fixable) {
        if (flags.verbose) {
          // console.log("- Auto fixing: " + name)
        }
      } else {
        // Disable all non-fixable rules
        // fileRules[name] = "off"
        delete fileRules[name]
      }
    } else {
      warnRuleNotFound(name)
    }
  })

  const fileConfigToCache = {
    ...rawFileConfig,
    rules: fileRules
  }

  eslintConfigCache.set(stringifiedFileConfig, fileConfigToCache)
  return fileConfigToCache
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

  const fileNames = await globby(cli.input, { gitignore: true })
  const fileTasks = fileNames.map((fileName) => async () => {
    console.log(`Processing: ${fileName}...`)

    const filePath = path.resolve(fileName)

    const fileConfig = getFileConfig(filePath, cli.flags)

    const fileInput = await fs.readFile(filePath, FILE_OPTIONS)

    const fixingEslint = new CLIEngine({
      ...fileConfig,
      useEslintrc: false,
      fix: true,
      globals: []
    })

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
  })

  const queue = new PQueue({ concurrency: cli.flags.concurrency })
  if (cli.flags.verbose) {
    queue.on("active", () => {
      console.log(`Queue Size: ${queue.size}`)
    })
  }

  await queue.addAll(fileTasks)
}

main()
