// Code Style:
// CONST VARIABLES ARE IN SCREAMING_CAMEL_CASE
// global and local variables use this nice format likeThis
const URL_PARAMS = new URLSearchParams(window.location.search);
const DEBUG = URL_PARAMS.has("debug");

if (DEBUG) {
	console.log("Debug Enabled.");
}

function main() {
	console.log("Initialising Model Toy");

	var canvas = document.getElementById("model-toy");
	
	if (!engine.setCanvas(canvas)) {
		alert("Lmao your browser is outdated as F*CK are you on internet explorer or something? (Failed to create WebGL2 context)");
	}
	
	engine.setClearColour(0.85, 0.9, 1.0);
	
	let vertexShader = `#version 300 es
	precision mediump float;

	uniform mat4 projection;
	uniform mat4 view;

	in vec3 pos;
	in vec2 uv;
	
	out vec2 uvPass;

	void main() {
		gl_Position = projection * view * vec4(pos, 1.0);
		uvPass = uv;
	}
	`;

	let fragShader = `#version 300 es
	precision mediump float;

	in vec2 uvPass;

	out vec4 fragColour;

	void main() {
		fragColour = vec4(1, 1, uvPass.x, 1);
	}
	`;

	let program = new Shader(vertexShader, fragShader, DEBUG);
	program.format().vec3("pos").vec2("uv");

	let rectVertices = [
		1, 1, 0,	1, 1,
		1, -1, 0,	1, 0,
		-1, -1, 0,	0, 0,
		-1, 1, 0,	0, 1
	];
	
	let rectIndices = [
		0, 1, 2,
		0, 2, 3
	];
	
	let model = new Model(rectVertices, rectIndices);
	program.format().apply();

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
		
		model.bind();
		model.draw();
		
		angle += 0.08;
		requestAnimationFrame(draw);
	}

	requestAnimationFrame(draw);
}
