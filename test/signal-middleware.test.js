const lab = require("lab").script();
const code = require("code");

exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Signal middleware Test", () => {

    lab.test("signal middleware should should stop execution tree", () => {
        let execute = new Execute();


        let executionTree = Execute.prepareExecutionTree([
            {
                title: "step 1",
                action: (data) => ({a: 1}),
            },
            {
                title: "step 2",
                actionType: "signal",
                action: Execute.executionMode.STOP_ENTIRE_EXECUTION,
                output: {
                    map: {
                        destination: "start"
                    }
                }
            },
            {
                title: "step 3",
                action: (data) => ({b: 2}),
            },

        ]);

        let executionData = {};

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result.a).to.be.equal(1);
            code.expect(result.b).to.be.undefined();
        });
    });

});