const lab = require("lab").script();
exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Basic Steps Test", () => {

    lab.test("returns step result when there is only one step", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: (data) => {return {a: 1};}
            }
        ]);

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.a).to.equal(1);
        });
    });

    lab.test("returns all steps result when there is multiple steps", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
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
        ]);

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.a).to.equal(1);
            lab.expect(result.b).to.equal(2);
            lab.expect(result.c).to.equal(3);
            lab.expect(result.d).to.equal(4);
            lab.expect(result.e).to.equal(5);
        });
    });

    lab.test("null should be overriden by number", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: (data) => {return {a: null};}
            },
            {
                title:"step 2",
                action: (data) => {return {a: 2};}
            }
        ]);

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.a).to.equal(2);
        });
    });

    lab.test("object should be overriden by null", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: (data) => {return {a: {x:1}};}
            },
            {
                title:"step 2",
                action: (data) => {return {a: null};}
            }
        ]);

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.a).to.equal(null);

        });
    });

    lab.test("number should be overriden by object", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: (data) => {return {a: 2};}
            },
            {
                title:"step 2",
                action: (data) => {return {a: {x:1}};}
            }
        ]);

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.a.x).to.equal(1);

        });
    });

    lab.test("2 objects should be combined", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                action: (data) => {return {a: {y:1}};}
            },
            {
                title:"step 2",
                action: (data) => {return {a: {x:1}};}
            }
        ]);

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.a.x).to.equal(1);
            lab.expect(result.a.y).to.equal(1);

        });
    });

    lab.test("null from condition should override the value of first step", () => {
        let execute = new Execute();

        let executionData = {
            Code: "code1",
            Type: "type1"
        };

        let executionTree = Execute.prepareExecutionTree([
            {
                id: "step1",
                title:"step 1",
                test: executionData.Code === "code1",
                action: (data)=> {return {b: {x:1}};},
                if: {
                    true:[
                        {
                            id: "step2",
                            title:"step 2",
                            action: (data)=> {return {b: null};}
                        }
                    ],
                    false:[
                        {
                            id: "step3",
                            title:"step 3",
                            action: (data)=> {return {b: 3};}
                        }
                    ]
                }
            }
        ]);

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.b).to.equal(null);
        });
    });

    lab.test("returns steps result when there is steps without action", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
            },
            {
                title:"step 2",
                action: (data) => {return {a: 1};}
            },
            {
                title:"step 3",
            }

        ]);

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            lab.expect(result.a).to.equal(1);
        });
    });

});