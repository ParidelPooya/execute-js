const lab = require("lab").script();
exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Loop array Test", () => {

    lab.test("map middleware should accept child execution tree", () => {
        let execute = new Execute();

        let childExecutionTree = [
            {
                title: "step c1",
                action: (data) => ({a:1})
            }
        ];

        let executionTree = Execute.prepareExecutionTree([
            {
                title: "step c1",
                action: (data) => (new Date()),
                output: {
                    map: {
                        destination: "start"
                    }
                }
            },
            {
                title: "step 1",
                actionType: "while",
                action:{
                    test: (data) => (new Date()) - data.start < 5,
                    executionTree: childExecutionTree
                },
                output: {
                    map: {
                        destination: "while_output"
                    }
                }
            }
        ]);

        let executionData = {};

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(Array.isArray(result.while_output)).to.equal(true);
        });
    });


});