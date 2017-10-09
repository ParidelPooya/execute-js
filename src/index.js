class Execute {
    static getByPath(obj, key) {
        if (key.length === 0) {
            return obj;
        }

        let keys = key.split(".");

        for (let i = 0; i < keys.length; i++) {
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

            if (i === keys.length - 1) {
                pointer[keys[i]] = data;
            } else {
                pointer = pointer[keys[i]];
            }
        }

        return obj;
    }

    static spreadify(deepCopy) {
        return function () {
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

        this._actions = {
            default: Execute.defaultAction
        };
        this._options = Execute.spreadify()(defaultOption, options || {});
    }

    static defaultAction(action, executionData, options) {
        return Promise.resolve(action(executionData, options));
    }

    use(middleware) {
        if(!middleware.type) {
            throw new Error("type is missing in middleware contract");
        }

        switch(middleware.type) {
            case "action":
                return this.addActionMiddleware(middleware);
            default:
                throw new Error("Unknown middleware type");
        }
    }

    addActionMiddleware(middleware) {
        if(!middleware.action) {
            throw new Error("middleware action is missing");
        }

        if(!middleware.name) {
            throw new Error("middleware name is missing");
        }

        this._actions[middleware.name] = middleware.action;
        return true;
    }

    run(executionTree, executionData) {
        return this.processSteps(executionTree, executionData);
    }

    goToNextStep(step, executionData) {
        const testResult = typeof step.test === "function"
            ? step.test(executionData) // call the test with the results from the action
            : step.test;

        this._options.logger.info(`Test result: ${testResult}`);
        // get a reference to the next step based on the test result
        const nextStep = step.if[testResult] || step.if.default;

        // TODO: better handeling if the next step is missing.
        return nextStep ?
            this.processSteps(nextStep, executionData) :
            Promise.reject("Unhandled scenario");
    }

    executeStepActionWithRetry(step, executionData) {
        let action = this._actions[step.actionType](step.action, executionData, this._options);

        for (let i = 0; i < step.errorHandling.maxAttempts; i++) {
            action = action.catch((e) => {
                if (step.errorHandling.tryCondition(e)) {
                    this._options.logger.info(`Step: ${step.title} try ${i + 1} failed. Retrying...`);
                    return Promise.resolve(step.action(executionData, this._options));
                }

                return Promise.reject(e);
            });
        }
        return action;
    }

    executeStepActionWithCache(step, executionData) {
        if (step.cache.enable) {
            let cacheKey = step.cache.key(executionData);
            return Promise.resolve(this._options.cache.has(cacheKey))
                .then((hasData) => {
                    console.log("Has Data:", hasData);
                    if (hasData) {
                        return Promise.resolve(this._options.cache.get(cacheKey));
                    } else {
                        return this.executeStepActionWithRetry(step, executionData).then((data) => {
                            return Promise.resolve(this._options.cache.set(cacheKey, data, step.cache.ttl)).then((set_result) => {
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

    executeStepActionAndHandleError(step, executionData) {
        return this.executeStepActionWithCache(step, executionData)
            .catch((e) => {
                return step.errorHandling.continueOnError ?
                    Promise.resolve(step.errorHandling.onErrorResponse) :
                    Promise.reject(e);
            });
    }

    processStep(step, executionData) {

        let _step = Execute.spreadify(true)(Execute.sxecutionTreeDefaultSetting.steps[0], step);
        let allData = Execute.spreadify()(executionData, {});

        this._options.logger.info(`Step: ${_step.title}`);

        return new Promise((resolve, reject) => {

            this.executeStepActionAndHandleError(_step, executionData).then((result) => {

                let _output = Execute.spreadify(true)(
                    Execute.sxecutionTreeDefaultSetting.steps[0].output,
                    _step.output);

                let _result = {};

                if (_output.map.destination.length !== 0) {
                    _result = Execute.addPrefixToPath(_output.map.destination, Execute.getByPath(result, _output.map.source));
                }
                else {
                    _result = Execute.getByPath(result, _output.map.source);
                }

                this._options.logger.info(`Action result: ${JSON.stringify(_result)}`);

                if (_output.accessibleToNextSteps) {
                    allData = Execute.spreadify()(allData, _result);
                }

                // if there's a test defined, then actionResult must be a promise
                // so pass the promise response to goToNextStep
                if ("test" in _step) {
                    this.goToNextStep(_step, allData).then((childResult) => {
                        this._options.logger.info(`Child result: ${JSON.stringify(childResult)}`);

                        let totalResult = Execute.spreadify(true)(result, childResult);

                        _result = {};

                        if (_output.map.destination.length !== 0) {
                            _result = Execute.addPrefixToPath(_output.map.destination, Execute.getByPath(totalResult, _output.map.source));
                        }
                        else {
                            _result = Execute.getByPath(totalResult, _output.map.source);
                        }

                        this._options.logger.info(`Total result: ${JSON.stringify(_result)}`);

                        resolve(_result);
                    }).catch((e) => {
                        reject(e);
                    });
                } else {
                    resolve(_result);
                }
            }).catch((e) => {
                reject(e);
            });

        });
    }

    processSteps(executionTree, executionData) {

        let _executionTree;

        if (Object.prototype.toString.call(executionTree) === "[object Array]") {
            // if executionTree is array then we need to convert it to proper object with all missing properties.
            _executionTree = {
                steps: executionTree
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
    steps: [
        {
            errorHandling: {
                maxAttempts: 0,
                tryCondition: () => true,
                continueOnError: false,
                onErrorResponse: {}
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
            actionType: "default",
            action: () => {
                return {};
            }
        }
    ]
};

module.exports = Execute;
