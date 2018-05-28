const lab = require("lab").script();
const code = require("code");

exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Condition Test", () => {

    lab.test("should execute the correct step based on condition (with function)", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                id: "step1",
                title:"step 1",
                test: data => data.Code === "code1",
                if: {
                    true:[
                        {
                            id: "step2",
                            title:"step 2",
                            action: (data)=> {return {b: 2};}
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

        let executionData = {
            Code: "code1",
            Type: "type1"
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result.b).to.equal(2);
        });
    });

    lab.test("should execute the default step none of the condition matched", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                id: "step1",
                title:"step 1",
                test: data => data.Code === "code1",
                if: {
                    default:[
                        {
                            id: "step2",
                            title:"step 2",
                            action: (data)=> {return {b: 2};}
                        }
                    ]
                }
            }
        ]);

        let executionData = {
            Code: "code1",
            Type: "type1"
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result.b).to.equal(2);
        });
    });

    lab.test("should throw error when the next step is missing", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                id: "step1",
                title:"step 1",
                test: data => data.Code === "code1",
                if: {

                }
            }
        ]);

        let executionData = {
            Code: "code1",
            Type: "type1"
        };

        return execute.run(executionTree, executionData).then( ()=> {
        }).catch( (e)=> {
            code.expect(e).to.equal("Unhandled scenario");
        });
    });


    lab.test("should execute the correct step based on condition (without function)", () => {
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
                if: {
                    true:[
                        {
                            id: "step2",
                            title:"step 2",
                            action: (data)=> {return {b: 2};}
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
            code.expect(result.b).to.equal(2);
        });
    });
});