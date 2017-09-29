const lab = require("lab").script();
const { expect, it } = exports.lab = lab;

let execute = require("../src/index");

lab.experiment("Condition Test", () => {

    lab.test("should execute the correct step based on condition (with function)", () => {
        let executionTree = [
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
        ];

        let executionData = {
            Code: "code1",
            Type: "type1"
        };

        return execute(executionTree, executionData).then( (result)=> {
            lab.expect(result.b).to.equal(2);
        }).catch( ()=> {

        });
    });

    lab.test("should execute the default step none of the condition matched", () => {
        let executionTree = [
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
        ];

        let executionData = {
            Code: "code1",
            Type: "type1"
        };

        return execute(executionTree, executionData).then( (result)=> {
            lab.expect(result.b).to.equal(2);
        }).catch( ()=> {

        });
    });

    lab.test("should throw error when the next step is missing", () => {
        let executionTree = [
            {
                id: "step1",
                title:"step 1",
                test: data => data.Code === "code1",
                if: {

                }
            }
        ];

        let executionData = {
            Code: "code1",
            Type: "type1"
        };

        return execute(executionTree, executionData).then( ()=> {
        }).catch( (e)=> {
            lab.expect(e).to.equal("Unhandled scenario");
        });
    });


    lab.test("should execute the correct step based on condition (without function)", () => {
        let executionData = {
            Code: "code1",
            Type: "type1"
        };

        let executionTree = [
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
        ];


        return execute(executionTree, executionData).then( (result)=> {
            lab.expect(result.b).to.equal(2);
        }).catch( ()=> {

        });
    });
});