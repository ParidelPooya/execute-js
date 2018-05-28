const lab = require("lab").script();
const code = require("code");

exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Signal - ", () => {

    lab.test("should ignore step 3", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title: "step 1",
                action: (data) => {return {a: 1};}
            },
            {
                title: "step 2",
                action: (data) => {return {b: 2};},
                test: (data) => data.sub_id === 123,
                if: {
                    true: Execute.executionMode.STOP_LEVEL_EXECUTION,
                    false: Execute.executionMode.CONTINUE
                }
            },
            {
                title: "step 3",
                action: (data) => {return {c: 3};}
            }
        ]);

        let executionData = {
            sub_id :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result.c).to.be.undefined();
        });
    });

    lab.test("should ignore level execution", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title: "step 1",
                action: (data) => {return {a: 1};}
            },
            {
                title: "step 2",
                test: (data) => data.type === 2,
                if: {
                    true: [
                        {
                            title: "step 2-1",
                            action: (data) => {return {c: 3};}
                        },
                        {
                            title: "step 2-2",
                            action: (data) => {return {d: 4};}
                        },
                        {
                            title: "step 2-3",
                            test: (data) => data.sub_type === 123,
                            if: {
                                true: Execute.executionMode.STOP_LEVEL_EXECUTION,
                                false: Execute.executionMode.CONTINUE
                            }
                        },
                        {
                            title: "step 2-4",
                            action: (data) => {return {e: 5};}
                        },
                    ],
                    false: Execute.executionMode.CONTINUE
                }
            },
            {
                title: "step 3",
                action: (data) => {return {f: 6};}
            }
        ]);



        let executionData = {
            type: 2,
            sub_type :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result.a).to.equal(1);
            code.expect(result.c).to.equal(3);
            code.expect(result.d).to.equal(4);
            code.expect(result.e).to.be.undefined();
            code.expect(result.f).to.equal(6);
        });
    });

    lab.test("should ignore entire execution", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title: "step 1",
                action: (data) => {return {a: 1};}
            },
            {
                title: "step 2",
                test: (data) => data.type === 2,
                if: {
                    true: [
                        {
                            title: "step 2-1",
                            action: (data) => {return {c: 3};}
                        },
                        {
                            title: "step 2-2",
                            action: (data) => {return {d: 4};}
                        },
                        {
                            title: "step 2-3",
                            test: (data) => data.sub_type === 123,
                            if: {
                                true: Execute.executionMode.STOP_ENTIRE_EXECUTION,
                                false: Execute.executionMode.CONTINUE
                            }
                        },
                        {
                            title: "step 2-4",
                            action: (data) => {return {e: 5};}
                        },
                    ],
                    false: Execute.executionMode.CONTINUE
                }
            },
            {
                title: "step 3",
                action: (data) => {return {f: 6};}
            }
        ]);

        let executionData = {
            type: 2,
            sub_type :123
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result.a).to.equal(1);
            code.expect(result.c).to.equal(3);
            code.expect(result.d).to.equal(4);
            code.expect(result.e).to.be.undefined();
            code.expect(result.f).to.be.undefined();
        });
    });

});