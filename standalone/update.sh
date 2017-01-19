#!/bin/bash

set -e
[ "$1" == "--overwrite" ] && {
  OVERWRITE=$1
}

mkdir -p openjscad/imgs

dl() {
  URL=https://raw.githubusercontent.com/Spiritdude/OpenJSCAD.org/master/$1
  FILE=openjscad/$2

  if [ -n "$OVERWRITE" ] ; then
    echo "rm $FILE"
    [ -f $FILE ] && rm -f $FILE
    # [ -f $FILE ] && echo "no $FILE"
  else
    echo "update if newer $FILE"
    DASHZ="-z $FILE"
  fi

  curl -Ss $URL $DASHZ -o $FILE && {
    echo "$1 ok"
  } || {
    echo "$1 error$?"
  }
}

dl openjscad.js openjscad.js
dl openscad.js openscad.js
dl js/jscad-function.js jscad-function.js
dl js/jscad-worker.js jscad-worker.js
dl lightgl.js lightgl.js
dl csg.js csg.js
dl Blob.js Blob.js
dl imgs/busy.gif imgs/busy.gif
dl formats.js formats.js

patch openjscad/formats.js formats.patch
