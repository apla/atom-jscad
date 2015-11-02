function main() {
  var cube = CSG.roundedCube({radius: 10, roundradius: 1, resolution: 1});
  var sphere = CSG.sphere({radius: 10, resolution: 16}).translate([5, 5, 5]);
  // return sphere.union(cube);
  return cube;
};
