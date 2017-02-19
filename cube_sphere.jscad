
function main(params) {
  var cube = CSG.roundedCube({
    radius: 10,
    roundradius: 1,
    resolution: 1
  });

  console.log('log message - cube', params);
  // throw new Error('foo');
  // var
  return cube;
}
