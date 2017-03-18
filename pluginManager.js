let emitters = new Map();
let pluginEmitter = new mitt();

class PluginManager {
    static getEmitter() {
        return pluginEmitter;
    }

    static registerEmitter(type, emitter) {
        emitters.set(type, emitter);
        emitter.on('*', (evt, ...args) => pluginEmitter.emit(type + '-' + evt, ...args));
    }

    static activate(pluginID) {
        pluginEmitter.emit('pluginManager' + '-' + 'activate', pluginID);
    }

    static deactivate(pluginID) {
        pluginEmitter.emit('pluginManager' + '-' + 'deactivate', pluginID);
    }
}

module.exports = PluginManager;