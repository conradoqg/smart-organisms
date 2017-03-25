p5.Vector.prototype.rotateOnOrigin = function (origin, angle) {
    if (this.p5) {
        if (this.p5._angleMode === this.p5.DEGREES) {
            angle = this.p5.polarGeometry.degreesToRadians(angle);
        }
    }
    var newX = Math.cos(angle) * (this.x - origin.x) - Math.sin(angle) * (this.y - origin.y) + origin.x;
    var newY = Math.sin(angle) * (this.x - origin.x) + Math.cos(angle) * (this.y - origin.y) + origin.y;
    this.x = newX;
    this.y = newY;
    return this;
};

p5.prototype.getCoorsFromRect = function (x, y, w, h, mode, angle) {    
    var adjustedMode = modeAdjust(x, y, w, h, mode);

    var coors = [
        p5i.createVector(adjustedMode.x, adjustedMode.y),
        p5i.createVector(adjustedMode.x, adjustedMode.y + adjustedMode.h),
        p5i.createVector(adjustedMode.x + adjustedMode.w, adjustedMode.y + adjustedMode.h),
        p5i.createVector(adjustedMode.x + adjustedMode.w, adjustedMode.y),
    ];

    if (angle != null) {
        let midV = p5i.createVector(coors[0].x + ((coors[2].x - coors[0].x) / 2), coors[0].y + ((coors[2].y - coors[0].y) / 2));
        for (var index = 0; index < coors.length; index++) {
            coors[index] = coors[index].rotateOnOrigin(midV, angle);
        }
    }

    return coors;
};

function modeAdjust(a, b, c, d, mode) {
    if (mode === p5i.CORNER) {
        return { x: a, y: b, w: c, h: d };
    } else if (mode === p5i.CORNERS) {
        return { x: a, y: b, w: c - a, h: d - b };
    } else if (mode === p5i.RADIUS) {
        return { x: a - c, y: b - d, w: 2 * c, h: 2 * d };
    } else if (mode === p5i.CENTER) {
        return { x: a - c * 0.5, y: b - d * 0.5, w: c, h: d };
    }
}