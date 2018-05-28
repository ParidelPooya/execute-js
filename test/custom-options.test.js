const lab = require("lab").script();
const code = require("code");

exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Custom Options Test", () => {

    lab.test("Executing with empty option should work", () => {
        let execute = new Execute({});

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: (data) => {return {a: 1};}
            }
        ]);

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result.a).to.equal(1);
        });
    });

});