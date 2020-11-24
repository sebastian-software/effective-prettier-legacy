# Effective Prettier (Effective Project)<br/>[![Sponsored by][sponsor-img]][sponsor] [![Version][npm-version-img]][npm] [![Downloads][npm-downloads-img]][npm] [![Build Status Unix][travis-img]][travis] [![Build Status Windows][appveyor-img]][appveyor]

[sponsor]: https://www.sebastian-software.de
[npm]: https://www.npmjs.com/package/@effective/prettier
[travis]: https://travis-ci.org/sebastian-software/effective-prettier
[appveyor]: https://ci.appveyor.com/project/swernerx/effective-prettier/branch/master
[sponsor-img]: https://badgen.net/badge/Sponsored%20by/Sebastian%20Software/692446
[npm-downloads-img]: https://badgen.net/npm/dm/@effective/prettier
[npm-version-img]: https://badgen.net/npm/v/@effective/prettier
[travis-img]: https://badgen.net/travis/sebastian-software/effective-prettier?label=unix%20build
[appveyor-img]: https://badgen.net/appveyor/ci/swernerx/effective-prettier?label=windows%20build

Originally started as a very lean alternative to [prettier-eslint](https://github.com/prettier/prettier-eslint) which focuses on the basics of integrating Prettier and linting infrastructure into one tool. Includes a CLI tool called `effective-prettier`. Nowadays it supports both `eslint` and `stylelint` together with `prettier`. It executes these tool in memory using their APIs instead of touching files multiple times on the disc.

## Problem

For some users linting rules tweak the behavior of prettier results. Combining both tools is typically quite a
configuration hassle. The easier way to write a new tool which combines both... or even all three of the most
relevant front-end tools into one CLI. Welcome `effective-prettier`.

## Features

You are in one solution to combine linting with prettification:

- ✅ Prettier
- ✅ ESLint
- ✅ Stylelint

With a hell lot of nice gimmicks:

- In memory transformation + write on change only
- Respects ignore files
- File format auto-detection
- Multi-threading with glob-based file lists

## Usage

Files are only written and touched when changes were made to the content.

Ignore files by Prettier and ESLint/Stylelint are used in combination for all files.

Massively faster when using a glob pattern through its threading infrastructure.

### JavaScript

```shell
effective-prettier util.js
```

### CSS

```shell
effective-prettier styles.css
```

### Markdown

```shell
effective-prettier text.md
```

### Mixed

```shell
effective-prettier "**/*.{js,jsx,ts,tsx,json,md,yaml,yml}"
```

## CLI Options

```
--verbose, -v       Increase log level
--auto-root, -a     Detecting project root folder automatically
--skip-ignore, -s   Skip checking any ignore files
--enable-typed, -t  Enable ESLint rules which require types (slower)
--concurrency       Setting the number of instances to be executed in parallel
```

## License

[Apache License Version 2.0, January 2004](license)

## Copyright

<img src="https://cdn.rawgit.com/sebastian-software/sebastian-software-brand/0d4ec9d6/sebastiansoftware-en.svg" alt="Logo of Sebastian Software GmbH, Mainz, Germany" width="460" height="160"/>

Copyright 2020<br/>[Sebastian Software GmbH](http://www.sebastian-software.de)
