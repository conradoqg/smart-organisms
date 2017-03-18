const Organism = require('./organism.js');
const PluginManager = require('./pluginManager.js');

class Population {
    constructor(geneAmount, popSize) {
        this.organisms = [];
        this.popSize = popSize;
        this.matingPool = [];

        for (let i = 0; i < this.popSize; i++) {
            this.organisms[i] = new Organism(geneAmount);
        }
        this.emitter = new mitt();
        PluginManager.registerEmitter('population', this.emitter);
    }

    evaluate(target) {
        // Find max fitness
        this.emitter.emit('beforeAllFitnessCalculated', this);
        let maxFit = 0;        
        for (let i = 0; i < this.popSize; i++) {
            this.organisms[i].calcFitness(target);
            maxFit = Math.max(this.organisms[i].fitness, maxFit);
        }
        this.emitter.emit('afterAllFitnessCalculated', this);

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