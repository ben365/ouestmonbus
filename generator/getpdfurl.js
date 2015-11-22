"use strict";

var fs = require("fs");
var request = require("request");
var cheerio = require("cheerio");
var _ = require("underscore");

var gotHTML = function(err, resp, html) {
	if (err) return console.error(err);
	var parsedHTML = cheerio.load(html);

	var all_img = parsedHTML("img");

	all_img = _.filter(all_img, function(item) {
		if (_.has(item.attribs, "height") && _.has(item.attribs, "width")) {
			if (Number(item.attribs.height) === 22 && Number(item.attribs.width) === 22) {
				return true;
			}
		}
		return false;
	});

	var result = {};

	_.each(all_img, function(element) {
		var img_file_array = element.attribs.src.split("/");
		var img_file = img_file_array[img_file_array.length - 1];

		if (!_.isUndefined(element.parent.attribs.href)) {
			result[img_file] = "http://www.star.fr/" + element.parent.attribs.href;
		}
	});

	var filename = "../img_url.json";
	fs.writeFile(filename, JSON.stringify(result), function(err) {
		if (err) {
			return console.log(err);
		}
		console.log("The file " + filename + "stations.geojson" + " was saved!");
	});
};

var domain = "http://www.star.fr/fr/se-deplacer/horaires/de-votre-ligne.html";
request(domain, gotHTML);