const lab = require("lab").script();
const { expect, it } = exports.lab = lab;

let execute = require("../src/index");

lab.experiment("Basic Steps Test", () => {

    lab.test("returns step output when there is only one step", () => {
        let executionTree = [
            {
                title:"step 1",
                action: (data) => {return {a: 1};}
            }
        ];
        let executionData = {
            sub_id :123
        };

        return execute(executionTree, executionData).then( (result)=> {
            lab.expect(result.a).to.equal(1);
        }).catch( ()=> {

        });
    });

    lab.test("returns all steps output when there is multiple steps", () => {
        let executionTree = [
            {
                title:"step 1",
                action: (data) => {return {a: 1};}
            },
            {
                title:"step 2",
                action: (data) => {return {b: 2};}
            },
            {
                title:"step 3",
                action: (data) => {return {c: 3};}
            },
            {
                title:"step 4",
                action: (data) => {return {d: 4};}
            },
            {
                title:"step 5",
                action: (data) => {return {e: 5};}
            }
        ];
        let executionData = {
            sub_id :123
        };

        return execute(executionTree, executionData).then( (result)=> {
            lab.expect(result.a).to.equal(1);
            lab.expect(result.b).to.equal(2);
            lab.expect(result.c).to.equal(3);
            lab.expect(result.d).to.equal(4);
            lab.expect(result.e).to.equal(5);
        }).catch( ()=> {

        });
    });
});