var AtomScadPreview, AtomScadPreviewView, CompositeDisposable;

AtomScadPreviewView = require('./atom-scad-preview-view');

CompositeDisposable = require('atom').CompositeDisposable;

module.exports = AtomScadPreview = {
  atomScadPreviewView: null,
  modalPanel: null,
  subscriptions: null,
  activate: function(state) {
    this.atomScadPreviewView = new AtomScadPreviewView(state.atomScadPreviewViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.atomScadPreviewView.getElement(),
      visible: false
    });
    this.subscriptions = new CompositeDisposable;
    return this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-scad-preview:toggle': (function(_this) {
        return function() {
          return _this.toggle();
        };
      })(this)
    }));
  },
  deactivate: function() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    return this.atomScadPreviewView.destroy();
  },
  serialize: function() {
    return {
      atomScadPreviewViewState: this.atomScadPreviewView.serialize()
    };
  },
  toggle: function() {
    console.log('AtomScadPreview was toggled!');
    if (this.modalPanel.isVisible()) {
      return this.modalPanel.hide();
    } else {
      return this.modalPanel.show();
    }
  }
};
