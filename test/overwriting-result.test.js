const lab = require("lab").script();
exports.lab = lab;

let Execute = require("../src/index");

lab.experiment("Overwriting Result Test", () => {

    lab.test("last step should overwrite the result of first step", () => {
        let execute = new Execute();

        let executionTree = Execute.prepareExecutionTree([
            {
                title:"step 0",
                action: (data)=>{
                    return {
                        a:1,
                        b:2
                    };
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
                                return {
                                    a: 0,
                                    b: 0,
                                    c: data.main.a + data.main.b
                                };
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
            lab.expect(result.main.a).to.equal(0);
            lab.expect(result.main.b).to.equal(0);
            lab.expect(result.main.c).to.equal(3);
        });
    });


});