const Population = require('./population.js');

class World {
    constructor() {
        this.config = {
            width: 600,
            height: 600,
            FPS: 30,            
            popsize: 100,
            lifespan: 1600,
            seed: 10
        };
        this.population = null;
        this.lifeP = null;
        this.count = 0;        
        this.generation = 1;
        this.target = {
            x: this.config.width / 2,
            y: 50,
            diameter: 16
        };
        this.obstacle = {
            x: 100,
            y: 300,
            width: 400,
            height: 10
        };
    }

    setup() {
        // Canvas
        p5i.createCanvas(this.config.width, this.config.height);
        p5i.frameRate(this.config.FPS);

        // Debug element
        this.debugDiv = p5i.select('#debug');        
        this.debugDiv.style('width', this.config.width.toString() + 'px');
        this.debugDiv.style('height', this.config.height.toString() + 'px');        
        this.lifeP = p5i.createDiv('');
        this.lifeP.parent(this.debugDiv);

        // Seed random
        p5i.randomSeed(this.config.seed);

        // p5        
        p5i.draw = this.render.bind(this);
        let loop = () => {
            this.update();
            setTimeout(loop);
        };
        loop();

        // Population
        this.population = new Population(this.config.lifespan, this.config.popsize);
    }

    update() {
        if (this.population) {
            let deathCount = 0;
            // Update organisms
            for (var i = 0; i < this.population.rockets.length; i++) {
                let rocket = this.population.rockets[i];
                rocket.update(this.count);
                if (rocket.collidesCircle(this.target)) {
                    rocket.completed = true;
                }

                // Off-screen
                if (!rocket.collidesRect({ x: 0, y: 0, width: this.config.width, height: this.config.height })) {
                    rocket.crashed = true;
                }

                // Obstacle
                if (rocket.collidesRect(this.obstacle)) {
                    rocket.crashed = true;
                }

                if (rocket.crashed || rocket.completed) {
                    deathCount++;
                }
            }            

            this.count++;
            if (this.count == this.config.lifespan || deathCount == this.config.popsize) {
                this.generation++;
                this.population.evaluate(this.target);
                this.population.selection();
                this.count = 0;
            }
        }
    }

    render() {
        p5i.background(0);

        this.lifeP.html(
            'Generation: ' + this.generation +
            '<br/> World time: ' + this.count +
            '<br/> Deaths: ' + this.population.rockets.reduce((crashes, rocket) => { return crashes + (rocket.crashed ? 1 : 0); }, 0) +
            '<br/> Hits: ' + this.population.rockets.reduce((hits, rocket) => { return hits + (rocket.completed ? 1 : 0); }, 0)
        );

        if (this.population) {
            for (var i = 0; i < this.population.rockets.length; i++) {
                let rocket = this.population.rockets[i];
                rocket.render();
            }
        }        

        p5i.fill(255);
        p5i.rect(this.obstacle.x, this.obstacle.y, this.obstacle.width, this.obstacle.height);
        p5i.ellipse(this.target.x, this.target.y, this.target.diameter);
    }
}

module.exports = World;