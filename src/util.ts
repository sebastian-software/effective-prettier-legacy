import appRootPath from "app-root-path"
import { spawnSync } from "child_process"
import { dirname } from "path"

export const ESLINT_ROOT_PATH = (function() {
  const eslintPkgFile = require.resolve("eslint/package.json")
  return eslintPkgFile ? dirname(eslintPkgFile) : null
})()

export const APP_ROOT_PATH = (function() {
  const gitResult = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf-8" })
  return gitResult && !gitResult.error ? gitResult.stdout : appRootPath.toString()
})()
