// Code Style:
// CONST VARIABLES ARE IN SCREAMING_CAMEL_CASE
// global and local variables use this nice format likeThis
const DEBUG = URL_PARAMS.has("debug");

const ROTATION_AXES = {
	"x": [1, 0, 0],
	"y": [0, 1, 0],
	"z": [0, 0, 1]
};

if (DEBUG) {
	console.log("Debug Enabled.");
}

async function main() {
	console.log("Initialising Model Toy");

	var canvas = document.getElementById("model-toy");
	
	if (!engine.setCanvas(canvas)) {
		alert("Lmao your browser is outdated as F*CK are you on internet explorer or something? (Failed to create WebGL2 context)");
	}
	
	engine.setClearColour(0.85, 0.9, 1.0);
	
	let program = setupProgram();
	
	var models = [];
	let texture;
	
	// this function is called after some async calls (or just immediately after loading the model if on the homepage)
	function finish() {
		program.bind();

		let projectionMatrix = new Float32Array(16);
		glMatrix.mat4.perspective(projectionMatrix, 1.58, canvas.width / canvas.height, 0.1, 1000);
		program.setUniformMat4("projection", projectionMatrix);
		
		let stack = new MatrixStack();
		stack.lookAt([0, 0, HOMEPAGE ? -4 : -14], [0, 0, 0], [0, 1, 0]); // position, lookat, up
		let angleY = 0.0;
		let angleX = HOMEPAGE ? 0.3 : 0.0;
		let rotationSpeed = 1;//HOMEPAGE ? 1 : 0.33;

		function draw() {
			engine.gl.clear(engine.gl.COLOR_BUFFER_BIT | engine.gl.DEPTH_BUFFER_BIT);
			stack.push();
			stack.rotate(angleY, ROTATION_AXES.y);
			stack.rotate(angleX, ROTATION_AXES.x);

			texture.bind();

			models.forEach(element => {
				let model = element.model;
				
				if (element.rotation != undefined) {
					let rotation = element.rotation;

					stack.push();
					//stack.translate(rotation.antiOrigin);
					stack.rotate(element.rotation.angle, ROTATION_AXES[rotation.axis]);
					stack.translate(rotation.origin);
					program.setUniformMat4("view", stack.peek());
					
					model.bind();
					model.draw();
					
					stack.pop();
				} else {
					program.setUniformMat4("view", stack.peek());
					model.bind();
					model.draw();
				}
			});
			
			stack.pop();

			angleY += 0.04 * rotationSpeed;
			angleX += 0.01 * rotationSpeed;
			requestAnimationFrame(draw);
		}

		requestAnimationFrame(draw);
	}
	
	if (HOMEPAGE) {
		let uvSets = {
			"north": {"uv":[0, 0, 0.5, 0.5]},
			"east": {"uv":[0, 0, 0.5, 0.5]},
			"south": {"uv":[0, 0, 0.5, 0.5]},
			"west": {"uv":[0, 0, 0.5, 0.5]},
			"up": {"uv":[0.5, 0, 1, 0.5]},
			"down": {"uv":[0, 0.5, 0.5, 1]}
		};

		models.push({"model":createCuboid([-1+8, -1+8, -1+8], [1+8, 1+8, 1+8], uvSets)});
		program.format().apply();
		Model.unbind();

		texture = new Texture(document.getElementById("example-image"));
		finish();
	} else {
		let loading = document.createElement("h2");
		loading.innerText = "Loading...";
		loading.classList.add("centred");
		body.appendChild(loading);
		
		let url = "https://api.cosmetica.cc/get/cosmetic?type=" + URL_PARAMS.get("type") + "&id=" + URL_PARAMS.get("model") + "&timestamp=" + URL_PARAMS.get("timestamp");
		if (DEBUG) console.log("Contacting " + url);
		
		let data = await fetch(url);
		let jsonData = await data.json();
		
		if (DEBUG) {
			console.log("Received the following JSON:");
			console.log(jsonData);
		}
		
		let img = new Image();

		img.onload = function() {
			texture = new Texture(img);
			
			let jsonModel = JSON.parse(jsonData.model);

			if (DEBUG){
				console.log("Extracted the following JSON Model:");
				console.log(jsonModel);
			}
		
			for (let i = 0; i < jsonModel.elements.length; ++i) {
				let cuboid = jsonModel.elements[i];
				let rotation = cuboid.rotation;
				
				if (rotation != undefined) {
					/*cuboid.from[0] += rotation.origin[0];
					cuboid.to[0] += rotation.origin[0];
					
					cuboid.from[1] += rotation.origin[1];
					cuboid.to[1] += rotation.origin[1];
					
					cuboid.from[2] += rotation.origin[2];
					cuboid.to[2] += rotation.origin[2];*/
					rotation.antiOrigin = [-rotation.origin[0], -rotation.origin[1], -rotation.origin[2]];
				}
				
				let element = {"model":createCuboid(cuboid.from, cuboid.to, cuboid.faces), "rotation":rotation};

				models.push(element);
				program.format().apply();
			}

			Model.unbind();

			// switch loading text for the model name (the id, at least for now)
			document.body.removeChild(loading);
			
			let mName = document.createElement("h2");
			mName.innerText = URL_PARAMS.get("model");
			mName.classList.add("fadeIn", "centred");
			document.body.appendChild(mName);

			canvas.style.visibility = "visible";
			canvas.classList.add("fadeIn");

			finish();
		}

		img.src = jsonData.texture;
	}
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
	for (let i = 0; i < from.length; ++i) {
		from[i] -= 8;
		to[i] -= 8;
	}

	let uvs = uvSets.south.uv;

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
	
	uvs = uvSets.north.uv;

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
	
	uvs = uvSets.west.uv;
	
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

	uvs = uvSets.east.uv;

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

	uvs = uvSets.up.uv;
	
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

	uvs = uvSets.down.uv;

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
