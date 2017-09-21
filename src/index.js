const log = data => console.log(data);


const spreadify = function() {
    // Holds the processed arguments for use by `fn`
    var spreadArgs = {};

    // Caching length
    var length = arguments.length;

    var currentArg;

    for (var i = 0; i < length; i++) {
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

    let allData = spreadify(executionData, {});

    return new Promise((resolve, reject) => {

        if (step.action) {
            const actionResult = step.action(executionData);

            // if there's a test defined, then actionResult must be a promise
            // so pass the promise response to goToNextStep
            Promise.resolve(actionResult).then( (result) => {
                log(`Step: ${step.title}`);
                log(`Action result: ${JSON.stringify(result)}`);

                allData = spreadify(allData, result);

                if ('test' in step) {
                    goToNextStep(step, allData).then((childResult) => {
                        log(`Child result: ${JSON.stringify(childResult)}`);

                        let totalResult = spreadify(result, childResult);
                        log(`Total result: ${JSON.stringify(totalResult)}`);

                        resolve(totalResult);
                    });
                } else {
                    resolve(result);
                }

            });

        } else {
            log(`Step: ${step.title}`);

            if ('test' in step) {
                goToNextStep(step, allData).then((childResult) => {
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

    _executionTree = spreadify(_executionTree, {
        concurrency: 1
    });


    let stepsPromise = [];
    let finalResult = {};

    let allData = spreadify(executionData, {});

    return new Promise((resolve, reject) => {
        _executionTree.steps.reduce(function (allStepsSoFar, next) {

            return allStepsSoFar.then(() => {
                return processStep(next, allData).then((stepResult) => {
                    finalResult = spreadify(finalResult, stepResult);
                    allData = spreadify(allData, stepResult);
                    return finalResult;
                });
            });

        }, Promise.resolve()).then(function () {
            resolve(finalResult);
        });
    });

};

module.exports = processSteps;
