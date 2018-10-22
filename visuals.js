// Create basic scene
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Create geometry object
// var geoRef = new THREE.BoxGeometry ( 1, 1, 1 );
var geoRef = new THREE.IcosahedronGeometry (1, 1);
geoRef.computeVertexNormals();
var geometry = new THREE.BufferGeometry();
geometry.fromGeometry(geoRef);

// References to buffers that control objects' look
var positions = geometry.getAttribute( 'position' );
var normals = geometry.getAttribute( 'normal' );
geometry.computeVertexNormals();

var vertBase = [];
var vertOffset = [];
for(var i = 0; i < positions.count; i++)
{
  vertBase.push(new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i)));
  vertOffset.push(new THREE.Vector3(0, 0, 0));
}

var indices = new THREE.Float32BufferAttribute( geoRef.faces.length * 3, 3 );
for(var i = 0; i < geoRef.faces.length; i++)
{
  var face = geoRef.faces[i];
  indices.setXYZ(i, face.a, face.b, face.c);
}

// Set up mapping between geometry vertex and all the
// corresponding triangle positions
var max = Math.max.apply(null, indices.array);
var vertexMap = [];
for(var i = 0; i < max + 1; i++)
  {
    vertexMap.push([]);
  }
for(var i = 0; i < indices.array.length; i++)
  {
    vertexMap[indices.array[i]].push(i);
  }
geometry.addAttribute ( 'indices', indices );


// Color each face a random color
var colors = geometry.getAttribute('color');
for(var i = 0; i < colors.count; i+=3)
{
  var c = new THREE.Vector3(Math.random(), Math.random(), Math.random());
  // var c = new THREE.Color(0x000000).lerp(
  //   new THREE.Color(0xffffff),
  //   (i / colors.count));
  colors.setXYZ(i+0, c.r, c.g, c.b);
  colors.setXYZ(i+1, c.r, c.g, c.b);
  colors.setXYZ(i+2, c.r, c.g, c.b);
}


// Create default material - unshaded
var material = new THREE.MeshBasicMaterial( 0x00ff00 );
material.vertexColors = THREE.FaceColors;
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

// Create noise map to create variations in each vertex
var simplex = new SimplexNoise();
var vertNoise = []
for(var i = 0; i < positions.count; i++)
{
  vertNoise.push(
    simplex.noise3d(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    ));
}

function lerp (start, end, amt){
  return (1-amt)*start+amt*end
}

function setVertexOffset(vertIndex, offset)
{
  for(var i = 0; i < vertexMap[vertIndex].length; i++)
    {
      var v = vertexMap[vertIndex][i];
      // vertices.setXYZ(v, 
      //   vertices.getX(v) + offset.x,
      //   vertices.getY(v) + offset.y,
      //   vertices.getZ(v) + offset.z
      // );
      vertOffset[v] = offset;
      // vertices.setXYZ(v, 
      //   vertBase[v].x + vertOffset[v].x,
      //   vertBase[v].y + vertOffset[v].y,
      //   vertBase[v].z + vertOffset[v].z
      // );
      positions.setXYZ(v, 
        vertBase[v].x + vertOffset[v].x,
        vertBase[v].y + vertOffset[v].y,
        vertBase[v].z + vertOffset[v].z
      );
    }
}

var rainbowColorMap =
{
  "A" : 0xf17e77,
  "B" : 0xf0da7b,
  "C" : 0xb0ef7f,
  "D" : 0x83eea6,
  "E" : 0x87e3ec,
  "F" : 0x8b9aeb,
  "G" : 0xc58eea
};

if (!String.format) {
  String.format = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number] 
        : match
      ;
    });
  };
}

var numNotes = 0;
var currIndex = 0;
var noteTime = 0;
var newChordReady = false;
var noteColor = undefined;

var baseColor = new THREE.Color(0.6, 0.7, 0.7);
setBaseColor(baseColor);
var baseColors = []
for(var i = 0; i < colors.count; i++)
{
  baseColors.push(new THREE.Color(
    colors.getX(i),
    colors.getY(i),
    colors.getZ(i)
  ));
}

function onNotePlayedCallback(note, timeMS)
{
  if(note != undefined)
  {
    if(newChordReady)
    {
      currIndex = -1;
      newChordReady = false;
    }
    var tone = note[note.search(/[A-G]/)];
    var octave = note[note.search(/[0-9]/)];
    var sharp = note.search("#") != -1;
    var flat = note.search("b") != -1;
    console.log(
      String.format("Note played: {0} {1} {2}{3}", 
        tone, octave, sharp ? "SHARP" : "" + " ", flat ? "FLAT" : "")
      );
    currIndex++;
    noteTime = timeMS;
    noteColor = new THREE.Color(rainbowColorMap[tone]);
  }
}

function onChordPlayedCallback(chord, timeMS)
{
  if(chord != undefined)
  {
    console.log("Chord played: " + chord);
    numNotes = chord.length;
    newChordReady = true;
  }
}

