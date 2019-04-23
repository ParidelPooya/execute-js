const Utility = require("./utility");
const Defenitions = require("./defenitions");
const Middleware = require("./middleware");

class Execute {

    constructor(options) {
        let defaultOption = {
            logger: console,
            context: {},
            cache: require("./tiny-cache")
        };

        // check if we have actions
        Execute._middleware = Execute._middleware || {};

        Execute._middleware[Execute.builtinActionType.DEFAULT] =  {action: Middleware.defaultAction};
        Execute._middleware[Execute.builtinActionType.PROMISE] =  {action: Middleware.promiseAction};

        Execute._middleware[Execute.builtinActionType.MAP] = {action: Middleware.mapActionHandler};
        Execute._middleware[Execute.builtinActionType.WHILE] = {action: Middleware.whileActionHandler};
        Execute._middleware[Execute.builtinActionType.CHILD_EXECUTION_TREE] = {action: Middleware.childExecutionTreeHandler};
        Execute._middleware[Execute.builtinActionType.SIGNAL] = {action: Middleware.signalAction};


        this._options = Utility.spreadify()(defaultOption, options || {});
    }


    static prepareExecutionTree(executionTree, defaultTitle) {

        let _executionTree;

        if (Array.isArray(executionTree)) {
            // if executionTree is array then we need to convert it to proper object with all missing properties.
            _executionTree = {
                steps: executionTree
            };
        } else {
            _executionTree = executionTree;
        }

        _executionTree.title = _executionTree.title || defaultTitle || Execute.rootExecutionTree.title;

        _executionTree = Utility.spreadify(true)(
            Utility.clone(Execute.executionTreeDefaultSetting),
            _executionTree);

        if (typeof(_executionTree.errorHandling.onError) !== "function") {
            _executionTree.errorHandling.onError = Execute.prepareExecutionTree(
                _executionTree.errorHandling.onError,
                _executionTree.title + " - onError"
            );
        }

        _executionTree.steps.forEach((step, ipos) => {
            _executionTree.steps[ipos] = Execute.prepareExecutionTreeStep(
                step,
                _executionTree.title + " - Step " + ipos
            );
        });

        return _executionTree;
    }

