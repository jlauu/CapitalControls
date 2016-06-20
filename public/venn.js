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

VennDiagram.prototype.getIntersection = function (c1, c2) {
   var r = intersection(c1.cx, c1.cy, c1.r, c2.cx, c2.cy, c2.r);
   var d1 = Math.sqrt(Math.pow(r[0]-this.cx,2)+Math.pow(r[2]-this.cy,2));
   var d2 = Math.sqrt(Math.pow(r[1]-this.cx,2)+Math.pow(r[3]-this.cy,2));
   return d1 < d2 ? {'inner': [r[0],r[2]], 'outer':[r[1],r[3]]}
                  : {'inner': [r[1],r[3]], 'outer':[r[0],r[2]]};

}
