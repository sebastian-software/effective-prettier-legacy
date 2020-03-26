import { promises as fs } from "fs"
import { PerformanceObserver, performance } from "perf_hooks"
import { resolve } from "path"

import prettier from "prettier"

import { getEslintInstance } from "./eslint"
import { APP_ROOT_PATH } from "./util"

const FILE_OPTIONS = { encoding: "utf-8" }
const PRETTIER_IGNORE_FILENAME = ".prettierignore"

const performanceLogger = new PerformanceObserver((list) => {
  const entry = list.getEntries()[0]
  console.log(`${entry.name}(): ${entry.duration.toFixed(0)}ms`)
})
performanceLogger.observe({ entryTypes: [ "function" ] })

interface FormatOptions {
  autoRoot?: boolean
  verbose?: boolean
}

async function executePrettier(fileInput: string, filePath: string, options: FormatOptions) {
  const prettierInfo = await prettier.getFileInfo(filePath, {
    // Use same standard ignore path as the CLI.
    // Plus add support for auto-root mode where we automatically instruct prettier loading
    // the ignore file from the project root folder instead.
    ignorePath: options.autoRoot ? resolve(APP_ROOT_PATH, PRETTIER_IGNORE_FILENAME) : PRETTIER_IGNORE_FILENAME
  })

  if (prettierInfo.ignored) {
    return null
  }

  const fileOutput = prettier.format(fileInput, {
    ...await prettier.resolveConfig(filePath),
    filepath: filePath
  })

  if (fileOutput === fileInput) {
    return false
  }

  return fileOutput
}

async function executeEslint(fileInput, filePath, options: FormatOptions) {
  const fixingEslint = getEslintInstance(filePath, options)
  const report = fixingEslint.executeOnText(fileInput, filePath)

  if (report.usedDeprecatedRules) {
    report.usedDeprecatedRules.forEach((deprecationMessage) => {
      console.warn(`Configuration uses deprecated rule: ${deprecationMessage.ruleId}!`)
    })
  }

  const fileResult = report.results[0]
  if (!fileResult) {
    return null
  }

  if (fileResult.messages) {
    fileResult.messages.forEach((messageEntry) => {
      console.log(messageEntry)
    })
  }

  return fileResult.output ? fileResult.output : false
}

export async function formatText(fileInput: string, filePath: string, options: FormatOptions) {
  const executedTools: string[] = []
  const changingTools: string[] = []

  let fileOutput = fileInput

  const prettierResult = await executePrettier(fileOutput, filePath, options)
  if (prettierResult != null) {
    executedTools.push("prettier")
    if (prettierResult) {
      changingTools.push("prettier")
      fileOutput = prettierResult
    }
  }

  const eslintResult = await executeEslint(fileOutput, filePath, options)
  if (eslintResult != null) {
    executedTools.push("eslint")
    if (eslintResult) {
      changingTools.push("eslint")
      fileOutput = eslintResult
    }
  }

  if (options.verbose) {
    if (executedTools.length === 0) {
      console.log(`${filePath} was ignored!`)
    } else if (changingTools.length === 0) {
      console.log(`${filePath} was not modified!`)
    }

    console.log(`${filePath}: Executed: ${executedTools.join(", ")}`)
    console.log(`${filePath}: Applied: ${changingTools.join(", ")}`)
    console.log("")
  }

  return fileOutput
}

export const formatTextMeasured = performance.timerify(formatText)

export async function formatFile(filePath: string, options) {
  const fileInput = (await fs.readFile(filePath, FILE_OPTIONS)) as string
  const fileOutput = await formatText(fileInput, filePath, options)

  if (fileInput !== fileOutput) {
    if (options.verbose) {
      console.log(`Writing changes to: ${filePath}...`)
    }

    await fs.writeFile(filePath, fileOutput, FILE_OPTIONS)
  }
}
