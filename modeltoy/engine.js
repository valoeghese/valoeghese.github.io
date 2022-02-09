///////////////////////////////////////////////////////
//      3D GL ENGINE in JS/WebGL by Valoeghese       //
// BASED OFF OF SCALPEL | PROVIDED UNDER MIT LICENSE //
///////////////////////////////////////////////////////

const engine = {
	gl: null,
	setCanvas: function (canvas) {
		console.log("Initialising Engine.");
		this.gl = canvas.getContext("webgl2");

		if (this.gl) {
			this.gl.enable(this.gl.DEPTH_TEST); // enable depth buffer
			this.gl.enable(this.gl.CULL_FACE); // enable back face culling
		}
		return this.gl;
	},
	setClearColour: function(r, g, b) {
		this.gl.clearColor(r, g, b, 1.0);
	}
};

class Texture {
	#tex;

	constructor(image, repeat=false, smooth=false) {
		let gl = engine.gl;
		this.#tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.#tex);
		
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, smooth ? gl.LINEAR : gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, smooth ? gl.LINEAR : gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	
	bind(index=0) {
		engine.gl.bindTexture(engine.gl.TEXTURE_2D, this.#tex);
		engine.gl.activeTexture(engine.gl.TEXTURE0 + index);
	}
}

class MatrixStack {
	#stack;

	constructor() {
		this.#stack = [];
		this.#stack[0] = new Float32Array(16);
		glMatrix.mat4.identity(this.#stack[0]);
	}

	push() {
		let cpy = new Float32Array(16);
		cpy.set(this.peek());
		this.#stack.push(cpy);
	}

	pop() {
		if (this.#stack.length === 1) {
			throw "Stack is at minimum size of 1!";
		}

		this.#stack.pop();
	}

	peek() {
		return this.#stack[this.#stack.length - 1];
	}

	translate(x, y, z) {
		glMatrix.mat4.translate(this.peek(), this.peek(), [x, y, z]);
	}
	
	translate(by) {
		glMatrix.mat4.translate(this.peek(), this.peek(), by);
	}

	lookAt(pos, lookingAt, up) {
		glMatrix.mat4.lookAt(this.peek(), pos, lookingAt, up);
	}

	rotate(angle, about) {
		glMatrix.mat4.rotate(this.peek(), this.peek(), angle, about);
	}

	clear() {
		this.#stack = [];
		this.#stack[0] = new Float32Array(16);
		glMatrix.mat4.identity(this.#stack[0]);
	}
}

class ShaderException {
	constructor(error, log) {
		this.error = error;
		this.log = log;
	}

	error;
	log;
}

class VertexFormat {
	#format = [];
	#size = 0;
	#program;

	constructor(program) {
		this.#program = program;
	}

	float(name) {
		this.#format.push([name, 1, engine.gl.FLOAT, this.#size]);
		this.#size += 1 * 4;
		return this;
	}

	vec2(name) {
		this.#format.push([name, 2, engine.gl.FLOAT, this.#size]);
		this.#size += 2 * 4;
		return this;
	}

	vec3(name) {
		this.#format.push([name, 3, engine.gl.FLOAT, this.#size]);
		this.#size += 3 * 4;
		return this;
	}

	apply() {
		for (let i = 0; i < this.#format.length; ++i) {
			let item = this.#format[i];
			//console.log(item);
			let loc = engine.gl.getAttribLocation(this.#program, item[0]);

			engine.gl.vertexAttribPointer(
				loc,
				item[1],
				item[2],
				engine.gl.FALSE,
				this.#size,
				item[3]
			);

			engine.gl.enableVertexAttribArray(loc);
		}
	}
}

class Model {
	#vbo;
	#ibo;
	#vao;
	#length;
	
	constructor(vertexArray, indexArray, storage=engine.gl.STATIC_DRAW) {
		let gl = engine.gl;

		// create vertex array object
		this.#vao = gl.createVertexArray();
		gl.bindVertexArray(this.#vao);

		// create vertex buffer object
		this.#vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), storage);

		// create index buffer object
		this.#ibo = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), storage);
		
		this.#length = indexArray.length;
	}
	
	bind() {
		engine.gl.bindVertexArray(this.#vao);
	}
	
	draw() {
		engine.gl.drawElements(engine.gl.TRIANGLES, this.#length, engine.gl.UNSIGNED_SHORT, 0);
	}
	
	destroy() {
		engine.gl.deleteVertexArrays(this.#vao);
		engine.gl.deleteBuffers(this.#ibo);
		engine.gl.deleteBuffers(this.#vbo);
	}
	
	static unbind() {
		engine.gl.bindVertexArray(null);
	}
}

class Shader {
	#program;
	#format;
	
	constructor(vertexShader, fragShader, validate=false) {
		// this is some pretty standard gl stuff, so I haven't commented it. It should be self-explanatory, I hope.
		// For those not as experienced with gl, we're basically just compiling the vertex and fragment shaders, and linking them together into a gl program, + a ton of error checks.

		let gl = engine.gl;

		let vsProg = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vsProg, vertexShader);
		gl.compileShader(vsProg);

		if (!gl.getShaderParameter(vsProg, gl.COMPILE_STATUS)) {
			throw new ShaderException("Error with vertex shader compilation", gl.getShaderInfoLog(vsProg));
		}
		
		let fsProg = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fsProg, fragShader);
		gl.compileShader(fsProg);
		
		if (!gl.getShaderParameter(fsProg, gl.COMPILE_STATUS)) {
			throw new ShaderException("Error with fragment shader compilation", gl.getShaderInfoLog(fsProg));
		}
		
		this.#program = gl.createProgram();

		gl.attachShader(this.#program, vsProg);
		gl.attachShader(this.#program, fsProg);
		gl.linkProgram(this.#program);
		
		if (!gl.getProgramParameter(this.#program, gl.LINK_STATUS)) {
			throw new ShaderException("Error linking shaders into a program", gl.getProgramInfoLog(this.#program));
		}
		
		if (validate) {
			gl.validateProgram(this.#program);
			
			if (!gl.getProgramParameter(this.#program, gl.VALIDATE_STATUS)) {
				throw new ShaderException("Shader program validation found an issue with the shader!", gl.getProgramInfoLog(this.#program));
			}
		}

		// in program so can delete now
		gl.deleteShader(vsProg);
		gl.deleteShader(fsProg);
		
		this.#format = new VertexFormat(this.#program);
	}

	bind() {
		engine.gl.useProgram(this.#program);
	}

	setUniformMat4(location, mat) {
		let glLoc = engine.gl.getUniformLocation(this.#program, location);
		engine.gl.uniformMatrix4fv(glLoc, engine.gl.FALSE, mat);
	}
	
	format() {
		return this.#format;
	}
	
	static unbind() {
		engine.gl.useProgram(null);
	}
}

