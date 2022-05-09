console.log("Hello, World!");

// Searchables is all possible search terms. These are all lowercase for search reasons.
// Birds maps scientific names to bird data (1st common name, region) and other names to scientific names
// Families maps genuses to families
// Orders maps families to orders
searchables = {'q': [], 'w': [], 'e': [], 'r': [], 't': [], 'y': [], 'u': [], 'i': [], 'o': [], 'p': [], 'a': [], 's': [], 'd': [], 'f': [], 'g': [], 'h': [], 'j': [], 'k': [], 'l': [], 'z': [], 'x': [], 'c': [], 'v': [], 'b': [], 'n': [], 'm': []};
birds = {}
binomials = [] // for choosing the answer
families = {}
orders = {}

// puts it in the right sections
// searchables is segregated for speed reasons with high object counter
function addSearchable(strItem) {
	let parts = strItem.split(" ");
	let charsDone = [];
	
	for (let i in parts) {
		let c0 = parts[i][0];

		try{
			if (!charsDone.includes(c0)) {
				charsDone.push(c0);
				searchables[c0].push(strItem);
			}
		} catch (err) {console.log(err); console.log(c0); console.log(strItem);}
	}
	
}

function capitalise(strItem) {
	let result = "";
	let parts = strItem.split(" ");
	
	for (let i in parts) {
		if (result != "") result += " "; // add whitespace between parts
		let part = parts[i];
		
		result += part[0].toUpperCase() + part.substring(1);
	}
	
	return result;
}

fetch("birds.json")
	.then(response => response.json())
	.then(data => {
		// first, iterate over orders
		for (let order in data) {
			cOrder = data[order];
			
			// then families
			for (let family in cOrder) {
				cFamily = cOrder[family];
				orders[family] = order;
				
				// etc...
				for (let genus in cFamily) {
					cGenus = cFamily[genus];
					families[genus] = family;
					
					for (let species in cGenus) {
						cSpecies = cGenus[species];
						
						// scientific name
						scientificName = genus + " " + species;

						searchables[genus[0]].push(scientificName);
						binomials.push(scientificName);
						if (genus[0] != species[0]) searchables[species[0]].push(scientificName);
						
						// common name
						let commonName = cSpecies.name;
						
						if (typeof commonName === 'string') {
							addSearchable(commonName);
							birds[commonName] = scientificName;
						}
						else {
							for (let i in commonName) {
								let name = commonName[i];
								addSearchable(name); // all names must be searchable
								birds[name] = scientificName;
							}
							
							commonName = commonName[0];
						}
						
						// entry
						
						birds[scientificName] = {
							"binomial": scientificName,
							"common": capitalise(commonName),
							"region": capitalise(cSpecies.region)
						};
					}
				}
			}
		}
	});

const textbox = document.getElementById("bird-entry");
const results = [
	document.getElementById("result_1"),
	document.getElementById("result_2"),
	document.getElementById("result_3")
];

var last = ""

/**
 * Get an entry from a result term.
 */
function entryOf(term) {
	result = birds[term];
	
	if (typeof result === 'string') {
		result = birds[result];
	}
	
	return result;
}

function addtopresults() {
	let search = textbox.value.toLowerCase();
	
	if (search != last) { // check stuff has changed
		last = search;
		
		let count = results.length;
		
		// search relevant results (with a term starting with the first letter in the search box
		let terms = searchables[search[0]];
		let resultBinomials = []; // to prevent duplicatess
		
		// don't bother calculating on whitespace lol.
		
		if (search != "") {
			for (i in terms) {
				let term = terms[i];
				
				if (term.indexOf(search) > -1) {
					entry = entryOf(term);
					
					// check for duplicates
					
					if (resultBinomials.includes(entry.binomial)) {
						continue;
					}
					
					resultBinomials.push(entry.binomial);
					
					// add result
					
					let div = results[results.length - count]
					div.innerText = entry.common + " (" + entry.binomial + ")";
					div.style.display = "block";
					div.term = capitalise(term); // storing in a new field haha javascript go brr
					
					count -= 1;
					
					if (count == 0) return;
				}
			}
		}
		
		while (count > 0) {
			results[results.length - count].style.display = "none";
			count -= 1;
		}
	}
}

function autocomplete(e) {
	textbox.value = e.term;
	addtopresults();
}

// setup
for (let i in results) {
	results[i].style.display = "none";
}