const lab = require("lab").script();
exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Child Execution Tree Test", () => {

    lab.test("returns result from child execution tree", () => {
        let execute = new Execute();

        let childExecutionTree = Execute.prepareExecutionTree({
            concurrency: 1,
            steps :[
                {
                    title:"step c1",
                    action: (data) => ({z: 1})
                }
            ]
        });

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                actionType: "execution-tree",
                action: childExecutionTree
            }
        ]);

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.z).to.equal(1);
        });
    });




});