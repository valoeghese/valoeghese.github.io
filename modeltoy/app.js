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
	uniform sampler2D textureSampler;

	void main() {
		fragColour = texture(textureSampler, vec2(uvPass.x, uvPass.y));
		if (fragColour.a < 0.1) discard;
	}
	`;

	let program = new Shader(vertexShader, fragShader, DEBUG);
	program.format().vec3("pos").vec2("uv");

	let rectVertices = [
		// back
		-1, -1, 1,	0, 0.5,
		1, -1, 1,	0.5, 0.5,
		1, 1, 1,	0.5, 0,
		-1, 1, 1,	0, 0,
		
		// front
		1, 1, -1,	0.5, 0,
		1, -1, -1,	0.5, 0.5,
		-1, -1, -1,	0, 0.5,
		-1, 1, -1,	0, 0,
		
		// right
		-1, 1, 1,	0.5, 0,
		-1, 1, -1,	0, 0,
		-1, -1, -1,	0, 0.5,
		-1, -1, 1,	0.5, 0.5,
		
		// left
		1, -1, -1,	0, 0.5,
		1, 1, -1,	0, 0,
		1, 1, 1,	0.5, 0,
		1, -1, 1,	0.5, 0.5,
		
		// top
		1, 1, 1,	1, 0,
		1, 1, -1,	1, 0.5,
		-1, 1, -1,	0.5, 0.5,
		-1, 1, 1,	0.5, 0,
		
		// bottom
		-1, -1, -1,	0, 1,
		1, -1, -1,	0.5, 1,
		1, -1, 1,	0.5, 0.5,
		-1, -1, 1,	0, 0.5
	];
	
	let rectIndices = [
		0, 1, 2,
		0, 2, 3,
		
		4, 5, 6,
		4, 6, 7,
		
		8, 9, 10,
		8, 10, 11,
		
		12, 13, 14,
		12, 14, 15,
		
		16, 17, 18,
		16, 18, 19,
		
		20, 21, 22,
		20, 22, 23
	];
	
	let model = new Model(rectVertices, rectIndices);
	program.format().apply();
	Model.unbind();

	program.bind();
	
	let projectionMatrix = new Float32Array(16);
	glMatrix.mat4.perspective(projectionMatrix, 1.58, canvas.width / canvas.height, 0.1, 1000);
	program.setUniformMat4("projection", projectionMatrix);
	
	let stack = new MatrixStack();
	stack.lookAt([0, 0, -5], [0, 0, 0], [0, 1, 0]);
	let angleY = 0.0;
	let angleX = 0.3;
	
	let texture = new Texture("example-image");
	let texture_top = new Texture("example-image2");

	function draw() {
		engine.gl.clear(engine.gl.COLOR_BUFFER_BIT | engine.gl.DEPTH_BUFFER_BIT);
		stack.push();
		stack.rotate(angleY, [0, 1, 0]);
		stack.rotate(angleX, [1, 0, 0]);
		program.setUniformMat4("view", stack.peek());
		stack.pop();

		model.bind();
		texture.bind();
		model.draw();
		
		angleY += 0.04;
		angleX += 0.01;
		requestAnimationFrame(draw);
	}

	requestAnimationFrame(draw);
}
