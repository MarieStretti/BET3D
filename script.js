/* Global variables */
const HALF_WIDTH = 394.0;		// Half width of image
const HALF_HEIGHT = 256.5;	// Half height of image

const TRANS_MAT = [651222.0, 6861323.5]	// Coordinate of the image center : translation matrix

const SKY_EDGES_PATH = "edges/sky_edges.json";
const GROUND_EDGES_PATH = "edges/ground_edges.json";



/* Definition of our variables */
let camera, scene, renderer, controls;
let map, buildings, blackHoles, linesGround, linesSky;
let z_offset_bh = 0; 	// (meters) to elevate the building buildings
let mode3D = true; 		// variable to define the default mode 2D or 3D
let edgesVisible = false; 	// variable to define the default visibility of the edges


/* Load Texture Map*/
let texture = new THREE.TextureLoader().load("./images/turgot_map_crop2.jpeg");

/* Load GeoJSON */
let sky_edges, ground_edges;
let skyPromise = fetch(SKY_EDGES_PATH).then(result => result.json());
let groundPromise = fetch(GROUND_EDGES_PATH).then(result => result.json());
let promises = [skyPromise, groundPromise]

/**
 * Promise for reception of the GeoJSON
 */
Promise.all(promises)
	.then(promises => {
		sky_edges = promises[0];
		ground_edges = promises[1];

		createEdges();
		createPolygons();
		createBlackHoles();
	})


/* Running */
init();
animate();


/* --- THREEJS AND GUI FUNCTIONS */

/**
 * Initialisation of Scene, Camera, Renderer, Controls and Map
 */
function init() {
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10000);
	camera.position.z = 700;
	camera.up.set(0, 0, 1);

	console.log("initialisation", camera)

	scene = new THREE.Scene();

	createMap();

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	// Define orbitControls and their initial state
	controls = new THREE.OrbitControls(camera, renderer.domElement);

	controls.saveState()
}

/**
 * Method for animation at each reaload of frame
 */
function animate() {
	requestAnimationFrame(animate);

	controls.update();

	renderer.render(scene, camera);
}


/* Dat Gui */
let FizzyText = function () {
	// Button to modify view : view from the zenith
	this.zenithView = function () {
		// Reset camera position
		camera.position.x = 0.;
		camera.position.y = 0.;
		camera.position.z = 700.;
		camera.updateProjectionMatrix();

		// Reset orbitControls state to the initial state
		controls.reset();
	}
	// Button to modify view : view in Turgot perspective
	this.turgotView = function () {
		// Modify camera position
		camera.position.x = -490.
		camera.position.y = 455.
		camera.position.z = 340.
		camera.updateProjectionMatrix();
	}

	// Button to switch from a 3D view with the buildings and a 2D view with only the map
	this.mode3D = mode3D;

	// Button to display the edges
	this.showEdges = edgesVisible;
};


window.onload = function () {
	let text = new FizzyText();
	let gui = new dat.GUI();

	gui.add(text, 'zenithView');
	gui.add(text, 'turgotView');
	gui.add(text, 'mode3D')
		.onChange((value) => {
			mode3D = value;
			buildings.visible = mode3D;
			blackHoles.visible = mode3D;
		});
	gui.add(text, 'showEdges')
		.onChange((value) => {
			edgesVisible = value;
			linesGround.visible = edgesVisible;
			linesSky.visible = edgesVisible;
		});
};



/* --- FUNCTIONS --------------------------------------------------- */
/**
 * Compute the 2D coordinates for ground and sky (edges by edges)
 * @returns {[[[[float]]]]} [ ground_coord_2D, sky_coord_2D ]
 */
