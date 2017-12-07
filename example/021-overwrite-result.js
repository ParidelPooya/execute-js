let Execute = require("../src/index");

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

execute.run(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
}).catch( ()=> {
    console.log("catch");
});
