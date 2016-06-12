var AtomScadPreviewView;

var fs = require( 'fs' ),
  path = require( 'path' ),
  crypto = require( 'crypto' );

  function absPackagePath (fileName) {
    return 'file://' + path.join(
      atom.packages.getLoadedPackage( 'atom-scad-preview' ).path,
      fileName
    );
  }

var openJsCadBundle = 'openjscad-bundle.js';

var webFrame = require('electron').webFrame;

webFrame.registerURLSchemeAsBypassingCSP('blob');

module.exports = AtomScadPreviewView = (function() {


  function AtomScadPreviewView( pathname ) {
    var message;

    this.pathname = pathname;

    this.fileIdentifier = crypto.createHash('md5').update( pathname ).digest("hex")

    var gProcessor;

    // window.jscadscript = fs.readFileSync( pathname ).toString();

    this.element = document.createElement('div');

    this.element.classList.add('atom-scad-preview');

    var viewer = this.viewer = document.createElement('div');
    viewer.id = 'viewer-' + this.fileIdentifier;

    this.element.appendChild( viewer );

    this.loadDependencies();

    this.render = function() {
      console.log( 'render again!');
      var jscadscript = fs.readFileSync( pathname ).toString();
      this.processor.setJsCad( jscadscript, 'test.jscad' );
    };

  }

  AtomScadPreviewView.prototype.loadDependencies = function () {
      var jsDependencies = [
        'three.min.js', 'orbitcontrols.js', 'projector.js', 'canvasrenderer.js', 'jquery-2.1.3.min.js', 'csg.js', 'threecsg.js', 'openjscad.js', 'formats.js'
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

          gProcessor = new OpenJsCad.Processor (this.viewer);

          // gProcessor.setDebugging( true );

          this.processor = gProcessor;

          this.render();
        } else {
          loadDependency (idx+1);
        }
      }

      var loadDependency = function (idx) {
        var scriptName = jsDependencies[idx || 0];
        console.log ('loading script', scriptName);
        var script = document.createElement('script');
        script.async = false;
        script.addEventListener ('load', dependencyLoaded.bind (this, idx || 0), false);
        script.src = scriptName;
        document.querySelector('head').appendChild(script);
      }.bind (this);

      loadDependency();


  }

  AtomScadPreviewView.prototype.serialize = function() {};

  AtomScadPreviewView.prototype.destroy = function() {
    return this.element.remove();
  };

  AtomScadPreviewView.prototype.getElement = function() {
    return this.element;
  };

  AtomScadPreviewView.prototype.getTitle = function() {
    return "Render view";
  };

  return AtomScadPreviewView;

})();
