describe("Ouestmonbus", function() {

  var app;

  beforeAll(function() {
    app = new OuestmonbusApp();
    app.init();
  });

  describe("Etat de la carte", function() {
    describe("La carte a été intialisée", function() {

      it("l'objet map doit pas être null", function() {
        expect(app.map).toEqual(jasmine.anything());
      });

      // it("sur echec de localisation la carte doit est au centre ", function() {
      //   app.localisation.onLocationError();
      //   expect(app.map.getCenter().equals(app.map.DEFAULT_POSITION)).toEqual(true);
      // });
    });
  });

  describe("Classe Localization", function() {
    describe("conversion URL vide/erroné en L.latLng", function() {

      it("doit retourner null", function() {
        expect(app.localisation.urlToZoomLatLng("")).toEqual(null);
        expect(app.localisation.urlToZoomLatLng("/#nimportequoi")).toEqual(null);
      });
    });

    describe("#map=17/48.10933/-1.67803", function() {

      it("ne doit pas retourner null", function() {
        expect(app.localisation.urlToZoomLatLng("#map=17/48.10933/-1.67803")).toEqual(jasmine.anything());
      });


      it("doit retourner un zoom de 17", function() {
        expect(app.localisation.urlToZoomLatLng("#map=17/48.10933/-1.67803")[0]).toEqual(17);
      });

      it("doit retourner lat == 48.10933", function() {
        expect(app.localisation.urlToZoomLatLng("#map=17/48.10933/-1.67803")[1].lat).toEqual(48.10933);
      });

      it("doit retourner lng == -1.67803", function() {
        expect(app.localisation.urlToZoomLatLng("#map=17/48.10933/-1.67803")[1].lng).toEqual(-1.67803);
      });

    });
  });

  describe("Tests fonctionnels", function() {
    describe("Quand on ouvre l'application", function() {

      // it("l'url doit être analysée", function() {
      //   window.location.hash = "#map=17/48.10496/-1.5875";
      //   spyOn(app.localisation, 'urlToZoomLatLng');
      //   app.start();
      //   expect(app.localisation.urlToZoomLatLng).toHaveBeenCalled();
      // });

      it("les stations doivent être chargées", function() {
        window.location.hash = "#map=17/48.10496/-1.5875";
        spyOn(app, 'getAllTodayStationsData');

        app.start();
        expect(app.getAllTodayStationsData).toHaveBeenCalled();
      });

    });

  });


  describe("Tests filtres affichage stations", function() {

    it("22h26 entre 07:00 et 08:00", function() {
      expect(app.stationTimeFilter(moment("2015-08-18 22:26:16.123+02:00"), ["07:00:00", "08:00:00"])).toEqual(false);
    });
    it("7h26 entre 07:00 et 08:00", function() {
      expect(app.stationTimeFilter(moment("2015-08-18 07:26:16.123+02:00"), ["07:00:00", "08:00:00"])).toEqual(true);
    });
    it("7h26 entre 07:00 et 24:00", function() {
      expect(app.stationTimeFilter(moment("2015-08-18 07:26:16.123+02:00"), ["07:00:00", "24:00:00"])).toEqual(true);
    });
    it("24h23 entre 07:00 et 25:00", function() {
      expect(app.stationTimeFilter(moment("2015-08-19 00:23:16.123+02:00"), ["07:00:00", "25:00:00"])).toEqual(true);
    });
    it("00h23 entre 07:00 et 25:00", function() {
      expect(app.stationTimeFilter(moment("2015-08-18 00:23:16.123+02:00"), ["07:00:00", "25:00:00"])).toEqual(true);
    });
    it("01h23 entre 07:00 et 24:30", function() {
      expect(app.stationTimeFilter(moment("2015-08-18 01:23:16.123+02:00"), ["07:00:00", "24:30:00"])).toEqual(false);
    });
    it("01h23 entre 23:00 et 25:40", function() {
      expect(app.stationTimeFilter(moment("2015-08-19 01:23:16.123+02:00"), ["23:00:00", "25:40:00"])).toEqual(true);
    });
    it("01h23 entre 00:05 et 07:40", function() {
      expect(app.stationTimeFilter(moment("2015-08-19 01:23:16.123+02:00"), ["00:05:00", "07:40:00"])).toEqual(true);
    });
  });

  describe("Tests l'url des données de stations", function() {
    it("Tue Aug 06 2015 22:26:16 GMT+0200", function() {
      expect(app.getDataStationPath(moment("2015-08-06T22:26:16.196+0200"))).toEqual("./data/today/2015-08-06/stations.geojson");
    });
    it("Tue Aug 23 2015 22:26:16 GMT+0200", function() {
      expect(app.getDataStationPath(moment("2015-08-23T22:26:16.196+0200"))).toEqual("./data/today/2015-08-23/stations.geojson");
    });
    it("Tue Aug 26 2015 01:26:16 GMT+0200", function() {
      expect(app.getDataStationPath(moment("2015-08-26T01:26:16.196+0200"))).toEqual("./data/today/2015-08-25/stations.geojson");
    });
    it("Tue Aug 26 2015 05:26:16 GMT+0200", function() {
      expect(app.getDataStationPath(moment("2015-08-26T05:26:16.196+0200"))).toEqual("./data/today/2015-08-26/stations.geojson");
    });
  });


});
