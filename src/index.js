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
            let spreadArgs = {};
            let isArray = true;
            let isEmpty = true;

            for (let i = 0; i < arguments.length; i++) {
                let currentArg = arguments[i];

                if (Array.isArray(currentArg) && isArray ) {
                    if (isEmpty) {
                        spreadArgs = [...currentArg];
                        isEmpty = false;
                    } else {
                        spreadArgs = spreadArgs.concat(currentArg);
                    }
                } else {
                    Object.keys(currentArg).map((key) => {
                        isArray = false;

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

            }
            return spreadArgs;
        };
    }

    constructor(options) {
        let defaultOption = {
            logger: console,
            cache: require("./tiny-cache")
        };

        // Add all action handlers
        this._actions = {
            "default": Execute.defaultAction.bind(this),
            "map": Execute.mapActionHandler.bind(this)
        };

        this._options = Execute.spreadify()(defaultOption, options || {});
    }

    static defaultAction(action, executionData, options) {
        return Promise.resolve(action(executionData, options));
    }

    static mapActionHandler(action, executionData, options) {
        /*
            action should be object with
            {
                array: function that produce an array,
                reducer: child step to execute for each element in the array.
            }
         */
        let final = [];

        return action.array(executionData).reduce((promise, item) => {
            return promise
                .then(() => {
                    return Promise
                        .resolve(action.reducer(item, options))
                        .then(result => {
                            final.push(result);
                            return final;
                        });
                })
                .catch(console.error);

        }, Promise.resolve());
    }

    use(middleware) {
        if (!middleware.type) {
            throw new Error("type is missing in middleware contract");
        }

        switch (middleware.type) {
            case "action":
                return this.addActionMiddleware(middleware);
            default:
                throw new Error("Unknown middleware type");
        }
    }

    addActionMiddleware(middleware) {
        if (!middleware.action) {
            throw new Error("middleware action is missing");
        }

        if (!middleware.name) {
            throw new Error("middleware name is missing");
        }

        this._actions[middleware.name] = middleware.action;
        return true;
    }

    run(executionTree, executionData) {
        return this.processSteps(executionTree, executionData).then((response) => response.result);
    }

    goToNextStep(step, executionData) {
        const testResult = typeof step.test === "function"
            ? step.test(executionData) // call the test with the results from the action
            : step.test;

        this._options.logger.info(`Test result: ${testResult}`);
        // get a reference to the next step based on the test result
        const nextStep = typeof(step.if[testResult]) !=="undefined" ? step.if[testResult] : step.if.default;

        if (typeof(nextStep) === "number") {
            // next step is not an execution tree but a predefined signal
            return Promise.resolve({result: {}, signal: nextStep});
        }
        else {
            // TODO: better handeling if the next step is missing.
            return nextStep ?
                this.processSteps(nextStep, executionData) :
                Promise.reject("Unhandled scenario");
        }
    }

    executeStepActionWithRetry(step, executionData) {

        let retryPromise = (tries)=> {
            let action = this._actions[step.actionType](step.action, executionData, this._options);

            return Promise.resolve(action).catch( (err) => {
                if (--tries > 0 && step.errorHandling.tryCondition(err)) {
                    this._options.logger.warn(`Step: ${step.title} failed. Retrying.`);

                    return retryPromise(tries);
                } else {
                    this._options.logger.error(`Step: ${step.title} action failed.`);

                    return Promise.reject(err);
                }
            });
        };

        return retryPromise(step.errorHandling.maxAttempts);

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

                return Promise.resolve(step.errorHandling.onError(e ,executionData, this._options))
                    .then( (data)=> {
                        if (step.errorHandling.continueOnError) {
                            return data;
                        } else {
                            return Promise.reject(e);
                        }
                    });

            });
    }

    processStep(step, executionData) {

        let _step = Execute.spreadify(true)(Execute.executionTreeDefaultSetting.steps[0], step);
        //let allData = Execute.spreadify()(executionData, {});

        this._options.logger.info(`Step: ${_step.title}`);

        return new Promise((resolve, reject) => {

            let _output = Execute.spreadify(true)(
                Execute.executionTreeDefaultSetting.steps[0].output,
                _step.output);

            if ("test" in _step) {
                // if there's a test defined, then actionResult must be a promise
                // so pass the promise response to goToNextStep

                this.goToNextStep(_step, executionData).then((childResponse) => {
                    this._options.logger.info(`Child result: ${JSON.stringify(childResponse.result)}`);

                    //childResponse.result = Execute.spreadify(true)(result, childResponse.result);

                    // if (_output.map.destination.length !== 0) {
                    //     childResponse.result = Execute.addPrefixToPath(_output.map.destination, Execute.getByPath(childResponse.result, _output.map.source));
                    // }
                    // else {
                    //     childResponse.result = Execute.getByPath(childResponse.result, _output.map.source);
                    // }

                    childResponse.result = Execute.getByPath(childResponse.result, _output.map.source);

                    this._options.logger.info(`Total result: ${JSON.stringify(childResponse.result)}`);

                    resolve(childResponse);
                }).catch((e) => {
                    reject(e);
                });
            } else {
                // Only executing action when there is no test.
                // By this we can improve performance because we don't need to
                // combine the result of action and test
                this.executeStepActionAndHandleError(_step, executionData).then((result) => {

                    let _result = {};

                    // if (_output.map.destination.length !== 0) {
                    //     _result = Execute.addPrefixToPath(_output.map.destination, Execute.getByPath(result, _output.map.source));
                    // }
                    // else {
                    //     _result = Execute.getByPath(result, _output.map.source);
                    // }
                    _result = Execute.getByPath(result, _output.map.source);

                    this._options.logger.info(`Action result: ${JSON.stringify(_result)}`);

                    // if (_output.accessibleToNextSteps) {
                    //     allData = Execute.spreadify(true)(allData, _result);
                    // }

                    resolve({result: _result, signal: Execute.executionMode.CONTINUE});

                }).catch((e) => {
                    reject(e);
                });

            }
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

        _executionTree = Execute.spreadify()(Execute.executionTreeDefaultSetting, _executionTree);

        let finalResult = {};
        let finalSignal = Execute.executionMode.CONTINUE;
        
        let i = 0;
        let listOfPromises = [];

        let ps = [];
        _executionTree.steps.map((step) => {

            let _step = Execute.spreadify()(
                Execute.executionTreeDefaultSetting.steps[0],
                step);

            ps.push(() => {
                return this.processStep(step, executionData)
                    .then(response => {
                        finalSignal = Math.max(finalSignal, response.signal);

                        let _output = Execute.spreadify()(
                            Execute.executionTreeDefaultSetting.steps[0].output,
                            _step.output);

                        if (_output.accessibleToNextSteps) {
                            if (_output.map.destination.length !== 0) {
                                executionData = Execute.spreadify()(executionData, Execute.addPrefixToPath(_output.map.destination, response.result));
                            }
                            else {
                                executionData = Execute.spreadify()(executionData, response.result);
                            }

                        }

                        let _stepResult = {};

                        if (_output.addToResult) {
                            if (_output.map.destination.length !== 0) {
                                _stepResult = Execute.addPrefixToPath(_output.map.destination, response.result);
                            }
                            else {
                                _stepResult = response.result;
                            }
                        }

                        // TODO : this one is expensive
                        finalResult = Execute.spreadify(true)(finalResult, _stepResult);

                        return {result: finalResult, signal: finalSignal};
                    });
            });
        });

        function doNextAction() {
            if (i < ps.length && finalSignal === Execute.executionMode.CONTINUE) {
                return ps[i++]().then(doNextAction);
            }
        }

        while (i < _executionTree.concurrency && i < ps.length) {
            listOfPromises.push(doNextAction());
        }
        return Promise.all(listOfPromises).then(() => {
            return {
                result: finalResult,
                signal: finalSignal === Execute.executionMode.STOP_ENTIRE_EXECUTION ?
                    finalResult : Execute.executionMode.CONTINUE
            };
        });

    }

}

// Because static keyword works only for method
Execute.executionMode = {
    CONTINUE: 0,
    STOP_LEVEL_EXECUTION: 1,
    STOP_ENTIRE_EXECUTION: 2
};

Execute.executionTreeDefaultSetting = {
    concurrency: 1,
    steps: [
        {
            errorHandling: {
                maxAttempts: 0,
                tryCondition: () => true,
                continueOnError: false,
                onError: () => {return {};}
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
