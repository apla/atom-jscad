window.onload = function() {
  var gCurrentFile,
      gProcessor;

  OpenJsCad.AlertUserOfUncaughtExceptions();

  gProcessor = new OpenJsCad.Processor(document.getElementById("viewer"));
  // gProcessor.setDebugging( fals ); 

  var jscadscript = 'function main() { var cube = CSG.roundedCube({radius: 10, roundradius: 2, resolution: 16}); var sphere = CSG.sphere({radius: 10, resolution: 16}).translate([5, 5, 5]); return cube.union(sphere); }',
      filename = 'test.jscad';

  gProcessor.setJsCad( jscadscript, filename );
};
