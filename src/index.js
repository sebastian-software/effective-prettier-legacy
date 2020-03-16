function requireModule(modulePath, name) {
  try {
    console.log(`requiring "${name}" module at "${modulePath}"`)
    return require(modulePath)
  } catch (error) {
    console.error(
      oneLine`
      There was trouble getting "${name}".
      Is "${modulePath}" a correct path to the "${name}" module?
    `
    )
    throw error
  }
}

function getESLintCLIEngine(eslintPath, eslintOptions) {
  const { CLIEngine } = requireModule(eslintPath, "eslint")
  try {
    return new CLIEngine(eslintOptions)
  } catch (error) {
    console.error(`There was trouble creating the ESLint CLIEngine.`)
    throw error
  }
}

function getRelevantESLintConfig(eslintConfig, eslintPath) {
  const cliEngine = getESLintCLIEngine(eslintPath)
  const loadedRules = cliEngine.getRules && cliEngine.getRules()

  const { rules } = eslintConfig

  const relevantRules = Object.entries(rules).reduce((rulesAccumulator, [ name, rule ]) => {
    if (loadedRules.has(name)) {
      const {
        meta: { fixable }
      } = loadedRules.get(name)

      if (!fixable) {
        rule = [ "off" ]
      }
    }

    rulesAccumulator[name] = rule
    return rulesAccumulator
  }, {})

  return {
    useEslintrc: false,
    baseConfig: {
      settings: eslintConfig.settings || {}
    },
    ...eslintConfig,
    // overrides
    rules: relevantRules,
    fix: true,
    globals: []
  }
}
