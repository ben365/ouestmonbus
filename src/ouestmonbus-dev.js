/**
 * @file ouestmonbus.com main source file.
 * 
 * @copyright Benoît Simon Meunier 2015-2017
 * 
 * @license
 * ouestmonbus.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * ouestmonbus.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ouestmonbus.com.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

var STATION_CONTENT_REFRESH = 2 * 60 * 1000;
var STATION_LIST_REFRESH = 4 * 60 * 1000;

///////////////////////////////////////////////////////////////////////////////
///////////////////////// Classe OuestmonbusApp////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Classe principale de l'application.
 * 
 * @constructor
 */
function OuestmonbusApp() {

	this.localstoragePermitted = false;
	try {
		localStorage.setItem("localStorage", 1);
		localStorage.removeItem("localStorage");
		this.localstoragePermitted = true;
	} catch (e) {}

	this.map = null;
	this.localisation = null;
	this.infostrafics = null;

	this.img_url_localcache_moment = this.getLocalStorage("img_url_localcache_moment");
	this.img_url = JSON.parse(this.getLocalStorage("img_url_localcache"));

	this.needHelp = this.getLocalStorage("alreadyDisplayHelp") === null;
	this.firstdisplayRetardHelp = this.getLocalStorage("alreadyDisplayRetardHelp") === null;
	this.firstdisplayNoBusHelp = this.getLocalStorage("alreadyDisplayNoBusHelp") === null;

	this.allStationsDataPath = this.getLocalStorage("allStationsDataPath");
	this.allStationsDataCache = JSON.parse(this.getLocalStorage("allStationsDataCache"));

	this.refreshAllStationsTimer = null;
	this.refreshStationTimer = null;
	this.refreshBusPositionTimer = null;

	this.firstStationDisplaySession = true;
	this.stationFoundInCenter = null;

	this.refreshCurrentStationTimer = null;

	this.markerCurrentDisplay = null;
	this.dialogCurrentDisplay = null;

	this.lines_layers = [];

	this.bus_group_layer = L.layerGroup();
	this.bus_station_origin = null;

	this.last_lignes_selected = [];
	this.last_ligne_bus_fetch = null;

	this.waitSpinner = null;
	this.waitSpinnerDisplayed = false;

	this.progressbar = null;
	this.hash_change_from_move = false;

	this.md = new MobileDetect(window.navigator.userAgent);
}

OuestmonbusApp.prototype.getLocalStorage = function(key) {
	if (this.localstoragePermitted) {
		return localStorage.getItem(key);
	} else {
		return null;
	}
};

OuestmonbusApp.prototype.setLocalStorage = function(key, value) {
	if (this.localstoragePermitted) {
		try {
			localStorage.setItem(key, value);
		} catch (e) {}
	}
};

OuestmonbusApp.prototype.cleanLocalStorage = function() {
	try {
		localStorage.removeItem("img_url_localcache_moment");
		localStorage.removeItem("img_url_localcache");
		localStorage.removeItem("alreadyDisplayHelp");
		localStorage.removeItem("alreadyDisplayRetardHelp");
		localStorage.removeItem("alreadyDisplayNoBusHelp");
		localStorage.removeItem("allStationsDataPath");
		localStorage.removeItem("allStationsDataCache");
		localStorage.removeItem("last_zoom");
		localStorage.removeItem("last_lat");
		localStorage.removeItem("last_lng");
		localStorage.removeItem("linesPicto_cache_moment");
		localStorage.removeItem("linesPicto");
	} catch (e) {}
};

/**
 * Initialise l'application.
 */
OuestmonbusApp.prototype.init = function() {

	var hpg = 0.5;
	if (this.md.phone()) {
		hpg = 2;
	}
	this.progressbar = new ProgressBar.Line("#progressbar", {
		duration: STATION_CONTENT_REFRESH,
		strokeWidth: hpg
	});
	this.progressbar.set(0);

	$(window).resize(this.doOnResize.bind(this));

	window.onload = function() {
		this.start();
	}.bind(this);

	window.onhashchange = function() {
		this.onHashChange();
	}.bind(this);

	$(".app-container").show();

	this.fetchImgPdf();

	this.infostrafics = new InfosTrafics(this);
	
	//Todo migrate to explore API
	//this.infostrafics.fetchLinesAndAlerts();

	this.initMap();

	this.localisation = new Localization(this, this.map);

	this.initMenuButtons();
};


/**
 * Point d'entrée, lorsque la fenêtre est chargé on exécute le programme.
 */
OuestmonbusApp.prototype.start = function() {
	setTimeout(function() {
		this.showHelp();
	}.bind(this), 60000);

	this.initTwitter();

	var display = function() {
		this.getAllTodayStationsData(this.displayAllStations.bind(this));
	};


	var zoomLatLng = this.localisation.urlToZoomLatLng(window.location.hash);
	if (zoomLatLng) {
		this.moveMapTo(zoomLatLng[1], zoomLatLng[0], display.bind(this));
	} else {

		var last_zoom = this.getLocalStorage("last_zoom");
		var last_lat = this.getLocalStorage("last_lat");
		var last_lng = this.getLocalStorage("last_lng");

		if (last_zoom !== null && last_lat !== null && last_lng !== null) {
			this.moveMapTo(L.latLng(last_lat, last_lng), last_zoom, display.bind(this));
		} else {
			this.moveMapTo(this.map.DEFAULT_POSITION, this.map.DEFAULT_ZOOM, display.bind(this));
		}
	}
};

OuestmonbusApp.prototype.isMapHere = function(latlng, zoom) {
	var res = false;
	try {
		res = this.map.getCenter().distanceTo(latlng) < this.map.DEFAULT_DISTANCE_RESOLUTION && this.map.getZoom() === zoom;
	} catch (e) {}
	return res;
};

OuestmonbusApp.prototype.moveMapTo = function(latlng, zoom, onFinish) {
	if (typeof onFinish === "undefined") {
		onFinish = function() {};
	}
	if (!this.isMapHere(latlng, zoom)) {
		this.map.once("moveend", function() {
			onFinish();
		});
		this.map.setView(latlng, zoom);
	} else {
		onFinish();
	}
};

OuestmonbusApp.prototype.doOnResize = function() {
	this.placeLegal();
};

/**
 * Appelé quand l'URL change.
 */
OuestmonbusApp.prototype.onHashChange = function() {

	if (!this.hash_change_from_move) {
		var zoomLatLng = this.localisation.urlToZoomLatLng(window.location.hash);

		if (zoomLatLng) {
			this.moveMapTo(zoomLatLng[1], zoomLatLng[0]);
		}
	}
	this.hash_change_from_move = false;
};

/**
	Ajuste la position des éléments
	Les mentions légal dans div.leaflet-bottom ne sont pas positionné en bas
	sans un ajustement manuel.
 */
OuestmonbusApp.prototype.placeLegal = function() {
	// hauteur des mentions légal
	var legal_attribution_height = $("#legal_attribution").height();

	// taille du menu
	var appbar_height = $(".app-bar").height();

	// taille de la barre de progression
	var progress_height = $("#progressbar").height();

	// taille de la fenêtre du navigateur
	var window_height = $(window).height();

	// position des mentions légale
	var bottom_position = window_height - legal_attribution_height - progress_height;
	$("div.leaflet-bottom").css("top", bottom_position + "px");
	$("div.leaflet-top").css("top", appbar_height + "px");

	// taille de la carte
	var map_height = window_height - progress_height;
	$("#map").css("height", map_height + "px");
};

/**
	Ajuste la position des éléments
 */
OuestmonbusApp.prototype.addWaitCenterSpinner = function() {

	if (this.waitSpinner !== null && !this.waitSpinnerDisplayed) {
		this.waitSpinner.addTo(this.map);
		this.waitSpinnerDisplayed = true;
		this.waitSpinner.setPosition("topright");
		var spinner_size_px = 52;

		var padding_right = Math.round(Number($(window).width() / 2 - spinner_size_px / 2));
		var padding_top = Math.round(Number($(window).height() / 2 - spinner_size_px / 2 - $(".app-bar").height()));

		$("div.wait").css("padding-top", padding_top);
		$("div.wait").css("padding-right", padding_right);
	}
};

OuestmonbusApp.prototype.removeWaitCenterSpinner = function() {
	if (this.waitSpinner !== null && this.waitSpinnerDisplayed) {
		this.waitSpinner.removeFrom(this.map);
		this.waitSpinnerDisplayed = false;
	}
};

