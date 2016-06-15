var http = require('http');
var d3 = require("d3");
var jsdom = require("jsdom");
var port = 8080;
var document = jsdom.jsdom();

var data = [{"country": "Angola", "equity": true, "bonds" : false, "credits" : false},
	    {"country": "Bermuda", "equity": false, "bonds" : false, "credits": true},
	    {"country": "China", "equity": true, "bonds" : true, "credits": true}]

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
	   .style("fill-opacity", getOpacity(data, r => r.equity));
	svg.append("circle")
	   .attr("cx", 550)
	   .attr("cy", 200)
	   .attr("r", 200)
	   .style("fill", "steelblue")
	   .style("fill-opacity", getOpacity(data, r => r.bonds));
	svg.append("circle")
	   .attr("cx", 450)
	   .attr("cy", 300)
	   .attr("r", 200)
	   .style("fill", "green")
	   .style("fill-opacity", getOpacity(data, r => r.credits));
	res.writeHead(200);
	res.end(document.documentElement.outerHTML);
});

function getOpacity(rows, cmp) {
	var sum = rows.reduce( (prev, curr) => cmp(curr) ? prev + 1 : prev, 0);
	return sum / rows.length;
}

server.listen(port, function() {
	console.log("Server listening on port " + port.toString());
});
