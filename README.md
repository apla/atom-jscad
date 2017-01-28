# atom-scad-preview

Solid 3D CAD models inside Atom (JSCAD).

![Screenshot](https://raw.githubusercontent.com/matiasinsaurralde/atom-scad-preview/master/screenshot.jpg)

Experimental package available [here](https://atom.io/packages/atom-scad-preview).

## Install

To install development version

Go to the atom packages location (`~/.atom/packages/`), then

* `git clone https://github.com/apla/atom-scad-preview`
* `cd atom-scad-preview`
* `git checkout openjscad-org`

## WIP

 * [ ] Human-centric scad => jscad conversion
 * [ ] Port includes support from .org
   * [ ] Allow to include any supported file
   * [ ] Watch includes for changes and reload
   * [ ] Jump to the error source in included file
 * [ ] **EPIC** merge joostn and Spiritdude histories
   * [ ] viewer ([#82](https://github.com/joostn/OpenJsCad/pull/82), [#156](https://github.com/Spiritdude/OpenJSCAD.org/pull/156))
   * [ ] processor

## CHANGELOG

v0.7.0

 * [x] Retain parameter state on source save (also ported to [OpenJSCad.org#223](https://github.com/Spiritdude/OpenJSCAD.org/pull/223))

v0.6.1

 * [x] Do not render file contents of unsaved file
 * [x] Display error after pane rendering

v0.6.0

 * [x] Show jscad compilation errors
 * [x] Jump to the error source in main file
 * [x] Hide previous error on save

## License

This is licensed under the [MIT license](https://github.com/matiasinsaurralde/atom-scad-preview/blob/master/LICENSE.md).
