"use strict";


var fs = require("fs");
var _ = require("underscore");
var moment = require("moment");
var async = require("async");

var findGTFSDirectory = function(path, date) {

	var dircontent = fs.readdirSync(path);

	var result = "";

	_.each(dircontent.sort(), function(element) {
		if (fs.statSync(path + element).isDirectory()) {
			var dirdate = moment(element);

			if (date.isAfter(dirdate, "days") || date.isSame(dirdate, "days")) {
				result = element;
			}
		}
	});
	return path + result + "/";
};


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

var getServiceIdToday = function(date, callback) {
	var GTFSdir = findGTFSDirectory("../GTFS/", date);
	var gtfsfile = GTFSdir + "calendar.txt";
	console.log("use " + gtfsfile);

	new GTFSFileToArray(gtfsfile, function(calendar_line) {
		// service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date
		var services = [];
		_.each(calendar_line, function(element) {
			var start_date = moment(element.start_date, "YYYYMMDD");
			var end_date = moment(element.end_date, "YYYYMMDD");

			if (moment(date).isBetween(start_date, end_date, "day") || moment(date).isSame(start_date, "day") || moment(date).isSame(end_date, "day")) {

				var weekDay = moment(date).days(); // 0 Dimanche -> 6 Samedi
				if (element.sunday === "1" && weekDay === 0) {
					services.push(Number(element.service_id));
				}
				if (element.monday === "1" && weekDay === 1) {
					services.push(Number(element.service_id));
				}
				if (element.tuesday === "1" && weekDay === 2) {
					services.push(Number(element.service_id));
				}
				if (element.wednesday === "1" && weekDay === 3) {
					services.push(Number(element.service_id));
				}
				if (element.thursday === "1" && weekDay === 4) {
					services.push(Number(element.service_id));
				}
				if (element.friday === "1" && weekDay === 5) {
					services.push(Number(element.service_id));
				}
				if (element.saturday === "1" && weekDay === 6) {
					services.push(Number(element.service_id));
				}
			}
		});
		try {
			var gtfsfile = GTFSdir + "calendar_dates.txt";
			fs.lstatSync(gtfsfile);
			console.log("use " + gtfsfile);

			new GTFSFileToArray(gtfsfile, function(date_line) {
				_.each(date_line, function(element) {
					if (moment(element.date, "YYYYMMDD").isSame(date)) {
						services.push(Number(element.service_id));
					}
				});
			});
			callback(services);
		} catch (e) {
			if (e.code === "ENOENT") {

				callback(services);
			} else {
				console.log(e);
			}
		}
	});
};

var getTripFromServiceId = function(date, service_id, callback) {

	var GTFSdir = findGTFSDirectory("../GTFS/", date);
	var gtfsfile = GTFSdir + "trips.txt";
	console.log("use " + gtfsfile);

	new GTFSFileToArray(gtfsfile, function(data) {
		var trips = {};

		_.each(data, function(element) {
			if (_.indexOf(service_id, Number(element.service_id)) !== -1) {
				var info = {};
				info.route_id = element.route_id;
				info.last_sequence = 1;
				info.sens = element.direction_id;
				trips[element.trip_id] = info;
			}
		});

		callback(trips);
	});
};

var generateStopMap = function(date, trips, callback) {
	var GTFSdir = findGTFSDirectory("../GTFS/", date);
	var gtfsfile = GTFSdir + "stops.txt";
	console.log("use " + gtfsfile);

	var all_stops = {};

	new GTFSFileToArray(gtfsfile, function(stops_line) {

		_.each(stops_line, function(element) {
			var stop_detail = {};
			stop_detail.id = element.stop_id;
			stop_detail.name = element.stop_name;
			stop_detail.lat = element.stop_lat;
			stop_detail.lng = element.stop_lon;
			stop_detail.trips = {};

			all_stops[element.stop_id] = stop_detail;
		});
		callback(trips, all_stops);
	});
};

