/* Three.js */

/* Global variables */
const HALF_WIDTH = 394.0;		// Half width of image
const HALF_HEIGHT = 256.5;	// Half height of image

const TRANS_MAT = [ 651222.0, 6861323.5 ]	// Coordinate of the image center : translation matrix

const SKY_EDGES_PATH = "edges/sky_edges.json";
const GROUND_EDGES_PATH = "edges/ground_edges.json";

/* Definition of our variables */
var camera, scene, renderer, controls;
var geometry, material, plane, polygons;
var rotationSpeed = 0.01;
let z_offset = 3;


/* Load Texture and GeoJSON */
var texture = new THREE.TextureLoader().load("./images/turgot_map_crop2.jpeg");
var sky_edges, ground_edges; 


let skyPromise = fetch(SKY_EDGES_PATH).then (result => result.json());
let groundPromise = fetch(GROUND_EDGES_PATH).then (result => result.json());
let promises = [skyPromise, groundPromise]

Promise.all(promises)
	.then(promises => {
		sky_edges = promises[0];
		ground_edges = promises[1];

		console.log(sky_edges);
		console.log(ground_edges);

		console.log(sky_edges.features.length == ground_edges.features.length);

		drawEdges();
		drawPolygons();
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



/**
 * Draw only the map in 2D
 */
function drawMap() {
	// create a simple square shape. We duplicate the top left and bottom right
	var geometry = new THREE.BufferGeometry();

	/* Initialisation of vertices and uv with bounding box */
	// Vertices because each vertex needs to appear once per triangle.
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
	// console.log(geometry);
	
	material = new THREE.MeshBasicMaterial({ transparent: true, color: 0xFFFFFF, map: texture });

	plane = new THREE.Mesh(geometry, material);
	scene.add(plane);
}

/**
 * Compute the coordinates for ground and sky (edges by edges)
 * @returns {[[[[float]]]]} [ ground_coord_3D, sky_coord_3D ]
 */
function computeCoordinates() {
	let ground_coord_3D = [];
	let sky_coord_3D = [];

	for (i=0; i< sky_edges.features.length; i++) {
		// Get Lambert coordinates
		let ground_edge_Lambert = ground_edges.features[i].geometry.coordinates[0];
		let sky_edge_Lambert = sky_edges.features[i].geometry.coordinates[0];
		
		// Calcul 2D coordinates
		let ground_edge_2D = [ 
			[ ground_edge_Lambert[0][0] - TRANS_MAT[0], ground_edge_Lambert[0][1] - TRANS_MAT[1], 0 ], // Z à 0
			[ ground_edge_Lambert[1][0] - TRANS_MAT[0], ground_edge_Lambert[1][1] - TRANS_MAT[1], 0 ]
		]
		let sky_edge_2D = [ 
			[ sky_edge_Lambert[0][0] - TRANS_MAT[0], sky_edge_Lambert[0][1] - TRANS_MAT[1], 0 ],
			[ sky_edge_Lambert[1][0] - TRANS_MAT[0], sky_edge_Lambert[1][1] - TRANS_MAT[1], 0 ]
		]


		// Compute distance: Z for the points couple (both extremities of edge)
		let z = [
			Math.sqrt( ( ground_edge_2D[0][0] - sky_edge_2D[0][0])**2 +  (ground_edge_2D[0][1] - sky_edge_2D[0][1])**2 ),
			Math.sqrt( ( ground_edge_2D[1][0] - sky_edge_2D[1][0])**2 +  (ground_edge_2D[1][1] - sky_edge_2D[1][1])**2 )
		]

		// Calculate 3D coordinate
		let ground_edge_3D = [ 
			[ ground_edge_2D[0][0], ground_edge_2D[0][1], z_offset ], // Z à 0
			[ ground_edge_2D[1][0], ground_edge_2D[1][1], z_offset ]
		]
		let sky_edge_3D = [ 
			[ ground_edge_2D[0][0], ground_edge_2D[0][1], z_offset + z[0] ],
			[ ground_edge_2D[1][0], ground_edge_2D[1][1], z_offset + z[1] ]
		]

		ground_coord_3D.push(ground_edge_3D);
		sky_coord_3D.push(sky_edge_3D);

	}

	return [ground_coord_3D, sky_coord_3D]
}


/**
 * Draw only the edges: ie sky and ground separately
 * @returns 2 geometries
 */
function drawEdges() {
	let [ground_coord_3D, sky_coord_3D] = computeCoordinates();

	for (i=0; i<ground_coord_3D.length; i++) {

		let ground_edge_3D = ground_coord_3D[i];
		let sky_edge_3D = sky_coord_3D[i];

		// Create geometries
		var geometryGround = new THREE.Geometry();
		geometryGround.vertices.push(
			new THREE.Vector3( ground_edge_3D[0][0], ground_edge_3D[0][1], ground_edge_3D[0][2] ),
			new THREE.Vector3( ground_edge_3D[1][0], ground_edge_3D[1][1], ground_edge_3D[1][2] )
		);
		var geometrySky = new THREE.Geometry();
		geometrySky.vertices.push(
			new THREE.Vector3( sky_edge_3D[0][0], sky_edge_3D[0][1], sky_edge_3D[0][2] ),
			new THREE.Vector3( sky_edge_3D[1][0], sky_edge_3D[1][1], sky_edge_3D[1][2] )
		);


		// Create Materials with color (with texture)
		var materialGround = new THREE.LineBasicMaterial({
			color: 0xff0000
		});
		var materialSky = new THREE.LineBasicMaterial({
			color: 0x0000ff
		});
		

		// Draw lines
		var lineSky = new THREE.Line( geometrySky, materialSky );
		var lineGround = new THREE.Line( geometryGround, materialGround );

		// Add to scene
		scene.add( lineSky ); 
		scene.add( lineGround ); 
	}

}


function drawPolygons() {
	// Get 3D coordinates
	let [ground_coord_3D, sky_coord_3D] = computeCoordinates();

	// create a simple square shape. We duplicate the top left and bottom right
	var polygonsGeometry = new THREE.BufferGeometry();

	// *2 => 1 edge = 6 points for 2 triangles
	// *3 => 1 point = 3 coordinates (X, Y, Z)
	let nb_vertices = (ground_coord_3D.length + sky_coord_3D.length) * 6 * 3
	/* Initialisation of vertices and uv */
	var vertices = new Float32Array( nb_vertices );
	var uv = new Float32Array( nb_vertices );

	/* Fill array */
	let i_vertices = 0;
	for (i=0; i<ground_coord_3D.length; i++) {
		let [ground1, ground2] = ground_coord_3D[i];
		let [sky1, sky2] = sky_coord_3D[i];

		vertices[i_vertices] = ground1[0]
		i_vertices++;
		vertices[i_vertices] = ground1[1]
		i_vertices++;
		vertices[i_vertices] = ground1[2]
		i_vertices++;
		vertices[i_vertices] = ground2[0]
		i_vertices++;
		vertices[i_vertices] = ground2[1]
		i_vertices++;
		vertices[i_vertices] = ground2[2]
		i_vertices++;
		vertices[i_vertices] = sky2[0]
		i_vertices++;
		vertices[i_vertices] = sky2[1]
		i_vertices++;
		vertices[i_vertices] = sky2[2]					//	  |			   /	  |
																			//	  |			 /		  |
		
		i_vertices++;
		vertices[i_vertices] = sky2[0]
		i_vertices++;
		vertices[i_vertices] = sky2[1]
		i_vertices++;
		vertices[i_vertices] = sky2[2]
		i_vertices++;
		vertices[i_vertices] = sky1[0]
		i_vertices++;
		vertices[i_vertices] = sky1[1]
		i_vertices++;
		vertices[i_vertices] = sky1[2]
		i_vertices++;
		vertices[i_vertices] = ground1[0]
		i_vertices++;
		vertices[i_vertices] = ground1[1]
		i_vertices++;
		vertices[i_vertices] = ground1[2]
		i_vertices++;			//	ground1 ----------- ground2

		//i_vertices += 6 * 3; // 6 points added with each 3 coords
	}
	
	console.log(vertices)

	// itemSize = 3 because there are 3 values (components) per vertex
	polygonsGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
	// geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
	// console.log(geometry);
	
	let polygonsMaterial = new THREE.MeshBasicMaterial({ transparent: true, color: 0xFFFFFF, side: THREE.DoubleSide}) //, map: texture });

	polygons = new THREE.Mesh(polygonsGeometry, polygonsMaterial);
	scene.add(polygons);

	console.log(polygons)
}


