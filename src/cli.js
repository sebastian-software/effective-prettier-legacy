import meow from "meow"
import { CLIEngine } from "eslint"
import prettier from "prettier"
import PQueue from "p-queue"

async function run() {
  const cli = meow(`
  Usage
    $ lean-prettier-eslint <input>

  Options
    --verbose, -v  Increase log level

  Examples
    $ lean-prettier-eslint filename.js --verbose
`,
    {
      flags: {
        verbose: {
          type: "boolean",
          alias: "v"
        },

        concurrency: {
          type: "number",
          default: 10
        }
      }
    }
  )

  if (cli.flags.verbose) {
    console.log("Files: ", cli.input)
    console.log("Flags: ", cli.flags)
  }

  const fileTasks = cli.input.map((fileName) => {
    return async () => {
      console.log("Processing: ", fileName)
    }
  })

  const queue = new PQueue({concurrency: cli.flags.concurrency});
  queue.on('active', () => {
    console.log(`Queue Size: ${queue.size} / Pending: ${queue.pending}`);
  });

  await queue.addAll(fileTasks)
}

run()
