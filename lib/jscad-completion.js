var vm   = require ('vm');
var fs   = require ('fs');
var path = require ('path');

var scadHelperScript = fs.readFileSync (path.resolve (__dirname, '../standalone/openscad.js')).toString ();

// TODO: use trie https://github.com/jeresig/trie-js/blob/master/Bits.js
// var dict = new FrozenTrie( parts[2], parts[1], parts[0] );
// dict.lookup( "test" );
var suggestMethods = {
  // 3d primitives
  cube: {
    type: 'function',
    snippet: "cube({size: ${1:[1, 1, 1]}, center: ${2:[true, true, true]}})$3",
    description: 'cube',
    descriptionMoreURL: "https://en.wikibooks.org/wiki/OpenJSCAD_User_Guide#Cube"
  },
  sphere: {
    type: 'function',
    snippet: "sphere({r: ${1:1}, center: ${2:[true, true, true]}})$3",
    description: 'sphere',
    descriptionMoreURL: "https://en.wikibooks.org/wiki/OpenJSCAD_User_Guide#Sphere"
  },
  // geodesicSphere: {},
  cylinder: {
    type: 'function',
    snippet: "cylinder({r: ${1:1}, h: ${2:1}, center: ${3:[true, true, true]}})$4",
    description: 'cylinder',
    descriptionMoreURL: "https://en.wikibooks.org/wiki/OpenJSCAD_User_Guide#Cylinder"
  },
  torus: {
    type: 'function',
    snippet: "torus({$1})$2",
    description: 'torus',
    descriptionMoreURL: "https://en.wikibooks.org/wiki/OpenJSCAD_User_Guide#Torus"
  },
  polyhedron: {
    type: 'function',
    snippet: "polyhedron({$1})$2",
    description: 'polyhedron',
    descriptionMoreURL: "https://en.wikibooks.org/wiki/OpenJSCAD_User_Guide#Polyhedron"
  },

  vector_text: {
    type: 'function',
    snippet: "vector_text(${1:0}, ${2:0}, ${3:'A'})$4",
    description: ''
  },

  vector_text: {
    type: 'function',
    snippet: "vector_text(${1:0}, ${2:0}, ${3:'A'})$4",
    description: ''
  },

  scale: {
    type: 'method',
    snippet: "scale($1)$2",
  },

  translate: {
    type: 'method',
    snippet: "translate([${1:0}, ${2:0}, ${3:0}])$4",
    description: ''
  },

  rotateX: {
    type: 'method',
    snippet: "rotateX(${1:0})$2",
    description: ''
  },

  rotateY: {
    type: 'method',
    snippet: "rotateY(${1:0})$2",
    description: ''
  },

  rotateZ: {
    type: 'method',
    snippet: "rotateZ(${1:0})$2",
    description: ''
  },

  // combine
  union: {
    type: 'function',
    snippet: "union($1)$2",
  },
  difference: {
    type: 'function',
    snippet: "difference($1)$2",
  },
  substract: {
    type: 'method',
    snippet: "substract($1)$2",
  },
  intersection: {
    type: 'function',
    snippet: "intersection($1)$2",
  },
  intersect: {
    type: 'method',
    snippet: "intersect($1)$2",
  },

  hull: {
    type: 'function',
    snippet: "hull($1)$2",
  },

  chain_hull: {
    type: 'function',
    snippet: "chain_hull($1)$2",
  },

  // extrude
  linear_extrude: {
    type: 'function',
    snippet: "linear_extrude($1)$2",
    description: 'linear extrusion for 2D models'
  },
  extrude: {
    type: 'method',
    snippet: "extrude($1)$2",
    description: 'linear extrusion for 2D models'
  },
  rectangular_extrude: {
    type: 'function',
    snippet: "rectangular_extrude($1)$2",
    description: 'rectangular extrusion for 2D models'
  },
  rectangularExtrude: {
    type: 'method',
    snippet: "rectangularExtrude($1)$2",
    description: 'rectangular extrusion for 2D models'
  },
  rotate_extrude: {
    type: 'function',
    snippet: "rotate_extrude($1)$2",
  },

  setColor: {
    type: 'method',
    snippet: "setColor($1)$2",
  },
};

