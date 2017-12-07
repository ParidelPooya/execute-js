let Execute = require("../src/index");

let execute = new Execute();

let executionTree = Execute.prepareExecutionTree([
    {
        title:"step 1",
        test: data => data.Code === "code1",
        if: {
            true:[
                {
                    title:"step 2",
                    action: (data)=> {return {b: 2};}
                }
            ],
            false:[
                {
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

execute.run(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
}).catch( ()=> {
    console.log("catch");
});
