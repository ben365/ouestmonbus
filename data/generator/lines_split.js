"use strict";

var fs = require("fs");
var _ = require("underscore");
var tj = require('togeojson');
var jsdom = require('jsdom').jsdom;

var obj;
fs.readFile('../geo/reseau_star_kml_wgs84/donnees/star_ligne_itineraire.kml', 'utf8', function(err, data) {
	if (err) throw err;

	var kml = jsdom(data);
	var geojsonobj = tj.kml(kml);
	_.each(_.values(geojsonobj), function(item) {
		_.each(_.values(item), function(child) {
			var id = child.properties['ITI_CODE'];

			fs.writeFile("../geo/lines/raw/" + id + ".geojson", JSON.stringify(child), function(err) {
				if (err) {
					return console.log(err);
				}
				console.log("The file ../geo/lines/raw/" + id + ".geojson was saved!");
			});
		});
	});
});