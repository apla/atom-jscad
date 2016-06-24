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
 * [ ] Retain parameter state on source save
 * [ ] Port includes support from .org
   * [ ] Allow to include any supported file
   * [ ] Watch includes for changes and reload
 * [ ] Shift-LMB to pan (Atom have it's own idea about right clicks)
 * [ ] **EPIC** merge joostn and Spiritdude histories
   * [ ] viewer ([#82](https://github.com/joostn/OpenJsCad/pull/82), [#156](https://github.com/Spiritdude/OpenJSCAD.org/pull/156))
   * [ ] processor

## CHANGELOG

v0.3.0

 * [x] Bring back export
 * [x] Keep parameter state/zoom/camera position between source updates
 * [x] Parameters support
 * [x] Maximized preview area

v0.2.0

 * [x] Allow selection of renderer backend
 * [x] Automatically switch to the preview for active editor pane
 * [x] Handle pane resize (works mostly, Atom doesn't have panel add event)
 * [x] Display grid in XY plane
   * [x] Backport changes to the [joostn](https://github.com/joostn/OpenJsCad/tree/gh-pages) and [Spiritdude](https://github.com/Spiritdude/OpenJSCAD.org/tree/dev) branches
 * [x] Add configuration options (colors, display axis, triangles, grid)
   * [x] Backport changes to the [joostn](https://github.com/joostn/OpenJsCad/tree/gh-pages) and [Spiritdude](https://github.com/Spiritdude/OpenJSCAD.org/tree/dev) branches
 * [x] Make viewer HiDPI compatible ([WebGL HiDPI](https://www.khronos.org/webgl/wiki/HandlingHighDPI))

v0.1.0

 * [x] Make it work again with CSP

v0.0.3

 * [x] Prepare package!

## License

This is licensed under the [MIT license](https://github.com/matiasinsaurralde/atom-scad-preview/blob/master/LICENSE.md).
