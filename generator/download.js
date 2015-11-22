"use strict";

var fs = require("fs");
var request = require("request");

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
          decompressZip(filename, gtfsstartdate);
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
  var FeedParser = require("feedparser");

  var options = {
    url: "https://data.keolis-rennes.com/fileadmin/OpenDataFiles/GTFS/feed",
    strictSSL: false
  };

  var req = request(options);
  var feedparser = new FeedParser();

  req.on("error", function(error) {
    console.log("Erreur lors de la récupération du flux ATOM" + error);
  });

  req.on("response", function(res) {
    var stream = this;

    if (res.statusCode != 200) return this.emit("error", new Error("Bad status code lors de la récupération du flux ATOM"));

    stream.pipe(feedparser);
  });


  feedparser.on("error", function(error) {
    console.log("Erreur de parsing du flux" + error);
  });

  feedparser.on("readable", function() {
    var stream = this;
    var item;

    while ((item = stream.read()) !== null) {
      if (typeof(item.enclosures) === "object") {
        if (item.enclosures[0].type === "application/zip") {
          var feeddate = new Date(item["atom:updated"]["#"]);
          var gtfsstartdate = new Date(item["gtfs:start"]["#"]);
          downloadGTFSZip(item.enclosures[0].url, feeddate, gtfsstartdate, item.description);
        }
      }
    }
  });
};

getLastGTFS();
