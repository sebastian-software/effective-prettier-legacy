import { spawnSync } from "child_process"
import { dirname } from "path"

import appRootPath from "app-root-path"

export const ESLINT_ROOT_PATH = (() => {
  const eslintPackageFile = require.resolve("eslint/package.json")
  return eslintPackageFile ? dirname(eslintPackageFile).split("node_modules")[0] : null
})()

export const APP_ROOT_PATH = (() => {
  const gitResult = spawnSync("git", [ "rev-parse", "--show-toplevel" ], { encoding: "utf-8" })
  return gitResult && !gitResult.error ? gitResult.stdout.trim() : appRootPath.toString()
})()
