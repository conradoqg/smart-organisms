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