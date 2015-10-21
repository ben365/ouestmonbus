"use strict";

var fs = require("fs");
var _ = require("underscore");
var request = require("request");
var mkdirp = require("mkdirp");

var url = "https://data.explore.star.fr/api/records/1.0/search?dataset=tco-bus-topologie-lignes-td&rows=200";

var ligne_content = {};
ligne_content.nomcourt = "";
ligne_content.couleur = "";

var createGeojson = function(idligne,parcours,nomcourt,couleur,sens)
{
	var dirname = "../geo/lines/" + idligne + "/";
	mkdirp(dirname, function(err) {
		if (err) {
			console.error(err);
		}
		else
		{
			try
			{
				var line_data = fs.readFileSync("../geo/lines/raw/"+parcours+".geojson", "utf8");
				var geojson = JSON.parse(line_data);
				geojson.properties = _.omit(geojson.properties, ["description","ITI_CODE","ITI_SENS","LI_SSTYPE","LI_TYPE","ITI_NOM","LI_D_ACCES","LI_NUM"]);
				geojson.properties.idligne = idligne;
				geojson.properties.nomcourt = nomcourt;
				geojson.properties.couleurligne = couleur;

				fs.writeFile(dirname+sens+".geojson", JSON.stringify(geojson), function(err) {
					if (err) {
						return console.log(err);
					}
					else
					{
						console.log(dirname+sens+".geojson was saved!");
					}
				});
			}
			catch(e)
			{
				console.log("no data for line "+idligne+ " with parcours " + parcours + " sens "+sens);
				fs.writeFile(dirname+sens+".geojson", '{"type":"FeatureCollection","features":[]}', function(err) {
					if (err) {
						return console.log(err);
					}
					else
					{
						console.log(dirname+sens+".geojson was saved!");
					}
				});
			}
		}
	});
};

request({
	url: url,
	json: true
}, function(error, response, body) {

	if (!error && response.statusCode === 200) {

		_.each(body, function(lignes) {
			var r = _.pluck(lignes, "fields");
			_.each(r, function(item) {
				if (!_.isUndefined(item)) {
					createGeojson(item.id,item.idparcoursprincipalaller,item.nomcourt,item.couleurligne,"aller");
					item.idparcoursprincipalretour = item.idparcoursprincipalretour.replace("-R","-B");
					createGeojson(item.id,item.idparcoursprincipalretour,item.nomcourt,item.couleurligne,"retour");
				}
			});
		});
	}
});

