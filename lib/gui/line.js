var blessed = require('blessed')
   , Node = blessed.Node
   , Canvas = require('./canvas');

function getColorCode(color) {
  if (Array.isArray(color) && color.length == 3) {
    return x256(color[0],color[1],color[2]);
  } else {
    return color;
  }
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

    //compatability with older api
    if (!Array.isArray(data)) data = [data]

    var self = this
    var xLabelPadding = 5;
    var yLabelPadding = 3
    var xPadding = 10;
    var yPadding = 11
    var c = this.ctx
    var labels = data[0].x

    function getMaxY() {
      var max = 0;
      var setMax = [];

      for(var i = 0; i < data.length; i++) {
        if (data[i].y.length)
          setMax[i] = Math.max(...data[i].y);

        for(var j = 0; j < data[i].y.length; j++) {
          if(data[i].y[j] > max) {
            max = data[i].y[j];
          }
        }
      }

      var m = Math.max(...setMax);

      max = m*1.2;
      max*=1.2
      if (self.options.maxY) {
        return Math.max(max, self.options.maxY)
      }

      return max;
    }

    function formatYLabel(value, max, min, numLabels, wholeNumbersOnly, abbreviate) {
      var fixed = (max/numLabels<1 && value!=0 && !wholeNumbersOnly) ? 2 : 0
      var res = value.toFixed(fixed)
      return res
    }

    function getMaxXLabelPadding(numLabels, wholeNumbersOnly, abbreviate, min) {
      var max = getMaxY()

      return formatYLabel(max, max, min, numLabels, wholeNumbersOnly, abbreviate).length * 2;
    }

    var maxPadding = getMaxXLabelPadding(5, true, this.options.abbreviate, 0)
    if (xLabelPadding < maxPadding) {
      xLabelPadding = maxPadding;
    };

    if ((xPadding - xLabelPadding) < 0) {
      xPadding = xLabelPadding;
    }

    function getMaxX() {
      var maxLength = 0;

      for(var i = 0; i < labels.length; i++) {
        if(labels[i] === undefined) {
          console.log("label[" + i + "] is undefined");
        } else if(labels[i].length > maxLength) {
          maxLength = labels[i].length;
        }
      }

      return maxLength;
    }

    function getXPixel(val) {
        return ((self.canvasSize.width - xPadding) / labels.length) * val + (xPadding * 1.0) + 2;
    }

    function getYPixel(val, minY) {
        var res = self.canvasSize.height - yPadding - (((self.canvasSize.height - yPadding) / (getMaxY()-minY)) * (val-minY));
        res-=2 //to separate the baseline and the data line to separate chars so canvas will show separate colors
        return res
    }

    // Draw the line graph
    function drawLine(values, style, minY) {
      style = style || {}
      var color = 'yellow';
      c.strokeStyle = style.line || color

      c.moveTo(0, 0)
      c.beginPath();
      c.lineTo(getXPixel(0), getYPixel(values[0], minY));

      for(var k = 1; k < values.length; k++) {
          c.lineTo(getXPixel(k), getYPixel(values[k], minY));
      }

      c.stroke();
    }

    c.fillStyle = 'green';

    c.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);


    var yLabelIncrement = getMaxY()/5;
    if (true) yLabelIncrement = Math.floor(yLabelIncrement)
    //if (getMaxY()>=10) {
    //  yLabelIncrement = yLabelIncrement + (10 - yLabelIncrement % 10)
    //}

    //yLabelIncrement = Math.max(yLabelIncrement, 1) // should not be zero

    if (yLabelIncrement==0) yLabelIncrement = 1

    // Draw the Y value texts
    var maxY = getMaxY()
    for(var i = 0; i < maxY; i += yLabelIncrement) {
        c.fillText(formatYLabel(i, maxY, 0, 5, true, this.options.abbreviate), xPadding - xLabelPadding, getYPixel(i, 0));
    }

    for (var h=0; h<data.length; h++) {
      drawLine(data[h].y, data[h].style, 0)
    }

    // Draw the X value texts
    var charsAvailable = (this.canvasSize.width - xPadding) / 2;
    var maxLabelsPossible = charsAvailable / (getMaxX() + 2);
    var pointsPerMaxLabel = Math.ceil(data[0].y.length / maxLabelsPossible);
    var showNthLabel = 1;
    if (showNthLabel < pointsPerMaxLabel) {
      showNthLabel = pointsPerMaxLabel;
    }

    for(var i = 0; i < labels.length; i += showNthLabel) {
      if((getXPixel(i) + (labels[i].length * 2)) <= this.canvasSize.width) {
        c.fillText(labels[i], getXPixel(i), this.canvasSize.height - yPadding + yLabelPadding);
      }
    }

}

module.exports = Line
