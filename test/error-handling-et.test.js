const lab = require("lab").script();
const code = require("code");

exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Error Handling Execution Tree Test", () => {

    lab.test("should continue after throwing error", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree({
            errorHandling: {
                continueOnError: true,
                onError: ()=> {return {x:1};}
            },
            steps:[
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
                    }
                },
                {
                    title: "step 3",
                    action: (data) => {
                        return {c: 3};
                    }
                }
            ]
        });


        let executionData = {
            sub_id: 123
        };

        return execute.run(executionTree, executionData).then((result) => {
            code.expect(result.x).to.equal(1);
        });
    });

    lab.test("should add data from onError execution tree to result", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree({
            errorHandling: {
                continueOnError: true,
                onError: [{
                    title: "step 'on error'",
                    action: (data) => {
                        return {x:-1};
                    }
                }]
            },
            steps:[
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
                    }
                },
                {
                    title: "step 3",
                    action: (data) => {
                        return {c: 3};
                    }
                }
            ]
        });


        let executionData = {
            sub_id: 123
        };

        return execute.run(executionTree, executionData).then((result) => {
            code.expect(result.x).to.equal(-1);
        });
    });

});