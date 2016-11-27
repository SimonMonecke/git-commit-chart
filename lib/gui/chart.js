const blessed = require('blessed');
const line = require('./line');

const blessedComponent = line({
  style: {
    line: "yellow"
    , text: "green"
    , baseline: "white"
  }
  , top: 2
  , xLabelPadding: 0
  , xPadding: 0
  , showLegend: false
  , wholeNumbersOnly: true
});

module.exports = {
  getBlessedComponent: () => blessedComponent
};