/**
 * Ajuste la position des dialogues un peu plus en hauteur
 */
OuestmonbusApp.prototype.updateDialogPosition = function() {

	$(".dialogontop").css("top", $(".app-bar").height() + Math.ceil(($(window).height() - $(".app-bar").height()) * 0.05));
};

/**
 * Récupère les liens vers les fiches PDF des lignes
 */
OuestmonbusApp.prototype.fetchImgPdf = function() {

	if (this.img_url_localcache_moment === null || this.img_url === null || moment(this.img_url_localcache_moment).diff(moment(), "days") > 0) {
		var request = pegasus("./data/img_url.json");
		request.then(
			function(data) {
				this.img_url = data;
				this.setLocalStorage("img_url_localcache_moment", moment().format());
				this.setLocalStorage("img_url_localcache", JSON.stringify(this.img_url));
			}.bind(this));
	}
};

OuestmonbusApp.prototype.initTwitter = function() {

	var f = function(d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0],
			p = /^http:/.test(d.location) ? "http" : "https";
		if (!d.getElementById(id)) {
			js = d.createElement(s);
			js.id = id;
			js.src = p + "://platform.twitter.com/widgets.js";
			fjs.parentNode.insertBefore(js, fjs);
		}
	};
	f(document, "script", "twitter-wjs");
};


/**
 * Affichage de la carte.
 */
OuestmonbusApp.prototype.initMap = function() {
	// 47.9690:48.30274
	// -1.95019:-1.4649

	// Création de la carte
	var southWest = L.latLng(47.9690, -1.95019);
	var northEast = L.latLng(48.30274, -1.4649);
	var maxBounds = L.latLngBounds(southWest, northEast);


	this.map = L.map("map", {
		attributionControl: false,
		maxBounds: maxBounds,
		minZoom: 12,
		zoomControl: false,
		photonControl: true,
		photonControlOptions: {
			placeholder: "Entrez un lieu...",
			position: "topleft",
			noResultLabel: "Pas de résultat",
			feedbackEmail: null
		}
	});

	//#map=16/48.1113/-1.67566
	this.map.DEFAULT_ZOOM = 17;
	this.map.DEFAULT_DISTANCE_RESOLUTION = 1;
	this.map.DEFAULT_POSITION = L.latLng(48.1178, -1.67036);
	this.map.MAXBOUNDS = maxBounds;

	// Ajout des tuiles
	var tiles_layer = L.tileLayer("https://tiles.ouestmonbus.com/osmfr/{z}/{x}/{y}.png", {
		maxZoom: 19,
		bounds: maxBounds,
		opacity: 0.75
	}).addTo(this.map);

	tiles_layer.once("loading", function() {
		this.addWaitCenterSpinner();
	}.bind(this));
	tiles_layer.once("load", function() {
		this.removeWaitCenterSpinner();
	}.bind(this));

	// Spinner d'attente de chargement des données
	this.waitSpinner = L.control();
	this.waitSpinner.onAdd = function() {
		this._div = L.DomUtil.create("div", "wait");
		this.update();
		return this._div;
	};
	this.waitSpinner.update = function() {
		this._div.innerHTML = "<div data-role='preloader' data-type='ring' data-style='dark'></div>";
	};

	// Ajout des clusters de marker
	this.map.cluster_markers = new L.markerClusterGroup({
		disableClusteringAtZoom: this.map.DEFAULT_ZOOM,
		maxClusterRadius: 200
	});

	// ajout du layer de bus
	this.bus_group_layer.addTo(this.map);

	// Ajout des mentions légals
	var legal = L.control.attribution({
		prefix: "<div id='legal_attribution'>&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a>"
	}).addAttribution("<a href='http://www.data.rennes-metropole.fr'>Data Keolis Rennes Métropole</a></div>");
	legal.setPosition("bottomright");
	legal.addTo(this.map);

	// Force un réalignement
	this.placeLegal();

	this.resetMapListener();
};

OuestmonbusApp.prototype.resetMapListener = function() {
	this.map.clearAllEventListeners();
	this.map.on("moveend", this.onMapMoveEnd.bind(this));
};

OuestmonbusApp.prototype.onMapMoveEnd = function() {

	this.hash_change_from_move = true;

	var pos = this.map.getCenter();
	var lat = Number(pos.lat.toFixed(5));
	var lng = Number(pos.lng.toFixed(5));
	window.location.hash = "map=" + this.map.getZoom() + "/" + lat +
		"/" + lng;

	this.setLocalStorage("last_zoom", this.map.getZoom());
	this.setLocalStorage("last_lat", lat);
	this.setLocalStorage("last_lng", lng);

	this.localisation.getAddress(lat, lng);
};

OuestmonbusApp.prototype.hideDlg = function(dlg, photon) {
	if (dlg) {
		if (this.dialogCurrentDisplay) {
			this.dialogCurrentDisplay.close();
			this.dialogCurrentDisplay = null;
		}
	}
	if (photon) {
		$(".photon-input").hide();
	}
};

/**
 * Initialise les boutons du menu.
 */
OuestmonbusApp.prototype.initMenuButtons = function() {

	$("#ouestmonbus_btn").click(function() {
		var h = Math.ceil(($(window).height() - $(".app-bar").height() - $("#progressbar").height() - $("#legal_attribution").height()) * 0.8);
		$(".twitter-timeline").height(h);
		this.hideDlg(true, true);
		var dialog = $("#ouestmonbus_timeline_dlg").data("dialog");
		this.dialogCurrentDisplay = dialog;
		dialog.open();
		this.updateDialogPosition();
	}.bind(this));
	if (this.md.mobile()) {
		$("#ouestmonbus_btn").unbind("mouseenter mouseleave");
	}

	// Bouton localisation
	$("#localise_btn").click(function() {
		this.hideDlg(true, true);
		this.addWaitCenterSpinner();
		this.localisation.autoLocate();
	}.bind(this));
	if (this.md.mobile()) {
		$("#localise_btn").unbind("mouseenter mouseleave");
	}

	// photon search
	$("#address_btn").click(function() {
		this.hideDlg(true, false);
		$(".photon-input").show();
		$(".photon-input").focus();
	}.bind(this));
	if (this.md.mobile()) {
		$("#address_btn").unbind("mouseenter mouseleave");
	}

	// Twitter timeline
	$("#perturbations_twitter_btn").click(function() {
		var h = Math.ceil(($(window).height() - $(".app-bar").height() - $("#progressbar").height() - $("#legal_attribution").height()) * 0.8);
		$(".twitter-timeline").height(h);
		this.hideDlg(true, true);
		var dialog = $("#starbusmetro_timeline_dlg").data("dialog");
		this.dialogCurrentDisplay = dialog;
		dialog.open();
		this.updateDialogPosition();
	}.bind(this));
	if (this.md.mobile()) {
		$("#perturbations_twitter_btn").unbind("mouseenter mouseleave");
	}

	// Affichage des perturbations
	$("#perturbations_btn").click(function() {
		var h = Math.ceil(($(window).height() - $(".app-bar").height() - $("#progressbar").height() - $("#legal_attribution").height()) * 0.8);
		$("#trafic_dlg_content").height(h);
		this.hideDlg(true, true);
		var dialog = $("#trafic_dlg").data("dialog");
		this.dialogCurrentDisplay = dialog;
		dialog.open();
		this.updateDialogPosition();
	}.bind(this));
	if (this.md.mobile()) {
		$("#perturbations_btn").unbind("mouseenter mouseleave");
	}

	// Bouton aide
	$("#about_btn").click(function() {
		this.hideDlg(true, true);
		var dialog = $("#about_dlg").data("dialog");
		this.dialogCurrentDisplay = dialog;
		dialog.open();
		this.updateDialogPosition();
	}.bind(this));
	if (this.md.mobile()) {
		$("#about_btn").unbind("mouseenter mouseleave");
	}

	$(".dropdown-toggle").click(function(event) {
		event.preventDefault();
		this.hideDlg(true, false);
	}.bind(this));


	$("#refresh_version").click(function() {
		this.cleanLocalStorage();
		location.reload(true);
	}.bind(this));
};

/**
 * Affichage de la notice d'aide.
 */
OuestmonbusApp.prototype.showHelp = function() {
	if (this.needHelp) {
		$.Notify({
			content: "Cliquez ou tapez sur les icônes " +
				"<img src='./images/picto/22/station.png' height='22' width='22' alt='station'> " +
				"des arrêts de bus pour connaître les prochains passages en temps réel.",
			icon: "<span class='mif-question'></span>",
			type: "info",
			keepOpen: true
		});
	}
	this.setLocalStorage("alreadyDisplayHelp", true);
};

