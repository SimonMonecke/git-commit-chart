const blessed = require('blessed');

var repoName;
var granularity;
var fitToScreen = true;
var since;
var until;
const blessedComponent = blessed.box({
  width: '100%',
  top: 0,
  tags: true,
  fg: 'white',
  content: ''
});

function updateContent() {
  blessedComponent.setContent(`  Git Commit Chart - ${repoName}{|}${since} - ${until}  `);
}

module.exports = {
  setRepoName: _repoName => {
    repoName = _repoName;
    updateContent();
  },
  setSince: _since => {
    since = _since;
    updateContent();
  },
  setUntil: _until => {
    until = _until;
    updateContent();
  },
  getBlessedComponent: () => blessedComponent
};
