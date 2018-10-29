var NEXT_MELODY_NOTES = 8;
var MIN_MELODY_DIST = 1.5;
var MAX_MELODY_DIST = 2.0;
var MIN_MELODY_SIZE = 1.0;
var MAX_MELODY_SIZE = 1.5;

var numNotes = -1;
var nextNumNotes = -1;
var currIndex = -1;
var noteTime = -1;
var melodyTime = -1;
var bassTween = 0;
var melodyTween = 0;
var bkndTween = 0;
var newChordReady = false;
var chordObj = undefined;
var noteColor = new THREE.Color('#000000');
var prevNoteColor = new THREE.Color('#000000');
var bkndColor = new THREE.Color('#000000');

// Create basic scene
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Create bassGeo object
// var geoRef = new THREE.BoxGeometry ( 1, 1, 1 );
var geoRef = new THREE.IcosahedronGeometry (1, 1);
geoRef.computeVertexNormals();
var bassGeo = new THREE.BufferGeometry();
bassGeo.fromGeometry(geoRef);

// References to buffers that control objects' look
var positions = bassGeo.getAttribute( 'position' );
var normals = bassGeo.getAttribute( 'normal' );
bassGeo.computeVertexNormals();
var colors = bassGeo.getAttribute( 'color' );

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

// Set up mapping between bassGeo vertex and all the
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
bassGeo.addAttribute ( 'indices', indices );


// // Create default material - unshaded
var material = new THREE.MeshBasicMaterial( 0x00ff00 );
material.vertexColors = THREE.FaceColors;
var bassObj = new THREE.Mesh( bassGeo, material );
scene.add( bassObj );

// background object for shader
var uniforms = {
  "color1" : {
    type : "c",
    // value : new THREE.Color(parseInt(colormap[nextBase][0].slice(1, 10), 16)),
    value : new THREE.Color('#000000'),
  },
};
// yourMesh.material.uniforms.yourUniform.value = whatever;

console.log(colormap[past_chords[past_chords.length - 1]]);

var fShader = document.getElementById('fragmentShader').text;
var vShader = document.getElementById('vertexShader').text;

var material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: vShader,
  fragmentShader: fShader
});


var bassGeo = new THREE.Geometry();

bassGeo.vertices.push(
  new THREE.Vector3( -10,  10, -5 ),
  new THREE.Vector3( -10, -10, -5 ),
  new THREE.Vector3(  10, -10, -5 ),
  new THREE.Vector3(  10,  10, -5 )
);

bassGeo.faces.push( new THREE.Face3( 0, 1, 2 ) );
bassGeo.faces.push( new THREE.Face3( 0, 2, 3 ) );


var background = new THREE.Mesh(bassGeo, material);
scene.add(background);

var melodyBaseColor = new THREE.Color('#a9f2dd');
var melodyGeo = new THREE.OctahedronGeometry(0.15, 0);

var melodyMat = new THREE.MeshBasicMaterial(0x000000);
melodyMat.vertexColors = THREE.FaceColors;
var melodyBaseColors = [];

for(var i = 0 ; i < melodyGeo.faces.length; i++)
{
  var rand = 0.3 * (Math.random() - 0.5);
  var c = new THREE.Color(
    melodyBaseColor.r + rand,
    melodyBaseColor.g + rand,
    melodyBaseColor.b + rand);

  melodyGeo.faces[i].color.r = c.r;
  melodyGeo.faces[i].color.g = c.g;
  melodyGeo.faces[i].color.b = c.b;

  melodyBaseColors.push(c);
}

var melodyObj = new THREE.Mesh(melodyGeo, melodyMat);
scene.add(melodyObj);
// melodyObj.scale.y = 0.3;

function generateCirclePoints(numPoints, radius, radiusMultipliers = [])
{
  pts = []
  for(var i = 0; i < numPoints; i++)
  {
    var t = (i / numPoints) * Math.PI * 2;
    var r = radius;
    if(i < radiusMultipliers.length)
    {
      r *= radiusMultipliers[i];
    }
    pts.push(
      new THREE.Vector3(
        r * Math.sin(t),
        r * -Math.cos(t),
        r * 0
    ));
  }
  return pts;
}

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

var bc = new THREE.Color(baseColor);
setBaseColor(bc, baseColorNoise);
var baseColors = [];
for(var i = 0; i < colors.count; i++)
{
  baseColors.push(new THREE.Color(
    colors.getX(i),
    colors.getY(i),
    colors.getZ(i)
  ));
}

