#!/bin/bash

set -e

mkdir -p openjscad/imgs

curl https://raw.githubusercontent.com/Spiritdude/OpenJSCAD.org/master/openjscad.js -o openjscad/openjscad.js
curl https://raw.githubusercontent.com/Spiritdude/OpenJSCAD.org/master/openscad.js -o openjscad/openscad.js
curl https://raw.githubusercontent.com/Spiritdude/OpenJSCAD.org/master/js/jscad-function.js -o openjscad/jscad-function.js
curl https://raw.githubusercontent.com/Spiritdude/OpenJSCAD.org/master/js/jscad-worker.js -o openjscad/jscad-worker.js
curl https://raw.githubusercontent.com/Spiritdude/OpenJSCAD.org/master/lightgl.js -o openjscad/lightgl.js
curl https://raw.githubusercontent.com/Spiritdude/OpenJSCAD.org/master/csg.js -o openjscad/csg.js
curl https://raw.githubusercontent.com/Spiritdude/OpenJSCAD.org/master/Blob.js -o openjscad/Blob.js
curl https://raw.githubusercontent.com/Spiritdude/OpenJSCAD.org/master/imgs/busy.gif -o openjscad/imgs/busy.gif

curl https://raw.githubusercontent.com/Spiritdude/OpenJSCAD.org/master/formats.js -o openjscad/formats.js
patch openjscad/formats.js formats.patch
