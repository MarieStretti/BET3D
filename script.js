/* Three.js */

/* Definition of our variables */ 
var camera, scene, renderer;
var geometry, material, plane;
var rotationSpeed = 0.01;


var texture = new THREE.TextureLoader().load("https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Turgot_map_of_Paris_-_Norman_B._Leventhal_Map_Center.jpg/1024px-Turgot_map_of_Paris_-_Norman_B._Leventhal_Map_Center.jpg");

/* */
init();
animate();

/**
 * 
 */
function init() {
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
	camera.position.z = 10;

	scene = new THREE.Scene();

	geometry = new THREE.PlaneGeometry(3, 3, 0);
	material = new THREE.MeshBasicMaterial({transparent:true, color: 0xFFFFFF, map: texture});

	plane = new THREE.Mesh(geometry, material);
	scene.add(plane);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

}

/**
 * 
 */
function animate() {
	requestAnimationFrame(animate);

	renderer.render(scene, camera);
}



/* Dat Gui */
var FizzyText = function () {
	this.message = 'dat.gui';
	// this.speed = 0.8;
	this.opacity = 50;
	this.displayOutline = false;
	this.explode = function () { console.log("explode") };

};

window.onload = function () {
	var text = new FizzyText();
	var gui = new dat.GUI();
	gui.add(text, 'message');
	// gui.add(text, 'speed', -5, 5)
	// 	.onChange((value) => {
	// 		rotationSpeed = value / 100;
	// 	});
	gui.add(text, 'opacity', 0, 100)
		.onChange((value) => {
			material.opacity = value / 100;
		});
	gui.add(text, 'displayOutline');
	gui.add(text, 'explode');
};
