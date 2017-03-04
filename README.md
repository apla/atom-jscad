# atom-jscad

Solid 3D CAD models inside Atom (JSCAD).

![Screenshot](https://raw.githubusercontent.com/apla/atom-jscad/master/screenshot.jpg)

Package available [here](https://atom.io/packages/atom-jscad).

## Install

Released version can be installed from [Atom's](http://atom.io)
`Packages` > `Settings View` > `Install package/theme`

To install development version, go to the atom packages location
(`~/.atom/packages/`), then

* `git clone https://github.com/apla/atom-jscad`
* `cd atom-jscad`

## Other projects

 * [OpenJSCAD](http://joostn.github.io/OpenJsCad/)

 This is a base of this package. Project is very outdated, some changes
 backported from `.org` version, some features added, some things rewritten.

 * [OpenJSCAD.org](http://OpenJSCAD.org/)

 Allows online editing of jscad files, but now in a heavy rewrite stage. Now
 processing and rendering is almost the same (excluding multiple objects
 returned from main). Best strategy for `atom-jscad`
 is use `OpenJSCAD.Processor` and `OpenJSCAD.Viewer` from this project.


## WIP

 * [ ] Add option to use touchpad scroll on Mac for panning
 * [ ] Add watch for minimum suggestion length in autocomplete-plus configuration
 * [ ] Human-centric scad => jscad conversion
 * [ ] Use processor class from .org
   * [ ] Allow to include any supported file
   * [ ] Jump to the error source in included file
 * [ ] **EPIC** merge joostn and Spiritdude histories
   * [ ] viewer ([#82](https://github.com/joostn/OpenJsCad/pull/82), ~~[#202](https://github.com/Spiritdude/OpenJSCAD.org/pull/202)~~)
   * [ ] processor

## CHANGELOG

v1.2.0
  * [x] Watch includes for changes and reload

v1.1.0
  * [x] Added completion for some openscad-like helpers

v1.0.0

 * [x] Every type of error should be reported to user from now
 * [x] Written own `include` function, similar to the .org version
 * [x] Fixed infinite loop on previewing second pane
 * [x] Added full featured sample with descriptions
 * [x] Package migration

## License

This is licensed under the [MIT license](https://github.com/apla/atom-jscad/blob/master/LICENSE.md).
