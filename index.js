const streamz = require('streamz');
const createTree = require('functional-red-black-tree');


module.exports = function(input, scoreFn, options) {
  let max_score;
  let min_score = -Infinity;
  let viewed = 0, pass = 0, extracted = 0, total = 0, monitor;

  options = options || {};

  if (options.monitor) {
    monitor = setInterval( () => {
      const mem = Math.round(process.memoryUsage().rss/1000000);
      const toPercent = d => total && Math.round(d / total * 1000)/10 || '?';
      console.log(`<Streamsorter P:${pass} V:${viewed} (${toPercent(viewed)}%) E:${extracted} (${toPercent(extracted)}%)  M:${mem}mb>`);
   
    }, 1000);
  }

  const out = streamz(stream => {
    pass++;
    let records = createTree();
    stream()
      .pipe(streamz(d => {
        viewed++;
        const score = scoreFn(d);
        if (isNaN(score)) {
          throw new Error('Score has to be a number');
        }
        if (score > min_score && (!max_score || score < max_score)) {
          if (options.saveScore) {
            d.score = score;
          }

          records = records.insert(score,d);
          if (options.maxRecords && records.length > options.maxRecords ||
              options.maxMemory && process.memoryUsage().rss > options.maxMemory) {
            records = records.remove(records.begin.key);
            min_score = records.begin.key;
          }
        }
      }))
      .promise()
      .then(() => {
        total = total || viewed;
        extracted += records.length;
        viewed = 0;
        let cursor = records.end;
        while (cursor.key) {
          out.push(cursor.value);
          cursor.prev();
        }

        if (min_score > -Infinity) {
          max_score = min_score;
          min_score = -Infinity;
          return out.write(stream);
        } else {
          out.end();
        }
      })
      .catch(e => {
        clearInterval(monitor);
        out.emit('error',e);
      });
  },{keepAlive: true,
    highWaterMark: options.highWaterMark || 1000
  });

  out.write(input);

  out.on('end', () => clearInterval(monitor));

  return out;
};

