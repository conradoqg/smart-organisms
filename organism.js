const DNA = require('./dna.js');

class Organism {
    constructor(dnaOrGeneAmount) {
        this.pos = p5i.createVector(p5i.width / 2, p5i.height);
        this.size = { width: 25, height: 5};
        this.vel = p5i.createVector();
        this.acc = p5i.createVector();
        this.completed = false;
        this.crashed = false;
        this.dna = (typeof(dnaOrGeneAmount) == 'number' ? new DNA(dnaOrGeneAmount) : dnaOrGeneAmount);
        this.fitness = 0;
    }

    calcFitness(target) {
        var d = this.distanceTo(target);

        this.fitness = p5i.map(d, 0, p5i.width, p5i.width, 0);
        if (this.completed) {
            this.fitness *= 10;
        }
        if (this.crashed) {
            this.fitness /= 10;
        }
    }

    mate(partner) {
        const childDNA = this.dna.crossover(partner.dna);
        return new Organism(childDNA);
    }

    update(count) {
        this.acc.add(this.dna.genes[count]);
        if (!this.completed && !this.crashed) {
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0);
            this.vel.limit(4);
        }
    }

    collidesCircle(target) {
        return p5i.collidePointCircle(this.pos.x, this.pos.y, target.x, target.y, target.diameter);
    }

    collidesRect(target) {
        return p5i.collidePointRect(this.pos.x, this.pos.y, target.x, target.y, target.width, target.height);
    }

    distanceTo(target) {
        return p5i.dist(this.pos.x, this.pos.y, target.x, target.y);
    }

    render() {
        p5i.push();
        p5i.noStroke();
        p5i.fill(255, 150);
        p5i.translate(this.pos.x, this.pos.y);
        p5i.rotate(this.vel.heading());
        p5i.rectMode(p5i.CENTER);
        p5i.rect(0, 0, this.size.width, this.size.height);
        p5i.pop();
    }
}

module.exports = Organism;