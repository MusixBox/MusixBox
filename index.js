var synth = new Tone.AMSynth().toMaster()

//attach a listener to all of the buttons
document.querySelectorAll('button').forEach(function(button){
  button.addEventListener('mousedown', function(e){
    //play the note on mouse down
    synth.triggerAttack(e.target.textContent)
  })
  button.addEventListener('mouseup', function(e){
    //release on mouseup
    synth.triggerRelease()
  })
})

// noise.seed(Math.random());
noise.seed(0);

var value = 0,
value1 = 0,
lastFrameTimeMs = 0,
lastNoteTimeMs = 0,
maxFPS=60;

var date = new Date();

var baseTime = 500;
var curDiff = 500;

notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
function update(delta, timestamp) { 
  value = (noise.perlin2(timestamp / 1000, 0) + 0.5) * 256.0;
  value1 = (noise.perlin2(timestamp / 1000, 50) + 0.5);
}
 
function mainLoop(timestamp) {
  if (timestamp < lastFrameTimeMs + (1000 / maxFPS)) {
    requestAnimationFrame(mainLoop);
    return;
  }
  lastFrameTimeMs = timestamp;
  delta = timestamp - lastFrameTimeMs; // get the delta time since last frame
  lastFrameTimeMs = timestamp;
 
  update(delta, timestamp); // pass delta to update
  
  
  document.body.style.backgroundColor = "rgb(" + value + "," + value + "," + value + ")";


  if (timestamp - lastNoteTimeMs > curDiff) {
    synth.triggerAttackRelease(notes[Math.floor(8.0 * (value/256.0))], "32n");
    lastNoteTimeMs = timestamp;

    curDiff = baseTime * (0.5 * (Math.ceil(value1 * 4.0)));
  }

  requestAnimationFrame(mainLoop);
}

requestAnimationFrame(mainLoop);

