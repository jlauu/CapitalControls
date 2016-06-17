var categories = {bonds : 0, equity: 1, credits : 2};
var svg, venn, data, year;

// all combinations of asset categories
var subsets = (function () {
    var set = [];
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
            for (var k = 0; k < 2; k++) {
                if (i == 0 && j == 0 && k == 0) continue;
                set.push({bonds : i, equity : j, credits : k});
            }
         }
    }
    return set;
})();

function update(y) {
    year = y;
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
    subsets.forEach(function (set) {
        var inBounds = makeInBounds(set, venn);
        if (inBounds(x, y)) {
            var textbox = d3.select("#infobox")
            var countries = data.filter(function (row) {
                return set.bonds == row.bonds &&
                       set.equity == row.equity &&
                       set.credits == row.credits;
            });
            var list = textbox.append("ul")
                        .attr("class", "country-text")
                        .attr("id", "countries");
            // Title
            list.append("li")
                .text("Year: " + year.toString())
                .attr("class", "country-text");
            var Assets = Object.keys(set)
                            .filter(function (k) {return set[k]});
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
           .attr("id", i)
           .attr("cx", circle.cx)
           .attr("cy", circle.cy)
           .attr("r", circle.r)
           .attr("stroke", "black")
           .style("fill", "none")
        i += 1;
    });
    update(1995);
}

function populate(data) {
    var dots = svg.selectAll(".dot").remove();
    if (!data) return;

    subsets.forEach(function (set) {
        var circles = Object.keys(set)
                .filter(function (k) {return set[k];})
                .map(function(k) {return venn.circles[categories[k]];});
        var midpoint = ['cx','cy']
                .map(function (property) {
                    return circles.map(function (c) {return c[property];})
                            .reduce(function (a,b) {return a + b;}) / circles.length;
                });
        var fdata = data.filter(function (row) {
            return row.equity == set.equity &&
                   row.bonds == set.bonds &&
                   row.credits == set.credits;
        });
        // Ring symbol
//        var n = fdata.length;
//        var apothem = .2 * venn.circles[0].r;
//        for (var i=0; i<n; i++) {
//            var dot_r = apothem * Math.tan(Math.PI / n);
//            svg.append("circle")
//               .attr("class", "dot")
//               .attr("cx", n==1 ? midpoint[0] : apothem*Math.cos(i*2*Math.PI/n) + midpoint[0])
//               .attr("cy", n==1 ? midpoint[1] : apothem*Math.sin(i*2*Math.PI/n) + midpoint[1])
//               .attr("r", n<3 ? n*.5 * apothem : dot_r/2)
//               .attr("stroke", "black")
//               .style("fill", getPointColor(set));
//        }
        // Number count
        svg.append("text")
           .attr("class", "dot")
           .attr("x", midpoint[0])
           .attr("y", midpoint[1])
           .attr("text-anchor", "middle")
           .text(fdata.length.toString());
    });
    /* Randomly drawing individual dots
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
    */
}

function getOpacity(rows, cmp) {
    var sum = rows.reduce(function (prev, curr) {
        return cmp(curr) ? prev + 1 : prev;
    });
    return sum / rows.length;
}

function getPointColor(row) {
    return d3.hsl(75 + 220 * ((row.bonds + row.equity + row.credits) / 3), .8, .5);
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