function setBaseColor(color)
{
  // Color each face a random color
  for(var i = 0; i < colors.count; i+=3)
  {
    var n = Math.random() * 0.2 - 0.1;
    var c = new THREE.Color(color);
    colors.setXYZ(i+0, c.r + n, c.g + n, c.b + n);
    colors.setXYZ(i+1, c.r + n, c.g + n, c.b + n);
    colors.setXYZ(i+2, c.r + n, c.g + n, c.b + n);
  }
}

function setNormalBasedColor(normalToColor)
{
  // Color each face a random color
  for(var i = 0; i < colors.count; i+=3)
  {
    var n = new THREE.Vector3(
      (normals.getX(i) + normals.getX(i+1) + normals.getX(i+2)) * 0.333,
      (normals.getY(i) + normals.getY(i+1) + normals.getY(i+2)) * 0.333,
      (normals.getZ(i) + normals.getZ(i+1) + normals.getZ(i+2)) * 0.333
    ).normalize().applyEuler(cube.rotation);
    var noise = vertNoise[i] * 0.2 - 0.1;
    var c = normalToColor(i, n);
    colors.setXYZ(i+0, c.r + noise, c.g + noise, c.b + noise);
    colors.setXYZ(i+1, c.r + noise, c.g + noise, c.b + noise);
    colors.setXYZ(i+2, c.r + noise, c.g + noise, c.b + noise);
  }
}

function notePulse(normalVec, currIndex, numNotes, noteTime, time)
{
  var hiFreqNormal;
  var up = new THREE.Vector3(0, 1, 0);

  if(numNotes <= 0 || currIndex <= 0)
  {
    hiFreqNormal = 0;
  }
  else
  {
    var step = (currIndex) / (numNotes + 1);
    hiFreqNormal = Math.pow(Math.abs(Math.cos(normalVec.angleTo(up) + Math.PI * (step))), 8);
  }

  // hiFreqNormal = THREE.Math.lerp(hiFreqNormal, 0, 
  //   TWEEN.Easing.Quadratic.Out((time - noteTime) / 300));
  hiFreqNormal = THREE.Math.clamp(THREE.Math.lerp(hiFreqNormal, 0, (time - noteTime) / 700), 0, 1);
  // console.log(hiFreqNormal);

  return hiFreqNormal;
}

function makeThisLookCool(time)
{
  // setNormalBasedColor(function(normal) {
  //   return new THREE.Color(normal.x, normal.y, normal.z);
  //   // return new THREE.Color(Math.random(), Math.random(), Math.random());
  // });

  // Offset the position using simplex noise
for(var i = 0; i < vertexMap.length; i++)
{
  //var offset = 0.0;
  var up = new THREE.Vector3(0, 1, 0);

  var n = vertexMap[i][0];
  var normalVec = new THREE.Vector3(
    normals.getX(n),
    normals.getY(n),
    normals.getZ(n)
  ).normalize().applyEuler(cube.rotation);

  var hiFreqNormal = notePulse(normalVec, currIndex, numNotes, noteTime, getTimestamp());

  setNormalBasedColor(function(index, normal) {
    var hiFreqNormal = notePulse(normal, currIndex, numNotes, noteTime, getTimestamp());
    var base = new THREE.Color(baseColors[index]);
    var newColor = noteColor == undefined ? base : base.lerp(noteColor, hiFreqNormal);
    // var b = new THREE.Color(0,0,0);
    // var w = new THREE.Color(1,1,1);
    // var newColor = b.lerp(w, hiFreqNormal);
    return newColor;
});

  var baseAmplitude = 0.05;
  var baseFreq = 10;
  var mult = 5;
  // var mult = 1;

  var amplitude = lerp(baseAmplitude, baseAmplitude * mult, hiFreqNormal);
  var freq = lerp(baseFreq, baseFreq * mult, hiFreqNormal) * lerp(0.9, 1.2, vertNoise[n]);
  // console.log(amplitude + " " + freq);
  // var freq = 10 * lerp(0.6, 1.0, vertNoise[i]);
  // setVertexOffset(i, normalVec.multiplyScalar(
  //   amplitude * Math.cos(freq * time)));
  // setVertexOffset(i, normalVec.multiplyScalar(
  //   amplitude * Math.sin(freq * vertNoise[i] * time)));
  var pulse = lerp(0, 0.5, hiFreqNormal) * lerp(0.9, 1.2, vertNoise[n]);

  setVertexOffset(i, normalVec.multiplyScalar(pulse));
  // setVertexOffset(i, new THREE.Vector3(0, 0, 0));
}
}

camera.position.z = 5;
t = 0;
function animate() {
  t += 0.01;
  makeThisLookCool(t);
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
  // cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  cube.geometry.attributes.position.needsUpdate = true;
  cube.geometry.attributes.color.needsUpdate = true;
}
animate();
