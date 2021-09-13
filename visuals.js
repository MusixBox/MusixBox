/**
 * Define helper functions
 */
// TODO separate into file
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

/**
 * Global Constants
 */
var NEXT_MELODY_NOTES = 8;
var MIN_MELODY_DIST = 1.5;
var MAX_MELODY_DIST = 2.0;
var MIN_MELODY_SIZE = 1.0;
var MAX_MELODY_SIZE = 1.5;

/**
 * Global Variables
 */
var scene = undefined;
var camera = undefined;
var renderer = undefined;
var bassObj = undefined;
var bassPositions = [];
var bassColors = [];
var bassNormals = [];
var bassBaseColors = [];
var positionBase = [];
var positionOffset = [];
var vertexMap = [];
var vertNoise = [];
var melodyObj = undefined;
var backgroundObj = undefined;
var melodyBaseColors = [];
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
var bkndColor = new THREE.Color('#00000');

/**
 * Initial setup
 * 
 */
init3DScene();

function init3DScene()
{
  // Create basic scene
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight ); // TODO adaptive window size
  document.body.appendChild( renderer.domElement );

  /**
   * Create geometry object for bass tones.
   * Stored as a BufferGeometry so the vertices can be
   * directly edited.
   */
  var geoRef = new THREE.IcosahedronGeometry (1, 1);
  geoRef.computeVertexNormals();
  var bassGeo = new THREE.BufferGeometry();
  bassGeo.fromGeometry(geoRef);

  // Creating references to buffers for specific attributes of the bass object
  bassPositions = bassGeo.getAttribute( 'position' );
  bassNormals = bassGeo.getAttribute( 'normal' );
  // bassGeo.computeVertexNormals(); // TODO why is this done after normals are stored?
  bassColors = bassGeo.getAttribute( 'color' );
  var bassIndices = new THREE.Float32BufferAttribute( geoRef.faces.length * 3, 3 );
  for(var i = 0; i < geoRef.faces.length; i++)
  {
    var face = geoRef.faces[i];
    bassIndices.setXYZ(i, face.a, face.b, face.c);
  }

  // Extra buffers to more easily animate the vertices by an offset
  // and then return them to their original position
  positionBase = [];
  positionOffset = [];
  for(var i = 0; i < bassPositions.count; i++)
  {
    positionBase.push(new THREE.Vector3(bassPositions.getX(i), bassPositions.getY(i), bassPositions.getZ(i)));
    positionOffset.push(new THREE.Vector3(0, 0, 0));
  }

  // Set up mapping between bassGeo vertex and all the
  // corresponding triangle positions it touches
  var max = Math.max.apply(null, bassIndices.array);
  vertexMap = [];
  for(var i = 0; i < max + 1; i++)
    {
      vertexMap.push([]);
    }
  for(var i = 0; i < bassIndices.array.length; i++)
    {
      vertexMap[bassIndices.array[i]].push(i);
    }
  bassGeo.addAttribute ( 'indices', bassIndices );


  // Create default material (unshaded)
  var backgroundMat = new THREE.MeshBasicMaterial( 0x00ff00 );
  backgroundMat.vertexColors = THREE.FaceColors;

  // Create the final bass object
  bassObj = new THREE.Mesh( bassGeo, backgroundMat );
  scene.add( bassObj );


  /**
   * Setting up shaders
   */
  var fShader = document.getElementById('fragmentShader').text;
  var vShader = document.getElementById('vertexShader').text;
  
  // Set shader uniform variables
  var uniforms = {
    // Background color
    "color1" : {
      type : "c",
      value : new THREE.Color('#000000'),
    },
  };

  // Finish material
  var backgroundMat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vShader,
    fragmentShader: fShader
  });

  /**
   * Setting up background object (simple quad, colored by material)
   */
  var backgroundGeo = new THREE.Geometry();

  backgroundGeo.vertices.push(
    new THREE.Vector3( -50,  50, -5 ),
    new THREE.Vector3( -50, -50, -5 ),
    new THREE.Vector3(  50, -50, -5 ),
    new THREE.Vector3(  50,  50, -5 )
  );

  backgroundGeo.faces.push( new THREE.Face3( 0, 1, 2 ) );
  backgroundGeo.faces.push( new THREE.Face3( 0, 2, 3 ) );

  backgroundObj = new THREE.Mesh(backgroundGeo, backgroundMat);
  scene.add(backgroundObj);


  /**
   * Setting up melody object
   */
  var melodyBaseColor = new THREE.Color('#a9f2dd');
  var melodyGeo = new THREE.OctahedronGeometry(0.15, 0);

  var melodyMat = new THREE.MeshBasicMaterial(0x000000);
  melodyMat.vertexColors = THREE.FaceColors;
  melodyBaseColors = [];

  
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
    
  melodyObj = new THREE.Mesh(melodyGeo, melodyMat);
  scene.add(melodyObj);

  // Create noise map to create variations in each vertex
  var simplex = new SimplexNoise();
  vertNoise = []
  for(var i = 0; i < bassPositions.count; i++)
  {
    vertNoise.push(
      simplex.noise3d(
        bassPositions.getX(i),
        bassPositions.getY(i),
        bassPositions.getZ(i)
      ));
  }

  // Set base color for bass object
  var bc = new THREE.Color(baseColor);
  setBassColors(bc, vertNoise, baseColorNoise);
  bassBaseColors = [];
  for(var i = 0; i < bassColors.count; i++)
  {
    bassBaseColors.push(new THREE.Color(
      bassColors.getX(i),
      bassColors.getY(i),
      bassColors.getZ(i)
    ));
  }

  // Start animation
  camera.position.z = 5;
  t = 0;
  animate();
}

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

