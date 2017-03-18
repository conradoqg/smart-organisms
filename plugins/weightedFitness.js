let PluginManager = require('../pluginManager.js');
let emitter = PluginManager.getEmitter();

let calculatedPaths = null;

emitter.on('pluginManager-activate', (pluginID) => {
    if (pluginID == 'weightedFitness') {
        emitter.on('world-afterRender', onWorldAfterRender);
        emitter.on('organism-beforeCalcFitness', onOrganismBeforeCalcFitness);
        emitter.on('population-afterAllFitnessCalculated', onAfterAllFitnessCalculated);
    }
});

emitter.on('pluginManager-deactivate', (pluginID) => {
    if (pluginID == 'weightedFitness') {
        emitter.off('world-afterRender', onWorldAfterRender);
        emitter.off('organism-beforeCalcFitness', onOrganismBeforeCalcFitness);
        emitter.off('population-afterAllFitnessCalculated', onAfterAllFitnessCalculated);
    }
});

let onWorldAfterRender = () => {
    if (calculatedPaths != null) {
        if (window.isDebuging) {
            p5i.push();
            p5i.stroke('yellow');
            calculatedPaths.forEach((path) => {
                p5i.line(path.organism.pos.x, path.organism.pos.y, path.target.x, path.target.y);
            });
            p5i.pop();
        }
    }
};

let onOrganismBeforeCalcFitness = (organism) => {
    organism.fitnessCalculatorFn = calcFitness;
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

let onAfterAllFitnessCalculated = () => {
    calculatedPaths = null;
};