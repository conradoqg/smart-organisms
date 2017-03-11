const Population = require('./population.js');

class World {
    constructor() {
        this.setInitialState();
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
        
        this.setP5InitialState();

        // Debug element
        var debugContainer = p5i.select('#debugContainer');
        debugContainer.style('width', this.config.width.toString() + 'px');
        debugContainer.style('height', this.config.height.toString() + 'px');

        this.debugDiv = p5i.select('#debug');        

        var settingsContainer = p5i.select('#settingsContainer');
        settingsContainer.style('width', this.config.width.toString() + 'px');
        settingsContainer.style('height', this.config.height.toString() + 'px');

        this.settingsDiv = p5i.select('#settings');
        p5i.createElement('label', 'Seed: ').parent(this.settingsDiv);
        this.seedInput = p5i.createInput(this.config.seed);
        this.seedInput.size(30);
        this.seedInput.parent(this.settingsDiv);
        this.seedInput.addClass('input');

        p5i.createElement('label', 'Pop Size: ').parent(this.settingsDiv);
        this.popSizeInput = p5i.createInput(this.config.popSize);
        this.popSizeInput.size(30);
        this.popSizeInput.parent(this.settingsDiv);
        this.popSizeInput.addClass('input');

        p5i.createElement('label', 'Life Span: ').parent(this.settingsDiv);
        this.lifeSpanInput = p5i.createInput(this.config.lifeSpan);
        this.lifeSpanInput.size(30);
        this.lifeSpanInput.parent(this.settingsDiv);
        this.lifeSpanInput.addClass('input');

        var controlContainer = p5i.select('#controlContainer');
        controlContainer.style('width', this.config.width.toString() + 'px');
        controlContainer.style('height', this.config.height.toString() + 'px');

        this.controlDiv = p5i.select('#control');
        this.resetButton = p5i.createButton('reset');
        this.resetButton.parent(this.controlDiv);
        this.resetButton.mousePressed(() => {
            this.setInitialState(this.seedInput.value(), this.popSizeInput.value(), this.lifeSpanInput.value());
            this.setP5InitialState();
        });

        // p5        
        p5i.draw = this.render.bind(this);
        let loop = () => {
            this.update();
            setTimeout(loop);
        };
        loop();        
    }

    setInitialState(seed, popSize, lifeSpan) {
        this.config = {
            width: 600,
            height: 600,
            FPS: 30,
            popSize:  (popSize == null ? 100 : parseInt(popSize)),
            lifeSpan: (lifeSpan == null ? 1600 : parseInt(lifeSpan)),
            seed: (seed == null ? 10 : parseInt(seed))
        };                
        this.population = null;
        this.count = 0;
        this.generation = 1;
    }

    setP5InitialState() {
        // Frame rate
        p5i.frameRate(this.config.FPS);

        // Seed random
        p5i.randomSeed(this.config.seed);

        this.population = new Population(this.config.lifeSpan, this.config.popSize);
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
            if (this.count == this.config.lifeSpan || deathCount == this.config.popSize) {
                this.generation++;
                this.population.evaluate(this.target);
                this.population.selection();
                this.count = 0;
            }
        }
    }

    render() {
        p5i.background(0);

        this.debugDiv.html(
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