const lab = require("lab").script();
const code = require("code");

exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Error Handling Step Test", () => {

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
            code.expect(result.c).to.equal(3);
        });
    });

    lab.test("should add data from onError response to result", () => {
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
            code.expect(result.b).to.not.be.undefined();
            code.expect(result.a).to.equal(1);
        });
    });

    lab.test("should add data from onError execution tree to result", () => {
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
                    onError: [{
                        title: "step 'on error'",
                        action: (data) => {
                            return {b:-1};
                        }
                    }]
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
            code.expect(result.b).to.not.be.undefined();
            code.expect(result.a).to.equal(1);
        });
    });


    lab.test("Throw error in continue on error should stop the execution", () => {
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
                    onError: ()=> {
                        return Promise.reject("error");
                    }
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

        return execute.run(executionTree, executionData).catch((error) => {
            code.expect(error).to.equal("error");
        });
    });

});