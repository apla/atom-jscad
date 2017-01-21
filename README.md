# atom-scad-preview

Solid 3D CAD models inside Atom (JSCAD).

![Screenshot](https://raw.githubusercontent.com/matiasinsaurralde/atom-scad-preview/master/screenshot.jpg)

Experimental package available [here](https://atom.io/packages/atom-scad-preview).

## Install

Install the atom package using preferences or `apm install atom-scad-preview`.

To install the development package, clone the repo then cd into the directory
and run `apm install`.

To update the OpenJsCad files, cd into the `standalone` directory and `./update.sh`.

You can access the console by pressing `opt-cmd-i`.  Changes in the
`standalone` directory will be shown the next time you open a preview.  `lib` changes
need atom to reload, which can be done with `ctrl-opt-cmd-l`.  If you start atom
in dev mode, use the menu View->Developer->Open in dev mode... changes to the
`styles/atom-scad-preview.less` file are hot re-loaded.

## WIP

 * [ ] Human-centric scad => jscad conversion
 * [ ] Retain parameter state on source save
 * [ ] Port includes support from .org
   * [ ] Allow to include any supported file
   * [ ] Watch includes for changes and reload
   * [ ] Jump to the error source in included file
 * [ ] **EPIC** merge joostn and Spiritdude histories
   * [ ] viewer ([#82](https://github.com/joostn/OpenJsCad/pull/82), [#156](https://github.com/Spiritdude/OpenJSCAD.org/pull/156))
   * [ ] processor

## CHANGELOG

v0.6.1

 * [x] Do not render file contents of unsaved file
 * [x] Display error after pane rendering

v0.6.0

 * [x] Show jscad compilation errors
 * [x] Jump to the error source in main file
 * [x] Hide previous error on save

## License

This is licensed under the [MIT license](https://github.com/matiasinsaurralde/atom-scad-preview/blob/master/LICENSE.md).
