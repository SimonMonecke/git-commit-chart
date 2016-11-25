const blessed = require('blessed');

var repoName;
var granularity;
var fromDate;
var toDate;
const blessedComponent = blessed.box({
  width: '100%',
  top: 0,
  tags: true,
  fg: 'white',
  content: ''
});

function updateContent() {
  blessedComponent.setContent(`  Git Commit Chart - ${repoName}{|}Granularity: ${granularity}  |  From: ${fromDate}  |  To: ${toDate}  `);
}

module.exports = {
  setRepoName: _repoName => {
    repoName = _repoName;
    updateContent();
  },
  setGranularity: _granularity => {
    granularity = _granularity;
    updateContent();
  },
  setFromDate: _fromDate => {
    fromDate = _fromDate;
    updateContent();
  },
  setToDate: _toDate => {
    toDate = _toDate;
    updateContent();
  },
  getBlessedComponent: () => blessedComponent
};
