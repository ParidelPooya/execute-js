const lab = require("lab").script();

exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Error Handling Test", () => {

    lab.test("should continue after throwing error", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title: "step 1",
                action: (data) => {
                    return {a: 1};
                }
            },
            {
                title: "step 2",
                action: (data) => {
                    return Promise.reject({name: "error", message: "custom error"});
                },
                errorHandling: {
                    continueOnError: true
                }
            },
            {
                title: "step 3",
                action: (data) => {
                    return {c: 3};
                }
            }
        ]);


        let executionData = {
            sub_id: 123
        };

        return execute.run(executionTree, executionData).then((result) => {
            lab.expect(result.c).to.equal(3);
        });
    });

    lab.test("should add data from onErrorResponse to result", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title: "step 1",
                action: (data) => {
                    return {a: 1};
                }
            },
            {
                title: "step 2",
                action: (data) => {
                    return Promise.reject({name: "error", message: "custom error"});
                },
                errorHandling: {
                    continueOnError: true,
                    onError: ()=> {return {b:-1};}
                }
            },
            {
                title: "step 3",
                action: (data) => {
                    return {c: 3};
                }
            }
        ]);


        let executionData = {
            sub_id: 123
        };

        return execute.run(executionTree, executionData).then((result) => {
            lab.expect(result.b).to.not.be.undefined();
            lab.expect(result.a).to.equal(1);
        });
    });

});