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
        const distance = organism.pos.dist(p5i.createVector(target.x, target.y));

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
        if (organism.completed) result *= 5;

        return result;
    }
}

module.exports = FitnessMeasurer;