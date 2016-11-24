const blessed = require('blessed');

function header(repoName, granularity, fromDate, toDate) {
  return blessed.box({
    width: '100%',
    top: 0,
    tags: true,
    fg: 'white',
    content: `  Git Commit Chart - ${repoName}{|}Granularity: ${granularity}  |  From: ${fromDate}  |  To: ${toDate}  `
  });
}

module.exports = header;
