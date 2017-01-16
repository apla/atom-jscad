/*global OpenJsCad */
/*eslint no-console: 0*/

// console.trace('overrides.js');

// parse the jscad script to get the parameter definitions
/**
 * `getParamDefinitions` is overriden because it attempts to execute the script
 * to turn the scripts `getParamDefinitions` function.  To bypass CSP, the `OpenJsCad.Function`
 * loophole function needs to be used instead of the built-in `Function`.
 * @param  {String} script The `jscad` script to run.
 */
OpenJsCad.getParamDefinitions = function (script) {
  var scriptisvalid = true;
  script += '\nfunction include() {}'; // at least make it not throw an error so early
  var Fn = OpenJsCad.Function || Function;
  try {
    // first try to execute the script itself
    // this will catch any syntax errors
    //    BUT we can't introduce any new function!!!
    (new Fn(script)());
  } catch (e) {
    // console.error('getParamDefinitions', e);
    scriptisvalid = false;
  }
  var params = [];
  if (scriptisvalid) {
    var script1 = 'if(typeof(getParameterDefinitions) == \'function\') {return getParameterDefinitions();} else {return [];} ';
    script1 += script;
    var f = new Fn(script1);
    params = f();
    if ((typeof (params) != 'object') || (typeof (params.length) != 'number')) {
      throw new Error('The getParameterDefinitions() function should return an array with the parameter definitions');
    }
  }
  // console.warn('getParamDefinitions', params, scriptisvalid);
  return params;
};

OpenJsCad.Processor.prototype.setError = function setError(message) {
  if (typeof message == 'string') {
    if (message.length > 0) console.error('setError [string]:', message);
    this.errordiv.innerHTML = message;
  } else {
    console.error('setError [object]:', message);
    if (!message.lineno) console.warn('no lineno', message);
    var msg = `line ${message.lineno - 6}:${message.colno} ${message.message}`;

    this.errordiv.innerHTML = msg;
  }
};

var srcRe = /(?:src|href)=[']([^']*)/;
OpenJsCad.Processor.prototype.setStatus = function (txt) {
  if (typeof document !== 'undefined' && this.statusdiv) {
    // Look for href or src in txt string
    var href = srcRe.exec(txt);
    if (href && href.length > 1) {
      // replace it with a full path to the src.
      var newurl = this.baseurl + 'standalone/openjscad/' + href[1];
      this.statusdiv.innerHTML = txt.replace(href[1], newurl);
    } else {
      this.statusdiv.innerHTML = txt;
    }
  } else {
    OpenJsCad.log(txt);
  }
};

OpenJsCad.Processor.prototype.setLogClear = function setLogClear() {
  this.setLogLines = [];
  this.logdiv.innerHTML = '';
};

OpenJsCad.Processor.prototype.setLog = function setLog(level, ...args) {
  if (!this.setLogLines) this.setLogLines = [];
  var now = new Date();
  var elapsed = this.setLogLast ? now - this.setLogLast : 0;

  // console[level](`[${elapsed}]`, ...args);

  if (this.logdiv) {
    this.setLogLines.push({
      level: level,
      elapsed: elapsed,
      args: args
    });

    if (this.setLogLines.length > 10) this.setLogLines.shift();

    this.logdiv.innerHTML = this.setLogLines.map(function (line) {
      return `<div class="log-line log-${line.level}"> ${line.args.map(a => a.map(b => b.toString()).join(' '))}</div>`;
    }).join('\n');

    this.setLogLast = now;
  }
};

