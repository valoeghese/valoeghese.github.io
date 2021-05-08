const width  = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

// Mobile Support
if (height > width) {
	document.getElementById("main-body").style.width = "100%";
}