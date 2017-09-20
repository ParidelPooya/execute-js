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

const processSteps = (executionTree, executionData) => {

    const processStep = (step) => {
        return new Promise((resolve, reject) => {
            const goToNextStep = () => {
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

            if (step.action) {
                const actionResult = step.action(executionData);

                // if there's a test defined, then actionResult must be a promise
                // so pass the promise response to goToNextStep
                Promise.resolve(actionResult).then( (result) => {
                    log(`Step: ${step.title}`);

                    log(`Action result: ${JSON.stringify(result)}`);

                    if ('test' in step) {
                        goToNextStep().then((childResult) => {
                            log(`Child result: ${JSON.stringify(childResult)}`);

                            let totalResult = spreadify(result, childResult);
                            log(`Total result: ${JSON.stringify(totalResult)}`);

                            resolve(totalResult);
                        });
                    } else {
                        resolve(result);
                    }

                });

                // if ('test' in step) {
                //     actionResult.then(goToNextStep);
                // } else {
                //     resolve(
                //         actionResult);
                // }
            } else {
                log(`Step: ${step.title}`);

                if ('test' in step) {
                    goToNextStep().then((childResult) => {
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

    let stepsPromise = [];
    let finalResult = {};

    executionTree.map((step)=>{
        stepsPromise.push(processStep(step, executionData).then((stepResult)=>{
            finalResult = spreadify(finalResult, stepResult);
            return Promise.resolve(finalResult);
        }));
    });


    return new Promise((resolve, reject) => {
        stepsPromise.reduce(function(cur, next) {
            return cur.then(next);
        }).then(function() {
            console.log(finalResult);
            resolve(finalResult);
        });
    });

};

module.exports = processSteps;