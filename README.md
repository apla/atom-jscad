# atom-scad-preview

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

## WIP

 * [ ] Human-centric scad => jscad conversion
 * [ ] Use processor class from .org
   * [ ] Allow to include any supported file
   * [ ] Watch includes for changes and reload
   * [ ] Jump to the error source in included file
 * [ ] **EPIC** merge joostn and Spiritdude histories
   * [ ] viewer ([#82](https://github.com/joostn/OpenJsCad/pull/82), ~~[#202](https://github.com/Spiritdude/OpenJSCAD.org/pull/202)~~)
   * [ ] processor

## CHANGELOG

v1.0.0

 * [x] Every type of error should be reported to user from now
 * [x] Written own `include` function, similar to the .org version

## License

This is licensed under the [MIT license](https://github.com/apla/atom-jscad/blob/master/LICENSE.md).
