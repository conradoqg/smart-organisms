const Population = require('./population.js');
const PluginManager = require('./pluginManager.js');
const Mitt = require('mitt');

class World {
    constructor() {
        this.setInitialState();
        this.config = {
            width: 600,
            height: 600,
            FPS: 60,
            popSize: 100,
            lifeSpan: 1600,
            seed: 10,
            speed: 5
        };
        this.target = {
            x: this.config.width / 2,
            y: 50,
            diameter: 20
        };

        this.emitter = new Mitt();
        PluginManager.registerEmitter('world', this.emitter);
        PluginManager.activate('aStarFitness');
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

        p5i.createElement('br').parent(this.settingsDiv);
        p5i.createElement('label', 'Speed: ').parent(this.settingsDiv);
        this.speedSlider = p5i.createSlider(0, 200, this.config.speed);
        this.speedSlider.style('width', '210px');
        this.speedSlider.parent(this.settingsDiv);
        this.speedSlider.mouseMoved(() => {
            this.config.speed = this.speedSlider.value();
        });

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
        this.resetButton.mousePressed(this.reset.bind(this));

        p5i.createElement('br').parent(this.settingsDiv);

        p5i.createElement('label', 'Fitness Calculator: ').parent(this.settingsDiv);
        this.fitnessCalculatorSelect = p5i.createSelect();
        this.fitnessCalculatorSelect.option('A*');
        this.fitnessCalculatorSelect.option('Weighted');
        this.fitnessCalculatorSelect.option('Direct Distance');
        this.fitnessCalculatorSelect.changed(() => {
            let selected = this.fitnessCalculatorSelect.value();

            if (selected == 'A*') {
                PluginManager.deactivate('weightedFitness');
                PluginManager.activate('aStarFitness');
            } else if (selected == 'Weighted') {
                PluginManager.deactivate('aStarFitness');
                PluginManager.activate('weightedFitness');
            } else if (selected == 'Direct Distance') {
                PluginManager.deactivate('aStarFitness');
                PluginManager.deactivate('weightedFitness');
            }
        });
        this.fitnessCalculatorSelect.parent(this.settingsDiv);

        // p5        
        p5i.draw = this.render.bind(this);

        // Main update loop
        this.update();
    }

    setInitialState() {
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

        this.world = {};
        this.world.type = 'rect';
        this.world.size = { width: this.config.width, height: this.config.height };
        this.world.pos = p5i.createVector(0, 0);
        this.world.mode = p5i.CORNER;
        this.world.movement = {};
        this.world.movement.vel = p5i.createVector();
        this.world.movement.acc = p5i.createVector();
        this.world.movement.heading = null;
        this.world.coors = p5i.getCoorsFromRect(this.world.pos.x, this.world.pos.y, this.world.size.width, this.world.size.height, this.world.mode, this.world.movement.heading);

        this.target = {};
        this.target.type = 'ellipse';
        this.target.size = { diameter: 20 };
        this.target.pos = p5i.createVector(p5i.width / 2, 50);
        this.target.mode = p5i.CENTER;

        this.obstacle1 = {};
        this.obstacle1.type = 'rect';
        this.obstacle1.size = { width: 300, height: 10 };
        this.obstacle1.pos = p5i.createVector(p5i.width / 2, (p5i.height / 2) + (p5i.height / 4));
        this.obstacle1.mode = p5i.CENTER;
        this.obstacle1.movement = {};
        this.obstacle1.movement.vel = p5i.createVector();
        this.obstacle1.movement.acc = p5i.createVector();
        this.obstacle1.movement.heading = this.obstacle1.movement.vel.heading();
        this.obstacle1.coors = p5i.getCoorsFromRect(this.obstacle1.pos.x, this.obstacle1.pos.y, this.obstacle1.size.width, this.obstacle1.size.height, this.obstacle1.mode, this.obstacle1.movement.heading);

        this.obstacle2 = {};
        this.obstacle2.type = 'rect';
        this.obstacle2.size = { width: 150, height: 5 };
        this.obstacle2.pos = p5i.createVector((p5i.width / 2) / 2, (p5i.height / 3));
        this.obstacle2.mode = p5i.CENTER;
        this.obstacle2.movement = {};
        this.obstacle2.movement.vel = p5i.createVector();
        this.obstacle2.movement.acc = p5i.createVector();
        this.obstacle2.movement.heading = p5i.PI + p5i.QUARTER_PI;
        this.obstacle2.coors = p5i.getCoorsFromRect(this.obstacle2.pos.x, this.obstacle2.pos.y, this.obstacle2.size.width, this.obstacle2.size.height, this.obstacle2.mode, this.obstacle2.movement.heading);

        this.obstacle3 = {};
        this.obstacle3.type = 'rect';
        this.obstacle3.size = { width: 150, height: 5 };
        this.obstacle3.pos = p5i.createVector((p5i.width / 2) + (p5i.height / 4), (p5i.height / 3));
        this.obstacle3.mode = p5i.CENTER;
        this.obstacle3.movement = {};
        this.obstacle3.movement.vel = p5i.createVector();
        this.obstacle3.movement.acc = p5i.createVector();
        this.obstacle3.movement.heading = p5i.PI - p5i.QUARTER_PI;
        this.obstacle3.coors = p5i.getCoorsFromRect(this.obstacle3.pos.x, this.obstacle3.pos.y, this.obstacle3.size.width, this.obstacle3.size.height, this.obstacle3.mode, this.obstacle3.movement.heading);

        this.obstacles = [this.obstacle1, this.obstacle2, this.obstacle3];
    }

