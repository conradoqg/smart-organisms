class FitnessMeasurer {
    static method1(organism, target) {
        var invertedDistance = Math.abs(p5i.width - organism.distanceTo(target));
        
        if (organism.completed) {
            return invertedDistance *= 10;
        }
        if (organism.crashed) {
            return invertedDistance /= 10;
        }
    }    
}

module.exports = FitnessMeasurer;