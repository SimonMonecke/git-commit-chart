const blessed = require('blessed');
const contrib = require('blessed-contrib');

function chart() {
  return contrib.line({
  style: {
    line: "yellow"
    , text: "green"
    , baseline: "black"
  }
  , top: 2
  , xLabelPadding: 0
  , xPadding: 0
  , showLegend: false
  , wholeNumbersOnly: true
});
}

module.exports = chart;
