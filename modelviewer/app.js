// Code Style:
// CONST VARIABLES ARE IN SCREAMING_CAMEL_CASE
// global and local variables use this nice format likeThis
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
	
	if (HOMEPAGE) {
		let uvSets = {
			"north": {"uv":[0, 0, 0.5, 0.5]},
			"east": {"uv":[0, 0, 0.5, 0.5]},
			"south": {"uv":[0, 0, 0.5, 0.5]},
			"west": {"uv":[0, 0, 0.5, 0.5]},
			"up": {"uv":[0.5, 0, 1, 0.5]},
			"down": {"uv":[0, 0.5, 0.5, 1]}
		};

		models.push({"model":createCuboid([-1, -1, -1], [1, 1, 1], uvSets)});
		program.format().apply();
		VertexArray.unbind();

		finish(
			program,
			models,
			new Texture(document.getElementById("example-image"))
		);
	} else {
		document.body.removeChild(canvas);

		let loading = document.createElement("h2");
		loading.innerText = "Loading...";
		loading.classList.add("centred");
		body.appendChild(loading);
		
		let url = "https://api.cosmetica.cc/get/cosmetic?type=" + URL_PARAMS.get("type") + "&id=" + URL_PARAMS.get("model") + "&timestamp=" + Date.now();
		if (DEBUG) console.log("Contacting " + url);
		
		let data = await fetch(url);
		let jsonData = await data.json();
		
		if (jsonData.error != undefined) {
			// switch loading text for the model name (the id, at least for now)
			document.body.removeChild(loading);
			
			let mName = document.createElement("h2");
			mName.innerText = "The provided cosmetic could not be found.";
			mName.classList.add("fadeIn", "centred");
			document.body.appendChild(mName);
			
			addBackButton();
			return;
		}

		if (DEBUG) {
			console.log("Received the following JSON:");
			console.log(jsonData);
		}
		
		let img = new Image();

		img.onload = function() {
			let texture = new Texture(img);
			
			let jsonModel = JSON.parse(jsonData.model);

			if (DEBUG){
				console.log("Extracted the following JSON Model:");
				console.log(jsonModel);
			}

			// load each cuboid element in the model
			for (let i = 0; i < jsonModel.elements.length; ++i) {
				let element = jsonModel.elements[i];
				let rotation = element.rotation;
				
				if (rotation != undefined) {
					rotation.angle = glMatrix.glMatrix.toRadian(rotation.angle);

					// transpose 8,8 to origin to match what we do with normal coords
					for (let i = 0; i < 3; ++i) {
						rotation.origin[i] -= 8;
					}

					rotation.antiOrigin = [-rotation.origin[0], -rotation.origin[1], -rotation.origin[2]];
				}
				
				// transpose 8,8 to origin
				for (let i = 0; i < element.from.length; ++i) {
					element.from[i] -= 8;
					element.to[i] -= 8;
				}

				// scale uvs to 0,1 from 0,16
				for (let k in element.faces) {
					let face = element.faces[k];

					for (let j = 0; j < face.uv.length; ++j) {
						face.uv[j] /= 16.0;
					}
				}

				let modelPart = {"model":createCuboid(element.from, element.to, element.faces), "rotation":rotation};

				models.push(modelPart);
				program.format().apply();
			}

			VertexArray.unbind();

			// switch loading text for the model name (the id, at least for now)
			document.body.removeChild(loading);

			let mName = document.createElement("h2");
			mName.innerText = jsonData.name;
			mName.classList.add("fadeIn", "centred");
			document.body.appendChild(mName);
			
			// readd canvas
			document.body.appendChild(canvas);
			canvas.classList.add("fadeIn");

			finish(program, models, texture);
		}

		img.src = jsonData.texture;
	}
}

