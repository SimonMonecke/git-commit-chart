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
const LABEL_LINE_RIGHT_PADDING = 3;
const CHART_TOP_PADDING = 31;
const SCROLL_SPEED = 5;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function getColorCode(color) {
  if (Array.isArray(color) && color.length == 3) {
    return x256(color[0], color[1], color[2]);
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

class Line extends Box {
  constructor(options) {
    options = options || {};
    super(options);
    this.options = options;

    this.on("attach", function () {
      this._calcSize();

      this._canvas = new InnerCanvas(this.canvasSize.width, this.canvasSize.height);
      this.ctx = this._canvas.getContext();
    })
  }

  _calcSize() {
    this.canvasSize = {
      width: this.width * CHAR_WIDTH - 12,
      height: this.height * LINE_HEIGHT - 8
    };
  }

  _getXPixel(val) {
    return Math.floor((this.chartWidth / this.data.y.length) * val + this.chartLeftPadding);
  }

  _getYPixel(val) {
    return Math.floor(this.chartHeight - ((this.chartHeight / this.maxY) * val));
  }

  _getYValue(pixel, maxY) {
    return Math.floor((this.chartHeight - pixel) / (this.chartHeight / this.maxY));
  }

  contentFits() {
    return !(!this.data.fitToScreen && this.data.y.length > this.chartWidth);
  }

  _drawLine() {
    this.ctx.strokeStyle = LINE_COLOR;
    const countOfValues = this.data.y.length;

    this.ctx.moveTo(0, 0)
    this.ctx.beginPath();

    if (!this.contentFits()) {
      for (var k = 0; k < this.chartWidth; k++) {
        const index = k + countOfValues - this.chartWidth + this.scrollValue;
        this.ctx.lineTo(k + this.chartLeftPadding, this._getYPixel(this.data.y[index]));
      }
      const leftX = Math.round((countOfValues - this.chartWidth + this.scrollValue) / countOfValues * 100);
      const rightX = Math.round((countOfValues + this.scrollValue) / countOfValues * 100);
      this.ctx.fillText(`${leftX} - ${rightX} %`, this.chartLeftPadding, 0);
    } else {
      for (var k = 0; k < countOfValues; k++) {
        this.ctx.lineTo(this._getXPixel(k), this._getYPixel(this.data.y[k]));
      }
    }
    this.ctx.stroke();
  }

  _drawYLabels() {
    for (let i = 0; i <= this.canvasSize.height; i += LINE_HEIGHT * 2) {
      const yPixel = this.chartHeight - i;
      const formatedLabel = formatYLabel(this._getYValue(yPixel));
      this.ctx.fillText(formatedLabel, LABEL_LEFT_PADDING + this.maxYLabelWidth - formatedLabel.length * 2, yPixel);
      this.ctx.strokeStyle = 'green';
      this.ctx.beginPath();
      this.ctx.moveTo(this.maxYLabelWidth + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING, yPixel);
      this.ctx.lineTo(this.maxYLabelWidth + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING + LABEL_LINE_WIDTH, yPixel);
      this.ctx.stroke();
    }
  }

  monthsFit(months, fitToScreen) {
    if (fitToScreen) {
      let month = this.data.x[0].month();
      const allocatedPixels = [];
      for (let i = 1; i < this.data.x.length; i++) {
        let iMonth = this.data.x[i].month();
        if (iMonth !== month && months.indexOf(iMonth) !== -1) {
          month = iMonth;
          allocatedPixels.push(this._getXPixel(i));
        }
      }
      allocatedPixels.sort(function (a, b) {
        return a - b
      });
      let lastPixel = 0;
      for (let i = 0; i < allocatedPixels.length; i++) {
        if (allocatedPixels[i] - lastPixel < 4) {
          return false;
        }
        lastPixel = allocatedPixels[i];
      }
      return true;
    } else {
      const countOfValues = this.data.x.length;
      let month = this.data.x[countOfValues - this.chartWidth + this.scrollValue].month();
      const allocatedPixels = [];
      for (let k = 1;k < this.chartWidth; k++) {
        const i = k + countOfValues - this.chartWidth + this.scrollValue;
        let iMonth = this.data.x[i].month();
        if (iMonth !== month && months.indexOf(iMonth) !== -1) {
          month = iMonth;
          allocatedPixels.push(k + this.chartLeftPadding);
        }
      }
      allocatedPixels.sort(function (a, b) {
        return a - b
      });
      let lastPixel = 0;
      for (let i = 0; i < allocatedPixels.length; i++) {
        if (allocatedPixels[i] - lastPixel < 4) {
          return false;
        }
        lastPixel = allocatedPixels[i];
      }
      return true;
    }
  }

  calcVisibleMonths(fitToScreen) {
    if (!this.monthsFit([0, 6], fitToScreen)) {
      return [];
    }
    if (!this.monthsFit([0, 3, 6, 9], fitToScreen)) {
      return [0, 6];
    }
    if (!this.monthsFit([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], fitToScreen)) {
      return [0, 3, 6, 9];
    }
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  }

  yearsFit(years) {
    let year = this.data.x[0].year();
    const allocatedPixels = [];
    for (let i = 1; i < this.data.x.length; i++) {
      let iYear = this.data.x[i].year();
      if (iYear !== year && years.indexOf(iYear) !== -1) {
        year = iYear;
        allocatedPixels.push(this._getXPixel(i));
      }
    }
    allocatedPixels.sort(function (a, b) {
      return a - b
    });
    let lastPixel = 0;
    for (let i = 0; i < allocatedPixels.length; i++) {
      if (allocatedPixels[i] - lastPixel < 4) {
        return false;
      }
      lastPixel = allocatedPixels[i];
    }
    return true;
  }

  unique(arr) {
    var u = {};
    var a = [];
    for (var i = 0, l = arr.length; i < l; ++i) {
      if (!u.hasOwnProperty(arr[i])) {
        a.push(arr[i]);
        u[arr[i]] = 1;
      }
    }
    return a;
  }

  filterYears(years, gap) {
    if (gap === 0) {
      return years;
    }
    const res = [];
    for (let i = 0; i < years.length; i++) {
      if ((years.length - 1 - i) % gap === 0) {
        res.push(years[i]);
      }
    }
    return res;
  }

  calcVisibleYears() {
    const years = [];
    for (let i = 0; i < this.data.x.length; i++) {
      years.push(this.data.x[i].year());
    }
    const uniqYears = this.unique(years);
    for (let i = 0; i < uniqYears.length; i++) {
      const filteredYears = this.filterYears(uniqYears, i);
      if (this.yearsFit(filteredYears)) {
        return filteredYears;
      }
    }
  }

  _drawXLabels() {
    const countOfValues = this.data.x.length;
    if (!this.data.fitToScreen && countOfValues > this.chartWidth) {
      let year = this.data.x[countOfValues - this.chartWidth + this.scrollValue].year();
      let month = this.data.x[countOfValues - this.chartWidth + this.scrollValue].month();
      const visibleMonths = this.calcVisibleMonths(false);
      const visibleYears = this.calcVisibleYears();
      for (let k = 1; k < this.chartWidth; k++) {
        const i = k + countOfValues - this.chartWidth + this.scrollValue;
        let iMonth = this.data.x[i].month();
        if (iMonth !== month && visibleMonths.indexOf(iMonth) !== -1) {
          month = iMonth;
          let monthText = `${MONTHS[iMonth]}`;
          this.ctx.strokeStyle = 'green';
          this.ctx.beginPath();
          this.ctx.moveTo(k + this.chartLeftPadding, this.chartHeight + 3);
          this.ctx.lineTo(k + this.chartLeftPadding, this.chartHeight + 5);
          this.ctx.stroke();
          for (let j = 0; j < monthText.length; j++) {
            this.ctx.fillText(monthText[j], k + this.chartLeftPadding, this.chartHeight + 10 + j * LINE_HEIGHT);
          }
        }
        let iYear = this.data.x[i].year();
        if (iYear !== year) {
          year = iYear;
          let yearText = `${iYear}`;
          this.ctx.strokeStyle = 'green';
          this.ctx.beginPath();
          this.ctx.moveTo(k + this.chartLeftPadding, this.chartHeight + 3);
          this.ctx.lineTo(k + this.chartLeftPadding, this.chartHeight + 5);
          this.ctx.stroke();
          for (let j = 0; j < yearText.length; j++) {
            this.ctx.fillText(yearText[j], k + this.chartLeftPadding, this.chartHeight + 10 + j * LINE_HEIGHT);
          }
        }
      }
    } else {
      let year = this.data.x[0].year();
      let month = this.data.x[0].month();
      const visibleMonths = this.calcVisibleMonths(true);
      const visibleYears = this.calcVisibleYears();
      for (let i = 1; i < this.data.x.length; i++) {
        let iMonth = this.data.x[i].month();
        if (iMonth !== month && visibleMonths.indexOf(iMonth) !== -1) {
          month = iMonth;
          let monthText = `${MONTHS[iMonth]}`;
          this.ctx.strokeStyle = 'green';
          this.ctx.beginPath();
          this.ctx.moveTo(this._getXPixel(i), this.chartHeight + 3);
          this.ctx.lineTo(this._getXPixel(i), this.chartHeight + 5);
          this.ctx.stroke();
          for (let j = 0; j < monthText.length; j++) {
            this.ctx.fillText(monthText[j], this._getXPixel(i), this.chartHeight + 10 + j * LINE_HEIGHT);
          }
        }
        let iYear = this.data.x[i].year();
        if (iYear !== year && visibleYears.indexOf(iYear) !== -1) {
          year = iYear;
          let yearText = `${iYear}`;
          this.ctx.strokeStyle = 'green';
          this.ctx.beginPath();
          this.ctx.moveTo(this._getXPixel(i), this.chartHeight + 3);
          this.ctx.lineTo(this._getXPixel(i), this.chartHeight + 5);
          this.ctx.stroke();
          for (let j = 0; j < yearText.length; j++) {
            this.ctx.fillText(yearText[j], this._getXPixel(i), this.chartHeight + 10 + j * LINE_HEIGHT);
          }
        }
      }
    }
  }

  _clear() {
    this.ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
  }

  setData(data) {
    this.data = data;
    this.scrollValue = 0;
    this.chartHeight = this.canvasSize.height - CHART_TOP_PADDING;
    const countOfYLabels = Math.floor(this.chartHeight / (LINE_HEIGHT * 2));
    this.maxY = Math.ceil(Math.max(...data.y) / countOfYLabels) * countOfYLabels * (this.chartHeight / (LINE_HEIGHT * 2 * countOfYLabels));
    this.maxYLabelWidth = getMaxYLabelWidth(this.maxY);
    this.chartLeftPadding = this.maxYLabelWidth + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING + LABEL_LINE_WIDTH + LABEL_LINE_RIGHT_PADDING;
    this.chartWidth = this.canvasSize.width - this.chartLeftPadding;

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