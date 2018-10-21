var synth = new Tone.PolySynth(6, Tone.Synth).toMaster();

noise.seed(0);

// synth.set("detune", -1200);

for (var i = 0; i < synth.voices.length; i++) {
  synth.voices[i].envelope.release = 20.0;
  synth.voices[i].oscillator._oscillator._type = "sine";

  console.log(synth.voices[i]);

}

var pitchPerlin = 0;
var durationPerlin = 0;

var lastFrameTimeMs = 0;
var lastNoteTimeMs = 0;
var maxFPS=60;

var baseDuration = 500;
var nextDuration = 500;

var minDurationMultiple = 0.5;
var numDurations = 4.0;

var Cmaj = ['C5', 'C4', 'D5', 'A4', 'E5', 'F4', 'F5', 'G4', 'G5', 'A5', 'C6'];

var bits = 256.0;

function update(delta, timestamp) { 
  pitchPerlin = (noise.perlin2(timestamp / 1000, 0) + 0.5) * bits;
  durationPerlin = (noise.perlin2(timestamp / 1000, 50) + 0.5);
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
  
  document.body.style.backgroundColor = "rgb(" + pitchPerlin + "," + 
                                                 pitchPerlin + "," + 
                                                 pitchPerlin + ")";

  if (timestamp - lastNoteTimeMs > nextDuration) {
    synth.triggerAttackRelease(Cmaj[Math.floor(Cmaj.length * (pitchPerlin/bits))], "42n");
    lastNoteTimeMs = timestamp;

    // ceil, so "min duration" is at least 0.5 * baseDuration
    nextDuration = baseDuration * (minDurationMultiple * (Math.ceil(durationPerlin * numDurations)));
  }

  requestAnimationFrame(mainLoop);
}

requestAnimationFrame(mainLoop);