OpenJsCad.Processor.prototype.createElements = function createElements() {
  // console.warn('createElements override');
  var that = this; // for event handlers

  while (this.containerdiv.children.length > 0) {
    this.containerdiv.removeChild(0);
  }

  this.containerdiv.innerHTML = `
  <div class="viewer">
    <div class="status-overlay">
      <div class="topstatus">
        <div class="statusdiv"></div>
        <div class="versiondiv">version:</div>
      </div>
      <div class="logdiv"></div>
      <div class="errordiv"><pre></pre></div>
    </div>
  </div>
  <div class="selectdiv">
    <span>
      <input type="button" value="Abort">
      <input type="button" value="Clear Log">
      <select class="formatDropdown"></select>
      <input type="button" class="generate-button" value="Generate"></input>
    </span>
  </div>
  <div class="parameterstable">
    <table></table>
    <input type="button" id="updateButton" value="Update">
    <input type="checkbox" id="instantUpdate">
    <label for="instantUpdate">Instant Update</label>
  </div>
  <div class="hidden">
  <input type="range" id="startRange">
  <input type="range" id="endRange">
  </div>
  `;

  var viewerdiv = this.containerdiv.querySelector('div.viewer');
  this.logdiv = this.containerdiv.querySelector('div.logdiv');
  this.errordiv = this.containerdiv.querySelector('div.errordiv');
  this.errorpre = this.containerdiv.querySelector('div.errordiv pre');
  this.statusdiv = this.containerdiv.querySelector('div.statusdiv');
  this.statusspan = this.statusdiv;
  this.selectdiv = this.containerdiv.querySelector('div.selectdiv');
  this.abortbutton = this.containerdiv.querySelector('div.selectdiv span input[type="button"][value="Abort"]');
  this.clearlogbutton = this.containerdiv.querySelector('div.selectdiv span input[type="button"][value="Clear Log"]');
  this.parameterstable = this.containerdiv.querySelector('div.parameterstable table');
  this.formatDropdown = this.containerdiv.querySelector('div.selectdiv span select');
  this.generateOutputFileButton = this.containerdiv.querySelector('div.selectdiv span input.generate-button');

  this.currentFormat = 'stla';

  // if (false) {
  //   var i = 0;
  //
  //   function getRandomInt(min, max) {
  //     min = Math.ceil(min);
  //     max = Math.floor(max);
  //     return Math.floor(Math.random() * (max - min)) + min;
  //   }
  //
  //   that.setError('test error string');
  //   var stop = setInterval(function () {
  //     var k = getRandomInt(0, logger.levels.length);
  //     logger[logger.levels[k]](i++, 'test', k);
  //     if (i > 20) {
  //       clearInterval(stop);
  //       that.setError(new Error('test error: error object'));
  //     }
  //   }, 250);
  // }

  this.abortbutton.onclick = function ( /* e */ ) {
    that.abort();
  };

  this.clearlogbutton.onclick = function ( /* e */ ) {
    that.setLogClear();
  };

  this.formatDropdown.onchange = function ( /* e */ ) {
    that.currentFormat = that.formatDropdown.options[that.formatDropdown.selectedIndex].value;
    that.updateDownloadLink();
  };
  this.generateOutputFileButton.onclick = function ( /* e */ ) {
    that.generateOutputFile();
  };

  this.containerdiv.querySelector('#updateButton').onclick = function ( /* e */ ) {
    that.rebuildSolid();
  };

  try {
    that.viewer = new OpenJsCad.Viewer(viewerdiv, {}, that.opts.viewer);
  } catch (e) {
    viewerdiv.innerHTML = '<b><br><br>Error: ' + e.toString() + '</b><br><br>A browser with support for WebGL is required';
  }
};

OpenJsCad.Processor.prototype.rebuildSolidAsync = function () {
  // console.warn('rebuildSolidAsync overridden');
  var parameters = this.getParamValues();
  var script = this.getFullScript();

  if (!window.Worker) throw new Error("Worker threads are unsupported.");

  // create the worker
  var that = this;
  that.state = 1; // processing
  that.worker = OpenJsCad.createJscadWorker(this.baseurl + this.filename, script,
    // handle the results
    function (err, objs) {
      // console.log('rebuildSolidAsync', err, objs)
      that.worker = null;
      if (err) {
        that.setError(err);
        that.setStatus("Error.");
        that.state = 3; // incomplete
      } else {
        that.setCurrentObjects(objs);
        that.setStatus("Ready.");
        that.state = 2; // complete
      }
      that.enableItems();
    },
    function messages(data) {
      var commands = {
        'console': function (data) {
          // console.log('messages', data, that.setLog);
          that.setLog(data.level, data.args);
        }
      }
      commands[data.cmd](data.objects, data.cmd);
    }
  );
  // pass the libraries to the worker for import
  var libraries = this.opts.libraries.map(function (l) {
    return this.baseurl + this.opts.openJsCadPath + l;
  }, this);
  // start the worker
  that.worker.postMessage({
    cmd: "render",
    parameters: parameters,
    libraries: libraries
  });
}

