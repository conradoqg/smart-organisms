/**
 * Smart rockets.
 * 
 * based on the work of Daniel Shiffman: http://codingtra.in
 *  
 */
const World = require('./world.js');
const canvasID = 'canvas';

const word = new World(canvasID);

p5.disableFriendlyErrors = true;

new p5((p5iinstance) => {
    p5iinstance.setup = word.setup.bind(word);
    window.p5i = p5iinstance;
}, canvasID);