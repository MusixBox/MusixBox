// setup polysynth (plays multiple notes)

StartAudioContext(Tone.context);

var synth = new Tone.PolySynth(10, Tone.Synth).toMaster();

for (var i = 0; i < synth.voices.length; i++) {
  // most of what you hear will be the release tail
  synth.voices[i].envelope.release = 20.0;
  // the attack goes to 1.0 vol, but the start of the release will be 10% of that
  synth.voices[i].envelope.sustain = 0.1;
  // clear tone for music box :) 
  synth.voices[i].oscillator._oscillator._type = "sine";
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
function updateNoise(delta, timestamp) { 
  moodNoise = (simplex.noise3d(timestamp / 2000, 0, 0) + 1.0) / 2.0;
  durationNoise = (simplex.noise3d(timestamp / 5000, 1000, 0) + 1.0) / 2.0;
  chordSizeNoise = (simplex.noise3d(timestamp / 3000, 1000.5, 0) + 1.0) / 2.0;
}

function getTimestamp()
{
  return lastFrameTimeMs;
}

function init()
{
  initialized = true;
  var nextChordObj = new Chord(nextBase, nextChord);
  onChordPlayedCallback(nextChordObj, lastFrameTimeMs);
}

// main update loop
function mainLoop(timestamp) {
  if(!initialized)
  {
    init();
  }

  if (timestamp < lastFrameTimeMs + (1000 / maxFPS)) {
    // if we're not at the next frame, just do nothing
    // still request next frame just in case next frame we do something
    requestAnimationFrame(mainLoop);
    return;
  }

  // update frame timing issues, set delta
  lastFrameTimeMs = timestamp;
  delta = timestamp - lastFrameTimeMs;
  lastFrameTimeMs = timestamp;
 
  updateNoise(delta, timestamp);
  
  // change document background color
  document.body.style.backgroundColor = "rgb(" + moodNoise * 256.0 + "," + 
                                                 moodNoise * 256.0 + "," + 
                                                 moodNoise * 256.0 + ")";

  // should we play the next note?
  if (timestamp - lastNoteTimeMs > nextDuration) {
    // plays the note; 32n represents '32th note', which is arbitrarily short.
    // most of what you hear is just the "release" tail anyways.
    synth.triggerAttackRelease(nextChord[nextNote], "32n");
    var curNote = nextChord[nextNote];
    onNotePlayedCallback(curNote, lastNoteTimeMs);

    lastNoteTimeMs = timestamp;

    // ceil, so "min duration" is at least 0.5 * arpeggioSpeed
    nextDuration = arpeggioSpeed * (minDurationMultiple * (Math.ceil(durationNoise * numDurations)));

    nextNote += 1;

    // when our next note is past our chord length
    // (i.e. as we're playing the last note in the chord)
    if (nextNote > nextChord.length) {
      console.log(nextBase);
      console.log(nextChord);

      // figure out what we play next
      nextNote = 0;
      nextBase = moodChords[Math.floor(moodChords.length * moodNoise)];
      nextChordSize = Math.floor(chordSizeNoise * 5.0);

      // add color notes for large chords
      if (nextChordSize > 3) {
        nextBrightNotes = 1;
      } 
      if (nextChordSize > 4) {
        nextDarkNotes = 1;
      }
      nextChord = getSimpleChord(nextBase, 1, nextChordSize, nextBrightNotes, nextDarkNotes, true);

      var nextChordObj = new Chord(nextBase, nextChord);
      onChordPlayedCallback(nextChordObj, lastNoteTimeMs);

      // wait longer between chords than between notes in a chord
      nextDuration *= 16;
    }
  }

  requestAnimationFrame(mainLoop);
}

requestAnimationFrame(mainLoop);

