const lab = require("lab").script();
exports.lab = lab;

let execute = require("../src/index");

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

        return execute(executionTree, executionData, {}).then( (result)=> {
            lab.expect(result.a).to.equal(1);
        }).catch( ()=> {

        });
    });

});