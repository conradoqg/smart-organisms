const AVERAGESIZE = {
    WIDTH: 25,
    HEIGHT: 5
};

class DNA {
    constructor(movimentGenesAmount) {
        let porpotion = p5i.random(0.50, 1.50);
        this.genes = {
            moviment: [],
            size: {
                width: AVERAGESIZE.WIDTH * porpotion,
                height: AVERAGESIZE.HEIGHT * porpotion,
            },
            maxForce: p5i.random(0.1, 0.3)
        };
        for (let i = 0; i < movimentGenesAmount; i++) {
            this.genes.moviment[i] = this.createNewMovimentGene();
        }
    }

    crossover(partner) {
        const newDNA = new DNA(this.genes.moviment.length);
        newDNA.genes.moviment = this.crossoverMoviment(partner);
        newDNA.genes.size = this.crossoverSize(partner);
        newDNA.genes.maxForce = this.crossoverMaxForce(partner);        
        return newDNA;
    }

    crossoverMoviment(partner) {
        // Selects a random mid point position and cross the dna genes from that mid point
        let newMovimentGenes = [];
        let mid = p5i.floor(p5i.random(this.genes.moviment.length));
        for (let i = 0; i < this.genes.moviment.length; i++) {
            // Set the gene from itself or form its partner depending on the mid point.
            if (i > mid) {
                newMovimentGenes[i] = this.genes.moviment[i];
            } else {
                newMovimentGenes[i] = partner.genes.moviment[i];
            }

            // Mutate the gene which will bring diversity to the organism. 0.01 mutation chance
            if (p5i.random(1) < 0.01) {
                newMovimentGenes[i] = this.createNewMovimentGene();
            }
        }
        return newMovimentGenes;
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

    createNewMovimentGene() {
        // Creates a new gene randomly
        let newMovimentGene = p5i.createVector(p5i.random(-1, 1), p5i.random(-1, 1));
        newMovimentGene.setMag(this.genes.maxForce);
        return newMovimentGene;
    }

    getNextMove(tick) {
        return this.genes.moviment[tick];
    }
}

module.exports = DNA;