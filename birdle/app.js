console.log("Tweet-tweet, World!");

const urlParams = new URLSearchParams(window.location.search);

// the 'screw safari' collection
var setDailyCookie;
var getDailyCookie;
const MAX_GUESSES = 6;
// moved the consts of the runtime-generated divs to this collection too
const entry_0 = `
<div class="borders ">
<div class="entry larger `;
const entry_0b = `">`;
const entry_1 = `<div></div><span class="scientific-name">`;
const entry_2 = `</span></div>
<div class="entry `;
const entry_2b = `" >`;
const entry_2c = `<div></div><span class="scientific-name">`;
const entry_2d = `</span>`;
const entry_3 = `</div><div class="entry">`;
const entry_4 =`</div>
<div class="entry `;
const entry_4b = `" >`;
const entry_5 = `</div></div>`;

function setLifetimeCookie(cname, cvalue) {
	if (!urlParams.has("nocookies")) {
		const forever = new Date();
		forever.setDate(forever.getDate() + 1000000000);
	  
		let expires = "expires=" + forever.toUTCString();
		document.cookie = "FOREVER-" + cname + "=" + cvalue + ";" + expires + ";path=/";
	}
}

function getCookie(cname) {
	if (urlParams.has("nocookies")) {
		return undefined;
	}
	
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for(let i = 0; i <ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

try {
	if (urlParams.has("mode")) {
		if (!getCookie("FOREVER-seenhowto")) {
			document.getElementById("how-2-play-stoppa").style.display = "block";
		}
		
		function startGame() {
			document.getElementById("how-2-play-stoppa").style.pointerEvents = "none";
			document.getElementById("how-2-play").style.opacity = 0;
			setLifetimeCookie("seenhowto", "true");
			
			setTimeout(function() {
				document.getElementById("how-2-play-stoppa").style.opacity = 0;
			}, 300);
		}
		
		// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
		String.prototype.hashCode = function() {
			var hash = 0, i, chr;
			if (this.length === 0) return hash;
			
			for (i = 0; i < this.length; i++) {
				chr   = this.charCodeAt(i);
				hash  = ((hash << 5) - hash) + chr;
				hash |= 0; // Convert to 32bit integer
			}
			return hash;
		};
		
		const MODE = urlParams.get("mode");

		// adapted from https://www.w3schools.com/js/js_cookies.asp
		setDailyCookie = function(cname, cvalue) {
			if (!urlParams.has("nocookies")) {
				cname = MODE + "-" + cname;
				
				const tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				tomorrow.setHours(0, 0, 0, 0);
			  
				let expires = "expires="+ tomorrow.toUTCString();
				document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
			}
		}

		// https://www.w3schools.com/js/js_cookies.asp
		getDailyCookie = function(cname) {
			return getCookie(MODE + "-" + cname);
		}

		// Searchables is all possible search terms. These are all lowercase for search reasons.
		// Birds maps scientific names to bird data (1st common name, region) and other names to scientific names
		// Families maps genuses to families
		// Orders maps families to orders
		searchables = {'q': [], 'w': [], 'e': [], 'r': [], 't': [], 'y': [], 'u': [], 'i': [], 'o': [], 'p': [], 'a': [], 's': [], 'd': [], 'f': [], 'g': [], 'h': [], 'j': [], 'k': [], 'l': [], 'z': [], 'x': [], 'c': [], 'v': [], 'b': [], 'n': [], 'm': []};
		birds = {};
		binomials = []; // for choosing the answer
		families = {};
		family_names = {}; // common names for families of birds
		orders = {};

		var top_secret_solution = getDailyCookie("not-the-solution");
		var guesses_left = MAX_GUESSES;

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
		function addSearchable(strItem, array=searchables) {
			let parts = strItem.split(" ");
			let charsDone = [];
			
			for (let i in parts) {
				let c0 = parts[i][0];

				try{
					if (!charsDone.includes(c0)) {
						charsDone.push(c0);
						array[c0].push(strItem);
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

		function setSound(recording) {
			let funnyString = recording.sono.small.substring("//xeno-canto.org/sounds/uploaded/".length);
			funnyString = funnyString.substring(0, funnyString.indexOf('/'));
			
			let sound = "https://xeno-canto.org/sounds/uploaded/" + funnyString + "/" + recording["file-name"];
			let soundPlay = document.getElementById("actualsound");
			
			// thanks eyezah
			soundPlay.src = sound;
			soundPlay.load();
			
			// credit
			document.getElementById("credit").innerText = "Recording courtesy of " + recording.rec + " via Xeno-Canto";
		}

		fetch("birds.json")
			.then(response => response.json())
			.then(json => {
				try {
					let data = json.birds;
					document.getElementById("title").innerText = "Birdle: " + ((MODE == "world") ? "All Birds" : json.collections[MODE].name);
					
					let filter;
					
					if (MODE == "world") {
						filter = (sci, sp) => true;
					} else {
						// sorry
						// This is literally one of the best solutions with the system I have (that I could think of in like 5 minutes)
						// please optimise this
						
						let allowedBirds = json.collections[MODE].species;
						
						filter = (sci, sp) => {
							if (typeof sp === 'string') {
								for (let i = 0; i < allowedBirds.length; i++) {
									if (allowedBirds[i] == sci) {
										allowedBirds.splice(i, 1);
										return true;
									}
									else if (allowedBirds[i] == sp) {
										allowedBirds.splice(i, 1);
										return true;
									}
								}
								
								return false;
							}
							else {
								for (let i = 0; i < allowedBirds.length; i++) {
									if (allowedBirds[i] == sci) {
										allowedBirds.splice(i, 1);
										return true;
									}
									else if (sp.includes(allowedBirds[i])) {
										allowedBirds.splice(i, 1);
										return true;
									}
								}
								
								return false;
							}
						}
					}

					// secondary names are ranked lower in search results
					let secondaries = {'q': [], 'w': [], 'e': [], 'r': [], 't': [], 'y': [], 'u': [], 'i': [], 'o': [], 'p': [], 'a': [], 's': [], 'd': [], 'f': [], 'g': [], 'h': [], 'j': [], 'k': [], 'l': [], 'z': [], 'x': [], 'c': [], 'v': [], 'b': [], 'n': [], 'm': []};
					let tertiaries = {'q': [], 'w': [], 'e': [], 'r': [], 't': [], 'y': [], 'u': [], 'i': [], 'o': [], 'p': [], 'a': [], 's': [], 'd': [], 'f': [], 'g': [], 'h': [], 'j': [], 'k': [], 'l': [], 'z': [], 'x': [], 'c': [], 'v': [], 'b': [], 'n': [], 'm': []};

					// first, iterate over orders
					for (let order in data) {
						cOrder = data[order];
						
						// then families
						for (let family in cOrder) {
							cFamily = cOrder[family];
							orders[family] = order;
							
							// etc...
							for (let genus in cFamily) {
								// special-case the "name" field
								if (genus == "name") {
									family_names[family] = cFamily[genus];
									continue; // continue to the next item in the loop instead of trying to process it as a genus
									// some people don't like when you use a continue statement. To those people I say: "cope".
								}
								
								cGenus = cFamily[genus];
								families[genus] = family;
								
								for (let species in cGenus) {
									cSpecies = cGenus[species];
									
									// scientific name
									let scientificName = genus + " " + species;
									
									// filter
									if (!filter(scientificName, cSpecies.name)) {
										continue;
									}
									
									// add by scientific name
									secondaries[genus[0]].push(scientificName);
									binomials.push(scientificName);
									if (genus[0] != species[0]) secondaries[species[0]].push(scientificName);
									
									// common name
									let commonName = cSpecies.name;
									
									if (typeof commonName === 'string') {
										addSearchable(commonName);
										birds[commonName] = scientificName;
										
										if (commonName.indexOf('-') > -1) {
											let dashlessName = commonName.replace(/-/g, ' ');
											addSearchable(dashlessName);
											birds[dashlessName] = scientificName;
										}
									}
									else {
										let array = searchables;
										
										for (let i in commonName) {
											let name = commonName[i];
											
											addSearchable(name, array); // all names must be searchable
											birds[name] = scientificName;
											
											array = tertiaries;
										}
										
										commonName = commonName[0];
									}
									
									if (typeof cSpecies.region === 'string') {
										cSpecies.region = [cSpecies.region];
									}
									
									// entry
									
									birds[scientificName] = {
										"binomial": scientificName,
										"common": capitalise(commonName),
										"region": cSpecies.region,
										"size": cSpecies.size
									};
								}
							}
						}
					}
					
					// merge secondaries and tertiaries into searchables
					// https://stackoverflow.com/questions/9650826/append-an-array-to-another-array-in-javascript (large arrays edition)
					for (let key in searchables) {
						let add_to = searchables[key];
						let to_add = secondaries[key];
						
						for (let n = 0; n < to_add.length; n+=300) {
							add_to.push.apply(add_to, to_add.slice(n, n+300));
						}
						
						to_add = tertiaries[key];
						
						for (let n = 0; n < to_add.length; n+=300) {
							add_to.push.apply(add_to, to_add.slice(n, n+300));
						}
					}
					
					// then choose solution
							
					let prng = mulberry32(MODE.hashCode() + new Date().getYear() * 365 + new Date().getMonth() * 69420 + new Date().getDate());
					
					if (top_secret_solution) {
						if (typeof top_secret_solution === 'string') top_secret_solution = entryOf(top_secret_solution);
					} else {
						console.log("e");
						var top_secret_rng = Math.floor(prng() * binomials.length);
						top_secret_solution = entryOf(binomials[top_secret_rng]);
						setDailyCookie("not-the-solution", top_secret_solution.binomial);
					}
					
					// now add stored guesses
					let guessesStored = getDailyCookie("guesses");
					
					if (guessesStored) {
						for (let i = 1; i <= guessesStored; i++) {
							guess(getDailyCookie("guess" + i));
						}
					}
					
					// load sound
					try {
						let splitbinomail = top_secret_solution.binomial.split(" ");//yeah I realised I made a typo once I started typing the next line but it's not that important so no reason to correct it lol
						
						fetch("https://xeno-canto.org/api/2/recordings?query=" + splitbinomail[0] + "+" + splitbinomail[1])
							.then(response2 => response2.json())
							.then(apiJson => {
								if (apiJson.recordings.length > 0) {
									let x = top_secret_solution.binomial == "zosterops lateralis" ? 1 : 0; // the first sound for this bird sounds more like a saddleback? and yet no other bird is declared in metadata.
									
									setSound(apiJson.recordings[x]);
									
									// if alternate recording, add that
									if (apiJson.recordings.length > 1) {
										let changeSoundButton = document.getElementById("changesound");
										changeSoundButton.style.display = "inline";
										
										changeSoundButton.onclick = () => {
											setSound(apiJson.recordings[x + 1]);
											changeSoundButton.style.display = "none";
										};
									}
								}
								else {
									document.getElementById("playsound").innerHTML = "<text style=\"color:red;\">Error: Unable to find Sound Recording!</text>";
								}
							});
					} catch (e) {
						console.log(e);
						document.getElementById("playsound").innerHTML = "<text style=\"color:red;\">Error: Fatal error while retrieving sound recording. :(</text>";
					}
				}
				catch (e) {
					document.getElementById("game").innerHTML = "Error initialising game: " + e;
				}
			});

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

		function maybeenter(event, buttony) {
			try {
				let textbox = document.getElementById("bird-entry");
				
				if (buttony || event.keyCode == 13) {
					let term = textbox.value.toLowerCase();
					let guessno = guess(term);

					if (guessno) {
						textbox.value = "";
						setDailyCookie("guesses", MAX_GUESSES - guesses_left);
						setDailyCookie("guess" + guessno, term);
					}
				}
			} catch (e) {
				document.getElementById("game").innerHTML = "Error while guessing bird: " + e + "\n" + e.stack;
			}
		}

		function guess(term) {
			let entry = entryOf(term);

			if (entry == undefined) {
				// unknown bird
				return 0;
			}
			else {
				resettopresults();
				
				binomial_split = entry.binomial.split(" ");
				binomial2_split = top_secret_solution.binomial.split(" ");

				let family1 = families[binomial_split[0]];
				let family2 = families[binomial2_split[0]];
				
				let variation = Math.abs(entry.size - top_secret_solution.size);
				let species_similarity = similarity(binomial_split[0], binomial_split[1], binomial2_split[0], binomial2_split[1]);
				
				let section_2b3 = family1 in family_names ? (family_names[family1] + entry_2c + capitalise(family1) + entry_2d) : capitalise(family1); // either just the scientific name or the common and scientific names, depending on whether the common name is present.

				// Add a new element to the document
				let newElement = entry_0 + species_similarity + entry_0b + entry.common + entry_1 + entry.binomial + entry_2 + similarity(family1, orders[family1], family2, orders[family2]) + entry_2b + section_2b3 + entry_3;
				
				for (let region_i in entry.region) {
					let region = entry.region[region_i];
					let similar_region = top_secret_solution.region.includes(region);
					
					newElement += `<img width=32 src="icons/` + region + (similar_region ? "-y" : "") + `.png"/>`;
				}
				
				newElement += entry_4 + (variation == 0 ? "every60secondsinafricaaminutepasses" : (variation < 5 ? "nearly" : "")) + entry_4b + (variation == 0 ? "" : (entry.size < top_secret_solution.size ? "&#9650; " : "&#9660; ")) + entry.size + entry_5;
				
				document.getElementById("guesses").innerHTML += newElement;
				// ================================
				
				document.getElementById("guesses-left").innerText = (--guesses_left) + (guesses_left == 1 ? " Guess Left": " Guesses Left");
				
				if (guesses_left == 0 || species_similarity == "every60secondsinafricaaminutepasses") {
					document.getElementById("bird-entry").remove();
					document.getElementById("submit").remove();
					document.getElementById("title").classList.add("faded");
					
					setTimeout(function() {
						document.getElementById("title").innerText = top_secret_solution.common + " (" + top_secret_solution.binomial + ")";
						document.getElementById("title").style.color = species_similarity == "every60secondsinafricaaminutepasses" ? "#33CC22" : "#CC3311";
					}, 1000);
				}
				
				return MAX_GUESSES - guesses_left;
			}
		}

		function familyOf(binomial) {
			let familyScientific = families[entry.binomial.split(" ")[0]];

			return (familyScientific in family_names) ? family_names[familyScientific] : familyScientific;
		}

		var last = "";

		function addtopresults(event) {
			let search = document.getElementById("bird-entry").value.toLowerCase();
			
			if (event.keyCode == 13) return;
			
			if (search != last) { // check stuff has changed
				last = search;
				
				let searchResults = "";
				
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
							
							searchResults += `<div class="searchable searchy" onclick="autocomplete('`;
							searchResults += capitalise(term == entry.binomial ? entry.binomial : entry.common);
							searchResults += `')">`;
							searchResults += entry.common + " (" + entry.binomial + ")" + "<div></div><span class=\"scientific-name\">" + familyOf(entry.binomial) + "</span><span class=\"not-scientific-name\"> &bull; "; // using scientific-name class for family to use similar formatting
							
							for (let region_i in entry.region) {
								searchResults += `<img width=16 src="icons/` + entry.region[region_i] + `.png"/>`;
							}
							
							searchResults += `</span></div>`;
						}
					}
				}
				
				document.getElementById("results").innerHTML = searchResults;
			}
		}

		function resettopresults() {
			document.getElementById("results").innerHTML = "";
		}
		// ENDRESETME

		function autocomplete(e) {
			document.getElementById("bird-entry").value = e;
			resettopresults();
		}
		
		var matchPrevious = undefined; // haha tristate

		function onresize() {
			let match = window.matchMedia("(max-width: 1100px)").matches;
			
			if (match != matchPrevious) {
				matchPrevious = match;

				if (match) {
					document.getElementById("spacing-hax").innerHTML = "Family";
				}
				else {
					//console.log("fluffy cute cats");
					document.getElementById("spacing-hax").innerHTML = "Family &nbsp; &nbsp; &nbsp;";
				}
			}
		}

		// website-load setup
		resettopresults();
		onresize();

		window.addEventListener('resize', function(e) {
			onresize();
		}, true);
	}
	else {
		document.getElementById("game").innerHTML = `
		<h2>Select a Mode</h2>
		<div style="margin-top:10px;font-size:18px;">Loading Game Modes...
		`;
		document.getElementById("how-2-play-stoppa").style.display = "none";
		
		fetch("birds.json")
			.then(response => response.json())
			.then(json => {
				let selection = `<h2>Select a Mode</h2>
				<div style="margin-top:10px;"><a href="?mode=world">All Birds</a></div>
				`;
				
				for (mode in json.collections) {
					selection += `<div style="margin-top:10px;"><a href="?mode=` + mode + `">` + json.collections[mode].name + `</a></div>`;
				}
				
				document.getElementById("game").innerHTML = selection;
			});
	}
}
catch (e) {
	document.getElementById("game").innerHTML = "Error while running birdle: " + e + "\n" + e.stack;
}