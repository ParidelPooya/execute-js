const Utility = require("./utility");

class Execute {

    constructor(options) {
        let defaultOption = {
            logger: console,
            context: {},
            cache: require("./tiny-cache")
        };

        // check if we have actions
        if (Execute._actions === undefined) {
            Execute._actions = {};
        }
        Execute._actions[Execute.builtinActionType.DEFAULT] =  Execute.defaultAction;
        Execute._actions[Execute.builtinActionType.PROMISE] =  Execute.promiseAction;

        Execute._actions[Execute.builtinActionType.MAP] = Execute.mapActionHandler;
        Execute._actions[Execute.builtinActionType.CHILD_EXECUTION_TREE] = Execute.childExecutionTreeHandler;

        this._options = Utility.spreadify()(defaultOption, options || {});
    }

    static defaultAction(action, executionData, options) {
        return Promise.resolve(action(executionData, options))
            .then((data) => {
                return {result: data, signal: Execute.executionMode.CONTINUE};
            });
    }

    static promiseAction(action, executionData, options) {
        return action(executionData, options)
            .then((data) => {
                return {result: data, signal: Execute.executionMode.CONTINUE};
            });
    }

    static childExecutionTreeHandler(action, executionData) {
        /*
            action should be a object with
            executionTree:  a valid execution tree
            executionData: optional, data to pass to execution tree, if not specified then entire data will pass
         */

        let data = action.executionData ? action.executionData(executionData) : executionData;

        return this.executeExecutionTree(action.executionTree, data);

    }

    static mapActionHandler(action, executionData, options) {
        /*
            action should be object with
            {
                array: function that produce an array,

                reducer: child step to execute for each element in the array.

                executionTree:  instead of reducer we can provide child executionTree to execute
                executionData(data, item): optional, data to pass to execution tree, if not specified then array item will pass.

            }
         */
        let final = [];
        let process;

        if (action.reducer !== undefined) {
            process = action.array(executionData).reduce((promise, item) => promise
                .then(() => {
                    return Promise
                        .resolve(action.reducer(item, options))
                        .then(result => {
                            final.push(result);
                            return final;
                        });
                })
                .catch(console.error)
                , Promise.resolve()
            );
        } else {
            process =  action.array(executionData).reduce((promise, item) => promise
                .then(() => {
                    let data = action.executionData ? action.executionData(executionData, item) : item;

                    return this.executeExecutionTree(action.executionTree, data)
                        .then((response) => {
                            final.push(response.result);
                            return final;
                        });
                })
                , Promise.resolve()
            );
        }

        return process.then((data) => {
            return {result: data, signal: Execute.executionMode.CONTINUE};
        });
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

        _executionTree = Utility.spreadify(true)(
            Utility.clone(Execute.executionTreeDefaultSetting),
            _executionTree);

        if (typeof(_executionTree.errorHandling.onError) !== "function") {
            _executionTree.errorHandling.onError = Execute.prepareExecutionTree(_executionTree.errorHandling.onError);
        }

        _executionTree.steps.forEach((step, ipos) => {
            _executionTree.steps[ipos] = Execute.prepareExecutionTreeStep(step);
        });

        return _executionTree;
    }

    static prepareExecutionTreeStep(step) {
        let _step = Utility.spreadify(true)(Utility.clone(Execute.stepDefaultSetting), step);

        if (typeof(_step.errorHandling.onError) !== "function") {
            _step.errorHandling.onError = Execute.prepareExecutionTree(_step.errorHandling.onError);
        }

        if (typeof(_step.if) !== "undefined") {
            Object.keys(_step.if).forEach((cond) => {
                if (typeof(_step.if[cond]) === "object") {
                    _step.if[cond] = Execute.prepareExecutionTree(_step.if[cond]);
                }
            });
        }

        if (_step.actionType === Execute.builtinActionType.CHILD_EXECUTION_TREE) {
            _step.action.executionTree = Execute.prepareExecutionTree(_step.action.executionTree);
        } else if(_step.actionType === Execute.builtinActionType.MAP && _step.action.executionTree) {
            // if actionType is MAP and the action is a child execution tree
            _step.action.executionTree = Execute.prepareExecutionTree(_step.action.executionTree);
        }

        return _step;
    }

    static extractStatistics(executionTree){
        let data = {
            title: executionTree.title,
            steps:[]
        };

        data.statistics = executionTree.statistics;
        if (data.statistics.count !== 0) {
            data.statistics.avg = data.statistics.total / data.statistics.count;
        }

        if (data.statistics.cache.missesNo !== 0) {
            data.statistics.cache.missesAvg =
                data.statistics.cache.missesTotal / data.statistics.cache.missesNo;
        }

        if (data.statistics.cache.hitsNo !== 0) {
            data.statistics.cache.hitsAvg =
                data.statistics.cache.hitsTotal / data.statistics.cache.hitsNo;
        }

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

        return Utility.clone(data);
    }