    static prepareExecutionTreeStep(step, defaultTitle) {
        step.title = step.title || defaultTitle;

        let _step = Utility.spreadify(true)(Utility.clone(Execute.stepDefaultSetting), step);

        if (typeof(_step.errorHandling.onError) !== "function") {
            _step.errorHandling.onError = Execute.prepareExecutionTree(
                _step.errorHandling.onError,
                step.title + " - onError"
            );
        }

        if (typeof(_step.if) !== "undefined") {
            Object.keys(_step.if).forEach((cond) => {
                if (typeof(_step.if[cond]) === "object") {
                    _step.if[cond] = Execute.prepareExecutionTree(
                        _step.if[cond],
                        defaultTitle + " - if " + cond
                    );
                }
            });
        }

        if (_step.actionType === Execute.builtinActionType.CHILD_EXECUTION_TREE) {
            _step.action.executionTree = Execute.prepareExecutionTree(
                _step.action.executionTree,
                step.title + " - child execution tree"
            );
        } else if(_step.actionType === Execute.builtinActionType.MAP && _step.action.executionTree) {
            // if actionType is MAP and the action is a child execution tree
            _step.action.executionTree = Execute.prepareExecutionTree(
                _step.action.executionTree,
                step.title + " - map execution tree"
            );
        } else if(_step.actionType === Execute.builtinActionType.WHILE && _step.action.executionTree) {
            // if actionType is MAP and the action is a child execution tree
            _step.action.executionTree = Execute.prepareExecutionTree(
                _step.action.executionTree,
                step.title + " - while execution tree"
            );
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

    static getStepById(executionTree, stepId, traverseChild) {

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

            if (traverseChild) {
                if (
                    (step.actionType === Execute.builtinActionType.CHILD_EXECUTION_TREE) ||
                    (step.actionType === Execute.builtinActionType.MAP && step.action.executionTree) ||
                    (step.actionType === Execute.builtinActionType.WHILE && step.action.executionTree)
                ) {
                    let stepObj = Execute.getStepById(step.action.executionTree, stepId, true);

                    if (stepObj !== false) {
                        return stepObj;
                    }
                }
            }
        }
        return false;
    }

    static use(middleware) {
        return Middleware.use(middleware, Execute);
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
            context: this._options.context
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
            return Middleware.executeStepActionCallMiddleware.apply(this, [step, executionData, Execute])
                .catch( err => {
                    // update statistics`
                    step.statistics.errors++;

                    if (--tries > 0 && step.errorHandling.tryCondition(err)) {
                        this._options.logger.warn({
                            step: step.title,
                            event: Execute.eventsTitle.actionRetry,
                            cause: err,
                            context: this._options.context
                        });

                        return retryPromise(tries);
                    } else {
                        this._options.logger.error({
                            step: step.title,
                            event: Execute.eventsTitle.actionFailed,
                            cause: err,
                            context: this._options.context
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
                                context: this._options.context
                            });

                            step.statistics.cache.hitsNo++;

                            step.statistics.cache.hitsTotal += (new Date() - startTime);
                            return data;
                        } else {
                            this._options.logger.info({
                                step: step.title,
                                event: Execute.eventsTitle.cacheMiss,
                                context:this._options.context
                            });

                            // update statistics
                            step.statistics.cache.missesNo++;
                            startTime = new Date();

                            return this.executeStepActionWithCircuitBreaker(step, executionData).then((data) => {
                                step.statistics.cache.missesTotal += (new Date() - startTime);

                                this._options.cache.set(cacheKey, data, step.cache.ttl)
                                    .then((set_result) => {
                                        this._options.logger.info({
                                            step: step.title,
                                            event: Execute.eventsTitle.cacheSet,
                                            setResult: set_result,
                                            context: this._options.context
                                        });
                                    });

                                return data;
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
                            cause: err,
                            event: Execute.eventsTitle.continueOnError,
                            context: this._options.context
                        });

                        return {result:data, signal: Execute.executionMode.CONTINUE};
                    } else {
                        this._options.logger.error({
                            step: step.title,
                            event: Execute.eventsTitle.actionFailed,
                            cause: err,
                            context: this._options.context
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
            context: this._options.context
        });

        if ("test" in step) {
            // if there's a test defined, then actionResult must be a promise
            // so pass the promise response to goToNextStep

            return this.goToNextStep(step, executionData).then((childResponse) => {

                this._options.logger.info({
                    step: step.title,
                    event: Execute.eventsTitle.childFinished,
                    context: this._options.context
                });

                return {
                    result: Utility.getByPath(childResponse.result, step.output.map.source),
                    signal: childResponse.signal,
                };
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
                    context: this._options.context
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

                let stepPromise = this.processStep(step, executionData)
                    .then(response => {
                        let processTime = (new Date() - startTime);
                        this.recordStatistics(step, processTime);

                        return response;
                    });

                let myPromie = step.output.waitForTheResult ? stepPromise : Promise.resolve({
                    signal: Execute.executionMode.CONTINUE,
                    result: {}
                });


                return myPromie.then(response => {
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
                            context: this._options.context
                        });

                        return retryPromise(tries);
                    } else {
                        this._options.logger.error({
                            step: executionTree.title,
                            event: Execute.eventsTitle.executionTreeActionFailed,
                            cause: err,
                            context: this._options.context
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
                                context: this._options.context
                            });

                            // update statistics
                            executionTree.statistics.cache.hitsNo++;
                            executionTree.statistics.cache.hitsTotal += (new Date() - startTime);

                            return data;
                        } else {
                            this._options.logger.info({
                                step: executionTree.title,
                                event: Execute.eventsTitle.executionTreeCacheMiss,
                                context: this._options.context
                            });

                            // update statistics
                            executionTree.statistics.cache.missesNo++;
                            startTime = new Date();

                            return this.executeExecutionTreeWithRetry(executionTree, executionData).then((data) => {
                                executionTree.statistics.cache.missesTotal += (new Date() - startTime);

                                this._options.cache.set(cacheKey, data, executionTree.cache.ttl)
                                    .then((set_result) => {
                                        this._options.logger.info({
                                            step: executionTree.title,
                                            event: Execute.eventsTitle.executionTreeCacheSet,
                                            setResult: set_result,
                                            context: this._options.context
                                        });
                                    });

                                return data;
                            });
                        }
                    });
            }
        }

        return this.executeExecutionTreeWithRetry(executionTree, executionData);

    }

    executeExecutionTree(executionTree, executionData) {

        let internalData = {...executionData};

        let startTime = new Date();

        return this.executeExecutionTreeWithCache(executionTree, internalData)
            .then((result) => {
                let processTime = (new Date() - startTime);
                this.recordStatistics(executionTree, processTime);
                return result;
            })
            .catch((err) => {
                let onErrorOp;

                if (typeof(executionTree.errorHandling.onError) === "function") {
                    onErrorOp = Promise.resolve(executionTree.errorHandling.onError(err ,internalData, this._options));
                } else {
                    onErrorOp = this.executeExecutionTree(executionTree.errorHandling.onError, {
                        ...internalData,
                        error: err
                    }).then( data => data.result);
                }

                return onErrorOp.then( (data)=> {
                    if (executionTree.errorHandling.continueOnError) {

                        this._options.logger.warn({
                            step: executionTree.title,
                            cause: err,
                            event: Execute.eventsTitle.executionTreeContinueOnError,
                            context: this._options.context
                        });

                        return {
                            result: data,
                            signal: Execute.executionMode.CONTINUE
                        };
                    } else {
                        this._options.logger.error({
                            step: executionTree.title,
                            event: Execute.eventsTitle.executionTreeActionFailed,
                            cause: err,
                            context: this._options.context
                        });

                        return Promise.reject(err);
                    }
                });
            });
    }

}

// Because static keyword works only for method
Execute.eventsTitle = Defenitions.eventsTitle;
Execute.executionMode = Defenitions.executionMode;
Execute.builtinActionType = Defenitions.builtinActionType;
Execute.executionTreeDefaultSetting = Defenitions.executionTreeDefaultSetting;
Execute.middlewareDefaultSetting = Defenitions.middlewareDefaultSetting;
Execute.stepDefaultSetting = Defenitions.stepDefaultSetting;
Execute.rootExecutionTree = Defenitions.rootExecutionTree;

module.exports = Execute;
