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

var canvas = document.getElementsByTagName('canvas')[0];
canvas.width = 1024;
canvas.height = 768;
var ctx = canvas.getContext('2d');
var image = ctx.createImageData(canvas.width, canvas.height);
var data = image.data;
var start = Date.now();
for (var x = 0; x < canvas.width; x++) {
  if (x % 100 == 0) {
   noise.seed(Math.random());
  }
  for (var y = 0; y < canvas.height; y++) {
    var value = Math.abs(noise.perlin2(x / 100, y / 100));
    value *= 256;
    var cell = (x + y * canvas.width) * 4;
    data[cell] = data[cell + 1] = data[cell + 2] = value;
    data[cell] += Math.max(0, (25 - value) * 8);
    data[cell + 3] = 255; // alpha.
  }
}
/* // Benchmark code.
start = Date.now();
for (var x = 0; x < 10000; x++) {
  for (var y = 0; y < 10000; y++) {
    noise.simplex2(x / 50, y/50);
  }
}*/
var end = Date.now();
ctx.fillColor = 'black';
ctx.fillRect(0, 0, 100, 100);
ctx.putImageData(image, 0, 0);
ctx.font = '16px sans-serif'
ctx.textAlign = 'center';
ctx.fillText('Rendered in ' + (end - start) + ' ms', canvas.width / 2, canvas.height - 20);
if(console) {
  console.log('Rendered in ' + (end - start) + ' ms');
}


