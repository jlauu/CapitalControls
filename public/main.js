var categories = {bonds : 0, equity: 1, credits : 2};
var svg, venn, data;

// all combinations of asset categories
var flags = (function () {
    var flags = [];
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
            for (var k = 0; k < 2; k++) {
                if (i == 0 && j == 0 && k == 0) continue;
                flags.push({bonds : i, equity : j, credits : k});
            }
         }
    }
    return flags;
})();

function update(year) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            data = JSON.parse(xhr.responseText);
            populate(data);
        }
    }

    xhr.open("GET", "http://localhost:8080/data?year=" + year.toString(), true);
    xhr.send();
}

function updateTextBox(x, y) { 
    d3.selectAll(".country-text").remove();
    flags.forEach(function (flag) {
        var inBounds = makeInBounds(flag, venn);
        if (inBounds(x, y)) {
            var textbox = d3.select("#infobox")
            var countries = data.filter(function (row) {
                return flags.bonds == row.bonds &&
                       flags.equity == row.equity &&
                       flags.credits == row.credits;
            });
            var list = textbox.append("ul")
                        .attr("class", "country-text")
                        .attr("id", "countries");
            // Title
            var Assets = Object.keys(flags)
                            .filter(function (k) {return flags[k]});
            list.append("li")
                .text("Assets: " + Assets)
                .attr("class", "country-text");
            // Number of results
            list.append("li")
                .text(countries.length > 0 ?
                      "Total: " + countries.length.toString() :
                      "Total: None")
                .attr("class", "country-text");
            // Print each country
            countries.forEach(function(row) {
                list.append("li")
                    .text(row.country + " ")
                    .attr("class", "country-text");
            });
        }
    });
}


function init() {
    var width = 600,
        height = 600;
    svg = d3.select(".canvas").append("svg")
            .attr("width", width)
            .attr("height", height)
            .on("mousemove", function() {
                var m = d3.mouse(this);
                updateTextBox(m[0], m[1]);
            });
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
    update(2013);
}

function populate(data) {
    var dots = svg.selectAll(".dot").remove();
    if (!data) return;
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
