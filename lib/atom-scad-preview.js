var AtomScadPreview,
    path = require( 'path');

var AtomScadPreviewView = require('./atom-scad-preview-view');

var configScheme = require ('../config.json');

var CompositeDisposable = require('event-kit').CompositeDisposable;

var url = require( 'url' );

module.exports = AtomScadPreview = {
  config: configScheme,
  atomScadPreviewView: null,
  modalPanel: null,
  subscriptions: null,
  pane: null, // pane which contains the view; useful to check event listeners
  notification: null,
  findPaneForPath: function (pathname) {
    var previewItemIdx = undefined;
    var allPaneItems = atom.workspace.getPaneItems();
    allPaneItems.forEach (function (paneItem, idx) {
      if (paneItem instanceof AtomScadPreviewView && paneItem.pathname === pathname) {
        previewItemIdx = idx;
      }
    });

    return previewItemIdx;
  },
  activatePreviewItem: function (paneIdx, pathname) {
    var allPaneItems = atom.workspace.getPaneItems();
    var previewPane = atom.workspace.paneForItem (allPaneItems[paneIdx]);

    var previewItemIdx = undefined;
    previewPane.getItems().forEach (function (paneItem, idx) {
      if (paneItem instanceof AtomScadPreviewView && paneItem.pathname === pathname) {
        previewItemIdx = idx;
      }
    });

    previewPane.activateItemAtIndex(previewItemIdx);
  },
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
      var previewItemIdx = this.findPaneForPath (activeFile);

      if (!previewItemIdx)
        return;

      // console.log ('panes check', atom.workspace.paneForItem (allPaneItems[previewItemIdx]), this.pane);

      // we have found preview pane item
      this.activatePreviewItem (previewItemIdx, activeFile);

    }.bind (this)));
    //observeActivePaneItem(callback)

    return atom.workspace.addOpener(function(uriToOpen) {
      var error, host, pathname, protocol, ref;

      try {
        ref      = url.parse(uriToOpen);
        protocol = ref.protocol;
        host     = ref.host;
        pathname = ref.pathname;
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

      // I can send editor contents to the view using editor.getText(),
      // but view should able to load this file iteself. If pathname is undefined,
      // I cannot process includes and so on
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
  toggle: function(evt) {
    // console.log('AtomScadPreview was toggled!');
    var editor = atom.workspace.getActiveTextEditor(),
      currentFileName;

    var t = evt.target;
    if (t.nodeName === 'SPAN') {
      // or from file item from the file tree
      currentFileName = t.dataset.path;
    } else if (editor) {
      // toggle can be activated from text editor
      currentFileName = editor.getPath(),
      uri = 'scad-preview://' + currentFileName;
    }

    var uri = 'scad-preview://' + currentFileName;

    if (currentFileName === undefined) {
      return atom.notifications.addError ("Can't preview `untitled` file", {
        //detail,
        dismissable: true
      });
    }

    var previewItemIdx = this.findPaneForPath (currentFileName);

    if (previewItemIdx) {
      // we have found preview pane item
      this.activatePreviewItem (previewItemIdx, currentFileName);

      return;
    }
    atom.workspace.open (uri, {
      split: 'right',
      searchAllPanes: true,
      activatePane: false
    }).then (function (view) {
      var pane = atom.workspace.paneForItem(view);


      // console.log( 'container =>', view, ', pane =>', pane );

      view.events.on ('error', function (err) {
        var detail = err.stack,
          message = err.message;

        // console.error ('caught error', err, typeof err, Object.keys (err), err.message, err.stack);

        if (err.lineno === undefined && err.stack) {
          // trying to get stack trace
          var m = err.stack.match (/\s(\w+)\s\(blob\:file\:\/+([^\)]+)\:(\d+)\:(\d+)\)/m);
          console.log (m);
          if (m && m[3] && m[4]) {
            err.lineno = m[3];
            err.colno  = m[4];
          }
        }

        if (editor && err.lineno !== undefined && err.colno !== undefined)
          editor.setCursorBufferPosition ([err.lineno - 1, err.colno - 1]);

        // console.log (Object.assign ({}, err));

        this.notification = atom.notifications.addError (message || err, {
          detail,
          dismissable: true
        });
      });

      this.pane = pane;

      // check for tab view pane resize
      view.subscriptions.add (pane.onDidChangeFlexScale(function () {
        // console.log ('pane resize');
        view.handleResize();
      }));

      // listen for panels
      var panels = atom.workspace.getLeftPanels().concat (atom.workspace.getRightPanels());
      panels.forEach (function (panel) {
        // console.log('panel is visible %s, width is %s', panel.isVisible(), panel.getItem().element.clientWidth);
        view.subscriptions.add (panel.onDidChangeVisible(function () {
          // console.log ('panel visibility change');
          view.handleResize();
        }));
      }, this);

        view.subscriptions.add (editor.onDidSave (function() {
          // console.log( 'didsave!');

          if (this.notification)
            atom.notifications.getNotifications().forEach (function (notification) {
              if (notification === this.notification)
                notification.dismiss ();
            });

          view.render();
        }));

    });
  },
  previewFile: function (evt) {
    // TODO: here we can optionally reuse render tab for other file
    /*
    var jscadPreviewPanes = atom.workspace.getPaneItems().filter (function (pane) {
    return pane instanceof AtomScadPreviewView;
    }, this);
    */

    // console.log (jscadPreviewPanes);

    return this.toggle(evt);
  }
};
