/* Three.js */

/* Global variables */
const HALF_WIDTH = 394.0;		// Half width of image
const HALF_HEIGHT = 256.5;	// Half height of image

const TRANS_MAT = [651222.0, 6861323.5]	// Coordinate of the image center : translation matrix

const SKY_EDGES_PATH = "edges/sky_edges.json";
const GROUND_EDGES_PATH = "edges/ground_edges.json";



/* Definition of our variables */
var camera, scene, renderer, controls;
var map, polygons, blackHoles;
var rotationSpeed = 0.01;
let z_offset = 0; // meters
let z_offset_bh = 0;


/* Load Texture Map*/
var texture = new THREE.TextureLoader().load("./images/turgot_map_crop2.jpeg");

/* Load GeoJSON */
var sky_edges, ground_edges;
let skyPromise = fetch(SKY_EDGES_PATH).then(result => result.json());
let groundPromise = fetch(GROUND_EDGES_PATH).then(result => result.json());
let promises = [skyPromise, groundPromise]

Promise.all(promises)
	.then(promises => {
		sky_edges = promises[0];
		ground_edges = promises[1];

		drawEdges();
		drawPolygons();
		drawBlackHoles();
	})


/* Running */
init();
animate();


/* FUNCTIONS */

function init() {
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
	camera.position.z = 700;

	scene = new THREE.Scene();

	drawMap();

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	controls = new THREE.OrbitControls(camera, renderer.domElement);
}

/**
 * 
 */
function animate() {
	requestAnimationFrame(animate);

	controls.update();

	renderer.render(scene, camera);
}



/* Dat Gui */
var FizzyText = function () {
	this.resetView = function () {
		console.log(camera)
		camera.position.x = 0.;
		camera.position.y = 0.;
		camera.position.z = 700.;
		camera.updateProjectionMatrix();
	}
	
	// this.message = 'dat.gui';
	// this.speed = 0.8;
	// this.opacity = 50;
	// this.displayOutline = false;

};

window.onload = function () {
	var text = new FizzyText();
	var gui = new dat.GUI();
	gui.add(text, 'resetView');
	// gui.add(text, 'message');
	// gui.add(text, 'speed', -5, 5)
	// 	.onChange((value) => {
	// 		rotationSpeed = value / 100;
	// 	});
	// gui.add(text, 'opacity', 0, 100)
	// 	.onChange((value) => {
	// 		material.opacity = value / 100;
	// 	});
	// gui.add(text, 'displayOutline');
};



/**
 * Draw only the map in 2D
 */
