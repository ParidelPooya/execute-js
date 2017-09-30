let execute = require("../src/index");

let executionTree = {
    concurrency: 1,
    steps :[
        {
            title:"step 1"
        },
        {
            title:"step 2"
        }
    ]
};



let executionData = {
    sub_id :123
};

execute(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
}).catch( (e)=> {
    console.log("catch", e);
});
