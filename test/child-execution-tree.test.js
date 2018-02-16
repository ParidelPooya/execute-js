const lab = require("lab").script();
exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Child Execution Tree Test", () => {

    lab.test("returns result from child execution tree", () => {
        let execute = new Execute();

        // prepareExecutionTree should run internally against this child execution tree
        let childExecutionTree = {
            concurrency: 1,
            steps :[
                {
                    title:"step c1",
                    action: (data) => ({z: 1})
                }
            ]
        };

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                actionType: "execution-tree",
                action: {
                    executionTree: childExecutionTree
                }
            }
        ]);

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.z).to.equal(1);
        });
    });

    lab.test("if data is specified then data should be used", () => {
        let execute = new Execute();

        // prepareExecutionTree should run internally against this child execution tree
        let childExecutionTree = {
            concurrency: 1,
            steps :[
                {
                    title:"step c1",
                    action: (data) => ({z: data.input})
                }
            ]
        };

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                actionType: "execution-tree",
                action: {
                    executionTree: childExecutionTree,
                    executionData: (data)=> ({input : data.code})
                }
            }
        ]);

        let executionData = {
            code :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.z).to.equal(123);
        });
    });

    lab.test("signal from child execution tree should be handled", () => {
        let execute = new Execute();

        // prepareExecutionTree should run internally against this child execution tree
        let childExecutionTree = {
            concurrency: 1,
            steps :[
                {
                    title:"step c1",
                    action: (data) => ({z: data.input})
                },
                {
                    test: (data) => data.input === 123,
                    if: {
                        true: Execute.executionMode.STOP_ENTIRE_EXECUTION,
                        false: Execute.executionMode.CONTINUE
                    }
                }
            ]
        };

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                actionType: "execution-tree",
                action: {
                    executionTree: childExecutionTree,
                    executionData: (data)=> ({input : data.code})
                }
            },
            {
                title:"step 2",
                action: () => ({x: "data"})
            },
        ]);

        let executionData = {
            code :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.x).to.be.undefined();
        });
    });

});