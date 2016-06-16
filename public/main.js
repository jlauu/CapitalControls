var categories = {bonds : 0, equity: 1, credits : 2};
var svg, venn;

function init() {
    var width = 600,
        height = 600;
    svg = d3.select(".canvas").append("svg")
            .attr("width", width)
            .attr("height", height);
    venn = new VennDiagram (width/2, height/2, width/4, 3);

    var i = 0;
    venn.circles.forEach(function (circle) {
        svg.append("circle")
           .attr("class", "venn-circle")
           .attr("cx", circle.cx)
           .attr("cy", circle.cy)
           .attr("r", circle.r)
           .attr("stroke", "black")
           .style("fill", "none")
        i += 1;
    });
    update(data);
}

function update(data) {
    var dots = svg.selectAll(".dots").remove();
    data.forEach(function (row) {
        if (!(row.bonds || row.equity || row.credits)) return;
        var pt = randomPoint(makePlaceFunc(row, venn), makeInBounds(row, venn));
        svg.append("circle")
           .attr("class", "dot")
           .attr("cx", pt[0])
           .attr("cy", pt[1])
           .attr("r", 3)
           .style("fill", getPointColor(row));
    });
}

function getOpacity(rows, cmp) {
    var sum = rows.reduce(function (prev, curr) {
        return cmp(curr) ? prev + 1 : prev;
    });
    return sum / rows.length;
}

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
