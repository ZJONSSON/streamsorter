# Streamsorter

```js
module.exports = function(input, scoreFn, options) {...
```

Streamsorter returns a stream of sorted records by doing a multipass on an input stream.  The input has to be a function that returns a fresh copy of the input stream.  The `scoreFn` should be a function that takes each record as input and returns a score that is used to sort. For now each score has to be unique.  You can limit the size of the array in each pass by either specifying `maxRecords` or `maxMemory` (in bytes).  When the sortStream hits this limit it will have to do another pass on the input stream.  If you set `monitor` to `true` you will get stats every second on the process.