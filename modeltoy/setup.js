const URL_PARAMS = new URLSearchParams(window.location.search);
const HOMEPAGE = !URL_PARAMS.has("model");

function appendOption(menu, option, value) {
	let optionDOM = document.createElement("option");
	optionDOM.innerText = option;
	optionDOM.value = value;
	
	menu.appendChild(optionDOM);
}

// example: oerngnrogn shoulderbuddy
var modelIdInput;
var modelTypeInput;

function potentiallySubmit(event) {
	if (event.keyCode == 13) { // enter
		if (modelIdInput.value != "") {
			window.location.href = window.location.href + "?model=" + modelIdInput.value + "&type=" + modelTypeInput.value + "&timestamp=" + Date.now();
		}
	}
}

let body = document.getElementsByTagName("body")[0];

if (HOMEPAGE) {
	let canvas = document.getElementById("model-toy");
	canvas.width = 300;
	canvas.height = 300;
	canvas.classList.add("fadeIn");
	
	// add form
	modelIdInput = document.createElement("input");
	modelIdInput.placeholder = "Model Id...";
	modelIdInput.classList.add("first", "fadeIn", "centred");
	modelIdInput.onkeypress = potentiallySubmit;
	
	body.appendChild(modelIdInput);
	
	modelTypeInput = document.createElement("select");
	appendOption(modelTypeInput, "Hat", "hat");
	appendOption(modelTypeInput, "Shoulder Buddy", "shoulderbuddy");
	modelTypeInput.classList.add("fadeIn", "centred");
	
	body.appendChild(modelTypeInput);
}