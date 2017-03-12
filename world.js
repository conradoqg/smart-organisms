const Population = require('./population.js');
const FitnessMeasurer = require('./fitnessMeasurer.js');

class World {
    constructor() {
        this.setInitialState();
        this.target = {
            x: this.config.width / 2,
            y: 50,
            diameter: 16
        };
        this.obstacle = {
            x: 150,
            y: 300,
            width: 300,
            height: 10
        };
    }

    setup() {
        // Canvas
        p5i.createCanvas(this.config.width, this.config.height);
        p5i.pixelDensity(1);

        // p5 Initial State
        this.setP5InitialState();

        // Debug element
        let debugContainer = p5i.select('#debugContainer');
        debugContainer.style('width', this.config.width.toString() + 'px');
        debugContainer.style('height', this.config.height.toString() + 'px');

        this.debugDiv = p5i.select('#debug');

        let settingsContainer = p5i.select('#settingsContainer');
        settingsContainer.style('width', this.config.width.toString() + 'px');
        settingsContainer.style('height', this.config.height.toString() + 'px');

        this.settingsDiv = p5i.select('#settings');
        p5i.createElement('label', 'Seed: ').parent(this.settingsDiv);
        this.seedInput = p5i.createInput(this.config.seed);
        this.seedInput.size(30);
        this.seedInput.parent(this.settingsDiv);

        p5i.createElement('label', 'Pop Size: ').parent(this.settingsDiv);
        this.popSizeInput = p5i.createInput(this.config.popSize);
        this.popSizeInput.size(30);
        this.popSizeInput.parent(this.settingsDiv);

        p5i.createElement('label', 'Life Span: ').parent(this.settingsDiv);
        this.lifeSpanInput = p5i.createInput(this.config.lifeSpan);
        this.lifeSpanInput.size(30);
        this.lifeSpanInput.parent(this.settingsDiv);

        let controlContainer = p5i.select('#controlContainer');
        controlContainer.style('width', this.config.width.toString() + 'px');
        controlContainer.style('height', this.config.height.toString() + 'px');

        this.controlDiv = p5i.select('#control');
        this.pauseUnpauseButton = p5i.createButton('||>');
        this.pauseUnpauseButton.parent(this.controlDiv);
        this.pauseUnpauseButton.mousePressed(() => {
            this.paused = !this.paused;
        });
        this.resetButton = p5i.createButton('reset');
        this.resetButton.parent(this.controlDiv);
        this.resetButton.mousePressed(() => {
            this.setInitialState(this.seedInput.value(), this.popSizeInput.value(), this.lifeSpanInput.value());
            this.setP5InitialState();
        });

        // p5        
        p5i.draw = this.render.bind(this);

        // Main update loop
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
            FPS: 60,
            popSize: (popSize == null ? 100 : parseInt(popSize)),
            lifeSpan: (lifeSpan == null ? 1600 : parseInt(lifeSpan)),
            seed: (seed == null ? 10 : parseInt(seed))
        };
        this.population = null;
        this.lifeSpanTimer = 0;
        this.generation = 1;
        this.paused = false;
        this.statistics = {};
    }

    setP5InitialState() {
        // Frame rate
        p5i.frameRate(this.config.FPS);

        // Seed random
        p5i.randomSeed(this.config.seed);

        this.population = new Population(this.config.lifeSpan, this.config.popSize);
    }

    update() {
        if (!this.paused) {
            if (this.population) {
                this.lifeSpanTimer++;

                // Statistics counters
                let deaths = 0;
                let hits = 0;
                let lifeSpanSum = 0;
                let distanceSum = 0;

                // Update organisms
                for (let i = 0; i < this.population.organisms.length; i++) {
                    let organism = this.population.organisms[i];
                    organism.update(this.lifeSpanTimer);

                    // Target
                    if (organism.collidesCircle(this.target)) {
                        organism.completed = true;
                    }

                    // Off-screen
                    if (!organism.collidesRect({ x: 0, y: 0, width: this.config.width, height: this.config.height })) {
                        organism.crashed = true;
                    }

                    // Obstacle
                    if (organism.collidesRect(this.obstacle)) {
                        organism.crashed = true;
                    }

                    // Statistics
                    if (organism.crashed) deaths++;
                    if (organism.completed) hits++;

                    lifeSpanSum += organism.lifeSpan;
                    distanceSum += organism.distanceTo(this.target);
                    this.statistics.avgLifeSpans = lifeSpanSum / i;
                    this.statistics.avgDistance = distanceSum / i;
                }

                // Generates a new population if the generation run out of time
                if (this.lifeSpanTimer == this.config.lifeSpan || (deaths + hits) == this.config.popSize) {
                    // Historic statistics
                    this.statistics.avgLifeSpansHist = (typeof (this.statistics.avgLifeSpansHist) != 'undefined' ? [...this.statistics.avgLifeSpansHist, this.statistics.avgLifeSpans.toFixed(2)] : [this.statistics.avgLifeSpans.toFixed(2)]);
                    this.statistics.avgDistanceHist = (typeof (this.statistics.avgDistanceHist) != 'undefined' ? [...this.statistics.avgDistanceHist, this.statistics.avgDistance.toFixed(2)] : [this.statistics.avgDistance.toFixed(2)]);
                    this.statistics.deathsHist = (typeof (this.statistics.deathsHist) != 'undefined' ? [...this.statistics.deathsHist, deaths] : [deaths]);
                    this.statistics.hitsHist = (typeof (this.statistics.hitsHist) != 'undefined' ? [...this.statistics.hitsHist, hits] : [hits]);

                    if (hits > 0 && typeof (this.statistics.firstHit) == 'undefined') this.statistics.firstHit = this.generation;

                    // Population evaluation and selection
                    this.population.evaluate(this.target);
                    this.population.selection();
                    this.generation++;
                    this.lifeSpanTimer = 0;
                }
            }
        }
    }

    render() {
        if (!this.paused) {
            p5i.background(0);

            this.debugDiv.html(
                'Generation: ' + this.generation +
                '<br/> Timer: ' + this.lifeSpanTimer +
                '<br/> Deaths: ' + this.population.organisms.reduce((crashes, organism) => { return crashes + (organism.crashed ? 1 : 0); }, 0) + ' ' + (typeof (this.statistics.deathsHist) != 'undefined' ? '<img src="http://chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.deathsHist.slice(-250).join(',') + '"/>' : '') +
                '<br/> Hits: ' + this.population.organisms.reduce((hits, organism) => { return hits + (organism.completed ? 1 : 0); }, 0) + ' ' + (typeof (this.statistics.hitsHist) != 'undefined' ? '<img src="http://chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.hitsHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.avgLifeSpans) != 'undefined' ? '<br/> Avg Life Span: ' + this.statistics.avgLifeSpans.toFixed(2) : '') + ' ' + (typeof (this.statistics.avgLifeSpansHist) != 'undefined' ? '<img src="http://chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.avgLifeSpansHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.avgDistance) != 'undefined' ? '<br/> Avg Distance: ' + this.statistics.avgDistance.toFixed(2) : '') + ' ' + (typeof (this.statistics.avgDistanceHist) != 'undefined' ? '<img src="http://chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.avgDistanceHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.firstHit) != 'undefined' ? '<br/> 1st Hit: Gen ' + this.statistics.firstHit : '')
            );

            // Target
            p5i.fill(p5i.color('red'));
            p5i.ellipse(this.target.x, this.target.y, this.target.diameter);

            // Obstacle
            p5i.fill(255);
            p5i.rect(this.obstacle.x, this.obstacle.y, this.obstacle.width, this.obstacle.height);

            // Create a map of the screen on the first execution setting up obstacles with 0 and paths with 1 based on the color of the screen pixel
            if (FitnessMeasurer.bitMap == null) {
                let bitMap = [];
                p5i.loadPixels();
                for (var x = 0; x < p5i.width; x++) {
                    let row = Array(p5i.height);
                    for (var y = 0; y < p5i.height; y++) {
                        var index = (x + y * p5i.width) * 4;
                        if (p5i.color(255).levels[0] == p5i.pixels[index] &&
                            p5i.color(255).levels[1] == p5i.pixels[index + 1] &&
                            p5i.color(255).levels[2] == p5i.pixels[index + 2] &&
                            p5i.color(255).levels[3] == p5i.pixels[index + 3]) {
                            row[y] = 0;
                        } else {
                            row[y] = 1;
                        }
                    }
                    bitMap.push(row);
                }
                FitnessMeasurer.bitMap = bitMap;
            }

            if (this.population) {
                for (let i = 0; i < this.population.organisms.length; i++) {
                    let organism = this.population.organisms[i];
                    organism.render();
                }
            }
        }
    }
}

module.exports = World;