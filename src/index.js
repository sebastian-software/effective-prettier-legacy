import { promises as fs } from "fs"

import prettier from "prettier"

import { getEslintInstance } from "./eslint"

const FILE_OPTIONS = { encoding: "utf-8" }

export async function formatFile(filePath, options) {
  const fileInput = await fs.readFile(filePath, FILE_OPTIONS)
  const fileOutput = await formatText(fileInput, { filePath })

  if (fileInput !== fileOutput) {
    if (options.verbose) {
      console.log(`Writing changes to: ${filePath}...`)
    }

    await fs.writeFile(filePath, fileOutput, FILE_OPTIONS)
  }
}

export async function formatText(fileInput, options) {
  const { filePath } = options
  const fixingEslint = getEslintInstance(filePath, options)

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

    return fileResult.output || fileInput
  }

  return fileInput
}

// Compatible to prettier-eslint: https://github.com/prettier/prettier-eslint
export default function index(options) {
  const { text, ...cleanOptions } = options
  return formatText(text, cleanOptions)
}