function drawMap() {
	// create a simple square shape. We duplicate the top left and bottom right
	var mapGeometry = new THREE.BufferGeometry();

	/* Initialisation of vertices and uv with bounding box */
	// Vertices because each vertex needs to appear once per triangle.
	var vertices = new Float32Array([
		-HALF_WIDTH, -HALF_HEIGHT, 0.0, //-1.0, -1.0, 0.0,	
		HALF_WIDTH, -HALF_HEIGHT, 0.0, // 1.0, -1.0, 0.0,
		HALF_WIDTH, HALF_HEIGHT, 0.0, // 1.0,  1.0, 0.0,

		HALF_WIDTH, HALF_HEIGHT, 0.0, // 1.0,  1.0, 0.0,
		-HALF_WIDTH, HALF_HEIGHT, 0.0, //-1.0,  1.0, 0.0,
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
	mapGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
	mapGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

	let mapMaterial = new THREE.MeshBasicMaterial({ transparent: true, color: 0xFFFFFF, map: texture, depthWrite: false });

	map = new THREE.Mesh(mapGeometry, mapMaterial);

	scene.add(map);
}


/**
 * Compute the 2D coordinates for ground and sky (edges by edges)
 * @returns {[[[[float]]]]} [ ground_coord_2D, sky_coord_2D ]
 */
function computeCoordinates2D() {
	let ground_coord_2D = [];
	let sky_coord_2D = [];

	for (i = 0; i < sky_edges.features.length; i++) {
		// Get Lambert coordinates
		let ground_edge_Lambert = ground_edges.features[i].geometry.coordinates[0];
		let sky_edge_Lambert = sky_edges.features[i].geometry.coordinates[0];

		// Calcul 2D coordinates
		let ground_edge_2D = [
			[ground_edge_Lambert[0][0] - TRANS_MAT[0], ground_edge_Lambert[0][1] - TRANS_MAT[1], z_offset_bh], // Z à 0
			[ground_edge_Lambert[1][0] - TRANS_MAT[0], ground_edge_Lambert[1][1] - TRANS_MAT[1], z_offset_bh]
		]
		let sky_edge_2D = [
			[sky_edge_Lambert[0][0] - TRANS_MAT[0], sky_edge_Lambert[0][1] - TRANS_MAT[1], z_offset_bh],
			[sky_edge_Lambert[1][0] - TRANS_MAT[0], sky_edge_Lambert[1][1] - TRANS_MAT[1], z_offset_bh]
		]

		ground_coord_2D.push(ground_edge_2D);
		sky_coord_2D.push(sky_edge_2D);

	}

	return [ground_coord_2D, sky_coord_2D]
}


/**
 * Compute the 3D coordinates for ground and sky (edges by edges)
 * @returns {[[[[float]]]]} [ ground_coord_3D, sky_coord_3D ]
 */
function computeCoordinates3D() {
	let [ground_coord_2D, sky_coord_2D] = computeCoordinates2D();

	let ground_coord_3D = [];
	let sky_coord_3D = [];

	for (i = 0; i < ground_coord_2D.length; i++) {

		// Calcul 2D coordinates
		let ground_edge_2D = ground_coord_2D[i];
		let sky_edge_2D = sky_coord_2D[i];

		// Compute distance: Z for the points couple (both extremities of edge)
		let z = [
			Math.sqrt((ground_edge_2D[0][0] - sky_edge_2D[0][0]) ** 2 + (ground_edge_2D[0][1] - sky_edge_2D[0][1]) ** 2),
			Math.sqrt((ground_edge_2D[1][0] - sky_edge_2D[1][0]) ** 2 + (ground_edge_2D[1][1] - sky_edge_2D[1][1]) ** 2)
		]

		// Calculate 3D coordinate
		let ground_edge_3D = [
			[ground_edge_2D[0][0], ground_edge_2D[0][1], ground_edge_2D[0][2]], // Z à 0
			[ground_edge_2D[1][0], ground_edge_2D[1][1], ground_edge_2D[1][2]]
		]
		let sky_edge_3D = [
			[ground_edge_2D[0][0], ground_edge_2D[0][1], sky_edge_2D[0][2] + z[0]],
			[ground_edge_2D[1][0], ground_edge_2D[1][1], sky_edge_2D[1][2] + z[1]]
		]

		ground_coord_3D.push(ground_edge_3D);
		sky_coord_3D.push(sky_edge_3D);

	}

	return [ground_coord_3D, sky_coord_3D]
}


/**
 * Draw only the edges: ie sky and ground separately (by default in 3D)
 * @param {boolean} in3D 
 * @returns 2 geometries
 */
function drawEdges(in3D = true) {
	let ground_coord = [];
	let sky_coord = [];

	if (in3D) {
		[ground_coord, sky_coord] = computeCoordinates3D();
	} else {
		[ground_coord, sky_coord] = computeCoordinates2D();
	}

	for (i = 0; i < ground_coord.length; i++) {

		let ground_edge = ground_coord[i];
		let sky_edge = sky_coord[i];

		// Create geometries
		var geometryGround = new THREE.Geometry();
		geometryGround.vertices.push(
			new THREE.Vector3(ground_edge[0][0], ground_edge[0][1], ground_edge[0][2]),
			new THREE.Vector3(ground_edge[1][0], ground_edge[1][1], ground_edge[1][2])
		);
		var geometrySky = new THREE.Geometry();
		geometrySky.vertices.push(
			new THREE.Vector3(sky_edge[0][0], sky_edge[0][1], sky_edge[0][2]),
			new THREE.Vector3(sky_edge[1][0], sky_edge[1][1], sky_edge[1][2])
		);


		// Create Materials with color (with texture)
		var materialGround = new THREE.LineBasicMaterial({
			color: 0xff0000
		});
		var materialSky = new THREE.LineBasicMaterial({
			color: 0x0000ff
		});


		// Draw lines
		var lineSky = new THREE.Line(geometrySky, materialSky);
		var lineGround = new THREE.Line(geometryGround, materialGround);

		// Add to scene
		scene.add(lineSky);
		scene.add(lineGround);
	}

}

/**
 * Draw polygons
 * @return 1 geometry of polygons
 */
function drawPolygons() {
	// Get 3D coordinates
	let [ground_coord_3D, sky_coord_3D] = computeCoordinates3D();
	// Get 2D coordinates
	let [ground_coord_2D, sky_coord_2D] = computeCoordinates2D();

	// create a simple square shape. We duplicate the top left and bottom right
	var polygonsGeometry = new THREE.BufferGeometry();

	let vertices = fillVertices(ground_coord_3D, sky_coord_3D);
	let uv = fillUV(ground_coord_2D, sky_coord_2D);

	console.log(vertices)

	// itemSize = 3 because there are 3 values (components) per vertex
	polygonsGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
	polygonsGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

	let polygonsTextureMaterial = new THREE.MeshBasicMaterial({ transparent: false, color: 0xFFFFFF, map: texture, side: THREE.FrontSide }); //, side: THREE.DoubleSide}) //, map: texture });
	let polygonsColorMaterial = new THREE.MeshBasicMaterial({ transparent: false, color: 0x0, side: THREE.BackSide }); //, side: THREE.DoubleSide}) //, map: texture });


	polygons = new THREE.Group();
	polygons.add(new THREE.Mesh(polygonsGeometry, polygonsTextureMaterial));
	polygons.add(new THREE.Mesh(polygonsGeometry, polygonsColorMaterial));
	scene.add(polygons);

	console.log(polygons)
}


/**
 * Draw black polygons representing holes in the map
 * @return 1 geometry
 */
function drawBlackHoles() {
	// Get 2D coordinates
	let [ground_coord_2D, sky_coord_2D] = computeCoordinates2D();

	// create a simple square shape. We duplicate the top left and bottom right
	var blackHolesGeometry = new THREE.BufferGeometry();

	let vertices = fillVertices(ground_coord_2D, sky_coord_2D);


	// itemSize = 3 because there are 3 values (components) per vertex
	blackHolesGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

	let blackHolesMaterial = new THREE.MeshBasicMaterial({ transparent: true, color: 0x0, side: THREE.DoubleSide, depthWrite: false });

	blackHoles = new THREE.Mesh(blackHolesGeometry, blackHolesMaterial);
	scene.add(blackHoles);
}



/**
 * Create the vertices array
 * @return {Float32Array} vertices
 */
function fillVertices(ground_coord, sky_coord) {

	// *2 => 1 edge = 6 points for 2 triangles
	// *3 => 1 point = 3 coordinates (X, Y, Z)
	let nb_vertices = (ground_coord.length + sky_coord.length) * 6 * 3
	/* Initialisation of vertices and uv */
	var vertices = new Float32Array(nb_vertices);

	/* Fill array */
	let i_vertices = 0;
	for (i = 0; i < ground_coord.length; i++) {
		let [ground1, ground2] = ground_coord[i];
		let [sky1, sky2] = sky_coord[i];

		vertices.set(ground1, i_vertices);
		i_vertices += 3;
		vertices.set(ground2, i_vertices);
		i_vertices += 3;
		vertices.set(sky2, i_vertices);
		i_vertices += 3;

		vertices.set(sky2, i_vertices);
		i_vertices += 3;
		vertices.set(sky1, i_vertices);
		i_vertices += 3;
		vertices.set(ground1, i_vertices);
		i_vertices += 3;
	}

	return vertices;
}



/**
 * Create the uv array
 * @return {Float32Array} uv
 */
function fillUV(ground_coord, sky_coord) {

	// *2 => 1 edge = 6 points for 2 triangles
	// *3 => 1 point = 2 uv coordinates (2D)
	let nb_uv = (ground_coord.length + sky_coord.length) * 6 * 2
	/* Initialisation of vertices and uv */
	var uv = new Float32Array(nb_uv);

	/* Fill array */
	let i_uv = 0;
	for (i = 0; i < ground_coord.length; i++) {
		let [ground1, ground2] = ground_coord[i];
		let [sky1, sky2] = sky_coord[i];

		uv.set([
			(ground1[0] + HALF_WIDTH) / (2 * HALF_WIDTH), 	// u
			(ground1[1] + HALF_HEIGHT) / (2 * HALF_HEIGHT)	// v
		], i_uv);
		i_uv += 2;
		uv.set([
			(ground2[0] + HALF_WIDTH) / (2 * HALF_WIDTH), 	// u
			(ground2[1] + HALF_HEIGHT) / (2 * HALF_HEIGHT)	// v
		], i_uv);
		i_uv += 2;
		uv.set([
			(sky2[0] + HALF_WIDTH) / (2 * HALF_WIDTH), 	// u
			(sky2[1] + HALF_HEIGHT) / (2 * HALF_HEIGHT)	// v
		], i_uv);
		i_uv += 2;

		uv.set([
			(sky2[0] + HALF_WIDTH) / (2 * HALF_WIDTH), 	// u
			(sky2[1] + HALF_HEIGHT) / (2 * HALF_HEIGHT)	// v
		], i_uv);
		i_uv += 2;
		uv.set([
			(sky1[0] + HALF_WIDTH) / (2 * HALF_WIDTH), 	// u
			(sky1[1] + HALF_HEIGHT) / (2 * HALF_HEIGHT)	// v
		], i_uv);
		i_uv += 2;
		uv.set([
			(ground1[0] + HALF_WIDTH) / (2 * HALF_WIDTH), 	// u
			(ground1[1] + HALF_HEIGHT) / (2 * HALF_HEIGHT)	// v
		], i_uv);
		i_uv += 2;

	}

	return uv;
}