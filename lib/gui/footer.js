const blessed = require('blessed');

function footer() {
  return  blessed.box({
    width: '100%',
    top: process.stdout.rows - 1,
    tags: true,
    fg: 'white',
    content: '  {white-bg}{black-fg}g{/black-fg}{/white-bg} Change Granularity  {white-bg}{black-fg}q{/black-fg}{/white-bg} Quit{|}https://github.com/simonmonecke/git-commit-chart  '
  });
}

module.exports = footer;