    static getStepById(executionTree, stepId) {

        for (let ipos = 0;ipos < executionTree.steps.length; ipos++) {
            let step = executionTree.steps[ipos];

            if(step.id === stepId) {
                return step;
            }

            if(typeof(step.if) !== "undefined") {

                let childKeys = Object.keys(step.if);

                for (let jpos = 0;jpos < childKeys.length; jpos++) {
                    let child = step.if[childKeys[jpos]];

                    if (typeof child === "number") {
                        continue;
                    }

                    let stepObj = Execute.getStepById(child, stepId);

                    if (stepObj !== false) {
                        return stepObj;
                    }
                }
            }
        }
        return false;
    }

    static use(middleware) {
        if (!middleware.type) {
            throw new Error("type is missing in middleware contract");
        }

        switch (middleware.type) {
            case "action":
                return Execute.addActionMiddleware(middleware);
            default:
                throw new Error("Unknown middleware type");
        }
    }

    static addActionMiddleware(middleware) {
        if (!middleware.action) {
            throw new Error("Middleware action is missing");
        }

        if (!middleware.name) {
            throw new Error("Middleware name is missing");
        }

        if (Execute._actions === undefined) {
            Execute._actions = {};
        }

        Execute._actions[middleware.name] = middleware.action;
        return true;
    }

    run(executionTree, executionData) {
        return this.executeExecutionTree(executionTree, executionData)
            .then((response) => response.result);
    }

    nextStepKey(step, executionData) {
        const testResult = typeof step.test === "function"
            ? step.test(executionData, this._options) // call the test with the results from the action
            : step.test;

        return testResult;
    }

    nextStep(step, executionData) {
        const testResult = this.nextStepKey(step, executionData);

        this._options.logger.info({
            step: step.title,
            event: Execute.eventsTitle.testResult,
            testResult: testResult,
            ...this._options.context
        });

        // get a reference to the next step based on the test result
        return typeof(step.if[testResult]) !=="undefined" ? step.if[testResult] : step.if.default;

    }

    goToNextStep(step, executionData) {
        const nextStep = this.nextStep(step, executionData);

        if (nextStep === undefined) {
            // TODO: better handeling if the next step is missing.
            return Promise.reject("Unhandled scenario");

        } else if (typeof(nextStep) === "number") {
            // next step is not an execution tree but a predefined signal
            return Promise.resolve({result: {}, signal: nextStep});
        }
        else {
            return this.executeExecutionTree(nextStep, executionData);
        }
    }

    executeStepActionWithRetry(step, executionData) {

        let retryPromise = (tries)=> {
            let action = Execute._actions[step.actionType].apply(this, [step.action, executionData, this._options]);

            return action.catch( (err) => {
                // update statistics
                step.statistics.errors++;

                if (--tries > 0 && step.errorHandling.tryCondition(err)) {
                    this._options.logger.warn({
                        step: step.title,
                        event: Execute.eventsTitle.actionRetry,
                        cause: err,
                        ...this._options.context
                    });

                    return retryPromise(tries);
                } else {
                    this._options.logger.error({
                        step: step.title,
                        event: Execute.eventsTitle.actionFailed,
                        cause: err,
                        ...this._options.context
                    });

                    return Promise.reject(err);
                }
            });
        };

        return retryPromise(step.errorHandling.maxAttempts);

    }

    executeStepActionWithCircuitBreaker(step, executionData) {
        if (!step.circuitBreaker.enable) {
            // Circuit Breaker is disabled, ignore Circuit Breaker
            return this.executeStepActionWithRetry(step, executionData);
        }

        let cb = step.circuitBreaker;

        if (cb.shortCircuited) {
            // check wait threshold is over or not
            if ((new Date()) - cb.shortCircuitStartTime > cb.duration) {
                // turn off Short Circuited mode
                cb.shortCircuited = false;
                cb.failed = 0;
                cb.successful = 0;
            }
        }

        if (cb.shortCircuited) {
            return Promise.reject("Short Circuited");
        }

        return this.executeStepActionWithRetry(step, executionData)
            .then((data) => {
                cb.successful++;

                return data;
            })
            .catch((error) => {
                cb.failed++;

                let total = cb.successful + cb.failed;

                if (total > cb.waitThreshold && cb.failed / total > cb.threshold) {
                    // go to Short Circuited mode
                    cb.shortCircuited = true;
                    cb.shortCircuitStartTime = new Date();
                    cb.shortCircuitCount++;
                }

                return Promise.reject(error);
            });
    }

