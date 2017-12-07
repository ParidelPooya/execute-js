const lab = require("lab").script();
exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Changing Output Tests", () => {

    lab.test("result of steps should overwrite eachother", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree({
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
                },
                {
                    title:"step 3",
                    action: (data) => {return {c: 3} ;},
                    output: {
                        addToResult: false,
                        accessibleToNextSteps: false
                    }
                }
            ]
        });

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.differentNode.subnode.b).to.equal(2);
            lab.expect(result.a).to.be.undefined();
            lab.expect(result.c).to.be.undefined();
        });
    });

    lab.test("nested step with mapper should works", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree({
            concurrency: 1,
            steps :[
                {
                    title:"step 1",
                    test: data => data.sub_id === 123,
                    if: {
                        true:[
                            {
                                title:"step 1-1",
                                action: (data)=> {return {from: {x: 2}};}
                            }
                        ],
                        false:[
                            {
                                title:"step 1-2",
                                action: (data)=> {return {y: 3};}
                            }
                        ]
                    },
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
                },
                {
                    title:"step 3",
                    action: (data) => {return {c: 3} ;},
                    output: {
                        addToResult: false,
                        accessibleToNextSteps: false
                    }
                }
            ]
        });

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.differentNode.subnode.b).to.equal(2);
            lab.expect(result.differentNode.subnode.x).to.equal(2);
            lab.expect(result.c).to.be.undefined();
        });
    });
});