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
    }

    constructor(options) {
        let defaultOption = {
            logger: console,
            cache: require("./tiny-cache")
        };

        let _options = Execute.spreadify(defaultOption, options);

        this._logger = _options.logger;
        this._cache = _options.cache;
    }

    static run(executionTree, executionData, options) {

        let execute = new Execute(options ? options : {});

        return execute.processSteps(executionTree, executionData);
    }

    goToNextStep(step, executionData){
        const testResult = typeof step.test === "function"
            ? step.test(executionData) // call the test with the results from the action
            : step.test;

        this._logger.info(`Test result: ${testResult}`);
        // get a reference to the next step based on the test result
        const nextStep = step.if[testResult] || step.if.default;

        if (!nextStep) {
            // TODO: better handeling if the next step is missing.
            return Promise.reject("Unhandled scenario");
        } else {
            // move on to the next step down the tree
            return this.processSteps(nextStep, executionData);
        }
    }

    executeStepActionWithRetry(step, executionData){

        let _retry = Execute.spreadify(
            Execute.sxecutionTreeDefaultSetting.steps[0].retry ,
            step.retry || {});

        let action = Promise.resolve(step.action(executionData));

        for(let i = 0; i < _retry.maxAttempts; i++) {
            action = action.catch((e)=> {
                if (_retry.tryCondition(e)){
                    this._logger.info(`Step: ${step.title} try ${i+1} failed. Retrying...`);
                    return Promise.resolve(step.action(executionData));
                }
                else {
                    return Promise.reject(e);
                }
            });
        }

        return action;
    }

    executeStepActionWithCache(step, executionData){

        let _cacheSettings = Execute.spreadify(
            Execute.sxecutionTreeDefaultSetting.steps[0].cache,
            step.cache || {});

        if (_cacheSettings.enable) {
            let cacheKey = _cacheSettings.key(executionData);
            return Promise.resolve(this._cache.has(cacheKey))
                .then((hasData)=> {
                    console.log("Has Data:", hasData);
                    if (hasData) {
                        return Promise.resolve(this._cache.get(cacheKey));
                    } else {
                        return this.executeStepActionWithRetry(step, executionData).then((data)=> {
                            return Promise.resolve(this._cache.set(cacheKey, data, _cacheSettings.ttl)).then((set_result)=> {
                                console.log("Set Data in Cache result:", set_result);
                                return Promise.resolve(data);
                            });
                        });
                    }
                });
        } else {
            return this.executeStepActionWithRetry(step, executionData);
        }
    }

    processStep(step, executionData){

        let _step = Execute.spreadify(Execute.sxecutionTreeDefaultSetting.steps[0], step);
        let allData = Execute.spreadify(executionData, {});

        this._logger.info(`Step: ${_step.title}`);

        return new Promise((resolve, reject) => {

            let actionResult;

            if (_step.action) {
                actionResult = this.executeStepActionWithCache(_step, executionData);
            } else {
                actionResult = Promise.resolve({});
            }

            actionResult.then( (result) => {

                let _output = Execute.spreadify(
                    Execute.sxecutionTreeDefaultSetting.steps[0].output,
                    _step.output);

                let _result = {};

                if (_output.copyResultToDifferentNode !== null) {
                    _result[_output.copyResultToDifferentNode] = result;
                } else {
                    _result = result;
                }

                this._logger.info(`Action result: ${JSON.stringify(_result)}`);

                if (_output.accessibleToNextSteps) {
                    allData = Execute.spreadify(allData, _result);
                }

                // if there's a test defined, then actionResult must be a promise
                // so pass the promise response to goToNextStep
                if ("test" in _step) {
                    this.goToNextStep(_step, allData).then((childResult) => {
                        this._logger.info(`Child result: ${JSON.stringify(childResult)}`);

                        if (_output.copyResultToDifferentNode !== null) {
                            _result[_output.copyResultToDifferentNode] = Execute.spreadify(result, childResult);
                        } else {
                            _result = Execute.spreadify(result, childResult);
                        }

                        this._logger.info(`Total result: ${JSON.stringify(_result)}`);

                        resolve(_result);
                    });
                } else {
                    resolve(_result);
                }

            }).catch( (e)=> {
                reject(e);
            });

        });
    }

    processSteps(executionTree, executionData){

        let _executionTree;

        if( Object.prototype.toString.call( executionTree ) === "[object Array]" ) {
            // if executionTree is array then we need to convert it to proper object with all missing properties.
            _executionTree = {
                steps : executionTree
            };
        } else {
            _executionTree = executionTree;
        }

        _executionTree = Execute.spreadify(Execute.sxecutionTreeDefaultSetting, _executionTree);

        let finalResult = {};

        let allData = Execute.spreadify(executionData, {});


        /*
        // Old way that execute one step at a time (sequential)
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

        let ps = [];
        _executionTree.steps.map((step) => {

            let _step = Execute.spreadify(
                Execute.sxecutionTreeDefaultSetting.steps[0],
                step);

            ps.push(() => {
                return this.processStep(step, allData).then((stepResult) => {

                    let _output = Execute.spreadify(
                        Execute.sxecutionTreeDefaultSetting.steps[0].output,
                        _step.output);

                    if (_output.accessibleToNextSteps) {
                        allData = Execute.spreadify(allData, stepResult);
                    }

                    let _stepResult = {};

                    if (_output.addToResult) {
                        _stepResult = stepResult;
                    }

                    finalResult = Execute.spreadify(finalResult, _stepResult);

                    return finalResult;
                });
            });
        });

        return throttleActions(ps, _executionTree.concurrency).then(() => finalResult);

    }
}

// Because static keyword works only for method
Execute.sxecutionTreeDefaultSetting = {
    concurrency: 1,
    steps:[
        {
            retry: {
                maxAttempts: 1,
                tryCondition: () => true
            },
            cache: {
                enable: false,
                ttl: 60
            },
            output: {
                accessibleToNextSteps: true,
                addToResult: true,
                copyResultToDifferentNode: null
            }
        }
    ]
};

module.exports = Execute.run;