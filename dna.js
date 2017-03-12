class DNA {
    constructor(genesAmount) {
        this.genes = [];
        this.genesAmount = genesAmount;
        this.maxforce = 0.2;
        for (let i = 0; i < genesAmount; i++) {
            this.genes[i] = this.createNewGene();
        }
    }

    crossover(partner) {
        // Selects a random mid point position and cross the dna genes from that mid point
        let newGenes = [];
        let mid = p5i.floor(p5i.random(this.genes.length));
        for (let i = 0; i < this.genes.length; i++) {
            // Set the gene from itself or form its partner depending on the mid point.
            if (i > mid) {
                newGenes[i] = this.genes[i];        
            } else {
                newGenes[i] = partner.genes[i];
            }

            // Mutate the gene which will bring diversity to the organism. 0.01 mutation chance
            if (p5i.random(1) < 0.01) {
                newGenes[i] = this.createNewGene();
            }
        }
        const newDNA = new DNA(this.genesAmount);
        newDNA.genes = newGenes;
        return newDNA;
    }

    createNewGene() {
        // Creates a new gene randomly
        let newGene = p5i.createVector(p5i.random(-1,1), p5i.random(-1,1));
        newGene.setMag(this.maxforce);
        return newGene;
    }
}

module.exports = DNA;