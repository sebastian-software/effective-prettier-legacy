import { promises as fs } from "fs"

import prettier from "."

async function testFormat(filePath) {
  const input = await fs.readFile(filePath, { encoding: "utf-8" })
  const output = await prettier.formatText(input, filePath, {
    verbose: true,
    skipIgnore: true
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

  test("JSON 1", async () => {
    expect(await testFormat("./src/fixtures/json-1.json")).toMatchSnapshot()
  })

  test("Markdown 1", async () => {
    expect(await testFormat("./src/fixtures/markdown-1.md")).toMatchSnapshot()
  })
})
