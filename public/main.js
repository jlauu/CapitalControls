var categories = {bonds : 0, equity: 1, credits : 2};
var svg, venn, data, year, cluster, inc, peg, title;

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

function update(c, params) {
    cluster = c;
    year = params.year;
    inc = params.inc;
    peg = params.peg;
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            data = JSON.parse(xhr.responseText);
            populate(data);
        }
    }
    var msg = "/data?cluster="+ c.toString();
    if (params.inc) {
        msg += '&income=' + params.inc;
    } else if (params.peg) {
        msg += '&peg=' + params.peg;
    
    } 
    
    if (params.year) {
        msg += '&yearMin=' + year[0] + '&yearMax=' + year[1];
    }
    xhr.open("GET", msg, true);
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
                .text(title + ' (' + cluster + ') ' + year[0] + '-' + year[1])
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
            var li = {};
            countries.forEach(function(row) {
                if (li[row.country]) {
                    li[row.country].push(row.year);
                } else {
                    li[row.country] = [row.year];
                }
            });
            for (var c in li) {
                list.append('li')
                    .text(c + ' (' + li[c].join(', ') + ') ')
                    .attr('class', 'country-text')
            }
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
    d3.select('#slider')
     .call(d3.slider()
           .axis(true)
           .min(1995)
           .max(2013)
           .step(1)
           .value([1995,2013])
           .on("slide", function(evt, value) {
                year = value;
                update(cluster, {'year':year,'inc':inc,'peg':peg});
            }));    
    drawVennDiagram();
    d3.selectAll("#cluster-list li span").on("click", function() {
        update(this.innerHTML, {'year' : year, 'inc' : inc, 'peg' : peg});
        d3.select("#cluster-list .selected").attr("class","");
        this.className = "selected";
    });
    d3.selectAll("#income-list li span").on("click", function() {
        inc = (this.innerHTML == "all") ? null : this.innerHTML;
        update(cluster, {'year' : year, 'inc' : inc, 'peg' : null});
        d3.select("#income-list .selected").attr("class","");
        d3.select("#peg-list .selected").attr("class","");
        this.className = "selected";
        title = inc ? inc : 'All';
    });
    d3.selectAll("#peg-list li span").on("click", function() {
        if (this.innerHTML == "peg") {
            peg = "true";
        } else if (this.innerHTML == "no peg") {
            peg = "false";
        } else {
            peg = null;
        }
        update(cluster, {'year' : year, 'inc' : null, 'peg' : peg});
        d3.select("#peg-list .selected").attr("class","");
        d3.select("#income-list .selected").attr("class","");
        this.className = "selected";
        title = peg ? 'Peg' : 'Free Float';
    });
    document.addEventListener('keydown', function(e) {
        var key = e.key;
        if (key != 'i') return;
        var menus = d3.select("#interface");
        menus.attr("class", menus.attr("class") != "hidden" ? "hidden" : "");
    });
    title = 'low';
    update("kmeans", {year : ['1993','2013']});
}

function drawVennDiagram() {
    var i = 0;
    subsets.forEach(function (set) {
        var inclusive = Object.keys(set)
                .filter(function (k) {return set[k];})
                .map(function(k) {return venn.circles[categories[k]];});
        var exclusive = Object.keys(set)
                .filter(function (k) {return !set[k];})
                .map(function(k) {return venn.circles[categories[k]];});

        var path, start, end, b_sweep, intersections;
        var r = venn.circles[0].r;
        var theta = 0;
        if (inclusive.length == 1) {
            // outer, outer, inner
            intersections = exclusive.map(function (c) {
                return venn.getIntersection(c, inclusive[0]).outer;
            });
            intersections.push(venn.getIntersection(exclusive[0], exclusive[1]).inner);
            // Outer arc
            start = intersections[0];
            end = intersections[1];
            b_sweep = i == 1 ? 1 : 0; // HARDCODED
            path = ["M",start[0],start[1],
                    "A",r,r,theta,1,b_sweep,end[0],end[1]];
            // Inner Arcs
            end = intersections[2];
            b_sweep = i == 1 ? 0 : 1; //HARDCODED
            path = path.concat(["A",r,r,theta,0,b_sweep,end[0],end[1],
                                "A",r,r,theta,0,b_sweep,start[0],start[1]]);
        } else if (inclusive.length == 2) {
            // inner, inner, outer
            intersections = inclusive.map(function (c) {
                return venn.getIntersection(c, exclusive[0]).inner;
            });
            intersections.push(venn.getIntersection(inclusive[0], inclusive[1]).outer);
            // Small arc
            start = intersections[0];
            end = intersections[1];
            b_sweep = i == 4 ? 1 : 0;
            path = ["M",start[0],start[1],
                    "A",r,r,theta,0,b_sweep,end[0],end[1]];
            // Large arcs
            end = intersections[2];
            b_sweep = i == 4 ? 0 : 1;
            path = path.concat(["A",r,r,theta,0,b_sweep,end[0],end[1],
                                "A",r,r,theta,0,b_sweep,start[0],start[1]]);
        } else {
            intersections = [[0,1],[1,2],[0,2]].map(function (c) {
                return venn.getIntersection(inclusive[c[0]], inclusive[c[1]]).inner;
            });
            start = intersections[0];
            end = intersections[1];
            path = ["M",start[0],start[1],
                    "A",r,r,theta,0,1,end[0],end[1]];
            end = intersections[2];
            path = path.concat(["A",r,r,theta,0,1,end[0],end[1],
                                "A",r,r,theta,0,1,start[0],start[1]]);
        }
        svg.append("path")
           .attr("class", "venn-subset")
           .attr("id", "p"+i)
           .attr("d", path.join(" ") + " Z")
           .attr("stroke", "none")
           .attr("fill", "none");
        i++;
    });

    var i = 0;
    venn.circles.forEach(function (circle) {
        svg.append("circle")
           .attr("class", "venn-circle")
           .attr("id", "c"+i)
           .attr("cx", circle.cx)
           .attr("cy", circle.cy)
           .attr("r", circle.r)
           .attr("stroke", "black")
           .style("fill", "none")
        i += 1;
    });
}

function populate(data) {
    var dots = svg.selectAll(".dot").remove();
    if (!data) return;
    var i = 0;
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
        d3.select("path#p"+i)
          .style("fill", d3.hsl(20 + i * (360/subsets.length), 1, .5))
          .style("fill-opacity", fdata.length / data.length);
        // Number count
        svg.append("text")
           .attr("class", "dot")
           .attr("x", midpoint[0])
           .attr("y", midpoint[1])
           .attr("text-anchor", "middle")
           .text(fdata.length.toString());
           i++;
    });
}

function getOpacity(rows, cmp) {
    var sum = rows.reduce(function (prev, curr) {
        return cmp(curr) ? prev + 1 : prev;
    });
    return sum / rows.length;
}

function getPointColor(row) {
    return d3.hsl(200+ 120 * ((row.bonds + row.equity + row.credits) / 3), 1, .5);
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
