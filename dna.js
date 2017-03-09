class DNA {
    constructor(genesAmount) {
        this.genes = [];
        this.genesAmount = genesAmount;
        this.maxforce = 0.2;
        for (var i = 0; i < genesAmount; i++) {
            this.genes[i] = this.createNewGene();
        }
    }

    crossover(partner) {
        var newgenes = [];
        var mid = p5i.floor(p5i.random(this.genes.length));
        for (var i = 0; i < this.genes.length; i++) {
            if (i > mid) {
                newgenes[i] = this.genes[i];
            } else {
                newgenes[i] = partner.genes[i];
            }

            // 0.01 mutation chance
            if (p5i.random(1) < 0.01) {
                newgenes[i] = this.createNewGene();
            }
        }
        const newDNA = new DNA(this.genesAmount);
        newDNA.genes = newgenes;
        return newDNA;
    }

    createNewGene() {
        let newGene = p5.Vector.random2D();
        newGene.setMag(this.maxforce);
        return newGene;
    }
}

module.exports = DNA;