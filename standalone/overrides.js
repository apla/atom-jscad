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

function Logger(logdiv) {
  var lines = [];
  var last = new Date();
  var levels = ['debug', 'info', 'warn', 'error'];

  function setDiv() {
    // console.debug('log', lines, logdiv);

    logdiv.innerHTML = lines.map(function (line) {
      return `<div class="log-line log-${line.level}"><span>[${line.elapsed}]</span> ${line.args.map(a => JSON.stringify(a)).join(' ')}</div>`;
    }).join('\n');
  }

  function log(level, ...args) {
    var now = new Date();
    var elapsed = now - last;

    console[level](`[${elapsed}]`, ...args);

    if (logdiv) {
      lines.push({
        level: level,
        elapsed: elapsed,
        args: args
      });

      if (lines.length > 10) lines.shift();

      setDiv();
    }

    last = now;
  }

  var loggers = levels.reduce(function (result, level) {
    result[level] = function (...args) {
      return log(level, ...args);
    };
    return result;
  }, {});

  return Object.assign(loggers, {
    clear: function clear() {
      lines = [];
      setDiv();
    },
    levels: levels
  });
}

OpenJsCad.Processor.prototype.createElements = function createElements() {
  // console.warn('createElements override');
  var that = this; // for event handlers

  while (this.containerdiv.children.length > 0) {
    this.containerdiv.removeChild(0);
  }

  this.containerdiv.innerHTML = `
  <div class="viewer">
    <div class="status-overlay">
      <div class="statusdiv"></div>
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

  logger = Logger(this.containerdiv.querySelector('div.logdiv'));

  if (false) {
    var i = 0;

    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min;
    }

    that.setError('test error string');
    var stop = setInterval(function () {
      var k = getRandomInt(0, logger.levels.length);
      logger[logger.levels[k]](i++, 'test', k);
      if (i > 20) {
        clearInterval(stop);
        that.setError(new Error('test error: error object'));
      }
    }, 250);
  }



  this.abortbutton.onclick = function ( /* e */ ) {
    that.abort();
  };

  this.clearlogbutton.onclick = function ( /* e */ ) {
    logger.clear();
  };

  this.formatDropdown.onchange = function ( /* e */ ) {
    that.currentFormat = that.formatDropdown.options[that.formatDropdown.selectedIndex].value;
    // console.warn('formatDropdown onchange', that.formatDropdown, that.currentFormat);
    that.updateDownloadLink();
  };
  this.generateOutputFileButton.onclick = function ( /* e */ ) {
    // console.log('generateOutputFileButton generateOutputFile', that.generateOutputFile);
    that.generateOutputFile();
  };

  this.containerdiv.querySelector('#updateButton').onclick = function ( /* e */ ) {
    // console.warn('updateButton rebuildSolid');
    that.rebuildSolid();
  };

  // function debounce(element, timeout, callback) {
  //   var size = {
  //     width: element.clientWidth,
  //     height: element.clientHeight
  //   };
  //   var start = new Date().getTime();
  //   var last = start;
  //   var unwatch = self.watch = setInterval(function debounce() {
  //     if (size.width != element.clientWidth || size.height != element.clientHeight) {
  //       last = new Date().getTime();
  //       size = {
  //         width: element.clientWidth,
  //         height: element.clientHeight
  //       };
  //     } else {
  //       var elapsed = new Date().getTime() - last;
  //       if (elapsed > timeout) {
  //         clearInterval(unwatch);
  //         var total = new Date().getTime() - start;
  //         callback(size, total);
  //       }
  //     }
  //   }, 50);
  // }
  //
  // debounce(viewerdiv, 500, function createViewer(size /*, total */ ) {
  //   // console.log('creating OpenJsCad.Viewer', size, total);
  try {
    that.viewer = new OpenJsCad.Viewer(viewerdiv, {}, that.opts.viewer);
  } catch (e) {
    viewerdiv.innerHTML = '<b><br><br>Error: ' + e.toString() + '</b><br><br>A browser with support for WebGL is required';
  }
  // });
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
//
OpenJsCad.createJscadWorker = function (fullurl, script, callback) {
  // console.warn('createJscadWorker overridden', fullurl);
  // var source = buildJscadWorkerScript(fullurl, script);
  var source = `
onmessage = function(e) {
  include = includeJscad;
  self.relpath = "' + fullurl + '";
  console.log('source');

  ${script}
  ${includeJscad.toString()}
  ${runJscadWorker.toString()}
  runJscadWorker(e);
};`
  var blobURL = OpenJsCad.textToBlobUrl(source);
  var w = new Worker(blobURL);

  // console.log('createJscadWorker\n', source.split('\n').slice(0, 25).map((s, i) => `${i} ${s}`).join('\n'));

  // when the worker finishes
  // - call back the provided function with the results
  w.onmessage = function (e) {
    // console.log('onmessage', e.type || e, e.data || 'no data');
    if (e.data instanceof Object) {
      var data = e.data;
      var handlers = {
        rendered: function () {
          if (data.objects && data.objects.length) {
            // convert the compact formats back to CSG / CAG form
            // var objects = [];
            // for (var i = 0; i < data.objects.length; i++) {
            //   var o = data.objects[i];
            //   if (o['class'] == 'CSG') {
            //     objects.push(CSG.fromCompactBinary(o));
            //   }
            //   if (o['class'] == 'CAG') {
            //     objects.push(CAG.fromCompactBinary(o));
            //   }
            // }
            var lookup = {
              'CAG': CAG,
              'CSG': CSG
            }
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
        }
      };
      if (handlers[data.cmd]) {
        handlers[data.cmd]();
      } else {
        console.error('no handler', data);
      }
      // if (data.cmd == 'rendered') {
      //   if (data.objects && data.objects.length) {
      //     // convert the compact formats back to CSG/CAG form
      //     var objects = [];
      //     for (var i = 0; i < data.objects.length; i++) {
      //       var o = data.objects[i];
      //       if (o['class'] == 'CSG') {
      //         objects.push(CSG.fromCompactBinary(o));
      //       }
      //       if (o['class'] == 'CAG') {
      //         objects.push(CAG.fromCompactBinary(o));
      //       }
      //     }
      //     callback(null, objects);
      //   } else {
      //     throw new Error('JSCAD Worker: missing \'objects\'');
      //   }
      // } else if (data.cmd == 'error') {
      //   callback(data.err, null);
      // } else if (data.cmd == 'log') {
      //   callback(data.txt, null);
      // } else {
      //   console.warn('no callback', data);
      // }
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
  // console.warn('runJscadWorker overridden');
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
          console.log('runJscadWorker library', l);
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
        // console.log('runJscadWorker', data, results);

        // // convert the results to a compact format for transfer back
        // // var objects = [];
        // // for (var i = 0; i < results.length; i++) {
        // //   var o = results[i];
        // //   if (o instanceof CAG || o instanceof CSG) {
        // //     objects.push(o.toCompactBinary());
        // //   }
        // // }
        var objects = results.map(function (o) {
          return o.toCompactBinary();
        });
        // console.log('runJscadWorker', objects);

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
  // console.trace('runJscadWorker r', r);
  postMessage(r);
}

//*******************************************
//                not used
//*******************************************

// Build the Worker script from the parts
//   fullpath   - URL to the original file
//   fullscript - full JSCAD script
// Note: The full script must be define all data and functions required
// function buildJscadWorkerScript(fullpath, fullscript) {
//   console.warn('buildJscadWorkerScript overridden');
//   // determine the relative base path for include(<relativepath>)
//   var relpath = fullpath;
//   if (relpath.lastIndexOf('/') >= 0) {
//     relpath = relpath.substring(0, relpath.lastIndexOf('/') + 1);
//   }
//   console.log('relpath', relpath, fullpath);
//   var source = "";
//   source += 'onmessage = function(e) {\n';
//   source += '  include = includeJscad;\n';
//   source += '  self.relpath = "' + relpath + '";\n';
//   source += '\n';
//   source += fullscript + '\n';
//   source += includeJscad.toString() + '\n';
//   source += runJscadWorker.toString() + '\n';
//   source += '  runJscadWorker(e);\n';
//   source += '};';
//
//   // console.log('source', source.split('\n').slice(0, 25).map((s, i) => `${i}:${s}`).join('\n'));
//   // console.log('source', source);
//   return source;
// }
//
// // This is called from within the web worker. Execute the main() function of the supplied script
// // and post a message to the calling thread when finished
// OpenJsCad.runMainInWorker = function (mainParameters) {
//   try {
//     if (typeof (main) != 'function') throw new Error('Your jscad file should contain a function main() which returns a CSG solid or a CAG area.');
//     OpenJsCad.log.prevLogTime = Date.now();
//     var result = main(mainParameters);
//     result = OpenJsCad.expandResultObjectArray(result);
//     OpenJsCad.checkResult(result);
//     var result_compact = OpenJsCad.resultToCompactBinary(result);
//     result = null; // not needed anymore
//     self.postMessage({
//       cmd: 'rendered',
//       result: result_compact
//     });
//   } catch (e) {
//     console.log('runMainInWorker', e);
//     var errtxt = e.toString();
//     if (e.stack) {
//       errtxt += '\nStack trace:\n' + e.stack;
//     }
//     self.postMessage({
//       cmd: 'error',
//       err: errtxt
//     });
//   }
// };
//
// // expand an array of CSG or CAG objects into an array of objects [{data: <CAG or CSG object>}]
// OpenJsCad.expandResultObjectArray = function (result) {
//   if (result instanceof Array) {
//     result = result.map(function (resultelement) {
//       if ((resultelement instanceof CSG) || (resultelement instanceof CAG)) {
//         resultelement = {
//           data: resultelement
//         };
//       }
//       return resultelement;
//     });
//   }
//   return result;
// };

// // check whether the supplied script returns valid object(s)
// OpenJsCad.checkResult = function (result) {
//   var ok = true;
//   if (typeof (result) != 'object') {
//     ok = false;
//   } else {
//     if (result instanceof Array) {
//       if (result.length < 1) {
//         ok = false;
//       } else {
//         result.forEach(function (resultelement) {
//           if (!('data' in resultelement)) {
//             ok = false;
//           } else {
//             if ((resultelement.data instanceof CSG) || (resultelement.data instanceof CAG)) {
//               // ok
//             } else {
//               ok = false;
//             }
//           }
//         });
//       }
//
//     } else if ((result instanceof CSG) || (result instanceof CAG)) {
//       // ok
//     } else {
//       ok = false;
//     }
//   }
//   if (!ok) {
//     throw new Error('Your main() function does not return valid data. It should return one of the following: a CSG object, a CAG object, an array of CSG/CAG objects, or an array of objects: [{name:, caption:, data:}, ...] where data contains a CSG or CAG object.');
//   }
// };

// // convert the result to a compact binary representation, to be copied from the webworker to the main thread.
// // it is assumed that checkResult() has been called already so the data is valid.
// OpenJsCad.resultToCompactBinary = function (resultin) {
//   var resultout;
//   if (resultin instanceof Array) {
//     resultout = resultin.map(function (resultelement) {
//       var r = resultelement;
//       r.data = resultelement.data.toCompactBinary();
//       return r;
//     });
//   } else {
//     resultout = resultin.toCompactBinary();
//   }
//   return resultout;
// };

// OpenJsCad.resultFromCompactBinary = function (resultin) {
//   function fromCompactBinary(r) {
//     var result;
//     if (r.class == 'CSG') {
//       result = CSG.fromCompactBinary(r);
//     } else if (r.class == 'CAG') {
//       result = CAG.fromCompactBinary(r);
//     } else {
//       throw new Error('Cannot parse result');
//     }
//     return result;
//   }
//   var resultout;
//   if (resultin instanceof Array) {
//     resultout = resultin.map(function (resultelement) {
//       var r = resultelement;
//       r.data = fromCompactBinary(resultelement.data);
//       return r;
//     });
//   } else {
//     resultout = fromCompactBinary(resultin);
//   }
//   return resultout;
// };

//
// OpenJsCad.parseJsCadScriptSync = function (script, mainParameters, debugging) {
//   console.error('asp parseJsCadScriptSync', script, mainParameters, debugging);
//   var workerscript = '';
//   workerscript += script;
//   if (debugging) {
//     workerscript += '\n\n\n\n\n\n\n/* -------------------------------------------------------------------------\n';
//     workerscript += 'OpenJsCad debugging\n\nAssuming you are running Chrome:\nF10 steps over an instruction\nF11 steps into an instruction\n';
//     workerscript += 'F8  continues running\nPress the (||) button at the bottom to enable pausing whenever an error occurs\n';
//     workerscript += 'Click on a line number to set or clear a breakpoint\n';
//     workerscript += 'For more information see: http://code.google.com/chrome/devtools/docs/overview.html\n\n';
//     workerscript += '------------------------------------------------------------------------- */\n';
//     workerscript += '\n\n// Now press F11 twice to enter your main() function:\n\n';
//     workerscript += 'debugger;\n';
//   }
//   workerscript += 'return main(' + JSON.stringify(mainParameters) + ');';
//   var Fn = OpenJsCad.Function || Function;
//   var f = new Fn(workerscript);
//   OpenJsCad.log.prevLogTime = Date.now();
//   var result = f();
//   result = OpenJsCad.expandResultObjectArray(result);
//   OpenJsCad.checkResult(result);
//   return result;
// };
//
// // callback: should be function(error, csg)
// OpenJsCad.parseJsCadScriptASync = function (script, mainParameters, options, callback) {
//
//   console.error('asp parseJsCadScriptASync', script, mainParameters, options);
//   var baselibraries = OpenJsCad.workerDeps;
//   console.log('baselibraries', baselibraries);
//   var baseurl = document.location.href.replace(/\?.*$/, '');
//   // var baseurl = 'file:///Users/matias/.atom/packages/atom-scad-preview';
//   var openjscadurl = baseurl;
//
//   if (typeof options['openJsCadPath'] != 'undefined') {
//     // trailing '/' indicates it is a folder. This is necessary because makeAbsoluteUrl is called
//     // on openjscadurl
//     openjscadurl = OpenJsCad.makeAbsoluteUrl(options['openJsCadPath'], baseurl) + '/';
//   }
//
//   var libraries = [];
//   if (typeof options['libraries'] != 'undefined') {
//     libraries = options['libraries'];
//   }
//
//   var workerscript = '';
//   workerscript += script;
//   workerscript += '\n\n\n\n//// The following code is added by OpenJsCad:\n';
//   workerscript += 'var _csg_baselibraries=' + JSON.stringify(baselibraries) + ';\n';
//   workerscript += 'var _csg_libraries=' + JSON.stringify(libraries) + ';\n';
//   workerscript += 'var _csg_baseurl=' + JSON.stringify(baseurl) + ';\n';
//   workerscript += 'var _csg_openjscadurl=' + JSON.stringify(openjscadurl) + ';\n';
//   workerscript += 'var _csg_makeAbsoluteURL=' + OpenJsCad.makeAbsoluteUrl.toString() + ';\n';
//   workerscript += '_csg_baselibraries = _csg_baselibraries.map(function(l){return _csg_makeAbsoluteURL(l,_csg_openjscadurl);});\n';
//   workerscript += '_csg_libraries = _csg_libraries.map(function(l){return _csg_makeAbsoluteURL(l,_csg_baseurl);});\n';
//   workerscript += '_csg_baselibraries.map(function(l){importScripts(l)});\n';
//   workerscript += '_csg_libraries.map(function(l){importScripts(l)});\n';
//   workerscript += 'self.addEventListener(\'message\', function(e) {if(e.data && e.data.cmd == \'render\'){';
//   workerscript += '  OpenJsCad.runMainInWorker(' + JSON.stringify(mainParameters) + ');';
//   workerscript += '}},false);\n';
//
//   console.log('script', script);
//   var blobURL = OpenJsCad.textToBlobUrl(workerscript);
//
//   if (!window.Worker) throw new Error('Your browser doesn\'t support Web Workers. Please try the Chrome browser instead.');
//   var worker = new Worker(blobURL);
//   worker.onmessage = function (e) {
//     if (e.data) {
//       if (e.data.cmd == 'rendered') {
//         // var resulttype = e.data.result.class;
//         var result = OpenJsCad.resultFromCompactBinary(e.data.result);
//         callback(null, result);
//       } else if (e.data.cmd == 'error') {
//         callback(e.data.err, null);
//       } else if (e.data.cmd == 'log') {
//         console.log(e.data.txt);
//       }
//     }
//   };
//   worker.onerror = function (e) {
//     callback(e, null);
//   };
//   worker.postMessage({
//     cmd: 'render'
//   }); // Start the worker.
//   return worker;
// };