/**
 *	Affichage de la notification de légende retard.
 */
OuestmonbusApp.prototype.displayRetardHelp = function() {
	if (this.firstdisplayRetardHelp) {
		$.Notify({
			content: "Le symbole <span class='mif-sync-problem mif-lg'></span> " +
				"indique l'avance ou le retard par rapport à l'horaire initialement prévu",
			type: "info",
			keepOpen: true
		});
	}
	this.firstdisplayRetardHelp = false;
	this.setLocalStorage("alreadyDisplayRetardHelp", true);
};

/**
 *	Affichage de la notification de légende pas de bus.
 */
OuestmonbusApp.prototype.displayNoBusHelp = function() {
	if (this.firstdisplayNoBusHelp) {
		$.Notify({
			content: "Le symbole <span class='mif-not'></span> " +
				"indique qu'un bus est prévu avant la fin du service mais pas dans l'heure à venir",
			type: "warning",
			keepOpen: true
		});
	}
	this.firstdisplayNoBusHelp = false;
	this.setLocalStorage("alreadyDisplayNoBusHelp", true);
};

/**
 * Récupère le chemin des données des stations du jour.
 * @param  {moment} now - maintenant
 * @return {string} - chemin
 */
OuestmonbusApp.prototype.getDataStationPath = function(now) {
	var first = moment(now);
	first.hour(5);
	first.minute(0);
	first.second(0);
	first.millisecond(0);

	if (now.isBefore(first)) {
		now = now.subtract(1, "days");
	}

	var datestr = now.format("YYYY-MM-DD");
	return "./data/today/" + datestr + "/stations.geojson";
};

/**
 * Récupère la liste des station.
 * 
 * @param  {function} onSucess - fonction à executer après la récupération
 */
OuestmonbusApp.prototype.getAllTodayStationsData = function(onSuccess) {

	var url_data = this.getDataStationPath(moment());

	if (this.allStationsDataPath !== url_data || this.allStationsDataCache === null) {

		this.addWaitCenterSpinner();
		var request = pegasus(url_data);

		request.then(
			function(data) {
				if (typeof(data) === "object" && data !== null) {
					this.allStationsDataCache = data;
					this.setLocalStorage("allStationsDataPath", url_data);
					this.setLocalStorage("allStationsDataCache", JSON.stringify(data));
					onSuccess(data);
				} else {
					this.removeWaitCenterSpinner();
					this.displayAPIError("Données ouestmonbus incorrect");
				}
			}.bind(this),
			function() {
				this.removeWaitCenterSpinner();
				this.displayAPIError("Connexion impossible aux données ouestmonbus");
			}.bind(this));
	} else {
		onSuccess(this.allStationsDataCache);
	}
};

/**
 * Filtre si il faut afficher la station ou non
 * @param  {moment} now
 * @param  {array} limits - [premier_passage,dernier_passage]
 * @return {boolean} - true si à afficher
 */
OuestmonbusApp.prototype.stationTimeFilter = function(now, limits) {

	// prevent error in GTFS data
	if (limits === null || limits[0] === null || limits[1] === null) {
		return false;
	}

	var now_ajusted = moment(now);

	var morning_start = moment(now).startOf("day");
	var morning_end = moment(morning_start).hours(5);

	var hour_end_limit = Number(limits[1].slice(0, 2));

	if (now.isBetween(morning_start, morning_end) && hour_end_limit >= 24) {
		now_ajusted.add(1, "days");
	}

	var start = moment(now);
	start.hours(Number(limits[0].slice(0, 2)) - 1);
	start.minute(Number(limits[0].slice(3, 5)));
	start.second(Number(limits[0].slice(6, 8)));

	var end = moment(now);
	end.hours(Number(limits[1].slice(0, 2)));
	end.minute(Number(limits[1].slice(3, 5)));
	end.second(Number(limits[1].slice(6, 8)));
	end.add(10, "minutes");

	if (now_ajusted.isBetween(start, end)) {
		return true;
	} else {
		return false;
	}
};

OuestmonbusApp.prototype.isMetroLine = function(lines) {
	var res = _.size(lines) === 1 && Number(lines[0].split(",")[0]) === 1001;
	return res;
};

OuestmonbusApp.prototype.displayLine = function(lines, sens) {
	this.deleteAllBusOnMap();
	this.displayLines(["" + lines + "," + sens]);
};

OuestmonbusApp.prototype.displayLines = function(lines) {

	_.each(this.lines_layers, function(layer) {
		this.map.removeLayer(layer);
	}.bind(this));
	this.lines_layers = [];

	_.each(lines.reverse(), function(item) {

		var idligne = item.split(",")[0];
		var sens = item.split(",")[1];

		var sensstr = "";
		if (Number(sens) === 0) {
			sensstr = "aller";
		} else {
			sensstr = "retour";
		}

		var request = pegasus("./data/geo/lines/" + idligne + "/" + sensstr + ".geojson");
		request.then(
			function(geojsonFeature) {
				if (_.isUndefined(geojsonFeature.geometry)) {
					console.log("pas de données pour la ligne " + idligne + " sens " + sens);
				} else {
					var layer = L.geoJson(geojsonFeature, {
						style: function(feature) {
							return {
								opacity: 1,
								color: "#" + feature.properties.couleurligne
							};
						}
					});
					layer.bindPopup(this.generatePopupLineContent(idligne, sensstr, geojsonFeature.properties.couleurligne, geojsonFeature.properties.LI_NOM));
					layer.on("click", function(e) {
						$(".line_info").parent().css("margin", 0);
						$(".leaflet-popup-tip-container").remove();
						e.layer.bringToFront();
					}.bind(this));
					layer.idligne = idligne;
					layer.sens = sens;
					layer.dest = geojsonFeature.properties.ITI_DEST;
					layer.color = geojsonFeature.properties.couleurligne;
					this.lines_layers.push(layer);
					layer.addTo(this.map);
				}
			}.bind(this));
	}.bind(this));
};


OuestmonbusApp.prototype.generatePopupLineContent = function(idligne, sens, couleur, nom) {
	var href = this.img_url[idligne];

	var html = "<div class='line_info' style='border:0.3rem solid #" + couleur + ";'><img src='./images/picto/22/" + idligne + ".png' height='22' width='22' alt='" + idligne + "'> " + nom + " (sens " + sens + ")<br>";

	if (!_.isUndefined(href)) {
		html += "<br><a target='_blank' href='" + href + "'>Téléchargement de la fiche horaire</a>";
	}
	html += "</div>";
	return html;
};

OuestmonbusApp.prototype.bringLineToFront = function(idligne, sens) {
	_.each(this.lines_layers, function(layer) {
		if (idligne === layer.idligne && sens === layer.sens) {
			layer.bringToFront();
		}
	});
};

/**
 * Affiche les stations.
 * Cette fonction devrait régulièrement être appelé pour mettre a jour
 * la présence ou non des arrêts
 * 
 * @param  {geoJson} geoJsonData - stations du jour
 */
OuestmonbusApp.prototype.displayAllStations = function(geoJsonData) {

	this.removeWaitCenterSpinner();

	var geoJsonLayer = L.geoJson(geoJsonData, {
		pointToLayer: function(feature, latlng) {

			var busIcon = L.icon({
				iconUrl: "./images/picto/22/station.png",
				shadowUrl: "",
				iconSize: [22, 22],
				shadowSize: [0, 0],
				iconAnchor: [11, 11],
				shadowAnchor: [0, 0],
				popupAnchor: [0, 0]
			});

			var metroIcon = L.icon({
				iconUrl: "./images/picto/22/station-metro.png",
				shadowUrl: "",
				iconSize: [22, 22],
				shadowSize: [0, 0],
				iconAnchor: [11, 11],
				shadowAnchor: [0, 0],
				popupAnchor: [0, 0]
			});

			var icon = busIcon;

			if (Number(feature.properties.lines[0].split(",")[0]) === 1001) {
				icon = metroIcon;
			}

			return L.marker(latlng, {
				icon: icon
			});
		}.bind(this),
		filter: function(feature) {
			return this.stationTimeFilter(moment(), feature.properties.limits);
		}.bind(this),
		onEachFeature: function(feature, marker) {
			marker.idarret = feature.properties.id;
			marker.nomarret = feature.properties.name;
			marker.lines = feature.properties.lines;
			marker.terminus = feature.properties.terminus;

			this.onEachMakerAdd(marker);
			if (this.firstStationDisplaySession) {
				if (this.stationFoundInCenter === null) {
					var lat = Number(marker.getLatLng().lat).toFixed(5);
					var lng = Number(marker.getLatLng().lng).toFixed(5);
					if (this.map.getCenter().distanceTo(L.latLng(lat, lng)) < this.map.DEFAULT_DISTANCE_RESOLUTION * 2) {
						this.stationFoundInCenter = marker;
					}
				}
			}
		}.bind(this)
	});
	this.map.cluster_markers.clearLayers();
	this.map.cluster_markers.addLayer(geoJsonLayer);

	if (!this.map.hasLayer(this.map.cluster_markers)) {
		this.map.cluster_markers.addTo(this.map);
	}

	if (this.stationFoundInCenter !== null) {
		this.openStation(this.stationFoundInCenter);
	} else {
		if (this.firstStationDisplaySession && this.map.getZoom() >= this.map.DEFAULT_ZOOM) {
			this.localisation.showLocation(this.map.getCenter(), false, false, 0);
		}
	}

	this.firstStationDisplaySession = false;
	this.delayRefreshAllStations();
};


