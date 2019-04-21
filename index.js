var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var canvasHeight = canvas.height;
var canvasWidth = canvas.width;
var data = []; // all the coordinate of the dots and lines will be stored here

function addData (x1, y1, x2, y2) {
	if (typeof x2 === 'undefined' && typeof y2 === 'undefined') // the data is a dot
		data.push({
			          type : 'dot',
			          x    : x1,
			          y    : y1
		          });
	else // the data is a line
		data.push({
			          type  : 'line',
			          start : {
				          x : x1,
				          y : y1
			          },
			          end   : {
				          x : x2,
				          y : y2
			          }
		          });
}

function drawDot (x, y, color) {
	color = (typeof color !== 'undefined') ? color : '#000'; // default parameter
	context.beginPath();
	context.arc(x, y, 2, 0, 2 * Math.PI);
	// set dot color
	context.fillStyle = color;
	context.fill();
}

function drawLine (x1, y1, x2, y2, color) {
	color = (typeof color !== 'undefined') ? color : '#000'; // default parameter
	context.beginPath();
	context.moveTo(x1, y1);
	context.lineTo(x2, y2);
	// set line color
	context.lineWidth = 2;
	context.strokeStyle = color;
	context.stroke();
}

function clearCanvas () {
	context.clearRect(0, 0, canvasWidth, canvasHeight);
}

function refreshCanvas (interval) {
	if (typeof interval === 'undefined') interval = 200;
	clearCanvas();
	setTimeout(function () {
		for (var i = 0; i < data.length; i++)
			if (data[i].type === 'dot')
				drawDot(data[i].x, data[i].y);
			else if (data[i].type === 'line')
				drawLine(data[i].start.x, data[i].start.y, data[i].end.x, data[i].end.y);
	}, interval);
}

function deleteData (x1, y1, x2, y2) { // x2 and y2 are undefined in deleting dot
	var temp = JSON.parse(JSON.stringify(data)); // deep copy
	clearCanvas();
	for (var i = 0; i < temp.length; i++)
		if (temp[i].type === 'dot')
			(temp[i].x === x1 && temp[i].y === y1) ? data.splice(i, 1) : drawDot(temp[i].x, temp[i].y);
		else if (temp[i].type === 'line')
			(temp[i].start.x === x1 && temp[i].start.y === y1 && temp[i].end.x === x2 && temp[i].end.y === y2) ? data.splice(i, 1) : drawLine(temp[i].start.x, temp[i].start.y, temp[i].end.x, temp[i].end.y);
}

var clippingWindow = null,
    isTransformed  = false;

function initializeClippingWindow (xBottomLeft, yBottomLeft, xTopRight, yTopRight, color) {
	color = (typeof color !== 'undefined') ? color : '#00f'; // default parameter
	context.beginPath();
	context.rect(xBottomLeft, yBottomLeft, xTopRight - xBottomLeft, yTopRight - yBottomLeft);
	// set line color
	context.strokeStyle = color;
	context.stroke();

	clippingWindow = {
		bottomLeft : {
			x : xBottomLeft,
			y : yBottomLeft
		},
		topRight   : {
			x : xTopRight,
			y : yTopRight
		}
	};
}

function determineArea (point) {
	var areaCode = 0;
	if (point.y > clippingWindow.topRight.y)
		areaCode += 8;
	else if (point.y < clippingWindow.bottomLeft.y)
		areaCode += 4;

	if (point.x > clippingWindow.topRight.x)
		areaCode += 2;
	else if (point.x < clippingWindow.bottomLeft.x)
		areaCode += 1;

	return areaCode;
}

