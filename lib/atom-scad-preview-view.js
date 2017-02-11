var AtomScadPreviewView;

var fs = require( 'fs' ),
  path = require( 'path' ),
  crypto = require( 'crypto' ),
  loophole = require ('loophole');

var Emitter = require('event-kit').Emitter;
var CompositeDisposable = require('event-kit').CompositeDisposable;

var overrides = require ('../standalone/overrides.js');

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

  AtomScadPreviewView.prototype.render = function () {
    // console.log( 'rendering ' + pathname);

    if (!this.element.parentNode) {
      this.renderAfterAttach = true;
      return;
    }

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

        AtomScadPreviewView.initialized = true;

        OpenJsCad.AlertUserOfUncaughtExceptions();

        Object.keys (overrides).forEach (o => {
          if (overrides[o].static) {
            var old = OpenJsCad[o];
            OpenJsCad[o] = overrides[o];
            OpenJsCad[o].__old = old;
          } else {
            var old = OpenJsCad.Processor.prototype[o];
            OpenJsCad.Processor.prototype[o] = overrides[o];
            OpenJsCad.Processor.prototype[o].__old = old;
          }
        });

        OpenJsCad.workerDeps = ['csg.js', 'openjscad.js', 'openscad.js']
          .map (function (scriptName) {return absPackagePath (path.join ('standalone', scriptName))});

        OpenJsCad.Function = loophole.Function;

        var modelColor = atom.config.get('atom-scad-preview.color');
        var bgColor    = atom.config.get('atom-scad-preview.backgroundColor');

        var gProcessor = new OpenJsCad.Processor (this.viewer, {
          drawLines: atom.config.get('atom-scad-preview.drawLines'),
          drawFaces: atom.config.get('atom-scad-preview.drawFaces'),
          drawGrid:  atom.config.get('atom-scad-preview.drawGrid'),
          color: [modelColor.red/255, modelColor.green/255, modelColor.blue/255],
          bgColor: [bgColor.red/255, bgColor.green/255, bgColor.blue/255],
          viewerwidth: "100%",
          viewerheight: "100vh"
        }, this.onChange.bind (this));

        //gProcessor.generateOutputFile = generateOutputFile;

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
      script.addEventListener ('error', console.error.bind (console), false);
      script.src = scriptName;
      document.querySelector('head').appendChild(script);
    }.bind (this);

    if (AtomScadPreviewView.initialized) {
      depsToLoad = 1;
      dependencyLoaded.call (this, 1);
    } else {
      loadDependency ();
    }
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
      this.events.emit (
        'error',
        e
      );
      //showError (e);
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

  AtomScadPreviewView.prototype.getURI = function() {
    return 'scad-preview://' + this.pathname;
  };

  return AtomScadPreviewView;

})();
