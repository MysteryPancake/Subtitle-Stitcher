"use strict"

let player;
let id = "";
let index = 0;
let matches = [];
let findWords = [];
let playing = true;

function validateYouTubeURL(url) {
	if (url === undefined || url === "") {
		alert("Empty URL!");
	} else {
		const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/);
		if (match && match[2].length === 11) {
			return match[2];
		} else {
			alert("Invalid URL!");
		}
	}
};

function removeChildren(node) {
	while (node.hasChildNodes()) {
		node.removeChild(node.firstChild);
	}
};

function makeFound() {
	const found = document.createTextNode("Found: ");
	document.getElementById("form").appendChild(found);
};

function stringContains(haystack, needle) {
	return haystack.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
};

function playMatch(start, dur) {
	player.loadVideoById({
		"videoId": id,
		"startSeconds": start,
		"endSeconds": parseFloat(start) + parseFloat(dur)
	});
};

function makeWord(str, start, dur) {
	const word = document.createElement("input");
	word.setAttribute("class", "btn-small");
	word.setAttribute("type", "button");
	word.setAttribute("value", str);
	word.addEventListener("click", function() {
		playMatch(start, dur);
		playing = false;
	});
	document.getElementById("form").appendChild(word);
};

function parseXML(xml) {
	for (let i = 0; i < findWords.length; i++) {
		matches[findWords[i]] = [];
	}
	const sentences = xml.getElementsByTagName("text");
	for (let i = 0; i < sentences.length; i++) {
		for (let j = 0; j < findWords.length; j++) {
			const sentence = sentences[i].childNodes[0].nodeValue;
			if (stringContains(sentence, findWords[j])) {
				const word = findWords[j];
				const start = sentences[i].getAttribute("start");
				const dur = sentences[i].getAttribute("dur");
				matches[word].push({start, dur});
				makeWord(word, start, dur);
			}
		}
	}
};

function makePlayer() {
	const player = document.createElement("div");
	player.id = "player";
	document.getElementById("form").appendChild(player);
	const tag = document.createElement("script");
	tag.src = "https://www.youtube.com/iframe_api";
	const firstScriptTag = document.getElementsByTagName("script")[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};

function arrayRandom(array) {
	return array[Math.floor(Math.random() * array.length)];
};

function playNextRandom() {
	let array = matches[findWords[index]];
	while (index < findWords.length && array.length === 0) {
		index++;
		array = matches[findWords[index]];
	}
	if (index < findWords.length) {
		const random = arrayRandom(array);
		playMatch(random.start, random.dur);
		index++;
	} else {
		playing = false;
	}
};

function playNewRandom() {
	index = 0;
	playing = true;
	playNextRandom();
};

function makeRandom() {
	const random = document.createElement("input");
	random.setAttribute("class", "btn-large");
	random.setAttribute("type", "button");
	random.setAttribute("value", "Play Random Sequence");
	random.addEventListener("click", playNewRandom);
	document.getElementById("form").appendChild(random);
};

function stitchSubtitles() {
	findWords = document.getElementById("message").value.split(" ");
	id = validateYouTubeURL(document.getElementById("url").value);
	removeChildren(document.getElementById("form"));
	const request = new XMLHttpRequest();
	request.open("GET", "https://www.youtube.com/api/timedtext?lang=en&v=" + id, true);
	request.onreadystatechange = function(e) {
		if (this.readyState === 4) {
			if (this.status === 200) {
				makeFound();
				parseXML(this.responseXML);
				makePlayer();
				makeRandom();
			} else {
				alert("Couldn't retrieve subtitles!");
			}
		}
	};
	request.send();
	return false;
};

function onYouTubeIframeAPIReady() {
	player = new YT.Player("player", {
		width: "100%",
		playerVars: {
			"cc_load_policy": 3,
			"controls": 0,
			"disablekb": 1,
			"iv_load_policy": 3,
			"modestbranding": 1,
			"rel": 0,
			"showinfo": 0
		},
		events: {
			"onReady": playNewRandom,
			"onStateChange": onPlayerStateChange
		},
	});
};

function onPlayerStateChange(e) {
	if (e.data === YT.PlayerState.ENDED && playing) {
		playNextRandom();
	}
};