/**
 * Smart organisms.
 * 
 * based on the work of Daniel Shiffman: http://codingtra.in
 *  
 */

require('./plugins/*.js', { mode: 'expand' });

p5.disableFriendlyErrors = true;
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

const World = require('./world.js');
const word = new World();

if (uQuery('debug') != null) {
    window.isDebuging = true;
}

new p5((p5iinstance) => {
    p5iinstance.setup = word.setup.bind(word);
    window.p5i = p5iinstance;
}, 'canvas');