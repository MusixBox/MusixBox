setLogTag('music');
/**
 * measure.js is our internal system of keeping track of what notes we've launched to play.
 * 
 * Tone.js's Transport is weird enough for me that I didn't want to use it.
 */

var bpm = 80;

// 1.0 = one measure
var cur_tick = 0.0;
var prev_tick = 0.0;

var cur_measure = 0;
var cur_beat = 0;

var prev_measure = 0;
var prev_beat = 0;

var date = new Date();
var start_time = date.getTime();


var past_notes = [];
var future_notes = [];