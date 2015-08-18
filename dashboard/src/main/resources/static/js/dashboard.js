// Load Map 
// var map = L.map('map').setView([40.061, -97.515], 4);
var mapboxUrl = 'https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}';
var mapID = 'albertoaflores.llpjgl43';
var mapToken = 'pk.eyJ1IjoiYWxiZXJ0b2FmbG9yZXMiLCJhIjoiS3duWUxzUSJ9.X1rRTTRkktNR7DFIc0DsCw';
var mapboxAttribution = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>';

L.FlashingMarker = L.Marker.extend({
	options : {
		interval : 500,
	},

	onAdd : function(map) {
		L.Marker.prototype.onAdd.call(this, map);
		this.start();
	},

	onRemove : function(map) {
		this.stop();
		L.Marker.prototype.onRemove.call(this, map);
	},

	flash : function() {
		if (this._icon) {
			if (this._flashed) {
				this._icon.src = this.options.icon.options.iconUrl;
				delete this._flashed;
			} else {
				this._icon.src = this.options.icon.options.flashIconUrl;
				 this._flashed = true;
			}
			
			// Queue up the animation
			if (this.options.icon.options.flashIconUrl && this.options.interval > 0) {
				this._tid = setTimeout(this.flash.bind(this), this.options.interval);
			} else {
				this.stop();
			}
		}		
	},

	setIcon : function(icon) {
		L.Marker.prototype.setIcon.call(this, icon);
		if (icon.options.flashIconUrl) {
			if (this._icon && this._flashed) {
				this._icon.src = icon.options.flashIconUrl;
			}
			this.start();
		} else {
			this.stop();
		}
	},
	
	// Start the animation
	start : function() {
		if (!this._started && this.options.icon.options.flashIconUrl && this.options.interval && this.options.interval > 0) {
			delete this._flashed;
			this.flash();
			this._started = true;
		}
	},
	
	// Stop the animation in place
	stop : function() {
		if (this._tid) {
			clearTimeout(this._tid);
			delete this._tid;
		}
		if (this._flashed && this._icon) {
			this._icon.src = this.options.icon.options.iconUrl;
			delete this._flashed;
		}
		this._started = false;
	}

});

L.flashingMarker = function(latlngs, options) {
	return new L.FlashingMarker(latlngs, options);
};

// create map
var map = L.map('map', {
	center : [ 38.9047, -77.0164 ],
	zoom : 10,
//	markerZoomAnimation: false
});

var miniMap = L.map('miniMap', {
	center : [ 38.9047, -77.0164 ],
	zoom : 15
});

// Creates markers for each group
var inMotionNormalMarker = icon('bus', '#009500', true);
var stoppedNormalMarker = icon('bus', '#009500');
var inMotionServiceInfoMarker = icon('bus', '#0000FF', true);
var stoppedServiceInfoMarker = icon('bus', '#0000FF');
var inMotionServiceSoonMarker = icon('bus', '#FFFF00', true);
var stoppedServiceSoonMarker = icon('bus', '#FFFF00');
var inMotionServiceNowMarker = icon('bus', '#FFA500', true);
var stoppedServiceNowMarker = icon('bus', '#FFA500');
var inMotionStopTruckMarker = icon('bus', '#FF0000', true);
var stoppedStopTruckMarker = icon('bus', '#FF0000');

// Create markers for the RentMe Unit Locations
var serviceCenterMarker = icon('commercial', '#5F9EA0');

function icon(symbol, color, flash, size) {
	size = size || [35, 90];
	color = (color || '7e7e7e').replace('#', '');
	var icon = L.icon({
		iconUrl: 'http://a.tiles.mapbox.com/v4/marker/pin-l' + (symbol ? "-" + symbol : '') + '+' + color + (L.Browser.retina ? '@2x' : '') + '.png?access_token=' + mapToken,
		iconSize: [35, 90],
	    iconAnchor: [size[0] / 2, size[1] / 2],
	    popupAnchor: [0, -size[1] / 2],
	    flashIconUrl: flash ? 'http://a.tiles.mapbox.com/v4/marker/pin-l+' + color + (L.Browser.retina ? '@2x' : '') + '.png?access_token=' + mapToken : undefined
	});
	return icon;
}

