const blessed = require('blessed');

var showScrollKeys = false;

const blessedComponent = blessed.box({
  width: '100%',
  top: process.stdout.rows - 1,
  tags: true,
  fg: 'white',
  content: '  {white-bg}{black-fg}g{/black-fg}{/white-bg} Change Granularity  {white-bg}{black-fg}f{/black-fg}{/white-bg} Fit to screen  {white-bg}{black-fg}q{/black-fg}{/white-bg} Quit{|}https://github.com/simonmonecke/git-commit-chart  '
});

function updateContent() {
  if (showScrollKeys) {
    blessedComponent.setContent('  {white-bg}{black-fg}g{/black-fg}{/white-bg} Change Granularity  {white-bg}{black-fg}f{/black-fg}{/white-bg} Fit to screen  {white-bg}{black-fg}[left]{/black-fg}{/white-bg}/{white-bg}{black-fg}[right]{/black-fg}{/white-bg} Scroll  {white-bg}{black-fg}q{/black-fg}{/white-bg} Quit{|}https://github.com/simonmonecke/git-commit-chart  ');
  } else {
    blessedComponent.setContent('  {white-bg}{black-fg}g{/black-fg}{/white-bg} Change Granularity  {white-bg}{black-fg}f{/black-fg}{/white-bg} Fit to screen  {white-bg}{black-fg}q{/black-fg}{/white-bg} Quit{|}https://github.com/simonmonecke/git-commit-chart  ');
  }
}

module.exports = {
  showScrollKeys: _showScrollKeys => {
    showScrollKeys = _showScrollKeys;
    updateContent();
  },
  getBlessedComponent: () => blessedComponent
};
