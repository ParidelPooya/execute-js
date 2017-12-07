const lab = require("lab").script();
exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Custom Options Test", () => {

    lab.test("Executing with empty option should work", () => {
        let executionTree = [
            {
                title:"step 1",
                action: (data) => {return {a: 1};}
            }
        ];
        let executionData = {
            sub_id :123
        };
        let execute = new Execute({});
        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.a).to.equal(1);
        });
    });

});