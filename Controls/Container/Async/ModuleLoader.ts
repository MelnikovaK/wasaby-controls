import libHelper = require("Core/library");
import IoC = require('Core/IoC');

let cache = {};

class ModuleLoader {
    private getFromLib(lib: any, parsedName: any): any {
        let mod = lib;
        let processed = [];
        parsedName.path.forEach(function (property) {
            processed.push(property);
            if (mod && typeof mod === 'object' && property in mod) {
                mod = mod[property];
            } else {
                IoC.resolve("ILogger").error("Async module loading error",
                    'Cannot find module "' + processed.join('.')
                    + '" in library "' + parsedName.name + '".');
            }
        });
        return mod;
    };

    public loadAsync(name: string): any {
        let parsedInfo = libHelper.parse(name);
        let promiseResult;
        if (this.isCached(parsedInfo.name)) {
            if(this.isLoaded(parsedInfo.name)) {
                IoC.resolve("ILogger").error("Module " + parsedInfo.name + ' is already loaded. ' +
                    'Use loadSync to load it synchronous.');
                return new Promise(function(resolve) {
                    resolve(cache[parsedInfo.name]);
                });
            } else {
                promiseResult = cache[parsedInfo.name];
            }
        } else {
            promiseResult = this.requireAsync(parsedInfo.name);
            this.cacheModule(parsedInfo.name, promiseResult);
        }
        promiseResult.then((res) => {
            let module = this.getFromLib(res, parsedInfo);
            this.cacheModule(parsedInfo.name, module);
            return module;
        }, (e) => {
            this.cacheModule(parsedInfo.name, {});
            IoC.resolve("ILogger").error("Couldn't load module " + parsedInfo.name, e);
            return null;
        });
        return promiseResult;
    };

    public loadSync(name: string): any {
        let parsedInfo = libHelper.parse(name);
        let loaded;
        if (this.isCached(parsedInfo.name)) {
            loaded = cache[parsedInfo.name];
        } else {
            try {
                loaded = this.requireSync(parsedInfo.name);
                this.cacheModule(parsedInfo.name, loaded);
            } catch(e) {
                IoC.resolve("ILogger").error("Couldn't load module " + parsedInfo.name, e);
                return null;
            }
        }
        return this.getFromLib(loaded, parsedInfo);
    };

    private cacheModule(name, module) {
        cache[name] = module;
    };

    private isLoaded(name) {
        var cacheValue = cache[name];
        if(cacheValue && !(cacheValue instanceof Promise)) {
            return true;
        }
        return false;
    };

    private isCached(name) {
        return !!cache[name];
    }

    private requireSync(name): any {
        return require(name);
    };

    private requireAsync(name): any {
        return new Promise((resolve, reject) => {
            require([name], resolve, reject);
        });
    };

    public clearCache(): void {
        cache = {};
    }

}

export = ModuleLoader;