/**
 * Appelé à chaque ajout de marker
 * 
 * @param  {marker}
 */
OuestmonbusApp.prototype.onEachMakerAdd = function(marker) {
	var popup = L.popup({
		autoPan: true,
		autoPanPaddingTopLeft: L.point(Math.ceil($(window).width() * 0.05), $(".app-bar").height() + Math.ceil(($(window).height() - $(".app-bar").height()) * 0.05)),
		maxWidth: Math.ceil($(window).width() * 0.8),
		maxHeight: Math.ceil(($(window).height() - $(".app-bar").height() - $("#progressbar").height() - $("#legal_attribution").height()) * 0.8)
	});
	popup.setContent("<div data-role='preloader' data-type='ring' data-style='dark'></div>");
	marker.bindPopup(popup);
	marker.on("click", function() {
		this.hideDlg(true, true);
		this.openStation(marker);

	}.bind(this));

	marker.on("popupclose", function() {
		this.markerCurrentDisplay = null;
	}.bind(this));
};


// OuestmonbusApp.prototype.OldAPIgetNextDepartures = function(idarret) {
// 	var request = pegasus("http://data.keolis-rennes.com/json/?" +
// 		"cmd=getbusnextdepartures&version=2.2&" +
// 		"key=GBWOP6EQ50T79VC&" +
// 		"param%5Bmode%5D=stop&" +
// 		"param%5Bstop%5D%5B%5D=" + idarret);
// 	request.then(function(data) {
// 		console.log(data);
// 	});
// };

/**
 * Récupère les infos du prochain dépare à une station.
 * 
 * @param  {string} idarret
 * @param  {function} onSuccess - callback
 */
OuestmonbusApp.prototype.getNextDepartures = function(isMetro, idarret, onSuccess, onFailed) {

	var url = "https://data.explore.star.fr/api/records/1.0/search?" +
        "apikey=3324de385f6b7b5bdfa1727d3e1a9f4bed5dd1accb288db6df5e8487" +
		"&dataset=tco-bus-circulation-passages-tr" +
		"&sort=-depart" +
		"&refine.idarret=" + idarret;

	if (isMetro) {
		url = "https://data.explore.star.fr/api/records/1.0/search?" +
            "apikey=3324de385f6b7b5bdfa1727d3e1a9f4bed5dd1accb288db6df5e8487" +
			"&dataset=tco-metro-circulation-passages-tr" +
			"&sort=-depart" +
			"&refine.idarret=" + idarret;
	}

	$.getJSON(url,
		function(data) {
			if (typeof(data) === "object" && data !== null && typeof(data.parameters) === "object") {

				// check server time
				if (data.records.length > 0) {
					var ms = moment().diff(moment(data.records[0].record_timestamp));
					var d = moment.duration(ms);

					if (d.asMinutes() > 30) {
						var dialog = $("#api_time_failure_dlg").data("dialog");
						this.dialogCurrentDisplay = dialog;
						dialog.open();
						//this.OldAPIgetNextDepartures(idarret);
					}
					onSuccess(data);

				} else {
					onSuccess(data);
				}
			} else {
				this.displayAPIError("données invalides du service opendata STAR");
				onFailed();

			}
		}.bind(this)).fail(function() {
		this.displayAPIError("échec de connexion au service opendata STAR");
		onFailed();
	}.bind(this));
};

OuestmonbusApp.prototype.deleteAllBusOnMap = function() {
	this.bus_group_layer.clearLayers();
};

OuestmonbusApp.prototype.generatePopupBusContent = function(idligne, destination) {
	return "<div class='bus_info'><img src='./images/picto/22/" + idligne + ".png' height='22' width='22' alt='" + idligne + "'> " +
		"<span>" + destination + "</span><br></div>";
};

OuestmonbusApp.prototype.getBusPositions = function(lignes) {

	// clean next step and old bus on map
	this.bus_group_layer.eachLayer(function(layer) {
		if (_.isUndefined(layer.idbus)) {
			this.bus_group_layer.removeLayer(layer);
		} else {
			if (moment().diff(layer.last_refresh) > 240 * 1000) {
				console.log("delete bus " + layer.idbus);
				this.bus_group_layer.removeLayer(layer);
			}
		}
	}.bind(this));

	var now = moment();

	_.each(lignes, function(ligne) {

		var idligne = ligne.split(",")[0];
		var sens = ligne.split(",")[1];

		var url_api = "https://data.explore.star.fr/api/records/1.0/search?" +
            "apikey=3324de385f6b7b5bdfa1727d3e1a9f4bed5dd1accb288db6df5e8487" +
			"&dataset=tco-bus-vehicules-position-tr" +
			"&refine.etat=En+ligne" +
			"&refine.idligne=" + idligne +
			"&refine.sens=" + sens;

		var request = pegasus(url_api);

		request.then(function(data) {
			if (data.nhits > 0) {

				// Filtrage des bus à suivre
				// on affiche et suit les NB_BUS_PROX bus les plus proche du point cliqué
				// c'est sur ce paramètre qu'il falloir jouer quand le quota API explose :-)
				var NB_BUS_PROX = 4;

				var bus_fetched = [];
				var map_bus_fetched = [];

				_.each(data.records, function(item) {
					var m = L.marker(L.latLng(item.geometry.coordinates[1], item.geometry.coordinates[0]));
					map_bus_fetched.push(m);
					bus_fetched.push([now,
						item.record_timestamp,
						item.fields.ecartsecondes,
						item.fields.idbus,
						item.fields.idligne,
						item.fields.sens,
						item.geometry.coordinates[1],
						item.geometry.coordinates[0]
					]);
				}.bind(this));

				var gmap_bus_fetched = L.geoJson(L.layerGroup(map_bus_fetched).toGeoJSON());
				var bus_fetched_filtred = leafletKnn(gmap_bus_fetched).nearest(this.markerCurrentDisplay.getLatLng(), NB_BUS_PROX);

				bus_fetched_filtred = _.map(bus_fetched_filtred, function(item) {
					return item.lat + "," + item.lon;
				});

				_.each(bus_fetched, function(item) {
					var l = item[6] + "," + item[7];
					if (bus_fetched_filtred.indexOf(l) !== -1) {
						this.addBusOnMap(item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7]);
					}
				}.bind(this));

			} else {
				//this.removeWaitCenterSpinner();
			}
		}.bind(this), function() {
			//this.removeWaitCenterSpinner();
		}.bind(this));
	}.bind(this));
};

