(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function DNA(cromosomesAmount) {
    this.genes = [];
    this.maxforce = 0.2;
    for (var i = 0; i < cromosomesAmount; i++) {
        this.genes[i] = p5.Vector.random2D();
        this.genes[i].setMag(this.maxforce);
    }

    this.crossover = function (partner) {
        var newgenes = [];
        var mid = p5i.floor(p5i.random(this.genes.length));
        for (var i = 0; i < this.genes.length; i++) {
            if (i > mid) {
                newgenes[i] = this.genes[i];
            } else {
                newgenes[i] = partner.genes[i];
            }
        }
        const newDNA = new DNA(cromosomesAmount);
        newDNA.genes = newgenes;
        return newDNA;
    };

    this.mutation = function () {
        for (var i = 0; i < this.genes.length; i++) {
            if (p5i.random(1) < 0.01) {
                this.genes[i] = p5.Vector.random2D();
                this.genes[i].setMag(this.maxforce);
            }
        }
    };

}

module.exports = DNA;
},{}],2:[function(require,module,exports){
/**
 * Smart rockets.
 * 
 * based on the work of Daniel Shiffman: http://codingtra.in
 *  
 */
const World = require('./world.js');

const word = new World('canvas');
word.init();
},{"./world.js":5}],3:[function(require,module,exports){
const Rocket = require('./rocket.js');

function Population(target, obstacle) {
    this.rockets = [];
    this.popsize = 25;
    this.matingpool = [];
    this.target = target;
    this.obstacle = obstacle;

    for (var i = 0; i < this.popsize; i++) {
        this.rockets[i] = new Rocket(this.target, this.obstacle);
    }

    this.evaluate = function () {

        var maxfit = 0;
        for (var i = 0; i < this.popsize; i++) {
            this.rockets[i].calcFitness();
            if (this.rockets[i].fitness > maxfit) {
                maxfit = this.rockets[i].fitness;
            }
        }

        for (var i = 0; i < this.popsize; i++) {
            this.rockets[i].fitness /= maxfit;
        }

        this.matingpool = [];
        for (var i = 0; i < this.popsize; i++) {
            var n = this.rockets[i].fitness * 100;
            for (var j = 0; j < n; j++) {
                this.matingpool.push(this.rockets[i]);
            }
        }
    };

    this.selection = function () {
        var newRockets = [];
        for (var i = 0; i < this.rockets.length; i++) {
            var parentA = p5i.random(this.matingpool).dna;
            var parentB = p5i.random(this.matingpool).dna;
            var child = parentA.crossover(parentB);
            child.mutation();
            newRockets[i] = new Rocket(this.target, this.obstacle, child);
        }
        this.rockets = newRockets;
    };

    this.run = function (count) {
        for (var i = 0; i < this.popsize; i++) {
            this.rockets[i].update(count);
            this.rockets[i].show();
        }
    };
}

module.exports = Population;
},{"./rocket.js":4}],4:[function(require,module,exports){
const DNA = require('./dna.js');

function Rocket(target, obstacle, dna) {
    this.pos = p5i.createVector(p5i.width / 2, p5i.height);
    this.vel = p5i.createVector();
    this.acc = p5i.createVector();
    this.completed = false;
    this.crashed = false;
    this.target = target;
    this.obstacle = obstacle;

    if (dna) {
        this.dna = dna;
    } else {
        this.dna = new DNA(p5i.width);
    }
    this.fitness = 0;

    this.applyForce = function (force) {
        this.acc.add(force);
    };

    this.calcFitness = function () {
        var d = p5i.dist(this.pos.x, this.pos.y, this.target.x, this.target.y);

        this.fitness = p5i.map(d, 0, p5i.width, p5i.width, 0);
        if (this.completed) {
            this.fitness *= 10;
        }
        if (this.crashed) {
            this.fitness /= 10;
        }

    };

    this.update = function (count) {

        var d = p5i.dist(this.pos.x, this.pos.y, this.target.x, this.target.y);
        if (d < 10) {
            this.completed = true;
            this.pos = p5i.createVector(this.target.x, this.target.y);
        }

        if (this.pos.x > this.obstacle.x && this.pos.x < this.obstacle.x + this.obstacle.width && this.pos.y > this.obstacle.y && this.pos.y < this.obstacle.y + this.obstacle.height) {
            this.crashed = true;
        }

        if (this.pos.x > p5i.width || this.pos.x < 0) {
            this.crashed = true;
        }
        if (this.pos.y > p5i.height || this.pos.y < 0) {
            this.crashed = true;
        }



        this.applyForce(this.dna.genes[count]);
        if (!this.completed && !this.crashed) {
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0);
            this.vel.limit(4);
        }
    };

    this.show = function () {
        p5i.push();
        p5i.noStroke();
        p5i.fill(255, 150);
        p5i.translate(this.pos.x, this.pos.y);
        p5i.rotate(this.vel.heading());
        p5i.rectMode(p5i.CENTER);
        p5i.rect(0, 0, 25, 5);
        p5i.pop();
    };

}

module.exports = Rocket;
},{"./dna.js":1}],5:[function(require,module,exports){
const Population = require('./population.js');

class World {
    constructor(canvasElementID) {
        this.config = {
            width: 600,
            height: 600,
            FPS: 60,
            canvasElementID: canvasElementID
        };
        this.population = null;
        this.lifeP = null;
        this.count = 0;
        this.lifespan = this.config.height;
        this.target = {
            x: this.config.width / 2,
            y: 50,
            width: 16,
            height: 16
        };
        this.obstacle = {
            x: 100,
            y: 150,
            width: 200,
            height: 10
        };
    }

    setup() {
        p5i.createCanvas(this.config.width, this.config.height);
        p5i.frameRate(this.config.FPS);
        this.lifeP = p5i.createP();
        this.population = new Population(this.target, this.obstacle);
        p5i.draw = this.draw.bind(this);
    }

    draw() {
        this.update();
        this.render();
    }

    update() {

    }

    render() {
        p5i.background(0);
        this.population.run(this.count);
        this.lifeP.html(this.count);

        this.count++;
        if (this.count == this.lifespan) {
            this.population.evaluate();
            this.population.selection();
            this.count = 0;
        }

        p5i.fill(255);
        p5i.rect(this.obstacle.x, this.obstacle.y, this.obstacle.width, this.obstacle.height);

        p5i.ellipse(this.target.x, this.target.y, this.target.width, this.target.height);
        console.log(p5i.frameRate());
    }

    setupp5i() {
        let self = this;
        p5.disableFriendlyErrors = true;

        new p5((p5iinstance) => {
            p5iinstance.setup = self.setup.bind(self);
            window.p5i = p5iinstance;
        }, this.config.canvasElementID);
    }

    init() {
        this.setupp5i();
    }
}

module.exports = World;
},{"./population.js":3}]},{},[2]);