function setupDefaultMap() {
	// add map tiles
	L.tileLayer(mapboxUrl, {
		attribution : mapboxAttribution,
		maxZoom : 18,
		subdomains : [ 'a', 'b', 'c', 'd' ],
		id : mapID,
		token : mapToken
	}).addTo(map);

	// query for all points by default
	initFilter();
	initVehicles();
}

function setupMinimap() {
	// add map tiles
	L.tileLayer(mapboxUrl, {
		maxZoom : 18,
		subdomains : [ 'a', 'b', 'c', 'd' ],
		id : mapID,
		token : mapToken
	}).addTo(miniMap);
}

// configure search bar widget
var visualSearch;
function setupSearchBar() {
	// initialize search box
	$(document).ready(function() {
		visualSearch = VS.init({
			container : $('.visual_search'),
			query : '',
			showFacets : true,
			unquotable : [],
			callbacks : {
				search : function(query, searchCollection) {
					// perform query
					updateSearch();
				},
				facetMatches : function(callback) {
					callback([ 'Customer', 'VIN', 'Unit ID' ]);
				},
				valueMatches : function(facet, searchTerm, callback) {

				}
			}
		});
	});
}

// empty query object
function buildQuery() {
	var queryFilter = {};
	queryFilter.vins = [];
	queryFilter.customers = [];
	queryFilter.unitIds = [];
	queryFilter.serviceFilters = [];
	queryFilter.vehicleMovementFilters = [];
	return queryFilter;
}

function initFilter() {
	filter = buildQuery();
}

function setupRabbitConnection() {
	var socket = new SockJS('/location-updates-stomp/stomp');
    var stompClient = Stomp.over(socket);
    var on_connect = function() {
        console.log('connected');
    };
    var on_error =  function() {
        console.log('error');
        console.log(JSON.stringify(arguments));
    };
    stompClient.connect('guest', 'guest', on_connect, on_error, '/');
    
//    stompClient.connect({}, function(frame) {
//        setConnected(true);
//        console.log('Connected: ' + frame);
//        stompClient.subscribe('/topic/notify', function(message){
//            showMessage(JSON.parse(message.body).content);
//        });
//    });
    
//	Stomp.WebSocketClass = SockJS;
//
//    var client = Stomp.client('/location-updates-stomp/stomp');
//    var on_connect = function() {
//        console.log('connected');
//    };
//    var on_error =  function() {
//       console.log('error');
//     console.log(JSON.stringify(arguments));
//    };
//    client.connect('guest', 'guest', on_connect, on_error, '/');
}

function initVehicles() {
	var vehicles = [];
	// processing - spin!
	$("#spinnerIcon").show();
	collectPages('/fleet-location-service/locations', function(result) {
		vehicles = vehicles.concat(result.locations);
	}, function() {
		vehiclesIndex = {};
		
//		var trimedData = [];
//		for (var i = 0; i < vehicles.length && trimedData.length < 1; i++) {
//			if (vehicles[i].vin && vehicles[i].latitude && vehicles[i].longitude) {
//				trimedData.push(vehicles[i]);
//			}
//		}
//		vehicles = trimedData;

		// Fix up the data
		vehicles.forEach(function(vehicle) {
			if (!vehicle.vin && vehicle.latitude && vehicle.longitude) {
				vehicle.vin = createIdFromCoordinates(vehicle.latitude, vehicle.longitude);
			}
			if (vehicle.vin) {
				vehiclesIndex[vehicle.vin] = vehicle;				
			}
		});
		
		showVehicles();
		
		setupRabbitConnection();
		
		$("#spinnerIcon").hide();
	});
}