function lerp (start, end, amt){
  return (1-amt)*start+amt*end
}

function setVertexOffset(vertexMap, vertIndex, offset)
{
  // Move all triangle vertices corresponding to this vertex
  // by <offset>
  for(var i = 0; i < vertexMap[vertIndex].length; i++)
  {
    var v = vertexMap[vertIndex][i];
    positionOffset[v] = offset;
    bassPositions.setXYZ(v, 
      positionBase[v].x + positionOffset[v].x,
      positionBase[v].y + positionOffset[v].y,
      positionBase[v].z + positionOffset[v].z
    );
  }
}
function onMelodyPlayedCallback(note, timeMS)
{
  melodyNote = note;
  melodyTime = timeMS;
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
  }
}

function onChordPlayedCallback(chord, timeMS)
{
  if(chord != undefined)
  {
    chordObj = chord;
    nextNumNotes = chord.notes.length;
    newChordReady = true;
  }
}

function setBassColors(color, vertNoise, noise)
{
  // Color each face a random color
  for(var i = 0; i < bassColors.count; i+=3)
  {
    var n = vertNoise[i] * noise - (noise/2);
    var c = new THREE.Color(color);
    bassColors.setXYZ(i+0, c.r + n, c.g + n, c.b + n);
    bassColors.setXYZ(i+1, c.r + n, c.g + n, c.b + n);
    bassColors.setXYZ(i+2, c.r + n, c.g + n, c.b + n);
  }
}

function setNormalBasedColor(bassObj, normalToColor, vertNoise, noise)
{
  // Color each face a random color
  for(var i = 0; i < bassColors.count; i+=3)
  {
    var normal = new THREE.Vector3(
      (bassNormals.getX(i) + bassNormals.getX(i+1) + bassNormals.getX(i+2)) * 0.333,
      (bassNormals.getY(i) + bassNormals.getY(i+1) + bassNormals.getY(i+2)) * 0.333,
      (bassNormals.getZ(i) + bassNormals.getZ(i+1) + bassNormals.getZ(i+2)) * 0.333
    ).normalize().applyEuler(bassObj.rotation);
    var n = vertNoise[i] * noise - (noise/2);
    var c = normalToColor(i, normal);
    bassColors.setXYZ(i+0, c.r + n, c.g + n, c.b + n);
    bassColors.setXYZ(i+1, c.r + n, c.g + n, c.b + n);
    bassColors.setXYZ(i+2, c.r + n, c.g + n, c.b + n);
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
  
  // console.log(time - noteTime);

  hiFreqNormal = THREE.Math.clamp(
    THREE.Math.lerp(hiFreqNormal, 0, 
      bassTween),
    0, 1);
  // debugGraphics(hiFreqNormal);

  return hiFreqNormal;
}

function animateBassViz(time)
{
  // // Debug: show normals by color
  // setNormalBasedColor(function(normal) {
  //   return new THREE.Color(normal.x, normal.y, normal.z);
  //   // return new THREE.Color(Math.random(), Math.random(), Math.random());
  // });

  // Offset the position using simplex noise
  for(var i = 0; i < vertexMap.length; i++)
  {
    var n = vertexMap[i][0];
    var normalVec = new THREE.Vector3(
      bassNormals.getX(n),
      bassNormals.getY(n),
      bassNormals.getZ(n)
    ).normalize().applyEuler(bassObj.rotation);

    var hiFreqNormal = notePulse(normalVec, currIndex, numNotes, noteTime, getTimestamp());

    setNormalBasedColor(bassObj, function(index, normal) {
      var hiFreqNormal = notePulse(normal, currIndex, numNotes, noteTime, getTimestamp());
      var base = new THREE.Color(bassBaseColors[index]);
      var newColor = noteColor == undefined ? base : base.lerp(noteColor, hiFreqNormal);
      return newColor;
    }, vertNoise, baseColorNoise);

    var baseAmplitude = 0.05;
    var baseFreq = 5;
    var mult = 10;

    var amplitude = lerp(baseAmplitude, baseAmplitude * mult, hiFreqNormal);
    var freq = lerp(baseFreq, baseFreq * mult, hiFreqNormal) * lerp(0.9, 1.2, vertNoise[n]);
    setVertexOffset(vertexMap, i, normalVec.multiplyScalar(
      amplitude * Math.sin(freq * time)));
  }
}

function animateMelodyViz(time)
{
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

// Animation callback function
function animate(time) {
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
    bkndColor = new THREE.Color(noteColor);
    var black = new THREE.Color('#000000');

    bkndColor = bkndColor.lerp(black, 0.7);
    var prevBkndColor = new THREE.Color(prevNoteColor);
    prevBkndColor = prevBkndColor.lerp(black, 0.7);
    backgroundObj.material.uniforms.color1.value = prevBkndColor.lerp(bkndColor, bassTween);
  }
}
