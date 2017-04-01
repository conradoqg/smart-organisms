const AVERAGESIZE = {
    WIDTH: 25,
    HEIGHT: 5
};

class DNA {
    constructor(movementGenesAmount) {
        let porpotion = p5i.random(0.50, 1.50);
        this.genes = {
            movement: [],
            size: {
                width: AVERAGESIZE.WIDTH * porpotion,
                height: AVERAGESIZE.HEIGHT * porpotion,
            },
            maxForce: p5i.random(0.1, 0.3)
        };
        for (let i = 0; i < movementGenesAmount; i++) {
            this.genes.movement[i] = this.createNewMovementGene();
        }
    }

    crossover(partner) {
        const newDNA = new DNA(this.genes.movement.length);
        newDNA.genes.movement = this.crossoverMovement(partner);
        newDNA.genes.size = this.crossoverSize(partner);
        newDNA.genes.maxForce = this.crossoverMaxForce(partner);        
        return newDNA;
    }

    crossoverMovement(partner) {
        // Selects a random midpoint position and cross the dna genes from that midpoint
        let newMovementGenes = [];
        let mid = p5i.floor(p5i.random(this.genes.movement.length));
        for (let i = 0; i < this.genes.movement.length; i++) {
            // Set the gene from itself or form its partner depending on the midpoint.
            if (i > mid) {
                newMovementGenes[i] = this.genes.movement[i];
            } else {
                newMovementGenes[i] = partner.genes.movement[i];
            }

            // Mutate the gene which will bring diversity to the organism. 0.01 mutation chance
            if (p5i.random(1) < 0.01) {
                newMovementGenes[i] = this.createNewMovementGene();
            }
        }
        return newMovementGenes;
    }

    crossoverSize(partner) {
        let newSizeGene = {};

        // New size will be somewhere between this DNA size and its partner with 0.01 size mutation
        newSizeGene.width = p5i.random(this.genes.size.width, partner.genes.size.width) * p5i.random(0.99, 1.01);
        newSizeGene.height = p5i.random(this.genes.size.height, partner.genes.size.height) * p5i.random(0.99, 1.01);

        return newSizeGene;
    }

    crossoverMaxForce(partner) {
        // New max force will be somewhere between this DNA max force and its partner with 0.01 max force mutation
        let newMaxForce = p5i.random(this.genes.maxForce + partner.genes.maxForce) * p5i.random(0.99, 1.01);
        return newMaxForce;
    }

    createNewMovementGene() {
        // Creates a new gene randomly
        let newMovementGene = p5i.createVector(p5i.random(-1, 1), p5i.random(-1, 1));
        newMovementGene.setMag(this.genes.maxForce);
        return newMovementGene;
    }

    getNextMove(tick) {
        return this.genes.movement[tick];
    }
}

module.exports = DNA;