function showVehicles() {
	clearFleetMarkers();
	// See https://github.com/Leaflet/Leaflet.markercluster
	markers = L.markerClusterGroup({maxClusterRadius: 30}); /*L.layerGroup();*/
	markersMap = [];
	Object.keys(vehiclesIndex).forEach(function(vin) {
    	var vehicle = vehiclesIndex[vin];
		if (shouldShowMarker(vehicle)) {
			if (vehicle.latitude && vehicle.longitude) {
				createMarker(vehicle);
//				setTimeout(function() {
////					if (vehicle.vehicleMovementType === 'IN_MOTION') {
//						liveGpsUpdate(vehiclesIndex[vin]);
////					}
//					liveServiceUpdate(vehiclesIndex[vin]);
//				}, 5000);
			} else {
				var obj = {
					lat : vehicle.latitude,
					lon : vehicle.longitude
				};
				msg = "FAIL - VIN: " + vehicle.vin + " JSON: "
						+ JSON.stringify(obj) + " TSP: " + vehicle.tspProvider;
				console.log(msg);
			}
		}
	});
	map.addLayer(markers);
}

function shouldShowMarker(vehicle) {
	return vehicle &&
		(filter.serviceFilters.length === 0 || filter.serviceFilters.indexOf(vehicle.serviceType) >= 0) &&
		(filter.vehicleMovementFilters.length === 0 || filter.vehicleMovementFilters.indexOf(vehicle.vehicleMovementType) >= 0);
}

