const path = require('path');
const args = require('./lib/cli')();
const simpleGit = require('simple-git')
const moment = require('moment');

const screen = require('blessed').screen();
const splashscreen = require('./lib/gui/splashscreen');
const header = require('./lib/gui/header');
const footer = require('./lib/gui/footer');
const chart = require('./lib/gui/chart');
let repo;
let gitLog = [];
let since;
let until;

try {
  repo = simpleGit(args.directory);
} catch(err) {
  console.log("Cannot use git-commit-chart on a directory that does not exist");
  process.exit(0);
}

screen.append(splashscreen.getBlessedComponent());
screen.render();
screen.detach(splashscreen.getBlessedComponent());
screen.append(header.getBlessedComponent());
screen.append(chart.getBlessedComponent());
screen.append(footer.getBlessedComponent());

var gitLogOptions = {};
if (!!args.since) {
  since = args.since;
  gitLogOptions['--since'] = since.format('YYYY-MM-DD');
}
if (!!args.until) {
  until = args.until.hour(23).minute(59);
  gitLogOptions['--until'] = until.format('YYYY-MM-DD HH:mm');
}

repo.revparse(['--show-toplevel'], function (err, data) {
  header.setRepoName(path.basename(data).trim());
});

function updateChart() {
  chart.getBlessedComponent().setData({
    gitLog: gitLog.reverse(),
    since: since,
    until: until,
  });
  screen.render();
}

repo.log(gitLogOptions, function (err, data) {
  for (let i = 0; i < data.all.length; i++) {
    let currentDate = moment(new Date(data.all[i].date));
    gitLog.push(currentDate);
  }
  if(gitLog.length === 0) {
    screen.destroy();
    console.log("Cannot find any commits");
    process.exit(0);
  }
  if (!since || gitLog[gitLog.length - 1].isAfter(since)) {
    since = gitLog[gitLog.length - 1];
  }
  if (!until || gitLog[0].isBefore(until)) {
    until = gitLog[0];
  }
  header.setSince(since.format('YYYY-MM-DD'));
  header.setUntil(until.format('YYYY-MM-DD'));
  updateChart();
});

screen.key('q', function () {
  process.exit(0);
});