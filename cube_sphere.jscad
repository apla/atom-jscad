function main() {
  var cube = CSG.roundedCube({radius: 10, roundradius: 2, resolution: 2});
  // var sphere = CSG.sphere({radius: 10, resolution: 16}).translate([5, 5, 5]);
  // return cube.union(sphere);
  return cube;
}
