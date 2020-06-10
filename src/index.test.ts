import { promises as fs } from "fs"

import prettier from "."

jest.setTimeout(30000)

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

  test("CSS in JS - JSS", async () => {
    expect(await testFormat("./src/fixtures/cssinjs-jss.jsx")).toMatchSnapshot()
  })

  test("CSS in JS - Styled Components", async () => {
    expect(await testFormat("./src/fixtures/cssinjs-styled.jsx")).toMatchSnapshot()
  })

  test("HTML with CSS 1", async () => {
    expect(await testFormat("./src/fixtures/htmlcss-1.html")).toMatchSnapshot()
  })
})
