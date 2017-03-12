(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
class DNA {
    constructor(genesAmount) {
        this.genes = [];
        this.genesAmount = genesAmount;
        this.maxforce = 0.2;
        for (var i = 0; i < genesAmount; i++) {
            this.genes[i] = this.createNewGene();
        }
    }

    crossover(partner) {
        var newgenes = [];
        var mid = p5i.floor(p5i.random(this.genes.length));
        for (var i = 0; i < this.genes.length; i++) {
            if (i > mid) {
                newgenes[i] = this.genes[i];        
            } else {
                newgenes[i] = partner.genes[i];
            }

            // 0.01 mutation chance
            if (p5i.random(1) < 0.01) {
                newgenes[i] = this.createNewGene();
            }
        }
        const newDNA = new DNA(this.genesAmount);
        newDNA.genes = newgenes;
        return newDNA;
    }

    createNewGene() {
        let newGene = p5i.createVector(p5i.random(-1,1), p5i.random(-1,1));
        newGene.setMag(this.maxforce);
        return newGene;
    }
}

module.exports = DNA;
},{}],2:[function(require,module,exports){
class FitnessMeasurer {
    static method1(organism, target) {
        var invertedDistance = Math.abs(p5i.width - organism.distanceTo(target));

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
        const distance = organism.pos.dist(p5i.createVector(target.x, target.y));

        // Lifespane constants
        const minLifespan = 0;
        const maxLifespan = organism.dna.genesAmount;
        let lifeSpan = organism.lifeSpan;

        // Weights
        const distanceWeight = 10;
        const lifeSpaneWeight = 5;        

        let distanceFitness = (100 - p5i.map(distance, minDistance, maxDistance, 0, 100));
        let lifeSpanFitness = p5i.map(lifeSpan, minLifespan, maxLifespan, 0, 100);
        let result = (distanceFitness * distanceWeight) + (lifeSpanFitness * lifeSpaneWeight);

        if (organism.completed) result *= 10;                

        return result;
    }
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
        this.size = { width: 25, height: 5};
        this.vel = p5i.createVector();
        this.acc = p5i.createVector();
        this.completed = false;
        this.crashed = false;
        this.dna = (typeof(dnaOrGeneAmount) == 'number' ? new DNA(dnaOrGeneAmount) : dnaOrGeneAmount);
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

    update(count) {
        this.acc.add(this.dna.genes[count]);
        if (!this.completed && !this.crashed) {
            this.lifeSpan = count;
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
        this.matingpool = [];

        for (var i = 0; i < this.popSize; i++) {
            this.organisms[i] = new Organism(geneAmount);
        }
    }

    evaluate(target) {
        var maxFit = 0;
        for (var i = 0; i < this.popSize; i++) {
            this.organisms[i].calcFitness(target);
            maxFit  = Math.max(this.organisms[i].fitness, maxFit);            
        }

        for (var i = 0; i < this.popSize; i++) {
            this.organisms[i].fitness /= maxFit;
        }

        this.matingpool = [];
        for (var i = 0; i < this.popSize; i++) {
            var n = this.organisms[i].fitness * 100;
            for (var j = 0; j < n; j++) {
                this.matingpool.push(this.organisms[i]);
            }
        }
    }

    selection() {
        var neworganisms = [];
        for (var i = 0; i < this.organisms.length; i++) {
            const parentA = p5i.random(this.matingpool);
            const parentB = p5i.random(this.matingpool);
            const child = parentA.mate(parentB);
            neworganisms[i] = child;
        }
        this.organisms = neworganisms;
    }
}

module.exports = Population;
},{"./organism.js":4}],6:[function(require,module,exports){
const Population = require('./population.js');

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

        this.setP5InitialState();

        // Debug element
        var debugContainer = p5i.select('#debugContainer');
        debugContainer.style('width', this.config.width.toString() + 'px');
        debugContainer.style('height', this.config.height.toString() + 'px');

        this.debugDiv = p5i.select('#debug');

        var settingsContainer = p5i.select('#settingsContainer');
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

        var controlContainer = p5i.select('#controlContainer');
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
        this.count = 0;
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
                let deathCount = 0;
                // Update organisms
                for (var i = 0; i < this.population.organisms.length; i++) {
                    let organism = this.population.organisms[i];
                    organism.update(this.count);
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

                    if (organism.crashed || organism.completed) {
                        deathCount++;
                    }
                }

                this.count++;
                if (this.count == this.config.lifeSpan || deathCount == this.config.popSize) {
                    // Statistics
                    const deaths = this.population.organisms.reduce((crashes, organism) => { return crashes + (organism.crashed ? 1 : 0); }, 0);
                    const hits = this.population.organisms.reduce((hits, organism) => { return hits + (organism.completed ? 1 : 0); }, 0);

                    this.statistics.avgLifeSpans = this.population.organisms.reduce((lifeSpan, organism) => { return lifeSpan + organism.lifeSpan; }, 0) / this.population.organisms.length;
                    this.statistics.avgDistance = this.population.organisms.reduce((distance, organism) => { return distance + organism.distanceTo(this.target); }, 0) / this.population.organisms.length;
                    this.statistics.avgLifeSpansHist = (typeof (this.statistics.avgLifeSpansHist) != 'undefined' ? [...this.statistics.avgLifeSpansHist, this.statistics.avgLifeSpans.toFixed(2)] : [this.statistics.avgLifeSpans.toFixed(2)]);
                    this.statistics.avgDistanceHist = (typeof (this.statistics.avgDistanceHist) != 'undefined' ? [...this.statistics.avgDistanceHist, this.statistics.avgDistance.toFixed(2)] : [this.statistics.avgDistance.toFixed(2)]);
                    this.statistics.deathsHist = (typeof (this.statistics.deathsHist) != 'undefined' ? [...this.statistics.deathsHist, deaths] : [deaths]);
                    this.statistics.hitsHist = (typeof (this.statistics.hitsHist) != 'undefined' ? [...this.statistics.hitsHist, hits] : [hits]);

                    if (hits > 0 && typeof (this.statistics.firstHit) == 'undefined') this.statistics.firstHit = this.generation;

                    this.population.evaluate(this.target);
                    this.population.selection();
                    this.generation++;
                    this.count = 0;
                }
            }
        }
    }

    render() {
        if (!this.paused) {
            p5i.background(0);

            this.debugDiv.html(
                'Generation: ' + this.generation +
                '<br/> World time: ' + this.count +
                '<br/> Deaths: ' + this.population.organisms.reduce((crashes, organism) => { return crashes + (organism.crashed ? 1 : 0); }, 0) + ' ' + (typeof (this.statistics.deathsHist) != 'undefined' ? '<img src="http://chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.deathsHist.slice(-250).join(',') + '"/>' : '') +
                '<br/> Hits: ' + this.population.organisms.reduce((hits, organism) => { return hits + (organism.completed ? 1 : 0); }, 0) + ' ' + (typeof (this.statistics.hitsHist) != 'undefined' ? '<img src="http://chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.hitsHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.avgLifeSpans) != 'undefined' ? '<br/> Avg Life Span: ' + this.statistics.avgLifeSpans.toFixed(2) : '') + ' ' + (typeof (this.statistics.avgLifeSpansHist) != 'undefined' ? '<img src="http://chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.avgLifeSpansHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.avgDistance) != 'undefined' ? '<br/> Avg Distance: ' + this.statistics.avgDistance.toFixed(2) : '') + ' ' + (typeof (this.statistics.avgDistanceHist) != 'undefined' ? '<img src="http://chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.avgDistanceHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.firstHit) != 'undefined' ? '<br/> First Hit: Gen ' + this.statistics.firstHit : '')
            );

            if (this.population) {
                for (var i = 0; i < this.population.organisms.length; i++) {
                    let organism = this.population.organisms[i];
                    organism.render();
                }
            }

            p5i.fill(255);
            p5i.rect(this.obstacle.x, this.obstacle.y, this.obstacle.width, this.obstacle.height);
            p5i.ellipse(this.target.x, this.target.y, this.target.diameter);
        }
    }
}

module.exports = World;
},{"./population.js":5}]},{},[3]);
