(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
class DNA {
    constructor(genesAmount) {
        this.genes = [];
        this.genesAmount = genesAmount;
        this.maxforce = 0.2;
        for (let i = 0; i < genesAmount; i++) {
            this.genes[i] = this.createNewGene();
        }
    }

    crossover(partner) {
        // Selects a random mid point position and cross the dna genes from that mid point
        let newGenes = [];
        let mid = p5i.floor(p5i.random(this.genes.length));
        for (let i = 0; i < this.genes.length; i++) {
            // Set the gene from itself or form its partner depending on the mid point.
            if (i > mid) {
                newGenes[i] = this.genes[i];        
            } else {
                newGenes[i] = partner.genes[i];
            }

            // Mutate the gene which will bring diversity to the organism. 0.01 mutation chance
            if (p5i.random(1) < 0.01) {
                newGenes[i] = this.createNewGene();
            }
        }
        const newDNA = new DNA(this.genesAmount);
        newDNA.genes = newGenes;
        return newDNA;
    }

    createNewGene() {
        // Creates a new gene randomly
        let newGene = p5i.createVector(p5i.random(-1,1), p5i.random(-1,1));
        newGene.setMag(this.maxforce);
        return newGene;
    }
}

module.exports = DNA;
},{}],2:[function(require,module,exports){
let bitMap = null;
let cachedCleanGraph = null;

class FitnessMeasurer {
    static method1(organism, target) {
        let invertedDistance = Math.abs(p5i.width - organism.distanceTo(target));

        if (organism.completed) {
            return invertedDistance *= 10;
        }
        if (organism.crashed) {
            return invertedDistance /= 10;
        }
    }

    static method2(organism, target) {
        // Distance constants
        const maxDistance = Math.max(
            p5i.createVector(0, 0).dist(organism.initialPos),
            p5i.createVector(0, p5i.height).dist(organism.initialPos),
            p5i.createVector(p5i.width, 0).dist(organism.initialPos),
            p5i.createVector(p5i.width, p5i.height).dist(organism.initialPos)
        );
        const minDistance = 0;
        let distance = this.astartDistance(organism.pos, target);
        distance = (distance == null ? maxDistance : distance);

        // Lifespane constants
        const minLifespan = 0;
        const maxLifespan = organism.dna.genesAmount;
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
        if (organism.completed) result *= 10;

        return result;
    }

    static astartDistance(object, target) {
        // Cache here is important because it takes a while to create a Graph
        let graph;
        if (cachedCleanGraph == null) {
            cachedCleanGraph = new Graph(bitMap);
        } else {
            // Clean graph for next execution
            cachedCleanGraph.init();
            cachedCleanGraph.cleanDirty();
        }
        graph = cachedCleanGraph;

        // Limits X and Y for both object according the size of the bitmap
        let objectX = Math.min(Math.max(Math.round(object.x), 0), bitMap[0].length - 1);
        let objectY = Math.min(Math.max(Math.round(object.y), 0), bitMap.length - 1);

        let targetX = Math.min(Math.max(Math.round(target.x), 0), bitMap[0].length - 1);
        let targetY = Math.min(Math.max(Math.round(target.y), 0), bitMap.length - 1);

        // Setup the start and end points;
        var start = graph.grid[objectX][objectY];
        var end = graph.grid[targetX][targetY];

        // If the start point is a wall, find the nearest non-wall node
        if (start.isWall()) {
            let findClosestNotWall = (nodes) => {
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
                    return findClosestNotWall(neighbors);
                }

                return nodeFound;
            };
            start = findClosestNotWall(graph.neighbors(start));
        }

        // Do a A* search from the starting point to the target point
        var result = astar.search(graph, start, end, { closest: true, heuristic: astar.heuristics.diagonal });

        // Draw found path (for debuggin purposes)
        p5i.push();
        p5i.stroke('yellow');
        result.forEach((node) => {
            p5i.point(node.x, node.y);
        });
        p5i.pop();

        let distance = (result.length == 0 ? null : result.length);
        return distance;
    }

    static get bitMap() { return bitMap; }
    static set bitMap(value) { bitMap = value; }
}

module.exports = FitnessMeasurer;
},{}],3:[function(require,module,exports){
/**
 * Smart organisms.
 * 
 * based on the work of Daniel Shiffman: http://codingtra.in
 *  
 */
const World = require('./world.js');

const word = new World();

p5.disableFriendlyErrors = true;

new p5((p5iinstance) => {
    p5iinstance.setup = word.setup.bind(word);
    window.p5i = p5iinstance;
}, 'canvas');
},{"./world.js":6}],4:[function(require,module,exports){
const DNA = require('./dna.js');
const FitnessMeasurer = require('./fitnessMeasurer.js');

class Organism {
    constructor(dnaOrGeneAmount) {
        this.pos = p5i.createVector(p5i.width / 2, p5i.height);
        this.initialPos = this.pos.copy();
        this.size = { width: 25, height: 5 };
        this.vel = p5i.createVector();
        this.acc = p5i.createVector();
        this.completed = false;
        this.crashed = false;
        this.dna = (typeof (dnaOrGeneAmount) == 'number' ? new DNA(dnaOrGeneAmount) : dnaOrGeneAmount);
        this.fitness = 0;
        this.lifeSpan = 0;
    }

    calcFitness(target) {
        this.fitness = FitnessMeasurer.method2(this, target);
    }

    mate(partner) {
        const childDNA = this.dna.crossover(partner.dna);
        return new Organism(childDNA);
    }

    update(lifeSpanTimer) {
        if (!this.completed && !this.crashed) {
            this.lifeSpan = lifeSpanTimer;
            this.acc.add(this.dna.genes[lifeSpanTimer]);
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0);
            this.vel.limit(4);
        }
    }

    collidesCircle(target) {
        return p5i.collidePointCircle(this.pos.x, this.pos.y, target.x, target.y, target.diameter);
    }

    collidesRect(target) {
        return p5i.collidePointRect(this.pos.x, this.pos.y, target.x, target.y, target.width, target.height);
    }

    distanceTo(target) {
        return p5i.dist(this.pos.x, this.pos.y, target.x, target.y);
    }

    render() {
        p5i.push();
        p5i.noStroke();
        p5i.fill(255, 150);
        p5i.translate(this.pos.x, this.pos.y);
        p5i.rotate(this.vel.heading());
        p5i.rectMode(p5i.CENTER);
        p5i.rect(0, 0, this.size.width, this.size.height);
        p5i.pop();
    }
}

module.exports = Organism;
},{"./dna.js":1,"./fitnessMeasurer.js":2}],5:[function(require,module,exports){
const Organism = require('./organism.js');

class Population {
    constructor(geneAmount, popSize) {
        this.organisms = [];
        this.popSize = popSize;
        this.matingPool = [];

        for (let i = 0; i < this.popSize; i++) {
            this.organisms[i] = new Organism(geneAmount);
        }
    }

    evaluate(target) {
        // Find max fitness
        let maxFit = 0;
        for (let i = 0; i < this.popSize; i++) {
            this.organisms[i].calcFitness(target);
            maxFit = Math.max(this.organisms[i].fitness, maxFit);
        }

        // Map fitness between 0 and 1.        
        for (let i = 0; i < this.popSize; i++) {
            this.organisms[i].fitness /= maxFit;
        }

        // Adds the organisms N times to mating pool according its fitness proportional value. Multiplies N by 100 to give a minimum of 1 options for the lowest ranked organism
        this.matingPool = [];
        for (let i = 0; i < this.popSize; i++) {
            let n = this.organisms[i].fitness * 100;
            for (let j = 0; j < n; j++) {
                this.matingPool.push(this.organisms[i]);
            }
        }
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
},{"./organism.js":4}],6:[function(require,module,exports){
const Population = require('./population.js');
const FitnessMeasurer = require('./fitnessMeasurer.js');

class World {
    constructor() {
        this.setInitialState();
        this.target = {
            x: this.config.width / 2,
            y: 50,
            diameter: 16
        };
        this.obstacle = {
            x: 150,
            y: 300,
            width: 300,
            height: 10
        };
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
        this.resetButton.mousePressed(() => {
            this.setInitialState(this.seedInput.value(), this.popSizeInput.value(), this.lifeSpanInput.value());
            this.setP5InitialState();
        });

        // p5        
        p5i.draw = this.render.bind(this);

        // Main update loop
        let loop = () => {
            this.update();
            setTimeout(loop);
        };
        loop();
    }

    setInitialState(seed, popSize, lifeSpan) {
        this.config = {
            width: 600,
            height: 600,
            FPS: 60,
            popSize: (popSize == null ? 100 : parseInt(popSize)),
            lifeSpan: (lifeSpan == null ? 1600 : parseInt(lifeSpan)),
            seed: (seed == null ? 10 : parseInt(seed))
        };
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
    }

    update() {
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
                    }

                    // Off-screen
                    if (!organism.collidesRect({ x: 0, y: 0, width: this.config.width, height: this.config.height })) {
                        organism.crashed = true;
                    }

                    // Obstacle
                    if (organism.collidesRect(this.obstacle)) {
                        organism.crashed = true;
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

                    // Population evaluation and selection
                    this.population.evaluate(this.target);
                    this.population.selection();
                    this.generation++;
                    this.lifeSpanTimer = 0;
                }
            }
        }
    }

    render() {
        if (!this.paused) {
            p5i.background(0);

            this.debugDiv.html(
                'Generation: ' + this.generation +
                '<br/> Timer: ' + this.lifeSpanTimer +
                '<br/> Deaths: ' + this.population.organisms.reduce((crashes, organism) => { return crashes + (organism.crashed ? 1 : 0); }, 0) + ' ' + (typeof (this.statistics.deathsHist) != 'undefined' ? '<img src="http://chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.deathsHist.slice(-250).join(',') + '"/>' : '') +
                '<br/> Hits: ' + this.population.organisms.reduce((hits, organism) => { return hits + (organism.completed ? 1 : 0); }, 0) + ' ' + (typeof (this.statistics.hitsHist) != 'undefined' ? '<img src="http://chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.hitsHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.avgLifeSpans) != 'undefined' ? '<br/> Avg Life Span: ' + this.statistics.avgLifeSpans.toFixed(2) : '') + ' ' + (typeof (this.statistics.avgLifeSpansHist) != 'undefined' ? '<img src="http://chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.avgLifeSpansHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.avgDistance) != 'undefined' ? '<br/> Avg Distance: ' + this.statistics.avgDistance.toFixed(2) : '') + ' ' + (typeof (this.statistics.avgDistanceHist) != 'undefined' ? '<img src="http://chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.avgDistanceHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.firstHit) != 'undefined' ? '<br/> 1st Hit: Gen ' + this.statistics.firstHit : '')
            );

            // Target
            p5i.fill(p5i.color('red'));
            p5i.ellipse(this.target.x, this.target.y, this.target.diameter);

            // Obstacle
            p5i.fill(255);
            p5i.rect(this.obstacle.x, this.obstacle.y, this.obstacle.width, this.obstacle.height);

            // Create a map of the screen on the first execution setting up obstacles with 0 and paths with 1 based on the color of the screen pixel
            if (FitnessMeasurer.bitMap == null) {
                let bitMap = [];
                p5i.loadPixels();
                for (var x = 0; x < p5i.width; x++) {
                    let row = Array(p5i.height);
                    for (var y = 0; y < p5i.height; y++) {
                        var index = (x + y * p5i.width) * 4;
                        if (p5i.color(255).levels[0] == p5i.pixels[index] &&
                            p5i.color(255).levels[1] == p5i.pixels[index + 1] &&
                            p5i.color(255).levels[2] == p5i.pixels[index + 2] &&
                            p5i.color(255).levels[3] == p5i.pixels[index + 3]) {
                            row[y] = 0;
                        } else {
                            row[y] = 1;
                        }
                    }
                    bitMap.push(row);
                }
                FitnessMeasurer.bitMap = bitMap;
            }

            if (this.population) {
                for (let i = 0; i < this.population.organisms.length; i++) {
                    let organism = this.population.organisms[i];
                    organism.render();
                }
            }
        }
    }
}

module.exports = World;
},{"./fitnessMeasurer.js":2,"./population.js":5}]},{},[3]);