// this function is called after some async calls (or just immediately after loading the model if on the homepage)
function finish(program, models, texture) {
	addBackButton();

	program.bind();

	let projectionMatrix = new Float32Array(16);
	glMatrix.mat4.perspective(projectionMatrix, 1.58, canvas.width / canvas.height, 0.1, 1000);
	program.setUniformMat4("projection", projectionMatrix);
	
	let stack = new MatrixStack();
	let zoom = -18;

	window.addEventListener("wheel", function(e) {
		zoom += (-e.deltaY / 80);
	});

	let angleY = 0.0;
	let angleX = HOMEPAGE ? -0.4 : 0.0;
	let rotationSpeedX = URL_PARAMS.has("spin_x") ? 0.01 : 0;
	let rotationSpeedY = HOMEPAGE ? 0.04 : 0.02;

	function draw() {
		engine.gl.clear(engine.gl.COLOR_BUFFER_BIT | engine.gl.DEPTH_BUFFER_BIT);
		
		stack.lookAt([0, 0, HOMEPAGE ? -4 : zoom], [0, 0, 0], [0, 1, 0]); // position, lookat, up
		stack.push();
		stack.rotate(angleY, ROTATION_AXES.y);
		stack.rotate(angleX, ROTATION_AXES.x);

		texture.bind();
		let n = 0;

		models.forEach(element => {
			let model = element.model;
			
			if (element.rotation != undefined) {
				let rotation = element.rotation;

				stack.push();
				stack.translate(rotation.origin);
				stack.rotate(element.rotation.angle, ROTATION_AXES[rotation.axis]);
				stack.translate(rotation.antiOrigin);
				
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
		angleY += rotationSpeedY;
		angleX += rotationSpeedX;
		requestAnimationFrame(draw);
	}

	requestAnimationFrame(draw);
}

function addBackButton() {
	let button = document.createElement("input");
	button.type = "button";
	button.value = HOMEPAGE ? "< Main Page" : "< Back";
	button.classList.add("centred", "fadeIn", "largerInput");

	button.onclick = function() {
		let href = window.location.href;
		let marker = href.indexOf("?");
		
		if (marker > 0) {
			href = href.substring(0, marker);
		}

		if (HOMEPAGE) {
			href = href.substring(0, href.length - "modelviewer/".length);
		}

		window.location.href = href + (DEBUG ? "?debug" : "");
	};

	document.body.appendChild(button);
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

/*
"""
For transforming the old version of vertex arrays (just a cube) to new.
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
	let vertices = [];
	let indices = [];
	let currentIndex = 0;

	let uvs = uvSets.south.uv;

	currentIndex = addFace( // back
		[from[0], from[1], to[2],
		to[0], from[1], to[2],
		to[0], to[1], to[2],
		from[0], to[1], to[2]],

		[uvs[0],uvs[3],
		uvs[2],uvs[3],
		uvs[2],uvs[1],
		uvs[0],uvs[1]],
		
		vertices, indices, currentIndex
	);
	
	uvs = uvSets.north.uv;

	currentIndex = addFace( // front
		[to[0],to[1],from[2],
		to[0],from[1],from[2],
		from[0],from[1],from[2],
		from[0],to[1],from[2]],

		[uvs[2],uvs[1],
		uvs[2],uvs[3],
		uvs[0],uvs[3],
		uvs[0],uvs[1]],
		
		vertices, indices, currentIndex
	);
	
	uvs = uvSets.west.uv;
	
	currentIndex = addFace( // right
		[from[0],to[1],to[2],
		from[0],to[1],from[2],
		from[0],from[1],from[2],
		from[0],from[1],to[2]],

		[uvs[2],uvs[1],
		uvs[0],uvs[1],
		uvs[0],uvs[3],
		uvs[2],uvs[3]],
		
		vertices, indices, currentIndex
	);

	uvs = uvSets.east.uv;

	currentIndex = addFace( // left
		[to[0],from[1],from[2],
		to[0],to[1],from[2],
		to[0],to[1],to[2],
		to[0],from[1],to[2]],

		[uvs[0],uvs[3],
		uvs[0],uvs[1],
		uvs[2],uvs[1],
		uvs[2],uvs[3]],
		
		vertices, indices, currentIndex
	);

	uvs = uvSets.up.uv;
	
	currentIndex = addFace( // top
		[to[0],to[1],to[2],
		to[0],to[1],from[2],
		from[0],to[1],from[2],
		from[0],to[1],to[2]],

		[uvs[2],uvs[1],
		uvs[2],uvs[3],
		uvs[0],uvs[3],
		uvs[0],uvs[1]],
		
		vertices, indices, currentIndex
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
		uvs[0],uvs[1]],
		
		vertices, indices, currentIndex
	);

	return new VertexArray(vertices, indices);
}

function addFace(coords, uvs, vertices, indices, currentIndex) {
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
	return currentIndex;
}
