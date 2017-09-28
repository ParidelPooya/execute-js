const lab = require('lab').script();
const { expect, it } = exports.lab = lab;

let execute = require("../src/index");

lab.experiment('math', () => {

    lab.test('returns true when 1 + 1 equals 2', () => {
        let executionTree = [
            {
                title:'step 1',
                action: (data) => {return {a: 1};}
            }
        ];
        let executionData = {
            sub_id :123
        };

        return execute(executionTree, executionData).then( (result)=> {
            lab.expect(result.a).to.equal(1);
        }).catch( (e)=> {

        });
    });
});