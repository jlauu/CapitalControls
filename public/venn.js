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
