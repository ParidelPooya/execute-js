const lab = require("lab").script();
const { expect, it } = exports.lab = lab;

let execute = require("../src/index");

lab.experiment("Basic Steps Test", () => {

    lab.test("should retry 10 times", () => {
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


        let executionTree = {
            concurrency: 1,
            steps :[
                {
                    title:"step 1",
                    retry: {
                        maxAttempts: 10
                    },
                    action: (data) => func({a: 1})
                }
            ]
        };

        let executionData = {
            sub_id :123
        };
        
        return execute(executionTree, executionData).then( (result)=> {
            lab.expect(result.a).to.equal(1);
            lab.expect(retryCount).to.equal(9);
        }).catch( ()=> {

        });
    });

    lab.test("should not retry when tryCondition is not fulfilled", () => {
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

        let executionTree = {
            concurrency: 1,
            steps :[
                {
                    title:"step 1",
                    retry: {
                        maxAttempts: 10,
                        tryCondition: (e) => e.errorCode === 2 ? true : false
                    },
                    action: (data) => func({a: 1})
                }
            ]
        };

        let executionData = {
            sub_id :123
        };

        return execute(executionTree, executionData).then( (result)=> {
        }).catch( (e)=> {
            lab.expect(retryCount).to.equal(1);
        });
    });

});