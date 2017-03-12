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
            maxFit = Math.max(this.organisms[i].fitness, maxFit);
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