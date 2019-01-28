const lab = require("lab").script();
const code = require("code");

exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Not Waiting for the result", () => {

    lab.test("returns step result when there is only one step", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: () => {
                    return new Promise( (resolve) => {
                        setTimeout(resolve, 1000);
                    }).then(() => ({a:1}));
                },
                output: {
                    waitForTheResult: false,
                }

            },
            {
                title:"step 1",
                action: () => ({b: 2}),
            }

        ]);

        let executionData = {
            sub_id :123
        };

        let startTime = new Date();

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result.a).to.be.undefined();
            code.expect((new Date() - startTime) < 1000).to.equal(true);
        });
    });

});