const executionMode = {
    CONTINUE: 0,
    STOP_LEVEL_EXECUTION: 1,
    STOP_ENTIRE_EXECUTION: 2
};

const builtinActionType = {
    DEFAULT: "default",
    PROMISE: "promise",
    MAP: "map",
    WHILE: "while",
    CHILD_EXECUTION_TREE: "execution-tree"
};

const executionTreeDefaultSetting = {
    title: "No name execution tree",
    concurrency: 1,
    cache: {
        enable: false,
        ttl: 60
    },
    errorHandling: {
        maxAttempts: 0,
        tryCondition: () => true,
        continueOnError: false,
        onError: () => ({})
    },
    statistics:{
        count:0,
        total:0,
        min: Number.MAX_VALUE,
        max:0,
        errors:0,
        cache: {
            missesNo: 0,
            missesTotal: 0,

            hitsNo:0,
            hitsTotal: 0
        }
    }
};

const middlewareDefaultSetting = {
    statistics:{
        count:0,
        total:0,
        min: Number.MAX_VALUE,
        max:0,
        errors:0,
        cache: {
            missesNo: 0,
            missesTotal: 0,

            hitsNo:0,
            hitsTotal: 0
        }
    }
};

const stepDefaultSetting = {
    title: "No name step",
    errorHandling: {
        maxAttempts: 0,
        tryCondition: () => true,
        continueOnError: false,
        onError: () => ({}),
    },
    circuitBreaker: {
        enable: false,
        duration: 10000,
        threshold: 0.4,
        waitThreshold: 50,
        shortCircuitStartTime: 0,
        shortCircuited: false,
        shortCircuitCount: 0,
        failed: 0,
        successful: 0
    },
    cache: {
        enable: false,
        ttl: 60
    },
    output: {
        waitForTheResult: true,
        accessibleToNextSteps: true,
        addToResult: true,
        map: {
            source: "",
            destination: ""
        }
    },
    actionType: "default",
    action: () => ({}),
    statistics:{
        count:0,
        total:0,
        min: Number.MAX_VALUE,
        max:0,
        errors:0,
        cache: {
            missesNo: 0,
            missesTotal: 0,

            hitsNo:0,
            hitsTotal: 0
        }
    }
};

const eventsTitle = {
    testResult: "Test Result",

    actionRetry: "Retry Step's Action",
    actionFailed: "Step's Action Failed",
    continueOnError: "Step's Action Failed, Continue Executing",

    executionTreeActionRetry: "Retry Executing Execution Tree",
    executionTreeActionFailed: "Executing Execution Tree Failed",
    executionTreeContinueOnError: "Executing Execution Tree Failed, Continue Executing",

    cacheHit: "Step's Cache Hit, Data Exist in Cache",
    cacheMiss: "Step's Cache Miss, Data doesn't Exist in Cache",
    cacheSet: "Step's Cache Set, Data Inserted to Cache",

    middlewareCacheHit: "middleware's Cache Hit, Data Exist in Cache",
    middlewareCacheMiss: "middleware's Cache Miss, Data doesn't Exist in Cache",
    middlewareCacheSet: "middleware's Cache Set, Data Inserted to Cache",

    executionTreeCacheHit: "Execution Tree's Cache Hit, Data Exist in Cache",
    executionTreeCacheMiss: "Execution Tree's Cache Miss, Data doesn't Exist in Cache",
    executionTreeCacheSet: "Execution Tree's Cache Set, Data Inserted to Cache",

    stepStartProcessing: "Start Processing Step",
    childFinished: "Child Execution Tree Returned Data",
    stepFinished: "Step Execution Finished"
};

module.exports = {
    executionMode: executionMode,
    builtinActionType: builtinActionType,
    executionTreeDefaultSetting: executionTreeDefaultSetting,
    middlewareDefaultSetting: middlewareDefaultSetting,
    stepDefaultSetting: stepDefaultSetting,
    eventsTitle: eventsTitle,
};

