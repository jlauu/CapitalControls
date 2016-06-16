var http = require('http');
var d3 = require("d3");
var jsdom = require("jsdom");
var port = 8080;
var document = jsdom.jsdom();
var pg = require('pg');
var pgConString = "postgres://peter:peter@localhost:5432/capitalcontrols"
var data = [{"country": "Angola", "equity": true, "bonds" : false, "credits" : false},
            {"country": "Bermuda", "equity": false, "bonds" : false, "credits": true},
            {"country": "China", "equity": false, "bonds" : true, "credits": false}]

function Circle (cx, cy, r) {
    this.cx = cx;
    this.cy = cy;
    this.r = r;
}

Circle.prototype.inBounds = function (x,y) {
    return (Math.pow(x - this.cx, 2) + Math.pow(y - this.cy, 2)) < this.r * this.r;
}

// Origin at (cx, cy) with n circles of radius r
function VennDiagram (cx, cy, r, n) {
    this.cx = cx;
    this.cy = cy;
    this.theta = (2 *Math.PI)/n;
    this.circles = [];
    for (var i=0; i<n; i++) {
        var ccx = Math.cos(this.theta * i + (3*Math.PI/2)) * r * .8 + cx;
        var ccy = Math.sin(this.theta * i + (3*Math.PI/2)) * r * .8 + cy;
        this.circles.push(new Circle(ccx, ccy, r));
    }
}

function getYear(y) {
    return "SELECT country, year, " +
            "(rtob(mm) OR rtob(bo)) as bonds, " +
               "(rtob(ci) OR rtob(eq)) as equity, " +
           "(rtob(fc) OR rtob(cc)) as credits " +
           "FROM yearly WHERE year = " + y.toString() + ";";
}

pg.connect(pgConString, function(err, client, done) {
    if (err) {
        done();
        return console.error('pg error');
    }
    client.query(getYear(2013), function(err, result) {
        done();
        if (err) {
            console.log('failed query');
            return data;
        }
        data = result.rows;
    });
});

var categories = {bonds : 0, equity: 1, credits : 2};

function getPointColor(row) {
    return d3.hsl(360 * ((row.bonds + row.equity + row.credits) / 3), .8, .5);
}

function makeInBounds(row, venn) {
    var f = function(x, y) {
        return !(row.bonds ^ venn.circles[categories.bonds].inBounds(x, y)) &&
               !(row.equity ^ venn.circles[categories.equity].inBounds(x, y)) &&
               !(row.credits ^ venn.circles[categories.credits].inBounds(x, y));
    };
    return f;
}

function makePlaceFunc(row, venn) {
    var category;
    if (row.bonds) {
        category = categories.bonds;
    } else if (row.equity) {
        category = categories.equity;
    } else if (row.credits) {
        category = categories.credits;
    } else {
        console.log("no cats");
    }
    var circle = venn.circles[category];
    var f = function() {
        return [Math.random() * circle.r * Math.cos(Math.random() * Math.PI * 2) + circle.cx,
                Math.random() * circle.r * Math.sin(Math.random() * Math.PI * 2) + circle.cy];
    };
    return f;
}

function randomPoint(placeFunc, boundsFunc) {
    var pt = placeFunc();
    while (!boundsFunc(pt[0],pt[1])) {
        pt = placeFunc();
    }
    return pt;
}

var server = http.createServer(function (req, res) {
    var width = 600,
        height = 600;
    var svg = d3.select(document.body).html('').append("svg")
        .attr("width", width)
        .attr("height", height);
    var venn = new VennDiagram (width/2, height/2, width/4, 3);
//    var colors = ["brown", "steelblue", "green"];
//    var opacity = ['equity','bonds','credits'];
    var i = 0;
    venn.circles.forEach(function (circle) {
        svg.append("circle")
           .attr("cx", circle.cx)
           .attr("cy", circle.cy)
           .attr("r", circle.r)
           .attr("stroke", "black")
           .style("fill", "none")
//              .style("fill-opacity", getOpacity(data, r => r[opacity[i]]));
        i += 1;
    });
    data.forEach(function (row) {
        if (!(row.bonds || row.equity || row.credits)) return;
        var pt = randomPoint(makePlaceFunc(row, venn), makeInBounds(row, venn));
        svg.append("circle")
           .attr("cx", pt[0])
           .attr("cy", pt[1])
           .attr("r", 3)
           .style("fill", getPointColor(row));
    });
    
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
