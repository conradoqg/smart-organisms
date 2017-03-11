const Organism = require('./organism.js');

class Population {
    constructor(geneAmount, popSize) {
        this.rockets = [];   
        this.popSize = popSize;     
        this.matingpool = [];

        for (var i = 0; i < this.popSize; i++) {
            this.rockets[i] = new Organism(geneAmount);
        }
    }

    evaluate(target) {
        var maxFit = 0;
        for (var i = 0; i < this.popSize; i++) {
            this.rockets[i].calcFitness(target);
            maxFit  = Math.max(this.rockets[i].fitness, maxFit);            
        }

        for (var i = 0; i < this.popSize; i++) {
            this.rockets[i].fitness /= maxFit;
        }

        this.matingpool = [];
        for (var i = 0; i < this.popSize; i++) {
            var n = this.rockets[i].fitness * 100;
            for (var j = 0; j < n; j++) {
                this.matingpool.push(this.rockets[i]);
            }
        }
    }

    selection() {
        var newRockets = [];
        for (var i = 0; i < this.rockets.length; i++) {
            const parentA = p5i.random(this.matingpool);
            const parentB = p5i.random(this.matingpool);
            const child = parentA.mate(parentB);
            newRockets[i] = child;
        }
        this.rockets = newRockets;
    }
}

module.exports = Population;