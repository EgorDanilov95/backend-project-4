#!/usr/bin/env node
import { Command } from 'commander'
import pageLoader from '../src/page-loader.js'

const program = new Command()

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .argument('<url>', 'URL to download')
  .option('-o, --output <dir>', 'output directory', process.cwd())
  .action((url, options) => {
    pageLoader(url, options.output)
      .then(filepath => console.log(filepath))
      .catch((error) => {
        console.error('Error:', error.message)
        process.exit(1)
      })
  })

program.parse()
