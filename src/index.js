const log = data => console.log(data);


const spreadify = function() {
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

const goToNextStep = (step, executionData) => {
    const testResult = typeof step.test === 'function'
        ? step.test(executionData) // call the test with the results from the action
        : step.test;

    log(`Test result: ${testResult}`);
    // get a reference to the next step based on the test result
    const nextStep = step.if[testResult] || step.if.default;

    if (!nextStep) {
        reject('Unhandled scenario');
    } else {
        // move on to the next step down the tree
        return processSteps(nextStep, executionData);
    }
};

const processStep = (step, executionData) => {

    const defaultStepSettings = {
        retry: 1
    };
    let _step = spreadify(defaultStepSettings, step);
    let allData = spreadify(executionData, {});

    return new Promise((resolve, reject) => {

        if (_step.action) {
            log(`Step: ${_step.title}`);

            let actionResult = Promise.resolve(_step.action(executionData));

            for(let i=0; i < _step.retry; i++) {
                actionResult = actionResult.catch(()=> {
                    log(`Step: ${_step.title} try ${i+1} failed. Retrying...`);
                    return _step.action(executionData);
                });
            }

            actionResult.then( (result) => {

                log(`Action result: ${JSON.stringify(result)}`);

                allData = spreadify(allData, result);

                // if there's a test defined, then actionResult must be a promise
                // so pass the promise response to goToNextStep
                if ('test' in _step) {
                    goToNextStep(_step, allData).then((childResult) => {
                        log(`Child result: ${JSON.stringify(childResult)}`);

                        let totalResult = spreadify(result, childResult);
                        log(`Total result: ${JSON.stringify(totalResult)}`);

                        resolve(totalResult);
                    });
                } else {
                    resolve(result);
                }

            }).catch( (e)=> {
                reject(e);
            });

        } else {
            log(`Step: ${_step.title}`);

            if ('test' in _step) {
                goToNextStep(_step, allData).then((childResult) => {
                    log(`Child result: ${JSON.stringify(childResult)}`);
                    log(`Total result: ${JSON.stringify(spreadify(childResult) )}`);
                    resolve(childResult);
                });
            } else {
                resolve();
            }
        }
    });
};

const processSteps = (executionTree, executionData) => {

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

    _executionTree = spreadify(defaultExecutionTreeSettings, _executionTree);

    let finalResult = {};

    let allData = spreadify(executionData, {});

    return new Promise((resolve, reject) => {
        _executionTree.steps.reduce(function (allStepsSoFar, next) {

            return allStepsSoFar.then(() => {
                return processStep(next, allData).then((stepResult) => {
                    finalResult = spreadify(finalResult, stepResult);
                    allData = spreadify(allData, stepResult);
                    return finalResult;
                }).catch( (e)=> {reject(e)})
            });

        }, Promise.resolve()).then(function () {
            resolve(finalResult);
        });
    });

};

module.exports = processSteps;
