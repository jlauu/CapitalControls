var http = require('http');
var d3 = require("d3");
var jsdom = require("jsdom");
var port = 8080;
var document = jsdom.jsdom();

var server = http.createServer(function (req, res) {
	var width = 960,
	    height = 500;
	var svg = d3.select(document.body).html('').append("svg")
		.attr("width", width)
		.attr("height", height);
	svg.append("circle")
	   .attr("cx", 350)
	   .attr("cy", 200)
	   .attr("r", 200)
	   .style("fill", "brown")
	   .style("fill-opacity", ".5");
	res.writeHead(200);
	res.end(document.documentElement.outerHTML);
});
server.listen(port, function() {
	console.log("Server listening on port " + port.toString());
});
