const lab = require("lab").script();
exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Loop array Test", () => {

    lab.test("should return an array contain the result for all items of input array", () => {
        let executionTree = [
            {
                title: "step 1",
                actionType: "map",
                action:{
                    array: (data) => data.array,
                    reducer: (data) => {return data + 1;}
                },
                output: {
                    addToResult: true,
                    accessibleToNextSteps: true,
                    map: {
                        destination: "different-node"
                    }
                }
            }
        ];

        let executionData = {
            array :[1,2,3]
        };
        let execute = new Execute();
        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result["different-node"]).to.equal([2,3,4]);
        });
    });


});