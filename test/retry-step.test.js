const lab = require("lab").script();
const code = require("code");

exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Retry Step -", () => {

    lab.test("should retry 10 times", () => {
        let execute = new Execute();

        let retryCount = 0;
        const func = (data)=> {
            return new Promise((resolve, reject) => {

                if (retryCount === 9) {
                    resolve(data);
                } else {
                    retryCount++;
                    reject({errorCode:1,errorMsg:"error"});
                }
            });
        };


        let executionTree = Execute.prepareExecutionTree({
            concurrency: 1,
            steps :[
                {
                    title:"step 1",
                    errorHandling: {
                        maxAttempts: 10
                    },
                    action: (data) => func({a: 1})
                }
            ]
        });

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result.a).to.equal(1);
            code.expect(retryCount).to.equal(9);
        });
    });

    lab.test("should not retry when tryCondition is not fulfilled", () => {
        let execute = new Execute();

        let retryCount = 0;
        const func = (data)=> {
            return new Promise((resolve, reject) => {

                if (retryCount === 9) {
                    resolve(data);
                } else {
                    retryCount++;
                    reject({errorCode:1,errorMsg:"error"});
                }
            });
        };

        let executionTree = Execute.prepareExecutionTree({
            concurrency: 1,
            steps :[
                {
                    title:"step 1",
                    errorHandling: {
                        maxAttempts: 10,
                        tryCondition: (e) => e.errorCode === 2 ? true : false
                    },
                    action: (data) => func({a: 1})
                }
            ]
        });

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( ()=> {
        }).catch((e)=> {
            code.expect(e.errorCode).to.equal(1);
            code.expect(retryCount).to.equal(1);
        });
    });

});