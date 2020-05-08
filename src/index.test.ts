import { promises as fs } from "fs"

import prettier from "."

async function testFormat(filePath) {
  const nonEslintBlockedFilePath = filePath.replace("fixtures", "fix-tures")
  const input = await fs.readFile(filePath, { encoding: "utf-8" })
  const output = await prettier.formatText(input, nonEslintBlockedFilePath, {
    verbose: true
  })
  return output
}

describe("Auto formatting", () => {
  test("JavaScript 1", async () => {
    expect(await testFormat("./src/fixtures/javascript-1.js")).toMatchSnapshot()
  })

  test("JavaScript 2", async () => {
    expect(await testFormat("./src/fixtures/javascript-2.js")).toMatchSnapshot()
  })

  test("TypeScript 1", async () => {
    expect(await testFormat("./src/fixtures/typescript-1.ts")).toMatchSnapshot()
  })

  test("Markdown 1", async () => {
    expect(await testFormat("./src/fixtures/markdown-1.md")).toMatchSnapshot()
  })
})