function getSCADHelpers () {
  var sandbox = {
    require: require
  };

  vm.createContext(sandbox);

  // vm.runInContext (OpenJsCad.includeJscad.toString ().replace ('function', 'function include'), sandbox, {
  // });

  vm.runInContext (scadHelperScript, sandbox, {
    // filename <string> Specifies the filename used in stack traces produced by this script.
    lineOffset: 1, // <number> Specifies the line number offset that is displayed in stack traces produced by this script.
    columnOffset: 1, // <number> Specifies the column number offset that is displayed in stack traces produced by this script.
    // displayErrors <boolean> When true, if an Error error occurs while compiling the code, the line of code causing the error is attached to the stack trace.
    // timeout <number> Specifies the number of milliseconds to execute code before terminating execution. If execution is terminated, an Error will be thrown.
  });

  console.log (Object.keys (sandbox));

  // vm.runInContext ("if(typeof(getParameterDefinitions) == 'function') {params = getParameterDefinitions();}", sandbox, {});

  // params = sandbox.params;

}

// getSCADHelpers ();

function JSCADCompletion () {
  var result = this;
  if (this instanceof JSCADCompletion) {
  } else {
    result = new JSCADCompletion ();
  }

  result.minSuggestionLength = atom.config.get('autocomplete-plus.minimumWordLength') || result.minSuggestionLength;

  return result;
}

JSCADCompletion.prototype = {
  selector: '.source.js, .source.jscad',
  disableForSelector: '.source.js .comment, .source.jscad .comment',
  inclusionPriority: 100,

  minSuggestionLength: 2,

  // inclusionPriority (optional): A number to indicate its priority to be included in a suggestions request. The default provider has an inclusion priority of 0. Higher priority providers can suppress lower priority providers with excludeLowerPriority.
  // excludeLowerPriority (optional): Will not use lower priority providers when this provider is used.
  // suggestionPriority (optional): A number to determine the sort order of suggestions. The default provider has an suggestion priority of 1
  // dispose (optional): Will be called if your provider is being destroyed by autocomplete+
  // onDidInsertSuggestion (optional): Function that is called when a suggestion from your provider was inserted into the buffer
  // editor: the TextEditor your suggestion was inserted in
  // triggerPosition: A Point where autocomplete was triggered
  // suggestion: The suggestion object that was inserted.

  getSuggestions ({editor, bufferPosition, scopeDescriptor, prefix}) {

    var line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);

    var suggestions = [];

    if (prefix.match (/\W/) || prefix.length < this.minSuggestionLength)
      return suggestions;

    // console.log (line, scopeDescriptor, prefix, line.substr (line.length - prefix.length - 1, 1));

    var prevChar;
    if (line.length > prefix.length) {
      prevChar = line.substr (line.length - prefix.length - 1, 1);
    }

    Object.keys (suggestMethods).forEach (m => {
      if (m.indexOf (prefix) >= 0) {
        // issue: https://github.com/atom/autocomplete-plus/issues/781
        if (prevChar === '.') {
          // assume methods only
          if (suggestMethods[m].type === 'method')
            suggestions.push (Object.assign ({}, suggestMethods[m], {replacementPrefix: null}));
        } else {
          // only functions accepted
          if (suggestMethods[m].type !== 'method')
            suggestions.push (Object.assign ({}, suggestMethods[m], {replacementPrefix: null}));
        }

      }
    })

    return suggestions;

    return new Promise(function(resolve) {
      // Find your suggestions here
      var suggestion = {
        text: 'someText', // OR
        snippet: 'someText(${1:myArg})',
        displayText: 'someText', // (optional)
        replacementPrefix: 'so', // (optional)
        type: 'function', // (optional)
        leftLabel: '', // (optional)
        leftLabelHTML: '', // (optional)
        rightLabel: '', // (optional)
        rightLabelHTML: '', // (optional)
        className: '', // (optional)
        iconHTML: '', // (optional)
        description: '', // (optional)
        descriptionMoreURL: '' // (optional)
      };
      return resolve([suggestion]);
    });
  }
};

module.exports = JSCADCompletion;