    reset() {
        this.config.seed = parseInt(this.seedInput.value());
        this.config.popSize = parseInt(this.popSizeInput.value());
        this.config.lifeSpan = parseInt(this.lifeSpanInput.value());
        this.setInitialState();
        this.setP5InitialState();
        this.emitter.emit('afterReset', this);
    }

    update() {
        Promise
            .resolve()
            .then(() => {
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
                                organism.lifeSpan = this.config.lifeSpan;
                            }

                            // Off-screen
                            if (organism.collidesRect(this.world)) {
                                organism.crashed = true;
                            }

                            // Obstacles
                            for (var index = 0; index < this.obstacles.length; index++) {
                                var obstacle = this.obstacles[index];
                                if (organism.collidesRect(obstacle)) {
                                    organism.crashed = true;
                                }
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
                            if (hits >= 50 && typeof (this.statistics.fiftiethHit) == 'undefined') this.statistics.fiftiethHit = this.generation;
                            if (typeof (this.statistics.maxHits) == 'undefined') {
                                this.statistics.maxHits = hits;
                            } else {
                                this.statistics.maxHits = Math.max(hits, this.statistics.maxHits);
                            }

                            // Population evaluation and selection
                            return this.population.evaluate(this.target).then(() => {
                                this.population.selection();
                                this.generation++;
                                this.lifeSpanTimer = 0;
                            });
                        }
                    }
                }
            }).then(() => {
                if (this.config.speed <= 1) {
                    setImmediate(() => { this.update(); });
                } else {
                    setTimeout(() => { this.update(); }, this.config.speed);
                }
            });
    }

    render() {
        if (!this.paused) {
            p5i.background(0);

            this.debugDiv.html(
                'Generation: ' + this.generation +
                '<br/> Timer: ' + this.lifeSpanTimer +
                '<br/> Deaths: ' + this.population.organisms.reduce((crashes, organism) => { return crashes + (organism.crashed ? 1 : 0); }, 0) + ' ' + (typeof (this.statistics.deathsHist) != 'undefined' ? '<img src="//chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.deathsHist.slice(-250).join(',') + '"/>' : '') +
                '<br/> Hits: ' + this.population.organisms.reduce((hits, organism) => { return hits + (organism.completed ? 1 : 0); }, 0) + ' ' + (typeof (this.statistics.hitsHist) != 'undefined' ? '<img src="//chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.hitsHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.avgLifeSpans) != 'undefined' ? '<br/> Avg Life Span: ' + this.statistics.avgLifeSpans.toFixed(2) : '') + ' ' + (typeof (this.statistics.avgLifeSpansHist) != 'undefined' ? '<img src="//chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.avgLifeSpansHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.avgDistance) != 'undefined' ? '<br/> Avg Distance: ' + this.statistics.avgDistance.toFixed(2) : '') + ' ' + (typeof (this.statistics.avgDistanceHist) != 'undefined' ? '<img src="//chart.googleapis.com/chart?chs=50x14&cht=ls&chf=bg,s,00000000&chco=0077CC&chds=a&chd=t:' + this.statistics.avgDistanceHist.slice(-250).join(',') + '"/>' : '') +
                (typeof (this.statistics.maxHits) != 'undefined' ? '<br/> Max Hits: ' + this.statistics.maxHits : '') +
                (typeof (this.statistics.firstHit) != 'undefined' ? '<br/> 1st Hit: Gen ' + this.statistics.firstHit : '') +
                (typeof (this.statistics.fiftiethHit) != 'undefined' ? '<br/> 50th Hit: Gen ' + this.statistics.fiftiethHit : '')

            );

            // Target
            p5i.fill(p5i.color('red'));
            p5i.ellipse(this.target.pos.x, this.target.pos.y, this.target.size.diameter);

            // Obstacles
            p5i.fill(255);
            for (var index = 0; index < this.obstacles.length; index++) {
                var obstacle = this.obstacles[index];
                p5i.quad(obstacle.coors[0].x, obstacle.coors[0].y, obstacle.coors[1].x, obstacle.coors[1].y, obstacle.coors[2].x, obstacle.coors[2].y, obstacle.coors[3].x, obstacle.coors[3].y);
            }

            // Population
            if (this.population) {
                for (let i = 0; i < this.population.organisms.length; i++) {
                    let organism = this.population.organisms[i];
                    organism.render();
                }
            }

            this.emitter.emit('afterRender', this);
        }
    }
}

module.exports = World;