OuestmonbusApp.prototype.addBusOnMap = function(now, buspos_record_timestamp, ecartsecondes, idbus, idligne, sens, lat, lng) {
	var line_layer = L.geoJson();

	_.each(this.lines_layers, function(layer) {

		if (Number(layer.idligne) === Number(idligne) && Number(layer.sens) === Number(sens)) {
			line_layer = layer;
		}
	});

	var all_step_parcours = [];
	var all_step_parcours_to_end = [];
	var all_duration_calcuted = [];
	var index_current_pos = 0;

	// marker sur position d'origine
	// var station_marker_step = L.circleMarker(L.latLng([lat, lng]), {
	// 	color: "#" + line_layer.color,
	// 	opacity: 0.8
	// });
	// this.bus_group_layer.addLayer(station_marker_step);

	// calcul du total du parcour de la ligne
	var total_latlng_parcours = [];
	var total_points_parcours = [];
	var bus_has_parcours = true;

	if (_.size(line_layer.getLayers()) === 0) {
		console.log("pas de tracé de ligne pour le bus " + idbus);
		bus_has_parcours =  false;
	} else {
		total_latlng_parcours = _.first(line_layer.getLayers())._latlngs;
		total_latlng_parcours = _.filter(total_latlng_parcours, function(item) {
			return _.isNumber(item.lat) && _.isNumber(item.lng);
		});
		total_points_parcours = _.map(total_latlng_parcours, function(item) {
			return L.marker(item);
		});
	}

	var parcours_segments = _.pluck(total_points_parcours, "_latlng");
	var distance_segments = _.map(parcours_segments, function(value,index){
		if (index !== 0) {
			return Math.ceil(value.distanceTo(parcours_segments[index-1]));
		}else{
			return 0;
		}
	});

	// recherche du point de départ
	var gtotal_point_parcours = L.geoJson(L.layerGroup(total_points_parcours).toGeoJSON());
	var current_point_on_parcour = _.first(leafletKnn(gtotal_point_parcours).nearest(L.latLng(lat, lng), 1, _.max(distance_segments)));

	if (!_.isUndefined(current_point_on_parcour)) {
		index_current_pos = _.findIndex(total_latlng_parcours, function(item) {
			return (item.lat === current_point_on_parcour.lat && item.lng === current_point_on_parcour.lon);
		});
		all_step_parcours_to_end = total_latlng_parcours.slice(index_current_pos);
		index_current_pos = 0;
	} else {
		gtotal_point_parcours = L.geoJson();
		console.log("départ hors parcours");
	}

	var url_api = "https://data.explore.star.fr/api/records/1.0/search?" +
        "apikey=3324de385f6b7b5bdfa1727d3e1a9f4bed5dd1accb288db6df5e8487" +
		"&sort=-depart" +
		"&dataset=tco-bus-circulation-passages-tr" +
		"&refine.idbus=" + idbus;

	//console.log(buspos_record_timestamp)
	var request = pegasus(url_api);

	request.then(function(data) {
		//console.log(moment(_.first(data.records).record_timestamp))
		if (data.nhits > 0) {

			var precision = "temps réel";
			if (_.first(data.records).fields.precision === "Applicable") {
				precision = "passage théorique";
			}

			var duration_from_pos = moment(_.first(data.records).record_timestamp).diff(buspos_record_timestamp);
			var duration_from_getnexdeparture_api = now.diff(_.first(data.records).record_timestamp);

			var desc_bus = "bus " + idbus + "<br>" +
				"direction " + _.first(data.records).fields.destination;

			_.each(data.records, function(item) {

				var step = item.fields;

				var next_step_duration = moment(step.depart).diff(_.first(data.records).record_timestamp);

				// données pertinante seulement si > 10 s
				if (next_step_duration > 10000) {
					var duration_calcuted_to_next_step = [];
					var parcours_to_next_step = [];

					var lat_next_step = step.coordonnees[0];
					var lng_next_step = step.coordonnees[1];

					var next_step_point_on_parcour = _.first(leafletKnn(gtotal_point_parcours).nearest(L.latLng(lat_next_step, lng_next_step), 1, _.max(distance_segments)));

					// var station_marker_step = L.circleMarker(L.latLng([lat_next_step, lng_next_step]), {
					// 	color: "#" + line_layer.color
					// });
					// this.bus_group_layer.addLayer(station_marker_step);

					// la prochaine station n'est pas sur la ligne
					if (_.isUndefined(next_step_point_on_parcour)) {
						all_step_parcours.push(L.latLng(lat_next_step, lng_next_step));
						all_duration_calcuted.push(next_step_duration);
					} else {
						// la prochaine station est sur la ligne
						var index_next_step = _.findIndex(all_step_parcours_to_end, function(item) {
							return (item.lat === next_step_point_on_parcour.lat && item.lng === next_step_point_on_parcour.lon);
						});

						parcours_to_next_step = all_step_parcours_to_end.slice(index_current_pos, index_next_step);
						index_current_pos = index_next_step;

						var distance_to_next_step = 0;
						_.each(parcours_to_next_step, function(value, index, list) {
							if (index !== 0) {
								var d = list[index - 1].distanceTo(value);
								distance_to_next_step += d;
								duration_calcuted_to_next_step.push(d);
							}
						});

						var vitesse_to_next_step = next_step_duration / distance_to_next_step;
						duration_calcuted_to_next_step = _.map(duration_calcuted_to_next_step, function(item) {
							return item * vitesse_to_next_step;
						});

						all_step_parcours.push(parcours_to_next_step);
						all_duration_calcuted.push(duration_calcuted_to_next_step);
					}
				}
			}.bind(this));

			all_step_parcours = _.flatten(all_step_parcours);
			all_duration_calcuted = _.flatten(all_duration_calcuted);

			var duration_from_clock = duration_from_pos + duration_from_getnexdeparture_api;

			while (duration_from_clock > 0) {
				var d = all_duration_calcuted.shift();
				duration_from_clock -= d;
				all_step_parcours.shift();
				if (_.isUndefined(d)) {
					break;
				}
			}
			if (_.size(all_step_parcours) > 1 && bus_has_parcours) {
				lat = all_step_parcours[0].lat;
				lng = all_step_parcours[0].lng;
				this.addBusIconOnMap(idbus, all_step_parcours, all_duration_calcuted, idligne, sens, lat, lng, desc_bus);
			} else {
				console.log("pas de calcul de déplacement");
				this.addStaticBusIconOnMap(idbus, idligne, sens, lat, lng, desc_bus);
			}
		}
	}.bind(this));
};

OuestmonbusApp.prototype.addStaticBusIconOnMap = function(idbus, idligne, sens, lat, lng, desc) {

	var busIcon = L.icon({
		iconUrl: "./images/picto/22/" + idligne + ".png",
		shadowUrl: "./images/picto/22/bus_shadow.png",
		iconSize: [20, 20],
		shadowSize: [32, 32],
		iconAnchor: [10, 10],
		shadowAnchor: [16, 16],
		popupAnchor: [0, 0]
	});

	var marker = L.marker(L.latLng(lat, lng), {
		icon: busIcon,
		zIndexOffset: -2
	});

	marker.idligne = idligne;
	marker.sens = sens;
	marker.idbus = idbus;
	marker.last_refresh = moment();

	desc += "<br><span class='fg-red'>calcul du déplacement impossible</span>";

	marker.bindPopup(this.generatePopupBusContent(idligne, desc), {
		closeButton: false,
		className: "bus_popup"
	});
	marker.on("click", function() {

		$(".bus_info").parent().css("margin", 0);
		$(".leaflet-popup-tip-container").remove();
	}.bind(this));

	this.updateBusMarker(marker);

	this.refreshBusCountHtml();
};

OuestmonbusApp.prototype.addBusIconOnMap = function(idbus, parcours, durations, idligne, sens, lat, lng, desc) {

	var busIcon = L.icon({
		iconUrl: "./images/picto/22/" + idligne + ".png",
		shadowUrl: "./images/picto/22/bus_shadow.png",
		iconSize: [20, 20],
		shadowSize: [32, 32],
		iconAnchor: [10, 10],
		shadowAnchor: [16, 16],
		popupAnchor: [0, 0]
	});

	var marker = L.Marker.movingMarker(parcours, durations, {
		autostart: true,
		icon: busIcon,
		zIndexOffset: -2
	});

	marker.idligne = idligne;
	marker.sens = sens;
	marker.idbus = idbus;
	marker.last_refresh = moment();

	marker.bindPopup(this.generatePopupBusContent(idligne, desc), {
		closeButton: false,
		className: "bus_popup"
	});
	marker.on("click", function() {

		$(".bus_info").parent().css("margin", 0);
		$(".leaflet-popup-tip-container").remove();
	}.bind(this));

	this.updateBusMarker(marker);
	this.refreshBusCountHtml();
};

OuestmonbusApp.prototype.updateBusMarker = function(busMarker) {
	var bus_already_on_map = false;
	this.bus_group_layer.eachLayer(function(layer) {
		if (layer.idbus === busMarker.idbus) {
			this.bus_group_layer.removeLayer(layer);
			this.bus_group_layer.addLayer(busMarker);
			bus_already_on_map = true;
		}
	}.bind(this));

	if (!bus_already_on_map) {
		this.bus_group_layer.addLayer(busMarker);
	}
};

