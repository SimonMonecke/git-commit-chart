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

    const self = this;
    const xLabelPadding = 5;
    const yLabelPadding = 3
    const xPadding = 10;
    const yPadding = 11;
    const c = this.ctx;
    const maxX = Math.max(...data.x);
    const maxY = Math.max(...data.y) * 1.2;
    const maxLabelPadding = getMaxXLabelPadding(maxY);

    function getXPixel(val) {
        return ((self.canvasSize.width - xPadding) / data.x.length) * val + (xPadding * 1.0) + 2;
    }

    function getYPixel(val) {
        return self.canvasSize.height - yPadding - (((self.canvasSize.height - yPadding) / maxY) * val) - 2;
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

    const yLabelIncrement = Math.max(Math.floor(maxY/5), 1);

    for(var i = 0; i < maxY; i += yLabelIncrement) {
        c.fillText(formatYLabel(i), xPadding - xLabelPadding, getYPixel(i));
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
