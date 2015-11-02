var AtomScadPreviewView;

module.exports = AtomScadPreviewView = (function() {

  function AtomScadPreviewView(serializedState) {
    var message;
    this.element = document.createElement('div');
    this.element.classList.add('atom-scad-preview');
    message = document.createElement('div');
    message.textContent = "el render deberia ir aca!";
    message.classList.add('message');
    this.element.appendChild(message);

    console.log( 2, this );
  }

  AtomScadPreviewView.prototype.serialize = function() {};

  AtomScadPreviewView.prototype.destroy = function() {
    return this.element.remove();
  };

  AtomScadPreviewView.prototype.getElement = function() {
    return this.element;
  };

  AtomScadPreviewView.prototype.getTitle = function() {
    return "Render!"; 
  };

  return AtomScadPreviewView;

})();
