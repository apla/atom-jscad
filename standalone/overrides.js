/*global OpenJsCad includeJscad importScripts main */
/*eslint no-console: 0*/


// parse the jscad script to get the parameter definitions
/**
 * `getParamDefinitions` is overriden because it attempts to execute the jscad script
 * and run the scripts `getParamDefinitions` function.  To bypass CSP, the `
 * ion`
 * loophole function needs to be used instead of the built-in `Function`.
 * @param  {String} script The `jscad` script to run.
 */
OpenJsCad.getParamDefinitions = function getParamDefinitions(script) {
  var scriptisvalid = true;
  script += '\nfunction include() {}'; // at least make it not throw an error so early
  var Fn = OpenJsCad.Function || Function;
  try {
    // first try to execute the script itself
    // this will catch any syntax errors
    //    BUT we can't introduce any new function!!!
    (new Fn(script)());
  } catch (e) {
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
  return params;
};

/**
 * Overwrite the setError method.  This will attempt to fix the lineno
 * after the jscad script is appended to the worker script.
 */
OpenJsCad.Processor.prototype.setError = function override_setError(message) {
  if (typeof message == 'string') {
    if (message.length > 0) console.error('setError [string]:', message);
    this.errordiv.innerHTML = message;
  } else {
    console.log('setError [object]:', message);
    // if (!message.lineno) console.warn('no lineno', message);
    var msg = `line ${message.lineno || message.lineNumber}:${message.colno || message.columnNumber} ${message.message}`;

    this.errordiv.innerHTML = `${msg}
<pre>${message.stack}</pre>`;
  }
};

/**
 * Regular expresion to find a `src` or `href` attribute in the status string.
 * @type {RegExp}
 */
var srcRe = /(?:src|href)=[']([^']*)/;

/**
 * Overwrite the setStatus method.  This searches the status line for
 * `href` or `src` and sets the path to the full `baseurl` path.
 * OpenJsCad 5.2 uses a spinning gif for the busy message, this makes
 * the image work.
 */
