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
    const maxLifespan = organism.dna.genes.moviment.length;
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