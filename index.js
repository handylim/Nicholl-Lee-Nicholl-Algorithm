var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var canvasHeight = canvas.height;
var canvasWidth = canvas.width;

canvas = $('#canvas');
context.transform(1, 0, 0, -1, 0, canvasHeight);
var list = $('ul.collection.with-header');

$(document).ready(function () {
	$('h1').remove();
	list.css('height', canvasHeight);
});
