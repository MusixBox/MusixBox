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