/* Three.js */

/* Global variables */
const HALF_WIDTH = 394.0;		// Half width of image
const HALF_HEIGHT = 256.5;	// Half height of image

const TRANS_MAT = [ 651222.0, 6861323.5 ]	// Coordinate of the image center : translation matrix

/* Definition of our variables */
var camera, scene, renderer;
var geometry, material, plane;
var rotationSpeed = 0.01;




var texture = new THREE.TextureLoader().load("./images/turgot_map_crop2.jpeg");

// "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Turgot_map_of_Paris_-_Norman_B._Leventhal_Map_Center.jpg/1024px-Turgot_map_of_Paris_-_Norman_B._Leventhal_Map_Center.jpg"

/* */
init();
animate();

/**
 * 
 */
function init() {
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
	camera.position.z = 800;

	scene = new THREE.Scene();

	// create a simple square shape. We duplicate the top left and bottom right
	var geometry = new THREE.BufferGeometry();
	// vertices because each vertex needs to appear once per triangle.
	var vertices = new Float32Array([
		-HALF_WIDTH, -HALF_HEIGHT, 0.0, //-1.0, -1.0, 0.0,	
		 HALF_WIDTH, -HALF_HEIGHT, 0.0, // 1.0, -1.0, 0.0,
		 HALF_WIDTH,  HALF_HEIGHT, 0.0, // 1.0,  1.0, 0.0,

		 HALF_WIDTH,  HALF_HEIGHT, 0.0, // 1.0,  1.0, 0.0,
		-HALF_WIDTH,  HALF_HEIGHT, 0.0, //-1.0,  1.0, 0.0,
		-HALF_WIDTH, -HALF_HEIGHT, 0.0 //-1.0, -1.0, 0.0
	]);
	var uv = new Float32Array([
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,

		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0
	]);

	// itemSize = 3 because there are 3 values (components) per vertex
	geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
	geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
	console.log(geometry);
	
	material = new THREE.MeshBasicMaterial({ transparent: true, color: 0xFFFFFF, map: texture });

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
	// this.opacity = 50;
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
	// gui.add(text, 'opacity', 0, 100)
	// 	.onChange((value) => {
	// 		material.opacity = value / 100;
	// 	});
	gui.add(text, 'displayOutline');
	gui.add(text, 'explode');
};
