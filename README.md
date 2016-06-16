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

## TODO

Current version (branch openjscad-org)

* [ ] Bring back export
* [ ] Port includes support from .org
  * [ ] Allow to include any supported file
* [ ] Check parameters
* [ ] Allow selection of renderer backend
* [ ] Shift-LMB to pan (Atom have it's own idea about right clicks)
* [ ] **EPIC** merge joostn and Spiritdude histories
* [x] Automatically switch to the preview for active editor pane
* [x] Handle pane resize (works mostly, Atom doesn't have panel add event)
* [x] Display grid in XY plane
  * [ ] Backport changes to the [joostn](https://github.com/joostn/OpenJsCad/tree/gh-pages) and [Spiritdude](https://github.com/Spiritdude/OpenJSCAD.org/tree/dev) branches
* [x] Add configuration options (colors, display axis, triangles, grid)
    * [ ] Backport changes to the [joostn](https://github.com/joostn/OpenJsCad/tree/gh-pages) and [Spiritdude](https://github.com/Spiritdude/OpenJSCAD.org/tree/dev) branches
* [x] Make viewer HiDPI compatible ([WebGL HiDPI](https://www.khronos.org/webgl/wiki/HandlingHighDPI))

Current version (branch master)

* [x] Make it work again with CSP

v0.0.3

* [x] Prepare package!

## License

This is licensed under the [MIT license](https://github.com/matiasinsaurralde/atom-scad-preview/blob/master/LICENSE.md).
