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

    static clone(obj) {
        let copy;

        // Handle the 3 simple types, and null or undefined
        if (typeof(obj) !== "object" || obj === null) {
            return obj;
        }

        // I am only using this clone to clone step default settings
        // So there is no need to handle Date ot Array for now
        // // Handle Date
        // if (obj instanceof Date) {
        //     copy = new Date();
        //     copy.setTime(obj.getTime());
        //     return copy;
        // }
        //
        // // Handle Array
        // if (obj instanceof Array) {
        //     copy = [];
        //     for (let i = 0, len = obj.length; i < len; i++) {
        //         copy[i] = Execute.clone(obj[i]);
        //     }
        //     return copy;
        // }
        //
        // // Handle Object
        // if (obj instanceof Object) {
        //     copy = {};
        //     for (let attr in obj) {
        //         if (obj.hasOwnProperty(attr)) {
        //             copy[attr] = Execute.clone(obj[attr]);
        //         }
        //     }
        //     return copy;
        // }

        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (let i = 0, len = obj.length; i < len; i++) {
                copy[i] = Execute.clone(obj[i]);
            }
            return copy;
        }

        copy = {};
        for (let attr in obj) {
            copy[attr] = Execute.clone(obj[attr]);
        }
        return copy;

    }

    constructor(options) {
        let defaultOption = {
            logger: console,
            cache: require("./tiny-cache")
        };

        // Add all action handlers
        this._actions = {};
        this._actions[Execute.builtinActionType.DEFAULT] =  Execute.defaultAction.bind(this);
        this._actions[Execute.builtinActionType.MAP] = Execute.mapActionHandler.bind(this);
        this._actions[Execute.builtinActionType.CHILD_EXECUTION_TREE] = this.childExecutionTreeHandler.bind(this);

        this._options = Execute.spreadify()(defaultOption, options || {});
    }

    static defaultAction(action, executionData, options) {
        return Promise.resolve(action(executionData, options));
    }

    childExecutionTreeHandler(action, executionData) {
        /*
            action should be a valid execution tree
         */

        return this.executeExecutionTree(action, executionData)
            .then((response) => response.result);

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

    static prepareExecutionTree(executionTree) {

        let _executionTree;

        if (Object.prototype.toString.call(executionTree) === "[object Array]") {
            // if executionTree is array then we need to convert it to proper object with all missing properties.
            _executionTree = {
                steps: executionTree
            };
        } else {
            _executionTree = executionTree;
        }

        _executionTree = Execute.spreadify(true)(Execute.executionTreeDefaultSetting, _executionTree);

        _executionTree.steps.forEach((step, ipos) => {
            _executionTree.steps[ipos] = Execute.prepareExecutionTreeStep(step);
        });

        return _executionTree;
    }

    static prepareExecutionTreeStep(step) {
        let _step = Execute.spreadify(true)(Execute.clone(Execute.stepDefaultSetting), step);

        if (typeof(_step.if) !== "undefined") {
            Object.keys(_step.if).forEach((cond) => {
                if (typeof(_step.if[cond]) === "object") {
                    _step.if[cond] = this.prepareExecutionTree(_step.if[cond]);
                }
            });
        }

        if (_step.actionType === Execute.builtinActionType.CHILD_EXECUTION_TREE) {
            _step.action = this.prepareExecutionTree(_step.action);
        }

        return _step;
    }

    static extractStatistics(executionTree){
        let data = {
            steps:[]
        };

        executionTree.steps.forEach((step, ipos) => {
            data.steps.push({});

            let statStep = data.steps[ipos];

            statStep.title = step.title;
            statStep.statistics = step.statistics;
            if (statStep.statistics.count !== 0) {
                statStep.statistics.avg = statStep.statistics.total / statStep.statistics.count;
            }

            if (statStep.statistics.cache.missesNo !== 0) {
                statStep.statistics.cache.missesAvg =
                    statStep.statistics.cache.missesTotal / statStep.statistics.cache.missesNo;
            }

            if (statStep.statistics.cache.hitsNo !== 0) {
                statStep.statistics.cache.hitsAvg =
                    statStep.statistics.cache.hitsTotal / statStep.statistics.cache.hitsNo;
            }

            if(typeof(step.if) !== "undefined") {
                statStep.if = {};

                Object.keys(step.if).forEach((cond) => {
                    if (typeof(step.if[cond]) === "object") {
                        statStep.if[cond] = Execute.extractStatistics(step.if[cond]);
                    }
                });
            }
        });

        return Execute.clone(data);
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
        return this.executeExecutionTree(executionTree, executionData)
            .then((response) => response.result);
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
                this.executeExecutionTree(nextStep, executionData) :
                Promise.reject("Unhandled scenario");
        }
    }

    executeStepActionWithRetry(step, executionData) {

        let retryPromise = (tries)=> {
            let action = this._actions[step.actionType](step.action, executionData, this._options);

            return Promise.resolve(action).catch( (err) => {
                // update statistics
                step.statistics.errors++;

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
            let startTime = new Date();

            return this._options.cache.get(cacheKey)
                .then((data) => {
                    if (data !== undefined) {
                        // update statistics
                        console.log("Data exist in cache");
                        step.statistics.cache.hitsNo++;

                        step.statistics.cache.hitsTotal += (new Date() - startTime);
                        return data;
                    } else {
                        console.log("Data is not exist in cache");

                        // update statistics
                        step.statistics.cache.missesNo++;
                        startTime = new Date();

                        return this.executeStepActionWithRetry(step, executionData).then((data) => {
                            return this._options.cache.set(cacheKey, data, step.cache.ttl)
                                .then((set_result) => {
                                    console.log("Set Data in Cache result:", set_result);
                                    step.statistics.cache.missesTotal += (new Date() - startTime);
                                    return data;
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

        this._options.logger.info(`Step: ${step.title}`);

        if ("test" in step) {
            // if there's a test defined, then actionResult must be a promise
            // so pass the promise response to goToNextStep

            return this.goToNextStep(step, executionData).then((childResponse) => {
                this._options.logger.info(`Child result: ${JSON.stringify(childResponse.result)}`);

                childResponse.result = Execute.getByPath(childResponse.result, step.output.map.source);

                this._options.logger.info(`Total result: ${JSON.stringify(childResponse.result)}`);

                return childResponse;
            });
        } else {
            // Only executing action when there is no test.
            // By this we can improve performance because we don't need to
            // combine the result of action and test
            return this.executeStepActionAndHandleError(step, executionData).then((result) => {

                let _result = Execute.getByPath(result, step.output.map.source);

                this._options.logger.info(`Action result: ${JSON.stringify(_result)}`);

                return {result: _result, signal: Execute.executionMode.CONTINUE};
            });
        }
    }

    recordStatistics(step, processTime) {
        step.statistics.count++;

        step.statistics.min = Math.min(processTime, step.statistics.min);
        step.statistics.max = Math.max(processTime, step.statistics.max);

        step.statistics.total += processTime;
    }

    executeExecutionTreeSteps(executionTree, executionData) {
        let finalResult = {};
        let finalSignal = Execute.executionMode.CONTINUE;

        let i = 0;
        let listOfPromises = [];

        let ps = [];
        executionTree.steps.map((step) => {

            ps.push(() => {
                let startTime = new Date();

                return this.processStep(step, executionData)
                    .then(response => {
                        let processTime = (new Date() - startTime);
                        this.recordStatistics(step, processTime);

                        finalSignal = Math.max(finalSignal, response.signal);

                        if (step.output.accessibleToNextSteps) {
                            if (step.output.map.destination.length !== 0) {
                                executionData = Execute.spreadify()(executionData, Execute.addPrefixToPath(step.output.map.destination, response.result));
                            }
                            else {
                                executionData = Execute.spreadify()(executionData, response.result);
                            }
                        }

                        let _stepResult = {};

                        if (step.output.addToResult) {
                            if (step.output.map.destination.length !== 0) {
                                _stepResult = Execute.addPrefixToPath(step.output.map.destination, response.result);
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

        while (i < executionTree.concurrency && i < ps.length) {
            listOfPromises.push(doNextAction());
        }
        return Promise.all(listOfPromises).then(() => {
            return {
                result: finalResult,
                signal: finalSignal === Execute.executionMode.STOP_ENTIRE_EXECUTION ?
                    finalSignal : Execute.executionMode.CONTINUE
            };
        });
    }

    executeExecutionTreeWithRetry(executionTree, executionData) {
        let retryPromise = (tries)=> {

            return this.executeExecutionTreeSteps(executionTree, executionData)
                .catch( (err) => {
                    // update statistics
                    executionTree.statistics.errors++;

                    if (--tries > 0 && executionTree.errorHandling.tryCondition(err)) {
                        this._options.logger.warn(`Execution Tree: ${executionTree.title} failed. Retrying.`);

                        return retryPromise(tries);
                    } else {
                        this._options.logger.error(`Execution Tree: ${executionTree.title} failed.`);

                        return Promise.reject(err);
                    }
                });
        };
        return retryPromise(executionTree.errorHandling.maxAttempts);
    }

    executeExecutionTreeWithCache(executionTree, executionData) {
        if (executionTree.cache.enable) {

            let cacheKey = executionTree.cache.key(executionData);
            let startTime = new Date();

            return this._options.cache.get(cacheKey)
                .then((data) => {
                    if (data !== undefined) {
                        console.log("Data exist in cache");

                        // update statistics
                        executionTree.statistics.cache.hitsNo++;
                        executionTree.statistics.cache.hitsTotal += (new Date() - startTime);

                        return data;
                    } else {
                        console.log("Data is not exist in cache");

                        // update statistics
                        executionTree.statistics.cache.missesNo++;
                        startTime = new Date();

                        return this.executeExecutionTreeWithRetry(executionTree, executionData).then((data) => {
                            return this._options.cache.set(cacheKey, data, executionTree.cache.ttl)
                                .then((set_result) => {
                                    console.log("Set Data in Cache result:", set_result);
                                    executionTree.statistics.cache.missesTotal += (new Date() - startTime);
                                    return data;
                                });
                        });
                    }
                });
        } else {
            return this.executeExecutionTreeWithRetry(executionTree, executionData);
        }
    }

    executeExecutionTree(executionTree, executionData) {
        return this.executeExecutionTreeWithCache(executionTree, executionData)
            .catch((e) => {
                return Promise.resolve(executionTree.errorHandling.onError(e ,executionData, this._options))
                    .then( (data)=> {
                        if (executionTree.errorHandling.continueOnError) {
                            return {
                                result: data,
                                signal: Execute.executionMode.CONTINUE
                            };
                        } else {
                            return Promise.reject(e);
                        }
                    });
            });
    }

}

// Because static keyword works only for method
Execute.executionMode = {
    CONTINUE: 0,
    STOP_LEVEL_EXECUTION: 1,
    STOP_ENTIRE_EXECUTION: 2
};

Execute.builtinActionType = {
    DEFAULT: "default",
    MAP: "map",
    CHILD_EXECUTION_TREE: "execution-tree"
};

Execute.executionTreeDefaultSetting = {
    title: "No name execution tree",
    concurrency: 1,
    cache: {
        enable: false,
        ttl: 60
    },
    errorHandling: {
        maxAttempts: 0,
        tryCondition: () => true,
        continueOnError: false,
        onError: () => ({})
    },
    statistics:{
        count:0,
        total:0,
        min: Number.MAX_VALUE,
        max:0,
        errors:0,
        cache: {
            missesNo: 0,
            missesTotal: 0,

            hitsNo:0,
            hitsTotal: 0
        }
    }
};


Execute.stepDefaultSetting = {
    title: "No name step",
    errorHandling: {
        maxAttempts: 0,
        tryCondition: () => true,
        continueOnError: false,
        onError: () => ({})
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
    action: () => ({}),
    statistics:{
        count:0,
        total:0,
        min: Number.MAX_VALUE,
        max:0,
        errors:0,
        cache: {
            missesNo: 0,
            missesTotal: 0,

            hitsNo:0,
            hitsTotal: 0
        }
    }
};

module.exports = Execute;