function transformClippedLine (areaCode, startPoint, endPoint) {
	switch (areaCode) {
		case 8: // top -> (y, -x)
			var temp = startPoint.x;
			startPoint.x = startPoint.y;
			startPoint.y = -1 * temp;

			temp = endPoint.x;
			endPoint.x = endPoint.y;
			endPoint.y = -1 * temp;
			break;
		case 2: // right (-x, y)
			startPoint.x = -1 * startPoint.x;
			endPoint.x = -1 * endPoint.x;
			break;
		case 4: // bottom (y, x)
			var temp = startPoint.x;
			startPoint.x = startPoint.y;
			startPoint.y = temp;

			temp = endPoint.x;
			endPoint.x = endPoint.y;
			endPoint.y = temp;
			break;
		case 10: // top right
			startPoint.x = -1 * startPoint.x;
			endPoint.x = -1 * endPoint.x;
			break;
		case 5: // bottom left
			startPoint.y = -1 * startPoint.y;
			endPoint.y = -1 * endPoint.y;
			break;
		case 6: // bottom right
			startPoint.x = -1 * startPoint.x;
			endPoint.x = -1 * endPoint.x;
			startPoint.y = -1 * startPoint.y;
			endPoint.y = -1 * endPoint.y;
			break;
	}
}

function transformAll (areaCode, startPoint, endPoint) { // areaCode of startPoint
	if (areaCode === 9 || areaCode === 0 || areaCode === 1)
		return; // already in the right area, no need to transform

	var bottomLeftX = clippingWindow.bottomLeft.x,
	    bottomLeftY = clippingWindow.bottomLeft.y,
	    topRightX   = clippingWindow.topRight.x,
	    topRightY   = clippingWindow.topRight.y;

	switch (areaCode) {
		case 8: // top
			var temp;

			if (isTransformed) { // transforming back -> (y, -x)
				temp = startPoint.x;
				startPoint.x = startPoint.y;
				startPoint.y = -1 * temp;

				temp = endPoint.x;
				endPoint.x = endPoint.y;
				endPoint.y = -1 * temp;

				clippingWindow.bottomLeft.x = bottomLeftY;
				clippingWindow.bottomLeft.y = -1 * topRightX;

				clippingWindow.topRight.x = topRightY;
				clippingWindow.topRight.y = -1 * bottomLeftX;
			}
			else { // transform -> (-y, x)
				temp = startPoint.x;
				startPoint.x = -1 * startPoint.y;
				startPoint.y = temp;

				temp = endPoint.x;
				endPoint.x = -1 * endPoint.y;
				endPoint.y = temp;

				clippingWindow.bottomLeft.x = -1 * topRightY;
				clippingWindow.bottomLeft.y = bottomLeftX;

				clippingWindow.topRight.x = -1 * bottomLeftY;
				clippingWindow.topRight.y = topRightX;
			}
			break;
		case 2: // right -> (-x, y)
			startPoint.x = -1 * startPoint.x;
			endPoint.x = -1 * endPoint.x;

			clippingWindow.bottomLeft.x = -1 * topRightX;
			clippingWindow.topRight.x = -1 * bottomLeftX;
			break;
		case 4: // bottom -> (y, x)
			var temp = startPoint.x;
			startPoint.x = startPoint.y;
			startPoint.y = temp;

			temp = endPoint.x;
			endPoint.x = endPoint.y;
			endPoint.y = temp;

			clippingWindow.bottomLeft.x = bottomLeftY;
			clippingWindow.bottomLeft.y = bottomLeftX;

			clippingWindow.topRight.x = topRightY;
			clippingWindow.topRight.y = topRightX;
			break;
		case 10: // top right -> (-x, y)
			startPoint.x = -1 * startPoint.x;
			endPoint.x = -1 * endPoint.x;

			clippingWindow.bottomLeft.x = -1 * topRightX;
			clippingWindow.topRight.x = -1 * bottomLeftX;
			break;
		case 5: // bottom left (x, -y)
			startPoint.y = -1 * startPoint.y;
			endPoint.y = -1 * endPoint.y;

			clippingWindow.bottomLeft.y = -1 * topRightY;
			clippingWindow.topRight.y = -1 * bottomLeftY;
			break;
		case 6: // bottom right (-x, -y)
			startPoint.x = -1 * startPoint.x;
			endPoint.x = -1 * endPoint.x;
			startPoint.y = -1 * startPoint.y;
			endPoint.y = -1 * endPoint.y;

			clippingWindow.bottomLeft.x = -1 * topRightX;
			clippingWindow.topRight.x = -1 * bottomLeftX;

			clippingWindow.bottomLeft.y = -1 * topRightY;
			clippingWindow.topRight.y = -1 * bottomLeftY;
			break;
	}
}

