const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const moment = require('moment');

const usage = [{
    header: 'Git Commit Chart',
    content: 'Visualize the amount of commits'
  },
  {
    header: 'SYNOPSIS',
    content: [
      '$ git-commit-chart [[bold]{OPTIONS}] [underline]{directory}',
    ]
  },
  {
    header: 'OPTIONS',
    optionList: [{
        name: 'since',
        alias: 's',
        typeLabel: '[underline]{date}',
        description: 'Limit the commits to those made since the specified date. Format: YYYY-MM-DD'
      },
      {
        name: 'until',
        alias: 'u',
        typeLabel: '[underline]{date}',
        description: 'Limit the commits to those made until the specified date. Format: YYYY-MM-DD'
      }
    ]
  }
]

const args = [{
    name: 'since',
    alias: 's',
    type: String
  },
  {
    name: 'until',
    alias: 'u',
    type: String
  },
  {
    name: 'directory',
    alias: 'd',
    type: String,
    defaultOption: true
  }
];

const dateRegExp = /\d{4}-\d{2}-\d{2}/

function exitAndPrintUsage() {
  console.log(getUsage(usage));
  process.exit(0);
}

function parseCliArguments() {
  try {
    const parsedArgs = commandLineArgs(args);
    const parsedAndConvertedArgs = {};
    if (!!parsedArgs.since) {
      const since = moment(parsedArgs.since, 'YYYY-MM-DD');
      if (!since.isValid()) {
        exitAndPrintUsage();
      }
      parsedAndConvertedArgs.since = since;
    }
    if (!!parsedArgs.until) {
      const until = moment(parsedArgs.until, 'YYYY-MM-DD');
      if (!until.isValid()) {
        exitAndPrintUsage();
      }
      parsedAndConvertedArgs.until = until;
    }
    if (!!parsedArgs.until && !!parsedArgs.since) {
      if (parsedAndConvertedArgs.since.isSameOrAfter(parsedAndConvertedArgs.until)) {
        exitAndPrintUsage();
      }
    }
    if(!parsedArgs.directory) {
      exitAndPrintUsage();
    }
    parsedAndConvertedArgs.directory = parsedArgs.directory;
    // throw new Error(JSON.stringify(parsedArgs));
    return parsedAndConvertedArgs;
  } catch (err) {
    throw err;
    exitAndPrintUsage();
  }
}

module.exports = parseCliArguments;