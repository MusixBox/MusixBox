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

var pitchNoise = 0;
var durationNoise = 0;
var chordSizeNoise = 0;

var lastFrameTimeMs = 0;
var lastNoteTimeMs = 0;
var maxFPS=60;

var arpeggioSpeed = 80;
var nextDuration = 500;

var minDurationMultiple = 0.5;
var numDurations = 4.0;

var nextNote = 0;

var moodChords = ['Am', 'Em', 'F', 'G', 'C'];

var nextBase = 'C';
var nextChord = getSimpleChord(nextBase, 1, 3, 0, 0, false);
var nextChordSize = 3;
var nextBrightNotes = 0;
var nextDarkNotes = 0;

// update simplex noises
function updateNoise(delta, timestamp) { 
  // pitchNoise = (noise.perlin2(timestamp / 10000, 0) + 0.5);
  // durationNoise = (noise.perlin2(timestamp / 10000, 1000) + 0.5);
  // chordSizeNoise = (noise.perlin2(timestamp / 10000, 2000) + 0.5);
  pitchNoise = (simplex.noise3d(timestamp / 2000, 0, 0) + 1.0) / 2.0;
  durationNoise = (simplex.noise3d(timestamp / 5000, 1000, 0) + 1.0) / 2.0;
  chordSizeNoise = (simplex.noise3d(timestamp / 3000, 1000.5, 0) + 1.0) / 2.0;
}
 
function mainLoop(timestamp) {
  if (timestamp < lastFrameTimeMs + (1000 / maxFPS)) {
    requestAnimationFrame(mainLoop);
    return;
  }
  lastFrameTimeMs = timestamp;
  delta = timestamp - lastFrameTimeMs; // get the delta time since last frame
  lastFrameTimeMs = timestamp;
 
  updateNoise(delta, timestamp); // pass delta to updateNoise
  
  document.body.style.backgroundColor = "rgb(" + pitchNoise * 256.0 + "," + 
                                                 pitchNoise * 256.0 + "," + 
                                                 pitchNoise * 256.0 + ")";

  if (timestamp - lastNoteTimeMs > nextDuration) {


    // synth.triggerAttackRelease(Cmaj[Math.floor(Cmaj.length * (pitchNoise))], "42n");
    synth.triggerAttackRelease(nextChord[nextNote], "32n");

    lastNoteTimeMs = timestamp;

    // ceil, so "min duration" is at least 0.5 * arpeggioSpeed
    nextDuration = arpeggioSpeed * (minDurationMultiple * (Math.ceil(durationNoise * numDurations)));

    nextNote += 1;
    if (nextNote > nextChord.length) {
      console.log(nextBase);
      console.log(nextChord);

      nextNote = 0;
      nextBase = moodChords[Math.floor(moodChords.length * pitchNoise)];

      nextChordSize = Math.floor(chordSizeNoise * 5.0);
      if (nextChordSize > 3) {
        nextBrightNotes = 1;
      } 
      if (nextChordSize > 4) {
        nextDarkNotes = 1;
      }
      nextChord = getSimpleChord(nextBase, 1, nextChordSize, nextBrightNotes, nextDarkNotes, true);
      nextDuration *= 16;
    }
  }

  requestAnimationFrame(mainLoop);
}

requestAnimationFrame(mainLoop);

