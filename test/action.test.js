const lab = require("lab").script();
exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Action Test", () => {

    lab.test("Action with Promise result should handled correctly", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: (data) => {return Promise.resolve({a: 1});}
            }
        ]);

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.a).to.equal(1);
        });
    });

    lab.test("Action with Promise result should handled correctly with actionType promise", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                actionType: Execute.builtinActionType.PROMISE,
                action: (data) => {return Promise.resolve({a: 1});}
            }
        ]);

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.a).to.equal(1);
        });
    });

});