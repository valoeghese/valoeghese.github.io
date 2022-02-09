// Code Style:
// CONST VARIABLES ARE IN SCREAMING_CAMEL_CASE
// global and local variables use this nice format likeThis

const URL_PARAMS = new URLSearchParams(window.location.search);
const DEBUG = URL_PARAMS.has("debug");

if (DEBUG) {
	console.log("Debug Enabled.");
}

class MatrixStack {
	constructor() {
		this.container = [];
		this.container[0] = new Float32Array(16);
		glMatrix.mat4.identity(this.container[0]);
	}

	isMinSize() {
		return this.container.length === 1;
	}

	push() {
		let cpy = new Float32Array(16);
		cpy.set(this.peek());
		this.container.push(cpy);
	}

	pop() {
		if (this.isMinSize()) {
			console.error("Stack is at minimum size of 1!");
			return;
		}

		this.container.pop();
	}

	peek() {
		return this.container[this.container.length - 1];
	}

	translate(x, y, z) {
		glMatrix.mat4.translate(this.peek(), x, y, z);
	}

	lookAt(pos, lookingAt, up) {
		glMatrix.mat4.lookAt(this.peek(), pos, lookingAt, up);
	}
	
	rotate(angle, about) {
		let cpy = new Float32Array(16);
		cpy.set(this.peek());
		glMatrix.mat4.rotate(this.peek(), cpy, angle, about);
	}
	
	clear() {
		this.container = [];
		this.container[0] = new Float32Array(16);
		glMatrix.mat4.identity(this.container[0]);
	}
}

var gl;
var program;

function setup() {
	console.log("Initialising Model Toy");

	var canvas = document.getElementById("model-toy");
	gl = canvas.getContext("webgl");
	
	if (!gl) {
		alert("Lmao your browser is outdated as F*CK are you on internet explorer or something? (Failed to create WebGL context)");
		return;
	}
	
	gl.clearColor(0.85, 0.9, 1.0, 1.0);
	
	setupShaders();
	setupModels();
	
	gl.useProgram(program);
	
	let projectionMatrix = new Float32Array(16);
	glMatrix.mat4.perspective(projectionMatrix, 1.58, canvas.width / canvas.height, 0.1, 1000);
	setUniformMat4("projection", projectionMatrix);
	
	let stack = new MatrixStack();
	stack.lookAt([0, 0, -5], [0, 0, 0], [0, 1, 0]);
	let angle = 0;
	
	function draw() {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		stack.push();
		stack.rotate(angle, [0, 1, 0]);
		setUniformMat4("view", stack.peek());
		stack.pop();
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		
		angle += 0.16;
	}

	setInterval(draw, 20);
}

function setupShaders() {
	let vertexShader = `
	precision mediump float;

	uniform mat4 projection;
	uniform mat4 view;

	attribute vec3 pos;

	void main() {
		gl_Position = projection * view * vec4(pos, 1.0);
	}
	`;

	let fragShader = `
	precision mediump float;

	void main() {
		gl_FragColor = vec4(1, 1, 0, 1);
	}
	`;

	let vsProg = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vsProg, vertexShader);
	gl.compileShader(vsProg);

	if (!gl.getShaderParameter(vsProg, gl.COMPILE_STATUS)) {
		console.error("Error with vertex shader compilation", gl.getShaderInfoLog(vsProg));
		return;
	}
	
	let fsProg = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fsProg, fragShader);
	gl.compileShader(fsProg);
	
	if (!gl.getShaderParameter(fsProg, gl.COMPILE_STATUS)) {
		console.error("Error with fragment shader compilation", gl.getShaderInfoLog(vsProg));
		return;
	}
	
	program = gl.createProgram();
	gl.attachShader(program, vsProg);
	gl.attachShader(program, fsProg);
	gl.linkProgram(program);
	
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error("Error linking shaders into a program", gl.getProgramInfoLog(program));
		return;
	}
	
	if (DEBUG) {
		gl.validateProgram(program);
		
		if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
			console.error("Shader program validation found an issue with the shader!", gl.getProgramInfoLog(program));
			return;
		}
	}
	
	// in program so can delete
	gl.deleteShader(vsProg);
	gl.deleteShader(fsProg);
}

function setupModels() {
	let triangleVertices =
		[0, 1, 0,
		-1, -1, 0,
		1, -1, 0];

	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
	
	let positionLoc = gl.getAttribLocation(program, "pos");
	gl.vertexAttribPointer(
		positionLoc,
		3,
		gl.FLOAT,
		gl.FALSE,
		3 * 4,
		0
	);
	
	gl.enableVertexAttribArray(positionLoc);
}

function setUniformMat4(location, mat) {
	let glLoc = gl.getUniformLocation(program, location);
	gl.uniformMatrix4fv(glLoc, gl.FALSE, mat);
}