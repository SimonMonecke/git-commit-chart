const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');

const usage = [
  {
    header: 'Git Commit Chart',
    content: 'Visualize the amount of commits in the current repository.'
  },
  {
    header: 'Options',
    optionList: [
      {
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

const args = [
  { name: 'since', alias: 's', type: String },
  { name: 'until', alias: 'u', type: String}
];

function parseCliArguments() {
  try {
    return commandLineArgs(args);
  } catch(err) {
    console.log(getUsage(usage));
    process.exit(0);
  }
}

module.exports = parseCliArguments;
