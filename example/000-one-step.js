let execute = require("../src/index");

let executionTree = [
    {
        title: "step 1",
        action: (data) => {return {a: 1};}
    }
];



let executionData = {
    sub_id :123
};

execute(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
}).catch( (e)=> {
    console.log("catch", e);
});
