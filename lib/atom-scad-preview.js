var AtomScadPreview,
    path = require( 'path');

var AtomScadPreviewView = require('./atom-scad-preview-view');

var configScheme = require ('../config.json');

var CompositeDisposable = require('atom').CompositeDisposable;

var url = require( 'url' );

module.exports = AtomScadPreview = {
  config: configScheme,
  atomScadPreviewView: null,
  modalPanel: null,
  subscriptions: null,
  pane: null, // pane which contains the view; useful to check event listeners
  activate: function(state) {

    this.subscriptions = new CompositeDisposable;

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-scad-preview:toggle': this.previewFile.bind (this)
    }));

    this.subscriptions.add(atom.workspace.observeActivePaneItem(function (paneItem) {

      // activate scad preview if uri match path of current editor
      var editor = atom.workspace.getActiveTextEditor();
      if (!editor)
        return;

      var activeFile = editor.getPath(),
          uri = 'scad-preview://' + activeFile,
          pane = atom.workspace.paneForURI(uri);

      //if (pane)
        //pane.activate();

      // TODO: paneForUri not working. why?
      var previewItemIdx = undefined;
      var allPaneItems = atom.workspace.getPaneItems();
      allPaneItems.forEach (function (paneItem, idx) {
        if (paneItem instanceof AtomScadPreviewView && paneItem.pathname === activeFile) {
          previewItemIdx = idx;
        }
      });

      if (!previewItemIdx)
        return;

      // console.log ('panes check', atom.workspace.paneForItem (allPaneItems[previewItemIdx]), this.pane);

      // we have found preview pane item
      var previewPane = atom.workspace.paneForItem (allPaneItems[previewItemIdx]);
      previewPane.getItems().forEach (function (paneItem, idx) {
        if (paneItem instanceof AtomScadPreviewView && paneItem.pathname === activeFile) {
          previewItemIdx = idx;
        }
      });

      previewPane.activateItemAtIndex(previewItemIdx);
    }.bind (this)));
    //observeActivePaneItem(callback)

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

      this.atomScadPreviewView = new AtomScadPreviewView(pathname);
      return this.atomScadPreviewView;
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
    if (!this.atomScadPreviewView)
      return null;
    return {
      atomScadPreviewViewState: this.atomScadPreviewView.serialize()
    };
  },
  toggle: function() {
    // console.log('AtomScadPreview was toggled!');
      var editor = atom.workspace.getActiveTextEditor(),
          activeFile = editor.getPath(),
          uri = 'scad-preview://' + activeFile;

      atom.workspace.open( uri, { split: 'right', searchAllPanes: true, activatePane: false } ).then(function( view ) {
        var pane = atom.workspace.paneForItem(view);


        // console.log( 'container =>', view, ', pane =>', pane );


        if (this.pane) {
          return;
        }

        this.pane = pane;

        // check for tab view pane resize
        pane.onDidChangeFlexScale(function () {
          // console.log ('pane resize');
          view.processor.viewer.handleResize();
        });

        // listen for panels
        var panels = atom.workspace.getLeftPanels().concat (atom.workspace.getRightPanels());
        panels.forEach (function (panel) {
          // console.log('panel is visible %s, width is %s', panel.isVisible(), panel.getItem().element.clientWidth);
          panel.onDidChangeVisible(function () {
            // console.log ('panel visibility change');
            view.processor.viewer.handleResize();
          });
        }, this);

        editor.onDidSave( function() {
          // console.log( 'didsave!');
          view.render();
        });

      });
  },
  previewFile: function () {
    // TODO: here we can optionally reuse render tab for other file
    /*
    var jscadPreviewPanes = atom.workspace.getPaneItems().filter (function (pane) {
      return pane instanceof AtomScadPreviewView;
    }, this);
    */

    // console.log (jscadPreviewPanes);

    return this.toggle();
  }
};