function createMarker(vehicle) {
	var iconType = resolveMarker(vehicle);
	var marker = L.flashingMarker({
		lat : vehicle.latitude,
		lon : vehicle.longitude
	}, {
		icon : iconType
	});
	marker.vin = "" + vehicle.vin;
	marker.vehicle = vehicle;
	marker.on('click', markerClickHandler);
	marker.bindPopup("Vin: " + vehicle.vin);
	markers.addLayer(marker);
	markersMap[vehicle.vin] = marker;
	return marker;
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function updateTruckGpsData(info) {
	var vehicle = vehiclesIndex[info.vin];
	if (vehicle) {
		vehicle.latitude = info.latitude;
		vehicle.longitude = info.longitude;
		vehicle.heading = info.heading;
		vehicle.address = info.address
		vehicle.odometer = info.odometer;
		vehicle.vehicleMovementType = info.movementType;
		updateVehicleOnMap(vehicle);
		updateVehicleOnMiniMap(vehicle);
	}
}

function updateServiceData(info) {
	var vehicle = vehiclesIndex[info.vin];
	if (vehicle) {
		vehicle.serviceType = info.serviceType;
		updateVehicleOnMap(vehicle);
		updateVehicleOnMiniMap(vehicle);
	}
}

function updateVehicleOnMap(vehicle) {
	var marker = markersMap[vehicle.vin];
	if (shouldShowMarker(vehicle)) {
		if (marker) {
			updateMarker(marker);
		} else {
			createMarker(vehicle);
		}
	} else {
		if (marker) {
			removeMarker(marker);
		} else {
			// Do nothing
		}
	}
}

function updateVehicleOnMiniMap(vehicle) {
	if (minimapMarker && minimapMarker.vehicle && vehicle.vin === minimapMarker.vehicle.vin) {
		minimapMarker.vehicle = vehicle;
		setupMiniMapMarker();
	}
}

function updateMarker(marker) {
//	marker.setLatLng({
//		lat : marker.vehicle.latitude,
//		lon : marker.vehicle.longitude
//	});
//	marker.setIcon(resolveMarker(marker.vehicle));
	removeMarker(marker);
	createMarker(marker.vehicle);
}

function removeMarker(marker) {
	markers.removeLayer(marker);
	delete markersMap[marker.vehicle.vin];
}

function setupMiniMapMarker() {
	minimapMarker.setLatLng({
		lat : minimapMarker.vehicle.latitude,
		lon : minimapMarker.vehicle.longitude
	});
	
	minimapMarker.setIcon(resolveMarker(minimapMarker.vehicle));
	
	circle.setLatLng({
		lat : minimapMarker.vehicle.latitude,
		lon : minimapMarker.vehicle.longitude
	});

	// Loading truck telemetry data
	$('#telemetryVin').text(minimapMarker.vehicle.vin);
	$('#telemetryLatitude').text(minimapMarker.vehicle.latitude);
	$('#telemetryLongitude').text(minimapMarker.vehicle.longitude);
	$('#telemetryAddress').text(minimapMarker.vehicle.address);
	$('#telemetryHeading').text(minimapMarker.vehicle.heading);
	$('#telemetryOdometer').text(minimapMarker.vehicle.odometer);
	$('#telemetryGpsSpeed').text(minimapMarker.vehicle.gpsSpeed);
	$('#telemetryGpsStatus').text(minimapMarker.vehicle.gpsStatus);
	$('#telemetryTotalIdleTime').text(minimapMarker.vehicle.totalIdleTime);
	$('#telemetryTotalFuelUsage').text(minimapMarker.vehicle.totalFuelUsage);
	$('#telemetryTimestamp').text(minimapMarker.vehicle.timestamp);
	$('#telemetryTotalEngineTime').text(minimapMarker.vehicle.totalEngineTime);
	$('#telemetryTspProvider').text(minimapMarker.vehicle.tspProvider);

	// update RentMe unit info
	if (minimapMarker.vehicle.unitInfo) {
		$('#rentmeUnitInfo').show();
		$("#customerNumber").text(minimapMarker.vehicle.unitInfo.unitNumber);
		$("#customerName").text(minimapMarker.vehicle.unitInfo.customerName);
		$("#engineMake").text(minimapMarker.vehicle.unitInfo.engineMake);
	} else {
		$('#rentmeUnitInfo').hide();
	}

	// update fault info
	if (minimapMarker.vehicle.unitFault) {
		$('#rentmeFaultInfo').show();
		$("#faultSpn").text(minimapMarker.vehicle.unitFault.spn);
		$("#faultFmi").text(minimapMarker.vehicle.unitFault.fmi);

		// update fault code info
		if (minimapMarker.vehicle.faultCode) {
			$('.rentmeFaultCode').show();
			$("#rentmeFCfaultCode").text(minimapMarker.vehicle.faultCode.faultCode);
			$("#rentmeFCfaultCodeId").text(
					minimapMarker.vehicle.faultCode.faultCodeId);
			$("#rentmeFCdescription").text(
					minimapMarker.vehicle.faultCode.description);
			$("#rentmeFCinstructions").text(
					minimapMarker.vehicle.faultCode.repairInstructions);
		} else {
			$('.rentmeFaultCode').hide();
		}
	} else {
		$('#rentmeFaultInfo').hide();
	}
}

function simulateMove(vehicle) {
	return {
		vin: vehicle.vin,
		latitude: vehicle.latitude + getRandomInt(-1000, 1000) * 0.00001,
		longitude: vehicle.longitude + getRandomInt(-1000, 1000) * 0.00001,
		heading: vehicle.heading,
		address: vehicle.address,
		odometer: getRandomInt(100, 599999),
		movementType: getRandomInt(0, 100) < 50? 'STOPPED' : 'IN_MOTION'
	};
}

function liveGpsUpdate(vehicle) {
	updateTruckGpsData(simulateMove(vehicle));
	setTimeout(function() {
		liveGpsUpdate(vehicle);
	}, 3000);
}

function liveServiceUpdate(vehicle) {
	var serviceInfoVals = ['None', 'ServiceInfo', 'ServiceSoon', 'ServiceNow', 'StopTruck'];
	updateServiceData({
		vin: vehicle.vin,
		serviceType: serviceInfoVals[getRandomInt(0, serviceInfoVals.length - 1)]
	});
	setTimeout(function() {
		liveServiceUpdate(vehicle);
	}, 5000);
}

function resolveMarker(vehicle) {
	var movementType = vehicle.vehicleMovementType;
	var serviceType = vehicle.serviceType;
	var iconType = stoppedNormalMarker;
	if (movementType == 'IN_MOTION' && serviceType == 'None') {
		iconType = inMotionNormalMarker;
	} else if (movementType == 'STOPPED' && serviceType == 'None') {
		iconType = stoppedNormalMarker;
	} else if (movementType == 'IN_MOTION' && serviceType == 'ServiceInfo') {
		iconType = inMotionServiceInfoMarker;
	} else if (movementType == 'STOPPED' && serviceType == 'ServiceInfo') {
		iconType = stoppedServiceInfoMarker;
	} else if (movementType == 'IN_MOTION' && serviceType == 'ServiceSoon') {
		iconType = inMotionServiceSoonMarker;
	} else if (movementType == 'STOPPED' && serviceType == 'ServiceSoon') {
		iconType = stoppedServiceSoonMarker;
	} else if (movementType == 'IN_MOTION' && serviceType == 'ServiceNow') {
		iconType = inMotionServiceNowMarker;
	} else if (movementType == 'STOPPED' && serviceType == 'ServiceNow') {
		iconType = stoppedServiceNowMarker;
	} else if (movementType == 'IN_MOTION' && serviceType == 'StopTruck') {
		iconType = inMotionStopTruckMarker;
	} else if (movementType == 'STOPPED' && serviceType == 'StopTruck') {
		iconType = stoppedStopTruckMarker;
	}

	return iconType;
}

var markers;
var markersMap;
var vehiclesIndex = {};
var sidebar;
var minimapMarker;
var circle;
var filter;
function markerClickHandler(event) {
	if (!(sidebar.isVisible())) {
		sidebar.toggle();
	}

	// update miniMap
	if (minimapMarker) {
		miniMap.removeLayer(minimapMarker);
		miniMap.removeLayer(circle);
	}
	miniMap.setView({
		lat : this.vehicle.latitude,
		lon : this.vehicle.longitude
	}, 8, {
		duration : 0.5
	});

	map.panTo({
		lat : this.vehicle.latitude,
		lon : this.vehicle.longitude
	}, {
		duration : 0.5
	});

	// add marker
	var iconType = resolveMarker(this.vehicle);
	minimapMarker = L.flashingMarker({
		lat : this.vehicle.latitude,
		lon : this.vehicle.longitude
	}, {
		icon : iconType
	});
	minimapMarker.vehicle = this.vehicle;
	minimapMarker.addTo(miniMap);

	// add circle
	circle = L.circle({
		lat : this.vehicle.latitude,
		lon : this.vehicle.longitude
	}, 40000, {
		color : 'red',
		fillColor : '#f03',
		fillOpacity : 0.5
	});
	circle.addTo(miniMap);
	
	setupMiniMapMarker();
}

function closeTruckInfoView() {
	$('#truckView').popup('hide');
}

// This runs from the "Search Bar" and from the "Filter" pop-up
function updateSearch() {
	filter = buildQuery();

	// iterate over the facets
	$.each(visualSearch.searchQuery.facets(), function(index, value) {
		if (value['VIN']) {
			filter.vins.push(value['VIN']);
		}
		if (value['Customer']) {
			filter.customers.push(value['Customer']);
		}
		if (value['Unit ID']) {
			filter.unitIds.push(value['Unit ID']);
		}
	});

	$('input[name="serviceFilter"]:checked').each(function() {
		filter.serviceFilters.push(this.value);
	});
	$('input[name="vehicleMovementFilter"]:checked').each(function() {
		filter.vehicleMovementFilters.push(this.value);
	});

	$("#spinnerIcon").show();
	showVehicles();
	$("#spinnerIcon").hide();
}

function clearFleetMarkers() {
	// clean up map
	if (markers) {
		map.removeLayer(markers);
		markers = null;
	}
	// clear the id -> markers map
	markersMap = [];
}

/**
 * Utility to create an unique ID using coordinates. This is needed so that we
 * can access it from other places in the DOM.
 */
function createIdFromCoordinates(latitude, longitude) {
	var messageId = "" + latitude + longitude;
	messageId = messageId.replace(/\./g, '');
	messageId = messageId.replace(/-/g, '');
	return messageId;
}

function setupServiceCenters() {
	var scg = new L.LayerGroup();
	var scg2 = new L.LayerGroup();
	var data = [];

	collectPages(
			'/service-location-service/serviceLocations',
			function(result) {
				data = data.concat(result.locations);
			},
			function() {
				// iterate over the list of results
				data
						.forEach(function(value, index) {
							var content = "<div class='scg_popup'>"
									+ "<div class='loc_header'><i class='fa fa-wrench'></i> "
									+ value.location + "</div>"
									+ "<div class='loc_comments'>"
									+ value.address2 + "</div>" + "<div>"
									+ value.address1 + "</div>" + "<div>"
									+ value.city + ", " + value.state + " "
									+ value.zip + "</div>" + "</div>";

							L.marker({
								lat : value.latitude,
								lon : value.longitude
							}, {
								icon : serviceCenterMarker
							}).bindPopup(content).addTo(scg);


							L.marker({
								lat : value.latitude,
								lon : value.longitude
							}, {
								icon : serviceCenterMarker
							}).bindPopup(content).addTo(scg2);

						});
			});

	// Overlay layers are grouped
	var groupedOverlays = {
		"<i class='fa fa-bus'></i> RentMe Locations" : {
			"Service Center <i class='fa fa-wrench'></i>" : scg
		}
	};

	// Overlay layers are grouped
	var groupedOverlays2 = {
		"<i class='fa fa-bus'></i> RentMe Locations" : {
			"Service Center <i class='fa fa-wrench'></i>" : scg2
		}
	};

	// Use the custom grouped layer control, not "L.control.layers"
	var layerControl = L.control.groupedLayers(null, groupedOverlays, null);
	map.addControl(layerControl);
	var layerControl2 = L.control.groupedLayers(null, groupedOverlays2, null);
	miniMap.addControl(layerControl2);
}

function getMiles(i) {
	return i * 0.000621371192;
}

function getMeters(i) {
	return i * 1609.344;
}

function setupMapLegend() {
	// control that shows state info on hover
	var info = L.control({
		position : 'bottomleft'
	});

	info.onAdd = function(map) {
		this._div = L.DomUtil.create('div', 'info');
		var img = '<img src="https://www.mapbox.com/maki/renders/bus-18' + (L.Browser.retina ? '@2x' : '') + '.png">';
		this._div.innerHTML = '<h4 style="color: black">RentMe Trucks</h4>'
				+ '<i class="faa-flash animated">' + img + '</i> Moving &nbsp;&nbsp;&nbsp;&nbsp; ' + img + ' Stopped <br/>'
				+ '<i class="fa fa-map-marker" style="color: green;"></i> Normal &nbsp;&nbsp;'
				+ '<i class="fa fa-map-marker" style="color: blue"></i> ServiceInfo &nbsp;&nbsp;'
				+ '<i class="fa fa-map-marker" style="color: yellow"></i> ServiceSoon &nbsp;&nbsp;'
				+ '<i class="fa fa-map-marker" style="color: orange"></i> ServiceNow &nbsp;&nbsp;'
				+ '<i class="fa fa-map-marker" style="color: red"></i> StopNow &nbsp;';
		return this._div;
	};

	info.addTo(map);
}

function setupSidebar() {
	sidebar = L.control.sidebar('sidebar', {
		closeButton : true,
		position : 'right'
	});
	map.addControl(sidebar);

	map.on('click', function() {
		sidebar.hide();
	});

	sidebar.on('show', function() {
		console.log('Sidebar will be visible.');
	});

	sidebar.on('shown', function() {
		console.log('Sidebar is visible.');
	});

	sidebar.on('hide', function() {
		console.log('Sidebar will be hidden.');
	});

	sidebar.on('hidden', function() {
		console.log('Sidebar is hidden.');
	});

	L.DomEvent.on(sidebar.getCloseButton(), 'click', function() {
		console.log('Close button clicked.');
	});
}

// See http://dev.vast.com/jquery-popup-overlay/  
$(document).ready(function() {
	// Initialize the plugin
    $('#my_popup').popup({
        type: 'tooltip',
        transition: '0.3s all 0.1s',
        tooltipanchor: $('#navbar'),
        vertical: 'bottom',
        onopen: function () {
        	$('input[name="serviceFilter"]').each(function() {
        		this.checked = filter.serviceFilters.indexOf(this.value) >= 0;
        	});
        	$('input[name="vehicleMovementFilter"]').each(function() {
        		this.checked = filter.vehicleMovementFilters.indexOf(this.value) >= 0;
        	});
        }
    });
});

setupSearchBar();
setupDefaultMap();
setupMinimap();
setupServiceCenters();
setupMapLegend();
setupSidebar();
