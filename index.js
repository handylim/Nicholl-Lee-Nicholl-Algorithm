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
				drawDot(x, y);
				addData(x, y);
				dotCounter++;
				list.html(list.html() + '<li class="collection-item"><div>Dot ' + dotCounter + ' (' + x + ', ' + y + ')' + '<span class="secondary-content" onclick="deleteData(' + x + ', ' + y + '); $(this).parent().parent().remove();"><i class="material-icons">delete</i></span></div></li>');
				break;
			case 'line':
				if (!inProcess) {
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
		}
	});
	$('#dotButton').on('click', function () {
		mode = 'dot';
	});
	$('#lineButton').on('click', function () {
		mode = 'line';
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