OuestmonbusApp.prototype.refreshBusCountHtml = function() {

	var bus_count_on_map = 0;
	this.bus_group_layer.eachLayer(function(layer) {
		if (!_.isUndefined(layer.idbus)) {
			bus_count_on_map++;
		}
	});

	var content = "";
	if (bus_count_on_map === 0) {
		content = "Pas de <img src='./images/picto/22/bus_shadow.png' height='22' width='22' alt='bus'> sur la carte pour cet arrêt";
	}
	if (bus_count_on_map > 1) {
		content = "Voir les <b>" + bus_count_on_map + "</b> <img src='./images/picto/22/bus_shadow.png' height='22' width='22' alt='bus'> sur la carte";
	}
	if (bus_count_on_map === 1) {
		content = "Voir le <img src='./images/picto/22/bus_shadow.png' height='22' width='22' alt='bus'> sur la carte";
	}
	$("#bus_count").html(content);
	$("#bus_count").click(this.onBusCountClick.bind(this));
};

OuestmonbusApp.prototype.onBusCountClick = function() {

	var bus_map_bounds = [this.markerCurrentDisplay.getLatLng()];

	this.bus_group_layer.eachLayer(function(layer) {
		if (!_.isUndefined(layer.idbus)) {
			bus_map_bounds.push(layer.getLatLng());
		}
	}.bind(this));

	this.map.fitBounds(bus_map_bounds);
	this.map.setZoom(this.map.getZoom() - 1);
};

/**
 * Ouvre la popup d'une station
 * 
 * @param  {L.marker} marker -
 */
OuestmonbusApp.prototype.openStation = function(marker) {
	this.needHelp = false;
	this.delayRefreshAllStations();
	this.markerCurrentDisplay = marker;
	this.getNextDepartures(this.isMetroLine(marker.lines), marker.idarret, function(data) {
		this.setPopupContent(marker, data);

		if (this.bus_station_origin !== marker) {
			this.setOrigin(marker);
		}
		marker.openPopup();
	}.bind(this), function() {
		this.setPopupContent(marker, null);
		//this.OldAPIgetNextDepartures(marker.idarret);
		marker.openPopup();
	}.bind(this));

	this.refreshStation();
};

OuestmonbusApp.prototype.setOrigin = function(marker) {

	this.localisation.deleteMarkerMe.call(this.localisation);

	if (this.bus_station_origin !== null && this.map.hasLayer(this.bus_station_origin)) {
		this.map.removeLayer(this.bus_station_origin);
	}
	this.bus_station_origin = L.marker(marker.getLatLng(), {
		zIndexOffset: -1
	});

	this.bus_station_origin.on("click", function(e) {
		this.moveMapTo(e.latlng, this.map.DEFAULT_ZOOM);
	}.bind(this));

	this.bus_station_origin.addTo(this.map);
};

/**
 * Fonction apppellé lorsque l'utilisateur clique sur la station la plus
 * proche après une localisation.
 */
OuestmonbusApp.prototype.followNearestStation = function() {
	this.moveMapTo(this.localisation.nearestStation.marker.getLatLng(),
		this.map.DEFAULT_ZOOM,
		this.openStation.bind(this, this.localisation.nearestStation.marker)
	);
};

/**
 * Mets à jour le contenue d'une popup de station
 */
OuestmonbusApp.prototype.setPopupContent = function(marker, data) {
	var content = this.generatePopupContent(marker, data);
	var popup = marker.getPopup();
	popup.setContent(content);
	popup.update();
};

OuestmonbusApp.prototype.getStationUrl = function(marker) {
	var station_url = "#map=" + this.map.DEFAULT_ZOOM + "/" + Number(marker.getLatLng().lat).toFixed(5) + "/" + Number(marker.getLatLng().lng).toFixed(5);
	return station_url;
};

OuestmonbusApp.prototype.generateImgHtml = function(idligne, sens) {
	var html = "<a href='#' alt='afficher ligne' onclick='app.bringLineToFront(\"" + idligne + "\",\"" + sens + "\");return false;'>" +
		"<img src='./images/picto/22/" + idligne + ".png' height='22' width='22' alt='" + idligne + "'></a> ";
	return html;
};

OuestmonbusApp.prototype.generateHeaderImgHtml = function(idligne, sens) {
	var html = "<a href='#' alt='afficher ligne' onclick='app.displayLine(\"" + idligne + "\",\"" + sens + "\");return false;'>" +
		"<img src='./images/picto/22/" + idligne + ".png' height='22' width='22' alt='" + idligne + "'></a> ";
	return html;
};

/**
 * Généré le contenu d'une popup de station.
 * 
 * @param  {L.marker} marker - marker de la station
 * @param  {object} data - donnée reçu de l'API explore
 * 
 * @return {string} - code html
 */
OuestmonbusApp.prototype.generatePopupContent = function(marker, data) {

	var station_url = this.getStationUrl(marker);

	var lines_header = [];
	var lines_img = "";

	_.each(marker.lines, function(item) {
		var a = item.split(",");
		if (_.indexOf(lines_header, a[0]) === -1) {
			lines_img += this.generateHeaderImgHtml(a[0], a[1]);
			lines_header.push(a[0]);
		}
	}.bind(this));

	var full_content = "";
	if (_.size(lines_header) < 4) {
		full_content = "<div class='popup_title_inline'><div class='list_lines_inline'>" + lines_img + "</div><div class='station_name'><a class='fg-white' href='" + station_url +
			"'>" + marker.nomarret + "</a></div></div><!-- idarret=" + marker.idarret + " --> <hr>";
	} else {
		full_content = "<div class='popup_title'><div class='station_name'><a class='fg-white' href='" + station_url +
			"'>" + marker.nomarret + "</a></div><div class='list_lines'>" + lines_img + "</div></div><!-- idarret=" + marker.idarret + " --> <hr>";
	}

	if (data !== null) {
		if (this.isMetroLine(marker.lines)) {
			full_content += "<div class='header_station'><b>prochains métro à passer à cet arrêt :</b></div>" +
				"<div class='lines_content'";
		} else {
			full_content += "<div class='header_station'><b>prochains bus à passer à cet arrêt :</b></div>" +
				"<div class='lines_content'";
		}

		if (Number(data.nhits) > 0) {

			var record_timestamp = data.records[0].record_timestamp;

			// prepare data
			var all_records = _.reduce(data.records, function(seed, item) {
				seed.push(item.fields);
				return seed;
			}, []);

			var lignes_selected = _.groupBy(all_records, "idligne");
			lignes_selected = _.map(lignes_selected, function(item) {
				var first = _.first(item);
				return ["" + first.idligne + "," + first.sens];
			});
			lignes_selected = _.flatten(lignes_selected);

			if (lignes_selected.join() !== this.last_lignes_selected.join()) {
				this.deleteAllBusOnMap();

				if (!this.isMetroLine(marker.lines)) {
					this.getBusPositions(lignes_selected);
					this.last_ligne_bus_fetch = moment();
				}
			} else {
				if (this.last_ligne_bus_fetch.diff(moment()) > STATION_CONTENT_REFRESH) {
					this.getBusPositions(lignes_selected);
					this.last_ligne_bus_fetch = moment();
				} else {
					console.log("clique trop rapide!");
					setTimeout(function(){
						this.refreshBusCountHtml();
					}.bind(this),1000);
				}
			}
			this.last_lignes_selected = lignes_selected;

			var records = _.groupBy(all_records, "idligne");

			var lines_sens = _.map(all_records, function(item) {
				return item.idligne + "," + item.sens;
			});
			lines_sens = _.uniq(lines_sens);
			this.displayLines(lines_sens);

			_.each(records, function(record_line) {

				_.each(_.groupBy(record_line, "destination"), function(item) {

					var lines_sens = _.first(item).idligne + "," + _.first(item).sens;
					var is_terminus = (_.indexOf(marker.terminus, lines_sens) !== -1);

					var content = this.generateLineContent(this.isMetroLine(marker.lines), is_terminus, record_timestamp, item);
					full_content += content;
				}.bind(this));

			}.bind(this));

		} else {
			this.displayNoBusHelp();

			this.deleteAllBusOnMap();
			this.stopprogressBar();

			full_content += "<div class='line_content'><span class='mif-not'></span> pas de passage dans l'heure</div>";
		}
		full_content += "</div>";
		full_content += "<br>";
		if (!this.isMetroLine(marker.lines)) {
			full_content += "<button style='width:100%; text-align:center;' id='bus_count'>Pas de <img src='./images/picto/22/bus_shadow.png' height='22' width='22' alt='bus'> sur la carte pour cet arrêt</button>";
		}
	}
	full_content += "</div>";
	return full_content;
};

