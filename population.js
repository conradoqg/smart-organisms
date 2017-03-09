const Organism = require('./organism.js');

class Population {
    constructor(geneAmount, popsize) {
        this.rockets = [];   
        this.popsize = popsize;     
        this.matingpool = [];

        for (var i = 0; i < this.popsize; i++) {
            this.rockets[i] = new Organism(geneAmount);
        }
    }

    evaluate(target) {
        var maxfit = 0;
        for (var i = 0; i < this.popsize; i++) {
            this.rockets[i].calcFitness(target);
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