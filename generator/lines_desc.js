"use strict";


var fs = require("fs");
var _ = require("underscore");

var GTFSFileToArray = function(filename, callback) {
	var readline = require("readline");

	var result = [];
	var header = [];
	var curLineInFile = 0;

	readline.createInterface({
		input: fs.createReadStream(filename),
		terminal: false
	}).on("line", function(line) {
		if (curLineInFile === 0) {
			header = line.split(",");
		} else {
			var values = _.map(line.split(","), function(element) {
				return element.replace(/"/g, "");
			});
			var lineObject = _.object(header, values);
			result.push(lineObject);
		}
		curLineInFile++;
	}).on("close", function() {
		callback(result);
	});
};

var result = {};

new GTFSFileToArray("../images/picto/22/metadata.csv", function(ligne_desc) {

	console.log(typeof(ligne_desc));

	_.each(ligne_desc,function(value, key, list)
	{
		console.log(value);
		// var info = {};
		// info.nomcourtligne = item.nomcourtligne;
		// info.image = item.image;		
		// result[item.idligne] = info;
	});

});
