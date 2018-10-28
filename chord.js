/**
 * chordData holds most of the basic chord-generating data
 * 
 * baseOctave
 * 	*- defines the octave chords start in
 * melodyOctave
 *  *- defines the octave the melody starts in
 * scale
 *  *- defines the notes in the scale we'll use (C maj)
 * chords
 * 	*- defines the chords we'll use (ordered by root pitch)
 * basicChordNotes
 *  *- the notes in a "basic" chord to play (starts at root note going up)
 * inversions
 *  *- the three inversions supported
 * colorNotes
 *  *- a short list of "bright" (an octave up) and "dark" (same octave) color notes
 */
var chordData = {
	"baseOctave": 3,
	"melodyOctave": 5,
	"semitones": {
		"C": 0,
		"C#": 1,
		"Db": 1,
		"D": 2,
		"D#": 3,
		"Eb": 3,
		"E": 4,
		"F": 5,
		"F#": 6,
		"Gb": 6,
		"G": 7,
		"G#": 8, 
		"Ab": 8,
		"A": 9,
		"A#": 10,
		"Bb": 10,
		"B": 11,
	},
	"scale": ["C", "D", "E", "F", "G", "A", "B"],
	"chords": ["C", "Dm", "Em", "F", "G", "Am"],
	"basicChordNotes": [1, 5, 8, 10, 12, 15],
	"inversions": [1, 3, 5],
	"colorNotes": {
		"bright": [9, 13],
		"dark": [2, 7],
	},
};

class Chord {
	constructor(name, notes) {
		this.name = name;
		this.notes = notes;
	}
};

/**
 * gets the pitch of the note relative to a C, ignoring octave
 * 
 * note: (string) input note, C3, G5, etc.
 * return: (int) C would give 1 (root), G would give 5 (fifth), etc.
 */ 
function getNote(note) {
	return chordData.scale.indexOf(note.match(/[A-Z]+/g)[0]) + 1;
}

/**
 * gets the octave of a note
 * 
 * note: (string) input note, C3, G5, etc.
 * return: (int) C4 would give 4, F2 would give 2, etc.
 */
function getOctave(note) {
	return Number(note.match(/\d+/g)[0]);
}

/**
 * creates the string represntation of a note from a relative pitch and octave
 * 
 * relative: (int) the relative pitch, i.e. 4 (fourth; F), 6 (sixth; A)
 * octave: (int) the octave
 * return: (string) the joined note. (4, 6) gives F6, 
 */
function toNote(relative, octave) {
	return chordData.scale[relative - 1] + octave;
}

/**
 * Tells you if the given chord symbol is minor
 * 
 * note: (string) the string representation of the root note
 * return: (bool) whether that string representation includes 'm'
 */
function isMinor(note) {
	return note.includes('m');
}

/**
 * Given a note and an interval, returns the interval note.
 * 
 * note: (string) the string representation of the base note
 * interval: (int) the interval distance
 * return: (string) the string representation of the interval note.
 * 
 * example: ('C4', 5) => G4
 */
function getIntervalNote(note, interval) {
	var relative = getNote(note);
	var octave = getOctave(note);
	relative += interval - 1;
	while (relative >= 8) {
		relative -= 7;
		octave += 1;
	}

	return toNote(relative, octave);

}	

/**
 * Given two notes, returns the distance between them
 * 
 * note1: (string) the lower note
 * note2: (string) the higher note
 * return: (int) the interval
 * 
 * example: ('D2', 'B2') => 6
 */
function getNoteInterval(note1, note2) {
	var relative1 = getNote(note1);
	var octave1 = getOctave(note1);

	var relative2 = getNote(note2);
	var octave2 = getOctave(note2);

	return octave2 * 7 + relative2 - (octave1 * 7 + relative1);
}

/**
 * Given two notes, returns the number of semitones in between them 
 * *** Ignores Octaves
 * 
 * note1: (string) the lower note
 * note2: (string) the higher note
 * return: (int) number of semitones
 * 
 * example: ('D2', 'Gb2') => 4
 */
function getSemitoneInterval(note1, note2) {
	// TOOD: better algo, this one feels kinda dumb
	var note1semis = chordData.semitones[note1];
	var note2semis = chordData.semitones[note2];	

	if (note2semis < note1semis) {
		note2semis += 12;
	}

	return note2semis - note1semis;
}

