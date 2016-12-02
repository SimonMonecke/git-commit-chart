const blessed = require('blessed');
const Node = blessed.Node;
const Box = blessed.Box;
const InnerCanvas = require('drawille-canvas-blessed-contrib').Canvas;

const CHAR_WIDTH = 2;
const LINE_HEIGHT = 4;
const LINE_COLOR = 'yellow';
const LABEL_LEFT_PADDING = 2;
const LABEL_RIGHT_PADDING = 1;
const LABEL_LINE_WIDTH = 2;
const LABEL_LINE_RIGHT_PADDING = 2;
const CHART_TOP_PADDING = 11;
const SCROLL_SPEED = 5;

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

function getMaxYLabelWidth(longestLabel) {
  return formatYLabel(longestLabel).length * 2;
}

class Line extends Box{
  constructor(options) {
    options = options || {};
    super(options);
    this.options = options;

    this.on("attach", function() {
      this._calcSize();

      this._canvas = new InnerCanvas(this.canvasSize.width, this.canvasSize.height);
      this.ctx = this._canvas.getContext();
    })
  }

  _calcSize() {
    this.canvasSize = {width: this.width * CHAR_WIDTH - 12, height: this.height * LINE_HEIGHT - 8};
  }

  _getXPixel(val, countOfValues, chartLeftPadding) {
      return ((this.canvasSize.width - chartLeftPadding) / countOfValues) * val + chartLeftPadding + LABEL_LINE_RIGHT_PADDING;
  }

  _getYPixel(val, maxY) {
      return this.canvasSize.height - CHART_TOP_PADDING - (((this.canvasSize.height - CHART_TOP_PADDING) / maxY) * val);
  }

  _getYValue(pixel, maxY) {
      return (this.canvasSize.height - CHART_TOP_PADDING - pixel) / ((this.canvasSize.height - CHART_TOP_PADDING) / maxY);
  }

  _drawLine() {
    this.ctx.strokeStyle = LINE_COLOR;

    this.ctx.moveTo(0, 0)
    this.ctx.beginPath();

    if (!this.data.fitToScreen && (this.data.y.length - this.canvasSize.width + this.chartLeftPadding) > 0) {
      for(var k = this.data.y.length - this.canvasSize.width + this.chartLeftPadding + this.scrollValue; k < this.data.y.length + this.scrollValue; k++) {
          this.ctx.lineTo(k - this.data.y.length + this.canvasSize.width - this.scrollValue, this._getYPixel(this.data.y[k], this.maxY));
      }
      this.ctx.fillText(`${this.data.y.length - this.canvasSize.width + this.chartLeftPadding + this.scrollValue}-${this.data.y.length + this.scrollValue}/${this.data.y.length}`, this.chartLeftPadding + LABEL_LINE_RIGHT_PADDING, this.canvasSize.height - CHART_TOP_PADDING + 5);
    } else {
      for(var k = 0; k < this.data.y.length; k++) {
          this.ctx.lineTo(this._getXPixel(k, this.data.y.length, this.chartLeftPadding), this._getYPixel(this.data.y[k], this.maxY));
      }
    }
    this.ctx.stroke();
  }

  _drawYLabels () {
    for(let i = 0; i <= this.canvasSize.height; i += LINE_HEIGHT * 2) {
        const yPixel = this.canvasSize.height - CHART_TOP_PADDING - i;
        const formatedLabel = formatYLabel(this._getYValue(yPixel, this.maxY));
        this.ctx.fillText(formatedLabel, LABEL_LEFT_PADDING + this.maxYLabelWidth - formatedLabel.length * 2, yPixel);
        this.ctx.strokeStyle = 'green';
        this.ctx.moveTo(this.maxYLabelWidth + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING, yPixel);
        this.ctx.beginPath();
        this.ctx.lineTo(this.maxYLabelWidth + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING, yPixel);
        this.ctx.lineTo(this.maxYLabelWidth + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING + LABEL_LINE_WIDTH , yPixel);
        this.ctx.stroke();
    }
  }

  _drawXLabels () {
    const charsAvailable = (this.canvasSize.width - this.chartLeftPadding) / 2;
    const maxLabelsPossible = charsAvailable / (4);
    const pointsPerMaxLabel = Math.ceil(this.data.x.length / maxLabelsPossible);
    const showNthLabel = 1;

    for(var i = 0; i < this.data.x.length; i += showNthLabel) {
      if((this._getXPixel(i, this.data.x.length, this.chartLeftPadding) + (this.data.x[i].length * 2)) <= this.canvasSize.width) {
        this.ctx.fillText(this.data.x[i], this._getXPixel(i, this.data.x.length, this.chartLeftPadding), this.canvasSize.height - CHART_TOP_PADDING + 10);
      }
    }
  }

  _clear() {
    this.ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
  }

  setData(data) {
    this.data = data;
    this.scrollValue = 0;
    this.maxY = Math.max(...data.y) * 1.2;
    this.maxYLabelWidth = getMaxYLabelWidth(this.maxY);
    this.chartLeftPadding = this.maxYLabelWidth + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING + LABEL_LINE_WIDTH + LABEL_LINE_RIGHT_PADDING;

    this.ctx.fillStyle = 'green';
    this._clear(this.ctx);

    this._drawYLabels();
    this._drawLine();
    this._drawXLabels();
  }

  scrollLeft() {
    if (this.data.y.length - this.canvasSize.width + this.chartLeftPadding + this.scrollValue > 0) {
      this.scrollValue = Math.max(this.scrollValue - SCROLL_SPEED, -(this.data.y.length - this.canvasSize.width + this.chartLeftPadding));
      this._clear(this.ctx);
      this._drawYLabels();
      this._drawLine();
      this._drawXLabels();
    }
  }

  scrollRight() {
    if (this.scrollValue < 0) {
      this.scrollValue = Math.min(this.scrollValue + SCROLL_SPEED, 0);
      this._clear(this.ctx);
      this._drawYLabels();
      this._drawLine();
      this._drawXLabels();
    }
  }

  render() {
    this.setContent(this.ctx._canvas.frame());
    return this._render();
  }
}

module.exports = Line