function xIntersection (x1, y1, x2, y2, side) {
	var x3, y3, x4, y4;
	switch (side) {
		case 'left':
			x3 = clippingWindow.bottomLeft.x;
			y3 = clippingWindow.bottomLeft.y;
			x4 = clippingWindow.bottomLeft.x;
			y4 = clippingWindow.topRight.y;
			break;
		case 'top':
			x3 = clippingWindow.bottomLeft.x;
			y3 = clippingWindow.topRight.y;
			x4 = clippingWindow.topRight.x;
			y4 = clippingWindow.topRight.y;
			break;
		case 'right':
			x3 = clippingWindow.topRight.x;
			y3 = clippingWindow.topRight.y;
			x4 = clippingWindow.topRight.x;
			y4 = clippingWindow.bottomLeft.y;
			break;
		case 'bottom':
			x3 = clippingWindow.topRight.x;
			y3 = clippingWindow.bottomLeft.y;
			x4 = clippingWindow.bottomLeft.x;
			y4 = clippingWindow.bottomLeft.y;
			break;
	}

	var num = (x1 * y2 - y1 * x2) * (x3 - x4) -
	          (x1 - x2) * (x3 * y4 - y3 * x4),
	    den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
	return num / den;
}

function yIntersection (x1, y1, x2, y2, side) {
	var x3, y3, x4, y4;
	switch (side) {
		case 'left':
			x3 = clippingWindow.bottomLeft.x;
			y3 = clippingWindow.bottomLeft.y;
			x4 = clippingWindow.bottomLeft.x;
			y4 = clippingWindow.topRight.y;
			break;
		case 'top':
			x3 = clippingWindow.bottomLeft.x;
			y3 = clippingWindow.topRight.y;
			x4 = clippingWindow.topRight.x;
			y4 = clippingWindow.topRight.y;
			break;
		case 'right':
			x3 = clippingWindow.topRight.x;
			y3 = clippingWindow.topRight.y;
			x4 = clippingWindow.topRight.x;
			y4 = clippingWindow.bottomLeft.y;
			break;
		case 'bottom':
			x3 = clippingWindow.topRight.x;
			y3 = clippingWindow.bottomLeft.y;
			x4 = clippingWindow.bottomLeft.x;
			y4 = clippingWindow.bottomLeft.y;
			break;
	}

	var num = (x1 * y2 - y1 * x2) * (y3 - y4) -
	          (y1 - y2) * (x3 * y4 - y3 * x4),
	    den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
	return num / den;
}

