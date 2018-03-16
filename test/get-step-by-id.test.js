const lab = require("lab").script();
exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Get Step By Id Test", () => {

    lab.test("returns step by passing id", (done) => {

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

        lab.expect(step.id).to.equal("id2");
        done();
    });

    lab.test("should return false if step is not found", (done) => {

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

        lab.expect(step).to.equal(false);
        done();
    });

    lab.test("returns child step by passing id", (done) => {

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

        lab.expect(step.id).to.equal("step3_1");
        done();
    });

});