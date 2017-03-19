const DNA = require('./dna.js');
const PluginManager = require('./pluginManager.js');

class Organism {
    constructor(dnaOrGeneAmount) {
        this.size = { width: 25, height: 5 };
        this.pos = p5i.createVector((p5i.width / 2) - (this.size.width / 2), p5i.height - 30);
        this.initialPos = this.pos.copy();
        this.vel = p5i.createVector();
        this.acc = p5i.createVector();
        this.completed = false;
        this.crashed = false;
        this.dna = (typeof (dnaOrGeneAmount) == 'number' ? new DNA(dnaOrGeneAmount) : dnaOrGeneAmount);
        this.fitness = 0;
        this.lifeSpan = 0;
        this.fitnessCalculatorFn = this.distance;
        this.emitter = new mitt();
        PluginManager.registerEmitter('organism', this.emitter);
    }

    distance(organism, target) {
        let invertedDistance = Math.abs(p5i.width - organism.distanceTo(target));

        if (organism.completed) {
            return invertedDistance *= 10;
        }
        if (organism.crashed) {
            return invertedDistance /= 10;
        }
    }

    calcFitness(target) {
        this.emitter.emit('beforeCalcFitness', this);
        this.fitness = this.fitnessCalculatorFn(this, target);
    }

    mate(partner) {
        const childDNA = this.dna.crossover(partner.dna);
        return new Organism(childDNA);
    }

    update(lifeSpanTimer) {
        if (!this.completed && !this.crashed) {
            this.lifeSpan = lifeSpanTimer;
            this.acc.add(this.dna.genes[lifeSpanTimer]);
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0);
            this.vel.limit(4);
        }
    }

    collidesCircle(target) {
        let myCoors = getCoorsFromRect(this.pos, this.size, this.vel.heading());
        return p5i.collideCirclePoly(target.x, target.y, target.diameter, [myCoors.v1, myCoors.v2, myCoors.v3, myCoors.v4]);
    }

    collidesRect(target, inside = false) {
        let myCoors = getCoorsFromRect(this.pos, this.size, this.vel.heading());
        let targetCoors = getCoorsFromRect({ x: target.x, y: target.y }, { width: target.width, height: target.height });
        return p5i.collidePolyPoly([targetCoors.v1, targetCoors.v2, targetCoors.v3, targetCoors.v4], [myCoors.v1, myCoors.v2, myCoors.v3, myCoors.v4], inside);
    }

    distanceTo(target) {
        return p5i.dist(this.pos.x, this.pos.y, target.x, target.y);
    }

    render() {
        p5i.push();
        p5i.noStroke();
        p5i.fill(255, 150);

        let myCoors = getCoorsFromRect(this.pos, this.size, this.vel.heading());

        p5i.quad(myCoors.v1.x, myCoors.v1.y, myCoors.v2.x, myCoors.v2.y, myCoors.v3.x, myCoors.v3.y, myCoors.v4.x, myCoors.v4.y);

        p5i.pop();
    }
}

let getCoorsFromRect = (pos, size, angle) => {
    var coors = {
        v1: p5i.createVector(pos.x, pos.y),
        v2: p5i.createVector(pos.x, pos.y + size.height),
        v3: p5i.createVector(pos.x + size.width, pos.y + size.height),
        v4: p5i.createVector(pos.x + size.width, pos.y),
    };

    if (angle != null) {
        let midV = p5i.createVector(coors.v1.x + ((coors.v3.x - coors.v1.x) / 2), coors.v1.y + ((coors.v3.y - coors.v1.y) / 2));
        Object.keys(coors).map(function (key) {
            return coors[key] = coors[key].rotateOnOrigin(midV, angle);
        }, this);
    }

    return coors;
};

module.exports = Organism;