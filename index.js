const args = require('./lib/cli')();
const simpleGit = require('simple-git')('/home/simon/programming/javascript/others-repos/node')
// const simpleGit = require('simple-git')('/home/simon/programming/tmp/linux')
const moment = require('moment');

const screen = require('blessed').screen();
const splashscreen = require('./lib/gui/splashscreen')();
const header = require('./lib/gui/header');
const footer = require('./lib/gui/footer')();
const chart = require('./lib/gui/chart')();
var granularitiesOrder = ['days', 'weeks', 'months'];
var gitLog = [];

header.setRepoName('nodeJs');
header.setGranularity(granularitiesOrder[0]);
header.setFromDate('2014-11-01');
header.setToDate('2016-02-31');

screen.append(splashscreen);
screen.render();
screen.detach(splashscreen);
screen.append(header.getBlessedComponent());
screen.append(chart);
screen.append(footer);



function updateChart() {
  if (gitLog.length > 0) {
    let since = args.since;
    let until = args.until ? moment(args.until) : moment();
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
if (args.since) {
  gitLogOptions['--since'] = moment(args.since).format('YYYY-MM-DD');
}
if (args.until) {
  gitLogOptions['--until'] = moment(args.untils).format('YYYY-MM-DD');
}

simpleGit.log(gitLogOptions, function (err, data) {
  let since = args.since;
  let until = args.until ? moment(args.until) : moment();
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
  header.setGranularity(granularitiesOrder[0]);
  updateChart();
});

screen.key('q', function() {
  process.exit(0);
});
