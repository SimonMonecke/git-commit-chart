const blessed = require('blessed');

const blessedComponent = blessed.box({
  top: 'center',
  left: 'center',
  width: 'shrink',
  height: 'shrink',
  content: '{center}Git-Commit-Chart | Loading...{/center}',
  tags: true,
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
});

module.exports = {
  getBlessedComponent: () => blessedComponent
};