function clip (startPoint, endPoint) {
	var startPointAreaCode = determineArea(startPoint);
	if (typeof endPoint === 'undefined') { // clip a point
		if (startPointAreaCode === 0)
			drawDot(startPoint.x, startPoint.y, '#f00');
		return;
	}

	var endPointAreaCode = determineArea(endPoint);
	if ((startPointAreaCode | endPointAreaCode) === 0) { // trivially accepted
		drawLine(startPoint.x, startPoint.y, endPoint.x, endPoint.y, '#f00');
		return;
	}
	else if ((startPointAreaCode & endPointAreaCode) > 0) // trivially rejected
		return;

	if (startPoint.x === endPoint.x) { // to prevent division by zero error
		if (startPoint.y < endPoint.y) {
			startPoint.y = Math.max(startPoint.y, clippingWindow.topRight.y);
			endPoint.y = Math.min(endPoint.y, clippingWindow.bottomLeft.y);
		} else {
			startPoint.y = Math.min(startPoint.y, clippingWindow.topRight.y);
			endPoint.y = Math.max(endPoint.y, clippingWindow.bottomLeft.y);
		}
		drawLine(startPoint.x, startPoint.y, endPoint.x, endPoint.y, '#f00');
		return;
	}

	var slope = (endPoint.y - startPoint.y) / (endPoint.x - startPoint.x),
	    TR    = (clippingWindow.topRight.y - startPoint.y) / (clippingWindow.topRight.x - startPoint.x),
	    BR    = (clippingWindow.bottomLeft.y - startPoint.y) / (clippingWindow.topRight.x - startPoint.x),
	    BL    = (clippingWindow.bottomLeft.y - startPoint.y) / (clippingWindow.bottomLeft.x - startPoint.x),
	    TL    = (clippingWindow.topRight.y - startPoint.y) / (clippingWindow.bottomLeft.x - startPoint.x);

	if (startPointAreaCode === 0) { // startPoint is inside clippingWindow
		if (endPoint.x > startPoint.x) { // end points is at the right side of the starting point
			if (slope >= TR) // intersects with TOP border of the clipping window
				drawLine(startPoint.x,
				         startPoint.y,
				         xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top'),
				         yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top'),
				         '#f00');
			else if (BR <= slope && slope < TR) // BR <= slope < TR intersects with RIGHT border of the clipping window
				drawLine(startPoint.x,
				         startPoint.y,
				         xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'right'),
				         yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'right'),
				         '#f00');
			else if (slope < BR) // intersects with BOTTOM border of the clipping window
				drawLine(startPoint.x,
				         startPoint.y,
				         xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'bottom'),
				         yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'bottom'),
				         '#f00');
		}
		else { // end points is at the left side of the starting point
			if (slope < TL) // intersects with TOP border of the clipping window
				drawLine(startPoint.x,
				         startPoint.y,
				         xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top'),
				         yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top'),
				         '#f00');
			else if (TL <= slope && slope < BL) // TL <= slope < BL intersects with LEFT border of the clipping window
				drawLine(startPoint.x,
				         startPoint.y,
				         xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
				         yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
				         '#f00');
			else if (slope >= BL) // intersects with BOTTOM border of the clipping window
				drawLine(startPoint.x,
				         startPoint.y,
				         xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'bottom'),
				         yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'bottom'),
				         '#f00');
		}
	}
	else if (startPointAreaCode === 1) { // startPoint is at left
		if (TR < slope && slope <= TL) { // TR < slope <= TL
			if (endPoint.y >= clippingWindow.topRight.y) { // intersects with LEFT and TOP border of the clipping window
				var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
				    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
				    x2 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top'),
				    y2 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top');

				if (isTransformed)
					return {
						start : {
							x : x1,
							y : y1
						},
						end   : {
							x : x2,
							y : y2
						}
					};
				else
					drawLine(x1, y1, x2, y2, '#f00');
			}
			else { // intersects with ONLY LEFT border of the clipping window
				var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
				    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left');

				if (isTransformed)
					return {
						start : {
							x : x1,
							y : y1
						},
						end   : {
							x : endPoint.x,
							y : endPoint.y
						}
					};
				else
					drawLine(x1, y1, endPoint.x, endPoint.y, '#f00');
			}
		}
		else if (BR < slope && slope <= TR) { // BR < slope <= TR
			if (endPoint.x >= clippingWindow.topRight.x) { // intersects with LEFT and RIGHT border of the clipping window
				var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
				    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
				    x2 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'right'),
				    y2 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'right');

				if (isTransformed)
					return {
						start : {
							x : x1,
							y : y1
						},
						end   : {
							x : x2,
							y : y2
						}
					};
				else
					drawLine(x1, y1, x2, y2, '#f00');
			}
			else { // intersects with ONLY LEFT border of the clipping window
				var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
				    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left');

				if (isTransformed)
					return {
						start : {
							x : x1,
							y : y1
						},
						end   : {
							x : endPoint.x,
							y : endPoint.y
						}
					};
				else
					drawLine(x1, y1, endPoint.x, endPoint.y, '#f00');
			}
		}
		else if (BL <= slope && slope <= BR) { // BL <= slope <= BR
			if (endPoint.y <= clippingWindow.bottomLeft.y) { // intersects with LEFT and BOTTOM border of the clipping window
				var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
				    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
				    x2 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'bottom'),
				    y2 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'bottom');

				if (isTransformed)
					return {
						start : {
							x : x1,
							y : y1
						},
						end   : {
							x : x2,
							y : y2
						}
					};
				else
					drawLine(x1, y1, x2, y2, '#f00');
			}
			else { // intersects with ONLY LEFT border of the clipping window
				var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
				    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left');

				if (isTransformed)
					return {
						start : {
							x : x1,
							y : y1
						},
						end   : {
							x : endPoint.x,
							y : endPoint.y
						}
					};
				else
					drawLine(x1, y1, endPoint.x, endPoint.y, '#f00');
			}
		}
	}
	else if (startPointAreaCode === 9) { // startPoint is at top left
		if (BR < TL) { // 1st case
			if (BL <= slope && slope < BR) { // BL <= slope < BR
				if (endPoint.y <= clippingWindow.bottomLeft.y) { // intersects with LEFT and BOTTOM border of the clipping window
					var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
					    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
					    x2 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'bottom'),
					    y2 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'bottom');

					if (isTransformed)
						return {
							start : {
								x : x1,
								y : y1
							},
							end   : {
								x : x2,
								y : y2
							}
						};
					else
						drawLine(x1, y1, x2, y2, '#f00');
				}
				else { // intersects with ONLY LEFT border of the clipping window
					var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
					    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left');

					if (isTransformed)
						return {
							start : {
								x : x1,
								y : y1
							},
							end   : {
								x : endPoint.x,
								y : endPoint.y
							}
						};
					else
						drawLine(x1, y1, endPoint.x, endPoint.y, '#f00');
				}
			}
			else if (BR <= slope && slope < TL) { // BR <= slope < TL
				if (endPoint.x >= clippingWindow.topRight.x) { // intersects with LEFT and RIGHT border of the clipping window
					var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
					    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
					    x2 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'right'),
					    y2 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'right');

					if (isTransformed)
						return {
							start : {
								x : x1,
								y : y1
							},
							end   : {
								x : x2,
								y : y2
							}
						};
					else
						drawLine(x1, y1, x2, y2, '#f00');
				}
				else { // intersects with ONLY LEFT border of the clipping window
					var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
					    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left');

					if (isTransformed)
						return {
							start : {
								x : x1,
								y : y1
							},
							end   : {
								x : endPoint.x,
								y : endPoint.y
							}
						};
					else
						drawLine(x1, y1, endPoint.x, endPoint.y, '#f00');
				}
			}
			else if (TL <= slope && slope <= TR) { // TL <= slope <= TR
				if (endPoint.x >= clippingWindow.topRight.x) { // intersects with TOP and RIGHT border of the clipping window
					var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top'),
					    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top'),
					    x2 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'right'),
					    y2 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'right');

					if (isTransformed)
						return {
							start : {
								x : x1,
								y : y1
							},
							end   : {
								x : x2,
								y : y2
							}
						};
					else
						drawLine(x1, y1, x2, y2, '#f00');
				}
				else { // intersects with ONLY TOP border of the clipping window
					var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top'),
					    y1 = Intersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top');

					if (isTransformed)
						return {
							start : {
								x : x1,
								y : y1
							},
							end   : {
								x : endPoint.x,
								y : endPoint.y
							}
						};
					else
						drawLine(x1, y1, endPoint.x, endPoint.y, '#f00');
				}
			}
		}
		else { // 2nd case where BR > TL
			if (BL <= slope && slope < TL) { // BL <= slope < TL
				if (endPoint.y <= clippingWindow.bottomLeft.y) { // intersects with LEFT and BOTTOM border of the clipping window
					var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
					    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
					    x2 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'bottom'),
					    y2 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'bottom');

					if (isTransformed)
						return {
							start : {
								x : x1,
								y : y1
							},
							end   : {
								x : x2,
								y : y2
							}
						};
					else
						drawLine(x1, y1, x2, y2, '#f00');
				}
				else { // intersects with ONLY LEFT border of the clipping window
					var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left'),
					    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'left');

					if (isTransformed)
						return {
							start : {
								x : x1,
								y : y1
							},
							end   : {
								x : endPoint.x,
								y : endPoint.y
							}
						};
					else
						drawLine(x1, y1, endPoint.x, endPoint.y, '#f00');
				}
			}
			else if (TL <= slope && slope < BR) { // TL <= slope < BR
				if (endPoint.y <= clippingWindow.bottomLeft.y) { // intersects with TOP and BOTTOM border of the clipping window
					var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top'),
					    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top'),
					    x2 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'bottom'),
					    y2 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'bottom');

					if (isTransformed)
						return {
							start : {
								x : x1,
								y : y1
							},
							end   : {
								x : x2,
								y : y2
							}
						};
					else
						drawLine(x1, y1, x2, y2, '#f00');
				}
				else { // intersects with ONLY TOP border of the clipping window
					var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top'),
					    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top');

					if (isTransformed)
						return {
							start : {
								x : x1,
								y : y1
							},
							end   : {
								x : endPoint.x,
								y : endPoint.y
							}
						};
					else
						drawLine(x1, y1, endPoint.x, endPoint.y, '#f00');
				}
			}
			else if (BR <= slope && slope <= TR) { // BR <= slope <= TR
				if (endPoint.x >= clippingWindow.topRight.x) { // intersects with TOP and RIGHT border of the clipping window
					var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top'),
					    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top'),
					    x2 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'right'),
					    y2 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'right');

					if (isTransformed)
						return {
							start : {
								x : x1,
								y : y1
							},
							end   : {
								x : x2,
								y : y2
							}
						};
					else
						drawLine(x1, y1, x2, y2, '#f00');
				}
				else { // intersects with ONLY TOP border of the clipping window
					var x1 = xIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top'),
					    y1 = yIntersection(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 'top');

					if (isTransformed)
						return {
							start : {
								x : x1,
								y : y1
							},
							end   : {
								x : endPoint.x,
								y : endPoint.y
							}
						};
					else
						drawLine(x1, y1, endPoint.x, endPoint.y, '#f00');
				}
			}
		}
	}
	else {
		transformAll(startPointAreaCode, startPoint, endPoint);
		isTransformed = true;
		var clippedLine = clip(startPoint, endPoint);
		transformClippedLine(startPointAreaCode, clippedLine.start, clippedLine.end);
		drawLine(clippedLine.start.x, clippedLine.start.y, clippedLine.end.x, clippedLine.end.y, '#f00');
		transformAll(startPointAreaCode, startPoint, endPoint);
		isTransformed = false;
	}
}

