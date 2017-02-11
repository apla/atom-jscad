// you can include additional files
// include ('my-parts-library.jscad');

//////////////////////// PARAMETERS ////////////////////////

/**
 * Optionally describe parameters for model customization
 * @returns {Object[]} Parameter objects
 */
function getParameterDefinitions() {
  return [{
    // with `part` parameter `-[lowercased part value]` suffix will be added
    // to the generated file name when model exported
    name: 'part',        // name of parameter for access within main() function
    caption: 'Part:',    // optional caption will be rendered as label for the form field
    type: 'choice',      // type of parameter, can be `bool`, `float`, `int`, `text`, `longtext` or `choice`
    initial: 'carriage', // optional initial value
    values: [            // values for options of the `choice` selector
      "NUTS",
      "TAPS",
    ],
    captions: [          // captions for options of the `choice` selector
      "M8 nut holes",
      "M8 screw tap holes",
    ]
  }, {
    name: 'scale',
    type: 'int',
    initial: 1,

  }, {
    // with `version` parameter `-v[version value]` suffix will be added
    // to the generated file name when model exported
    name: 'version',
    type: 'text',
    initial: '1.0.0',
  }];
}

//////////////////////// SUPPLEMENTAL ////////////////////////

//  Hex nut
//   W/2
//   |_|____
//  /   \  w - this is a most important dimension, because it defines
// |\ _ /|__   wrench size, also W = w*2/Math.sqrt(3)
// |  W  |

// M8 nut have h 6.5mm, w 13mm
var M8 = {h: 6.5, w: 13, r: 4};


/**
 * Parametric function for nut and screw hole
 * @param   {object} [options={}]                    Options:
 * @param   {object} [options.justTappingHole=false] Just hole for tapping.
 *                   Radius narrower by .2mm. Int/Float value specify depth of the hole.
 * @param   {object} [options.justScrewHole=false]   Just hole for screw.
 *                   Radius wider by .2mm. Int/Float value specify depth of the hole.
 * @returns {CSG}    CSG Object
 */
function nut (options) {
  options = options || {};

  // just hole for tapping
  if (options.justTappingHole) {
    var h = parseFloat (options.justTappingHole);
    if (isNaN (h)) h = M8.h;
    return cylinder ({
      r: M8.r - 0.2, // narrower 0.2mm for tapping
      h:  h
    })
  }

  // just hole for screw
  if (options.justScrewHole) {
    var h = parseFloat (options.justScrewHole);
    if (isNaN (h)) h = M8.h;
    return cylinder ({
      r: M8.r + 0.2, // wider 0.2mm
      h: h
    })
  }

  // nut without hole
  return cylinder ({
    r: M8.w/Math.sqrt (3),
    fn: 6, // cylinder resolution is 6 for hex nut
    h: M8.h
  });
}

nut.size = M8;

//////////////////////// MAIN ////////////////////////

/**
 * This function should return model according to the provided params
 * @param   {object} params Parameters
 * @returns {CSG}    Model
 */
function main (params) {
	var plate = {w: 120, l: 30, h: 20};

	var nutX = plate.w/2 - nut.size.w/2 - 20;
	var nutZ = plate.h - nut.size.h;

  var plateCSG = cube ({
    size: [plate.w, plate.l, plate.h],
    center: [true, true, false] // align center on X, Y axes
  });
  if (params.part === 'NUTS') {
    return difference (
      plateCSG,
      // nut cutouts
      nut ().translate ([+nutX, 0, nutZ]),
			nut ().translate ([-nutX, 0, nutZ]),
      // screw holes
      nut ({justScrewHole: plate.h}).translate ([+nutX, 0, 0]),
			nut ({justScrewHole: plate.h}).translate ([-nutX, 0, 0])
    )
  } else {
    return difference (
      plateCSG,
      // tapping holes
      nut ({justTappingHole: plate.h}).translate ([+nutX, 0, 0]),
			nut ({justTappingHole: plate.h}).translate ([-nutX, 0, 0])
    )
  }
}
