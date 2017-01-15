/*eslint no-console: 0 */
var File = require('atom').File;
var AtomScadPreviewView = require('./atom-scad-preview-view');
var configScheme = require('../config.json');
var CompositeDisposable = require('event-kit').CompositeDisposable;
var url = require('url');
var $ = require('atom-space-pen-views').$;

module.exports = {
  config: configScheme,
  atomScadPreviewView: null,
  modalPanel: null,
  subscriptions: null,
  pane: null, // pane which contains the view; useful to check event listeners
  // notification: null,
  activate: function ( /* state */ ) {
    // console.log('atom-scad-preview.activate', state);

    this.subscriptions = new CompositeDisposable;

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-scad-preview:toggle': this.toggle.bind(this)
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-scad-preview:preview-file': this.previewFile.bind(this)
    }));

    this.subscriptions.add(atom.workspace.observeActivePaneItem(function ( /* paneItem */ ) {
      // console.log('atom-scad-preview.subscription.observeActivePaneItem', paneItem);
      // activate scad preview if uri match path of current editor
      var editor = atom.workspace.getActiveTextEditor();
      if (!editor)
        return;

      var activeFile = editor.getPath();
      // uri = 'scad-preview://' + activeFile
      // pane = atom.workspace.paneForURI(uri);

      //if (pane)
      //pane.activate();

      // TODO: paneForUri not working. why?
      var previewItemIdx = undefined;
      var allPaneItems = atom.workspace.getPaneItems();
      allPaneItems.forEach(function (paneItem, idx) {
        if (paneItem instanceof AtomScadPreviewView && paneItem.pathname === activeFile) {
          previewItemIdx = idx;
        }
      });

      if (!previewItemIdx)
        return;

      // console.log ('panes check', atom.workspace.paneForItem (allPaneItems[previewItemIdx]), this.pane);

      // we have found preview pane item
      var previewPane = atom.workspace.paneForItem(allPaneItems[previewItemIdx]);
      previewPane.getItems().forEach(function (paneItem, idx) {
        if (paneItem instanceof AtomScadPreviewView && paneItem.pathname === activeFile) {
          previewItemIdx = idx;
        }
      });

      previewPane.activateItemAtIndex(previewItemIdx);
    }.bind(this)));
    //observeActivePaneItem(callback)

    return atom.workspace.addOpener(function (uriToOpen) {
      // console.log('atom-scad-preview.addOpener', uriToOpen);
      var error, host, pathname, protocol, ref;

      try {
        ref = url.parse(uriToOpen);
        protocol = ref.protocol;
        host = ref.host;
        pathname = ref.pathname;
      } catch (_error) {
        error = _error;
        return;
      }

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
  deactivate: function () {
    this.modalPanel && this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.previewFileWatcher && this.previewFileWatcher.dispose();
    return this.atomScadPreviewView && this.atomScadPreviewView.destroy();
  },
  serialize: function () {
    if (!this.atomScadPreviewView)
      return null;
    return {
      atomScadPreviewViewState: this.atomScadPreviewView.serialize()
    };
  },
  /**
   * Opens a preview window for the `uri` passed in.  If a
   * `TextEditor` is passed in, then the preview pane will
   * reload on the editor save event and move the cursor
   * to any error lines if the `error` event fires.
   * @param  {TextEditor} editor Atom TextEditor object
   * @param  {String} uri    The uri with the path to the `.scad` or `.jscad` file
   * @return {TextEditor}    A promise that resolves to the `TextEditor` of the scad-preview.
   */
  preview: function (editor, uri) {
    return atom.workspace.open(uri, {
      split: 'right',
      searchAllPanes: true,
      activatePane: false
    }).then(function (view) {
      var pane = atom.workspace.paneForItem(view);

      view.events.on('error', function (err) {
        var detail = err.stack,
          message = err.message;

        console.error('atom-scad-preview.preview ERROR:', err);
        if (editor && err.lineno && err.colno)
          editor.setCursorBufferPosition([err.lineno - 1, err.colno - 1]);

        this.notification = atom.notifications.addError(message || err, {
          detail,
          dismissable: true
        });
      });

      this.pane = pane;

      // check for tab view pane resize
      view.subscriptions.add(pane.onDidChangeFlexScale(function () {
        // console.log('onDidChangeFlexScale');
        view.handleResize();
      }));

      // listen for panels
      var panels = atom.workspace.getLeftPanels().concat(atom.workspace.getRightPanels());
      panels.forEach(function (panel) {
        // console.log('panel is visible %s, width is %s', panel.isVisible(), panel.getItem().element.clientWidth);
        view.subscriptions.add(panel.onDidChangeVisible(function () {
          // console.log ('panel visibility change');
          view.handleResize();
        }));
      }, this);

      if (editor) {
        view.subscriptions.add(editor.onDidSave(function () {
          // console.log( 'didsave!');

          if (this.notification)
            atom.notifications.getNotifications().forEach(function (notification) {
              if (notification === this.notification)
                notification.dismiss();
            });

          view.render();
        }));
      }

      return view;
    });
  },
  /**
   * Toggle the preview on an open `.scad` or `.jscad` file editor.
   */
  toggle: function () {
    // if a file watcher was running, dispose of it. Toggling on a TextEditor
    // watches for the editor didsave event.
    this.previewFileWatcher && this.previewFileWatcher.dispose();

    var editor = atom.workspace.getActiveTextEditor(),
      activeFile = editor.getPath(),
      uri = 'scad-preview://' + activeFile;

    // console.error('atom-scad-preview.toggle', uri);
    if (activeFile === undefined) {
      return atom.notifications.addError('Can\'t preview `untitled` file', {
        //detail,
        dismissable: true
      });
    }

    this.preview(editor, uri);

  },
  /**
   * Open the preview window on a file. The event object is passed in
   * and the `e.target` object is inspected using `atom-space-pen-views` to
   * find the `span` and get the `data-path`.
   *
   * If an editor with the target path is found, that editor is passed
   * to `this.preview`.
   * @param  {Object} e event object, usually from the tree view.
   */
  previewFile: function previewFile(e) {
    var selection = ($(e.target).is('span') ? $(e.target) : $(e.target).find('span')).attr('data-path');
    var editor = atom.workspace.getTextEditors().filter(e => e.getPath() == selection)[0];
    // console.warn('atom-scad-preview.previewFile', selection, editor && editor.getTitle() || 'no editor');
    this.preview(editor, 'scad-preview://' + selection).then(function (view) {
      var f = new File(selection, false);

      this.previewFileWatcher = f.onDidChange(function () {
        // console.warn('previewFile.onDidChange');
        view.render();
      });

    });


  }
};