function onMelodyPlayedCallback(note, timeMS)
{
  melodyNote = note;
  melodyTime = timeMS;
  // new TWEEN.Tween(melodyTween)
  //   .to(1.0, 200)
  //   .onUpdate(function(melodyTween) {
  //     console.log(val);
  //     // melodyTween = val;
  //   })
  //   .start();
  //   // .chain(new TWEEN.Tween(melodyTween)
  //   //   .to(0, 800))
  //   // .start();
}

function onNotePlayedCallback(note, timeMS)
{
  if(note != undefined)
  {
    if(newChordReady)
    {
      currIndex = -1;
      newChordReady = false;
      numNotes = nextNumNotes;
    }
    var tone = note[note.search(/[A-G]/)];
    var octave = note[note.search(/[0-9]/)];
    var sharp = note.search("#") != -1;
    var flat = note.search("b") != -1;
    currIndex++;
    noteTime = timeMS;

    var colors = colormap[chordObj.name];
    if(colors == undefined)
    {
      colors = colormap['default'];
    }
    prevNoteColor = noteColor;
    noteColor = new THREE.Color(
      colors[currIndex % colors.length]);
    // noteColor = new THREE.Color(0, 0, 0);
    debugGraphics(
      String.format("Note played: {0} {1} {2}{3} ({4} of {5})", 
        tone, octave, sharp ? "SHARP" : "", flat ? "FLAT" : "",
        currIndex + 1, numNotes)
      );
  }
}

function onChordPlayedCallback(chord, timeMS)
{
  if(chord != undefined)
  {
    debugGraphics(
      String.format("Chord played: {0}: {1}",
       chord.name,
       chord.notes));
    chordObj = chord;
    nextNumNotes = chord.notes.length;
    newChordReady = true;
  }
}

function setBaseColor(color, noise)
{
  // Color each face a random color
  for(var i = 0; i < colors.count; i+=3)
  {
    var n = vertNoise[i] * noise - (noise/2);
    var c = new THREE.Color(color);
    colors.setXYZ(i+0, c.r + n, c.g + n, c.b + n);
    colors.setXYZ(i+1, c.r + n, c.g + n, c.b + n);
    colors.setXYZ(i+2, c.r + n, c.g + n, c.b + n);
  }
}

function setNormalBasedColor(normalToColor, noise)
{
  // Color each face a random color
  for(var i = 0; i < colors.count; i+=3)
  {
    var normal = new THREE.Vector3(
      (normals.getX(i) + normals.getX(i+1) + normals.getX(i+2)) * 0.333,
      (normals.getY(i) + normals.getY(i+1) + normals.getY(i+2)) * 0.333,
      (normals.getZ(i) + normals.getZ(i+1) + normals.getZ(i+2)) * 0.333
    ).normalize().applyEuler(bassObj.rotation);
    var n = vertNoise[i] * noise - (noise/2);
    var c = normalToColor(i, normal);
    colors.setXYZ(i+0, c.r + n, c.g + n, c.b + n);
    colors.setXYZ(i+1, c.r + n, c.g + n, c.b + n);
    colors.setXYZ(i+2, c.r + n, c.g + n, c.b + n);
  }
}

function notePulse(normalVec, currIndex, numNotes, noteTime, time)
{
  var hiFreqNormal;
  var up = new THREE.Vector3(0, 1, 0);

  if(numNotes <= 0 || currIndex < 0)
  {
    hiFreqNormal = 0;
  }
  else
  {
    var step = (currIndex) / numNotes;
    hiFreqNormal = Math.pow(Math.abs(Math.cos(Math.PI/8.0 + normalVec.angleTo(up) + Math.PI * (step))), 8);
  }
  
  
  // hiFreqNormal = THREE.Math.clamp(THREE.Math.lerp(hiFreqNormal, 0, (time - noteTime) / 700), 0, 1);

  // console.log(time - noteTime);

  hiFreqNormal = THREE.Math.clamp(
    THREE.Math.lerp(hiFreqNormal, 0, 
      bassTween), // TWEEN.Easing.Cubic.Out((time - noteTime) / 1500)),
    0, 1);
  // debugGraphics(hiFreqNormal);

  return hiFreqNormal;
}

