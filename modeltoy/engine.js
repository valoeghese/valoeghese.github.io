///////////////////////////////////////////////////////
//      3D GL ENGINE in JS/WebGL by Valoeghese       //
// BASED OFF OF SCALPEL | PROVIDED UNDER MIT LICENSE //
///////////////////////////////////////////////////////

console.log("Initialising Engine.");

const engine = {
	gl: null,
	setCanvas: function (canvas) {
		this.gl = canvas.getContext("webgl");
		return this.gl;
	},
	setClearColour: function(r, g, b) {
		this.gl.clearColor(r, g, b, 1.0);
	}
};

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
			console.error("Stack is at minimum size of 1!");
			return;
		}

		this.#stack.pop();
	}

	peek() {
		return this.#stack[this.#stack.length - 1];
	}

	translate(x, y, z) {
		glMatrix.mat4.translate(this.peek(), [x, y, z]);
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

	build() {
		for (let i = 0; i < this.#format.length; ++i) {
			let item = this.#format[i];
			console.log(item);
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
			throw new ShaderException("Error with fragment shader compilation", gl.getShaderInfoLog(vsProg));
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
	
	formatBuilder() {
		return this.#format;
	}
}

