"use strict";

var fs = require("fs");
var request = require("request");
var _ = require("underscore");

console.log("Récupération des dernières données GTFS");

/**
 * Décompresse les fichiers GTFS
 * @param  {string} filename - fichier zip
 * @param  {Date} date - date ajouté en préfixe du nom de fichier
 */
var decompressZip = function(filename, date) {
  console.log("decompress " + filename + " date:" + date);
  var DecompressZip = require("decompress-zip");
  var unzipper = new DecompressZip(filename);

  unzipper.on("error", function(err) {
    console.log("Caught an error" + err);
  });

  unzipper.on("extract", function() {
    console.log("Finished extracting");
  });

  unzipper.on("progress", function(fileIndex, fileCount) {
    console.log("Extracted file " + (fileIndex + 1) + " of " + fileCount);
  });

  unzipper.extract({
    path: "../data/GTFS/" + date.toISOString().split("T")[0]
  });
};

/**
 * Télécharge le fichier zip des GTFS
 * @param  {string} url - url du fichier zip
 * @param  {Date} feeddate  -  date de publication du zip
 * @param  {Date} gtfsstartdate - date de début des données GTFS
 * @param  {string} description - description du GTFS
 */
var downloadGTFSZip = function(url, feeddate, gtfsstartdate, description) {
  var filename = "../data/downloads/" + feeddate.toISOString() + "_" + url.split("/")[url.split("/").length - 1];
  //console.log(url + " -> " + filename)

  // test si le fichier existe déjà.
  try {
    fs.lstatSync(filename);
    //console.log(filename + " est déjà téléchargé")
  } catch (e) {
    if (e.code === "ENOENT") {
      console.log("téléchargement de " + description);
      var r = request(url);

      r.on("response", function(res) {
        res.pipe(fs.createWriteStream(filename));
      });

      r.on("end", function() {
        console.log(filename + " saved");
        setTimeout(function(filename, gtfsstartdate) {
          decompressZip(filename, new Date(gtfsstartdate));
        }.bind(this, filename, gtfsstartdate), 5000);
      });
    } else {
      console.log(e);
    }
  }
};

/**
 * Parse le flux des dernier GTFS disponible
 */
var getLastGTFS = function() {

  var url = "https://data.explore.star.fr/api/records/1.0/search/?dataset=tco-busmetro-horaires-gtfs-versions-td"

  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var obj = JSON.parse(body);
      _.each(obj.records, function(res) {
        console.log(res.fields.publication)
        downloadGTFSZip(res.fields.url, new Date(res.fields.publication), res.fields.debutvalidite, res.fields.description);
      });
    }
  });
}

getLastGTFS();