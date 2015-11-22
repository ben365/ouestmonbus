"use strict";

var fs = require("fs");
var _ = require("underscore");
var request = require("request")

var url = "https://data.explore.star.fr/api/records/1.0/search?dataset=mkt-information-documents-td&rows=5000&refine.idtype=HLI";

var baseurl = "https://data.explore.star.fr/explore/dataset/mkt-information-documents-td/files/"; //+/download/"

request({
	url: url,
	json: true
}, function(error, response, body) {

	if (!error && response.statusCode === 200) {
		var response = {};
		_.each(body, function(fiche) {
			var r = _.pluck(fiche, 'fields');
			_.each(r, function(item) {
				if (!_.isUndefined(item)) {
					response[item.idligne] = baseurl + item.file.id +"/download/";
				}
			});
		});
		fs.writeFile("../img_url.json", JSON.stringify(response), function(err) {
			if (err) {
				return console.log(err);
			}
			console.log("The file img_url.json was saved!");
		});
	}
});