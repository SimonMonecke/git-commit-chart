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
      return ((this.canvasSize.width - chartLeftPadding) / countOfValues) * val + chartLeftPadding + 1;
  }

  _getYPixel(val, maxY) {
      return this.canvasSize.height - CHART_TOP_PADDING - (((this.canvasSize.height - CHART_TOP_PADDING) / maxY) * val);
  }

  _getYValue(pixel, maxY) {
      return (this.canvasSize.height - CHART_TOP_PADDING - pixel) / ((this.canvasSize.height - CHART_TOP_PADDING) / maxY);
  }

  _drawLine(values, maxY, chartLeftPadding, fitToScreen, scrollLeft, ctx) {
    ctx.strokeStyle = LINE_COLOR;

    ctx.moveTo(0, 0)
    ctx.beginPath();

    if (!fitToScreen && (values.length - this.canvasSize.width + chartLeftPadding) > 0) {
      for(var k = values.length - this.canvasSize.width + chartLeftPadding + scrollLeft; k < values.length; k++) {
          ctx.lineTo(k - values.length + this.canvasSize.width - scrollLeft, this._getYPixel(values[k], maxY));
      }
    } else {
      for(var k = 0; k < values.length; k++) {
          ctx.lineTo(this._getXPixel(k, values.length, chartLeftPadding), this._getYPixel(values[k], maxY));
      }
    }
    ctx.stroke();
  }

  _drawYLabels (maxY, maxYLabelWidth, ctx) {
    for(let i = 0; i <= this.canvasSize.height; i += LINE_HEIGHT * 2) {
        const yPixel = this.canvasSize.height - CHART_TOP_PADDING - i;
        const formatedLabel = formatYLabel(this._getYValue(yPixel, maxY));
        ctx.fillText(formatedLabel, LABEL_LEFT_PADDING + maxYLabelWidth - formatedLabel.length * 2, yPixel);
        ctx.strokeStyle = 'green';
        ctx.moveTo(maxYLabelWidth + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING, yPixel);
        ctx.beginPath();
        ctx.lineTo(maxYLabelWidth + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING, yPixel);
        ctx.lineTo(maxYLabelWidth + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING + LABEL_LINE_WIDTH , yPixel);
        ctx.stroke();
    }
  }

  _drawXLabels (xValues, chartLeftPadding, ctx) {
    const charsAvailable = (this.canvasSize.width - chartLeftPadding) / 2;
    const maxLabelsPossible = charsAvailable / (4);
    const pointsPerMaxLabel = Math.ceil(xValues.length / maxLabelsPossible);
    const showNthLabel = 1;

    for(var i = 0; i < xValues.length; i += showNthLabel) {
      if((this._getXPixel(i, xValues.length, chartLeftPadding) + (xValues[i].length * 2)) <= this.canvasSize.width) {
        ctx.fillText(xValues[i], this._getXPixel(i, xValues.length, chartLeftPadding), this.canvasSize.height - CHART_TOP_PADDING + 5);
      }
    }
  }

  _clear(ctx) {
    ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
  }

  setData(data) {
    const maxY = Math.max(...data.y) * 1.2;
    const maxYLabelWidth = getMaxYLabelWidth(maxY);
    const chartLeftPadding = maxYLabelWidth + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING + LABEL_LINE_WIDTH + LABEL_LINE_RIGHT_PADDING;

    this.ctx.fillStyle = 'green';
    this._clear(this.ctx);

    this._drawYLabels(maxY, maxYLabelWidth, this.ctx);

    this._drawLine(data.y, maxY, chartLeftPadding, data.fitToScreen, data.scrollLeft, this.ctx);

    this._drawXLabels(data.x, chartLeftPadding, this.ctx);
  }

  render() {
    this.setContent(this.ctx._canvas.frame());
    return this._render();
  }
}

module.exports = Line
