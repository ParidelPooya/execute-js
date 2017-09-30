class Execute {
    static getByPath(obj, key) {
        if (key.length === 0) {
            return obj;
        }

        let keys = key.split(".");

        for (let i = 0; i < keys.length; i++) {
            // if (typeof(obj.key) === "undefined") {
            //     obj.key = {};
            // }
            obj = obj[keys[i]];
        }

        return obj;
    }
    
    static addPrefixToPath(path, data) {
        let obj = {};
        let pointer = obj;

        let keys = path.split(".");

        for (let i = 0; i < keys.length; i++) {
            pointer[keys[i]] = {};

            if(i === keys.length -1){
                pointer[keys[i]] = data;
            } else {
                pointer = pointer[keys[i]];
            }
        }

        return obj;
    }


    static spreadify(deepCopy) {
        return function(){
            // Holds the processed arguments for use by `fn`
            let spreadArgs = {};

            // Caching length
            let length = arguments.length;

            let currentArg;

            for (let i = 0; i < length; i++) {
                currentArg = arguments[i];

                Object.keys(currentArg).map((key) => {
                    if (deepCopy &&
                        typeof(spreadArgs[key]) === "object" && spreadArgs[key] !== null &&
                        currentArg[key] !== null

                    ) {
                        spreadArgs[key] = Execute.spreadify(deepCopy)(spreadArgs[key], currentArg[key]);
                    } else {
                        spreadArgs[key] = currentArg[key];
                    }
                });
            }
            return spreadArgs;
        };
    }

    constructor(options) {
        let defaultOption = {
            logger: console,
            cache: require("./tiny-cache")
        };

        let _options = Execute.spreadify()(defaultOption, options);

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

        let _errorHandling = Execute.spreadify()(
            Execute.sxecutionTreeDefaultSetting.steps[0].errorHandling ,
            step.errorHandling);

        let action = Promise.resolve(step.action(executionData));

        for(let i = 0; i < _errorHandling.maxAttempts; i++) {
            action = action.catch((e)=> {
                if (_errorHandling.tryCondition(e)){
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

        let _cacheSettings = Execute.spreadify()(
            Execute.sxecutionTreeDefaultSetting.steps[0].cache,
            step.cache);

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

        let _step = Execute.spreadify()(Execute.sxecutionTreeDefaultSetting.steps[0], step);
        let allData = Execute.spreadify()(executionData, {});

        this._logger.info(`Step: ${_step.title}`);

        return new Promise((resolve, reject) => {

            this.executeStepActionWithCache(_step, executionData).then( (result) => {

                let _output = Execute.spreadify(true)(
                    Execute.sxecutionTreeDefaultSetting.steps[0].output,
                    _step.output);

                let _result = {};

                if (_output.map.destination.length !== 0){
                    _result = Execute.addPrefixToPath(_output.map.destination, Execute.getByPath(result, _output.map.source));
                    // Execute.copyToPath(_result, _output.map.destination, Execute.getByPath(result, _output.map.source));
                }
                else {
                    _result = Execute.getByPath(result, _output.map.source);
                }

                this._logger.info(`Action result: ${JSON.stringify(_result)}`);

                if (_output.accessibleToNextSteps) {
                    allData = Execute.spreadify()(allData, _result);
                }

                // if there's a test defined, then actionResult must be a promise
                // so pass the promise response to goToNextStep
                if ("test" in _step) {
                    this.goToNextStep(_step, allData).then((childResult) => {
                        this._logger.info(`Child result: ${JSON.stringify(childResult)}`);

                        let totalResult = Execute.spreadify(true)(result, childResult);

                        _result = {};

                        if (_output.map.destination.length !== 0){
                            _result = Execute.addPrefixToPath(_output.map.destination, Execute.getByPath(totalResult, _output.map.source));
                            //Execute.copyToPath(_result, _output.map.destination, Execute.getByPath(totalResult, _output.map.source));
                        }
                        else {
                            _result = Execute.getByPath(totalResult, _output.map.source);
                        }

                        /*
                        if (_output.copyResultToDifferentNode !== null) {
                            _result[_output.copyResultToDifferentNode] = Execute.spreadify()(result, childResult);
                        } else {
                            _result = Execute.spreadify()(result, childResult);
                        }
                        */

                        this._logger.info(`Total result: ${JSON.stringify(_result)}`);

                        resolve(_result);
                    }).catch((e)=>{
                        reject(e);
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

        _executionTree = Execute.spreadify()(Execute.sxecutionTreeDefaultSetting, _executionTree);

        let finalResult = {};
        let allData = Execute.spreadify()(executionData, {});
        let throttleActions = require("./throttle-actions");

        let ps = [];
        _executionTree.steps.map((step) => {

            let _step = Execute.spreadify()(
                Execute.sxecutionTreeDefaultSetting.steps[0],
                step);

            ps.push(() => {
                return this.processStep(step, allData).then((stepResult) => {

                    let _output = Execute.spreadify()(
                        Execute.sxecutionTreeDefaultSetting.steps[0].output,
                        _step.output);

                    if (_output.accessibleToNextSteps) {
                        allData = Execute.spreadify()(allData, stepResult);
                    }

                    let _stepResult = {};

                    if (_output.addToResult) {
                        _stepResult = stepResult;
                    }

                    finalResult = Execute.spreadify(true)(finalResult, _stepResult);

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
            errorHandling: {
                maxAttempts: 0,
                tryCondition: () => true
            },
            cache: {
                enable: false,
                ttl: 60
            },
            output: {
                accessibleToNextSteps: true,
                addToResult: true,
                map: {
                    source: "",
                    destination: ""
                }
            },
            action: () => {return {};}
        }
    ]
};

module.exports = Execute.run;