var associateTrips = function(date, stops, trips, callback) {
	var GTFSdir = findGTFSDirectory("../GTFS/", date);

	new GTFSFileToArray(GTFSdir + "stop_times.txt", function(stop_times) {

		_.each(stop_times, function(stop_times_element) {

			if (_.has(trips, stop_times_element.trip_id)) {
				var stop_info = {};
				stop_info.arrival_time = stop_times_element.arrival_time;
				stop_info.departure_time = stop_times_element.departure_time;
				stop_info.route_id = trips[stop_times_element.trip_id].route_id;
				stop_info.sens = trips[stop_times_element.trip_id].sens;
				trips[stop_times_element.trip_id].last_sequence =  Math.max(trips[stop_times_element.trip_id].last_sequence, stop_times_element.stop_sequence); 
				stop_info.stop_sequence = stop_times_element.stop_sequence;

				stops[stop_times_element.stop_id].trips[stop_times_element.trip_id] = stop_info;
			}
		});
		callback(stops,trips);
	});
};

var finalizeStops = function(stops, trips, callback) {

	var GeoJSON = require("geojson");


	var stops_filtred = _.filter(stops, function(val) {
		return _.size(val.trips) > 0;
	});

	if(debug_station_filter !== null)
	{
		stops_filtred = _.filter(stops, function(val) {
			return Number(val.id) === Number(debug_station_filter);
		});
	}

	_.each(stops_filtred, function(element_stop) {

		var terminus = _.filter(element_stop.trips, function(value, key) {
			return value.stop_sequence == trips[key].last_sequence;
		});

		// remove trips terminus
		// element_stop.trips = _.reject(element_stop.trips, function(value, key) {
		// 	return value.stop_sequence == trips[key].last_sequence;
		// });

		var first = _.min(element_stop.trips, function(val) {
			return moment(val.arrival_time, "HH:mm:ss");
		});
		var last = _.max(element_stop.trips, function(val) {
			return moment(val.departure_time, "HH:mm:ss");
		});
		var lines = _.map(element_stop.trips, function(item){
			return ""+item.route_id+","+item.sens;
		});

		if (debug_station_filter === null)
		{
			delete element_stop.trips;
		}
		element_stop.terminus = _.map(terminus,function(item){
			return ""+item.route_id+","+item.sens;
		});

		element_stop.terminus = _.uniq(element_stop.terminus);
		element_stop.limits = [first.arrival_time, last.departure_time];
		element_stop.lines = _.uniq(lines);
	});

	// remove terminus only station
	// stops_filtred = _.filter(stops_filtred,function(item){
	// 	return item.limits[0] !== undefined && item.limits[1] !== undefined;
	// });
	// 

	var gjson = GeoJSON.parse(stops_filtred, {
		Point: ["lat", "lng"]
	});

	callback(gjson);
};

var args = process.argv.slice(2);

var debug_station_filter = null;

var day = moment();

if (args.length > 0)
{
	console.log("args: "+args[0])
	if (_.isNumber(Number(args[0])))
	{
		day.add(args[0], 'days');
	}
	else
	{
		if (args[0] === "debug")
		{
			debug_station_filter = args[1];
			console.log("debug station "+debug_station_filter);
		}
		else
		{
			console.log("error bad command line");
			process.exit();
		}
	}
}

async.waterfall([
	function(callback) {
		getServiceIdToday(day, function(services) {
			callback(null, services);
		});
	},
	function(services, callback) {
		getTripFromServiceId(day, services, function(trips) {
			callback(null, trips);
		});
	},
	function(trips, callback) {
		generateStopMap(day, trips, function(trips, stops) {
			callback(null, trips, stops);
		});
	},
	function(trips, stops, callback) {
		associateTrips(day, stops, trips, function(stops_completed) {
			callback(null, stops_completed,trips);
		});
	},
	function(stops_completed, trips, callback) {
		finalizeStops(stops_completed, trips, function(result) {
			callback(null, result);
		});
	}
], function(err, result) {
	var mkdirp = require("mkdirp");

	var dirname = "../today/" + day.format("YYYY-MM-DD") + "/";

	mkdirp(dirname, function(err) {
		if (err) {
			console.error(err);
		} else {
			fs.writeFile(dirname + "stations.geojson", JSON.stringify(result), function(err) {
				if (err) {
					return console.log(err);
				}
				console.log("The file " + dirname + "stations.geojson" + " was saved!");
			});
		}
	});

});