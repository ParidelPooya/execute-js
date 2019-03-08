const lab = require("lab").script();
const code = require("code");

exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Loop array Test", () => {

    lab.test("should return an array contain the result for all items of input array", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
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
        ]);

        let executionData = {
            array :[1,2,3]
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result["different-node"]).to.equal([2,3,4]);
        });
    });

    lab.test("should return an array contain the result for all items of input array (with concurrency)", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title: "step 1",
                actionType: "map",
                action:{
                    array: (data) => data.array,
                    reducer: (data) => {return data + 1;},
                    concurrency: 22,
                },
                output: {
                    addToResult: true,
                    accessibleToNextSteps: true,
                    map: {
                        destination: "different-node"
                    }
                }
            }
        ]);

        let executionData = {
            array :[1,2,3]
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result["different-node"]).to.equal([2,3,4]);
        });
    });

    lab.test("map middleware should accept child execution tree", () => {
        let execute = new Execute();

        let childExecutionTree = [
            {
                title: "step c1",
                action: (data) => ({a:data.i})
            },
            {
                title: "step c2",
                action: (data) => ({b:data.i + 1})
            }
        ];

        let executionTree = Execute.prepareExecutionTree([
            {
                title: "step 1",
                actionType: "map",
                action:{
                    array: (data) => data.array,
                    executionTree: childExecutionTree
                }
            }
        ]);

        let executionData = {
            array :[{i:1},{i:2},{i:3}]
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result.length).to.equal(3);
        });
    });

    lab.test("map middleware should accept child execution tree and custom execution data", () => {
        let execute = new Execute();

        let childExecutionTree = Execute.prepareExecutionTree([
            {
                title: "step c1",
                action: (data) => ({a:data.item.i})
            },
            {
                title: "step c2",
                action: (data) => ({b:data.item.i + 1})
            }
        ]);

        let executionTree = Execute.prepareExecutionTree([
            {
                title: "step 1",
                actionType: "map",
                action:{
                    array: (data) => data.array,
                    executionData: (data, item) => {
                        return {
                            data: data,
                            item: item
                        };
                    },
                    executionTree: childExecutionTree
                }
            }
        ]);

        let executionData = {
            array :[{i:1},{i:2},{i:3}]
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result.length).to.equal(3);
            code.expect(result[0].a).to.equal(1);
        });
    });

});