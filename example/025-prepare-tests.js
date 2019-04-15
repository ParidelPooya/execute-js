let Execute = require("../src/index");

//let execute = new Execute();

let executionTree = Execute.prepareExecutionTree([
    {
        action: (data)=> {return {a: 1};},
        test: data => data.Code === "code1",
        if: {
            true:[
                {
                    action: (data)=> {return {b: 2};},
                    test: data => data.Type === "type1",
                    if: {
                        true: [
                            {
                                action: (data)=> {return {c: 3};}
                            }
                        ]
                    }
                }
            ]
        }
    }
]);

console.log(JSON.stringify(executionTree,null,4));