OpenJsCad.Processor.prototype.setStatus = function setStatus(txt) {
  console.log('setStatus', txt);
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

/**
 * Clear the log buffer
 */
OpenJsCad.Processor.prototype.setLogClear = function setLogClear() {
  this.setLogLines = [];
  this.logdiv.innerHTML = '';
};

/**
 * Log a message to the log buffer and display it in the `logdiv`.
 * @param {String} level logging level
 * @param {Array} args  The arguments of the log call
 */
OpenJsCad.Processor.prototype.setLog = function setLog(level, ...args) {
  if (!this.setLogLines) this.setLogLines = [];
  var now = new Date();
  var elapsed = now - this.rebuildStartTime;

  if (this.logdiv) {
    this.setLogLines.push({
      level: level,
      elapsed: elapsed,
      args: args
    });

    if (this.setLogLines.length > 100) this.setLogLines.shift();

    this.logdiv.innerHTML = this.setLogLines.map(function (line) {

      var argstr = line.args[0].map(function (arg) {
        var type = typeof arg;
        var str = arg;
        if (type == 'object') {
          str = JSON.stringify(arg, null, 2);
        }
        return `<span class="arg-${type}">${str}</span>`;
      }).join(' ');

      // only include elapsed timing in `debug` logs
      var timerstr = level == 'debug' ? `<span>[${elapsed}]</span>` : '';
      return `
<div class="log-line log-${line.level}">${timerstr}${argstr}</div>`;
    }).join('\n');

    this.setLogLast = now;
    this.logdiv.scrollTop = this.logdiv.scrollHeight - this.logdiv.clientHeight;
  }
};

/**
 * Overwrite the `createElements` method.  Creates a new layout and hooks up
 * all of the events.
 */
OpenJsCad.Processor.prototype.createElements = function createElements() {
  var that = this; // for event handlers

  while (this.containerdiv.children.length > 0) {
    this.containerdiv.removeChild(0);
  }

  this.containerdiv.innerHTML = `
  <div class="viewer">
    <div class="logging-overlay">
      <div class="topstatus">
      </div>
      <div class="logdiv"></div>
      <div class="errordiv"><pre></pre></div>
    </div>
    <div class="statusdiv"></div>
    <div class="versiondiv"></div>
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

  this.containerdiv.querySelector('div.versiondiv').innerHTML = `OpenJsCad version: ${OpenJsCad.version}`;

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

OpenJsCad.Processor.prototype.rebuildSolidSync = function override_rebuildSolidSync() {
  console.warn('override_rebuildSolidSync', this.baseurl, this.filename);
  var parameters = this.getParamValues();
  try {
    this.state = 1; // processing
    var func = override_createJscadFunction(this, this.baseurl, this.filename, this.script);
    if (func) {
      var start = performance.now();
      var objs = func(parameters, this.setLog);
      this.setCurrentObjects(objs);
      var end = performance.now();
      this.setStatus(`Ready. (${(end - start).toFixed(4)}ms)`);
      this.state = 2; // complete
    } else {
      // this.setError(func);
      this.setStatus('Evaluation Error.');
      this.state = 3; // incomplete
    }
  } catch (err) {
    this.setError(err);
    this.setStatus('Error.');
    this.state = 3; // incomplete
  }
  this.enableItems();
};

// Create an function for processing the JSCAD script into CSG/CAG objects
//
// fullurl  - URL to original script
// script   - FULL script with all possible support routines, etc
// callback - function to call, returning results or errors
//
// This function creates an anonymous Function, which is invoked to execute the thread.
// The function executes in the GLOBAL context, so all necessary parameters are provided.
//
function override_createJscadFunction(processor, relpath, scripturl, script, callback) {
  // console.log('override_createJscadFunction', scripturl, relpath);

  var source = `
  var relpath = "${relpath}";
    
  ${script}

  return main(params);`;

  console.log('SOURCE: ' + source);
  var Fn = OpenJsCad.Function || Function;
  try {
    var f = new Fn('params', 'setLog', source);
    return f;
  } catch (e) {
    processor.setError( {
      name: e.name,
      message: e.message,
      fileName: scripturl,
      lineNumber: e.lineNumber,
      stack: e.stack
    });
  }
}

/**
 * Overwrite `rebuildSolidAsync`, the primary rendering method.  This method
 * provides the primary communcation between the Worker and the Plugin.  The
 * jscad script is run in the worker while the UI is running in the Plugin.
 *
 * Added a new message type `console` to capture log messages and display them
 * in the Plugin UI.  The `log`, `debug`, `info`, `warn`, and `error` methods on the
 * console object are wrapped so they call the `messages` callback.
 */
OpenJsCad.Processor.prototype.rebuildSolidAsync = function override_rebuildSolidAsync() {
  this.rebuildStartTime = new Date(); // to show elapsed time with the log.

  // console.warn('rebuildSolidAsync overridden');
  var parameters = this.getParamValues();
  var script = this.getFullScript();

  if (!window.Worker) throw new Error('Worker threads are unsupported.');

  // create the worker
  var that = this;
  that.state = 1; // processing
  var start = performance.now();
  
  
  that.worker = OpenJsCad.createJscadWorker(this.baseurl + this.filename, script,
    // handle the results
    function createJscadWorker_Callback(err, objs) {
      that.worker = null;
      if (err) {
        that.setError(err);
        that.setStatus('Error.');
        that.state = 3; // incomplete
      } else {
        that.setCurrentObjects(objs);
        var end = performance.now();
        that.setStatus(`Ready. (${(end - start).toFixed(4)}ms)`);
        that.state = 2; // complete
      }
      that.enableItems();
    },
    function createJscadWorker_messages(data) {
      var commands = {
        'console': function (data) {
          that.setLog(data.level, data.args);
        }
      };
      commands[data.cmd](data.objects, data.cmd);
    }
  );
  // pass the libraries to the worker for import
  var libraries = this.opts.libraries.map(function (l) {
    return this.baseurl + this.opts.openJsCadPath + l;
  }, this);
  // start the worker
  that.worker.postMessage({
    cmd: 'render',
    parameters: parameters,
    libraries: libraries
  });
};

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

/**
 * Overwrite the `createJscadWorker` function.  This is primary rendering method.
 * The jscad script is injected into the source script for the Worker to process.
 * @param  {String}   fullurl  The full url path to the script
 * @param  {String}   script   The jscad script
 * @param  {Function} callback Primary callback for errors and the script output
 * @param  {Function}   message  A callback for messages to be sent to the UI
 * @return {Worker}            The Worker object
 */
OpenJsCad.createJscadWorker = function (fullurl, script, callback, message) {
  // var self = this;

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
    console.trace('w.onerror', e);
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

/**
 * This method is injected into the Worker script in `createJscadWorker`.  Only
 * one message is used: `render`.  Adds the libraries and runs `main()`, the
 * results are sent to the UI via a `postMessage` call.
 * @param  {MessageEvent} e message event to the Worker
 */
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

/**
 * This method is injected into the Worker script in `createJscadWorker`.  It
 * saves then overwrites the console methods in `levels`.  The wrapped methods
 * will use the original method and send a `postMessage` with the level and
 * arguments for display in the Plugin UI.
 */
function wrapLogger() {
  var levels = ['debug', 'info', 'warn', 'error', 'log'];

  levels.forEach(function (level) {
    // store the original
    console['_' + level] = console[level];

    console[level] = function (...args) {
      console['_' + level]('wrapLogger', ...args);
      postMessage({
        cmd: 'console',
        objects: {
          level: level,
          args: args
        }
      });
    };
  });
}

// /**
//  * This method is injected into the Worker script in `createJscadWorker`.  It
//  * saves then overwrites the console methods in `levels`.  The wrapped methods
//  * will use the original method and send a `postMessage` with the level and
//  * arguments for display in the Plugin UI.
//  */
// function wrapLoggerSync(setLog) {
//   // console.log('wrapLoggerSync', setLog);
//   var levels = ['debug', 'info', 'warn', 'error', 'log'];
// 
//   levels.forEach(function (level) {
//     // store the original
//     console['_' + level] = console[level];
// 
//     console[level] = function (...args) {
//       console['_' + level]('wrapLogger', ...args);
//       setLog(level, ...args);
//     };
//   });
// }
