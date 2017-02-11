var overrides = function () {

}

// this is a copy of jscad function
overrides.generateOutputFile = function () {
  this.clearOutputFile();
  if(!this.hasValidCurrentObject)
    return;
  var blob = this.currentObjectToBlob();

  var format = this.selectedFormat();

  var formatInfo = this.formatInfo (format);

  /*displayName: "STL",
extension: "stl",
mimetype: "application/sla",*/

  var params = {};
  try {params = this.getParamValues ()} catch (e) {};

  var suffix = '';
  if ('part' in params && params.part.match (/(\w+)/)) {
    suffix += '-' + params.part.match (/(\w+)/)[1].toLowerCase ();
  }

  if ('version' in params && params.version.match (/([\w\.\-_]+)/)) {
    suffix += '-v' + params.version.match (/([\w\.\-_]+)/)[1];
  }

  var fileName = atom.showSaveDialogSync ({
    defaultPath: path.join (path.dirname (this.filename), path.basename (this.filename, path.extname (this.filename)) + suffix + '.' + formatInfo.extension),
    filters: [
      {name: formatInfo.displayName, extensions: [formatInfo.extension]}
    ]
  });

  if (!fileName)
    return;

  var fileExt = path.extname (fileName).substr (1);

  console.log ("saving into", fileName, fileExt);

  var reader = new FileReader();
  reader.addEventListener("loadend", function() {
    // TODO: find a way to pass ArrayBuffer into node
    // TODO: show progress bar
    // var resultStr = String.fromCharCode.apply(null, new Uint8Array(reader.result));
    // var resultStr = String.fromCharCode.apply(null, reader.result);
    var resultStr = reader.result;
    var firstComma = resultStr.indexOf(',');
    var data = unescape(resultStr.substring(firstComma + 1));

    var buffer = new Buffer(data, 'base64');

    fs.writeFile (fileName, buffer);
  });
  reader.readAsDataURL (blob);
}

overrides.parseJsCadScriptSync = function parseJsCadScriptSync (script, mainParameters, options) {
    var workerscript = "";
    workerscript += "var _csg_includesdir=" + JSON.stringify(options.includesDir + '/')+"; ";
    workerscript += script;
    workerscript += OpenJsCad.makeAbsoluteUrl.toString().replace ('function', 'function _csg_makeAbsoluteURL')+";\n";
    workerscript += OpenJsCad.includeJscad.toString().replace ('function', 'function include')+'\n';

    return parseJsCadScriptSync.__old (workerscript, mainParameters, options);
}

overrides.parseJsCadScriptSync.static = true;

overrides.parseJsCadScriptASync = function parseJsCadScriptASync (script, mainParameters, options, callback) {
    var workerscript = "";
    workerscript += "var _csg_includesdir=" + JSON.stringify(options.includesDir + '/')+"; ";
    workerscript += script;
    workerscript += OpenJsCad.makeAbsoluteUrl.toString().replace ('function', 'function _csg_makeAbsoluteURL')+";\n";
    workerscript += OpenJsCad.includeJscad.toString().replace ('function', 'function include')+'\n';

    return parseJsCadScriptASync.__old (workerscript, mainParameters, options, callback);
}

overrides.parseJsCadScriptASync.static = true;

overrides.includeJscad = function (fn) {
// include the requested script via MemFs if possible
  if (typeof(gMemFs) == 'object') {
    for (var i = 0; i < gMemFs.length; i++) {
      if (gMemFs[i].name == fn) {
        eval(gMemFs[i].source);
        return;
      }
    }
  }
// include the requested script via importScripts
  var url = _csg_makeAbsoluteURL(fn, _csg_includesdir);
  if (fn.match(/^(https:|http:)/i)) {
    url = fn;
  }
  if (typeof importScripts !== "undefined") {
    self.postMessage({cmd: 'log', txt: 'importing ' + url + '('+fn + '*'+_csg_includesdir+')'});
    if (url[0] === '/') {
      url = 'file://' + url;
    }
    importScripts(url);
  } else if (typeof evalFile !== 'undefined') {
    // this is pointless to have urls when processing imports in node
    evalFile (url);
  } else {
    var xhr = new XMLHttpRequest();
    xhr.open('GET',url,false);
    xhr.onload = function() {
      var src = this.responseText;
      eval(src);
    };
    xhr.onerror = function(e) {
      console.log (e);
      throw e;
    };
    xhr.send();
  }
  return true;
};

overrides.includeJscad.static = true;

// parse the jscad script to get the parameter definitions
overrides.getParamDefinitions = function getParamDefinitions (script, options) {

  var params = [];

   if (typeof process !== "undefined" && process.versions && process.versions.node) {
    // for node we have vm module
    var vm = require ('vm');
    console.log (options.includesDir);
    var sandbox = {
      _csg_includesdir: options.includesDir + '/',
      _csg_makeAbsoluteURL: OpenJsCad.makeAbsoluteUrl,
      // include: includeJscad,
      evalFile: function (path) {
        var fs = require ('fs');
        var c = fs.readFileSync (path);

        var vm = require ('vm');

        vm.runInContext (c, sandbox);
      },
      params: [],
      require: require
    };

    vm.createContext(sandbox);

    vm.runInContext (OpenJsCad.includeJscad.toString ().replace ('function', 'function include'), sandbox, {
    });

    // first try to execute the script itself
    // will throw exception in case of any error
    vm.runInContext (script, sandbox, {
      // filename <string> Specifies the filename used in stack traces produced by this script.
      // lineOffset <number> Specifies the line number offset that is displayed in stack traces produced by this script.
      // columnOffset <number> Specifies the column number offset that is displayed in stack traces produced by this script.
      // displayErrors <boolean> When true, if an Error error occurs while compiling the code, the line of code causing the error is attached to the stack trace.
      // timeout <number> Specifies the number of milliseconds to execute code before terminating execution. If execution is terminated, an Error will be thrown.
    });

    vm.runInContext ("if(typeof(getParameterDefinitions) == 'function') {params = getParameterDefinitions();}", sandbox, {});

    params = sandbox.params;
  } else {
    return getParamDefinitions.__old (script, options);
  }

  if( (typeof(params) != "object") || (typeof(params.length) != "number") )
  {
    throw new Error("The getParameterDefinitions() function should return an array with the parameter definitions");
  }
  return params;
};

overrides.getParamDefinitions.static = true;

module.exports = overrides;
