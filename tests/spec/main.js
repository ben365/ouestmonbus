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


  describe("Tests infos traffic", function() {
    describe("parsing du texte", function() {

      var trafficInfo;

      beforeAll(function() {
        trafficInfo = new InfosTrafics(new OuestmonbusApp());
        trafficInfo.linesPicto = {
          "1": "0001.png",
          "2": "0002.png",
          "3": "0003.png",
          "5": "0005.png",
          "6": "0006.png",
          "8": "0008.png",
          "9": "0009.png",
          "11": "0011.png",
          "12": "0012.png",
          "14": "0014.png",
          "31": "0031.png",
          "32": "0032.png",
          "33": "0033.png",
          "34": "0034.png",
          "35": "0035.png",
          "36": "0036.png",
          "37": "0037.png",
          "40": "0040.png",
          "41": "0041.png",
          "44": "0044.png",
          "50": "0050.png",
          "51": "0051.png",
          "52": "0052.png",
          "53": "0053.png",
          "54": "0054.png",
          "55": "0055.png",
          "56": "0056.png",
          "57": "0057.png",
          "59": "0059.png",
          "61": "0061.png",
          "63": "0063.png",
          "64": "0064.png",
          "65": "0065.png",
          "67": "0067.png",
          "68": "0068.png",
          "70": "0070.png",
          "71": "0071.png",
          "72": "0072.png",
          "73": "0073.png",
          "74": "0074.png",
          "75": "0075.png",
          "76": "0076.png",
          "77": "0077.png",
          "78": "0078.png",
          "79": "0079.png",
          "81": "0081.png",
          "82": "0082.png",
          "91": "0091.png",
          "94": "0094.png",
          "95": "0095.png",
          "96": "0096.png",
          "150": "0150.png",
          "151": "0151.png",
          "152": "0152.png",
          "153": "0153.png",
          "154": "0154.png",
          "155": "0155.png",
          "156": "0156.png",
          "157": "0157.png",
          "159": "0159.png",
          "161": "0161.png",
          "164": "0164.png",
          "167": "0167.png",
          "168": "0168.png",
          "172": "0172.png",
          "173": "0173.png",
          "200": "0200.png",
          "201": "0201.png",
          "202": "0202.png",
          "203": "0203.png",
          "204": "0204.png",
          "205": "0205.png",
          "206": "0206.png",
          "207": "0207.png",
          "208": "0208.png",
          "209": "0209.png",
          "210": "0210.png",
          "211": "0211.png",
          "212": "0212.png",
          "213": "0213.png",
          "214": "0214.png",
          "215": "0215.png",
          "216": "0216.png",
          "217": "0217.png",
          "220": "0220.png",
          "221": "0221.png",
          "222": "0222.png",
          "223": "0223.png",
          "224": "0224.png",
          "225": "0225.png",
          "226": "0226.png",
          "227": "0227.png",
          "228": "0228.png",
          "229": "0229.png",
          "230": "0230.png",
          "231": "0231.png",
          "232": "0232.png",
          "233": "0233.png",
          "234": "0234.png",
          "235": "0235.png",
          "236": "0236.png",
          "237": "0237.png",
          "238": "0238.png",
          "239": "0239.png",
          "240": "0240.png",
          "398": "0398.png",
          "399": "0399.png",
          "A": "LA.png",
          "API": "0803.png",
          "C4": "0004.png",
          "KL": "0158.png",
          "SDN1": "0121.png",
          "SDN2": "0122.png",
          "STADE": "0806.png",
          "STN": "0805.png",
          "Ts1": "0301.png",
          "Ts10": "0310.png",
          "Ts11": "LTs11.png",
          "Ts12": "LTs12.png",
          "Ts2": "0302.png",
          "Ts3": "0303.png",
          "Ts31": "0331.png",
          "Ts32": "0332.png",
          "Ts33": "0333.png",
          "Ts34": "0334.png",
          "Ts35": "0335.png",
          "Ts36": "0336.png",
          "Ts37": "0337.png",
          "Ts38": "0338.png",
          "Ts4": "0304.png",
          "Ts41": "0341.png",
          "Ts42": "0342.png",
          "Ts43": "0343.png",
          "Ts44": "0344.png",
          "Ts45": "0345.png",
          "Ts46": "0346.png",
          "Ts5": "0305.png",
          "Ts51": "0351.png",
          "Ts53": "0353.png",
          "Ts54": "0354.png",
          "Ts55": "0355.png",
          "Ts56": "0356.png",
          "Ts58": "LTs58.png",
          "Ts6": "0306.png",
          "Ts61": "0361.png",
          "Ts65": "0365.png",
          "Ts7": "0307.png",
          "Ts71": "0371.png",
          "Ts72": "0372.png",
          "Ts8": "0308.png",
          "Ts81": "0381.png",
          "Ts82": "0382.png",
          "Ts9": "0309.png",
          "TTZ": "0804.png"
        };
      });

      it("picto 5", function() {
        var expected = "<img src='./images/picto/22/0001.png' height='22' width='22' alt='1' style='margin-right:2px;'>";
        expect(trafficInfo.getPictoHtml("1")).toEqual(expected);
      });

      it("picto C4", function() {
        var expected = "<img src='./images/picto/22/0004.png' height='22' width='22' alt='C4' style='margin-right:2px;'>";
        expect(trafficInfo.getPictoHtml("C4")).toEqual(expected);
      });

      it("picto 14", function() {
        var expected = "<img src='./images/picto/22/0014.png' height='22' width='22' alt='14' style='margin-right:2px;'>";
        expect(trafficInfo.getPictoHtml("14")).toEqual(expected);
      });

      it("picto 76", function() {
        var expected = "<img src='./images/picto/22/0076.png' height='22' width='22' alt='76' style='margin-right:2px;'>";
        expect(trafficInfo.getPictoHtml("76")).toEqual(expected);
      });

      it("ligne temporaire", function() {
        var expected = "ligne temporaire";
        expect(trafficInfo.formatDetail("ligne temporaire")).toEqual(expected);
      });

      it("ligne 14", function() {
        var expected = "<img src='./images/picto/22/0014.png' height='22' width='22' alt='14' style='margin-right:2px;'>";
        expect(trafficInfo.formatDetail("ligne 14 ")).toEqual(expected);
      });

      it("ligne 59", function() {
        var expected = "<img src='./images/picto/22/0059.png' height='22' width='22' alt='59' style='margin-right:2px;'>";
        expect(trafficInfo.formatDetail("ligne 59 ")).toEqual(expected);
      });
      it("ligne 41", function() {
        var expected = "<img src='./images/picto/22/0041.png' height='22' width='22' alt='41' style='margin-right:2px;'>";
        expect(trafficInfo.formatDetail("ligne 41 ")).toEqual(expected);
      });
      it("ligne 41express", function() {
        var expected = "<img src='./images/picto/22/0041.png' height='22' width='22' alt='41' style='margin-right:2px;'>";
        expect(trafficInfo.formatDetail("ligne 41express ")).toEqual(expected);
      });

      it("ligne c4", function() {
        var expected = "<img src='./images/picto/22/0004.png' height='22' width='22' alt='C4' style='margin-right:2px;'>";
        expect(trafficInfo.formatDetail("ligne c4 ")).toEqual(expected);
      });

      it("Ligne 14 vers Stade Rennais", function() {
        var expected = "<img src='./images/picto/22/0014.png' height='22' width='22' alt='14' style='margin-right:2px;'> vers Stade Rennais";
        expect(trafficInfo.formatDetail("Ligne 14 vers Stade Rennais")).toEqual(expected);
      });

      it("ligne 5", function() {
        var expected = "<img src='./images/picto/22/0005.png' height='22' width='22' alt='5' style='margin-right:2px;'>";
        expect(trafficInfo.formatDetail("ligne 5 ")).toEqual(expected);
      });

      it("ligne 8 double espace avant", function() {
        var expected = "<img src='./images/picto/22/0008.png' height='22' width='22' alt='8' style='margin-right:2px;'>";
        expect(trafficInfo.formatDetail("ligne  8 ")).toEqual(expected);
      });

      it("Ligne 5", function() {
        var expected = "<img src='./images/picto/22/0005.png' height='22' width='22' alt='5' style='margin-right:2px;'>";
        expect(trafficInfo.formatDetail("ligne 5 ")).toEqual(expected);
      });

      it("ligne C4", function() {
        var expected = "<img src='./images/picto/22/0004.png' height='22' width='22' alt='C4' style='margin-right:2px;'>";
        expect(trafficInfo.formatDetail("ligne C4 ")).toEqual(expected);
      });

      it("Ligne C4", function() {
        var expected = "bonjour <img src='./images/picto/22/0004.png' height='22' width='22' alt='C4' style='margin-right:2px;'> parti";
        expect(trafficInfo.formatDetail("bonjour ligne C4 parti")).toEqual(expected);
      });

      it("Ligne 2", function() {
        var expected = "bonjour <img src='./images/picto/22/0002.png' height='22' width='22' alt='2' style='margin-right:2px;'> parti";
        expect(trafficInfo.formatDetail("bonjour lignes 2 parti")).toEqual(expected);
      });

      it("bonjour les lignes C4 5 76 sont OK", function() {
        var expected = "bonjour les <img src='./images/picto/22/0004.png' height='22' width='22' alt='C4' style='margin-right:2px;'>" +
          "<img src='./images/picto/22/0005.png' height='22' width='22' alt='5' style='margin-right:2px;'>" +
          "<img src='./images/picto/22/0076.png' height='22' width='22' alt='76' style='margin-right:2px;'> sont OK";
        expect(trafficInfo.formatDetail("bonjour les lignes C4 5 76 sont OK")).toEqual(expected);
      });


      it("Lignes 56 C4 5 puis les Lignes 12 2 8 sont OK", function() {
        var expected = "" +
          "<img src='./images/picto/22/0056.png' height='22' width='22' alt='56' style='margin-right:2px;'>" +
          "<img src='./images/picto/22/0004.png' height='22' width='22' alt='C4' style='margin-right:2px;'>" +
          "<img src='./images/picto/22/0005.png' height='22' width='22' alt='5' style='margin-right:2px;'> puis les " +
          "<img src='./images/picto/22/0012.png' height='22' width='22' alt='12' style='margin-right:2px;'>" +
          "<img src='./images/picto/22/0002.png' height='22' width='22' alt='2' style='margin-right:2px;'>" +
          "<img src='./images/picto/22/0008.png' height='22' width='22' alt='8' style='margin-right:2px;'> sont OK";
        expect(trafficInfo.formatDetail("Lignes 56 C4 5 puis les Lignes 12 2 8 sont OK")).toEqual(expected);
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
