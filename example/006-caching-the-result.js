'use strict';

let execute = require("../src/index");

const func = (data)=> {
    return new Promise((resolve, reject) => {

        setTimeout(()=> {
            console.log(data);
            resolve(data);
        }, Math.round(5000));
    });
};

const cacheOptions = {
    enable: true,
    ttl: 60,
    key: (data) => data.sub_id
};

let executionTree = {
    concurrency: 1,
    steps :[
        {
            cache: cacheOptions,
            title:'step 1',
            action: (data) => func({a: 1})
        },
        {
            cache: cacheOptions,
            title:'step 2',
            action: (data) => func({b: 2})
        },
        {
            cache: cacheOptions,
            title:'step 3',
            action: (data) => func({c: 3})
        },
        {
            cache: cacheOptions,
            title:'step 4',
            action: (data) => func({d: 4})
        },
        {
            cache: cacheOptions,
            title:'step 5',
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
}).catch( (e)=> {
    console.log("catch", e);
});
