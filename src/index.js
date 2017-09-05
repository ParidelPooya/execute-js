const log = data => console.log(data);

const processSteps = (executionTree, executionData) => {
    let
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
                    processSteps(nextStep);
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
                        goToNextStep();
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
            } else if ('test' in step) {
                log(`Step: ${step.title}`);
                goToNextStep();
            } else {
                log(`Step: ${step.title}`);
                resolve();
            }
        });
    };

    let stepsPromise = null;

    executionTree.map((step, index)=>{
        if (index === 0) {
            stepsPromise = processStep(step, executionData);
        } else {
            stepsPromise.then(processStep(step, executionData));
        }
    });
    return stepsPromise;
};

module.exports = processSteps;