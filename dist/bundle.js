(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const AVERAGESIZE = {
    WIDTH: 25,
    HEIGHT: 5
};

class DNA {
    constructor(movementGenesAmount) {
        let porpotion = p5i.random(0.50, 1.50);
        this.genes = {
            movement: [],
            size: {
                width: AVERAGESIZE.WIDTH * porpotion,
                height: AVERAGESIZE.HEIGHT * porpotion,
            },
            maxForce: p5i.random(0.1, 0.3)
        };
        for (let i = 0; i < movementGenesAmount; i++) {
            this.genes.movement[i] = this.createNewMovementGene();
        }
    }

    crossover(partner) {
        const newDNA = new DNA(this.genes.movement.length);
        newDNA.genes.movement = this.crossoverMovement(partner);
        newDNA.genes.size = this.crossoverSize(partner);
        newDNA.genes.maxForce = this.crossoverMaxForce(partner);        
        return newDNA;
    }

    crossoverMovement(partner) {
        // Selects a random midpoint position and cross the dna genes from that midpoint
        let newMovementGenes = [];
        let mid = p5i.floor(p5i.random(this.genes.movement.length));
        for (let i = 0; i < this.genes.movement.length; i++) {
            // Set the gene from itself or form its partner depending on the midpoint.
            if (i > mid) {
                newMovementGenes[i] = this.genes.movement[i];
            } else {
                newMovementGenes[i] = partner.genes.movement[i];
            }

            // Mutate the gene which will bring diversity to the organism. 0.01 mutation chance
            if (p5i.random(1) < 0.01) {
                newMovementGenes[i] = this.createNewMovementGene();
            }
        }
        return newMovementGenes;
    }

    crossoverSize(partner) {
        let newSizeGene = {};

        // New size will be somewhere between this DNA size and its partner with 0.01 size mutation
        newSizeGene.width = p5i.random(this.genes.size.width, partner.genes.size.width) * p5i.random(0.99, 1.01);
        newSizeGene.height = p5i.random(this.genes.size.height, partner.genes.size.height) * p5i.random(0.99, 1.01);

        return newSizeGene;
    }

    crossoverMaxForce(partner) {
        // New max force will be somewhere between this DNA max force and its partner with 0.01 max force mutation
        let newMaxForce = p5i.random(this.genes.maxForce + partner.genes.maxForce) * p5i.random(0.99, 1.01);
        return newMaxForce;
    }

    createNewMovementGene() {
        // Creates a new gene randomly
        let newMovementGene = p5i.createVector(p5i.random(-1, 1), p5i.random(-1, 1));
        newMovementGene.setMag(this.genes.maxForce);
        return newMovementGene;
    }

    getNextMove(tick) {
        return this.genes.movement[tick];
    }
}

module.exports = DNA;
},{}],2:[function(require,module,exports){
/**
 * Smart organisms.
 * 
 * based on the work of Daniel Shiffman: http://codingtra.in
 *  
 */

require('./plugins/aStarFitness.js');require('./plugins/weightedFitness.js');

p5.disableFriendlyErrors = true;

const World = require('./world.js');
const word = new World();

if (uQuery('debug') != null) {
    window.isDebuging = true;
}

new p5((p5iinstance) => {
    p5iinstance.setup = word.setup.bind(word);
    window.p5i = p5iinstance;
}, 'canvas');
},{"./plugins/aStarFitness.js":6,"./plugins/weightedFitness.js":7,"./world.js":9}],3:[function(require,module,exports){
function n(n){return n=n||Object.create(null),{on:function(t,o){(n[t]||(n[t]=[])).push(o)},off:function(t,o){var u=n[t]||(n[t]=[]);u.splice(u.indexOf(o)>>>0,1)},emit:function(t,o){(n[t]||[]).map(function(n){n(o)}),(n["*"]||[]).map(function(n){n(t,o)})}}}module.exports=n;

},{}],4:[function(require,module,exports){
const DNA = require('./dna.js');
const PluginManager = require('./pluginManager.js');
const Mitt = require('mitt');

class Organism {
    constructor(dnaOrGeneAmount, bornAt) {
        bornAt = (bornAt == null ? p5i.createVector(p5i.width / 2, p5i.height - 10) : bornAt);

        this.dna = (typeof (dnaOrGeneAmount) == 'number' ? new DNA(dnaOrGeneAmount) : dnaOrGeneAmount);

        this.object = {};
        this.object.type = 'rect';
        this.object.size = { width: this.dna.genes.size.width, height: this.dna.genes.size.height };
        this.object.pos = bornAt.sub(this.object.size.width / 2, this.object.size.height / 2);
        this.object.mode = p5i.CENTER;
        this.object.movement = {};
        this.object.movement.vel = p5i.createVector();
        this.object.movement.acc = p5i.createVector();
        this.object.movement.heading = this.object.movement.vel.heading();
        this.object.coors = p5i.getCoorsFromRect(this.object.pos.x, this.object.pos.y, this.object.size.width, this.object.size.height, this.object.mode);

        this.initialPos = this.object.pos.copy();
        this.completed = false;
        this.crashed = false;
        
        this.fitness = 0;
        this.lifeSpan = 0;
        this.emitter = new Mitt();
        PluginManager.registerEmitter('organism', this.emitter);
    }

    calcFitness(target) {
        this.emitter.emit('beforeCalcFitness', {
            organism: this, target: target, callback: (fitness) => {
                this.fitness = fitness;                
            }
        });

        // If fitness wasn't calculated by a plugin, fallback to the default distance fitness calculation.
        if (this.fitness == 0) {            
            let invertedDistance = Math.abs(p5i.width - this.distanceTo(target));

            if (this.completed) {
                this.fitness = invertedDistance *= 5;
            }
            if (this.crashed) {
                this.fitness = invertedDistance /= 5;
            }
        }
    }

    mate(partner) {
        const childDNA = this.dna.crossover(partner.dna);
        return new Organism(childDNA);
    }

    update(lifeSpanTimer) {
        if (!this.completed && !this.crashed) {
            this.lifeSpan = lifeSpanTimer;

            this.object.movement.acc.add(this.dna.getNextMove(lifeSpanTimer));
            this.object.movement.vel.add(this.object.movement.acc);
            this.object.pos.add(this.object.movement.vel);
            this.object.movement.acc.mult(0);
            this.object.movement.vel.limit(4);            
            this.object.movement.heading = this.object.movement.vel.heading();
            this.object.coors = p5i.getCoorsFromRect(this.object.pos.x, this.object.pos.y, this.object.size.width, this.object.size.height, this.object.mode, this.object.movement.heading);
        }
    }

    collidesCircle(target) {
        return p5i.collideCirclePoly(target.pos.x, target.pos.y, target.size.diameter, this.object.coors);
    }

    collidesRect(target, inside = false) {
        return p5i.collidePolyPoly(target.coors, this.object.coors, inside);
    }

    distanceTo(target) {
        return p5i.dist(this.object.pos.x, this.object.pos.y, target.pos.x, target.pos.y);
    }

    render() {
        p5i.push();
        p5i.noStroke();
        p5i.fill(255, 150);
        p5i.quad(this.object.coors[0].x, this.object.coors[0].y, this.object.coors[1].x, this.object.coors[1].y, this.object.coors[2].x, this.object.coors[2].y, this.object.coors[3].x, this.object.coors[3].y);
        p5i.pop();
    }
}

module.exports = Organism;
},{"./dna.js":1,"./pluginManager.js":5,"mitt":3}],5:[function(require,module,exports){
const Mitt = require('mitt');
let emitters = new Map();
let pluginEmitter = new Mitt();

class PluginManager {
    static getEmitter() {
        return pluginEmitter;
    }

    static registerEmitter(type, emitter) {
        emitters.set(type, emitter);
        emitter.on('*', (evt, ...args) => pluginEmitter.emit(type + '-' + evt, ...args));
    }

    static activate(pluginID) {
        pluginEmitter.emit('pluginManager' + '-' + 'activate', pluginID);
    }

    static deactivate(pluginID) {
        pluginEmitter.emit('pluginManager' + '-' + 'deactivate', pluginID);
    }
}

module.exports = PluginManager;
},{"mitt":3}],6:[function(require,module,exports){
let PluginManager = require('../pluginManager.js');
let emitter = PluginManager.getEmitter();

let cache = new Map();
let reducationRate = .50;
let calculatedPaths = null;

emitter.on('pluginManager-activate', (pluginID) => {
    if (pluginID == 'aStarFitness') {
        emitter.on('world-afterRender', onWorldAfterRender);
        emitter.on('world-reset', onReset);
        emitter.on('organism-beforeCalcFitness', onOrganismBeforeCalcFitness);
        emitter.on('population-afterAllFitnessCalculated', onAfterAllFitnessCalculated);
    }
});

emitter.on('pluginManager-deactivate', (pluginID) => {
    if (pluginID == 'aStarFitness') {
        emitter.off('world-afterRender', onWorldAfterRender);
        emitter.off('world-reset', onReset);
        emitter.off('organism-beforeCalcFitness', onOrganismBeforeCalcFitness);
        emitter.off('population-afterAllFitnessCalculated', onAfterAllFitnessCalculated);
    }
});

let onWorldAfterRender = () => {
    if (!cache.has('bitMap')) {
        // Create a map of the screen on the first execution setting up obstacles with 0 and paths with 1 based on the color of the screen pixel
        let bitMap = [];
        let wallColor = p5i.color(255);
        p5i.loadPixels();
        for (var x = 0; x < p5i.width; x++) {
            let row = Array(p5i.height);
            for (var y = 0; y < p5i.height; y++) {
                var index = (x + y * p5i.width) * 4;
                if (wallColor.levels[0] == p5i.pixels[index] &&
                    wallColor.levels[1] == p5i.pixels[index + 1] &&
                    wallColor.levels[2] == p5i.pixels[index + 2] &&
                    wallColor.levels[3] == p5i.pixels[index + 3]) {
                    row[y] = 0;
                } else {
                    row[y] = 1;
                }
            }
            bitMap.push(row);
        }

        cache.set('bitMap', resize2DArray(bitMap));
    }
};

let onReset = () => {
    cache.delete('bitMap');
};

let onOrganismBeforeCalcFitness = (event) => {
    event.callback(calcFitness(event.organism, event.target));
};

function resize2DArray(arrayToReduce) {
    var xResolution = arrayToReduce.length * reducationRate;
    var xLenghtReduction = arrayToReduce.length / xResolution;
    var reducedBitmap = Array(xLenghtReduction);
    for (var x = 0; x < arrayToReduce.length; x += xLenghtReduction) {
        var reductionRow = [];
        for (var xx = x; xx < x + xLenghtReduction; xx++) {
            var yResolution = arrayToReduce[x].length * reducationRate;
            var yLenghtReduction = arrayToReduce[x].length / yResolution;
            var row = [];
            for (var y = 0; y < arrayToReduce[x].length; y += yLenghtReduction) {
                var reductionSum = 0;
                for (var yy = y; yy < y + yLenghtReduction; yy++) {
                    reductionSum += arrayToReduce[x][yy];
                }
                row[y / yLenghtReduction] = Math.floor(reductionSum / yLenghtReduction);
            }
            reductionRow.push(row);
        }

        reducedBitmap[x / xLenghtReduction] = Array(xResolution).fill(0);
        for (var i = 0; i < reductionRow.length; i++) {
            for (var ii = 0; ii < reductionRow[i].length; ii++) {
                reducedBitmap[x / xLenghtReduction][ii] += reductionRow[i][ii];
            }
        }

        for (var i = 0; i < reductionRow.length; i++) {
            for (var ii = 0; ii < reductionRow[i].length; ii++) {
                reducedBitmap[x / xLenghtReduction][ii] = Math.floor(reducedBitmap[x / xLenghtReduction][ii] / reductionRow.length);
            }
            break;
        }
    }

    return reducedBitmap;
}

function calcFitness(organism, target) {
    if (!calculatedPaths) calculatedPaths = [];
    let distance = aStarDistance(organism.object.pos, target);
    let fitness = weightedResult(organism, target, distance);
    return fitness;
}

function weightedResult(organism, target, distance) {
    // Distance constants
    const maxDistance = Math.max(
        p5i.createVector(0, 0).dist(organism.initialPos),
        p5i.createVector(0, p5i.height).dist(organism.initialPos),
        p5i.createVector(p5i.width, 0).dist(organism.initialPos),
        p5i.createVector(p5i.width, p5i.height).dist(organism.initialPos)
    );
    const minDistance = 0;
    distance = (distance == null ? maxDistance : distance);

    // Lifespane constants
    const minLifespan = 0;
    const maxLifespan = organism.dna.genes.movement.length;
    let lifeSpan = organism.lifeSpan;

    // Weights
    const distanceWeight = 10;
    const lifeSpaneWeight = 5;

    // Calculates fitness generating a number between the min and max
    let distanceFitness = (100 - p5i.map(distance, minDistance, maxDistance, 0, 100));
    let lifeSpanFitness = p5i.map(lifeSpan, minLifespan, maxLifespan, 0, 100);

    // Apply weights to the calculated fitness
    let result = (distanceFitness * distanceWeight) + (lifeSpanFitness * lifeSpaneWeight);

    // Apply extra weight when the organism hits the goal
    if (organism.completed) result *= 5;

    return result;
}

function aStarDistance(object, target) {

    let bitMap = cache.get('bitMap');

    // Calculate resolution and length of the reduced bitMap
    let xResolution = bitMap.length * reducationRate;
    let xLenghtReduction = bitMap.length / xResolution;

    // Limits X and Y for both object according the size of the reduced bitmap
    let objectX = Math.min(Math.max(Math.round(object.x / xLenghtReduction), 0), bitMap[0].length - 1);
    let objectY = Math.min(Math.max(Math.round(object.y / xLenghtReduction), 0), bitMap.length - 1);

    let targetX = Math.min(Math.max(Math.round(target.pos.x / xLenghtReduction), 0), bitMap[0].length - 1);
    let targetY = Math.min(Math.max(Math.round(target.pos.y / xLenghtReduction), 0), bitMap.length - 1);        

    // Try to hit cache for given object and target coordinates
    let hash = '' + objectX + objectY + targetX + targetY + '';
    if (!cache.has('distances')) {
        cache.set('distances', new Map());
    } else {
        if (cache.get('distances').has(hash)) {
            return cache.get('distances').get(hash);
        }
    }    

    // Cache graph, unfortunately it's not possible to clone the graph data because there are functions inside it, would be better if the functionality were separeted from data
    let graph;
    if (!cache.has('graph')) {
        graph = new Graph(bitMap);
        cache.set('graph', graph);
    } else {
        graph = cache.get('graph');
        graph.init();
        graph.cleanDirty();
    }    

    // Setup the start and end points;
    let start = graph.grid[objectX][objectY];
    let end = graph.grid[targetX][targetY];

    // If the start point is a wall, find the nearest nonwall node
    if (start.isWall()) {
        let findClosestNonwall = (nodes) => {
            let nodeFound = null;
            for (let i = 0; i < nodes.length; i++) {
                if (!nodes[i].isWall()) {
                    nodeFound = nodes[i];
                }
            }

            if (!nodeFound) {
                let neighbors = [];
                for (let i = 0; i < nodes.length; i++) {
                    neighbors = neighbors.concat(graph.neighbors(nodes[i]));
                }
                return findClosestNonwall(neighbors);
            }

            return nodeFound;
        };
        start = findClosestNonwall(graph.neighbors(start));
    }

    // Do a A* search from the starting point to the target point
    var result = astar.search(graph, start, end, { closest: true });

    calculatedPaths.push(result);

    let distance = (result.length == 0 ? null : result.length);

    // Update distances cache
    cache.get('distances').set(hash, distance);

    return distance;
}

let onAfterAllFitnessCalculated = (population) => {
    if (window.isDebuging) {
        let bitMap = cache.get('bitMap');
        p5i.push();
        p5i.stroke('yellow');
        var xResolution = bitMap.length * reducationRate;
        var xLenghtReduction = bitMap.length / xResolution;
        for (var i = 0; i < calculatedPaths.length; i++) {
            var path = calculatedPaths[i];
            for (var n = 1; n < path.length; n++) {
                p5i.line(path[n - 1].x * xLenghtReduction, path[n - 1].y * xLenghtReduction, path[n].x * xLenghtReduction, path[n].y * xLenghtReduction);
            }
        }

        p5i.fill(255);
        for (var index = 0; index < population.organisms.length; index++) {
            var organism = population.organisms[index];
            p5i.textSize(12);
            p5i.text(organism.fitness.toFixed(3), organism.object.pos.x, organism.object.pos.y);
        }
        p5i.pop();
    }
    calculatedPaths = null;
};
},{"../pluginManager.js":5}],7:[function(require,module,exports){
let PluginManager = require('../pluginManager.js');
let emitter = PluginManager.getEmitter();

let calculatedPaths = null;

emitter.on('pluginManager-activate', (pluginID) => {
    if (pluginID == 'weightedFitness') {
        emitter.on('organism-beforeCalcFitness', onOrganismBeforeCalcFitness);
        emitter.on('population-afterAllFitnessCalculated', onAfterAllFitnessCalculated);
    }
});

emitter.on('pluginManager-deactivate', (pluginID) => {
    if (pluginID == 'weightedFitness') {
        emitter.off('organism-beforeCalcFitness', onOrganismBeforeCalcFitness);
        emitter.off('population-afterAllFitnessCalculated', onAfterAllFitnessCalculated);
    }
});

let onOrganismBeforeCalcFitness = (event) => {
    event.callback(calcFitness(event.organism, event.target));
};

let calcFitness = (organism, target) => {
    if (!calculatedPaths) calculatedPaths = [];
    let distance = organism.distanceTo(target);
    let result = weightedResult(organism, target, distance);
    calculatedPaths.push({ organism, target });
    return result;
};

function weightedResult(organism, target, distance) {
    // Distance constants
    const maxDistance = Math.max(
        p5i.createVector(0, 0).dist(organism.initialPos),
        p5i.createVector(0, p5i.height).dist(organism.initialPos),
        p5i.createVector(p5i.width, 0).dist(organism.initialPos),
        p5i.createVector(p5i.width, p5i.height).dist(organism.initialPos)
    );
    const minDistance = 0;
    distance = (distance == null ? maxDistance : distance);

    // Lifespane constants
    const minLifespan = 0;
    const maxLifespan = organism.dna.genes.movement.length;
    let lifeSpan = organism.lifeSpan;

    // Weights
    const distanceWeight = 10;
    const lifeSpaneWeight = 5;

    // Calculates fitness generating a number between the min and max
    let distanceFitness = (100 - p5i.map(distance, minDistance, maxDistance, 0, 100));
    let lifeSpanFitness = p5i.map(lifeSpan, minLifespan, maxLifespan, 0, 100);

    // Apply weights to the calculated fitness
    let result = (distanceFitness * distanceWeight) + (lifeSpanFitness * lifeSpaneWeight);

    // Apply extra weight when the organism hits the goal
    if (organism.completed) result *= 5;

    return result;
}

let onAfterAllFitnessCalculated = (population) => {
    if (window.isDebuging) {
        p5i.push();
        p5i.stroke('yellow');
        for (var i = 0; i < calculatedPaths.length; i++) {
            var path = calculatedPaths[i];
            p5i.line(path.organism.object.pos.x, path.organism.object.pos.y, path.target.pos.x, path.target.pos.y);
        }
        p5i.pop();

        p5i.fill(255);
        for (var index = 0; index < population.organisms.length; index++) {
            var organism = population.organisms[index];
            p5i.textSize(12);
            p5i.text(organism.fitness.toFixed(3), organism.object.pos.x, organism.object.pos.y);
        }
        p5i.pop();
    }
    calculatedPaths = null;
};
},{"../pluginManager.js":5}],8:[function(require,module,exports){
const Organism = require('./organism.js');
const PluginManager = require('./pluginManager.js');
const Mitt = require('mitt');

class Population {
    constructor(geneAmount, popSize) {
        this.organisms = [];
        this.popSize = popSize;
        this.matingPool = [];

        for (let i = 0; i < this.popSize; i++) {
            this.organisms[i] = new Organism(geneAmount);
        }
        this.emitter = new Mitt();
        PluginManager.registerEmitter('population', this.emitter);
    }

    evaluate(target) {
        this.emitter.emit('beforeAllFitnessCalculated', this);

        let calcFitnessResults = this.organisms.map((organism) => {
            return new Promise((resolve) => {
                setImmediate(() => {                    
                    resolve(organism.calcFitness(target));
                });
            });
        });
        
        return Promise
            .all(calcFitnessResults)
            .then(() => {
                this.emitter.emit('afterAllFitnessCalculated', this);

                // Find max fitness
                let maxFit = 0;
                for (let i = 0; i < this.organisms.length; i++) {
                    maxFit = Math.max(this.organisms[i].fitness, maxFit);
                }

                // Map fitness between 0 and 1.        
                for (let i = 0; i < this.organisms.length; i++) {
                    this.organisms[i].fitness /= maxFit;
                }

                // Adds the organisms N times to mating pool according to its fitness proportional value. Multiplies N by 100 to give a minimum of 1 option for the lowest ranked organism
                this.matingPool = [];
                for (let i = 0; i < this.organisms.length; i++) {
                    let n = this.organisms[i].fitness * 100;
                    for (let j = 0; j < n; j++) {
                        this.matingPool.push(this.organisms[i]);
                    }
                }
            });
    }

    selection() {
        // Randomly choose two partners from mating pool and mate them
        let newOrganisms = [];
        for (let i = 0; i < this.organisms.length; i++) {
            const parentA = p5i.random(this.matingPool);
            const parentB = p5i.random(this.matingPool);
            const child = parentA.mate(parentB);
            newOrganisms[i] = child;
        }
        this.organisms = newOrganisms;
    }
}

module.exports = Population;
},{"./organism.js":4,"./pluginManager.js":5,"mitt":3}],9:[function(require,module,exports){
const Population = require('./population.js');
const PluginManager = require('./pluginManager.js');
const Mitt = require('mitt');

class World {
    constructor() {
        this.setInitialState();
        this.config = {
            width: 600,
            height: 600,
            FPS: 60,
            popSize: 100,
            lifeSpan: 1600,
            seed: 10,
            speed: 5
        };
        this.target = {
            x: this.config.width / 2,
            y: 50,
            diameter: 20
        };

        this.emitter = new Mitt();
        PluginManager.registerEmitter('world', this.emitter);
        PluginManager.activate('aStarFitness');
    }

    setup() {
        // Canvas
        p5i.createCanvas(this.config.width, this.config.height);
        p5i.pixelDensity(1);

        // p5 Initial State
        this.setP5InitialState();

        // Debug element
        let debugContainer = p5i.select('#debugContainer');
        debugContainer.style('width', this.config.width.toString() + 'px');
        debugContainer.style('height', this.config.height.toString() + 'px');

        this.debugDiv = p5i.select('#debug');

        let settingsContainer = p5i.select('#settingsContainer');
        settingsContainer.style('width', this.config.width.toString() + 'px');
        settingsContainer.style('height', this.config.height.toString() + 'px');

        this.settingsDiv = p5i.select('#settings');
        p5i.createElement('label', 'Seed: ').parent(this.settingsDiv);
        this.seedInput = p5i.createInput(this.config.seed);
        this.seedInput.size(30);
        this.seedInput.parent(this.settingsDiv);

        p5i.createElement('label', 'Pop Size: ').parent(this.settingsDiv);
        this.popSizeInput = p5i.createInput(this.config.popSize);
        this.popSizeInput.size(30);
        this.popSizeInput.parent(this.settingsDiv);

        p5i.createElement('label', 'Life Span: ').parent(this.settingsDiv);
        this.lifeSpanInput = p5i.createInput(this.config.lifeSpan);
        this.lifeSpanInput.size(30);
        this.lifeSpanInput.parent(this.settingsDiv);

        p5i.createElement('br').parent(this.settingsDiv);
        p5i.createElement('label', 'Speed: ').parent(this.settingsDiv);
        this.speedSlider = p5i.createSlider(0, 200, this.config.speed);
        this.speedSlider.style('width', '210px');
        this.speedSlider.parent(this.settingsDiv);
        this.speedSlider.mouseMoved(() => {
            this.config.speed = this.speedSlider.value();
        });

        let controlContainer = p5i.select('#controlContainer');
        controlContainer.style('width', this.config.width.toString() + 'px');
        controlContainer.style('height', this.config.height.toString() + 'px');

        this.controlDiv = p5i.select('#control');
        this.pauseUnpauseButton = p5i.createButton('||>');
        this.pauseUnpauseButton.parent(this.controlDiv);
        this.pauseUnpauseButton.mousePressed(() => {
            this.paused = !this.paused;
        });
        this.resetButton = p5i.createButton('reset');
        this.resetButton.parent(this.controlDiv);
        this.resetButton.mousePressed(this.reset.bind(this));

        p5i.createElement('br').parent(this.settingsDiv);

        p5i.createElement('label', 'Fitness Calculator: ').parent(this.settingsDiv);
        this.fitnessCalculatorSelect = p5i.createSelect();
        this.fitnessCalculatorSelect.option('A*');
        this.fitnessCalculatorSelect.option('Weighted');
        this.fitnessCalculatorSelect.option('Direct Distance');
        this.fitnessCalculatorSelect.changed(() => {
            let selected = this.fitnessCalculatorSelect.value();

            if (selected == 'A*') {
                PluginManager.deactivate('weightedFitness');
                PluginManager.activate('aStarFitness');
            } else if (selected == 'Weighted') {
                PluginManager.deactivate('aStarFitness');
                PluginManager.activate('weightedFitness');
            } else if (selected == 'Direct Distance') {
                PluginManager.deactivate('aStarFitness');
                PluginManager.deactivate('weightedFitness');
            }
        });
        this.fitnessCalculatorSelect.parent(this.settingsDiv);

        // p5        
        p5i.draw = this.render.bind(this);

        // Main update loop
        this.update();
    }

    setInitialState() {
        this.population = null;
        this.lifeSpanTimer = 0;
        this.generation = 1;
        this.paused = false;
        this.statistics = {};
    }

    setP5InitialState() {
        // Frame rate
        p5i.frameRate(this.config.FPS);

        // Seed random
        p5i.randomSeed(this.config.seed);

        this.population = new Population(this.config.lifeSpan, this.config.popSize);

        this.world = {};
        this.world.type = 'rect';
        this.world.size = { width: this.config.width, height: this.config.height };
        this.world.pos = p5i.createVector(0, 0);
        this.world.mode = p5i.CORNER;
        this.world.movement = {};
        this.world.movement.vel = p5i.createVector();
        this.world.movement.acc = p5i.createVector();
        this.world.movement.heading = null;
        this.world.coors = p5i.getCoorsFromRect(this.world.pos.x, this.world.pos.y, this.world.size.width, this.world.size.height, this.world.mode, this.world.movement.heading);

        this.target = {};
        this.target.type = 'ellipse';
        this.target.size = { diameter: 20 };
        this.target.pos = p5i.createVector(p5i.width / 2, 50);
        this.target.mode = p5i.CENTER;

        this.obstacle1 = {};
        this.obstacle1.type = 'rect';
        this.obstacle1.size = { width: 300, height: 10 };
        this.obstacle1.pos = p5i.createVector(p5i.width / 2, (p5i.height / 2) + (p5i.height / 4));
        this.obstacle1.mode = p5i.CENTER;
        this.obstacle1.movement = {};
        this.obstacle1.movement.vel = p5i.createVector();
        this.obstacle1.movement.acc = p5i.createVector();
        this.obstacle1.movement.heading = this.obstacle1.movement.vel.heading();
        this.obstacle1.coors = p5i.getCoorsFromRect(this.obstacle1.pos.x, this.obstacle1.pos.y, this.obstacle1.size.width, this.obstacle1.size.height, this.obstacle1.mode, this.obstacle1.movement.heading);

        this.obstacle2 = {};
        this.obstacle2.type = 'rect';
        this.obstacle2.size = { width: 150, height: 5 };
        this.obstacle2.pos = p5i.createVector((p5i.width / 2) / 2, (p5i.height / 3));
        this.obstacle2.mode = p5i.CENTER;
        this.obstacle2.movement = {};
        this.obstacle2.movement.vel = p5i.createVector();
        this.obstacle2.movement.acc = p5i.createVector();
        this.obstacle2.movement.heading = p5i.PI + p5i.QUARTER_PI;
        this.obstacle2.coors = p5i.getCoorsFromRect(this.obstacle2.pos.x, this.obstacle2.pos.y, this.obstacle2.size.width, this.obstacle2.size.height, this.obstacle2.mode, this.obstacle2.movement.heading);

        this.obstacle3 = {};
        this.obstacle3.type = 'rect';
        this.obstacle3.size = { width: 150, height: 5 };
        this.obstacle3.pos = p5i.createVector((p5i.width / 2) + (p5i.height / 4), (p5i.height / 3));
        this.obstacle3.mode = p5i.CENTER;
        this.obstacle3.movement = {};
        this.obstacle3.movement.vel = p5i.createVector();
        this.obstacle3.movement.acc = p5i.createVector();
        this.obstacle3.movement.heading = p5i.PI - p5i.QUARTER_PI;
        this.obstacle3.coors = p5i.getCoorsFromRect(this.obstacle3.pos.x, this.obstacle3.pos.y, this.obstacle3.size.width, this.obstacle3.size.height, this.obstacle3.mode, this.obstacle3.movement.heading);

        this.obstacles = [this.obstacle1, this.obstacle2, this.obstacle3];
    }

    reset() {
        this.config.seed = parseInt(this.seedInput.value());
        this.config.popSize = parseInt(this.popSizeInput.value());
        this.config.lifeSpan = parseInt(this.lifeSpanInput.value());
        this.setInitialState();
        this.setP5InitialState();
        this.emitter.emit('afterReset', this);
    }

    update() {
        Promise
            .resolve()
            .then(() => {
                if (!this.paused) {
                    if (this.population) {
                        this.lifeSpanTimer++;

                        // Statistics counters
                        let deaths = 0;
                        let hits = 0;
                        let lifeSpanSum = 0;
                        let distanceSum = 0;

                        // Update organisms
                        for (let i = 0; i < this.population.organisms.length; i++) {
                            let organism = this.population.organisms[i];
                            organism.update(this.lifeSpanTimer);

                            // Target
                            if (organism.collidesCircle(this.target)) {
                                organism.completed = true;
                                organism.lifeSpan = this.config.lifeSpan;
                            }

                            // Off-screen
                            if (organism.collidesRect(this.world)) {
                                organism.crashed = true;
                            }

                            // Obstacles
                            for (var index = 0; index < this.obstacles.length; index++) {
                                var obstacle = this.obstacles[index];
                                if (organism.collidesRect(obstacle)) {
                                    organism.crashed = true;
                                }
                            }

                            // Statistics
                            if (organism.crashed) deaths++;
                            if (organism.completed) hits++;

                            lifeSpanSum += organism.lifeSpan;
                            distanceSum += organism.distanceTo(this.target);
                            this.statistics.avgLifeSpans = lifeSpanSum / i;
                            this.statistics.avgDistance = distanceSum / i;
                        }

                        // Generates a new population if the generation run out of time
                        if (this.lifeSpanTimer == this.config.lifeSpan || (deaths + hits) == this.config.popSize) {
                            // Historic statistics
                            this.statistics.avgLifeSpansHist = (typeof (this.statistics.avgLifeSpansHist) != 'undefined' ? [...this.statistics.avgLifeSpansHist, this.statistics.avgLifeSpans.toFixed(2)] : [this.statistics.avgLifeSpans.toFixed(2)]);
                            this.statistics.avgDistanceHist = (typeof (this.statistics.avgDistanceHist) != 'undefined' ? [...this.statistics.avgDistanceHist, this.statistics.avgDistance.toFixed(2)] : [this.statistics.avgDistance.toFixed(2)]);
                            this.statistics.deathsHist = (typeof (this.statistics.deathsHist) != 'undefined' ? [...this.statistics.deathsHist, deaths] : [deaths]);
                            this.statistics.hitsHist = (typeof (this.statistics.hitsHist) != 'undefined' ? [...this.statistics.hitsHist, hits] : [hits]);

                            if (hits > 0 && typeof (this.statistics.firstHit) == 'undefined') this.statistics.firstHit = this.generation;
                            if (hits >= 50 && typeof (this.statistics.fiftiethHit) == 'undefined') this.statistics.fiftiethHit = this.generation;
                            if (typeof (this.statistics.maxHits) == 'undefined') {
                                this.statistics.maxHits = hits;
                            } else {
                                this.statistics.maxHits = Math.max(hits, this.statistics.maxHits);
                            }

                            // Population evaluation and selection
                            return this.population.evaluate(this.target).then(() => {
                                this.population.selection();
                                this.generation++;
                                this.lifeSpanTimer = 0;
                            });
                        }
                    }
                }
            }).then(() => {
                if (this.config.speed <= 1) {
                    setImmediate(() => { this.update(); });
                } else {
                    setTimeout(() => { this.update(); }, this.config.speed);
                }
            });
    }

    render() {
        if (!this.paused) {
            p5i.background(0);

            this.debugDiv.html(
                'Generation: ' + this.generation +
                '<br/> Timer: ' + this.lifeSpanTimer +
                '<br/> Deaths: ' + this.population.organisms.reduce((crashes, organism) => { return crashes + (organism.crashed ? 1 : 0); }, 0) + ' ' + (typeof (this.statistics.deathsHist) != 'undefined' ? '<img src="//chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.deathsHist.slice(-250).join(',') + '"/>' : '') +
                '<br/> Hits: ' + this.population.organisms.reduce((hits, organism) => { return hits + (organism.completed ? 1 : 0); }, 0) + ' ' + (typeof (this.statistics.hitsHist) != 'undefined' ? '<img src="//chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.hitsHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.avgLifeSpans) != 'undefined' ? '<br/> Avg Life Span: ' + this.statistics.avgLifeSpans.toFixed(2) : '') + ' ' + (typeof (this.statistics.avgLifeSpansHist) != 'undefined' ? '<img src="//chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.avgLifeSpansHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.avgDistance) != 'undefined' ? '<br/> Avg Distance: ' + this.statistics.avgDistance.toFixed(2) : '') + ' ' + (typeof (this.statistics.avgDistanceHist) != 'undefined' ? '<img src="//chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.avgDistanceHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.maxHits) != 'undefined' ? '<br/> Max Hits: ' + this.statistics.maxHits : '') +
                (typeof (this.statistics.firstHit) != 'undefined' ? '<br/> 1st Hit: Gen ' + this.statistics.firstHit : '') +
                (typeof (this.statistics.fiftiethHit) != 'undefined' ? '<br/> 50th Hit: Gen ' + this.statistics.fiftiethHit : '')

            );

            // Target
            p5i.fill(p5i.color('red'));
            p5i.ellipse(this.target.pos.x, this.target.pos.y, this.target.size.diameter);

            // Obstacles
            p5i.fill(255);
            for (var index = 0; index < this.obstacles.length; index++) {
                var obstacle = this.obstacles[index];
                p5i.quad(obstacle.coors[0].x, obstacle.coors[0].y, obstacle.coors[1].x, obstacle.coors[1].y, obstacle.coors[2].x, obstacle.coors[2].y, obstacle.coors[3].x, obstacle.coors[3].y);
            }

            // Population
            if (this.population) {
                for (let i = 0; i < this.population.organisms.length; i++) {
                    let organism = this.population.organisms[i];
                    organism.render();
                }
            }

            this.emitter.emit('afterRender', this);
        }
    }
}

module.exports = World;
},{"./pluginManager.js":5,"./population.js":8,"mitt":3}]},{},[2]);
