var chordData = {
	"baseOctave": 3,
	"scale": ["C", "D", "E", "F", "G", "A", "B"],
	"chords": ["C", "Dm", "Em", "F", "G", "Am"],
	"basicChordNotes": [1, 5, 8, 10, 12, 15],
	"inversions": [1, 3, 5],
	"colorNotes": {
		"bright": [9, 13],
		"dark": [2, 7],
	},
};

function getNote(note) {
	return chordData.scale.indexOf(note.match(/[A-Z]+/g)[0]) + 1;
}
function getOctave(note) {
	return Number(note.match(/\d+/g)[0]);
}
function toNote(relative, octave) {
	return chordData.scale[relative - 1] + octave;
}

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
function getNoteInterval(note1, note2) {
	var relative1 = getNote(note1);
	var octave1 = getOctave(note1);

	var relative2 = getNote(note2);
	var octave2 = getOctave(note2);
}

function getBasicChord(chord) {
	chordNotes = [1, 5, 8, 10];
	return chordNotes.map(rel => getIntervalNote(chord + chordData.baseOctave, rel));
}

function getSimpleChord(chord, inversion, numBaseNotes, numBright, numDark, isSparse) {
	chordNotes = [chord + chordData.baseOctave];

	if (isSparse) {
		// slice to remove notes below inversion
		sliceStart = 1;
		if (inversion > 2) {
			sliceStart = 2;
		}

		shuffledBasicNotes = chordData.basicChordNotes.slice(sliceStart, chordData.basicChordNotes.length);

		chordNotes = shuffledBasicNotes.sort(() => 0.5 - Math.random()).slice(0, numBaseNotes);

		chordNotes = chordNotes.concat([chordData.inversions[inversion - 1]]);
	} else {
		chordNotes = chordData.basicChordNotes.slice(0, numBaseNotes);
	}

	shuffledBright = chordData.colorNotes.bright;
	shuffledDark = chordData.colorNotes.dark;

	chordNotes = chordNotes.concat(shuffledBright.sort(() => 0.5 - Math.random()).slice(0, numBright));
	chordNotes = chordNotes.concat(shuffledDark.sort(() => 0.5 - Math.random()).slice(0, numDark));

	chordNotes = chordNotes.sort((a, b) => a - b);
	return chordNotes.map(rel => getIntervalNote(chord + chordData.baseOctave, rel));
}

// console.log("Basic         : " + getBasicChord("C"));
// console.log("Simple, dense : " + getSimpleChord("C", 1, 4, 0, 0, false));
// console.log("Simple, sparse: " + getSimpleChord("C", 1, 4, 0, 0, true));
// console.log("Simple, color : " + getSimpleChord("C", 1, 2, 2, 1, false));