function animateBassViz(time)
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
  ).normalize().applyEuler(bassObj.rotation);

  var hiFreqNormal = notePulse(normalVec, currIndex, numNotes, noteTime, getTimestamp());

  setNormalBasedColor(function(index, normal) {
    var hiFreqNormal = notePulse(normal, currIndex, numNotes, noteTime, getTimestamp());
    var base = new THREE.Color(baseColors[index]);
    var newColor = noteColor == undefined ? base : base.lerp(noteColor, hiFreqNormal);
    return newColor;
}, baseColorNoise);

  var baseAmplitude = 0.05;
  var baseFreq = 5;
  var mult = 10;
  // var mult = 1;

  var amplitude = lerp(baseAmplitude, baseAmplitude * mult, hiFreqNormal);
  var freq = lerp(baseFreq, baseFreq * mult, hiFreqNormal) * lerp(0.9, 1.2, vertNoise[n]);
  // debugGraphics(amplitude + " " + freq);
  // var freq = 10 * lerp(0.6, 1.0, vertNoise[i]);
  // setVertexOffset(i, normalVec.multiplyScalar(
  //   amplitude * Math.cos(freq * time)));
  setVertexOffset(i, normalVec.multiplyScalar(
    amplitude * Math.sin(freq * time)));
  // var pulse = lerp(0, 0.5, hiFreqNormal) * lerp(0.9, 1.2, vertNoise[n]);

  // setVertexOffset(i, normalVec.multiplyScalar(pulse));
  // setVertexOffset(i, new THREE.Vector3(0, 0, 0));
}
}

function animateMelodyViz(time)
{
  // melodyObj.position.y = radius * -Math.cos(t);
  // melodyObj.position.x = radius * -Math.sin(t);
  var melodySpeed = (bpm / 60.0) * 4 / (2.0 * Math.PI)

  melodyTween = (getTimestamp() - melodyTime < 200) ?
    TWEEN.Easing.Cubic.Out((getTimestamp() - melodyTime) / 200) :
    1.0 - TWEEN.Easing.Cubic.InOut((getTimestamp() - melodyTime) / 1100);
  melodyTween = THREE.Math.clamp(melodyTween, 0, 1);

  // console.log(melodyTween);
  var dist = lerp(MIN_MELODY_DIST, MAX_MELODY_DIST, 
    (melodyTween));
  var melodyT = melodySpeed * time - Math.floor(melodySpeed * time);
  var melodyPoint = new THREE.Vector3(
    dist * -Math.sin(time * melodySpeed),
    dist * -Math.cos(time * melodySpeed),
    dist * 0.0
  );
  melodyObj.position.x = melodyPoint.x;
  melodyObj.position.y = melodyPoint.y;
  melodyObj.position.z = melodyPoint.z;
  var rot = (Math.PI / 2.0) + melodyT * Math.PI * 2.0;
  melodyObj.rotation.y = rot;
  melodyObj.rotation.z = rot;

  var scaleFactor = lerp(MIN_MELODY_SIZE, MAX_MELODY_SIZE, melodyTween);
  melodyObj.scale.x = scaleFactor;
  melodyObj.scale.y = scaleFactor;
  melodyObj.scale.z = scaleFactor;

  for(var i = 0; i < melodyObj.geometry.faces.length; i++)
  {
    var c = new THREE.Color(melodyBaseColors[i]);
    c.lerp(new THREE.Color('#ffffff'), melodyTween);
    melodyObj.geometry.faces[i].color = c;
  }

  melodyObj.geometry.elementsNeedUpdate = true;
}

camera.position.z = 5;
t = 0;
function animate() {
  var dt = 0.0166;
  t += dt;
  animateBassViz(t);
  animateMelodyViz(t);
	requestAnimationFrame( animate );
  TWEEN.update(t * 1000);
	renderer.render( scene, camera );
  // bassObj.rotation.x += 0.01;
  bassObj.rotation.y += 0.01;
  bassObj.geometry.attributes.position.needsUpdate = true;
  bassObj.geometry.attributes.color.needsUpdate = true;
  // melodyObj.rotation.x += 0.01;
  bassTween = TWEEN.Easing.Cubic.Out((getTimestamp() - noteTime) / 1500);
  bkndTween = TWEEN.Easing.Cubic.Out((getTimestamp() - noteTime) / 500);

  if (past_chords.length > 0) {
    var prevChordColor = //new THREE.Color(parseInt(colormap[past_chords[past_chords.length-1][1].name][0].slice(1, 10), 16));
    bkndColor = new THREE.Color(noteColor);
    var black = new THREE.Color('#000000');
    // bkndColor = prevChordColor.lerp(black, 0.7);
    bkndColor = bkndColor.lerp(black, 0.7);
    var prevBkndColor = new THREE.Color(prevNoteColor);
    prevBkndColor = prevBkndColor.lerp(black, 0.7);
    background.material.uniforms.color1.value = prevBkndColor.lerp(bkndColor, bassTween);

  //   TWEEN.Tween.
  // hiFreqNormal = THREE.Math.clamp(
  //   THREE.Math.lerp(hiFreqNormal, 0, 
  //   TWEEN.Easing.Cubic.Out((time - noteTime) / 1500)),
  //   0, 1);
  }

}
animate();
