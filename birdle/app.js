console.log("Tweet-tweet, World!");

//===https://stackoverflow.com/questions/30482887/playing-a-simple-sound-with-web-audio-api
const audioPlay = async url => {
  const context = new AudioContext();
  const source = context.createBufferSource();
  const audioBuffer = await fetch(url)
    .then(res => res.arrayBuffer())
    .then(ArrayBuffer => context.decodeAudioData(ArrayBuffer));

  source.buffer = audioBuffer;
  source.connect(context.destination);
  source.start();
};
//====

const entry_0 = `
<div class="borders ">
<div class="entry larger `;
const entry_0b = `">`;
const entry_1 = `<div></div><span class="scientific-name">`;
const entry_2 = `</span></div>
<div class="entry `;
const entry_2b = `" >`;
const entry_3 = `</div>
<div class="entry `;
const entry_3b = `" >`;
const entry_4 =`</div>
<div class="entry `;
const entry_4b = `" >`;
const entry_5 = `</div></div>`;

// Searchables is all possible search terms. These are all lowercase for search reasons.
// Birds maps scientific names to bird data (1st common name, region) and other names to scientific names
// Families maps genuses to families
// Orders maps families to orders
searchables = {'q': [], 'w': [], 'e': [], 'r': [], 't': [], 'y': [], 'u': [], 'i': [], 'o': [], 'p': [], 'a': [], 's': [], 'd': [], 'f': [], 'g': [], 'h': [], 'j': [], 'k': [], 'l': [], 'z': [], 'x': [], 'c': [], 'v': [], 'b': [], 'n': [], 'm': []};
birds = {}
binomials = [] // for choosing the answer
families = {}
orders = {}

var top_secret_solution = {};

function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

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
							"region": capitalise(cSpecies.region),
							"region2": cSpecies.secondary_region == undefined ? undefined : capitalise(cSpecies.secondary_region),
							"size": cSpecies.size
						};
					}
				}
			}
		}
		
		// then choose solution
				
		let prng = mulberry32(new Date().getYear() * 365 + new Date().getMonth() * 69420 + new Date().getDate());
		var top_secret_rng = Math.floor(prng() * binomials.length);
		console.log(top_secret_rng);
		top_secret_solution = entryOf(binomials[top_secret_rng]);
		
		let splitbinomail = top_secret_solution.binomial.split(" ");//yeah I realised I made a typo once I started typing the next line but it's not that important so no reason to correct it lol
		
		fetch("https://www.xeno-canto.org/api/2/recordings?query=" + splitbinomail[0] + "+" + splitbinomail[1])
			.then(response2 => response2.json())
			.then(json => {
				// https://stackoverflow.com/questions/30482887/playing-a-simple-sound-with-web-audio-api
				let sound = json.recordings[0].file;
				document.querySelector('#start').onclick = () => audioPlay(sound);
			});
	});

const textbox = document.getElementById("bird-entry");
const guesses = document.getElementById("guesses");
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
	
	if (result == undefined) return undefined;
	
	if (typeof result === 'string') {
		result = birds[result];
	}
	
	return result;
}

function similarity(a1, a2, b1, b2, firstIsMostAccurate) {
	let firstIsMostAccurate_ = (typeof firstIsMostAccurate !== 'undefined') ? firstIsMostAccurate : false;

	if (a1 == b1) {
		if (firstIsMostAccurate_ || a2 == b2) {return "every60secondsinafricaaminutepasses";}
		else return "nearly";
	} else if (a2 == b2) return "nearly";
	
	return "";
}

function maybeenter(event) {
	if (event.keyCode == 13) {
		let term = textbox.value.toLowerCase();
		let entry = entryOf(term);
		
		if (entry == undefined) {
			// unknown bird
		}
		else {
			textbox.value = "";
			resettopresults();
			
			binomial_split = entry.binomial.split(" ");
			binomial2_split = top_secret_solution.binomial.split(" ");
			console.log(entry.binomial);
			family1 = families[binomial_split[0]];
			family2 = families[binomial2_split[0]];
			
			let variation = Math.abs(entry.size - top_secret_solution.size);
			guesses.innerHTML += entry_0 + similarity(binomial_split[0], binomial_split[1], binomial2_split[0], binomial2_split[1]) + entry_0b + entry.common + entry_1 + entry.binomial + entry_2 + similarity(family1, orders[family1], family2, orders[family2]) + entry_2b + capitalise(families[entry.binomial.split(" ")[0]]) + entry_3 + similarity(entry.region, entry.region, top_secret_solution.region, top_secret_solution.region2, true) + entry_3b + entry.region + entry_4 + (variation == 0 ? "every60secondsinafricaaminutepasses" : (variation < 5 ? "nearly" : "")) + entry_4b + (variation == 0 ? "" : (entry.size < top_secret_solution.size ? "&#9650; " : "&#9660; ")) + entry.size + entry_5;
		}
	}
}

function addtopresults(event) {
	let search = textbox.value.toLowerCase();
	
	if (event.keyCode == 13) return;
	
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

function resettopresults() {
	for (let i in results) {
		results[i].style.display = "none";
	}
}

function autocomplete(e) {
	textbox.value = e.term;
	resettopresults();
}

// website-load setup
resettopresults();
