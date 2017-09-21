'use strict';

let execute = require("../src/index");

const func = (data)=> {
    return new Promise((resolve, reject) => {
        if (Math.random() > 0.9) {
            resolve(data);
        } else {
            reject(null);
        }
    });
};


let executionTree = {
    concurrency: 1,
    steps :[
        {
            title:'step 1',
            retry: 10,
            action: (data) => func({a: 1})
        }
    ]
};



let executionData = {
    sub_id :123
};

execute(executionTree, executionData).then( (result)=> {
    console.log("finished with this result:");
    console.log(result);
}).catch( ()=> {
    console.log("catch");
});
