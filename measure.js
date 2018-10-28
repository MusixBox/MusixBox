setLogTag('music');
/**
 * measure.js is our internal system of keeping track of what notes we've launched to play.
 * 
 * Tone.js's Transport is weird enough for me that I didn't want to use it.
 */

var bpm = 80;

/**
 * keeps track of "time", but instead of seconds, 
 * the integral part is measures, and the fractional part is within a measure.
 * 
 * *_measure and *_beat are updated alongside cur_tick.
 * 
 * note: we don't play anything in the 0th measure, currently.
 * 
 * i.e. 2.25 is the 2nd beat of the 2nd measure.
 */
var cur_tick = 0.0;
var prev_tick = 0.0;
var cur_measure = 0;
var cur_beat = 0;
var prev_measure = 0;
var prev_beat = 0;

// var date = new Date();
// var start_time = date.getTime();

/**
 * these six array hold all the notes that will be played in the future as well
 * as all the notes that have been played.
 * 
 * Currently, if there's less than a measure of notes left to play for either the 
 * bass or melody, that'll trigger another measure of notes for them to be generated.
 * Before a measure of bass notes are generated, a new chord is generated.
 * 
 * The newly generated notes are placed at the end of the future_* arrays, so that
 * the soonest note is soonest in the array. 
 * 
 * They are placed in tuples where the actual value is the second object, and the 
 * timing (tick) of the note is in the first. 
 *
 * i.e. [2.25, 'C4'] will play C4 on the second beat of the second measure.
 * 
 * When we play notes in the array (i.e. cur_tick >= note_tick), we remove them
 * and put them into the end of the corresponding past_* array.
 * 
 * Thus, the notes that have JUST been played for melody and bass (and the current
 * playing chord as well) is in the last tuple of each corresponding past_* array.
 * 
 */
var past_notes_bass = [];
var past_notes_melody = [];
var past_chords = [];

var future_notes_bass = [];
var future_notes_melody = [];
var future_chords = [];
