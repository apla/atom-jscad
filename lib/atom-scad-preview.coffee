AtomScadPreviewView = require './atom-scad-preview-view'
{CompositeDisposable} = require 'atom'

module.exports = AtomScadPreview =
  atomScadPreviewView: null
  modalPanel: null
  subscriptions: null

  activate: (state) ->
    @atomScadPreviewView = new AtomScadPreviewView(state.atomScadPreviewViewState)
    @modalPanel = atom.workspace.addModalPanel(item: @atomScadPreviewView.getElement(), visible: false)

    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

    # Register command that toggles this view
    @subscriptions.add atom.commands.add 'atom-workspace', 'atom-scad-preview:toggle': => @toggle()

  deactivate: ->
    @modalPanel.destroy()
    @subscriptions.dispose()
    @atomScadPreviewView.destroy()

  serialize: ->
    atomScadPreviewViewState: @atomScadPreviewView.serialize()

  toggle: ->
    console.log 'AtomScadPreview was toggled!'

    if @modalPanel.isVisible()
      @modalPanel.hide()
    else
      @modalPanel.show()
