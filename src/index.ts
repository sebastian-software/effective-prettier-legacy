/* eslint-disable max-statements */

import { promises as fs } from "fs"
import { performance } from "perf_hooks"
import { relative, resolve } from "path"

import chalk from "chalk"
import figures from "figures"
import prettier from "prettier"

import { getEslintInstance } from "./eslint"
import { APP_ROOT_PATH } from "./util"
import { FormatOptions } from "./types"
import { debug } from "./log"

const FILE_OPTIONS = { encoding: "utf-8" }
const PRETTIER_IGNORE_FILENAME = ".prettierignore"

async function executePrettier(
  fileInput: string,
  filePath: string,
  options: FormatOptions = {}
) {
  const prettierInfo = await prettier.getFileInfo(filePath, {
    // Use same standard ignore path as the CLI.
    // Plus add support for auto-root mode where we automatically instruct prettier loading
    // the ignore file from the project root folder instead.
    ignorePath: options.autoRoot ?
      resolve(APP_ROOT_PATH, PRETTIER_IGNORE_FILENAME) :
      PRETTIER_IGNORE_FILENAME
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
      debug(`Configuration uses deprecated rule: ${deprecationMessage.ruleId}!`)
    })
  }

  const fileResult = report.results[0]
  if (!fileResult) {
    return null
  }

  if (options.verbose) {
    if (fileResult.messages) {
      fileResult.messages.forEach((messageEntry) => {
        debug(
          `${filePath}: ${messageEntry.ruleId}: ${messageEntry.message} @${messageEntry.line}`
        )
      })
    }
  }

  return fileResult.output ? fileResult.output : false
}

enum TrackingStatus {
  executed,
  applied
}

interface ToolTracking {
  prettier?: TrackingStatus
  eslint?: TrackingStatus
  stylelint?: TrackingStatus
}

export async function formatText(fileInput: string, filePath: string, options: FormatOptions) {
  const toolTracking: ToolTracking = {}
  const startTime = performance.now()

  let fileOutput = fileInput

  const prettierResult = await executePrettier(fileOutput, filePath, options)
  if (prettierResult != null) {
    toolTracking.prettier = TrackingStatus.executed
    if (prettierResult) {
      toolTracking.prettier = TrackingStatus.applied
      fileOutput = prettierResult
    }
  }

  const eslintResult = await executeEslint(fileOutput, filePath, options)
  if (eslintResult != null) {
    toolTracking.eslint = TrackingStatus.executed
    if (eslintResult) {
      toolTracking.eslint = TrackingStatus.applied
      fileOutput = eslintResult
    }
  }

  // Reduce tools if in the end the same result was produced.
  if (fileOutput === fileInput) {
    if (toolTracking.prettier === TrackingStatus.applied) {
      toolTracking.prettier = TrackingStatus.executed
    }
    if (toolTracking.eslint === TrackingStatus.applied) {
      toolTracking.eslint = TrackingStatus.executed
    }
    if (toolTracking.stylelint === TrackingStatus.applied) {
      toolTracking.stylelint = TrackingStatus.executed
    }
  }

  const fileRelativePath = relative(process.cwd(), filePath)
  const stopTime = performance.now()
  const duration = `${Math.round(stopTime - startTime)}ms`

  if (
    toolTracking.prettier != null ||
    toolTracking.eslint != null ||
    toolTracking.stylelint != null
  ) {
    if (
      toolTracking.prettier !== TrackingStatus.applied &&
      toolTracking.eslint !== TrackingStatus.applied &&
      toolTracking.stylelint !== TrackingStatus.applied
    ) {
      debug(chalk.dim(`- ${fileRelativePath}: ${chalk.yellow(figures.cross)} ${duration}`))
    } else {
      debug(`- ${fileRelativePath}: ${chalk.green(figures.tick)} ${duration}`)
    }
  } else {
    debug(chalk.dim(`- ${fileRelativePath}: ${chalk.red(figures.bullet)} ${duration}`))
  }

  return fileOutput
}

export const formatTextMeasured = performance.timerify(formatText)

export async function formatFile(filePath: string, options) {
  const fileInput = (await fs.readFile(filePath, FILE_OPTIONS)) as string
  const fileOutput = await formatText(fileInput, filePath, options)

  if (fileInput !== fileOutput) {
    if (options.verbose) {
      debug(`Writing changes to: ${filePath}...`)
    }

    await fs.writeFile(filePath, fileOutput, FILE_OPTIONS)
  }
}

export const version = process.env.BUNDLE_VERSION
