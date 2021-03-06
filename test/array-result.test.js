const lab = require("lab").script();
const code = require("code");

exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Array Result Test", () => {

    lab.test("Second array should override the first one when destination is not empty", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 0",
                action: (data)=>{
                    return [0,1,2,4,5];
                },
                output: {
                    map: {
                        source: "",
                        destination: "main"
                    }
                }
            },
            {
                title:"step 1",
                test: data => data.Code === "code1",
                if: {
                    true:[
                        {
                            title:"step 2",
                            action: (data)=> {
                                return [2,3,4];
                            }
                        }
                    ]
                },
                output: {
                    map: {
                        source: "",
                        destination: "main"
                    }
                }

            }
        ]);

        let executionData = {
            Code: "code1",
            Type: "type1"
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result.main.length).to.equal(3);
        });
    });

    lab.test("Arrays should concat when destination is empty", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 1",
                test: data => data.Code === "code1",
                if: {
                    true:[
                        {
                            title:"step 2",
                            action: (data)=> {
                                return [1];
                            }
                        },
                        {
                            title:"step 2",
                            action: (data)=> {
                                return [2];
                            }
                        },
                        {
                            title:"step 2",
                            action: (data)=> {
                                return [3];
                            }
                        }
                    ]
                },
                output: {
                    map: {
                        source: "",
                        destination: "main"
                    }
                }

            }
        ]);

        let executionData = {
            Code: "code1",
            Type: "type1"
        };

        return execute.run(executionTree, executionData).then( (result)=> {
            code.expect(result.main.length).to.equal(3);
        });
    });


});