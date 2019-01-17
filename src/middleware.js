const Defenitions = require("./defenitions");
const Utility = require("./utility");

function defaultAction(action, executionData, options) {
    return Promise.resolve(action(executionData, options))
        .then((data) => {
            return {result: data, signal: Defenitions.executionMode.CONTINUE};
        });
}

function promiseAction(action, executionData, options) {
    return action(executionData, options)
        .then((data) => {
            return {result: data, signal: Defenitions.executionMode.CONTINUE};
        });
}

function childExecutionTreeHandler(action, executionData) {
    /*
        action should be a object with
        executionTree:  a valid execution tree
        executionData: optional, data to pass to execution tree, if not specified then entire data will pass
        ignoreChildSignal: boolean
     */

    let data = action.executionData ? action.executionData(executionData) : executionData;

    return this.executeExecutionTree(action.executionTree, data).then((result)=> {
        if (action.ignoreChildSignal) {
            result.signal = Defenitions.executionMode.CONTINUE;
        }
        return result;
    });

}

function mapActionHandler(action, executionData, options) {
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
        return {result: data, signal: Defenitions.executionMode.CONTINUE};
    });
}

function whileActionHandler(action, executionData, options) {
    /*
        action should be object with
        {
            test: while will loop until test result becomes false,
            executionTree:  executionTree to execute
        }
     */
    let final = [];
    let _self = this;

    function runOnce() {
        if (action.test(executionData, options)) {
            return _self.executeExecutionTree(action.executionTree, executionData)
                .then((response) => {
                    final.push(response.result);
                    return runOnce();
                });
        } else {
            return {result: final, signal: Defenitions.executionMode.CONTINUE};
        }
    }

    return runOnce();
}

function use(middleware, Execute) {
    if (!middleware.type) {
        throw new Error("type is missing in middleware contract");
    }

    switch (middleware.type) {
        case "action":
            return addActionMiddleware(middleware, Execute);
        default:
            throw new Error("Unknown middleware type");
    }
}

function addActionMiddleware(middleware, Execute) {
    if (!middleware.action) {
        throw new Error("Middleware action is missing");
    }

    if (!middleware.name) {
        throw new Error("Middleware name is missing");
    }

    middleware.statistics = Utility.clone(Defenitions.middlewareDefaultSetting.statistics);

    Execute._middleware = Execute._middleware || {};
    Execute._middleware[middleware.name] = middleware;

    return true;
}

function executeStepActionCallMiddleware(step, executionData, Execute) {
    let middleware = Execute._middleware[step.actionType];

    if (middleware.cache === undefined) {
        return middleware.action.apply(this, [step.action, executionData, this._options]);
    }

    let cacheKey = middleware.cache.key(executionData);

    if (cacheKey !== undefined && cacheKey !== "") {

        let startTime = new Date();

        return this._options.cache.get(cacheKey)
            .then((data) => {
                if (data !== undefined && data !== null) {
                    // update statistics
                    this._options.logger.info({
                        middleware: step.actionType,
                        event: Defenitions.eventsTitle.middlewareCacheHit,
                        result: data,
                        context: this._options.context
                    });

                    middleware.statistics.cache.hitsNo++;
                    middleware.statistics.cache.hitsTotal += (new Date() - startTime);

                    return data;
                } else {
                    this._options.logger.info({
                        middleware: step.actionType,
                        event: Defenitions.eventsTitle.middlewareCacheMiss,
                        context:this._options.context
                    });

                    // update statistics
                    middleware.statistics.cache.missesNo++;
                    startTime = new Date();

                    return middleware.action.apply(this, [step.action, executionData, this._options])
                        .then((data) => {
                            return this._options.cache.set(cacheKey, data, middleware.cache.ttl)
                                .then((set_result) => {
                                    this._options.logger.info({
                                        middleware: step.actionType,
                                        event: Defenitions.eventsTitle.middlewareCacheSet,
                                        setResult: set_result,
                                        context: this._options.context
                                    });

                                    middleware.statistics.cache.missesTotal += (new Date() - startTime);
                                    return data;
                                });
                        });
                }
            });
    }

    return middleware.action.apply(this, [step.action, executionData, this._options]);

}

module.exports = {
    defaultAction: defaultAction,
    promiseAction: promiseAction,
    childExecutionTreeHandler: childExecutionTreeHandler,
    mapActionHandler: mapActionHandler,
    whileActionHandler: whileActionHandler,
    use: use,
    executeStepActionCallMiddleware: executeStepActionCallMiddleware,
};