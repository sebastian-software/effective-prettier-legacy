import { promises as fs } from "fs"

import { formatText } from "."

describe("Auto formatting", () => {
  test("Autofix 1", async () => {
    const filePath = "./src/fixtures/autofix1.js"
    const input = await fs.readFile(filePath, { encoding: "utf-8" })
    const output = await formatText(input, { filePath, verbose: true })
    expect(output).toMatchSnapshot()
  })
})
