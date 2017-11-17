const blessed = require('blessed');

const blessedComponent = blessed.box({
  width: '100%',
  top: process.stdout.rows - 1,
  tags: true,
  fg: 'white',
  content: '  {white-bg}{black-fg}q{/black-fg}{/white-bg} Quit{|}https://github.com/simonmonecke/git-commit-chart  '
});

function updateContent() {
  blessedComponent.setContent('  {white-bg}{black-fg}q{/black-fg}{/white-bg} Quit{|}https://github.com/simonmonecke/git-commit-chart  ');
}

module.exports = {
  getBlessedComponent: () => blessedComponent
};