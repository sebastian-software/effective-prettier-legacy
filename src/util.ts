import { dirname, sep } from "path"

import appRootPath from "app-root-path"

export const APP_ROOT_PATH = appRootPath.toString()

export const ESLINT_ROOT_PATH = ((): string | null => {
  const eslintPackageFile = require.resolve("eslint/package.json")
  return eslintPackageFile
    ? dirname(eslintPackageFile).split(sep + "node_modules")[0]
    : APP_ROOT_PATH
})()
