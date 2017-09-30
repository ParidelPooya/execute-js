let execute = require("../src/index");

const func = (data)=> {
    return new Promise((resolve) => {

        setTimeout(()=> {
            console.log(data);
            resolve(data);
        }, Math.round(Math.random()*1000));
    });
};


let executionTree = {
    concurrency: 2,
    steps :[
        {
            title:"step 1",
            action: (data) => func({a: 1})
        },
        {
            title:"step 2",
            action: (data) => func({b: 2})
        },
        {
            title:"step 3",
            action: (data) => func({c: 3})
        },
        {
            title:"step 4",
            action: (data) => func({d: 4})
        },
        {
            title:"step 5",
            action: (data) => func({e: 5})
        }
    ]
};



let executionData = {
    sub_id :123
};

execute(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
});
