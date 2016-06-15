var http = require('http');
var d3 = require("d3");
var jsdom = require("jsdom");
var port = 8080;
var document = jsdom.jsdom();

var server = http.createServer(function (req, res) {
	var vis = d3.select(document.body).html('').append('svg')
		.attr('width', 500)
		.attr('height', 500);
	res.writeHead(200);
	res.end(document.body.html);
});
server.listen(port, function() {
	console.log("Server listening on port " + port.toString());
});
