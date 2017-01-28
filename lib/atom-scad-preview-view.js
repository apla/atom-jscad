var AtomScadPreviewView;

var fs = require( 'fs' ),
  path = require( 'path' ),
  crypto = require( 'crypto' ),
  loophole = require ('loophole');

var Emitter = require('event-kit').Emitter;
var CompositeDisposable = require('event-kit').CompositeDisposable;

function absPackagePath (fileName) {
  return 'file://' + path.join(
    atom.packages.getLoadedPackage( 'atom-scad-preview' ).path,
    fileName
  );
}

var webFrame = require('electron').webFrame;

webFrame.registerURLSchemeAsBypassingCSP('blob');

module.exports = AtomScadPreviewView = (function() {

  function AtomScadPreviewView( pathname ) {
    var message;

    this.pathname = pathname;

    this.subscriptions = new CompositeDisposable;

    this.events = new Emitter ();

    console.log (pathname);

    this.fileIdentifier = crypto.createHash('md5').update( pathname ).digest("hex");

    var gProcessor;

    // window.jscadscript = fs.readFileSync( pathname ).toString();

    this.element = document.createElement('div');

    this.element.classList.add('atom-scad-preview');

    var viewer = this.viewer = document.createElement('div');
    viewer.id = 'viewer-' + this.fileIdentifier;

    this.element.appendChild (viewer);

    this.element.addEventListener ('contextmenu', function (evt) {
      evt.stopPropagation ();
      evt.preventDefault ();
    });

    this.loadDependencies();

  }

  function showError (err) {
    var detail = err.stack,
        message = err.message;

    atom.notifications.addError (message, {
      detail,
      dismissable: true
    });
  }

  // this is a copy of jscad function
  function generateOutputFile () {
    this.clearOutputFile();
    if(!this.hasValidCurrentObject)
      return;
    var blob = this.currentObjectToBlob();

    var format = this.selectedFormat();

    var formatInfo = this.formatInfo (format);

    /*displayName: "STL",
  extension: "stl",
  mimetype: "application/sla",*/

    var fileName = atom.showSaveDialogSync ({
      defaultPath: path.join (path.dirname (this.filename), path.basename (this.filename, path.extname (this.filename)) + '.' + formatInfo.extension),
      filters: [
        {name: formatInfo.displayName, extensions: [formatInfo.extension]}
      ]
    });

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


    return;

    var windowURL=OpenJsCad.getWindowURL();
    this.outputFileBlobUrl = windowURL.createObjectURL(blob)
    if(!this.outputFileBlobUrl) throw new Error("createObjectURL() failed");
    this.hasOutputFile = true;
    this.downloadOutputFileLink.href = this.outputFileBlobUrl;
    this.downloadOutputFileLink.innerHTML = this.downloadLinkTextForCurrentObject();
    var ext = this.selectedFormatInfo().extension;
    this.downloadOutputFileLink.setAttribute("download", "openjscad."+ext);
    this.enableItems();
    if(this.onchange) this.onchange();
  }

  AtomScadPreviewView.prototype.render = function () {
    // console.log( 'rendering ' + pathname);
    var jscadscript = fs.readFileSync (this.pathname).toString();
    this.processor.setJsCad (jscadscript, this.pathname);
  }

  AtomScadPreviewView.prototype.loadDependencies = function () {
    var jsDependencies = [
      'three.min.js',       // three.js
      'orbitcontrols.js',   // three.js
      'projector.js',       // three.js
      'canvasrenderer.js',  // three.js
      'jquery-2.1.3.min.js',
      'csg.js',
      'threecsg.js',        // three.js
      'openjscad.js',
      'openjscad.viewer.js',
      'openjscad.viewer.three.js',
      'formats.js'
    ].map (function (scriptName) {
      return absPackagePath (path.join ('standalone', scriptName))
    });

    var depsToLoad = jsDependencies.length;

    function dependencyLoaded (idx) {
      depsToLoad --;
      if (depsToLoad === 0) {
        OpenJsCad.AlertUserOfUncaughtExceptions();

        OpenJsCad.workerDeps = ['csg.js', 'openjscad.js', 'openscad.js']
          .map (function (scriptName) {return absPackagePath (path.join ('standalone', scriptName))});

        OpenJsCad.Function = loophole.Function;

        var modelColor = atom.config.get('atom-scad-preview.color');
        var bgColor    = atom.config.get('atom-scad-preview.backgroundColor');

        gProcessor = new OpenJsCad.Processor (this.viewer, {
          drawLines: atom.config.get('atom-scad-preview.drawLines'),
          drawFaces: atom.config.get('atom-scad-preview.drawFaces'),
          drawGrid:  atom.config.get('atom-scad-preview.drawGrid'),
          color: [modelColor.red/255, modelColor.green/255, modelColor.blue/255],
          bgColor: [bgColor.red/255, bgColor.green/255, bgColor.blue/255],
          viewerwidth: "100%",
          viewerheight: "100vh"
        }, this.onChange.bind (this));

        gProcessor.generateOutputFile = generateOutputFile;

        // gProcessor.setDebugging( true );

        this.processor = gProcessor;

        this.render();

      } else {
        loadDependency (idx+1);
      }
    }

    var loadDependency = function (idx) {
      var scriptName = jsDependencies[idx || 0];
      // console.log ('loading script', scriptName);
      var script = document.createElement('script');
      script.async = false;
      script.addEventListener ('load', dependencyLoaded.bind (this, idx || 0), false);
      script.addEventListener ('error', console.log.bind (console), false);
      script.src = scriptName;
      document.querySelector('head').appendChild(script);
    }.bind (this);

    loadDependency();


  }

  AtomScadPreviewView.prototype.onChange = function () {
    // console.log (this.processor.errorpre);

    // console.log ('onChange', this.processor.errorObject, this.processor);

    if (this.processor.errorObject)
      this.events.emit (
        'error',
        this.processor.errorObject
      );

    //
    // if (this.processor.errorpre.textContent) {
    // 	alert (this.processor.errorpre.textContent);
    // }
  }

  AtomScadPreviewView.prototype.handleResize = function () {
    try {
      this.processor.viewer.handleResize();
    } catch (e) {
      showError (e);
    }
  }

  AtomScadPreviewView.prototype.serialize = function() {};

  AtomScadPreviewView.prototype.destroy = function() {
    this.events.dispose ();
    this.subscriptions.dispose ();
    return this.element.remove ();
  };

  AtomScadPreviewView.prototype.getElement = function() {
    return this.element;
  };

  AtomScadPreviewView.prototype.getTitle = function() {
    return "❒ " + this.pathname.replace (new RegExp ('.*\\' + path.sep), '');
  };

  return AtomScadPreviewView;

})();
