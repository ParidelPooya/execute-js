const lab = require("lab").script();
const code = require("code");

exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Circuit Breaker -", () => {

    lab.test("Error more than threshold should trigger circuit breaker", () => {
        let execute = new Execute();

        let retryCount = 0;
        const func = (data)=> {
            return new Promise((resolve, reject) => {

                if (++retryCount%8 === 1) {
                    resolve(data);
                } else {
                    reject({errorCode:1,errorMsg:"error"});
                }
            });
        };


        let executionTree = Execute.prepareExecutionTree({
            concurrency: 1,
            steps :[
                {
                    title:"step 1",
                    action: (data) => func({a: 1}),
                    circuitBreaker: {
                        enable: true,
                        waitThreshold: 5,
                        duration: 100
                    }
                }
            ]
        });

        let executionData = {
            sub_id :123
        };

        let ipos = 0;

        let wait = () => new Promise((r) => setTimeout(r, 10));

        let runItAgain = () => {
            return wait().then(() => {
                return execute.run(executionTree, executionData).then((e)=> {

                    if (ipos < 90 ) {
                        ipos++;
                        return execute.run(executionTree, executionData).catch(runItAgain);
                    } else {
                        return Promise.reject(e);
                    }
                }).catch((e)=> {

                    if (ipos < 90 ) {
                        ipos++;
                        return execute.run(executionTree, executionData).catch(runItAgain);
                    } else {
                        return Promise.reject(e);
                    }
                });
            });
        };


        return runItAgain().catch(() => {
            code.expect(executionTree.steps[0].circuitBreaker.shortCircuitCount).to.not.be.equal(0);
        });
    });

});