// Create an worker (thread) for processing the JSCAD script into CSG/CAG objects
//
// fullurl  - URL to original script
// script   - FULL script with all possible support routines, etc
// callback - function to call, returning results or errors
//
// This function builds the Worker thread, which is started by a message
// The Worker thread (below) executes, and returns the results via another message.
//   (KIND OF LAME but that keeps the scope of variables and functions clean)
// Upon receiving the message, the callback routine is called with the results
//
OpenJsCad.createJscadWorker = function (fullurl, script, callback, message) {
  var self = this;
  // console.warn('createJscadWorker overridden', fullurl);
  // var source = buildJscadWorkerScript(fullurl, script);
  var source = `
onmessage = function(e) {
  include = includeJscad;
  self.relpath = "' + fullurl + '";
  wrapLogger();

  ${script}

  ${wrapLogger.toString()}

  ${includeJscad.toString()}
  ${runJscadWorker.toString()}
  runJscadWorker(e);
};`;

  var blobURL = OpenJsCad.textToBlobUrl(source);
  var w = new Worker(blobURL);

  // when the worker finishes
  // - call back the provided function with the results
  w.onmessage = function (e) {
    // console.log('onmessage', e.type || e, e.data || 'no data');
    if (e.data instanceof Object) {
      var data = e.data;
      var handlers = {
        rendered: function () {
          if (data.objects && data.objects.length) {
            var lookup = {
              'CAG': CAG,
              'CSG': CSG
            };
            var objects = data.objects.map(function (o) {
              return lookup[o['class']].fromCompactBinary(o);
            });
            // console.log('rendered', objects);
            callback(null, objects);
          } else {
            throw new Error('JSCAD Worker: missing \'objects\'');
          }
        },
        error: function () {
          callback(data.err, null);
        },
        log: function () {
          callback(data.txt, null);
        },
        console: function () {
          // console.log('w.onmessage console', data, self);
          message(data);
        }
      };
      if (handlers[data.cmd]) {
        handlers[data.cmd]();
      } else {
        console.error('no handler', data);
      }
    } else {
      console.error('e.data not object', e.data);
    }
  };
  // when there is an error
  // - call back the provided function with the error
  w.onerror = function (e) {
    console.error('w.onerror', e);
    // var errtxt = "Error in line " + e.lineno + ": " + e.message;
    callback(e, null);
  };

  return w;
};

// Run the JSCAD script via main()
//
// The message (event) must contain:
//   data.cmd        - 'render'
//   data.parameters - the parameter values to pass to main()
// The message (event) can also supply:
//   data.libraries  - the libraries (full URLs) to import
//
// (Note: This function is appended together with the JSCAD script)
//
function runJscadWorker(e) {
  var r = {
    cmd: 'error',
    txt: 'try again'
  };
  if (e.data instanceof Object) {
    var data = e.data;
    if (data.cmd == 'render') {
      // verify the command contents
      if (!data.parameters) {
        throw new Error('JSCAD Processor: missing \'parameters\'');
      }
      // setup the environment
      if (data.libraries && data.libraries.length) {
        data.libraries.map(function (l) {
          // console.log('runJscadWorker library', l);
          importScripts(l);
        });
      }

      // setup the script
      if (typeof (main) == 'function') {
        OpenJsCad.log.prevLogTime = Date.now();
        var results = main(data.parameters);
        if (!results.length) {
          results = [results];
        }

        var objects = results.map(function (o) {
          return o.toCompactBinary();
        });

        // return the results
        if (objects.length > 0) {
          r.cmd = 'rendered';
          r.objects = objects;
        } else {
          r.err = 'The JSCAD script must return one or more CSG or CAG solids.';
        }
      } else {
        r.err = 'The JSCAD script must contain a function main() which returns one or more CSG or CAG solids.';
      }
    } else {
      throw new Error('JSCAD Processor: invalid worker command: ' + data.cmd);
    }
  }
  postMessage(r);
}

function wrapLogger() {
  // console.log('wrapLogger');
  var levels = ['debug', 'info', 'warn', 'error', 'log'];

  levels.forEach(function (level) {
    // console.log('wrapping', level);
    // store the original
    console['_' + level] = console[level];

    console[level] = function (...args) {
      console['_' + level](...args);
      postMessage({
        cmd: 'console',
        objects: {
          level: level,
          args: args
        }
      });
    };

    // console[level]('test', level);
  });

  // console.trace('console', console);
}
