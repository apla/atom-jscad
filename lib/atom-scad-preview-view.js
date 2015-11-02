var AtomScadPreviewView;

var fs = require( 'fs' ),
    path = require( 'path' );

module.exports = AtomScadPreviewView = (function() {


  function AtomScadPreviewView(serializedState) {
    var message;

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
    viewer.id = 'viewer';

    this.element.appendChild( viewer );

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
