// setup polysynth (plays multiple notes)
var synth = new Tone.PolySynth(10, Tone.Synth).toMaster();

for (var i = 0; i < synth.voices.length; i++) {
  synth.voices[i].envelope.release = 20.0;
  synth.voices[i].envelope.sustain = 0.1;
  synth.voices[i].oscillator._oscillator._type = "sine";

  // console.log(synth.voices[i]);
}


// seed noise
var date = new Date();
noise.seed(date.getTime());
var simplex = new SimplexNoise();

var pitchPerlin = 0;
var durationPerlin = 0;
var chordSizePerlin = 0;

var lastFrameTimeMs = 0;
var lastNoteTimeMs = 0;
var maxFPS=60;

var arpeggioSpeed = 80;
var nextDuration = 500;

var minDurationMultiple = 0.5;
var numDurations = 4.0;

var nextNote = 0;

var moodChords = ['Am', 'Em', 'F', 'G', 'C'];
var nextChord = getSimpleChord('C', 1, 3, 0, 0, false);
var nextBase = 'C';

// update perlin noises
function updatePerlin(delta, timestamp) { 
  // pitchPerlin = (noise.perlin2(timestamp / 10000, 0) + 0.5);
  // durationPerlin = (noise.perlin2(timestamp / 10000, 1000) + 0.5);
  // chordSizePerlin = (noise.perlin2(timestamp / 10000, 2000) + 0.5);
  pitchPerlin = (simplex.noise3d(timestamp / 2000, 0, 0) + 1.0) / 2.0;
  durationPerlin = (simplex.noise3d(timestamp / 5000, 1000, 0) + 1.0) / 2.0;
  chordSizePerlin = (simplex.noise3d(timestamp / 3000, 1000.5, 0) + 1.0) / 2.0;
}
 
function mainLoop(timestamp) {
  if (timestamp < lastFrameTimeMs + (1000 / maxFPS)) {
    requestAnimationFrame(mainLoop);
    return;
  }
  lastFrameTimeMs = timestamp;
  delta = timestamp - lastFrameTimeMs; // get the delta time since last frame
  lastFrameTimeMs = timestamp;
 
  updatePerlin(delta, timestamp); // pass delta to updatePerlin
  
  document.body.style.backgroundColor = "rgb(" + pitchPerlin * 256.0 + "," + 
                                                 pitchPerlin * 256.0 + "," + 
                                                 pitchPerlin * 256.0 + ")";

  if (timestamp - lastNoteTimeMs > nextDuration) {


    // synth.triggerAttackRelease(Cmaj[Math.floor(Cmaj.length * (pitchPerlin))], "42n");
    synth.triggerAttackRelease(nextChord[nextNote], "32n");

    lastNoteTimeMs = timestamp;

    // ceil, so "min duration" is at least 0.5 * arpeggioSpeed
    nextDuration = arpeggioSpeed * (minDurationMultiple * (Math.ceil(durationPerlin * numDurations)));

    nextNote += 1;
    if (nextNote > nextChord.length) {
      console.log(nextBase);
      console.log(nextChord);

      nextNote = 0;
      nextBase = moodChords[Math.floor(moodChords.length * pitchPerlin)];
      nextChord = getSimpleChord(nextBase, 1, Math.ceil(chordSizePerlin * 5.0), 0, 0, false);
      nextDuration *= 16;
    }
  }

  requestAnimationFrame(mainLoop);
}

requestAnimationFrame(mainLoop);