function computeCoordinates2D() {
	let ground_coord_2D = [];
	let sky_coord_2D = [];

	for (let i = 0; i < sky_edges.features.length; i++) {
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

	for (let i = 0; i < ground_coord_2D.length; i++) {

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
 * Create only the map in 2D
 */
function createMap() {
	// create a simple square shape. We duplicate the top left and bottom right
	let mapGeometry = new THREE.BufferGeometry();

	/* Initialisation of vertices and uv with bounding box */
	let vertices = new Float32Array([
		-HALF_WIDTH, -HALF_HEIGHT, 0.0, //-1.0, -1.0, 0.0,	
		HALF_WIDTH, -HALF_HEIGHT, 0.0, // 1.0, -1.0, 0.0,
		HALF_WIDTH, HALF_HEIGHT, 0.0, // 1.0,  1.0, 0.0,

		HALF_WIDTH, HALF_HEIGHT, 0.0, // 1.0,  1.0, 0.0,
		-HALF_WIDTH, HALF_HEIGHT, 0.0, //-1.0,  1.0, 0.0,
		-HALF_WIDTH, -HALF_HEIGHT, 0.0 //-1.0, -1.0, 0.0
	]);

	let uv = new Float32Array([
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,

		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0
	]);

	mapGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
	mapGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));


	let mapMaterial = new THREE.MeshBasicMaterial({ transparent: true, color: 0xFFFFFF, map: texture, depthWrite: false });

	map = new THREE.Mesh(mapGeometry, mapMaterial);

	scene.add(map);
}


/**
 * Create only the edges: ie sky and ground separately (by default in 3D)
 * @param {boolean} in3D 
 * @returns 2 geometries
 */
function createEdges(in3D = true) {
	let ground_coord = [];
	let sky_coord = [];

	if (in3D) {
		[ground_coord, sky_coord] = computeCoordinates3D();
	} else {
		[ground_coord, sky_coord] = computeCoordinates2D();
	}

	linesGround = new THREE.Group();
	linesSky = new THREE.Group();

	for (let i = 0; i < ground_coord.length; i++) {

		let ground_edge = ground_coord[i];
		let sky_edge = sky_coord[i];

		// Create geometries
		const points = [];
		points.push(
			new THREE.Vector3(ground_edge[0][0], ground_edge[0][1], ground_edge[0][2]),
			new THREE.Vector3(ground_edge[1][0], ground_edge[1][1], ground_edge[1][2])
		);
		let geometryGround = new THREE.BufferGeometry().setFromPoints(points);
		
		const points2 = []
		points2.push(
			new THREE.Vector3(sky_edge[0][0], sky_edge[0][1], sky_edge[0][2]),
			new THREE.Vector3(sky_edge[1][0], sky_edge[1][1], sky_edge[1][2])
		);
		let geometrySky = new THREE.BufferGeometry().setFromPoints(points2);


		// Create Materials with color (with texture)
		let materialGround = new THREE.LineBasicMaterial({
			color: 0xff0000
		});
		let materialSky = new THREE.LineBasicMaterial({
			color: 0x0000ff
		});


		// Draw lines
		let lineGround = new THREE.Line(geometryGround, materialGround);
		let lineSky = new THREE.Line(geometrySky, materialSky);

		linesGround.add(lineGround);
		linesSky.add(lineSky);
	}

	// Add to scene
	scene.add(linesGround);
	scene.add(linesSky);

	linesGround.visible = edgesVisible;
	linesSky.visible = edgesVisible;
}

/**
 * Create buildings by creating a geometry for the frontage : frontside with texture and backside in black
 * @return 1 group geometry of buildings
 */
function createPolygons() {
	// Get 3D coordinates
	let [ground_coord_3D, sky_coord_3D] = computeCoordinates3D();
	// Get 2D coordinates for texture calcul
	let [ground_coord_2D, sky_coord_2D] = computeCoordinates2D();

	// create a simple square shape. We duplicate the top left and bottom right
	let buildingsGeometry = new THREE.BufferGeometry();

	let vertices = fillVertices(ground_coord_3D, sky_coord_3D);
	let uv = fillUV(ground_coord_2D, sky_coord_2D);


	buildingsGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
	buildingsGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

	let buildingsTextureMaterial = new THREE.MeshBasicMaterial({ transparent: false, color: 0xFFFFFF, map: texture, side: THREE.FrontSide });
	let buildingsColorMaterial = new THREE.MeshBasicMaterial({ transparent: false, color: 0x0, side: THREE.BackSide });


	buildings = new THREE.Group();
	buildings.add(new THREE.Mesh(buildingsGeometry, buildingsTextureMaterial));
	buildings.add(new THREE.Mesh(buildingsGeometry, buildingsColorMaterial));

	scene.add(buildings);

	buildings.visible = mode3D;
}


/**
 * Create black polygons representing holes in the map
 * @return 1 geometry
 */
function createBlackHoles() {
	// Get 2D coordinates
	let [ground_coord_2D, sky_coord_2D] = computeCoordinates2D();

	// create a simple square shape. We duplicate the top left and bottom right
	let blackHolesGeometry = new THREE.BufferGeometry();

	let vertices = fillVertices(ground_coord_2D, sky_coord_2D);


	// itemSize = 3 because there are 3 values (components) per vertex
	blackHolesGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

	let blackHolesMaterial = new THREE.MeshBasicMaterial({ transparent: true, color: 0x0, side: THREE.DoubleSide, depthWrite: false });

	blackHoles = new THREE.Mesh(blackHolesGeometry, blackHolesMaterial);

	scene.add(blackHoles);

	blackHoles.visible = mode3D;
}




/* --- OTHER FUNCTIONS -------------------------------------------------------- */

/**
 * Create the vertices array
 * @return {Float32Array} vertices
 */
function fillVertices(ground_coord, sky_coord) {

	// *2 => 1 edge = 6 points for 2 triangles
	// *3 => 1 point = 3 coordinates (X, Y, Z)
	let nb_vertices = (ground_coord.length + sky_coord.length) * 6 * 3
	/* Initialisation of vertices and uv */
	let vertices = new Float32Array(nb_vertices);

	/* Fill array */
	let i_vertices = 0;
	for (let i = 0; i < ground_coord.length; i++) {
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
	let uv = new Float32Array(nb_uv);

	/* Fill array */
	let i_uv = 0;
	for (let i = 0; i < ground_coord.length; i++) {
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