setLogTag('music');

// setup polysynth (plays multiple notes)

// StartAudioContext(Tone.context);

var synth = new Tone.PolySynth(10, Tone.Synth).toMaster();


for (var i = 0; i < synth.voices.length; i++) {
  // most of what you hear will be the release tail
  synth.voices[i].envelope.release = 20.0;
  // the attack goes to 1.0 vol, but the start of the release will be 10% of that
  synth.voices[i].envelope.sustain = 0.2;
  // clear tone for music box :) 
  synth.voices[i].oscillator._oscillator._type = "sine";
  synth.voices[i].volume.input.value = 0.25;

  // console.log(synth.voices[i]);
}

// create simplex noise
var simplex = new SimplexNoise();

/**
 * noise globals that controls various aspects of sound
 * 
 * moodNoise
 *  *- controls what chord to play.
 * durationNoise
 *  *- controls how fast the arpeggio is, 
 *   - and also how soon to play the next chord
 * chordSizeNoise
 *  *- controls how large the chord is
 *   - larger chords also get more color notes
 */ 
var moodNoise = 0;
var durationNoise = 0;
var chordSizeNoise = 0;

/**
 * globals that keep track of frame times for delta timing
 */
var lastFrameTimeMs = 0;
var lastNoteTimeMs = 0;
var maxFPS=60;

/**
 * globals that set arpeggio and chord "speed"
 */
var arpeggioSpeed = 80;
var nextDuration = 500;

/**
 * globals that set the possible variances on note and chord "speed"
 */
var minDurationMultiple = 0.5;
var numDurations = 4.0;


/**
 * a brief ordering of some chords by "mood";
 * sad comes first, happy comes last.
 */
var moodChords = ['Am', 'Em', 'F', 'G', 'C'];

/**
 * globals that keep track of what's to play next
 * 
 * nextNote
 *  *- what is the next note in the chord to be played (low to high)
 * nextChord
 *  *- what is the next chord to be played
 * nextChordSize
 *  *- how big will the next chord be
 * nextBrightNotes
 *  *- how many bright color notes will be played in the next chord
 * nextDarkNotes
 *  *- how many dark color notes will be played in the next chord
 */
var nextNote = 0;

var nextBase = 'C';
var nextChord = getSimpleChord(nextBase, 1, 3, 0, 0, false);
var nextChordSize = 3;
var nextBrightNotes = 0;
var nextDarkNotes = 0;

var initialized = false;

// update simplex noise data (called every frame)
function updateNoise(tick) { 
  moodNoise = (simplex.noise3d(tick / 2, 0, 0) + 1.0) / 2.0;
  durationNoise = (simplex.noise3d(tick / 5, 1000, 0) + 1.0) / 2.0;
  chordSizeNoise = (simplex.noise3d(tick / 3, 2000, 0) + 1.0) / 2.0;
}

function getTimestamp() {
  return lastFrameTimeMs;
}

function init() {
  initialized = true;
  var nextChordObj = new Chord(nextBase, nextChord);
  onChordPlayedCallback(nextChordObj, lastFrameTimeMs);
}

async function populateNextMeasureChord(tick) {
  updateNoise(tick);

  nextNote = 0;
  nextBase = moodChords[Math.floor(moodChords.length * moodNoise)];
  nextChordSize = Math.floor(chordSizeNoise * 3.0) + 2; // at least two notes
 
  // add color notes for large chords
  if (nextChordSize > 3) {
    nextBrightNotes = 1;
  } 
  if (nextChordSize > 4) {
    nextDarkNotes = 1;
  }
  // max 4 notes
  nextChord = getSimpleChord(nextBase, 1, nextChordSize, nextBrightNotes, nextDarkNotes, true).slice(0,5);

  future_chords.push([Math.floor(cur_tick) + 1.0, new Chord(nextBase, nextChord)]);
}

async function populateNextMeasureBass(tick) {
  updateNoise(tick);

  var dist = 0.25;
  if (nextChordSize <= 2) {
    var dist = 0.5;
  }

  for (var i = 0; i < 4 && i < nextChordSize; i++) {
    future_notes_bass.push([Math.floor(cur_tick) + 1.0 + i * dist, nextChord[i]]);
  }
}

async function populateNextMeasureMelody(tick) {
  updateNoise(tick);

  numNotes = Math.floor(durationNoise * 3.0) + 2;

  var dist = 0.25;
  if (nextChordSize <= 2) {
    var dist = 0.5;
  }

  for (var i = 0; i < 4 && i < numNotes; i++) {
    var note_tick = Math.floor(cur_tick) + 1.0 + i * dist;
    updateNoise(note_tick);

    note = getIntervalNote(nextBase + (chordData.baseOctave + 1), Math.floor(chordSizeNoise * 9.0));
    future_notes_melody.push([note_tick, note]);
  }
}

// main update loop
function mainLoop(timestamp) {
  if (!initialized) {
    init();
  }

  if (timestamp < lastFrameTimeMs + (1000 / maxFPS)) {

    // if we're not at the next frame, just do nothing
    // still request next frame just in case next frame we do something
    requestAnimationFrame(mainLoop);
    return;
  }

  // update frame timing issues, set delta
  delta = timestamp - lastFrameTimeMs;
  lastFrameTimeMs = timestamp;

  cur_tick += 0.25 * (delta / 1000.0) * (bpm / 60.0);

  cur_measure = Math.floor(cur_tick);
  cur_beat = cur_tick - cur_measure;


  // change document background color
  document.body.style.backgroundColor = "rgb(" + moodNoise * 256.0 + "," + 
                                                 moodNoise * 256.0 + "," + 
                                                 moodNoise * 256.0 + ")";

  // if we have less than a measure left to play,
  // generate the measure after that.
  if (future_notes_bass.length == 0 || Math.ceil(future_notes_bass[future_notes_bass.length - 1][0]) - cur_tick < 1.0) {
    populateNextMeasureChord(Math.floor(cur_tick) + 1.0);
    populateNextMeasureBass(Math.floor(cur_tick) + 1.0);
  }

  if (future_notes_melody.length == 0 || Math.ceil(future_notes_melody[future_notes_melody.length - 1][0]) - cur_tick < 1.0) {
    populateNextMeasureMelody(Math.floor(cur_tick) + 1.0);
  }


  while (future_chords.length > 0 && future_chords[0][0] <= cur_tick) {
    var chord = future_chords.shift();
    console.log("chord: " + chord);
    past_chords.push(chord);
  }

  while (future_notes_bass.length > 0 && future_notes_bass[0][0] <= cur_tick) {
    var note = future_notes_bass.shift();
    console.log("bass: " + note);
    past_notes_bass.push(note);
    synth.triggerAttackRelease(note[1], "32n");
  }

  while (future_notes_melody.length > 0 && future_notes_melody[0][0] <= cur_tick) {
    var note = future_notes_melody.shift();
    console.log("melody: " + note);
    past_notes_melody.push(note);
    synth.triggerAttackRelease(note[1], "32n");
  }



  prev_tick = cur_tick;

  prev_measure = cur_measure;
  prev_beat = cur_beat;
  requestAnimationFrame(mainLoop);
}

requestAnimationFrame(mainLoop);