/**
 * returns a basic 4-note chord, given the chord itself; starts on the baseOctave
 * 
 * chord: (string) the chord
 * return: ([string]) all the notes in the chord
 * 
 * example: ('Em') => ['E3', 'B3', 'E4', 'G4']
 */
function getBasicChord(chord) {
	chordNotes = [1, 5, 8, 10];
	return chordNotes.map(rel => getIntervalNote(chord + chordData.baseOctave, rel));
}

/**
 * returns a simple (i.e. 1 key) chord, given some properties.
 * 
 * chord: (string) the chord to play
 * inversion: (int: [1-3]) which inversion to play
 * numBaseNotes: (int: [0-6]) how many base notes to use
 * numBright: (int: [0-2]) how many "bright" color notes
 * numDark: (int: [0-2]) how many "dark" color notes
 * isSparse: (bool) whether to allow "skipping" base notes
 * 
 * return: ([string]) all the notes in the chord
 */
function getSimpleChord(chord, inversion, numBaseNotes, numBright, numDark, isSparse) {
	chordNotes = [chord + chordData.baseOctave];

	if (isSparse) {
		// slice to remove notes below inversion
		sliceStart = 1;
		if (inversion > 2) {
			sliceStart = 2;
		}

		basicNotes = chordData.basicChordNotes.slice(sliceStart, chordData.basicChordNotes.length);
		chordNotes = basicNotes.sort(() => 0.5 - Math.random()).slice(0, numBaseNotes);
		chordNotes = chordNotes.concat([chordData.inversions[inversion - 1]]);
	} else {
		chordNotes = chordData.basicChordNotes.slice(0, numBaseNotes);
	}

	brightNotes = chordData.colorNotes.bright;
	darkNotes = chordData.colorNotes.dark;

	// should be encapsulated within dark / bright notes...
	// replace tritones with major seconds (F-B to F-G)
	// replace root minor seconds with major fourths (B-C to B-E) (E-F to E-A)
	rootNote = chord.match(/[A-Z]+/g)[0];
	debugMusic(rootNote + chordData.baseOctave);
	for (var i = 0; i < darkNotes.length; i++) {
		darkNote = getIntervalNote(rootNote + chordData.baseOctave, darkNotes[i]).match(/[A-Z#b]+/g)[0];
		interval = getSemitoneInterval(rootNote, darkNote);
		switch (interval) {
			case 1:
				darkNotes[i] = 4;
				break;
			case 6:
				darkNotes[i] = 2;
		}
	}
	for (var i = 0; i < brightNotes.length; i++) {
		brightNote = getIntervalNote(rootNote + chordData.baseOctave, brightNotes[i]).match(/[A-Z#b]+/g)[0];
		interval = getSemitoneInterval(rootNote, brightNote);

		switch (interval) {
			case 1:
				brightNotes[i] = 11;
				break;
			case 6:
				brightNotes[i] = 9;
		}
	}

	if (isMinor(chord)) {
		// for (var i = 0; i < darkNotes.length; i++) {
		// 	if (darkNotes[i] == 2) {
		// 		darkNotes[i] = 4;
		// 	}
		// }
		for (var i = 0; i < brightNotes.length; i++) {
			if (brightNotes[i] == 13) {
				brightNotes[i] = 11;
			}
		}
	}
	

	chordNotes = chordNotes.concat(brightNotes.sort(() => 0.5 - Math.random()).slice(0, numBright));
	chordNotes = chordNotes.concat(darkNotes.sort(() => 0.5 - Math.random()).slice(0, numDark));

	chordNotes = chordNotes.sort((a, b) => a - b);
	return chordNotes.map(rel => getIntervalNote(rootNote + chordData.baseOctave, rel));
}

// debugMusic("Basic         : " + getBasicChord("C"));
// debugMusic("Simple, dense : " + getSimpleChord("C", 1, 4, 0, 0, false));
// debugMusic("Simple, sparse: " + getSimpleChord("C", 1, 4, 0, 0, true));
// debugMusic("Simple, color : " + getSimpleChord("C", 1, 2, 2, 1, false));




