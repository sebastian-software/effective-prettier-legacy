import { promises as fs } from "fs"
import { PerformanceObserver, performance } from "perf_hooks"

import prettier from "prettier"

import { getEslintInstance } from "./eslint"

const FILE_OPTIONS = { encoding: "utf-8" }

const performanceLogger = new PerformanceObserver((list) => {
  const entry = list.getEntries()[0]
  console.log(`${entry.name}(): ${entry.duration.toFixed(0)}ms`)
})
performanceLogger.observe({ entryTypes: [ "function" ] })

interface FormatOptions {
  ignorePath?: string
  verbose?: boolean
}

export async function formatText(fileInput: string, filePath: string, options: FormatOptions) {
  const { ignorePath = ".prettierignore", verbose = false } = options
  const fixingEslint = getEslintInstance(filePath, options)

  const prettierInfo = await prettier.getFileInfo(filePath, {
    ignorePath
  })

  const formattedByPrettier = prettierInfo.ignored ?
    fileInput :
    prettier.format(fileInput, {
      ...await prettier.resolveConfig(filePath),
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

    if (fileResult.output) {
      console.log("Return prettier+eslint result")
      return fileResult.output
    }
  } else if (verbose) {
    console.log("File is ignored by eslint!")
  }

  if (verbose) {
    console.log("Return prettier result")
  }

  return formattedByPrettier
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
