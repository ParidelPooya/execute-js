const lab = require("lab").script();
const { expect, it } = exports.lab = lab;

let execute = require("../src/index");

lab.experiment("Changing Output Tests", () => {

    lab.test("result of steps should not overwrite eachother", () => {
        let executionTree = {
            concurrency: 1,
            steps :[
                {
                    title:"step 1",
                    action: (data) => {return {from: {a: 1}} ;},
                    output: {
                        addToResult: true,
                        accessibleToNextSteps: true,
                        map: {
                            source: "from",
                            destination: "differentNode.subnode"
                        }
                    }
                },
                {
                    title:"step 2",
                    action: (data) => {return {from: {b: 2}} ;},
                    output: {
                        addToResult: true,
                        accessibleToNextSteps: true,
                        map: {
                            source: "from",
                            destination: "differentNode.subnode"
                        }
                    }
                }
            ]
        };

        let executionData = {
            sub_id :123
        };

        return execute(executionTree, executionData).then( (result)=> {
            lab.expect(result.differentNode.subnode.a).to.equal(1);
            lab.expect(result.differentNode.subnode.a).to.equal(2);
        }).catch( ()=> {

        });
    });


});