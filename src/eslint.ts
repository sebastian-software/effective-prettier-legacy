import { CLIEngine } from "eslint"

import { debug } from "./log"
import { ESLINT_ROOT_PATH, APP_ROOT_PATH } from "./util"

// ESLint loads its plugins from the given or current CWD.
// Unfortunately in some situations the CWD e.g. when running inside
// Visual Studio Code is '/'. On this folder it does not find any plugins
// as all. This uses the location of Eslint which should be stable
// in one project to load all of its dependencies.
// Via: https://stackoverflow.com/a/49455609

const warnedOnRules = new Set()
function warnRuleNotFound(ruleId) {
  if (warnedOnRules.has(ruleId)) {
    return
  }

  debug(`Did not found rule ${ruleId}!`)
  warnedOnRules.add(ruleId)
}

const eslintInstanceCache = new Map()

const cwdEsLint = new CLIEngine({
  cwd: ESLINT_ROOT_PATH,
  useEslintrc: true
})

export function getEslintInstance(filePath, flags) {
  const rawFileConfig = cwdEsLint.getConfigForFile(filePath)
  const stringifiedFileConfig = JSON.stringify(rawFileConfig)

  const cachedEslintInstance = eslintInstanceCache.get(stringifiedFileConfig)
  if (cachedEslintInstance) {
    // console.log("Use config cache!")
    return cachedEslintInstance
  }

  // This can be used to enable debug mode in eslint
  // require("debug").enable("eslint:*,-eslint:code-path");

  const localEslint = new CLIEngine({
    cwd: ESLINT_ROOT_PATH,
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
          debug(`- Auto fixing: ${name}`)
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

  if (flags.verbose) {
    debug("Enabled rules:", fileRules)
  }

  const eslintInstance = new CLIEngine({
    ...rawFileConfig,
    cwd: APP_ROOT_PATH,
    rules: fileRules,
    useEslintrc: false,
    fix: true,
    globals: []
  })

  eslintInstanceCache.set(stringifiedFileConfig, eslintInstance)
  return eslintInstance
}
