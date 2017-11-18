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
const LABEL_MAX_WIDTH = 5;
const Y_AXIS_WIDTH = LABEL_MAX_WIDTH + LABEL_LINE_WIDTH + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING + LABEL_LINE_WIDTH;
const CHART_X_AXIS_HEIGHT = 6 * LINE_HEIGHT;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function monthsFit(months, since, until, chartWidth, chartLeftPadding) {
  const daysTotal = until.diff(since, 'days') + 1;
  let month = since.month();
  const allocatedPixels = [];
  for (let i = 1; i < daysTotal; i++) {
    let iMonth = since.clone().add(i, 'days').month();
    if (iMonth !== month && months.indexOf(iMonth) !== -1) {
      month = iMonth;
      const x = Math.floor(((chartWidth-1) / (daysTotal-1)) * i + chartLeftPadding);
      allocatedPixels.push(x);
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

function calcVisibleMonths(since, until, chartWidth, chartLeftPadding) {
  if (!monthsFit([0, 6], since, until, chartWidth, chartLeftPadding)) {
    return [];
  }
  if (!monthsFit([0, 3, 6, 9], since, until, chartWidth, chartLeftPadding)) {
    return [0, 6];
  }
  if (!monthsFit([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], since, until, chartWidth, chartLeftPadding)) {
    return [0, 3, 6, 9];
  }
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
}

function yearsFit(years, since, until, chartWidth, chartLeftPadding) {
  const daysTotal = until.diff(since, 'days') + 1;
  let year = since.year();
  const allocatedPixels = [];
  for (let i = 1; i < daysTotal; i++) {
    let iYear = since.clone().add(i, 'days').year();
    if (iYear !== year && years.indexOf(iYear) !== -1) {
      year = iYear;
      const x = Math.floor(((chartWidth-1) / (daysTotal-1)) * i + chartLeftPadding);
      allocatedPixels.push(x);
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

function unique(arr) {
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

function filterYears(years, gap) {
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

function calcVisibleYears(since, until, chartWidth, chartLeftPadding) {
  const daysTotal = until.diff(since, 'days') + 1;
  const years = [];
  for (let i = 0; i < daysTotal; i++) {
    const year = since.clone().add(i, 'days').year();
    years.push(year);
  }
  const uniqYears = unique(years);
  for (let i = 0; i < uniqYears.length; i++) {
    const filteredYears = filterYears(uniqYears, i);
    if (yearsFit(filteredYears, since, until, chartWidth, chartLeftPadding)) {
      return filteredYears;
    }
  }
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

  _drawLine(buckets, maxHeightOfMaxCommitsPerBucket, chartWidth, chartHeight, chartLeftPadding) {
    const maxCommitsPerBucket = Math.max(...buckets);
    const commitHeihgt = maxHeightOfMaxCommitsPerBucket * chartHeight / maxCommitsPerBucket;

    this.ctx.strokeStyle = LINE_COLOR;
    this.ctx.moveTo(0, 0)
    this.ctx.beginPath();
    for (let i = 0; i < buckets.length; i++) {
      const x = Math.floor(((chartWidth-1) / (buckets.length-1)) * i + chartLeftPadding);
      const y = Math.floor(chartHeight - (commitHeihgt * buckets[i]))+1;
      this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
  }

  _drawYLabels(buckets, chartHeight) {
    const maxCommitsPerBucket = Math.max(...buckets);
    const countOfSlots = Math.floor(chartHeight / LINE_HEIGHT);
    const nextMultipleOfCountsOfSlots = Math.ceil(maxCommitsPerBucket / countOfSlots) * countOfSlots;
    const minGoodEntropy = Math.pow(0.3, Math.log10(countOfSlots));
    let maxResult = 0;
    let maxI = 0;
    let maxFactor = 0;
    let maxHeightOfMaxCommitsPerBucket = 0;
    let maxYValueOfFactor = 0;

    for (let i = maxCommitsPerBucket; i <= nextMultipleOfCountsOfSlots; i++) {
      const factors = Array.from(Array(i + 1), (_, j) => j)
        .filter(j => i % j === 0)
        .filter(j => j <= countOfSlots);
      for (let factor of factors) {
        let yValueOfFactor = 0;
        for (let j = countOfSlots; j >= 1; j--) {
          if (j % factor === 0) {
            yValueOfFactor = j;
            break;
          }
        }
        if (yValueOfFactor === 0) {
          throw new Error("yValueOfFactor === 0");
        }
        const entropy = Math.min(factor / countOfSlots / minGoodEntropy, 1.0);
        const heightOfMaxCommitsPerBucket = yValueOfFactor / i * maxCommitsPerBucket / countOfSlots;
        const heightTotal = yValueOfFactor / countOfSlots;
        const result = entropy * heightOfMaxCommitsPerBucket * heightTotal;
        if (maxResult === 0 || result > maxResult) {
          maxResult = result;
          maxI = i;
          maxFactor = factor;
          maxHeightOfMaxCommitsPerBucket = heightOfMaxCommitsPerBucket;
          maxYValueOfFactor = yValueOfFactor;
        }
      }
    }
    const gap = maxYValueOfFactor / maxFactor;
    for (let i = 0; i <= maxFactor; i++) {
      const y = Math.round(chartHeight - gap * i * LINE_HEIGHT)
      const value = Math.floor(maxI / maxFactor * i);
      const formatedLabel = value.toFixed(0);
      this.ctx.fillText(formatedLabel, LABEL_LEFT_PADDING + (LABEL_MAX_WIDTH - formatedLabel.length - 1) * LABEL_LINE_WIDTH, y);
      this.ctx.strokeStyle = 'green';
      this.ctx.beginPath();
      this.ctx.moveTo(LABEL_MAX_WIDTH + LABEL_LINE_WIDTH + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING, y + 1);
      this.ctx.lineTo(LABEL_MAX_WIDTH + LABEL_LINE_WIDTH + LABEL_LEFT_PADDING + LABEL_RIGHT_PADDING + LABEL_LINE_WIDTH, y + 1);
      this.ctx.stroke();
    }
    return maxHeightOfMaxCommitsPerBucket;
  }

  _drawXLabels(since, until, chartWidth, chartHeight, chartLeftPadding) {
    const daysTotal = until.diff(since, 'days') + 1;
    let month = since.clone().month();
    let year = since.clone().year();
    const visibleMonths = calcVisibleMonths(since, until, chartWidth, chartLeftPadding);
    const visibleYears = calcVisibleYears(since, until, chartWidth, chartLeftPadding);
    for (let i = 0; i <= daysTotal; i++) {
      let iYear = since.clone().add(i, 'days').year();
      let iMonth = since.clone().add(i, 'days').month();
      let iDay = since.clone().add(i, 'days').date();
      if ((iMonth !== month || iDay == 1) && visibleMonths.indexOf(iMonth) !== -1) {
        month = iMonth;
        let monthText = `${MONTHS[iMonth]}`;
        const x = Math.floor(((chartWidth-1) / (daysTotal-1)) * i + chartLeftPadding);
        this.ctx.strokeStyle = 'green';
        this.ctx.beginPath();
        this.ctx.moveTo(x, chartHeight + 4);
        this.ctx.lineTo(x, chartHeight + 5);
        this.ctx.moveTo(x + (x % 2 == 0 ? 1 : -1), chartHeight + 4);
        this.ctx.lineTo(x + (x % 2 == 0 ? 1 : -1), chartHeight + 5);
        this.ctx.stroke();
        for (let j = 0; j < monthText.length; j++) {
          this.ctx.fillText(monthText[j], x, chartHeight + 10 + j * LINE_HEIGHT);
        }
      }
      if ((iYear !== year || (iDay == 1 && iMonth == 0)) && visibleYears.indexOf(iYear) !== -1) {
        year = iYear;
        let yearText = `${iYear}`;
        const x = Math.floor(((chartWidth-1) / (daysTotal-1)) * i + chartLeftPadding);
        this.ctx.strokeStyle = 'green';
        this.ctx.beginPath();
        this.ctx.moveTo(x, chartHeight + 4);
        this.ctx.lineTo(x, chartHeight + 5);
        this.ctx.moveTo(x + (x % 2 == 0 ? 1 : -1), chartHeight + 4);
        this.ctx.lineTo(x + (x % 2 == 0 ? 1 : -1), chartHeight + 5);
        this.ctx.stroke();
        for (let j = 0; j < yearText.length; j++) {
          this.ctx.fillText(yearText[j], x, chartHeight + 10 + j * LINE_HEIGHT);
        }
      }
    }
  }

  _clear() {
    this.ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
  }

  setData(data) {
    this.ctx.fillStyle = 'green';
    this._clear(this.ctx);

    const chartHeight = this.canvasSize.height - CHART_X_AXIS_HEIGHT;
    const chartLeftPadding = Y_AXIS_WIDTH + 2;
    const chartWidth = (this.canvasSize.width - chartLeftPadding) % 2 == 0 ? this.canvasSize.width - chartLeftPadding : this.canvasSize.width - chartLeftPadding - 1;
    const gitLog = data.gitLog;
    const since = data.since;
    const until = data.until;
    const filteredGitLog = gitLog.filter(commit => commit.isSameOrAfter(since) && commit.isSameOrBefore(until));
    const countOfDays = (until.diff(since, 'days') + 1) % 2 == 0 ? until.diff(since, 'days') + 1: until.diff(since, 'days');
    const bucketCount = Math.min(chartWidth, countOfDays);
    const bucketCountDaysRatio = bucketCount / countOfDays;
    const buckets = new Array(bucketCount).fill(0);
    
    for (let i = 0; i < filteredGitLog.length; i++) {
      const bucketIndex = Math.floor(filteredGitLog[i].diff(since, 'days') * bucketCountDaysRatio)-1;
      buckets[bucketIndex] += 1;
    }
    // throw new Error(until)
    
    const maxHeightOfMaxCommitsPerBucket = this._drawYLabels(buckets, chartHeight);
    this._drawLine(buckets, maxHeightOfMaxCommitsPerBucket, chartWidth, chartHeight, chartLeftPadding);
    this._drawXLabels(since, until, chartWidth, chartHeight, chartLeftPadding);
  }

  render() {
    this.setContent(this.ctx._canvas.frame());
    return this._render();
  }
}

module.exports = Line