    executeStepActionWithCache(step, executionData) {
        if (step.cache.enable) {

            let cacheKey = step.cache.key(executionData);

            if (cacheKey !== undefined && cacheKey !== "") {
                let startTime = new Date();

                return this._options.cache.get(cacheKey)
                    .then((data) => {
                        if (data !== undefined && data !== null) {
                            // update statistics
                            this._options.logger.info({
                                step: step.title,
                                event: Execute.eventsTitle.cacheHit,
                                result: data,
                                ...this._options.context
                            });

                            step.statistics.cache.hitsNo++;

                            step.statistics.cache.hitsTotal += (new Date() - startTime);
                            return data;
                        } else {
                            this._options.logger.info({
                                step: step.title,
                                event: Execute.eventsTitle.cacheMiss,
                                ...this._options.context
                            });

                            // update statistics
                            step.statistics.cache.missesNo++;
                            startTime = new Date();

                            return this.executeStepActionWithCircuitBreaker(step, executionData).then((data) => {
                                return this._options.cache.set(cacheKey, data, step.cache.ttl)
                                    .then((set_result) => {
                                        this._options.logger.info({
                                            step: step.title,
                                            event: Execute.eventsTitle.cacheSet,
                                            setResult: set_result,
                                            ...this._options.context
                                        });

                                        step.statistics.cache.missesTotal += (new Date() - startTime);
                                        return data;
                                    });
                            });
                        }
                    });
            }
        }

        return this.executeStepActionWithCircuitBreaker(step, executionData);
    }

    executeStepActionAndHandleError(step, executionData) {
        return this.executeStepActionWithCache(step, executionData)
            .catch((err) => {

                let onErrorOp;

                if (typeof(step.errorHandling.onError) === "function") {
                    onErrorOp = Promise.resolve(step.errorHandling.onError(err ,executionData, this._options));
                } else {
                    onErrorOp = this.executeExecutionTree(step.errorHandling.onError, {
                        ...executionData,
                        error: err
                    }).then( data => data.result);
                }

                return onErrorOp.then( (data)=> {
                    if (step.errorHandling.continueOnError) {
                        this._options.logger.warn({
                            step: step.title,
                            event: Execute.eventsTitle.continueOnError,
                            ...this._options.context
                        });

                        return {result:data, signal: Execute.executionMode.CONTINUE};
                    } else {
                        this._options.logger.error({
                            step: step.title,
                            event: Execute.eventsTitle.actionFailed,
                            cause: err,
                            ...this._options.context
                        });

                        return Promise.reject(err);
                    }
                });

            });
    }