/**
 * Génère le contenu de la ligne dans la popup de station.
 * 
 * @param  {object} records - champs de records des données de l'API explore
 * @param  {string} idligne - numéro de ligne
 * 
 * @return {string} code html
 */
OuestmonbusApp.prototype.generateLineContent = function(isMetro, is_terminus, record_timestamp, record) {
	var content = "";

	if (isMetro && is_terminus) {
		return "";
	}

	_.each(_.first(record, 2), function(element, index) {
		if (index === 0) {
			var destination = element.destination;

			if (_.isUndefined(destination)) {
				destination = "Ligne " + element.idligne;
			} else {
				destination = destination.replace("- | ", "-");
				destination = destination.replace(" | ", "&nbsp;");
				destination = "<b>&#9658;&nbsp;Direction&nbsp;" + destination + "</b>";
			}

			if (is_terminus) {
				destination = "<b><font color='#787878 '>&nbsp; Terminus à cet arrêt</font></b>";
			}
			content += this.generateImgHtml(element.idligne, element.sens);
			content += "<span>" + destination + "</span><br>";
		}
		var accurate = (element.precision === "Temps réel") && (index === 0);
		content += this.generateLineDeparture(
			new Date(),
			element.depart,
			accurate,
			element.departtheorique,
			is_terminus,
			isMetro);
	}.bind(this));

	return "<div class='line_content'>" + content + "</div>";
};


/**
 * Génère le code html de la ligne d'horaire (ex "12:56:00 dans 45min ! retard 5min")
 * 
 * @param  {string} server_localtime - heure courante du serveur d'API
 * @param  {string} time - heure de passage
 * @param  {Boolean} accurate - temps réel
 * @param  {string} expected - heure théorique
 * 
 * @return {string} code html
 */
OuestmonbusApp.prototype.generateLineDeparture = function(localtime, time, accurate, expected, is_terminus, isMetro) {
	var now = moment();

	var departure = moment(time);
	var wait_min = departure.diff(now, "minutes");
	expected = moment(expected);
	var retard_min = departure.diff(expected, "minutes");

	var retard_min_prefix = "";
	if (retard_min > 0) {
		retard_min_prefix = "en retard de ";
	}
	if (retard_min < 0) {
		retard_min_prefix = "en avance de ";
	}
	var retard_str = "";

	if (accurate && (retard_min < -1)) {
		this.displayRetardHelp();
		retard_str = " <span class='mif-sync-problem mif-lg fg-red'></span> <b>" + retard_min_prefix + Math.abs(retard_min) + " min</b>";
	} else
	if (accurate && (retard_min !== 0)) {
		this.displayRetardHelp();
		retard_str = " <span class='mif-sync-problem mif-lg'></span> " + retard_min_prefix + Math.abs(retard_min) + " min";
	}

	var line_h = "";
	var wait_str = "";
	if (wait_min < 1) {
		if (is_terminus) {
			wait_str = "<span><b> dans < 1 min</b></span>";
		} else {
			wait_str = "<span class= 'fg-red'><b> dans < 1 min</b></span>";
		}
	} else {
		if (wait_min < 3 && !is_terminus && !isMetro) {
			wait_str = "<span class= 'fg-red'>dans <b>" + wait_min + " min</b></span>";
		} else {
			wait_str = "<span>dans <b>" + wait_min + " min</b></span>";
		}
	}
	line_h = "<u>" + departure.format("HH:mm:ss") + "</u> " + wait_str + " " + retard_str;

	return "<div class='popup_line'>" + line_h + "</div>";
};

/**
 * Informe l'utilisateur que l'API STAR est en rade..
 */
OuestmonbusApp.prototype.displayAPIError = function(err) {
	if (this.markerCurrentDisplay) {
		this.markerCurrentDisplay.getPopup().setContent("<b>Erreur:</b> " + err);
	}

	$.Notify({
		caption: "Erreur",
		content: "Impossible d'interroger les données en temps réel (" + err + ")",
		type: "error"
	});
};

/**
 * Annule et relance un timer pour le rafraîchissement des stations.
 */
OuestmonbusApp.prototype.delayRefreshAllStations = function() {
	if (this.refreshAllStationsTimer) {
		clearTimeout(this.refreshAllStationsTimer);
	}
	this.refreshAllStationsTimer = setTimeout(function() {
		this.getAllTodayStationsData(this.displayAllStations.bind(this));
	}.bind(this), STATION_LIST_REFRESH);
};

/**
 * Rafraichie le contenue de la station actuellement ouverte
 */
OuestmonbusApp.prototype.refreshStation = function() {
	this.startprogressBar();
	if (this.refreshStationTimer) {
		clearTimeout(this.refreshStationTimer);
	}
	this.refreshStationTimer = setTimeout(function() {
		if (this.markerCurrentDisplay) {
			this.getNextDepartures(this.isMetroLine(this.markerCurrentDisplay.lines), this.markerCurrentDisplay.idarret, function(data) {
				this.setPopupContent(this.markerCurrentDisplay, data);
			}.bind(this), function() {
				this.setPopupContent(this.markerCurrentDisplay, null);
				//this.OldAPIgetNextDepartures(this.markerCurrentDisplay.idarret);
			}.bind(this));
			this.refreshStation();
		}
	}.bind(this), STATION_CONTENT_REFRESH);
};

OuestmonbusApp.prototype.startprogressBar = function() {
	this.stopprogressBar();
	this.progressbar.animate(1);
};

OuestmonbusApp.prototype.stopprogressBar = function() {
	this.progressbar.stop();
	this.progressbar.set(0);
};


///////////////////////////////////////////////////////////////////////////////
///////////////////////// Classe InfosTrafics /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function InfosTrafics(app) {
	this.app = app;

	this.linesPicto_cache_moment = this.app.getLocalStorage("linesPicto_cache_moment");
	this.linesPicto = JSON.parse(this.app.getLocalStorage("linesPicto"));

	this.allInfos = null;
}

InfosTrafics.prototype.fetchLinesAndAlerts = function() {

	if (this.linesPicto_cache_moment === null || this.linesPicto === null || moment(this.linesPicto_cache_moment).diff(moment(), "days") > 0) {
		this.linesPicto = {};

		$.getJSON("http://data.keolis-rennes.com/json/?cmd=getlines&version=2.0&key=GBWOP6EQ50T79VC",
			function(data) {
				if (typeof(data) === "object" && data !== null) {
					var status = Number(data.opendata.answer.status["@attributes"].code);
					if (status === 0) {

						_.each(data.opendata.answer.data.line, function(element) {
							this.linesPicto[element.name.toUpperCase()] = element.picto;
						}.bind(this));

						this.app.setLocalStorage("linesPicto_cache_moment", moment().format());
						this.app.setLocalStorage("linesPicto", JSON.stringify(this.linesPicto));

						this.fetchAlert();
					} else {
						this.app.displayAPIError("Impossible de récupérer les infos de lignes (status:" + status + ")");
					}
				}
			}.bind(this)).fail(function() {
			this.app.displayAPIError("Impossible de récupérer les infos de lignes (connect)");
		}.bind(this));
	} else {
		this.fetchAlert();
	}
};

InfosTrafics.prototype.fetchAlert = function() {

	var url_api = "https://data.explore.star.fr/api/records/1.0/search?" +
        "apikey=3324de385f6b7b5bdfa1727d3e1a9f4bed5dd1accb288db6df5e8487" +
		"&dataset=tco-busmetro-trafic-alertes-tr" +
		"&facet=niveau&facet=debutvalidite&facet=finvalidite&facet=idligne&facet=nomcourtligne";

	$.getJSON(url_api,
		function(data) {
			if (typeof(data) === "object" && data !== null && typeof(data.parameters) === "object") {
					this.save(data);
				} else {
					this.app.displayAPIError("Impossible de récupérer les infos trafics (status:" + status + ")");
				}
		}.bind(this)).fail(function() {
		this.app.displayAPIError("Impossible de récupérer les infos trafics (connect)");
	}.bind(this));
};

InfosTrafics.prototype.save = function(data) {
	this.allInfos = data.records;
	$("#trafic_dlg_content").html(this.getHtml());
	this.setCount();
};

InfosTrafics.prototype.setCount = function() {
	$("#perturbations_btn").attr("data-hint", "Infos trafic| " + this.allInfos.length + " pertubations");
};

