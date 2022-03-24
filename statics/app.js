// This array contains objects for every problem type.
// One of these is picked randomly for a given problem.
problem_types = []
PI = 3.141592653589793

// number from a to b, excluding b
function randint(a, b) {
	if (b == undefined) {
		b = a;
		a = 0;
	}
	
	return Math.floor(Math.random() * (b - a)) + a;
}

////////////////////////////
//      CENTROIDS        ///
////////////////////////////

////////////////////////////
//         MAIN          ///
////////////////////////////

function main() {
	const canvas = document.getElementById("problem-window");
	const brush = canvas.getContext("2d");
	brush.fillRect(0, 0, 375, 500);
	brush.fillStyle = '#FF0000';
	brush.fillRect(375, 0, 750, 500);
}