const path = require('path');
const args = require('./lib/cli')();
const simpleGit = require('simple-git')(process.argv[2])
const moment = require('moment');

const screen = require('blessed').screen();
const splashscreen = require('./lib/gui/splashscreen');
const header = require('./lib/gui/header');
const footer = require('./lib/gui/footer');
const chart = require('./lib/gui/chart');
var granularitiesOrder = ['days', 'weeks', 'months'];
var gitLog = [];
var fitToScreen = true;
var buckets = [];

header.setGranularity(granularitiesOrder[0]);
header.setFromDate('2014-11-01');
header.setToDate('2016-02-31');

screen.append(splashscreen.getBlessedComponent());
screen.render();
screen.detach(splashscreen.getBlessedComponent());
screen.append(header.getBlessedComponent());
screen.append(chart.getBlessedComponent());
screen.append(footer.getBlessedComponent());

function recalculateBucketsAndUpdateChart() {
  if (gitLog.length > 0) {
    let since = args.since;
    let until = args.until ? moment(args.until) : moment();
    buckets = {
      x: [],
      y: []
    };
    for (let i = 0; i < gitLog.length; i++) {
      let currentDiff = until.diff(gitLog[i], granularitiesOrder[0]);
      if (!!buckets.y[currentDiff]) {
        buckets.y[currentDiff]++;
      } else {
        buckets.y[currentDiff] = 1;
      }
    }
    for (let i = 0; i < buckets.y.length; i++) {
      if (!buckets.y[i]) {
        buckets.y[i] = 0;
      }
      buckets.x.push(moment(until).subtract(i, granularitiesOrder[0]));
    }
    buckets.x = buckets.x.reverse();
    buckets.y = buckets.y.reverse();
    updateChart();
  }
}

function updateChart() {
  chart.getBlessedComponent().setData({
    fitToScreen: fitToScreen,
    x: buckets.x,
    y: buckets.y
  });
  screen.render();
}

var gitLogOptions = {};
if (args.since) {
  gitLogOptions['--since'] = moment(args.since).format('YYYY-MM-DD');
}
if (args.until) {
  gitLogOptions['--until'] = moment(args.untils).format('YYYY-MM-DD');
}

simpleGit.revparse(['--show-toplevel'], function(err, data) {
  header.setRepoName(path.basename(data).trim());
});

simpleGit.log(gitLogOptions, function (err, data) {
  let since = args.since;
  let until = args.until ? moment(args.until) : moment();
  for (let i = 0; i < data.all.length; i++) {
    let currentDate = moment(new Date(data.all[i].date));
    if ((!since || currentDate.isAfter(since)) && currentDate.isBefore(until)) {
      gitLog.push(currentDate);
    }
  }
  recalculateBucketsAndUpdateChart();
});

screen.key('g', function() {
  granularitiesOrder.push(granularitiesOrder.shift());
  header.setGranularity(granularitiesOrder[0]);
  recalculateBucketsAndUpdateChart();
  const contentFits = chart.getBlessedComponent().contentFits();
  footer.showScrollKeys(!contentFits);
  screen.render();
});

screen.key('f', function() {
  fitToScreen = !fitToScreen;
  header.toggleFitToScreen();
  recalculateBucketsAndUpdateChart();
  const contentFits = chart.getBlessedComponent().contentFits();
  footer.showScrollKeys(!contentFits);
  screen.render();
});

screen.key('left', function() {
  chart.getBlessedComponent().scrollLeft();
  screen.render();
});

screen.key('right', function() {
  chart.getBlessedComponent().scrollRight();
  screen.render();
});

screen.key('q', function() {
  process.exit(0);
});
