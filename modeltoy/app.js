// Code Style:
// CONST VARIABLES ARE IN SCREAMING_CAMEL_CASE
// global and local variables use this nice format likeThis
const URL_PARAMS = new URLSearchParams(window.location.search);
const DEBUG = URL_PARAMS.has("debug");

if (DEBUG) {
	console.log("Debug Enabled.");
}

function setup() {
	console.log("Initialising Model Toy");

	var canvas = document.getElementById("model-toy");
	
	if (!engine.setCanvas(canvas)) {
		alert("Lmao your browser is outdated as F*CK are you on internet explorer or something? (Failed to create WebGL context)");
	}
	
	engine.setClearColour(0.85, 0.9, 1.0);
	
	let vertexShader = `
	precision mediump float;

	uniform mat4 projection;
	uniform mat4 view;

	attribute vec3 pos;
	attribute vec2 uv;
	
	varying vec2 uvOut;

	void main() {
		gl_Position = projection * view * vec4(pos, 1.0);
		uvOut = uv;
	}
	`;

	let fragShader = `
	precision mediump float;

	varying vec2 uvOut;

	void main() {
		gl_FragColor = vec4(1, 1, uvOut.x, 1);
	}
	`;

	let program = new Shader(vertexShader, fragShader, DEBUG);

	setupModels(program);
	
	program.bind();
	
	let projectionMatrix = new Float32Array(16);
	glMatrix.mat4.perspective(projectionMatrix, 1.58, canvas.width / canvas.height, 0.1, 1000);
	program.setUniformMat4("projection", projectionMatrix);
	
	let stack = new MatrixStack();
	stack.lookAt([0, 0, -5], [0, 0, 0], [0, 1, 0]);
	let angle = 0;
	
	function draw() {
		engine.gl.clear(engine.gl.COLOR_BUFFER_BIT | engine.gl.DEPTH_BUFFER_BIT);
		stack.push();
		stack.rotate(angle, [0, 1, 0]);
		program.setUniformMat4("view", stack.peek());
		stack.pop();
		engine.gl.drawArrays(engine.gl.TRIANGLES, 0, 3);
		
		angle += 0.16;
	}

	setInterval(draw, 20);
}

function setupModels(program) {
	let triangleVertices = [
		0, 1, 0,	0, 0,
		-1, -1, 0,	0, 0,
		1, -1, 0,	0, 0
	];

	var vbo = engine.gl.createBuffer();
	engine.gl.bindBuffer(engine.gl.ARRAY_BUFFER, vbo);
	engine.gl.bufferData(engine.gl.ARRAY_BUFFER, new Float32Array(triangleVertices), engine.gl.STATIC_DRAW);

	program.formatBuilder().vec3("pos").vec2("uv").build();
}
