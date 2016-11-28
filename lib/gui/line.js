const blessed = require('blessed');
const Node = blessed.Node;
const Canvas = require('./canvas');

function getColorCode(color) {
  if (Array.isArray(color) && color.length == 3) {
    return x256(color[0],color[1],color[2]);
  } else {
    return color;
  }
}

function formatYLabel(value) {
  return value.toFixed(0);
}

function getMaxXLabelPadding(longestLabel) {
  return formatYLabel(longestLabel).length * 2;
}

function Line(options) {
  var self = this
  if (!(this instanceof Node)) {
    return new Line(options);
  }
  Canvas.call(this, options);
}

Line.prototype.calcSize = function() {
    this.canvasSize = {width: this.width*2-12, height: this.height*4-8}
}

Line.prototype.__proto__ = Canvas.prototype;

Line.prototype.type = 'line';

Line.prototype.setData = function(data) {
    if (!this.ctx) {
      throw "error: canvas context does not exist. setData() for line charts must be called after the chart has been added to the screen via screen.append()"
    }

    const TWO_LINES_HEIGHT = 8;
    const LABEL_LEFT_PADDING = 2;
    const LABEL_RIGHT_PADDING = 1;
    const LABEL_LINE_WIDTH = 2;
    const LABEL_LINE_RIGHT_PADDING = 2;

    const self = this;
    const xLabelPadding = 5;
    const yLabelPadding = 3
    const maxX = Math.max(...data.x);
    const maxY = Math.max(...data.y) * 1.2;
    const maxLabelPadding = getMaxXLabelPadding(maxY);
    const xPadding = maxLabelPadding + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING + LABEL_LINE_WIDTH + LABEL_LINE_RIGHT_PADDING;
    const yPadding = 11;
    const c = this.ctx;

    function getXPixel(val) {
        return ((self.canvasSize.width - xPadding) / data.x.length) * val + xPadding + 1;
    }

    function getYPixel(val) {
        return self.canvasSize.height - yPadding - (((self.canvasSize.height - yPadding) / maxY) * val);
    }

    function getYValue(pixel) {
        return (self.canvasSize.height - yPadding - pixel) / ((self.canvasSize.height - yPadding) / maxY);
    }

    // Draw the line graph
    function drawLine(values) {
      c.strokeStyle = 'yellow';

      c.moveTo(0, 0)
      c.beginPath();
      c.lineTo(getXPixel(0), getYPixel(values[0]));

      for(var k = 1; k < values.length; k++) {
          c.lineTo(getXPixel(k), getYPixel(values[k]));
      }
      c.stroke();
    }

    c.fillStyle = 'green';
    c.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);

    for(let i = 0; i <= this.canvasSize.height; i += TWO_LINES_HEIGHT) {
        const yPixel = self.canvasSize.height - yPadding - i;
        const formatedLabel = formatYLabel(getYValue(yPixel));
        c.fillText(formatedLabel, LABEL_LEFT_PADDING + maxLabelPadding - formatedLabel.length * 2, yPixel);
        c.strokeStyle = 'green';
        c.moveTo(maxLabelPadding + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING, yPixel);
        c.beginPath();
        c.lineTo(maxLabelPadding + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING, yPixel);
        c.lineTo(maxLabelPadding + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING + LABEL_LINE_WIDTH , yPixel);
        c.stroke();
    }

    drawLine(data.y)

    // Draw the X value texts
    const charsAvailable = (this.canvasSize.width - xPadding) / 2;
    const maxLabelsPossible = charsAvailable / (maxX + 2);
    const pointsPerMaxLabel = Math.ceil(data.x.length / maxLabelsPossible);
    const showNthLabel = 1;
    if (showNthLabel < pointsPerMaxLabel) {
      showNthLabel = pointsPerMaxLabel;
    }

    for(var i = 0; i < data.x.length; i += showNthLabel) {
      if((getXPixel(i) + (data.x[i].length * 2)) <= this.canvasSize.width) {
        c.fillText(data.x[i], getXPixel(i), this.canvasSize.height - yPadding + yLabelPadding);
      }
    }
}

module.exports = Line
