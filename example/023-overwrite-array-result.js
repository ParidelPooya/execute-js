let Execute = require("../src/index");

let executionTree = [
    {
        title:"step 0",
        action: (data)=>{
            return [1,2,3];
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
];

let executionData = {
    Code: "code1",
    Type: "type1"
};
let execute = new Execute();
execute.run(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
}).catch( ()=> {
    console.log("catch");
});
