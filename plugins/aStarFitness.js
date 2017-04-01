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