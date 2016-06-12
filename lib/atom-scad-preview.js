var AtomScadPreview,
    path = require( 'path');

var AtomScadPreviewView = require('./atom-scad-preview-view');

var CompositeDisposable = require('atom').CompositeDisposable;

var url = require( 'url' );

module.exports = AtomScadPreview = {
  atomScadPreviewView: null,
  modalPanel: null,
  subscriptions: null,
  activate: function(state) {

    this.subscriptions = new CompositeDisposable;
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-scad-preview:toggle': (function(_this) {
        return function() {
          return _this.toggle();
        };
      })(this)
    }));

    return atom.workspace.addOpener(function(uriToOpen) {
      var error, host, pathname, protocol, ref;

      try {
        ref = url.parse(uriToOpen), protocol = ref.protocol, host = ref.host, pathname = ref.pathname;
      } catch (_error) {
        error = _error;
        return;
      };

      if (protocol !== 'scad-preview:') {
        return;
      }
      try {
        if (pathname) {
          pathname = decodeURI(pathname);
        }
      } catch (_error) {
        error = _error;
        return;
      }

      return new AtomScadPreviewView(pathname);
      /*
      if (host === 'editor') {

        return createMarkdownPreviewView({
          editorId: pathname.substring(1)
        });
      } else {
        return createMarkdownPreviewView({
          filePath: pathname
        });
      }
      */
    });
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
      var editor = atom.workspace.getActiveTextEditor(),
          activeFile = editor.getPath(),
          uri = 'scad-preview://' + activeFile;

      atom.workspace.open( uri, { split: 'right' } ).then(function( view ) {
        console.log( 'container =>', view );

        editor.onDidSave( function() {
          console.log( 'didsave!');
          view.render();
        });
      });
  }
};
