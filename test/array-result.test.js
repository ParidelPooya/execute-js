const lab = require("lab").script();
exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Array Result Test", () => {

    lab.test("Two array should concat to one", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 0",
                action: (data)=>{
                    return [0,1,2];
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
            lab.expect(result.main.length).to.equal(6);
        });
    });

    lab.test("result of object and array should be an object", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 0",
                action: (data)=>{
                    return {a:1, b:2};
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
            lab.expect(Array.isArray(result.main)).to.equal(false);
        });
    });

});