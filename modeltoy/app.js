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
	
	let program = setupProgram();
	
	let uvSets = {
		"north": [0, 0, 0.5, 0.5],
		"east": [0, 0, 0.5, 0.5],
		"south": [0, 0, 0.5, 0.5],
		"west": [0, 0, 0.5, 0.5],
		"up": [0.5, 0, 1, 0.5],
		"down": [0, 0.5, 0.5, 1]
	};
	let model = createCuboid([-1, -1, -1], [1, 1, 1], uvSets);
	program.format().apply();

	program.bind();

	let projectionMatrix = new Float32Array(16);
	glMatrix.mat4.perspective(projectionMatrix, 1.58, canvas.width / canvas.height, 0.1, 1000);
	program.setUniformMat4("projection", projectionMatrix);
	
	let stack = new MatrixStack();
	stack.lookAt([0, 0, -5], [0, 0, 0], [0, 1, 0]);
	let angleY = 0.0;
	let angleX = 0.3;
	
	let texture = new Texture("example-image");

	function draw() {
		engine.gl.clear(engine.gl.COLOR_BUFFER_BIT | engine.gl.DEPTH_BUFFER_BIT);
		stack.push();
		stack.rotate(angleY, [0, 1, 0]);
		stack.rotate(angleX, [1, 0, 0]);
		program.setUniformMat4("view", stack.peek());
		stack.pop();

		texture.bind();
		model.draw(); // normally we would need to bind the model before drawing but I only have one model so I never unbind it from when I create it
		
		angleY += 0.04;
		angleX += 0.01;
		requestAnimationFrame(draw);
	}

	requestAnimationFrame(draw);
}

function setupProgram() {
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
	return program;
}

var vertices = [];
var indices = [];
var currentIndex = 0;

/*
"""
For transforming the old version of vertex arrays to new.
"""
def trans(old):
    new = "["
    for i in range(len(old)):
        val = i % 3
        arr = "to[" if old[i] > 0 else "from["
        new += arr + str(val) + "],"
        if i % 3 == 2:
            if i == len(old) - 1:
                new = new[:len(new)-1] + "]"
            print(new)
            new = "\t\t"
			
"""
For transforming the old version of uvs to new
"""
def transUV(old, minuv=[0,0]):
    new = "["
    for i in range(len(old)):
        val = i % 2
        if old[i] > minuv[val]:
            val += 2
        
        new += "uvs[" + str(val) + "],"
        if i % 2 == 1:
            if i == len(old) - 1:
                new = new[:len(new)-1] + "]"
            print(new)
            new = "\t\t"
*/

function createCuboid(from, to, uvSets) {
	let uvs = uvSets["south"]

	addFace( // back
		[from[0], from[1], to[2],
		to[0], from[1], to[2],
		to[0], to[1], to[2],
		from[0], to[1], to[2]],

		[uvs[0],uvs[3],
		uvs[2],uvs[3],
		uvs[2],uvs[1],
		uvs[0],uvs[1]]
	);
	
	uvs = uvSets["north"]

	addFace( // front
		[to[0],to[1],from[2],
		to[0],from[1],from[2],
		from[0],from[1],from[2],
		from[0],to[1],from[2]],

		[uvs[2],uvs[1],
		uvs[2],uvs[3],
		uvs[0],uvs[3],
		uvs[0],uvs[1]]
	);
	
	uvs = uvSets["west"]
	
	addFace( // right
		[from[0],to[1],to[2],
		from[0],to[1],from[2],
		from[0],from[1],from[2],
		from[0],from[1],to[2]],

		[uvs[2],uvs[1],
		uvs[0],uvs[1],
		uvs[0],uvs[3],
		uvs[2],uvs[3]]
	);

	uvs = uvSets["east"]

	addFace( // left
		[to[0],from[1],from[2],
		to[0],to[1],from[2],
		to[0],to[1],to[2],
		to[0],from[1],to[2]],

		[uvs[0],uvs[3],
		uvs[0],uvs[1],
		uvs[2],uvs[1],
		uvs[2],uvs[3]]
	);

	uvs = uvSets["up"]
	
	addFace( // top
		[to[0],to[1],to[2],
		to[0],to[1],from[2],
		from[0],to[1],from[2],
		from[0],to[1],to[2]],

		[uvs[2],uvs[1],
		uvs[2],uvs[3],
		uvs[0],uvs[3],
		uvs[0],uvs[1]]
	);

	uvs = uvSets["down"]

	addFace( // bottom
		[from[0],from[1],from[2],
		to[0],from[1],from[2],
		to[0],from[1],to[2],
		from[0],from[1],to[2]],
		
		[uvs[0],uvs[3],
		uvs[2],uvs[3],
		uvs[2],uvs[1],
		uvs[0],uvs[1]]
	);

	return new Model(vertices, indices);
}

function addFace(coords, uvs) {
	for (let i = 0; i < 4; ++i) {
		vertices.push(coords[3*i], coords[3*i + 1], coords[3*i + 2]);
		vertices.push(uvs[2*i], uvs[2*i + 1]);
	}

	let c0 = currentIndex++;
	let c1 = currentIndex++;
	let c2 = currentIndex++;
	let c3 = currentIndex++;
	
	indices.push(c0, c1, c2);
	indices.push(c0, c2, c3);
}