    processStep(step, executionData) {

        this._options.logger.info({
            step: step.title,
            event: Execute.eventsTitle.stepStartProcessing,
            ...this._options.context
        });

        if ("test" in step) {
            // if there's a test defined, then actionResult must be a promise
            // so pass the promise response to goToNextStep

            return this.goToNextStep(step, executionData).then((childResponse) => {

                this._options.logger.info({
                    step: step.title,
                    event: Execute.eventsTitle.childFinished,
                    ...this._options.context
                });

                childResponse.result = Utility.getByPath(childResponse.result, step.output.map.source);

                return childResponse;
            });
        } else {
            // Only executing action when there is no test.
            // By this we can improve performance because we don't need to
            // combine the result of action and test
            return this.executeStepActionAndHandleError(step, executionData).then((data) => {

                data.result = Utility.getByPath(data.result, step.output.map.source);

                this._options.logger.info({
                    step: step.title,
                    event: Execute.eventsTitle.stepFinished,
                    result: data.result,
                    ...this._options.context
                });

                return data;
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
                                Utility.copyData(executionData, response.result, step.output.map.destination);
                            } else {
                                executionData = Utility.extend(executionData, response.result);
                            }
                        }

                        if (step.output.addToResult) {
                            if (step.output.map.destination.length !== 0) {
                                Utility.copyData(finalResult, response.result, step.output.map.destination);
                            }
                            else {
                                finalResult = Utility.extend(finalResult, response.result);
                            }
                        }

                        return {result: finalResult, signal: finalSignal};
                    });
            });
        });

        const doNextAction = () => {
            if (i < ps.length && finalSignal === Execute.executionMode.CONTINUE) {
                return ps[i++]().then(doNextAction);
            }
        };

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
                        this._options.logger.warn({
                            step: executionTree.title,
                            event: Execute.eventsTitle.executionTreeActionRetry,
                            cause: err,
                            ...this._options.context
                        });

                        return retryPromise(tries);
                    } else {
                        this._options.logger.error({
                            step: executionTree.title,
                            event: Execute.eventsTitle.executionTreeActionFailed,
                            cause: err,
                            ...this._options.context
                        });

                        return Promise.reject(err);
                    }
                });
        };
        return retryPromise(executionTree.errorHandling.maxAttempts);
    }

    executeExecutionTreeWithCache(executionTree, executionData) {
        if (executionTree.cache.enable) {

            let cacheKey = executionTree.cache.key(executionData);

            if (cacheKey !== undefined && cacheKey !== "") {

                let startTime = new Date();

                return this._options.cache.get(cacheKey)
                    .then((data) => {
                        if (data !== undefined && data !== null) {
                            this._options.logger.info({
                                step: executionTree.title,
                                event: Execute.eventsTitle.executionTreeCacheHit,
                                result: data,
                                ...this._options.context
                            });

                            // update statistics
                            executionTree.statistics.cache.hitsNo++;
                            executionTree.statistics.cache.hitsTotal += (new Date() - startTime);

                            return data;
                        } else {
                            this._options.logger.info({
                                step: executionTree.title,
                                event: Execute.eventsTitle.executionTreeCacheMiss,
                                ...this._options.context
                            });

                            // update statistics
                            executionTree.statistics.cache.missesNo++;
                            startTime = new Date();

                            return this.executeExecutionTreeWithRetry(executionTree, executionData).then((data) => {
                                return this._options.cache.set(cacheKey, data, executionTree.cache.ttl)
                                    .then((set_result) => {
                                        this._options.logger.info({
                                            step: executionTree.title,
                                            event: Execute.eventsTitle.executionTreeCacheSet,
                                            setResult: set_result,
                                            ...this._options.context
                                        });

                                        executionTree.statistics.cache.missesTotal += (new Date() - startTime);
                                        return data;
                                    });
                            });
                        }
                    });
            }
        }

        return this.executeExecutionTreeWithRetry(executionTree, executionData);

    }

    executeExecutionTree(executionTree, executionData) {

        let startTime = new Date();

        return this.executeExecutionTreeWithCache(executionTree, executionData)
            .then((result) => {
                let processTime = (new Date() - startTime);
                this.recordStatistics(executionTree, processTime);
                return result;
            })
            .catch((err) => {
                let onErrorOp;

                if (typeof(executionTree.errorHandling.onError) === "function") {
                    onErrorOp = Promise.resolve(executionTree.errorHandling.onError(err ,executionData, this._options));
                } else {
                    onErrorOp = this.executeExecutionTree(executionTree.errorHandling.onError, {
                        ...executionData,
                        error: err
                    }).then( data => data.result);
                }

                return onErrorOp.then( (data)=> {
                    if (executionTree.errorHandling.continueOnError) {

                        this._options.logger.warn({
                            step: executionTree.title,
                            event: Execute.eventsTitle.executionTreeContinueOnError,
                            ...this._options.context
                        });

                        return {
                            result: data,
                            signal: Execute.executionMode.CONTINUE
                        };
                    } else {
                        return Promise.reject(err);
                    }
                });
            });
    }

}

// Because static keyword works only for method
Execute.eventsTitle = {
    testResult: "Test Result",

    actionRetry: "Retry Step's Action",
    actionFailed: "Step's Action Failed",
    continueOnError: "Step's Action Failed, Continue Executing",

    executionTreeActionRetry: "Retry Executing Execution Tree",
    executionTreeActionFailed: "Executing Execution Tree Failed",
    executionTreeContinueOnError: "Executing Execution Tree Failed, Continue Executing",

    cacheHit: "Step's Cache Hit, Data Exist in Cache",
    cacheMiss: "Step's Cache Miss, Data doesn't Exist in Cache",
    cacheSet: "Step's Cache Set, Data Inserted to Cache",

    executionTreeCacheHit: "Execution Tree's Cache Hit, Data Exist in Cache",
    executionTreeCacheMiss: "Execution Tree's Cache Miss, Data doesn't Exist in Cache",
    executionTreeCacheSet: "Execution Tree's Cache Set, Data Inserted to Cache",

    stepStartProcessing: "Start Processing Step",
    childFinished: "Child Execution Tree Returned Data",
    stepFinished: "Step Execution Finished"
};

Execute.executionMode = {
    CONTINUE: 0,
    STOP_LEVEL_EXECUTION: 1,
    STOP_ENTIRE_EXECUTION: 2
};

Execute.builtinActionType = {
    DEFAULT: "default",
    PROMISE: "promise",
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
        onError: () => ({}),
    },
    circuitBreaker: {
        enable: false,
        duration: 10000,
        threshold: 0.4,
        waitThreshold: 50,
        shortCircuitStartTime: 0,
        shortCircuited: false,
        shortCircuitCount: 0,
        failed: 0,
        successful: 0
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
