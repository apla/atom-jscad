/* global OpenJsCad */
/*eslint no-console: 0*/
var fs = require('fs'),
  path = require('path'),
  crypto = require('crypto'),
  loophole = require('loophole'),
  async = require('async');

var Emitter = require('event-kit').Emitter;
var CompositeDisposable = require('event-kit').CompositeDisposable;

function absPackagePath(fileName) {
  return 'file://' + path.join(
    atom.packages.getLoadedPackage('jscad-viewer').path,
    fileName
  );
}

var webFrame = require('electron').webFrame;

webFrame.registerURLSchemeAsBypassingCSP('blob');

var JsCadViewerView = (function () {

  function JsCadViewerView(pathname) {
    // var message;

    this.pathname = pathname;

    this.subscriptions = new CompositeDisposable;

    this.events = new Emitter();

    // console.log('JsCadViewerView.pathname', pathname);

    this.fileIdentifier = crypto.createHash('md5').update(pathname).digest('hex');

    // window.jscadscript = fs.readFileSync( pathname ).toString();

    this.element = document.createElement('div');

    this.element.classList.add('jscad-viewer');

    var viewer = this.viewer = document.createElement('div');
    viewer.id = 'viewer-' + this.fileIdentifier;
    // console.log('create viewer', viewer.clientWidth, viewer.clientHeight);

    this.element.appendChild(viewer);

    this.loadDependencies();

    this.render = function () {
      // console.log('JsCadViewerView.render', pathname);
      var jscadscript = fs.readFileSync(pathname).toString();
      this.processor.setJsCad(jscadscript, pathname.replace(/\.jscad$/i, ''));

      this.element.addEventListener('contextmenu', function (evt) {
        evt.stopPropagation();
      });
    };

  }

  function showError(err) {
    var detail = err.stack,
      message = err.message;

    atom.notifications.addError(message, {
      detail,
      dismissable: true
    });
  }

  // this is a copy of jscad function
  function generateOutputFile() {
    // console.warn('generateOutputFile overriden', this.hasValidCurrentObject);
    this.clearOutputFile();

    // var blob = this.currentObjectsToBlob();
    // var windowURL = OpenJsCad.getWindowURL();
    // this.outputFileBlobUrl = windowURL.createObjectURL(blob);
    // if (!this.outputFileBlobUrl) throw new Error("createObjectURL() failed");
    // this.hasOutputFile = true;
    // this.downloadOutputFileLink.href = this.outputFileBlobUrl;
    // this.downloadOutputFileLink.innerHTML = this.downloadLinkTextForCurrentObject();
    // var ext = this.selectedFormatInfo().extension;
    // this.downloadOutputFileLink.setAttribute("download", "openjscad." + ext);
    // this.enableItems();


    if (!this.viewedObject) return;

    var blob = this.currentObjectsToBlob();

    var format = this.selectedFormat();

    var formatInfo = this.formatInfo(format);

    /*displayName: "STL",
  extension: "stl",
  mimetype: "application/sla",*/

    var fileName = atom.showSaveDialogSync({
      defaultPath: path.join(path.dirname(this.filename), path.basename(this.filename, path.extname(this.filename)) + '.' + formatInfo.extension),
      filters: [
        {
          name: formatInfo.displayName,
          extensions: [formatInfo.extension]
        }
      ]
    });

    // var fileExt = path.extname(fileName).substr(1);

    // console.log('saving into', fileName, fileExt);

    var reader = new FileReader();
    reader.addEventListener('loadend', function () {
      // TODO: find a way to pass ArrayBuffer into node
      // TODO: show progress bar
      // var resultStr = String.fromCharCode.apply(null, new Uint8Array(reader.result));
      // var resultStr = String.fromCharCode.apply(null, reader.result);
      var resultStr = reader.result;
      var firstComma = resultStr.indexOf(',');
      var data = unescape(resultStr.substring(firstComma + 1));

      var buffer = new Buffer(data, 'base64');

      fs.writeFile(fileName, buffer);
    });
    reader.readAsDataURL(blob);


    return;

    // var windowURL = OpenJsCad.getWindowURL();
    // this.outputFileBlobUrl = windowURL.createObjectURL(blob)
    // if (!this.outputFileBlobUrl) throw new Error("createObjectURL() failed");
    // this.hasOutputFile = true;
    // this.downloadOutputFileLink.href = this.outputFileBlobUrl;
    // this.downloadOutputFileLink.innerHTML = this.downloadLinkTextForCurrentObject();
    // var ext = this.selectedFormatInfo().extension;
    // this.downloadOutputFileLink.setAttribute("download", "openjscad." + ext);
    // this.enableItems();
    // if (this.onchange) this.onchange();
  }


  JsCadViewerView.prototype.loadDependencies = function () {
    var self = this;

    var jsDependencies = [
      'node_modules/lodash/lodash.js',
      'node_modules/three/build/three.min.js',
      'node_modules/three/examples/js/controls/OrbitControls.js',
      'node_modules/three/examples/js/renderers/Projector.js',
      'node_modules/three/examples/js/renderers/CanvasRenderer.js',
      'node_modules/jquery/dist/jquery.js',
      'standalone/openjscad/csg.js',
      'standalone/threecsg.js', // three.js
      'standalone/openjscad/openjscad.js',
      'standalone/openjscad/openscad.js',
      'standalone/openjscad/jscad-worker.js',
      'standalone/openjscad/jscad-function.js',
      'standalone/overrides.js',
      'standalone/openjscad.viewer.js',
      'standalone/openjscad.viewer.three.js',
      'standalone/openjscad/formats.js'
    ].map(function (scriptName) {
      return absPackagePath(scriptName);
    });

    async.eachSeries(jsDependencies, function (scriptName, next) {
      // console.log('loading script', scriptName);
      var script = document.createElement('script');
      script.async = false;
      script.addEventListener('load', function ( /* event */ ) {
        next();
      }, false);
      script.addEventListener('error', function (messageOrEvent, source, lineno, colno, error) {
        console.error('script load error', messageOrEvent, source, lineno, colno, error);
        next(error || messageOrEvent || 'script load error');
      }, false);
      script.src = scriptName;
      document.querySelector('head').appendChild(script);

    }, function done(err) {
      if (err) console.error('loadDependencies', err);

      OpenJsCad.AlertUserOfUncaughtExceptions();

      OpenJsCad.Function = loophole.Function;

      // var modelColor = atom.config.get('jscad-viewer.color');
      // var bgColor = atom.config.get('jscad-viewer.backgroundColor');
      self.viewer.className = 'jscad-viewer-viewer';

      function color2rgba(color) {
        return {
          r: color.red / 255,
          g: color.green / 255,
          b: color.blue / 255,
          a: color.alpha || 1,
        };
      }

      var gProcessor = new OpenJsCad.Processor(self.viewer, {
        libraries: [
          'standalone/openjscad/csg.js',
          'standalone/openjscad/formats.js',
          'standalone/openjscad/openjscad.js',
          'standalone/openjscad/openscad.js',
          'standalone/overrides.js'],
        useSync: false,
        useAsync: true,
        viewer: {
          grid: {
            draw: atom.config.get('jscad-viewer.drawGrid')
          },
          solid: {
            faces: atom.config.get('jscad-viewer.drawFaces'),
            lines: atom.config.get('jscad-viewer.drawLines'),
            faceColor: color2rgba(atom.config.get('jscad-viewer.color')),

          },
          background: {
            color: color2rgba(atom.config.get('jscad-viewer.backgroundColor'))
          },
          axes: {
            draw:  atom.config.get('jscad-viewer.drawAxes')
          }
        }
      });

      /**
       * Replace the default enableItems, this is handled via CSS
       * and elements are not hidden/revealed now.
       */
      gProcessor.enableItems = function enableItems() {};

      self.onChange = self.onChange.bind(self);

      gProcessor.baseurl = absPackagePath('') + path.sep;

      gProcessor.generateOutputFile = generateOutputFile;

      // gProcessor.setDebugging( true );

      self.processor = gProcessor;
      // console.log('dependencyLoaded', self.element);

      // console.log('viewer', self.viewer, self.viewer.querySelector('div.viewer'));
      // watch the viewer element for size changes like the find panel opening.
      var element = self.viewer.querySelector('div.viewer');

      function getSize(el) {
        return {
          width: el.clientWidth,
          height: el.clientHeight
        };
      }
      var size = getSize(element);

      function changed(a, b) {
        return a.width != b.clientWidth || a.height != b.clientHeight;
      }

      self.watch = setInterval(function () {
        if (changed(size, element)) {
          // console.log('watch', size, getSize(element));
          size = getSize(element);
          if (self.handleResize) self.handleResize();
        }
      }, 500);

      // var startDebounce = new Date();
      // var lastDebounce = new Date();
      // var debounce = setInterval(function () {
      //   var total = new Date() - startDebounce;
      //   var elapsed = new Date() - lastDebounce;
      //   // console.log('debounce foo', elapsed);
      //   if (changed(size, element)) {
      //     size = getSize(element);
      //     lastDebounce = new Date();
      //   } else {
      //     if (elapsed > 250 || total > 1000) {
      //       clearInterval(debounce);
      //       // console.log('debounce', elapsed, total, lastDebounce - startDebounce);
      //
      //     }
      //   }
      // }, 10);

      setTimeout(function () {
        // console.log('render');
        self.render();
      }, 250);

    });

  };


  JsCadViewerView.prototype.onChange = function () {
    console.error('JsCadViewerView.onChange', this.processor.errorObject);

    // console.log('onChange', this.processor.errorObject, this.processor);

    if (this.processor.errorObject)
      this.events.emit(
        'error',
        this.processor.errorObject
      );

    //
    // if (this.processor.errorpre.textContent) {
    // 	alert (this.processor.errorpre.textContent);
    // }
  };

  JsCadViewerView.prototype.handleResize = function () {
    // console.warn('JsCadViewerView.handleResize');
    try {
      this.processor.viewer.handleResize();
    } catch (e) {
      showError(e);
    }
  };

  JsCadViewerView.prototype.serialize = function () {};

  JsCadViewerView.prototype.destroy = function () {
    this.events.dispose();
    this.subscriptions.dispose();
    if (this.watch) clearInterval(this.watch);
    return this.element.remove();
  };

  JsCadViewerView.prototype.getElement = function () {
    return this.element;
  };

  JsCadViewerView.prototype.getTitle = function () {
    return '❒ ' + this.pathname.replace(new RegExp('.*\\' + path.sep), '');
  };

  return JsCadViewerView;

})();

module.exports = JsCadViewerView;