InfosTrafics.prototype.getPictoListHtml = function(pictolist) {
	var res = "";
	for (var i = 0; i < pictolist.length; i++) {
		var picto = this.getPictoHtml(pictolist[i]);
		if (picto !== null) {
			res += picto;
		} else {
			break; // don't continue for if not a picto
		}
	}
	return res;
};

InfosTrafics.prototype.getPictoHtml = function(picto) {

	if (typeof(picto) === "undefined") {
		return "";
	}
	if (picto === "A") {
		picto = "LA";
	}
	var html = "<img src='./images/picto/22/" + picto + ".png' height='22' width='22' alt='" + picto + "' style='margin-right:2px;'>";
	return html;
};

InfosTrafics.prototype.formatDetail = function(input) {

	return input.replace(/(?:\r\n|\r|\n)/g, "<br>");
};

InfosTrafics.prototype.getHtml = function() {
	var html = "";
	if (this.allInfos && typeof(this.allInfos) !== "undefined") {
		html += "<div class='accordion' data-role='accordion'>";
		_.each(this.allInfos, function(info) {
			var div_lines = "<div class='place-right'>";
			div_lines += this.getPictoHtml(info.fields.idligne);
			div_lines += "</div>";

			html += "<div class='frame'>";
			html += "<div class='heading'>" + info.fields.titre + div_lines + "</div>";
			html += "<div class='content'>" + this.formatDetail(info.fields.description) + "</div>";
			html += "</div>";
		}.bind(this));
		html += "</div>";
	} else {
		html += "<div data-role='preloader' data-type='ring' data-style='dark'></div>";
	}

	return html;
};


///////////////////////////////////////////////////////////////////////////////
///////////////////////// Classe Localization /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Localisation de l'utilisateur.
 * @constructor
 */
function Localization(app, map) {
	this.app = app;
	this.map = map;

	this.marker_me = null; // position "vous êtes ici"
	this.circle_me = null; // rayon ||

	this.nearestStation = null;

	this.last_lat = null;
	this.last_lng = null;

	this.last_localisation = null;
	this.current_loc = null;
}

/**
 * Localise l'utilisateur avec le navigateur.
 */
Localization.prototype.autoLocate = function() {
	this.map.locate({
		setView: true,
		maxZoom: this.map.DEFAULT_ZOOM
	});
	this.map.once("locationfound", this.onLocationFound.bind(this));
	this.map.once("locationerror", this.onLocationError.bind(this));
};

/**
 * Appelé quand la localisation est trouvée.
 */
Localization.prototype.onLocationFound = function(e) {
	this.app.removeWaitCenterSpinner();
	this.showLocation(e.latlng, true, true, Math.round(e.accuracy / 2));
};

Localization.prototype.deleteMarkerMe = function() {
	if (this.marker_me && this.map.hasLayer(this.marker_me)) {
		this.map.removeLayer(this.marker_me);
	}
	if (this.circle_me && this.map.hasLayer(this.circle_me)) {
		this.map.removeLayer(this.circle_me);
	}
};

Localization.prototype.showLocation = function(latlng, youarehere, show_circle, radius) {
	if (this.map.getBounds().contains(latlng)) {

		if (radius > 1000) {
			this.onLocationError();
		} else {

			this.deleteMarkerMe();

			this.nearestStation = this.findNearestStation(latlng);

			if (this.nearestStation.marker) {
				if (this.nearestStation.distance < 50) {
					this.app.moveMapTo(this.nearestStation.marker.getLatLng(), this.map.DEFAULT_ZOOM, this.app.openStation.bind(app, this.nearestStation.marker));

				} else {
					this.marker_me = L.marker(latlng);

					var station_url = this.app.getStationUrl(this.nearestStation.marker);
					var station_html = "<a class='fg-white' id='nearestStationLink' href='" + station_url +
						"' onclick='app.followNearestStation();return false;'>" +
						"<div class='station_name'>" + this.nearestStation.marker.nomarret + "</div></a>";

					var marker_str = "";
					if (youarehere) {
						marker_str = "<b>Vous êtes ici !</b><br>";
						if (this.nearestStation.distance < 1000) {
							marker_str += "L'arrêt de bus le plus proche de vous est:<br>" + station_html;
							marker_str += "à " + Math.round(this.nearestStation.distance) + " m.";
						}

						this.marker_me.bindPopup(marker_str);
						this.marker_me.addTo(this.map);
						this.marker_me.openPopup();
					} else {
						if (this.nearestStation.distance < 1000) {
							marker_str += "L'arrêt de bus le plus proche est:<br>" + station_html;
							marker_str += "à " + Math.round(this.nearestStation.distance) + " m.";
							this.marker_me.bindPopup(marker_str);
							this.marker_me.addTo(this.map);
							this.marker_me.openPopup();
						} else {
							this.marker_me.addTo(this.map);
						}
					}
				}
			}
			if (show_circle) {
				this.circle_me = L.circle(latlng, radius).addTo(this.map);
			}
		}
	} else {

		var dialog = $("#localisation_nothere_dlg").data("dialog");
		this.app.dialogCurrentDisplay = dialog;

		$("#localisation_nothere_dlg_close").click({
			dlg: dialog
		}, function(e) {
			e.data.dlg.close();
			$(".photon-input").show();
			$(".photon-input").focus();
		});

		dialog.open();
		this.app.updateDialogPosition();

		this.app.moveMapTo(this.map.DEFAULT_POSITION, this.map.DEFAULT_ZOOM);
	}
};


Localization.prototype.findNearestStation = function(latlng) {
	var nearestStation = {};
	var g = L.geoJson(this.map.cluster_markers.toGeoJSON());
	var res = _.first(leafletKnn(g).nearest(latlng, 1, 20000));

	this.map.cluster_markers.eachLayer(function(layer) {
		if (res.layer.feature.properties.id === layer.idarret) {
			nearestStation.marker = layer;
			nearestStation.distance = layer.getLatLng().distanceTo(latlng);
		}
	});

	return nearestStation;
};


/**
 * Appelé quand la localisation n'est trouvée.
 */
Localization.prototype.onLocationError = function() {
	this.app.removeWaitCenterSpinner();
	var dialog = $("#localisation_failed_dlg").data("dialog");
	this.app.dialogCurrentDisplay = dialog;

	$("#localisation_failed_dlg_close").click({
		dlg: dialog
	}, function(e) {
		e.data.dlg.close();
		$(".photon-input").show();
		$(".photon-input").focus();
	});

	dialog.open();
	this.app.updateDialogPosition();
};

/**
 * Converti le hash URL en LatLng.
 * 
 * @param {string} url
 */
Localization.prototype.urlToZoomLatLng = function(url) {
	var res = null;
	try {
		var map_pos = url.substring(url.indexOf("map"));

		var zoom_str_x = map_pos.indexOf("=") + 1;
		var lat_str_x = map_pos.indexOf("/") + 1;
		var lng_str_x = map_pos.indexOf("/", lat_str_x);

		var zoom = Number(map_pos.substring(zoom_str_x, lat_str_x - 1));

		var lat = Number(map_pos.substring(lat_str_x, lng_str_x)).toFixed(5);
		var lng = Number(map_pos.substring(lng_str_x + 1)).toFixed(5);

		if (isNaN(lat) || isNaN(lng)) {
			throw "Nan";
		}

		var latlng = L.latLng(lat, lng);

		if (!this.map.MAXBOUNDS.contains(latlng)) {
			throw "not in Map";
		}

		res = [zoom, latlng];
	} catch (err) {
		//console.log("Err:"+err);
		res = null;
	}
	return res;
};

Localization.prototype.getAddress = function(lat, lng) {
	if (lat !== this.last_lat || lng !== this.last_lng) {
		$.getJSON("https://photon.komoot.de/reverse?lon=" + this.map.getCenter().lng + "&lat=" + this.map.getCenter().lat,
			function(data) {
				if (_.isObject(data) &&
					_.isObject(data.features) &&
					_.isObject(data.features[0]) &&
					_.isObject(data.features[0].properties)) {
					var p = data.features[0].properties;
					var loc = [];
					if (!_.isUndefined(p.city)) {
						loc.push(p.city);
					}
					if (!_.isUndefined(p.name)) {
						loc.push(p.name);
					}

					this.current_loc = loc.join(", ");
					document.title = "Où est mon bus ? à " + this.current_loc;
				}
			}.bind(this));
	}
	this.last_lng = lng;
	this.last_lat = lat;
};