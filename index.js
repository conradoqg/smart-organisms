/**
 * Smart organisms.
 * 
 * based on the work of Daniel Shiffman: http://codingtra.in
 *  
 */

require('./plugins/*.js', { mode: 'expand' });

const World = require('./world.js');
const word = new World();

p5.disableFriendlyErrors = true;

if (uQuery('debug') != null) {
    window.isDebuging = true;
}

new p5((p5iinstance) => {
    p5iinstance.setup = word.setup.bind(word);
    window.p5i = p5iinstance;
}, 'canvas');