canvas = $('#canvas');
context.transform(1, 0, 0, -1, 0, canvasHeight);
var mode        = 'line',
    inProcess   = false,
    dotCounter  = 0,
    lineCounter = 0,
    list = $('ul.collection.with-header'),
    tempX, tempY;

$(document).ready(function () {
	$('h1').remove();
	list.css('height', canvasHeight);
	canvas.on('mousemove', function (event) {
		var x = event.offsetX;
		var y = canvasHeight - event.offsetY;
		if (inProcess) {
			refreshCanvas(0);
			if (mode === 'line')
				drawLine(tempX, tempY, x, y);
			else if (mode === 'clip') {
				var x1 = tempX, // just VERY TEMPORARY variable to draw the clipping window
				    y1 = tempY,
				    x2 = x,
				    y2 = y;
				if (x1 > x2) { // swap
					var temp = x1;
					x1 = x2;
					x2 = temp;
				}
				if (tempY > y) { // swap
					var temp = y1;
					y1 = y2;
					y2 = temp;
				}
				context.beginPath();
				context.rect(tempX, tempY, x - tempX, y - tempY);
				// set line color
				context.strokeStyle = '#00f';
				context.stroke();
			}
		}
		$('#coordinate').text('(' + x + ', ' + y + ')');
	});
	canvas.on('mouseout', function () {
		$('#coordinate').text('(-, -)');
	});
	canvas.on('click', function (event) {
		var x    = event.offsetX,
		    y    = canvasHeight - event.offsetY;

		switch (mode) {
			case 'dot':
				if (clippingWindow === null)
					refreshCanvas(0);
				drawDot(x, y);
				addData(x, y);
				dotCounter++;
				list.html(list.html() + '<li class="collection-item"><div>Dot ' + dotCounter + ' (' + x + ', ' + y + ')' + '<span class="secondary-content" onclick="deleteData(' + x + ', ' + y + '); $(this).parent().parent().remove();"><i class="material-icons">delete</i></span></div></li>');
				break;
			case 'line':
				if (!inProcess) {
					if (clippingWindow === null)
						refreshCanvas(0);
					tempX = x;
					tempY = y;
					inProcess = true;
				}
				else {
					drawLine(tempX, tempY, x, y);
					addData(tempX, tempY, x, y);
					inProcess = false;
					lineCounter++;
					list.html(list.html() + '<li class="collection-item"><div>Line ' + lineCounter + ' (' + tempX + ', ' + tempY + ') to (' + x + ', ' + y + ')' + '<span class="secondary-content" onclick="deleteData(' + tempX + ', ' + tempY + ', ' + x + ', ' + y + '); $(this).parent().parent().remove();"><i class="material-icons">delete</i></span></div></li>');
				}
				break;
			case 'clip':
				if (!inProcess) {
					if (clippingWindow === null)
						refreshCanvas(0);
					tempX = x;
					tempY = y;
					inProcess = true;
				}
				else {
					if (tempX > x) { // swap
						var temp = tempX;
						tempX = x;
						x = temp;
					}
					if (tempY > y) { // swap
						var temp = tempY;
						tempY = y;
						y = temp;
					}
					initializeClippingWindow(tempX, tempY, x, y);
					inProcess = false;
					for (var i = 0; i < data.length; i++)
						if (data[i].type === 'dot')
							clip({
								     x : data[i].x,
								     y : data[i].y
							     });
						else {
							console.log(i, data[i]);
							clip(data[i].start, data[i].end);
						}
					clippingWindow = null;
				}
				break;
		}
	});
	$('#dotButton').on('click', function () {
		mode = 'dot';
	});
	$('#lineButton').on('click', function () {
		mode = 'line';
	});
	$('#clippingWindowButton').on('click', function () {
		mode = 'clip';
	});
	$('#refreshButton').on('click', function () {
		refreshCanvas();
	});
	$('#loadButton').on('change', function () {
		var file   = document.querySelector('#loadButton').files[0],
		    reader = new FileReader();
		reader.readAsText(file, 'application/json');
		reader.onload = function (e) {
			data = JSON.parse(e.target.result);
			refreshCanvas(0);
		};
	});
	$('#saveButton').on('click', function () {
		saveAs(new Blob([JSON.stringify(data)], { type : 'application/json;charset=utf-8' }), 'Nicholl Lee Nicholl.json');
	});
});
