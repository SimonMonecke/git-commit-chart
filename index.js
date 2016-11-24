const simpleGit = require('simple-git')('/home/simon/programming/javascript/others-repos/node')
// const simpleGit = require('simple-git')('/home/simon/programming/tmp/linux')
const moment = require('moment');
const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');

const screen = require('blessed').screen();
const splashscreen = require('./lib/splashscreen')();
const header = require('./lib/header')('someNiceRepo', 'Months', '01-07-2013', '31-02-2016');
const footer = require('./lib/footer')();
const chart = require('./lib/chart')();

const sections = [
  {
    header: 'Git Commit Chart',
    content: 'Visualize the amount of commits in the current repository.'
  },
  {
    header: 'Options',
    optionList: [
      {
        name: 'from',
        typeLabel: '[underline]{date}',
        description: 'Limit the commits to those made since the specified date. Format: YYYY-MM-DD'
      },
      {
        name: 'to',
        typeLabel: '[underline]{date}',
        description: 'Limit the commits to those made until the specified date. Format: YYYY-MM-DD'
      }
    ]
  }
]
const usage = getUsage(sections);

const optionDefinitions = [
  { name: 'from', alias: 'f', type: String },
  { name: 'to', alias: 't', type: String}
];
var options;

try {
  options = commandLineArgs(optionDefinitions);
} catch(err) {
  console.log(usage);
  process.exit(0);
}

screen.append(splashscreen);
screen.render();
screen.detach(splashscreen);
screen.append(header);
screen.append(chart);
screen.append(footer);

var granularitiesOrder = ['days', 'weeks', 'months'];
var gitLog = [];

function updateChart() {
  if (gitLog.length > 0) {
    let until = options.until ? moment(options.until) : moment();
    let since = options.since;
    let buckets = [];
    for (let i = 0; i < gitLog.length; i++) {
      let currentDiff = until.diff(gitLog[i], granularitiesOrder[0]);
      if (!!buckets[currentDiff]) {
        buckets[currentDiff]++;
      } else {
        buckets[currentDiff] = 1;
      }
    }
    for (let i = 0; i < buckets.length; i++) {
      if (!buckets[i]) {
        buckets[i] = 0;
      }
    }
    chart.setData({
      title: '',
      x: new Array(buckets.length).fill('.'),
      y: buckets.reverse()
    });
    screen.render();
  }
}

var gitLogOptions = {};
if (options.since) {
  gitLogOptions['--since'] = moment(options.since).format('YYYY-MM-DD');
}
if (options.until) {
  gitLogOptions['--until'] = moment(options.untils).format('YYYY-MM-DD');
}

simpleGit.log(gitLogOptions, function (err, data) {
  let until = options.until ? moment(options.until) : moment();
  let since = options.since;
  for (let i = 0; i < data.all.length; i++) {
    let currentDate = moment(new Date(data.all[i].date));
    if ((!since || currentDate.isAfter(since)) && currentDate.isBefore(until)) {
      gitLog.push(currentDate);
    }
  }
  updateChart();
});

screen.key('g', function() {
  granularitiesOrder.push(granularitiesOrder.shift());
  updateChart();
});

screen.key('q', function() {
  process.exit(0);
});
