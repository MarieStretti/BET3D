/* Three.js */

/* Definition of our variables */ 
var camera, scene, renderer;
var geometry, material, cube;
var rotationSpeed = 0.01;

/* */
init();
animate();

/**
 * 
 */
function init() {
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
	camera.position.z = 1;

	scene = new THREE.Scene();

	geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
	material = new THREE.MeshNormalMaterial({transparent:true});

	cube = new THREE.Mesh(geometry, material);
	scene.add(cube);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

}

/**
 * 
 */
function animate() {
	requestAnimationFrame(animate);

	cube.rotation.x += rotationSpeed;
	cube.rotation.y += rotationSpeed;

	renderer.render(scene, camera);
}



/* Dat Gui */
var FizzyText = function () {
	this.message = 'dat.gui';
	this.speed = 0.8;
	this.opacity = 50;
	this.displayOutline = false;
	this.explode = function () { console.log("explode") };

};

window.onload = function () {
	var text = new FizzyText();
	var gui = new dat.GUI();
	gui.add(text, 'message');
	gui.add(text, 'speed', -5, 5)
		.onChange((value) => {
			rotationSpeed = value / 100;
		});
	gui.add(text, 'opacity', 0, 100)
		.onChange((value) => {
			material.opacity = value / 100;
		});
	gui.add(text, 'displayOutline');
	gui.add(text, 'explode');
};
