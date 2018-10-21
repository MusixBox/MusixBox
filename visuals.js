// Create basic scene
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Create cube geometry
var geoRef = new THREE.BoxGeometry ( 1, 1, 1 );
var geoRef = new THREE.IcosahedronGeometry (1, 1);
//console.log(new THREE.BufferGeometry().fromGeometry)
geoRef.computeVertexNormals();
var geometry = new THREE.BufferGeometry();
geometry.fromGeometry(geoRef);
//var positions = new THREE.Float32BufferAttribute( geoRef.vertices.length * 3, 3 );
//var normals = new THREE.Float32BufferAttribute( geoRef.vertices.length * 3, 3 );
var positions = geometry.getAttribute( 'position' );
var normals = geometry.getAttribute( 'normal' );

var indices = new THREE.Float32BufferAttribute( geoRef.faces.length * 3, 3 );
var verts = {};
/*
for(var i = 0; i < geoRef.vertices.length; i++)
{
  var pos = geoRef.vertices[i];
  positions.setXYZ(i, pos.x, pos.y, pos.z);
  var norm = geoRef.vertices[i].normalize();
  normals.setXYZ(i, norm.x, norm.y, norm.z);
}*/
// Create array
for(var i = 0; i < geoRef.faces.length; i++)
{
  var face = geoRef.faces[i];
  indices.setXYZ(i, face.a, face.b, face.c);
}

var max = Math.max.apply(null, indices.array);
//console.log(max)
var shapeArray = [];
for(var i = 0; i < max + 1; i++)
  {
    shapeArray.push([]);
  }
for(var i = 0; i < indices.array.length; i++)
  {
   //console.log(indices.array[i]); console.log(shapeArray[indices.array[i]].length);
    shapeArray[indices.array[i]].push(i);
  }

//console.log(shapeArray);

//geometry.addAttribute( 'displacement', displacement );
//var colors = new THREE.Float32BufferAttribute(geoRef.faces.length * 3, 3);
var colors = geometry.getAttribute('color');

// Color each face a random color
for(var i = 0; i < colors.count; i+=3)
{
  var c = new THREE.Vector3(Math.random(), Math.random(), Math.random());
  colors.setXYZ(i, c.x, c.y, c.z);
  colors.setXYZ(i+1, c.x, c.y, c.z);
  colors.setXYZ(i+2, c.x, c.y, c.z);
}


//geometry.addAttribute( 'color', colors );
//geometry.addAttribute ( 'position', positions );
//geometry.addAttribute ( 'normal', normals );
//geometry.setIndex(indices);
geometry.addAttribute ( 'indices', indices );


//var displacement = new THREE.BufferAttribute( positions.count * 3, 3 );
//geometry.addAttribute( 'displacement', displacement );

geometry.computeVertexNormals();


// Create default material - unshaded
var material = new THREE.MeshBasicMaterial( 0x00ff00 );
material.vertexColors = THREE.FaceColors;
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

var simplex = new SimplexNoise();
var offsets = []
for(var i = 0; i < shapeArray.length; i++)
{
  offsets.push(
    simplex.noise3d(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    ));
}

function lerp (start, end, amt){
  return (1-amt)*start+amt*end
}

function moveVertex(vertices, shapeArray, vertIndex, offset)
{
  for(var i = 0; i < shapeArray[vertIndex].length; i++)
    {
      var v = shapeArray[vertIndex][i];
      vertices.setXYZ(v, 
        vertices.getX(v) + offset.x,
        vertices.getY(v) + offset.y,
        vertices.getZ(v) + offset.z
      );
    }
}


function makeThisLookCool(time)
{
  // Offset the position using simplex noise
for(var i = 0; i < shapeArray.length; i++)
{
  //var offset = 0.0;
  var offsetMultiple = 0.01;

  var n = shapeArray[i][0];
  var normalVec = new THREE.Vector3(
    positions.getX(n),
    positions.getY(n),
    positions.getZ(n)
  ).normalize();

  var freq = 10 * lerp(0.6, 1.0, offsets[i]);
  moveVertex(positions, shapeArray, i, normalVec.multiplyScalar(offsetMultiple * Math.cos(freq * time)));
}
}

camera.position.z = 5;
t = 0;
function animate() {
  t += 0.01;
  makeThisLookCool(t);
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  cube.geometry.attributes.position.needsUpdate = true;
}
animate();
