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

let executionData = {};

let execute = new Execute();

execute.run(executionTree, executionData)
.then( (result)=> {
    console.log("finished with this result:");
    console.log(JSON.stringify(result, null, 2));
})
.catch( (e)=> {
    console.log("catch", e);
});

// Console output will look something like this:
//
//{
//  "a": 1,
//  "b": 2,
//  "c": 3
//}
```

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
