# Execute-js
[![Build Status](https://travis-ci.org/ParidelPooya/execute-js.svg?branch=master)](https://travis-ci.org/ParidelPooya/execute-js)
[![Coverage Status](https://coveralls.io/repos/github/ParidelPooya/execute-js/badge.svg?branch=master)](https://coveralls.io/github/ParidelPooya/execute-js?branch=master)
[![npm](https://img.shields.io/npm/v/execute-js.svg)](https://www.npmjs.com/package/execute-js)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/execute-js)
[![Known Vulnerabilities](https://snyk.io/test/github/paridelpooya/execute-js/badge.svg)](https://snyk.io/test/github/paridelpooya/execute-js)
[![license](https://img.shields.io/github/license/paridelpooya/execute-js.svg)](https://github.com/ParidelPooya/execute-js/blob/master/LICENSE)

Application workflow executor for JavaScrip

Execute-js is designed to accept workflow and data and it execute and run the workflow and return the result.
By using Execute-js you can keep your logic readable and in the same time you can use all feature of Execute-js by
configuring the setting.

## Table of Contents

- [Features](#features)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Maintainers](#maintainers)
- [Contribute](#contribute)
- [License](#license)

## Features

- Accept workflow as JSON object
- Define action for each step by a sync or async JavaScript function
- Accept a test and condition, each condition is a child workflow (another execution tree)
- Unlimited nested level
- Executing steps sequentially
- Executing steps in concurrent mode
- Threshold for maximum concurrency for each level
- Retry steps
- Retry condition
- Caching for each step
- Simple way to use different cache library
- Each step's result is configurable to be accessible to next steps or not
- Each step's result is configurable to be accessible in the final resultt or not
- Handling throw error and terminating the execution
- Ability to map and transfer each step result
- Ability to ignore step's error and continue the execution
- Ability to define new actions by middleware
- Predefined map middleware (action) to iterate arrays and repeat action for each itam.
- The parser log the whole process and debugging and fine tuning workflow and actions are simple.
- Logger is injectable and easy to replace
- Ability to terminate one level or entire execution by signals

## Install

```bash
npm install --save execute-js
```

## Usage

### 1.Executing multiple steps
Simplest way is to define one or more steps and use Execute-js to run it:
```js
let Execute = require("execute-js");

let executionTree = [
    {
        title: "step 1",
        action: (data) => {return {a: 1};}
    },
    {
        title: "step 2",
        action: (data) => {return {b: 2};}
    },
    {
        title: "step 3",
        action: (data) => {return {c: 3};}
    }
];

let execute = new Execute();

execute.run(executionTree, {})
.then( (result)=> {
    console.log(result);
});

// Console output will look something like this:
//{"a": 1,"b": 2,"c": 3}
```

### 2.Control output of step

As you see the return value of step's action will be added to final result.
And also each action has access to return value of previous steps. 
For example:

```js
let Execute = require("execute-js");

let executionTree = [
    {
        title: "step 1",
        action: (data) => {return {a: 1};}
    },
    {
        title: "step 2",
        action: (data) => {return {b: data.a + 1 };}
    }
];

let execute = new Execute();

execute.run(executionTree, {})
.then( (result)=> {
    console.log(result);
});

// Console output will look something like this:
//{"a": 1,"b": 2}
```

If you want more control over the return value of actions then there is output configuration for each step:
```js
{
    title: "step title",
    action: functionToCall,
    output: {
        accessibleToNextSteps: boolean, // value of action be accessible to next steps (same level) 
        addToResult: boolean, // value of action be accessible in result (and be accessible for parrent level)
        map: {
            source: string, // instead of adding the whole value we can point to part of the result
            destination: string // instead of adding the return value to root we can specify different path
        }
    }
}
```

Lets show each of them with an example.

**2.1 accessibleToNextSteps**: This example shows accessibleToNextSteps will hide the result from the the next step so the next step can't access data.a
```js
let Execute = require("execute-js");

let executionTree = [
    {
        title: "step 1",
        action: (data) => {return {a: 1};},
        output: {
            accessibleToNextSteps: false
        }
    },
    {
        title: "step 2",
        action: (data) => {return {b: data.a};}
        // because data.a is not accessible then b will be undefined
    }
];

let execute = new Execute();

execute.run(executionTree, {})
.then( (result)=> {
    console.log(result);
});

// Console output will look something like this:
//{"a": 1}
```

**2.2 addToResult**: If you want to use the result of one step internally but you don't want to add it to the final result then add addToResult to that step:
```js
let Execute = require("execute-js");

let executionTree = [
    {
        title: "step 1",
        action: (data) => {return {a: 1};},
        output: {
            addToResult: false
        }
    },
    {
        title: "step 2",
        action: (data) => {return {b: 2 };}
    }
];

let execute = new Execute();

execute.run(executionTree, {})
.then( (result)=> {
    console.log(result);
});

// Console output will look something like this:
//{"b": 2}
```

**2.3 map**: with map you have control to copy part of step's return to specefic location in final result:
```js
let Execute = require("execute-js");

let executionTree = [
    {
        title: "step 1",
        action: (data) => 
            {
                return {
                    status: 202,
                    result: [
                        {
                            title:"Title 1"
                        }
                    ]
                };
            },
        output: {
            map: {
                source: "result.0.title",
                destination: "subject"
            }
        }
    }
];

let execute = new Execute();

execute.run(executionTree, {})
.then( (result)=> {
    console.log(result);
});

// Console output will look something like this:
//{"result": "Title 1"}
```

### 3. Test, condition and child steps
So far we only execute steps without any condition. If you need to decide base on some parameters and then execute different steps then you need to add test, if and child steps:

```js
{
    title: "step title",
    test: testFunction,
    if: {
        branch1: childExecutionTree1,
        branch2: childExecutionTree2,
        ...,
        branchn: childExecutionTreeN,
        default: childExecutionTree
    }
}
```
test should point to a function that will return next branch name to execute, if none of the branches mathes the test result, then default branch will be executed.
Let show it with simple example:

```js
let Execute = require("execute-js");

let executionTree = [
    {
        id: "step1",
        title:"step 1",
        test: data => data.Code === "code1",
        if: {
            true:[
                {
                    id: "step2",
                    title:"step 2",
                    action: (data)=> {return {b: 2};}
                }
            ],
            false:[
                {
                    id: "step3",
                    title:"step 3",
                    action: (data)=> {return {b: 3};}
                }
            ]
        }
    }
];

let executionData = {
    Code: "code1",
    Type: "type1"
};

let execute = new Execute();

execute.run(executionTree, executionData)
.then( (result)=> {
    console.log(result);
});

// Console output will look something like this:
//{"b": 2}
```

The output will be {"b": 2} because based on the test branch "true" will be executed.
The test return value will be converted to string. So we can acheive the same result in this way:

```js
let Execute = require("execute-js");

let executionTree = [
    {
        id: "step1",
        title:"step 1",
        test: data => data.Code,
        if: {
            code1:[
                {
                    id: "step2",
                    title:"step 2",
                    action: (data)=> {return {b: 2};}
                }
            ],
            code2:[
                {
                    id: "step3",
                    title:"step 3",
                    action: (data)=> {return {b: 3};}
                }
            ]
        }
    }
];

let executionData = {
    Code: "code1",
    Type: "type1"
};

let execute = new Execute();

execute.run(executionTree, executionData)
.then( (result)=> {
    console.log(result);
});

// Console output will look something like this:
//{"b": 2}
```

Also if none of the branches match the test then default branch will be executed:

```js
let Execute = require("execute-js");

let executionTree = [
    {
        id: "step1",
        title:"step 1",
        test: data => data.Code,
        if: {
            code1:[
                {
                    id: "step2",
                    title:"step 2",
                    action: (data)=> {return {b: 2};}
                }
            ],
            code2:[
                {
                    id: "step3",
                    title:"step 3",
                    action: (data)=> {return {b: 3};}
                }
            ],
            default:[
                {
                    id: "step3",
                    title:"step 3",
                    action: (data)=> {return {b: 4};}
                }
            ]
        }
    }
];

let executionData = {
    Code: "code3",
    Type: "type1"
};

let execute = new Execute();

execute.run(executionTree, executionData)
.then( (result)=> {
    console.log(result);
});

// Console output will look something like this:
//{"b": 4}
```

Each branch should point to another execution tree.

###4. Terminating the execution


## API
TODO: Fill out API specification.

## Middleware
You can use middleware to add new feature to execute-js.

```js

```

## Maintainers

[@paridelpooya](https://github.com/paridelpooya)

## Contribute

PRs accepted.

## License

MIT © 2017 Pooya Paridel
