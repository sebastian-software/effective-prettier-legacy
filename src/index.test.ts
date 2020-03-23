import { promises as fs } from "fs"

import { formatText } from "."

async function testFormat(filePath) {
  const nonEslintBlockedFilePath = filePath.replace("fixtures", "fix-tures")
  const input = await fs.readFile(filePath, { encoding: "utf-8" })
  const output = await formatText(input, { filePath: nonEslintBlockedFilePath, verbose: true })
  return output
}

describe("Auto formatting", () => {
  test("Autofix 1", async () => {
    expect(await testFormat("./src/fixtures/autofix1.js")).toMatchSnapshot()
  })

  test("Autofix 2", async () => {
    expect(await testFormat("./src/fixtures/autofix2.js")).toMatchSnapshot()
  })
})
