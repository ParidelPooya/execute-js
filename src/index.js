"use strict";

class Execute {
    static spreadify() {
        // Holds the processed arguments for use by `fn`
        let spreadArgs = {};

        // Caching length
        let length = arguments.length;

        let currentArg;

        for (let i = 0; i < length; i++) {
            currentArg = arguments[i];

            Object.keys(currentArg).map((key) => {
                spreadArgs[key] = currentArg[key];
            });
        }

        return spreadArgs;
    };

    constructor(options) {
        let defaultOption = {
            logger: console,
            cache: require("./tiny-cache")
        };

        let _options = Execute.spreadify(defaultOption, options);

        this._logger = _options.logger;
        this._cache = _options.cache;
    };

    static run(executionTree, executionData, options) {

        let execute = new Execute(options ? options : {});

        return execute.processSteps(executionTree, executionData);
    };

    goToNextStep(step, executionData){
        const testResult = typeof step.test === 'function'
            ? step.test(executionData) // call the test with the results from the action
            : step.test;

        this._logger.info(`Test result: ${testResult}`);
        // get a reference to the next step based on the test result
        const nextStep = step.if[testResult] || step.if.default;

        if (!nextStep) {
            reject('Unhandled scenario');
        } else {
            // move on to the next step down the tree
            return this.processSteps(nextStep, executionData);
        }
    };

    executeStepAction(step, executionData){
        const defaultCacheSettings = {
            enable: false,
            ttl: 60
        };

        let _cacheSettings = Execute.spreadify(defaultCacheSettings, step.cache || {});

        if (_cacheSettings.enable) {
            let cacheKey = _cacheSettings.key(executionData);
            return Promise.resolve(this._cache.has(cacheKey))
                .then((hasData)=> {
                    console.log("Has Data:", hasData);
                    if (hasData) {
                        return Promise.resolve(this._cache.get(cacheKey));
                    } else {
                        return Promise.resolve(step.action(executionData)).then((data)=> {
                            return Promise.resolve(this._cache.set(cacheKey, data, _cacheSettings.ttl)).then((set_result)=> {
                                console.log("Set Data in Cache result:", set_result);
                                return Promise.resolve(data);
                            });
                        });
                    }
            })
        } else {
            return Promise.resolve(step.action(executionData));
        }

    };

    processStep(step, executionData){

        const defaultStepSettings = {
            retry: 1
        };
        let _step = Execute.spreadify(defaultStepSettings, step);
        let allData = Execute.spreadify(executionData, {});

        return new Promise((resolve, reject) => {

            if (_step.action) {
                this._logger.info(`Step: ${_step.title}`);

                let actionResult = this.executeStepAction(_step, executionData);

                for(let i = 0; i < _step.retry; i++) {
                    actionResult = actionResult.catch(()=> {
                        this._logger.info(`Step: ${_step.title} try ${i+1} failed. Retrying...`);
                        return _step.action(executionData);
                    });
                }

                actionResult.then( (result) => {

                    this._logger.info(`Action result: ${JSON.stringify(result)}`);

                    allData = Execute.spreadify(allData, result);

                    // if there's a test defined, then actionResult must be a promise
                    // so pass the promise response to goToNextStep
                    if ('test' in _step) {
                        this.goToNextStep(_step, allData).then((childResult) => {
                            this._logger.info(`Child result: ${JSON.stringify(childResult)}`);

                            let totalResult = Execute.spreadify(result, childResult);
                            this._logger.info(`Total result: ${JSON.stringify(totalResult)}`);

                            resolve(totalResult);
                        });
                    } else {
                        resolve(result);
                    }

                }).catch( (e)=> {
                    reject(e);
                });

            } else {
                this._logger.info(`Step: ${_step.title}`);

                if ('test' in _step) {
                    this.goToNextStep(_step, allData).then((childResult) => {
                        this._logger.info(`Child result: ${JSON.stringify(childResult)}`);
                        this._logger.info(`Total result: ${JSON.stringify(Execute.spreadify(childResult) )}`);
                        resolve(childResult);
                    });
                } else {
                    resolve();
                }
            }
        });
    };

    processSteps(executionTree, executionData){

        let _executionTree;

        if( Object.prototype.toString.call( executionTree ) === '[object Array]' ) {
            // if executionTree is array then we need to convert it to proper object with all missing properties.
            _executionTree = {
                steps : executionTree
            };
        } else {
            _executionTree = executionTree;
        }

        const defaultExecutionTreeSettings = {
            concurrency: 1
        };

        _executionTree = Execute.spreadify(defaultExecutionTreeSettings, _executionTree);

        let finalResult = {};

        let allData = Execute.spreadify(executionData, {});


        /*
        return new Promise((resolve, reject) => {
            _executionTree.steps.reduce((allStepsSoFar, next) => {

                return allStepsSoFar.then(() => {
                    return this.processStep(next, allData).then((stepResult) => {
                        finalResult = Execute.spreadify(finalResult, stepResult);
                        allData = Execute.spreadify(allData, stepResult);
                        return finalResult;
                    }).catch( (e)=> {reject(e)})
                });

            }, Promise.resolve()).then(() => {resolve(finalResult)});
        });
        */
        let throttleActions = require("./throttle-actions");

        var ps = [];
        _executionTree.steps.map((step) => {
            ps.push(() => {
                return this.processStep(step, allData).then((stepResult) => {
                    finalResult = Execute.spreadify(finalResult, stepResult);
                    allData = Execute.spreadify(allData, stepResult);
                    return finalResult;
                });
            });
        });

        return throttleActions(ps, _executionTree.concurrency).then(() => finalResult);

    };
}

module.exports = Execute.run;
