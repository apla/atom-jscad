var AtomScadPreviewView;

var fs = require( 'fs' ),
    path = require( 'path' ),
    crypto = require( 'crypto' );

module.exports = AtomScadPreviewView = (function() {


  function AtomScadPreviewView( pathname ) {
    var message;

    this.pathname = pathname;

    this.fileIdentifier = crypto.createHash('md5').update( pathname ).digest("hex")

    window.jscadscript = fs.readFileSync( pathname ).toString();
    
    window.fileIdentifier = this.fileIdentifier;
    // if( document.getElementsByClassName('atom-scad-preview').length == 0 ) {

      this.element = document.createElement('div');

      this.element.classList.add('atom-scad-preview');

      jsDependencies.forEach( function( scriptName  ) {
        console.log( scriptName );
        var script = document.createElement('script');
        script.async = false;
        script.src = scriptName;
        document.getElementsByTagName('head')[0].appendChild(script);
      });

      var viewer = document.createElement('div');
      viewer.id = 'viewer-' + fileIdentifier;

      this.element.appendChild( viewer );

      this.render = function() {
        console.log( 'render again!');
        window.jscadscript = fs.readFileSync( pathname ).toString();
        gProcessor.setJsCad( jscadscript, 'test.jscad' );
      };

    // };

    /*message = document.createElement('div');
    message.textContent = "el render deberia ir aca!";
    message.classList.add('message');
    this.element.appendChild(message);*/


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
