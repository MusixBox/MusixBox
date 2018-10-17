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

// noise.seed(Math.random());
noise.seed(0);

var value = 0,
lastFrameTimeMs = 0,
maxFPS=60;

 
function update(delta, timestamp) { 
  value = (noise.perlin2(timestamp / 1000, 0) + 0.5) * 256;
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
  
  
  document.body.style.backgroundColor = "rgb(" + value + "," + value + "," + value + ")";
  requestAnimationFrame(mainLoop);
}

requestAnimationFrame(mainLoop);