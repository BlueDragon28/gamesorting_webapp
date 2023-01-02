/*
A tool to easily allow express to catch exceptions thrown in async functions
*/

module.exports = function(func) {
    return function(req, res, next) {
        func(req, res, next).catch(next);
    }
}