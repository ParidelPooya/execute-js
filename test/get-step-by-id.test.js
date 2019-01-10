const lab = require("lab").script();
const code = require("code");

exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Get Step By Id Test", () => {

    lab.test("returns step by passing id", () => {

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: (data) => {return {a: 1};}
            },
            {
                id: "id2",
                title:"step 2",
                action: (data) => {return {b: 1};}
            },
            {
                title:"step 3",
                action: (data) => {return {c: 1};}
            }
        ]);

        let step = Execute.getStepById(executionTree, "id2");

        code.expect(step.id).to.equal("id2");
    });

    lab.test("should return false if step is not found", () => {

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: (data) => {return {a: 1};}
            },
            {
                id: "id2",
                title:"step 2",
                action: (data) => {return {b: 1};}
            },
            {
                title:"step 3",
                action: (data) => {return {c: 1};}
            },
            {
                title:"step 3",
                test: (data) => data.code === "code1",
                if: {
                    continue: Execute.executionMode.CONTINUE,
                    true:[
                        {
                            id: "step3_1",
                            title:"step 2",
                            action: (data)=> {return {b: null};}
                        }
                    ],
                    false:[
                        {
                            id: "step3_2",
                            title:"step 3",
                            action: (data)=> {return {b: 3};}
                        }
                    ]
                }
            }
        ]);

        let step = Execute.getStepById(executionTree, "id5");

        code.expect(step).to.equal(false);
    });

    lab.test("should return false if step is in child execution tree and traverseChild is false", () => {

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: (data) => {return {a: 1};}
            },
            {
                id: "id2",
                title:"step 2",
                action: (data) => {return {b: 1};}
            },
            {
                title:"step 3",
                action: (data) => {return {c: 1};}
            },
            {
                title: "step 1",
                actionType: "map",
                action:{
                    array: (data) => data.array,
                    executionTree: [
                        {
                            id: "id3",
                            title: "step c1",
                            action: (data) => ({a:data.i})
                        },
                        {
                            title: "step c2",
                            action: (data) => ({b:data.i + 1})
                        }
                    ]
                }
            }
        ]);

        let step = Execute.getStepById(executionTree, "id3", false);

        code.expect(step).to.equal(false);
    });

    lab.test("should return the step if step is in child execution tree (map middleware) and traverseChild is true", () => {

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: (data) => {return {a: 1};}
            },
            {
                id: "id2",
                title:"step 2",
                action: (data) => {return {b: 1};}
            },
            {
                title:"step 3",
                action: (data) => {return {c: 1};}
            },
            {
                title: "step 4",
                actionType: "map",
                action:{
                    array: (data) => data.array,
                    executionTree: [
                        {
                            title: "step c1",
                            action: (data) => ({a:data.i})
                        },
                        {
                            title: "step c2",
                            action: (data) => ({b:data.i + 1})
                        }
                    ]
                }
            },
            {
                title: "step 5",
                actionType: "map",
                action:{
                    array: () => [1,2,3],
                    reducer: (data) => {return data + 1;}
                },
                output: {
                    addToResult: false,
                    accessibleToNextSteps: false,
                }
            },
            {
                title: "step 6",
                actionType: "map",
                action:{
                    array: (data) => data.array,
                    executionTree: [
                        {
                            title: "step c1",
                            action: (data) => ({a:data.i})
                        },
                        {
                            id: "id3",
                            title: "step c2",
                            action: (data) => ({b:data.i + 1})
                        }
                    ]
                }
            }
        ]);

        let step = Execute.getStepById(executionTree, "id3", true);

        code.expect(step !== false).to.equal(true);
    });

    lab.test("should return the step if step is in child execution tree (child tree middleware) and traverseChild is true", () => {

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: (data) => {return {a: 1};}
            },
            {
                title:"step 2",
                action: (data) => {return {b: 1};}
            },
            {
                title:"step 3",
                actionType: "execution-tree",
                action: {
                    executionTree: [
                        {
                            title:"step 1",
                            action: (data) => {return {a: 1};}
                        },
                        {
                            id: "id2",
                            title:"step 2",
                            action: (data) => {return {b: 1};}
                        },
                    ],
                    executionData: (data)=> ({input : data.code})
                }
            }

        ]);

        let step = Execute.getStepById(executionTree, "id2", true);

        code.expect(step !== false).to.equal(true);
    });

    lab.test("should return the step if step is in child execution tree (while middleware) and traverseChild is true", () => {

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: (data) => {return {a: 1};}
            },
            {
                title:"step 2",
                action: (data) => {return {b: 1};}
            },
            {
                title: "step c1",
                action: (data) => (new Date()),
                output: {
                    map: {
                        destination: "start"
                    }
                }
            },
            {
                title: "step c1",
                actionType: "while",
                action:{
                    test: (data) => (new Date()) - data.start < 1,
                    executionTree: [{
                        title: "step c1",
                        action: () => ({a:1})
                    }]
                },
                output: {
                    map: {
                        destination: "while_output"
                    }
                }
            },
            {
                title: "step c2",
                actionType: "while",
                action:{
                    test: (data) => (new Date()) - data.start < 2,
                },
                output: {
                    map: {
                        destination: "while_output"
                    }
                }
            },
            {
                title: "step c2",
                actionType: "while",
                action:{
                    test: (data) => (new Date()) - data.start < 5,
                    executionTree: [{
                        id: "id2",
                        title: "step c1",
                        action: () => ({a:1})
                    }]
                },
                output: {
                    map: {
                        destination: "while_output"
                    }
                }
            }

        ]);

        let step = Execute.getStepById(executionTree, "id2", true);

        code.expect(step !== false).to.equal(true);
    });

    lab.test("returns child step by passing id", () => {

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: (data) => {return {a: 1};}
            },
            {
                id: "id2",
                title:"step 2",
                action: (data) => {return {b: 1};}
            },
            {
                title:"step 3",
                test: (data) => data.code === "code1",
                if: {
                    true:[
                        {
                            id: "step3_1",
                            title:"step 2",
                            action: (data)=> {return {b: null};}
                        }
                    ],
                    false:[
                        {
                            id: "step3_2",
                            title:"step 3",
                            action: (data)=> {return {b: 3};}
                        }
                    ]
                }
            }
        ]);

        let step = Execute.getStepById(executionTree, "step3_1");

        code.expect(step.id).to.equal("step3_1");
    });

});