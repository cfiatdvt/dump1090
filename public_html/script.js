// -*- mode: javascript; indent-tabs-mode: nil; c-basic-offset: 8 -*-
"use strict";

// Define our global variables
var OLMap         = null;
var StaticFeatures = new ol.Collection();
var SiteCircleFeatures = new ol.Collection();
var PlaneIconFeatures = new ol.Collection();
var PlaneTrailFeatures = new ol.Collection();
var Planes        = {};
var PlanesOrdered = [];
var PlaneFilter   = {};
var SelectedPlane = null;
var SelectedAllPlanes = false;
var HighlightedPlane = null;
var FollowSelected = false;
var infoBoxOriginalPosition = {};
var customAltitudeColors = true;

var SpecialSquawks = {
        '7500' : { cssClass: 'squawk7500', markerColor: 'rgb(255, 85, 85)', text: 'Aircraft Hijacking' },
        '7600' : { cssClass: 'squawk7600', markerColor: 'rgb(0, 255, 255)', text: 'Radio Failure' },
        '7700' : { cssClass: 'squawk7700', markerColor: 'rgb(255, 255, 0)', text: 'General Emergency' }
};

// Get current map settings
var CenterLat, CenterLon, ZoomLvl, MapType;

var Dump1090Version = "unknown version";
var RefreshInterval = 1000;

var PlaneRowTemplate = null;

var TrackedAircraft = 0;
var TrackedAircraftPositions = 0;
var TrackedHistorySize = 0;

var SitePosition = null;

var ReceiverClock = null;

var LastReceiverTimestamp = 0;
var StaleReceiverCount = 0;
var FetchPending = null;

var MessageCountHistory = [];
var MessageRate = 0;

var NBSP='\u00a0';

var layers;

// piaware vs flightfeeder
var isFlightFeeder = false;

//Start CJS Add
var WestFlowFeatures = new ol.Collection();
var EastFlowFeatures = new ol.Collection();
var TransitionFeatures = new ol.Collection();
var ApproachFeatures = new ol.Collection();
var NavaidFeatures = new ol.Collection();
var EmitCircleFeatures = new ol.Collection();

var interestArrayICAO = [];
var interestArrayN = [];
var interestArraysymb = [];
var interestArraychk = [];
var interestArraytype = [];

var interestAJAXObject = null;
var iconNumericTag;

//Make waypoint style with settable text label and x, y offsets
function setwaypointFunction(wptname, wptlat, wptlon, xo, yo, suffix) {
    var temppt = [wptlon, wptlat];
    var tempwpt = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(temppt)));
    if (xo != null) 
    {
        if (suffix != null)
            tempwpt.setStyle(new ol.style.Style({
                           image: new ol.style.Circle({
                                  radius: 2,
                                  snapToPixel: false,
                                  fill: new ol.style.Fill({color: 'black'}),
                           }),
                           text: new ol.style.Text({
                             font: '10px Calibri,sans-serif',
                             fill: new ol.style.Fill({ color: '#000' }),
                             stroke: new ol.style.Stroke({
                               color: '#fff', width: 2 }),
                             offsetX: xo,
                             offsetY: yo,
                             text: wptname+suffix
                           })

            }) );
        else
            tempwpt.setStyle(new ol.style.Style({
                           image: new ol.style.Circle({
                                  radius: 2,
                                  snapToPixel: false,
                                  fill: new ol.style.Fill({color: 'black'}),
                           }),
                           text: new ol.style.Text({
                             font: '6px Calibri,sans-serif',
                             fill: new ol.style.Fill({ color: '#000' }),
                             stroke: new ol.style.Stroke({
                               color: '#fff', width: 2 }),
                             offsetX: xo,
                             offsetY: yo,
                             text: wptname
                           })

            }) );
    }  
    else
    {
        tempwpt.setStyle(new ol.style.Style({
                           image: new ol.style.Circle({
                                  radius: 2,
                                  snapToPixel: false,
                                  fill: new ol.style.Fill({color: 'black'}),
                           }),
        }) );
    }
    return tempwpt;
}

//Make VOR style with settable text label and x, y offsets
function setvorFunction(wptname, wptlat, wptlon, xo, yo) {
    var temppt = [wptlon, wptlat];
    var tempwpt = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(temppt)));


 //VOR SVG definition from: https://upload.wikimedia.org/wikipedia/commons/5/5f/Pictogram_VORTAC.svg
    var asciipath = '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="97" height="85" stroke="#000" stroke-width="2"><path d="m1,26 15-25 20,12-15,25zm60-13 20-12 15,25-20,12zM34,60h29v23H34z"/><path fill="none" d="m21,38 13,22h29l13-22V13H21"/><circle cx="48" cy="37" r="7"/></svg>';  
    var xmlpath = "data:image/svg+xml;base64," + btoa(asciipath);

    var VOR = {
        key : "VOR",
        scale : 0.15,
        size : [100, 90],
        anchor : [48,38],
        noRotate : true,
        markerRadius: 60,
        path: xmlpath
    };

    if (xo != null) 
    {
        tempwpt.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                        anchor: VOR.anchor,
                        anchorXUnits: 'pixels',
                        anchorYUnits: 'pixels',
                        scale: VOR.scale,
                        imgSize: VOR.size,
                        src: VOR.path,
                        rotation: 0,
                        opacity: 1.0,
                        rotateWithView: false
                }),
                text: new ol.style.Text({
                        font: '6px Calibri,sans-serif',
                        fill: new ol.style.Fill({ color: '#000' }),
                        stroke: new ol.style.Stroke({
                            color: '#fff', width: 2 }),
                        offsetX: xo,
                        offsetY: yo,
                        text: wptname
                       })

            }) );
    }  
    else
    {
     if (true)   
     { // Production code
        tempwpt.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                        anchor: VOR.anchor,
                        anchorXUnits: 'pixels',
                        anchorYUnits: 'pixels',
                        scale: VOR.scale,
                        imgSize: VOR.size,
                        src: VOR.path,
                        rotation: 0,
                        opacity: 1.0,
                        rotateWithView: false
                })
        }) );
     }
     else
     { // Test code
       // testing different typess of svg files and how they work on the .Icon method of OpenLayers
        var asciipath22  = '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="20" height="20" stroke="#0F0" stroke-width="12"><path d="M 250,40 270,40 270,10 250,10 250,40 z "/><path d="M 480,272 H 320 c 0,23.9-13.1,44.7-32.6,55.7 L 365.6,464 C 433.1,425.4,480,355.3,480,272 z "/><path d="M 256,208 c 11.7,0,22.7,3.2,32.1,8.7 l 80.6-138.3 C 335.6,59.1,297.1,48,256,48 c -41.2,0-79.9,11.2-113.1,30.6 l 79.8,138.8 C 232.4,211.4,243.8,208,256,208 z"/><path d="M 192,272 H 32 c 0,83.3,46.9,153.4,114.4,192 l 78.2-136.3 C 205.1,316.7,192,295.9,192,272 z"/></svg>';  
        var asciipath222 = '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="30px" height="30px" viewBox="8 6 408 341" preserveAspectRatio="xMidYMid meet" ><polyline stroke="black" stroke-width="5" style="fill: none;" id="e1_polyline" points="8.20898,175.366 12.6865,170.142 26.8656,164.918 52.2388,158.948 70.8955,156.709 98.5074,156.709 167.164,157.456 190.299,129.844 176.12,132.082 169.403,130.59 164.179,129.097 164.926,111.933 179.851,110.441 191.045,113.426 191.045,114.918 201.493,115.665 287.314,8.9477 311.941,6.70871 308.209,10.4407 257.463,114.918 248.508,155.963 298.508,156.709 330.597,160.441 350,162.679 386.567,120.142 406.717,120.888 389.552,167.903 399.254,167.903 400,169.396 412.687,171.635 415.672,174.62 412.687,179.097 402.985,182.829 400,182.082 400,183.575 396.269,185.814 390.299,186.56 405.224,229.844 385.075,230.59 350.747,188.799 332.09,193.276 316.418,194.769 294.776,197.008 248.508,197.008 258.955,239.545 309.702,343.276 313.433,346.261 290.299,344.769 285.821,343.276 199.254,235.067 188.806,238.799 188.806,239.545 176.866,242.53 164.926,239.545 164.926,222.381 176.866,220.888 189.552,223.873 168.657,197.008 91.791,195.515 61.194,194.769 37.3134,191.038 21.6419,187.306 12.6865,180.59 8.20898,176.859 8.20898,174.62"/></svg>';  
        var asciipath4   = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 444.5 444.5" width="30" height="30"><defs><ellipse cx="222.5" cy="132" rx="18.2" ry="80.2" fill="#ce1126" id="blade"/></defs><circle cx="222.25" cy="222.25" r="222.25" fill="#003080"/><path d="M30.42,333.75L222.25,1.5L414.08,333.75z" fill="#fff"/><circle cx="222.25" cy="222.25" r="23" fill="#ce1126"/><use xlink:href="#blade"/><use xlink:href="#blade" transform="rotate(120 222.5 222.5)"/><use xlink:href="#blade" transform="rotate(240 222.5 222.5)"/></svg>';
        var asciipath3   = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 444.5 444.5" width="30" height="30"><defs><ellipse cx="222.5" cy="132" rx="18.2" ry="80.2" fill="#ce1126" id="blade"/></defs><circle cx="222.25" cy="222.25" r="222.25" fill="#003080"/><path d="M30.42,333.75L222.25,1.5L414.08,333.75z" fill="#fff"/><circle cx="222.25" cy="222.25" r="23" fill="#ce1126"/><use xlink:href="#blade"/><use xlink:href="#blade" transform="rotate(120 222.5 222.5)"/><use xlink:href="#blade" transform="rotate(240 222.5 222.5)"/></svg>';
        var asciipath223 = '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6 15" stroke="#0F0" stroke-width="1"> </svg>';
        var asciipath223_stroke = '<path  d="M.77,2.77A4.31,4.31,0,0,1,3,2.33a4.31,4.31,0,0,1,2.26.44l-.38.92A7.51,7.51,0,0,0,3,3.41a7.9,7.9,0,0,0-1.91.27Z"/><path d="M4.35,8.27a1.05,1.05,0,0,1-.59.93A3.5,3.5,0,0,0,2.62,6.63a1.71,1.71,0,0,1-.56,1.26l-.41.38a1.71,1.71,0,0,0-.56,1.26A1.79,1.79,0,0,0,2.4,11.21H3.6A1.79,1.79,0,0,0,4.92,9.52,1.71,1.71,0,0,0,4.35,8.27Z"/>';

        var xmlpath2 = "data:image/svg+xml;base64," + btoa(asciipath223);
 
        tempwpt.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                        scale: 5.0,
                        imgSize: [6, 15],
                        src: xmlpath2,
                        rotation: 0,
                        opacity: 1.0,
                        rotateWithView: false
                })
        }) );
     }
    }
    
    return tempwpt;
}
//Make ADSB transmitter style 
function setADSBXmitFunction(wptname, wptlat, wptlon, xo, yo) {
    var temppt = [wptlon, wptlat];
    var tempwpt = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(temppt)));

 //VOR SVG definition from: https://upload.wikimedia.org/wikipedia/commons/5/5f/Pictogram_VORTAC.svg
    var asciipath = '<?xml version="1.0" encoding="iso-8859-1"?><svg verion="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="792px" height="792px" viewBox="0 0 792 720" stroke="#000" stroke-width="2"><path d="M403.69,330.253c-1.793-5.734-7.117-9.648-13.138-9.648c-6.021,0-11.345,3.914-13.138,9.648L239.315,774.221 c-1.3,4.16-0.534,8.69,2.067,12.193c2.586,3.504,6.706,5.584,11.071,5.584h276.198c0.096-0.014,0.191,0,0.273,0 c7.596,0,13.754-6.145,13.754-13.713c0-2.367-0.602-4.598-1.67-6.555L403.69,330.253z M271.12,764.572l119.432-383.97 l119.432,383.97H271.12z M397.97,243.078c34.131,0,61.898-27.699,61.898-61.735c0-34.035-27.768-61.721-61.898-61.721 c-34.131,0-61.899,27.686-61.899,61.721C336.071,215.378,363.838,243.078,397.97,243.078z M397.97,147.047 		c18.968,0,34.405,15.382,34.405,34.295s-15.438,34.31-34.405,34.31s-34.392-15.383-34.392-34.31 C363.578,162.43,379.002,147.047,397.97,147.047z M495.491,265.631c-6.527,3.873-8.662,12.29-4.775,18.79 c2.572,4.311,7.13,6.692,11.824,6.692c2.395,0,4.816-0.629,7.021-1.93c38.031-22.595,61.652-64.034,61.652-108.142 c0-44.642-24.059-86.328-62.774-108.812c-6.556-3.818-14.986-1.601-18.804,4.954c-3.818,6.542-1.602,14.944,4.968,18.749 c30.285,17.585,49.103,50.198,49.103,85.109C543.719, 215.543,525.23,247.963,495.491,265.631z M504.661,0.696 c-7.254-2.381-14.985,1.546-17.367,8.731c-2.381,7.199,1.547,14.944,8.759,17.312c66.922,21.979,111.864,84.001,111.864,154.303 c0,68.454-43.41,129.929-108.005,152.975c-7.157,2.559-10.866,10.401-8.307,17.531c2.012,5.611,7.294,9.101,12.946,9.101 c1.532,0,3.106-0.26,4.639-0.808c75.503-26.933,126.234-98.794,126.234-178.799C635.425,98.875,582.887,26.397,504.661,0.696z M297.396,95.946c6.569-3.805,8.786-12.208,4.968-18.749c-3.818-6.569-12.235-8.772-18.804-4.954 c-38.716,22.471-62.775,64.171-62.775,108.812c0,44.108,23.621,85.533,61.653,108.142c2.203,1.314,4.625,1.93,7.021,1.93 c4.68,0,9.251-2.395,11.824-6.692c3.887-6.5,1.751-14.917-4.776-18.79c-29.738-17.682-48.227-50.088-48.227-84.576 C248.279,146.144,267.097,113.532,297.396,95.946z M287.447,360.663c5.652,0,10.935-3.49,12.946-9.101 c2.559-7.13-1.164-14.985-8.307-17.531c-64.608-23.046-108.005-84.521-108.005-152.975c0-70.315,44.957-132.324,111.878-154.303 c7.212-2.368,11.126-10.127,8.759-17.312c-2.381-7.185-10.141-11.126-17.367-8.731 c-78.226,25.688-130.778,98.166-130.778,180.346c0,80.004,50.732,151.867,126.234,178.799 C284.34, 360.402,285.9,360.663,287.447,360.663z"/></svg>';  
    var xmlpath = "data:image/svg+xml;base64," + btoa(asciipath);

    var VOR = {
        key : "ADSBXmit",
        scale : 0.025,
        size : [792, 792],
        anchor : [380,700],
        noRotate : true,
        markerRadius: 60,
        path: xmlpath
    };

    if (xo != null) 
    {
        tempwpt.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                        anchor: VOR.anchor,
                        anchorXUnits: 'pixels',
                        anchorYUnits: 'pixels',
                        scale: VOR.scale,
                        imgSize: VOR.size,
                        src: VOR.path,
                        rotation: 0,
                        opacity: 1.0,
                        rotateWithView: false
                }),
                text: new ol.style.Text({
                        font: '7px Calibri,sans-serif',
                        fill: new ol.style.Fill({ color: '#000' }),
                        stroke: new ol.style.Stroke({
                            color: '#fff', width: 2 }),
                        offsetX: xo,
                        offsetY: yo,
                        text: wptname
                       })

            }) );
    }  
    else
    {
        tempwpt.setStyle(new ol.style.Style({
                image: new ol.style.Icon({
                        anchor: VOR.anchor,
                        anchorXUnits: 'pixels',
                        anchorYUnits: 'pixels',
                        scale: VOR.scale,
                        imgSize: VOR.size,
                        src: VOR.path,
                        rotation: 0,
                        opacity: 1.0,
                        rotateWithView: false
                })
        }) );
    }
    
    return tempwpt;
}


// Set up line segments for each path 
function setpathFunction(templinestring, pathstyle) {
    templinestring.transform('EPSG:4326', 'EPSG:3857');
    var templn = new ol.Feature(templinestring);
    templn.setStyle(pathstyle);
    return templn;
}

// Read the specialty airplane JSON files and populate the appropriate array so that the markers.js file can tag the icons appropriately
function getSpecialtyIconData()
{

// List of airplanes of interest, stored in a JSON file.  Symb parameter dictates what SVG symbol to display
  $.ajax({
    async: true,
    url: 'db/PlanesOfInterest.json',
    data: "",
    cache: false,
    accepts:'application/json',
    dataType: 'json',
    error: function (x,s) {
        interestAJAXObject = x;
        alert("Error reading AirplanesOfInterest.json\n" + s);
    },
    success: function (data) {
        interestAJAXObject = data;
        for (var i = 0; i < data.length; i++) {
            interestArrayICAO.push( data[i].ICAO );
            interestArrayN.push( data[i].N );
            interestArraysymb.push( data[i].symb );
            interestArraychk.push( data[i].chk );
            interestArraytype.push( data[i].type );
        }
    }
  });
}

function clearSpecialtyIconData() {

  interestArrayICAO.length = 0;
  interestArrayN.length = 0;
  interestArraysymb.length = 0;
  interestArraychk.length = 0;
  interestArraytype.length = 0;
}

//End CJS Add

function processReceiverUpdate(data) {
	// Loop through all the planes in the data packet
        var now = data.now;
        var acs = data.aircraft;

        // Detect stats reset
        if (MessageCountHistory.length > 0 && MessageCountHistory[MessageCountHistory.length-1].messages > data.messages) {
                MessageCountHistory = [{'time' : MessageCountHistory[MessageCountHistory.length-1].time,
                                        'messages' : 0}];
        }

        // Note the message count in the history
        MessageCountHistory.push({ 'time' : now, 'messages' : data.messages});
        // .. and clean up any old values
        if ((now - MessageCountHistory[0].time) > 30)
                MessageCountHistory.shift();

	for (var j=0; j < acs.length; j++) {
                var ac = acs[j];
                var hex = ac.hex;
                var squawk = ac.squawk;
                var plane = null;

		// Do we already have this plane object in Planes?
		// If not make it.

		if (Planes[hex]) {
			plane = Planes[hex];
		} else {
			plane = new PlaneObject(hex);
                        plane.filter = PlaneFilter;
                        plane.tr = PlaneRowTemplate.cloneNode(true);

                        if (hex[0] === '~') {
                                // Non-ICAO address
                                plane.tr.cells[0].textContent = hex.substring(1);
                                $(plane.tr).css('font-style', 'italic');
                        } else {
                                plane.tr.cells[0].textContent = hex;
                        }

                        // set flag image if available
                        if (ShowFlags && plane.icaorange.flag_image !== null) {
                                $('img', plane.tr.cells[1]).attr('src', FlagPath + plane.icaorange.flag_image);
                                $('img', plane.tr.cells[1]).attr('title', plane.icaorange.country);
                        } else {
                                $('img', plane.tr.cells[1]).css('display', 'none');
                        }

                        plane.tr.addEventListener('click', function(h, evt) {
                                if (evt.srcElement instanceof HTMLAnchorElement) {
                                        evt.stopPropagation();
                                        return;
                                }

                                if (!$("#map_container").is(":visible")) {
                                        showMap();
                                }
                                selectPlaneByHex(h, false);
                                adjustSelectedInfoBlockPosition();
                                evt.preventDefault();
                        }.bind(undefined, hex));

                        plane.tr.addEventListener('dblclick', function(h, evt) {
                                if (!$("#map_container").is(":visible")) {
                                        showMap();
                                }
                                selectPlaneByHex(h, true);
                                adjustSelectedInfoBlockPosition();
                                evt.preventDefault();
                        }.bind(undefined, hex));

                        Planes[hex] = plane;
                        PlanesOrdered.push(plane);
		}

		// Call the function update
		plane.updateData(now, ac);
	}
}

function fetchData() {
        if (FetchPending !== null && FetchPending.state() == 'pending') {
                // don't double up on fetches, let the last one resolve
                return;
        }

	FetchPending = $.ajax({ url: 'data/aircraft.json',
                                timeout: 5000,
                                cache: false,
                                dataType: 'json' });
        FetchPending.done(function(data) {
                var now = data.now;

                processReceiverUpdate(data);

                // update timestamps, visibility, history track for all planes - not only those updated
                for (var i = 0; i < PlanesOrdered.length; ++i) {
                        var plane = PlanesOrdered[i];
                        plane.updateTick(now, LastReceiverTimestamp);
                }
                
		selectNewPlanes();
		refreshTableInfo();
		refreshSelected();
		refreshHighlighted();
                
                if (ReceiverClock) {
                        var rcv = new Date(now * 1000);
                        ReceiverClock.render(rcv.getUTCHours(),rcv.getUTCMinutes(),rcv.getUTCSeconds());
                }

                // Check for stale receiver data
                if (LastReceiverTimestamp === now) {
                        StaleReceiverCount++;
                        if (StaleReceiverCount > 5) {
                                $("#update_error_detail").text("The data from dump1090 hasn't been updated in a while. Maybe dump1090 is no longer running?");
                                $("#update_error").css('display','block');
                        }
                } else { 
                        StaleReceiverCount = 0;
                        LastReceiverTimestamp = now;
                        $("#update_error").css('display','none');
                }
	});

        FetchPending.fail(function(jqxhr, status, error) {
                $("#update_error_detail").text("AJAX call failed (" + status + (error ? (": " + error) : "") + "). Maybe dump1090 is no longer running?");
                $("#update_error").css('display','block');
        });
}

var PositionHistorySize = 0;
function initialize() {
        // Set page basics
        document.title = PageName;

        flightFeederCheck();

        PlaneRowTemplate = document.getElementById("plane_row_template");

        refreshClock();

        $("#loader").removeClass("hidden");

        if (ExtendedData || window.location.hash == '#extended') {
                $("#extendedData").removeClass("hidden");
        }

        // Set up map/sidebar splitter
		$("#sidebar_container").resizable({
			handles: {
				w: '#splitter'
			},
			minWidth: 350
		});

		// Set up datablock splitter
		$('#selected_infoblock').resizable({
			handles: {
				s: '#splitter-infoblock'
			},
			containment: "#sidebar_container",
			minHeight: 50
		});

		$('#close-button').on('click', function() {
			if (SelectedPlane !== null) {
				var selectedPlane = Planes[SelectedPlane];
				SelectedPlane = null;
				selectedPlane.selected = null;
				selectedPlane.clearLines();
				selectedPlane.updateMarker();         
				refreshSelected();
				refreshHighlighted();
				$('#selected_infoblock').hide();
			}
		});

		// this is a little hacky, but the best, most consitent way of doing this. change the margin bottom of the table container to the height of the overlay
		$('#selected_infoblock').on('resize', function() {
			$('#sidebar_canvas').css('margin-bottom', $('#selected_infoblock').height() + 'px');
		});
		// look at the window resize to resize the pop-up infoblock so it doesn't float off the bottom or go off the top
		$(window).on('resize', function() {
			var topCalc = ($(window).height() - $('#selected_infoblock').height() - 60);
			// check if the top will be less than zero, which will be overlapping/off the screen, and set the top correctly. 
			if (topCalc < 0) {
				topCalc = 0;
				$('#selected_infoblock').css('height', ($(window).height() - 60) +'px');
			}
			$('#selected_infoblock').css('top', topCalc + 'px');
		});

		// to make the infoblock responsive 
		$('#sidebar_container').on('resize', function() {
			if ($('#sidebar_container').width() < 500) {
				$('#selected_infoblock').addClass('infoblock-container-small');
			} else {
				$('#selected_infoblock').removeClass('infoblock-container-small');
			}
		});
	
        // Set up event handlers for buttons
        $("#toggle_sidebar_button").click(toggleSidebarVisibility);
        $("#expand_sidebar_button").click(expandSidebar);
        $("#show_map_button").click(showMap);

        // Set initial element visibility
        $("#show_map_button").hide();
        setColumnVisibility();

        // Initialize other controls
        initializeUnitsSelector();

        // Set up altitude filter button event handlers and validation options
        $("#altitude_filter_form").submit(onFilterByAltitude);
        $("#altitude_filter_form").validate({
            errorPlacement: function(error, element) {
                return true;
            },
            
            rules: {
                minAltitude: {
                    number: true,
                    min: -99999,
                    max: 99999
                },
                maxAltitude: {
                    number: true,
                    min: -99999,
                    max: 99999
                }
            }
        });

        // check if the altitude color values are default to enable the altitude filter
        if (ColorByAlt.air.h.length === 3 && ColorByAlt.air.h[0].alt === 2000 && ColorByAlt.air.h[0].val === 20 && ColorByAlt.air.h[1].alt === 10000 && ColorByAlt.air.h[1].val === 140 && ColorByAlt.air.h[2].alt === 40000 && ColorByAlt.air.h[2].val === 300) {
            customAltitudeColors = false;
        }


        $("#altitude_filter_reset_button").click(onResetAltitudeFilter);

        $('#settingsCog').on('click', function() {
        	$('#settings_infoblock').toggle();
        });

        $('#settings_close').on('click', function() {
            $('#settings_infoblock').hide();
        });

        $('#groundvehicle_filter').on('click', function() {
        	filterGroundVehicles(true);
        	refreshSelected();
        	refreshHighlighted();
        	refreshTableInfo();
        });

        $('#blockedmlat_filter').on('click', function() {
        	filterBlockedMLAT(true);
        	refreshSelected();
        	refreshHighlighted();
        	refreshTableInfo();
        });

        $('#grouptype_checkbox').on('click', function() {
        	if ($('#grouptype_checkbox').hasClass('settingsCheckboxChecked')) {
        		sortByDistance();
        	} else {
        		sortByDataSource();
        	}
        	
        });

//Start CJS Add
        $('#emitter_checkbox').on('click', function() {
                if ($('#emitter_checkbox').hasClass('settingsCheckboxChecked')) {
                    $('#emitter_checkbox').removeClass('settingsCheckboxChecked');
                }else {
                    $('#emitter_checkbox').addClass('settingsCheckboxChecked');
                }
        });

        $('#flowToggle').on('click', function() {
                if ($('#flowToggle').hasClass('settingsCheckboxChecked')) 
                {  // West flow
                    $('#flowToggle').removeClass('settingsCheckboxChecked');
                    $('#kphx_west_flow_checkbox').addClass('settingsCheckboxChecked');
                    $('#kphx_east_flow_checkbox').removeClass('settingsCheckboxChecked');
//                    toggleLayer('#kphx_west_flow_checkbox', 'kphx_proc_west');
                    ol.control.LayerSwitcher.forEachRecursive(layers, function(lyr) {
                        if (lyr.get('name') === 'kphx_proc_west') {
                            lyr.setVisible(true);
                        }
                    })
                    ol.control.LayerSwitcher.forEachRecursive(layers, function(lyr) {
                        if (lyr.get('name') === 'kphx_proc_east') {
                            lyr.setVisible(false);
                        }
                    })
                }
                else
                {  // East flow
                    $('#flowToggle').addClass('settingsCheckboxChecked');
                    $('#kphx_east_flow_checkbox').addClass('settingsCheckboxChecked');
                    $('#kphx_west_flow_checkbox').removeClass('settingsCheckboxChecked');
//  		            toggleLayer('#kphx_east_flow_checkbox', 'kphx_proc_east');
                    ol.control.LayerSwitcher.forEachRecursive(layers, function(lyr) {
                        if (lyr.get('name') === 'kphx_proc_east') {
                            lyr.setVisible(true);
                        }
                    })
                    ol.control.LayerSwitcher.forEachRecursive(layers, function(lyr) {
                        if (lyr.get('name') === 'kphx_proc_west') {
                            lyr.setVisible(false);
                        }
                    })
                }
        });


//End CJS Add
    
    
        $('#altitude_checkbox').on('click', function() {
        	toggleAltitudeChart(true);
        });

        $('#selectall_checkbox').on('click', function() {
        	if ($('#selectall_checkbox').hasClass('settingsCheckboxChecked')) {
        		deselectAllPlanes();
        	} else {
        		selectAllPlanes();
        	}
        })

        // Force map to redraw if sidebar container is resized - use a timer to debounce
        var mapResizeTimeout;
        $("#sidebar_container").on("resize", function() {
            clearTimeout(mapResizeTimeout);
            mapResizeTimeout = setTimeout(updateMapSize, 10);
        });

        filterGroundVehicles(false);
        filterBlockedMLAT(false);
        toggleAltitudeChart(false);

        // Get receiver metadata, reconfigure using it, then continue
        // with initialization
        $.ajax({ url: 'data/receiver.json',
                 timeout: 5000,
                 cache: false,
                 dataType: 'json' })

                .done(function(data) {
                        if (typeof data.lat !== "undefined") {
                                SiteShow = true;
                                SiteLat = data.lat;
                                SiteLon = data.lon;
                                DefaultCenterLat = data.lat;
                                DefaultCenterLon = data.lon;
                        }
                        
                        Dump1090Version = data.version;
                        RefreshInterval = data.refresh;
                        PositionHistorySize = data.history;
                })

                .always(function() {
                        initialize_map();
                        start_load_history();
                });
}

var CurrentHistoryFetch = null;
var PositionHistoryBuffer = [];
var HistoryItemsReturned = 0;
function start_load_history() {
	if (PositionHistorySize > 0 && window.location.hash != '#nohistory') {
		$("#loader_progress").attr('max',PositionHistorySize);
		console.log("Starting to load history (" + PositionHistorySize + " items)");
		//Load history items in parallel
		for (var i = 0; i < PositionHistorySize; i++) {
			load_history_item(i);
		}
	}

}

function load_history_item(i) {
        console.log("Loading history #" + i);
        $("#loader_progress").attr('value',i);

        $.ajax({ url: 'data/history_' + i + '.json',
                 timeout: 5000,
                 cache: false,
                 dataType: 'json' })

                .done(function(data) {
					PositionHistoryBuffer.push(data);
					HistoryItemsReturned++;
					$("#loader_progress").attr('value',HistoryItemsReturned);
					if (HistoryItemsReturned == PositionHistorySize) {
						end_load_history();
					}
                })

                .fail(function(jqxhr, status, error) {
					//Doesn't matter if it failed, we'll just be missing a data point
					HistoryItemsReturned++;
					if (HistoryItemsReturned == PositionHistorySize) {
						end_load_history();
					}
                });
}

function end_load_history() {
        $("#loader").addClass("hidden");

        console.log("Done loading history");

        if (PositionHistoryBuffer.length > 0) {
                var now, last=0;

                // Sort history by timestamp
                console.log("Sorting history");
                PositionHistoryBuffer.sort(function(x,y) { return (x.now - y.now); });

                // Process history
                for (var h = 0; h < PositionHistoryBuffer.length; ++h) {
                        now = PositionHistoryBuffer[h].now;
                        console.log("Applying history " + (h + 1) + "/" + PositionHistoryBuffer.length + " at: " + now);
                        processReceiverUpdate(PositionHistoryBuffer[h]);

                        // update track
                        console.log("Updating tracks at: " + now);
                        for (var i = 0; i < PlanesOrdered.length; ++i) {
                                var plane = PlanesOrdered[i];
                                plane.updateTrack((now - last) + 1);
                        }

                        last = now;
                }

                // Final pass to update all planes to their latest state
                console.log("Final history cleanup pass");
                for (var i = 0; i < PlanesOrdered.length; ++i) {
                        var plane = PlanesOrdered[i];
                        plane.updateTick(now);
                }

                LastReceiverTimestamp = last;
        }

        PositionHistoryBuffer = null;

        console.log("Completing init");

        refreshTableInfo();
        refreshSelected();
        refreshHighlighted();
        reaper();

        // Setup our timer to poll from the server.
        window.setInterval(fetchData, RefreshInterval);
        window.setInterval(reaper, 60000);

        // And kick off one refresh immediately.
        fetchData();

}

// Make a LineString with 'points'-number points
// that is a closed circle on the sphere such that the
// great circle distance from 'center' to each point is
// 'radius' meters
function make_geodesic_circle(center, radius, points) {
        var angularDistance = radius / 6378137.0;
        var lon1 = center[0] * Math.PI / 180.0;
        var lat1 = center[1] * Math.PI / 180.0;
        var geom = new ol.geom.LineString();
        for (var i = 0; i <= points; ++i) {
                var bearing = i * 2 * Math.PI / points;

                var lat2 = Math.asin( Math.sin(lat1)*Math.cos(angularDistance) +
                                      Math.cos(lat1)*Math.sin(angularDistance)*Math.cos(bearing) );
                var lon2 = lon1 + Math.atan2(Math.sin(bearing)*Math.sin(angularDistance)*Math.cos(lat1),
                                             Math.cos(angularDistance)-Math.sin(lat1)*Math.sin(lat2));

                lat2 = lat2 * 180.0 / Math.PI;
                lon2 = lon2 * 180.0 / Math.PI;
                geom.appendCoordinate([lon2, lat2]);
        }
        return geom;
}

// Initalizes the map and starts up our timers to call various functions
function initialize_map() {
        // Load stored map settings if present
        CenterLat = Number(localStorage['CenterLat']) || DefaultCenterLat;
        CenterLon = Number(localStorage['CenterLon']) || DefaultCenterLon;
        ZoomLvl = Number(localStorage['ZoomLvl']) || DefaultZoomLvl;
        MapType = localStorage['MapType'];

        // Set SitePosition, initialize sorting
        if (SiteShow && (typeof SiteLat !==  'undefined') && (typeof SiteLon !==  'undefined')) {
	        SitePosition = [SiteLon, SiteLat];
                sortByDistance();
        } else {
	        SitePosition = null;
                PlaneRowTemplate.cells[9].style.display = 'none'; // hide distance column
                document.getElementById("distance").style.display = 'none'; // hide distance header
                sortByAltitude();
        }

        // Maybe hide flag info
        if (!ShowFlags) {
                PlaneRowTemplate.cells[1].style.display = 'none'; // hide flag column
                document.getElementById("flag").style.display = 'none'; // hide flag header
                document.getElementById("infoblock_country").style.display = 'none'; // hide country row
        }

        // Initialize OL3

        layers = createBaseLayers();

        var iconsLayer = new ol.layer.Vector({
                name: 'ac_positions',
                type: 'overlay',
                title: 'Aircraft positions',
                source: new ol.source.Vector({
                        features: PlaneIconFeatures,
                })
        });

        layers.push(new ol.layer.Group({
                title: 'Overlays',
                layers: [
                        new ol.layer.Vector({
                                name: 'site_pos',
                                type: 'overlay',
                                title: 'Site position and range rings',
                                source: new ol.source.Vector({
                                        features: StaticFeatures,
                                })
                        }),

                        new ol.layer.Vector({
                                name: 'ac_trail',
                                type: 'overlay',
                                title: 'Selected aircraft trail',
                                source: new ol.source.Vector({
                                        features: PlaneTrailFeatures,
                                })
                        }),

//Start CJS Add
                        new ol.layer.Vector({
                                name: 'emit_pos',
                                type: 'overlay',
                                title: 'Emitter target extent',
                                source: new ol.source.Vector({
                                        features: EmitCircleFeatures,
                                })
                        }),

                        new ol.layer.Vector({
                                name: 'kphx_proc_west',
                                type: 'overlay',
                                title: 'SIDs, STARs; west flow',
                                source: new ol.source.Vector({
                                        features: WestFlowFeatures,
                                })
                        }),
                        new ol.layer.Vector({
                                name: 'kphx_proc_east',
                                type: 'overlay',
                                title: 'SIDs, STARs; east flow',
                                source: new ol.source.Vector({
                                        features: EastFlowFeatures,
                                })
                        }),
                        new ol.layer.Vector({
                                name: 'kphx_proc_trans',
                                type: 'overlay',
                                title: 'SID/STAR Transitions',
                                source: new ol.source.Vector({
                                        features: TransitionFeatures,
                                })
                        }),
                        new ol.layer.Vector({
                                name: 'phoenix_approaches',
                                type: 'overlay',
                                title: 'Instrument Approaches',
                                source: new ol.source.Vector({
                                        features: ApproachFeatures,
                                })
                        }),
                        new ol.layer.Vector({
                                name: 'Navaids',
                                type: 'overlay',
                                title: 'Navaids',
                                source: new ol.source.Vector({
                                        features: NavaidFeatures,
                                })
                        }),

 //End CJS Add 

                        iconsLayer
                ]
        }));

        var foundType = false;
        var baseCount = 0;

        ol.control.LayerSwitcher.forEachRecursive(layers, function(lyr) {
                if (!lyr.get('name'))
                        return;

                if (lyr.get('type') === 'base') {
                    baseCount++;
                        if (MapType === lyr.get('name')) {
                                foundType = true;
                                lyr.setVisible(true);
                        } else {
                                lyr.setVisible(false);
                        }

                        lyr.on('change:visible', function(evt) {
                                if (evt.target.getVisible()) {
                                        MapType = localStorage['MapType'] = evt.target.get('name');
                                }
                        });
                } else if (lyr.get('type') === 'overlay') {
                        var visible = localStorage['layer_' + lyr.get('name')];
                        if (visible != undefined) {
                                // javascript, why must you taunt me with gratuitous type problems
                                lyr.setVisible(visible === "true");
                        }

                        lyr.on('change:visible', function(evt) {
                                localStorage['layer_' + evt.target.get('name')] = evt.target.getVisible();
                        });
                }
        })

        if (!foundType) {
                ol.control.LayerSwitcher.forEachRecursive(layers, function(lyr) {
                        if (foundType)
                                return;
                        if (lyr.get('type') === 'base') {
                                lyr.setVisible(true);
                                foundType = true;
                        }
                });
        }

        OLMap = new ol.Map({
                target: 'map_canvas',
                layers: layers,
                view: new ol.View({
                        center: ol.proj.fromLonLat([CenterLon, CenterLat]),
                        zoom: ZoomLvl
                }),
                controls: [new ol.control.Zoom(),
                           new ol.control.Rotate(),
                           new ol.control.Attribution({collapsed: true}),
                           new ol.control.ScaleLine({units: DisplayUnits})
                          ],
                loadTilesWhileAnimating: true,
                loadTilesWhileInteracting: true
        });

        if (baseCount > 1) {
            OLMap.addControl(new ol.control.LayerSwitcher());
        }

	// Listeners for newly created Map
        OLMap.getView().on('change:center', function(event) {
                var center = ol.proj.toLonLat(OLMap.getView().getCenter(), OLMap.getView().getProjection());
                localStorage['CenterLon'] = center[0]
                localStorage['CenterLat'] = center[1]
                if (FollowSelected) {
                        // On manual navigation, disable follow
                        var selected = Planes[SelectedPlane];
						if (typeof selected === 'undefined' ||
							(Math.abs(center[0] - selected.position[0]) > 0.0001 &&
							Math.abs(center[1] - selected.position[1]) > 0.0001)){
                                FollowSelected = false;
                                refreshSelected();
                                refreshHighlighted();
                        }
                }
        });
    
        OLMap.getView().on('change:resolution', function(event) {
                ZoomLvl = localStorage['ZoomLvl']  = OLMap.getView().getZoom();
                for (var plane in Planes) {
                        Planes[plane].updateMarker(false);
                };
        });

        OLMap.on(['click', 'dblclick'], function(evt) {
                var hex = evt.map.forEachFeatureAtPixel(evt.pixel,
                                                        function(feature, layer) {
                                                                return feature.hex;
                                                        },
                                                        null,
                                                        function(layer) {
                                                                return (layer === iconsLayer);
                                                        },
                                                        null);
                if (hex) {
                        selectPlaneByHex(hex, (evt.type === 'dblclick'));
                        adjustSelectedInfoBlockPosition();
                        evt.stopPropagation();
                } else {
                        deselectAllPlanes();
                        evt.stopPropagation();
                }
        });


    // show the hover box
    OLMap.on('pointermove', function(evt) {
        var hex = evt.map.forEachFeatureAtPixel(evt.pixel,
            function(feature, layer) {
                    return feature.hex;
            },
            null,
            function(layer) {
                    return (layer === iconsLayer);
            },
            null
        );

        if (hex) {
            highlightPlaneByHex(hex);
        } else {
            removeHighlight();
 // Start CJS Add
            if (SelectedPlane == null) {
		        deselectAllPlanes();
	        }
// End CJS Add
       }

    })

    // handle the layer settings pane checkboxes
	OLMap.once('postrender', function(e) {
		toggleLayer('#nexrad_checkbox', 'nexrad');
		toggleLayer('#sitepos_checkbox', 'site_pos');
		toggleLayer('#actrail_checkbox', 'ac_trail');
		toggleLayer('#acpositions_checkbox', 'ac_positions');
//Start CJS Add
		toggleLayer('#kphx_west_flow_checkbox', 'kphx_proc_west');
		toggleLayer('#kphx_east_flow_checkbox', 'kphx_proc_east');
		toggleLayer('#kphx_transition_checkbox', 'kphx_proc_trans');
		toggleLayer('#phoenix_approach_checkbox', 'phoenix_approaches');
//End CJS Add
	});

	// Add home marker if requested
	if (SitePosition) {
                var markerStyle = new ol.style.Style({
                        image: new ol.style.Circle({
                                radius: 7,
                                snapToPixel: false,
                                fill: new ol.style.Fill({color: 'black'}),
                                stroke: new ol.style.Stroke({
                                        color: 'white', width: 2
                                })
                        })
                });

                var feature = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(SitePosition)));
                feature.setStyle(markerStyle);
                StaticFeatures.push(feature);
        
                if (SiteCircles) {
                    createSiteCircleFeatures();
                }
	}

    
//Start CJS Add

        var waypointStyle = new ol.style.Style({
                        image: new ol.style.Circle({
                                radius: 2,
                                snapToPixel: false,
                                fill: new ol.style.Fill({color: 'black'}),
                        })
        });


        var SIDStyle = new ol.style.Style({
            fill: null,
            stroke: new ol.style.Stroke({
                    color: 'blue',
                    width: 0.5
            })
        });

        var STARStyle = new ol.style.Style({
            fill: null,
            stroke: new ol.style.Stroke({
                    color: 'green',
                    width: 1
            })
        });
        var APPRStyle = new ol.style.Style({
            fill: null,
            stroke: new ol.style.Stroke({
                    color: 'purple',
                 lineDash: [4,8],
                    width: 1
            })
        });

        // VORs
        var SJNvor = setvorFunction("SJN", 34.424, -109.143,14,4);
        var GCNvor = setvorFunction("GCN", 35.96, -112.146);
        var ZUNvor = setvorFunction("ZUN",34.966, -109.154,14,4);
        var INWvor = setvorFunction("INW", 35.061, -110.795);
        var IWAvor = setvorFunction("IWA", 33.303, -111.651);
        var PXRvor = setvorFunction("PXR", 33.433, -111.97);
        var TFDvor = setvorFunction("TFD", 32.886, -111.909);
        var BXKvor = setvorFunction("BXK", 33.453, -112.825);
        var FLGvor = setvorFunction("FLG", 35.147, -111.674);
        var DRKvor = setvorFunction("DRK", 34.703, -112.480,0,12);
        var GBNvor = setvorFunction("GBN", 32.956, -112.674);
        var BZAvor = setvorFunction("BZA", 32.768, -114.603,0,-10);
        var PKEvor = setvorFunction("PKE", 34.102, -114.682,14,4);
        var EEDvor = setvorFunction("EED", 34.766, -114.474);
        var BLHvor = setvorFunction("BLH", 33.596, -114.761,14,4);
        var BLDvor = setvorFunction("BLD", 35.996, -114.864);
        var PGSvor = setvorFunction("PGS", 35.625, -113.544,14,4);
        var TBCvor = setvorFunction("TBC", 36.121, -111.269);
        var GUPvor = setvorFunction("GUP", 35.476, -108.873,14,4);
        var SSOvor = setvorFunction("SSO", 32.269, -109.263,0,12);
        var TUSvor = setvorFunction("TUS", 32.095, -110.915);
        var OLSvor = setvorFunction("OLS", 31.415, -110.849);
        var DUGvor = setvorFunction("DUG", 31.473, -109.602);
        var DMNvor = setvorFunction("DMN", 32.27, -107.602);
        var IPLvor = setvorFunction("IPL", 32.749, -115.509);
        var TRMvor = setvorFunction("TRM", 33.628, -116.160);
        var TNPvor = setvorFunction("TNP", 34.112, -115.770);
        var GFSvor = setvorFunction("GFS", 35.131, -115.176);
        var PGAvor = setvorFunction("PGA", 36.931, -111.447);
        var SVCvor = setvorFunction("SVC", 32.638, -108.161);
        NavaidFeatures.push(SJNvor);
        NavaidFeatures.push(GCNvor);
        NavaidFeatures.push(ZUNvor);
        NavaidFeatures.push(INWvor);
        NavaidFeatures.push(IWAvor);
        NavaidFeatures.push(PXRvor);
        NavaidFeatures.push(TFDvor);
        NavaidFeatures.push(BXKvor);
        NavaidFeatures.push(FLGvor);
        NavaidFeatures.push(DRKvor);
        NavaidFeatures.push(GBNvor);
        NavaidFeatures.push(BZAvor);
        NavaidFeatures.push(PKEvor);
        NavaidFeatures.push(EEDvor);
        NavaidFeatures.push(BLHvor);
        NavaidFeatures.push(BLDvor);
        NavaidFeatures.push(PGSvor);
        NavaidFeatures.push(TBCvor);
        NavaidFeatures.push(GUPvor);
        NavaidFeatures.push(SSOvor);
        NavaidFeatures.push(TUSvor);
        NavaidFeatures.push(OLSvor);
        NavaidFeatures.push(DUGvor);
        NavaidFeatures.push(DMNvor);
        NavaidFeatures.push(IPLvor);
        NavaidFeatures.push(TRMvor);
        NavaidFeatures.push(TNPvor);
        NavaidFeatures.push(GFSvor);
        NavaidFeatures.push(PGAvor);
        NavaidFeatures.push(SVCvor);

        // ADSB ground transmitters
        var ADSBXmitAZ1 = setADSBXmitFunction("AZ1", 32.795, -113.546,2,8);
        var ADSBXmitAZ2 = setADSBXmitFunction("AZ2", 32.549, -114.786,2,8);
        var ADSBXmitAZ3 = setADSBXmitFunction("AZ3", 33.261, -111.338,2,8);
        var ADSBXmitAZ4 = setADSBXmitFunction("AZ4", 32.249, -111.117,2,8);
        var ADSBXmitAZ5 = setADSBXmitFunction("AZ5", 31.965, -110.368,2,8);
        var ADSBXmitAZ6 = setADSBXmitFunction("AZ6", 34.431, -111.504,2,8);
        var ADSBXmitAZ7 = setADSBXmitFunction("AZ7", 33.817, -112.515,2,8);
        var ADSBXmitAZ8 = setADSBXmitFunction("AZ8", 35.402, -113.397,2,8);
        var ADSBXmitAZ9 = setADSBXmitFunction("AZ9", 36.737, -112.213,2,8);
        var ADSBXmitAZ11 = setADSBXmitFunction("AZ11", 35.218, -109.354,2,8);
        var ADSBXmitAZ12 = setADSBXmitFunction("AZ12", 31.482, -109.959,2,8);
        var ADSBXmitAZ13 = setADSBXmitFunction("AZ13", 32.351, -109.492,2,8);
        var ADSBXmitCA3 = setADSBXmitFunction("CA3", 33.704, -114.218,2,8);
        var ADSBXmitFFZ0 = setADSBXmitFunction("FFZ0", 33.457, -111.720,2,8);
        var ADSBXmitINW0 = setADSBXmitFunction("INW0", 35.017, -110.714,2,8);
        var ADSBXmitPHX0 = setADSBXmitFunction("PHX0", 33.426, -112.015,2,8);
        var ADSBXmitPRC1 = setADSBXmitFunction("PRC1", 34.649, -112.430,2,8);
        NavaidFeatures.push(ADSBXmitAZ1);
        NavaidFeatures.push(ADSBXmitAZ2);
        NavaidFeatures.push(ADSBXmitAZ3);
        NavaidFeatures.push(ADSBXmitAZ4);
        NavaidFeatures.push(ADSBXmitAZ5);
        NavaidFeatures.push(ADSBXmitAZ6);
        NavaidFeatures.push(ADSBXmitAZ7);
        NavaidFeatures.push(ADSBXmitAZ8);
        NavaidFeatures.push(ADSBXmitAZ9);
        NavaidFeatures.push(ADSBXmitAZ11);
        NavaidFeatures.push(ADSBXmitAZ12);
        NavaidFeatures.push(ADSBXmitAZ13);
        NavaidFeatures.push(ADSBXmitCA3);
        NavaidFeatures.push(ADSBXmitFFZ0);
        NavaidFeatures.push(ADSBXmitINW0);
        NavaidFeatures.push(ADSBXmitPHX0);
        NavaidFeatures.push(ADSBXmitPRC1);

        // Regional waypoints
        var TIRONwpt = setwaypointFunction("TIRON", 33.62, -112.92,14,0);
        var SPTFRwpt = setwaypointFunction("SPTFR", 33.397, -113.725,-12,4);
        var JCOBSwpt = setwaypointFunction("JCOBS", 34.30, -111.915,14,0);
        var KARLOwpt = setwaypointFunction("KARLO", 34.291, -112.495,14,0);
        var DSERTwpt = setwaypointFunction("DSERT", 34.44, -111.66,8,5);
        TransitionFeatures.push(TIRONwpt);
        TransitionFeatures.push(SPTFRwpt);
        TransitionFeatures.push(JCOBSwpt);
        TransitionFeatures.push(KARLOwpt);
        TransitionFeatures.push(DSERTwpt);

        // KEENS2 departure
        var IZZZOwpt = setwaypointFunction("IZZZO", 33.45, -112.80, 12, 4); 
        var KEENSwpt = setwaypointFunction("KEENS", 33.45, -112.60, 0, 10, "2");
        var HRRBRwpt = setwaypointFunction("HRRBR", 33.64, -113.852);        
        var CULTSwpt = setwaypointFunction("CULTS", 33.585, -113.505);        
        var MESSIwpt = setwaypointFunction("MESSI", 33.80, -113.81);        
        var MASVEwpt = setwaypointFunction("MASVE", 33.355, -111.92);
        var SALOMwpt = setwaypointFunction("SALOM", 33.516, -113.889);
        var FUTEPwpt = setwaypointFunction("FUTEP", 33.435, -111.872);
        var AZCRDwpt = setwaypointFunction("AZCRD", 33.394, -111.837);
        var USEYEwpt = setwaypointFunction("USEYE", 33.350, -111.868);
        WestFlowFeatures.push(KEENSwpt);
        WestFlowFeatures.push(IZZZOwpt);
        EastFlowFeatures.push(FUTEPwpt);
        EastFlowFeatures.push(AZCRDwpt);
        EastFlowFeatures.push(USEYEwpt);
        EastFlowFeatures.push(MASVEwpt);
        EastFlowFeatures.push(KEENSwpt);
        EastFlowFeatures.push(IZZZOwpt);
        TransitionFeatures.push(MESSIwpt);
        TransitionFeatures.push(CULTSwpt);
        TransitionFeatures.push(HRRBRwpt);
        TransitionFeatures.push(SALOMwpt);
        var IZZZO61 = new ol.geom.LineString();
        var IZZZO62 = new ol.geom.LineString();
        var IZZZO63 = new ol.geom.LineString();
        var IZZZO64 = new ol.geom.LineString();
        var IZZZO65 = new ol.geom.LineString();
        IZZZO61.appendCoordinate(ol.proj.transform(KEENSwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO61.appendCoordinate(ol.proj.transform(IZZZOwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO62.appendCoordinate(ol.proj.transform(FUTEPwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO62.appendCoordinate(ol.proj.transform(AZCRDwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO62.appendCoordinate(ol.proj.transform(USEYEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO62.appendCoordinate(ol.proj.transform(MASVEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO62.appendCoordinate(ol.proj.transform(KEENSwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO62.appendCoordinate(ol.proj.transform(IZZZOwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO63.appendCoordinate(ol.proj.transform(IZZZOwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO63.appendCoordinate(ol.proj.transform(CULTSwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO63.appendCoordinate(ol.proj.transform(HRRBRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO64.appendCoordinate(ol.proj.transform(IZZZOwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO64.appendCoordinate(ol.proj.transform(MESSIwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO65.appendCoordinate(ol.proj.transform(IZZZOwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO65.appendCoordinate(ol.proj.transform(SALOMwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        IZZZO65.appendCoordinate(ol.proj.transform(BLHvor.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var IZZZO61ln = setpathFunction(IZZZO61, SIDStyle);
        var IZZZO62ln = setpathFunction(IZZZO62, SIDStyle);
        var IZZZO63ln = setpathFunction(IZZZO63, SIDStyle);
        var IZZZO64ln = setpathFunction(IZZZO64, SIDStyle);
        var IZZZO65ln = setpathFunction(IZZZO65, SIDStyle);
        WestFlowFeatures.push(IZZZO61ln);
        EastFlowFeatures.push(IZZZO62ln);
        TransitionFeatures.push(IZZZO63ln);
        TransitionFeatures.push(IZZZO64ln);
        TransitionFeatures.push(IZZZO65ln);
 
        // KPHX ZEPER1, SNOBL5, YOTES5, LALUZ5 departure
        var MAYSAwpt = setwaypointFunction("MAYSA", 34.562, -112.875,-12,6);
        var SNOBLwpt = setwaypointFunction("SNOBL", 34.426, -111.97,14,0);
        var YOTESwpt = setwaypointFunction("YOTES", 34.625, -111.119,10,4);
        var LALUZwpt = setwaypointFunction("LALUZ", 34.055, -110.216,14,5);
        var ZIDOGwpt = setwaypointFunction("ZIDOG", 33.531, -112.196, 0, 6); 
        var OXYGNwpt = setwaypointFunction("OXYGN", 33.615, -112.172,14,2);
        var ZILUBwpt = setwaypointFunction("ZILUB", 33.75, -112.00,-14,-2);
        var ZEPERwpt = setwaypointFunction("ZEPER", 34.028, -112.335,-20,6,"1");
        var QUAKYwpt = setwaypointFunction("QUAKY", 34.098, -111.935,24,4, "1");
        var CARTLwpt = setwaypointFunction("CARTL", 34.75, -112.00,14,0);
        var FORPEwpt = setwaypointFunction("FORPE", 33.687, -111.268,24,6, "1");
        var SPRKYwpt = setwaypointFunction("SPRKY", 33.436, -111.891);
        var GOALYwpt = setwaypointFunction("GOALY", 33.651, -111.836,14,2);
        var GOLDRwpt = setwaypointFunction("GOLDR", 33.733, -111.851,-14,2);
        var POCCKwpt = setwaypointFunction("POCCK", 33.796, -111.786, 14,3);
        var MRBILwpt = setwaypointFunction("MRBIL", 34.00, -111.60,24,2, "1");
        var YOOPRwpt = setwaypointFunction("YOOPR", 35.652, -110.43);
        var JARPAwpt = setwaypointFunction("JARPA", 35.70, -109.78);
        var JKPOTwpt = setwaypointFunction("JKPOT", 34.69, -113.01);
        var SISIEwpt = setwaypointFunction("SISIE", 34.984, -113.338);
        WestFlowFeatures.push(OXYGNwpt);
        WestFlowFeatures.push(ZILUBwpt);
        WestFlowFeatures.push(ZEPERwpt);
        WestFlowFeatures.push(MAYSAwpt);
        WestFlowFeatures.push(LALUZwpt);
        WestFlowFeatures.push(QUAKYwpt);
        WestFlowFeatures.push(SNOBLwpt);
        WestFlowFeatures.push(FORPEwpt);
        WestFlowFeatures.push(SJNvor);
        WestFlowFeatures.push(MRBILwpt);
        WestFlowFeatures.push(YOTESwpt);
        EastFlowFeatures.push(SPRKYwpt);
        EastFlowFeatures.push(GOALYwpt);
        EastFlowFeatures.push(QUAKYwpt);
        EastFlowFeatures.push(SNOBLwpt);
        EastFlowFeatures.push(CARTLwpt);
        EastFlowFeatures.push(GOLDRwpt);
        EastFlowFeatures.push(ZEPERwpt);
        EastFlowFeatures.push(MAYSAwpt);
        EastFlowFeatures.push(LALUZwpt);
        EastFlowFeatures.push(FORPEwpt);
        EastFlowFeatures.push(SJNvor);
        EastFlowFeatures.push(POCCKwpt);
        EastFlowFeatures.push(MRBILwpt);
        EastFlowFeatures.push(YOTESwpt);
        TransitionFeatures.push(CARTLwpt);
        TransitionFeatures.push(GCNvor);
        TransitionFeatures.push(YOOPRwpt);
        TransitionFeatures.push(JARPAwpt);
        TransitionFeatures.push(JKPOTwpt);
        TransitionFeatures.push(SISIEwpt);
        var MAYSA51 = new ol.geom.LineString();
        var MAYSA52 = new ol.geom.LineString();
        var MAYSA53 = new ol.geom.LineString();
        var MAYSA54 = new ol.geom.LineString();
        var MAYSA55 = new ol.geom.LineString();
        var SNOBL51 = new ol.geom.LineString();
        var SNOBL52 = new ol.geom.LineString();
        var SNOBL53 = new ol.geom.LineString();
        var YOTES51 = new ol.geom.LineString();
        var YOTES52 = new ol.geom.LineString();
        var YOTES53 = new ol.geom.LineString();
        var YOTES54 = new ol.geom.LineString();
        var LALUZ51 = new ol.geom.LineString();
        var LALUZ52 = new ol.geom.LineString();
        var LALUZ53 = new ol.geom.LineString();
        MAYSA52.appendCoordinate(ol.proj.transform(SPRKYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        MAYSA52.appendCoordinate(ol.proj.transform(GOALYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        MAYSA52.appendCoordinate(ol.proj.transform(GOLDRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        MAYSA52.appendCoordinate(ol.proj.transform(ZEPERwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        MAYSA53.appendCoordinate(ol.proj.transform(ZEPERwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        MAYSA53.appendCoordinate(ol.proj.transform(MAYSAwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        MAYSA54.appendCoordinate(ol.proj.transform(MAYSAwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        MAYSA54.appendCoordinate(ol.proj.transform(JKPOTwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        MAYSA55.appendCoordinate(ol.proj.transform(MAYSAwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        MAYSA55.appendCoordinate(ol.proj.transform(SISIEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SNOBL51.appendCoordinate(ol.proj.transform(ZIDOGwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SNOBL51.appendCoordinate(ol.proj.transform(OXYGNwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SNOBL51.appendCoordinate(ol.proj.transform(ZILUBwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SNOBL51.appendCoordinate(ol.proj.transform(QUAKYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SNOBL51.appendCoordinate(ol.proj.transform(SNOBLwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SNOBL52.appendCoordinate(ol.proj.transform(GOALYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SNOBL52.appendCoordinate(ol.proj.transform(QUAKYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SNOBL52.appendCoordinate(ol.proj.transform(SNOBLwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SNOBL53.appendCoordinate(ol.proj.transform(SNOBLwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SNOBL53.appendCoordinate(ol.proj.transform(CARTLwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SNOBL53.appendCoordinate(ol.proj.transform(GCNvor.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        YOTES51.appendCoordinate(ol.proj.transform(ZILUBwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        YOTES51.appendCoordinate(ol.proj.transform(MRBILwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        YOTES51.appendCoordinate(ol.proj.transform(YOTESwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        YOTES52.appendCoordinate(ol.proj.transform(GOALYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        YOTES52.appendCoordinate(ol.proj.transform(POCCKwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        YOTES52.appendCoordinate(ol.proj.transform(MRBILwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        YOTES52.appendCoordinate(ol.proj.transform(YOTESwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        YOTES53.appendCoordinate(ol.proj.transform(YOTESwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        YOTES53.appendCoordinate(ol.proj.transform(YOOPRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        YOTES54.appendCoordinate(ol.proj.transform(YOTESwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        YOTES54.appendCoordinate(ol.proj.transform(JARPAwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        LALUZ51.appendCoordinate(ol.proj.transform(ZILUBwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        LALUZ51.appendCoordinate(ol.proj.transform(FORPEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        LALUZ51.appendCoordinate(ol.proj.transform(LALUZwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        LALUZ52.appendCoordinate(ol.proj.transform(SPRKYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        LALUZ52.appendCoordinate(ol.proj.transform(FORPEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        LALUZ52.appendCoordinate(ol.proj.transform(LALUZwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        LALUZ53.appendCoordinate(ol.proj.transform(LALUZwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        LALUZ53.appendCoordinate(ol.proj.transform(SJNvor.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var MAYSA52ln = setpathFunction(MAYSA52, SIDStyle);
        var MAYSA53ln = setpathFunction(MAYSA53, SIDStyle);
        var MAYSA54ln = setpathFunction(MAYSA54, SIDStyle);
        var MAYSA55ln = setpathFunction(MAYSA55, SIDStyle);
        var SNOBL51ln = setpathFunction(SNOBL51, SIDStyle);
        var SNOBL52ln = setpathFunction(SNOBL52, SIDStyle);
        var SNOBL53ln = setpathFunction(SNOBL53, SIDStyle);
        var YOTES51ln = setpathFunction(YOTES51, SIDStyle);
        var YOTES52ln = setpathFunction(YOTES52, SIDStyle);
        var YOTES53ln = setpathFunction(YOTES53, SIDStyle);
        var YOTES54ln = setpathFunction(YOTES54, SIDStyle);
        var LALUZ51ln = setpathFunction(LALUZ51, SIDStyle);
        var LALUZ52ln = setpathFunction(LALUZ52, SIDStyle);
        var LALUZ53ln = setpathFunction(LALUZ53, SIDStyle);
        WestFlowFeatures.push(MAYSA53ln);
        EastFlowFeatures.push(MAYSA52ln);
        EastFlowFeatures.push(MAYSA53ln);
        TransitionFeatures.push(MAYSA54ln);
        TransitionFeatures.push(MAYSA55ln);
        WestFlowFeatures.push(SNOBL51ln);
        EastFlowFeatures.push(SNOBL52ln);
        TransitionFeatures.push(SNOBL53ln);
        WestFlowFeatures.push(YOTES51ln);
        EastFlowFeatures.push(YOTES52ln);
        TransitionFeatures.push(YOTES53ln);
        TransitionFeatures.push(YOTES54ln);
        WestFlowFeatures.push(LALUZ51ln);
        EastFlowFeatures.push(LALUZ52ln);
        TransitionFeatures.push(LALUZ53ln);

        // KPHX FTHLS5, KATMN5, BNYRD5, JUDTH6 departure
        var BROAKwpt = setwaypointFunction("BROAK", 33.53, -111.22,-24,-6, "1");
        var FTHLSwpt = setwaypointFunction("FTHLS", 33.768, -110.364,10,6);
        var JNIPRwpt = setwaypointFunction("JNIPR", 34.03, -109.32);
        var ECLPSwpt = setwaypointFunction("ECLPS", 33.07, -111.45,-24,6, "1");
        var KATMNwpt = setwaypointFunction("KATMN", 32.64, -110.67,-8,6);
        var BOXXRwpt = setwaypointFunction("BOXXR", 32.44, -109.752);
        var PHASEwpt = setwaypointFunction("PHASE", 32.361, -109.158);
        var ANZELwpt = setwaypointFunction("ANZEL", 33.36, -111.80);
        var DDUKEwpt = setwaypointFunction("DDUKE", 33.155, -111.854);
        var BNYRDwpt = setwaypointFunction("BNYRD", 32.998, -111.966,-12,3);
        var JUDTHwpt = setwaypointFunction("JUDTH", 32.816, -113.68,10,8,"6");
        var MOHAKwpt = setwaypointFunction("MOHAK", 32.776, -113.971,4,4);
        var OAKLIwpt = setwaypointFunction("OAKLI", 33.350, -112.014);
        var STRRMwpt = setwaypointFunction("STRRM", 32.886, -111.909, -24, 12, "1"); 
        var FYRBDwpt = setwaypointFunction("FYRBD", 32.956, -112.674, 30, 6, "1"); 

        var INT02wpt = setwaypointFunction("INT02", 33.431, -112.046); 
        var JUTAKwpt = setwaypointFunction("JUTAK", 33.392, -112.191); 
        var WETALwpt = setwaypointFunction("WETAL", 33.291, -112.155, 0, 6); 
        var RIICHwpt = setwaypointFunction("RIICH", 33.24, -112.095, 0, 6); 
        var PYPPEwpt = setwaypointFunction("PYPPE", 33.26, -111.932, 0, 6); 
        var BARLLwpt = setwaypointFunction("BARLL", 33.425, -111.54, 0, 6); 

        WestFlowFeatures.push(BROAKwpt);
        WestFlowFeatures.push(FTHLSwpt);
        WestFlowFeatures.push(ECLPSwpt);
        WestFlowFeatures.push(KATMNwpt);
        WestFlowFeatures.push(BNYRDwpt);
        WestFlowFeatures.push(JUDTHwpt);
        WestFlowFeatures.push(STRRMwpt);
        WestFlowFeatures.push(FYRBDwpt);

        WestFlowFeatures.push(INT02wpt);
        WestFlowFeatures.push(JUTAKwpt);
        WestFlowFeatures.push(WETALwpt);
        WestFlowFeatures.push(RIICHwpt);
        WestFlowFeatures.push(PYPPEwpt);
        WestFlowFeatures.push(BARLLwpt);

    
        EastFlowFeatures.push(BROAKwpt);
        EastFlowFeatures.push(FTHLSwpt);
        EastFlowFeatures.push(ECLPSwpt);
        EastFlowFeatures.push(KATMNwpt);
        EastFlowFeatures.push(ANZELwpt);
        EastFlowFeatures.push(DDUKEwpt);
        EastFlowFeatures.push(BNYRDwpt);
        EastFlowFeatures.push(OAKLIwpt);
        EastFlowFeatures.push(JUDTHwpt);
        EastFlowFeatures.push(STRRMwpt);
        EastFlowFeatures.push(FYRBDwpt);
        TransitionFeatures.push(JNIPRwpt);
        TransitionFeatures.push(BOXXRwpt);
        TransitionFeatures.push(PHASEwpt);
        TransitionFeatures.push(MOHAKwpt);
        var FTHLS52 = new ol.geom.LineString();
        var FTHLS53 = new ol.geom.LineString();
        var BROAK11 = new ol.geom.LineString();
        var ECLPS11 = new ol.geom.LineString();
        var ECLPS12 = new ol.geom.LineString();
        var ECLPS13 = new ol.geom.LineString();
        var BNYRD51 = new ol.geom.LineString();
        var BNYRD52 = new ol.geom.LineString();
        var STRRM13 = new ol.geom.LineString();
        var JUDTH51 = new ol.geom.LineString();
        var JUDTH52 = new ol.geom.LineString();
        var JUDTH53 = new ol.geom.LineString();
        
        BROAK11.appendCoordinate(ol.proj.transform(INT02wpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BROAK11.appendCoordinate(ol.proj.transform(JUTAKwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BROAK11.appendCoordinate(ol.proj.transform(WETALwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BROAK11.appendCoordinate(ol.proj.transform(RIICHwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BROAK11.appendCoordinate(ol.proj.transform(PYPPEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BROAK11.appendCoordinate(ol.proj.transform(BARLLwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BROAK11.appendCoordinate(ol.proj.transform(BROAKwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));

        FTHLS52.appendCoordinate(ol.proj.transform(SPRKYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        FTHLS52.appendCoordinate(ol.proj.transform(BROAKwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));

        FTHLS53.appendCoordinate(ol.proj.transform(BROAKwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        FTHLS53.appendCoordinate(ol.proj.transform(FTHLSwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        FTHLS53.appendCoordinate(ol.proj.transform(JNIPRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));

        ECLPS11.appendCoordinate(ol.proj.transform(RIICHwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        ECLPS11.appendCoordinate(ol.proj.transform(ECLPSwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        ECLPS12.appendCoordinate(ol.proj.transform(SPRKYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        ECLPS12.appendCoordinate(ol.proj.transform(ECLPSwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        ECLPS13.appendCoordinate(ol.proj.transform(ECLPSwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        ECLPS13.appendCoordinate(ol.proj.transform(KATMNwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        ECLPS13.appendCoordinate(ol.proj.transform(BOXXRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        ECLPS13.appendCoordinate(ol.proj.transform(PHASEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BNYRD51.appendCoordinate(ol.proj.transform(WETALwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BNYRD51.appendCoordinate(ol.proj.transform(BNYRDwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BNYRD52.appendCoordinate(ol.proj.transform(SPRKYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BNYRD52.appendCoordinate(ol.proj.transform(ANZELwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BNYRD52.appendCoordinate(ol.proj.transform(DDUKEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BNYRD52.appendCoordinate(ol.proj.transform(BNYRDwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        STRRM13.appendCoordinate(ol.proj.transform(BNYRDwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        STRRM13.appendCoordinate(ol.proj.transform(STRRMwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        STRRM13.appendCoordinate(ol.proj.transform(TUSvor.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        JUDTH51.appendCoordinate(ol.proj.transform(WETALwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        JUDTH51.appendCoordinate(ol.proj.transform(FYRBDwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        JUDTH51.appendCoordinate(ol.proj.transform(JUDTHwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        JUDTH52.appendCoordinate(ol.proj.transform(USEYEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        JUDTH52.appendCoordinate(ol.proj.transform(OAKLIwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        JUDTH52.appendCoordinate(ol.proj.transform(FYRBDwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        JUDTH52.appendCoordinate(ol.proj.transform(JUDTHwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        JUDTH53.appendCoordinate(ol.proj.transform(JUDTHwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        JUDTH53.appendCoordinate(ol.proj.transform(MOHAKwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var BROAK11ln = setpathFunction(BROAK11, SIDStyle);
        var FTHLS52ln = setpathFunction(FTHLS52, SIDStyle);
        var FTHLS53ln = setpathFunction(FTHLS53, SIDStyle);
        var ECLPS11ln = setpathFunction(ECLPS11, SIDStyle);
        var ECLPS12ln = setpathFunction(ECLPS12, SIDStyle);
        var ECLPS13ln = setpathFunction(ECLPS13, SIDStyle);
        var BNYRD51ln = setpathFunction(BNYRD51, SIDStyle);
        var BNYRD52ln = setpathFunction(BNYRD52, SIDStyle);
        var STRRM13ln = setpathFunction(STRRM13, SIDStyle);
        var JUDTH51ln = setpathFunction(JUDTH51, SIDStyle);
        var JUDTH52ln = setpathFunction(JUDTH52, SIDStyle);
        var JUDTH53ln = setpathFunction(JUDTH53, SIDStyle);
//        WestFlowFeatures.push(FTHLS51ln);
        WestFlowFeatures.push(BROAK11ln);
        EastFlowFeatures.push(FTHLS52ln);
        TransitionFeatures.push(FTHLS53ln);
        WestFlowFeatures.push(ECLPS11ln);
        EastFlowFeatures.push(ECLPS12ln);
        TransitionFeatures.push(ECLPS13ln);
        WestFlowFeatures.push(BNYRD51ln);
        EastFlowFeatures.push(BNYRD52ln);
        TransitionFeatures.push(STRRM13ln);
        WestFlowFeatures.push(JUDTH51ln);
        EastFlowFeatures.push(JUDTH52ln);
        TransitionFeatures.push(JUDTH53ln);

        // New depature waypoints 
        var WIVLAwpt = setwaypointFunction("WIVLA", 33.441, -112.07); 
        var HIRVUwpt = setwaypointFunction("HIRVU", 33.445, -112.197); 
        var JINOLwpt = setwaypointFunction("JINOL", 33.431, -112.068); 
        var OSGUEwpt = setwaypointFunction("OSGUE", 33.435, -112.197); 
        var ZOLUPwpt = setwaypointFunction("ZOLUP", 33.429, -112.068); 
        var YOVKUwpt = setwaypointFunction("YOVKU", 33.433, -112.197); 
        var FANONwpt = setwaypointFunction("FANON", 33.625, -112.204, 0, 6); 
        var WULKOwpt = setwaypointFunction("WULKO", 33.39, -112.197); 
        WestFlowFeatures.push(WIVLAwpt);
        WestFlowFeatures.push(HIRVUwpt);
        WestFlowFeatures.push(ZIDOGwpt);
        WestFlowFeatures.push(JINOLwpt);
        WestFlowFeatures.push(OSGUEwpt);
        WestFlowFeatures.push(ZOLUPwpt);
        WestFlowFeatures.push(YOVKUwpt);
        WestFlowFeatures.push(FANONwpt);
        WestFlowFeatures.push(WULKOwpt);

        var ZEPER11 = new ol.geom.LineString();
        ZEPER11.appendCoordinate(ol.proj.transform(ZOLUPwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        ZEPER11.appendCoordinate(ol.proj.transform(YOVKUwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        ZEPER11.appendCoordinate(ol.proj.transform(ZIDOGwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        ZEPER11.appendCoordinate(ol.proj.transform(FANONwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        ZEPER11.appendCoordinate(ol.proj.transform(ZEPERwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var ZEPER11ln = setpathFunction(ZEPER11, SIDStyle);
        WestFlowFeatures.push(ZEPER11ln);

        var KEENS21 = new ol.geom.LineString();
        KEENS21.appendCoordinate(ol.proj.transform(WULKOwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        KEENS21.appendCoordinate(ol.proj.transform(KEENSwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var KEENS21ln = setpathFunction(KEENS21, SIDStyle);
        WestFlowFeatures.push(KEENS21ln);


    
        // KPHX EAGUL6 arrival
        var EAGULwpt = setwaypointFunction("EAGUL",34.132, -111.083,22,6,"6");
        var SLIDRwpt = setwaypointFunction("SLIDR",34.71, -109.852);
        var PAYSOwpt = setwaypointFunction("PAYSO",34.352, -110.79);
        var HOMRRwpt = setwaypointFunction("HOMRR",33.88, -111.41);
        var DERVLwpt = setwaypointFunction("DERVL",33.47, -111.76);
        var QUENYwpt = setwaypointFunction("QUENY",33.625, -111.887);
        var HINEYwpt = setwaypointFunction("HINEY",33.525, -112.073);
        var OBASEwpt = setwaypointFunction("OBASE",33.525, -112.16);
        WestFlowFeatures.push(ZUNvor);
        WestFlowFeatures.push(INWvor);
        WestFlowFeatures.push(SLIDRwpt);
        WestFlowFeatures.push(PAYSOwpt);
        WestFlowFeatures.push(EAGULwpt);
        WestFlowFeatures.push(HOMRRwpt);
        WestFlowFeatures.push(DERVLwpt);
        EastFlowFeatures.push(ZUNvor);
        EastFlowFeatures.push(SLIDRwpt);
        EastFlowFeatures.push(PAYSOwpt);
        EastFlowFeatures.push(EAGULwpt);
        EastFlowFeatures.push(HOMRRwpt);
        EastFlowFeatures.push(QUENYwpt);
        EastFlowFeatures.push(HINEYwpt);
        EastFlowFeatures.push(OBASEwpt);
        var EAGUL61 = new ol.geom.LineString();
        var EAGUL62 = new ol.geom.LineString();
        var EAGUL63 = new ol.geom.LineString();
        EAGUL61.appendCoordinate(ol.proj.transform(ZUNvor.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL61.appendCoordinate(ol.proj.transform(SLIDRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL61.appendCoordinate(ol.proj.transform(PAYSOwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL61.appendCoordinate(ol.proj.transform(EAGULwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL61.appendCoordinate(ol.proj.transform(HOMRRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL61.appendCoordinate(ol.proj.transform(DERVLwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL62.appendCoordinate(ol.proj.transform(ZUNvor.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL62.appendCoordinate(ol.proj.transform(SLIDRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL62.appendCoordinate(ol.proj.transform(PAYSOwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL62.appendCoordinate(ol.proj.transform(EAGULwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL62.appendCoordinate(ol.proj.transform(HOMRRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL62.appendCoordinate(ol.proj.transform(QUENYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL62.appendCoordinate(ol.proj.transform(HINEYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL62.appendCoordinate(ol.proj.transform(OBASEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL63.appendCoordinate(ol.proj.transform(INWvor.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        EAGUL63.appendCoordinate(ol.proj.transform(EAGULwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var EAGUL61ln = setpathFunction(EAGUL61, STARStyle);
        var EAGUL62ln = setpathFunction(EAGUL62, STARStyle);
        var EAGUL63ln = setpathFunction(EAGUL63, STARStyle);
        WestFlowFeatures.push(EAGUL61ln);
        WestFlowFeatures.push(EAGUL63ln);
        EastFlowFeatures.push(EAGUL62ln);
        EastFlowFeatures.push(EAGUL63ln);

 
        // KPHX BRUSR1 arrival
        var BRUSRwpt = setwaypointFunction("BRUSR", 34.087, -112.136,24,0,"1");
        var DRAKEwpt = setwaypointFunction("DRAKE", 34.71, -112.48);
        var DUTEYwpt = setwaypointFunction("DUTEY", 34.86, -112.32);
        var MAIERwpt = setwaypointFunction("MAIER", 34.447, -112.23);
        var BDWILwpt = setwaypointFunction("BDWIL", 33.91, -112.157);
        var TLMANwpt = setwaypointFunction("TLMAN", 33.46, -112.252); 
        var KUCOOwpt = setwaypointFunction("KUCOO", 33.528, -111.91); 
        var JURAZwpt = setwaypointFunction("JURAZ", 33.527, -111.85); 
        EastFlowFeatures.push(DRAKEwpt);
        EastFlowFeatures.push(DUTEYwpt);
        EastFlowFeatures.push(MAIERwpt);
        EastFlowFeatures.push(BRUSRwpt);
        EastFlowFeatures.push(BDWILwpt);
        EastFlowFeatures.push(TLMANwpt);
        WestFlowFeatures.push(DRAKEwpt);
        WestFlowFeatures.push(DUTEYwpt);
        WestFlowFeatures.push(MAIERwpt);
        WestFlowFeatures.push(BRUSRwpt);
        WestFlowFeatures.push(KUCOOwpt);
        WestFlowFeatures.push(JURAZwpt);
        var BRUSR11 = new ol.geom.LineString();
        var BRUSR12 = new ol.geom.LineString();
        var BRUSR13 = new ol.geom.LineString();
        BRUSR11.appendCoordinate(ol.proj.transform(DRAKEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BRUSR11.appendCoordinate(ol.proj.transform(MAIERwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BRUSR11.appendCoordinate(ol.proj.transform(BRUSRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BRUSR11.appendCoordinate(ol.proj.transform(BDWILwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BRUSR11.appendCoordinate(ol.proj.transform(TLMANwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BRUSR12.appendCoordinate(ol.proj.transform(DUTEYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BRUSR12.appendCoordinate(ol.proj.transform(MAIERwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BRUSR13.appendCoordinate(ol.proj.transform(DRAKEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BRUSR13.appendCoordinate(ol.proj.transform(MAIERwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BRUSR13.appendCoordinate(ol.proj.transform(BRUSRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BRUSR13.appendCoordinate(ol.proj.transform(KUCOOwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        BRUSR13.appendCoordinate(ol.proj.transform(JURAZwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var BRUSR11ln = setpathFunction(BRUSR11, STARStyle);
        var BRUSR12ln = setpathFunction(BRUSR12, STARStyle);
        var BRUSR13ln = setpathFunction(BRUSR13, STARStyle);
        EastFlowFeatures.push(BRUSR11ln);
        EastFlowFeatures.push(BRUSR12ln);
        WestFlowFeatures.push(BRUSR12ln);
        WestFlowFeatures.push(BRUSR13ln);

        // KPHX HYDRR1 Arrival
        var HYDRRwpt = setwaypointFunction("HYDRR", 33.275, -113.07,18,10,"1");
        var HOGGZwpt = setwaypointFunction("HOGGZ", 32.76, -114.062);
        var SPINKwpt = setwaypointFunction("SPINK", 33.34, -113.947);
        var SWOONwpt = setwaypointFunction("SWOON", 33.28, -113.24);
        var SALOMwpt = setwaypointFunction("SALOM", 33.517, -113.88);
        var MHAVIwpt = setwaypointFunction("MHAVI", 33.373, -113.45);
        var GEELAwpt = setwaypointFunction("GEELA", 33.28, -112.822);
        var TEICHwpt = setwaypointFunction("TEICH", 33.41, -112.50);
        var TESLEwpt = setwaypointFunction("TESLE", 33.428, -112.425);
        var CAGORwpt = setwaypointFunction("CAGOR", 33.428, -112.283);
        var CHAVOwpt = setwaypointFunction("CHAVO", 33.348, -112.093);
        var LEMOEwpt = setwaypointFunction("LEMOE", 33.345, -111.937);
        EastFlowFeatures.push(HOGGZwpt);
//        EastFlowFeatures.push(JUDTHwpt);
        EastFlowFeatures.push(HYDRRwpt);
        EastFlowFeatures.push(SPINKwpt);
        EastFlowFeatures.push(SWOONwpt);
        EastFlowFeatures.push(SALOMwpt);
        EastFlowFeatures.push(MHAVIwpt);
        EastFlowFeatures.push(GEELAwpt);
        EastFlowFeatures.push(TESLEwpt);
        EastFlowFeatures.push(CAGORwpt);
        WestFlowFeatures.push(HOGGZwpt);
//        WestFlowFeatures.push(JUDTHwpt);
        WestFlowFeatures.push(HYDRRwpt);
        WestFlowFeatures.push(SPINKwpt);
        WestFlowFeatures.push(SWOONwpt);
        WestFlowFeatures.push(SALOMwpt);
        WestFlowFeatures.push(MHAVIwpt);
        WestFlowFeatures.push(GEELAwpt);
        WestFlowFeatures.push(CHAVOwpt);
        WestFlowFeatures.push(LEMOEwpt);
        var HYDRR11 = new ol.geom.LineString();
        var HYDRR12 = new ol.geom.LineString();
        var HYDRR13 = new ol.geom.LineString();
        var HYDRR14 = new ol.geom.LineString();
        var HYDRR15 = new ol.geom.LineString();
        var HYDRR16 = new ol.geom.LineString();
        HYDRR11.appendCoordinate(ol.proj.transform(HOGGZwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR11.appendCoordinate(ol.proj.transform(JUDTHwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR11.appendCoordinate(ol.proj.transform(HYDRRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR12.appendCoordinate(ol.proj.transform(SPINKwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR12.appendCoordinate(ol.proj.transform(SWOONwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR12.appendCoordinate(ol.proj.transform(HYDRRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR13.appendCoordinate(ol.proj.transform(SALOMwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR13.appendCoordinate(ol.proj.transform(MHAVIwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR13.appendCoordinate(ol.proj.transform(SWOONwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR14.appendCoordinate(ol.proj.transform(SWOONwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR14.appendCoordinate(ol.proj.transform(HYDRRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR14.appendCoordinate(ol.proj.transform(GEELAwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR15.appendCoordinate(ol.proj.transform(GEELAwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR15.appendCoordinate(ol.proj.transform(TESLEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR15.appendCoordinate(ol.proj.transform(CAGORwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR16.appendCoordinate(ol.proj.transform(GEELAwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR16.appendCoordinate(ol.proj.transform(CHAVOwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        HYDRR16.appendCoordinate(ol.proj.transform(LEMOEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var HYDRR11ln = setpathFunction(HYDRR11, STARStyle);
        var HYDRR12ln = setpathFunction(HYDRR12, STARStyle);
        var HYDRR13ln = setpathFunction(HYDRR13, STARStyle);
        var HYDRR14ln = setpathFunction(HYDRR14, STARStyle);
        var HYDRR15ln = setpathFunction(HYDRR15, STARStyle);
        var HYDRR16ln = setpathFunction(HYDRR16, STARStyle);
        EastFlowFeatures.push(HYDRR11ln);
        EastFlowFeatures.push(HYDRR12ln);
        EastFlowFeatures.push(HYDRR13ln);
        EastFlowFeatures.push(HYDRR14ln);
        EastFlowFeatures.push(HYDRR15ln);
        WestFlowFeatures.push(HYDRR11ln);
        WestFlowFeatures.push(HYDRR12ln);
        WestFlowFeatures.push(HYDRR13ln);
        WestFlowFeatures.push(HYDRR14ln);
        WestFlowFeatures.push(HYDRR16ln);

        // KPHX PINNG1 Arrival
        var PINNGwpt = setwaypointFunction("PINNG", 32.74, -111.19,-24,4,"1");
        var DRRVRwpt = setwaypointFunction("DRRVR", 32.175, -109.29);
        var BNNKRwpt = setwaypointFunction("BNNKR", 32.468, -110.71);
        var BRDEYwpt = setwaypointFunction("BRDEY", 32.912, -111.488);
        var FINAPwpt = setwaypointFunction("FINAP", 33.403, -111.747);
        var LGACYwpt = setwaypointFunction("LGACY", 33.305, -112.078);
        var VISTLwpt = setwaypointFunction("VISTL", 33.341, -112.177);
        var NEELEwpt = setwaypointFunction("NEELE", 33.342, -112.357);
        EastFlowFeatures.push(DRRVRwpt);
        EastFlowFeatures.push(BNNKRwpt);
        EastFlowFeatures.push(PINNGwpt);
        EastFlowFeatures.push(BRDEYwpt);
        EastFlowFeatures.push(LGACYwpt);
        EastFlowFeatures.push(VISTLwpt);
        EastFlowFeatures.push(NEELEwpt);
        WestFlowFeatures.push(DRRVRwpt);
        WestFlowFeatures.push(BNNKRwpt);
        WestFlowFeatures.push(PINNGwpt);
        WestFlowFeatures.push(BRDEYwpt);
        WestFlowFeatures.push(FINAPwpt);
        var PINNG11 = new ol.geom.LineString();
        var PINNG12 = new ol.geom.LineString();
        var PINNG13 = new ol.geom.LineString();
        PINNG11.appendCoordinate(ol.proj.transform(DRRVRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        PINNG11.appendCoordinate(ol.proj.transform(BNNKRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        PINNG11.appendCoordinate(ol.proj.transform(PINNGwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        PINNG11.appendCoordinate(ol.proj.transform(BRDEYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        PINNG12.appendCoordinate(ol.proj.transform(BRDEYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        PINNG12.appendCoordinate(ol.proj.transform(FINAPwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        PINNG13.appendCoordinate(ol.proj.transform(BRDEYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        PINNG13.appendCoordinate(ol.proj.transform(LGACYwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        PINNG13.appendCoordinate(ol.proj.transform(VISTLwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        PINNG13.appendCoordinate(ol.proj.transform(NEELEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var PINNG11ln = setpathFunction(PINNG11, STARStyle);
        var PINNG12ln = setpathFunction(PINNG12, STARStyle);
        var PINNG13ln = setpathFunction(PINNG13, STARStyle);
        EastFlowFeatures.push(PINNG11ln);
        EastFlowFeatures.push(PINNG13ln);
        WestFlowFeatures.push(PINNG11ln);
        WestFlowFeatures.push(PINNG12ln);

         // Phoenix area approaches
        var BANYOwpt = setwaypointFunction("BANYO", 33.841, -112.075);
        var AVENTwpt = setwaypointFunction("AVENT", 33.691, -112.036);
        var AZCAFwpt = setwaypointFunction("AZCAF", 33.618, -111.915);
        var AZNUPwpt = setwaypointFunction("AZNUP", 33.814, -112.312);
        var BOLESwpt = setwaypointFunction("BOLES", 33.674, -112.3);
        var ONEKEwpt = setwaypointFunction("ONEKE", 33.462, -111.729);
        var CIPLUwpt = setwaypointFunction("CIPLU", 33.705, -111.76);
        var BAPPAwpt = setwaypointFunction("BAPPA", 33.706, -112.192);
        var SAENTwpt = setwaypointFunction("SAENT", 33.60, -111.892);
        var SIZVUwpt = setwaypointFunction("SIZVU", 33.231, -112.05);
        var DECTUwpt = setwaypointFunction("DECTU", 33.156, -111.971);
        var NISIWwpt = setwaypointFunction("NISIW", 33.084, -111.904);

        var SWIRLwpt = setwaypointFunction("SWIRL", 34.20, -111.925, 10,0);
        var LTCOLwpt = setwaypointFunction("LTCOL", 33.86, -112.02);
        var WLLMNwpt = setwaypointFunction("WLLMN", 33.74, -111.96);
        var BBALLwpt = setwaypointFunction("BBALL", 32.97, -111.48, 10,0);
        var NAAVEwpt = setwaypointFunction("NAAVE", 33.06, -111.812);
        var FRMANwpt = setwaypointFunction("FRMAN", 33.256, -111.988);
        var FURSTwpt = setwaypointFunction("FURST", 33.48, -112.025);
        var CLAASwpt = setwaypointFunction("CLAAS", 33.67, -112.082);
        var AR211wpt = setwaypointFunction("AR211", 33.701, -112.082);
        var AR212wpt = setwaypointFunction("AR212", 33.729, -112.065);
        var AR213wpt = setwaypointFunction("AR213", 33.746, -112.034);
        var AR214wpt = setwaypointFunction("AR214", 33.750, -111.997);
        var EEDGRwpt = setwaypointFunction("EEDGR", 33.693, -111.882);
        var AR215wpt = setwaypointFunction("AR215", 33.680, -111.871);
        var AR216wpt = setwaypointFunction("AR216", 33.665, -111.869);
        var DNAHOwpt = setwaypointFunction("DNAHO", 33.652, -111.877);
        var RW21wpt = setwaypointFunction("RW21", 33.628, -111.91);

        var AUX1INITwpt = setwaypointFunction("AUX1INIT", 33.779, -112.661);
        var MOBFAFwpt = setwaypointFunction("MOBFAF", 33.131, -112.356);
        var RW07Rwpt = setwaypointFunction("RW07R", 33.687, -112.093);
        var RW25Lwpt = setwaypointFunction("RW25L", 33.688, -112.072);
        var RW19wpt = setwaypointFunction("RW19", 33.533, -112.291);
        var RW11wpt = setwaypointFunction("RW11", 33.719, -112.539);
        var RW05wpt = setwaypointFunction("RW05", 32.951, -111.774);
        var RW09wpt = setwaypointFunction("RW09", 33.113, -112.276);
        var RW04Rwpt = setwaypointFunction("RW04R", 33.2657, -111.814);

        // KFFZ RNAV-B Approach
        ApproachFeatures.push(BANYOwpt);
        ApproachFeatures.push(AVENTwpt);
        ApproachFeatures.push(AZCAFwpt);
        ApproachFeatures.push(ONEKEwpt);
        var FFZRNAVB = new ol.geom.LineString();
        FFZRNAVB.appendCoordinate(ol.proj.transform(BANYOwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        FFZRNAVB.appendCoordinate(ol.proj.transform(AVENTwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        FFZRNAVB.appendCoordinate(ol.proj.transform(AZCAFwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        FFZRNAVB.appendCoordinate(ol.proj.transform(ONEKEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var FFZRNAVBln = setpathFunction(FFZRNAVB, APPRStyle);
        ApproachFeatures.push(FFZRNAVBln);

        // KDVT RNAV 07R Approach
        ApproachFeatures.push(AZNUPwpt);
        ApproachFeatures.push(BOLESwpt);
        ApproachFeatures.push(RW07Rwpt);
        var DVTR07R = new ol.geom.LineString();
        DVTR07R.appendCoordinate(ol.proj.transform(AZNUPwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        DVTR07R.appendCoordinate(ol.proj.transform(BOLESwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        DVTR07R.appendCoordinate(ol.proj.transform(RW07Rwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var DVTR07Rln = setpathFunction(DVTR07R, APPRStyle);
        ApproachFeatures.push(DVTR07Rln);

        // KDVT RNAV 25L Approach
        ApproachFeatures.push(CIPLUwpt);
        ApproachFeatures.push(RW25Lwpt);
        var DVTR25L = new ol.geom.LineString();
        DVTR25L.appendCoordinate(ol.proj.transform(CIPLUwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        DVTR25L.appendCoordinate(ol.proj.transform(RW25Lwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var DVTR25Lln = setpathFunction(DVTR25L, APPRStyle);
        ApproachFeatures.push(DVTR25Lln);

         // KGEU RNAV 19 Approach
        ApproachFeatures.push(BAPPAwpt);
        ApproachFeatures.push(RW19wpt);
        var GEUR19 = new ol.geom.LineString();
        GEUR19.appendCoordinate(ol.proj.transform(AVENTwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        GEUR19.appendCoordinate(ol.proj.transform(BAPPAwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        GEUR19.appendCoordinate(ol.proj.transform(RW19wpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var GEUR19ln = setpathFunction(GEUR19, APPRStyle);
        ApproachFeatures.push(GEUR19ln);

        // KGYR RNAV 3 Approach


        // KCHD RNAV 4L Approach
        ApproachFeatures.push(RW04Rwpt);
        ApproachFeatures.push(SIZVUwpt);
        ApproachFeatures.push(DECTUwpt);
        ApproachFeatures.push(NISIWwpt);
        var CHDR04RT = new ol.geom.LineString();
        var CHDR04R = new ol.geom.LineString();
        CHDR04RT.appendCoordinate(ol.proj.transform(SIZVUwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        CHDR04RT.appendCoordinate(ol.proj.transform(NISIWwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        CHDR04R.appendCoordinate(ol.proj.transform(DECTUwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        CHDR04R.appendCoordinate(ol.proj.transform(RW04Rwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var CHDR04RTln = setpathFunction(CHDR04RT, APPRStyle);
        var CHDR04Rln = setpathFunction(CHDR04R, APPRStyle);
        ApproachFeatures.push(CHDR04RTln);
        ApproachFeatures.push(CHDR04Rln);

        // KCGZ ILS 5 Approach
        ApproachFeatures.push(TFDvor);
        ApproachFeatures.push(RW05wpt);
        var CGZI05 = new ol.geom.LineString();
        CGZI05.appendCoordinate(ol.proj.transform(TFDvor.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        CGZI05.appendCoordinate(ol.proj.transform(RW05wpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var CGZI05ln = setpathFunction(CGZI05, APPRStyle);
        ApproachFeatures.push(CGZI05ln);

        // AUX1 ILS 11 Approach
        ApproachFeatures.push(AUX1INITwpt);
        ApproachFeatures.push(RW11wpt);
        var AUX1 = new ol.geom.LineString();
        AUX1.appendCoordinate(ol.proj.transform(AUX1INITwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        AUX1.appendCoordinate(ol.proj.transform(RW11wpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var AUX1ln = setpathFunction(AUX1, APPRStyle);
        ApproachFeatures.push(AUX1ln);

        // Mobile ILS 09 Approach
        ApproachFeatures.push(MOBFAFwpt);
        ApproachFeatures.push(RW09wpt);
        var MOBILS = new ol.geom.LineString();
        MOBILS.appendCoordinate(ol.proj.transform(MOBFAFwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        MOBILS.appendCoordinate(ol.proj.transform(RW09wpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var MOBFACln = setpathFunction(MOBILS, APPRStyle);
        ApproachFeatures.push(MOBFACln);


        // KSDL RNAV D Approach


        // KSDL VOR C Approach
        ApproachFeatures.push(SAENTwpt);
        var SDLRD = new ol.geom.LineString();
        SDLRD.appendCoordinate(ol.proj.transform(IWAvor.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SDLRD.appendCoordinate(ol.proj.transform(SAENTwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        var SDLRDln = setpathFunction(SDLRD, APPRStyle);
        ApproachFeatures.push(SDLRDln);

        // KSDL RNP 3 Approach


        // KSDL RNP 21 Approach
        ApproachFeatures.push(SWIRLwpt);
        ApproachFeatures.push(LTCOLwpt);
        ApproachFeatures.push(WLLMNwpt);
        ApproachFeatures.push(BBALLwpt);
        ApproachFeatures.push(NAAVEwpt);
        ApproachFeatures.push(FRMANwpt);
        ApproachFeatures.push(FURSTwpt);
        ApproachFeatures.push(CLAASwpt);
//        ApproachFeatures.push(AR211wpt);
//        ApproachFeatures.push(AR212wpt);
//        ApproachFeatures.push(AR213wpt);
//        ApproachFeatures.push(AR214wpt);
//        ApproachFeatures.push(AR215wpt);
//        ApproachFeatures.push(AR216wpt);
        ApproachFeatures.push(EEDGRwpt);
        ApproachFeatures.push(DNAHOwpt);
        ApproachFeatures.push(RW21wpt);
        var SDLR211 = new ol.geom.LineString();
        var SDLR212 = new ol.geom.LineString();
        var SDLR213 = new ol.geom.LineString();
        SDLR211.appendCoordinate(ol.proj.transform(WLLMNwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SDLR211.appendCoordinate(ol.proj.transform(EEDGRwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SDLR211.appendCoordinate(ol.proj.transform(AR215wpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SDLR211.appendCoordinate(ol.proj.transform(AR216wpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SDLR211.appendCoordinate(ol.proj.transform(DNAHOwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SDLR211.appendCoordinate(ol.proj.transform(RW21wpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SDLR212.appendCoordinate(ol.proj.transform(SWIRLwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));           SDLR212.appendCoordinate(ol.proj.transform(LTCOLwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SDLR212.appendCoordinate(ol.proj.transform(WLLMNwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));
        SDLR213.appendCoordinate(ol.proj.transform(BBALLwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));           
        SDLR213.appendCoordinate(ol.proj.transform(NAAVEwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));           
        SDLR213.appendCoordinate(ol.proj.transform(FRMANwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));           
        SDLR213.appendCoordinate(ol.proj.transform(FURSTwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));           
        SDLR213.appendCoordinate(ol.proj.transform(CLAASwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));           
        SDLR213.appendCoordinate(ol.proj.transform(AR211wpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));           
        SDLR213.appendCoordinate(ol.proj.transform(AR212wpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));           
        SDLR213.appendCoordinate(ol.proj.transform(AR213wpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));           
        SDLR213.appendCoordinate(ol.proj.transform(AR214wpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));           
        SDLR213.appendCoordinate(ol.proj.transform(WLLMNwpt.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'));           
        var SDLR211ln = setpathFunction(SDLR211, APPRStyle);
        var SDLR212ln = setpathFunction(SDLR212, APPRStyle);
        var SDLR213ln = setpathFunction(SDLR213, APPRStyle);
        ApproachFeatures.push(SDLR211ln);
        ApproachFeatures.push(SDLR212ln);
        ApproachFeatures.push(SDLR213ln);

        // Read the specialty icon JSON files and populate the appropriate arrays
        getSpecialtyIconData();

        // Some switch initializations for startup
        $('#emitter_checkbox').addClass('settingsCheckboxChecked');  //Default on for emitter symbols
        iconNumericTag = true;
    	$('#iconnumbtype_checkbox').addClass('settingsCheckboxChecked'); //Default on for Icon numbers
        //Initialize PHX flow switch to west flow
        $('#flowToggle').removeClass('settingsCheckboxChecked');
        $('#kphx_west_flow_checkbox').addClass('settingsCheckboxChecked');
        $('#kphx_east_flow_checkbox').removeClass('settingsCheckboxChecked');
        ol.control.LayerSwitcher.forEachRecursive(layers, function(lyr) {
        if (lyr.get('name') === 'kphx_proc_west') {
            lyr.setVisible(true);
            }
        })
        ol.control.LayerSwitcher.forEachRecursive(layers, function(lyr) {
            if (lyr.get('name') === 'kphx_proc_east') {
            lyr.setVisible(false);
            }
        })

        //Power up - hopefully - without the altitude chart
		$('#altitude_checkbox').removeClass('settingsCheckboxChecked');
		$('#altitude_chart').hide();

//End CJS Add

    
    
        // Add terrain-limit rings. To enable this:
        //
        //  create a panorama for your receiver location on heywhatsthat.com
        //
        //  note the "view" value from the URL at the top of the panorama
        //    i.e. the XXXX in http://www.heywhatsthat.com/?view=XXXX
        //
        // fetch a json file from the API for the altitudes you want to see:
        //
        //  wget -O /usr/share/dump1090-mutability/html/upintheair.json \
        //    'http://www.heywhatsthat.com/api/upintheair.json?id=XXXX&refraction=0.25&alts=3048,9144'
        //
        // NB: altitudes are in _meters_, you can specify a list of altitudes

        // kick off an ajax request that will add the rings when it's done
        var request = $.ajax({ url: 'upintheair.json',
                               timeout: 5000,
                               cache: true,
                               dataType: 'json' });
        request.done(function(data) {
                var ringStyle = new ol.style.Style({
                        fill: null,
                        stroke: new ol.style.Stroke({
                                color: '#000000',
                                width: 1
                        })
                });

                for (var i = 0; i < data.rings.length; ++i) {
                        var geom = new ol.geom.LineString();
                        var points = data.rings[i].points;
                        if (points.length > 0) {
                                for (var j = 0; j < points.length; ++j) {
                                        geom.appendCoordinate([ points[j][1], points[j][0] ]);
                                }
                                geom.appendCoordinate([ points[0][1], points[0][0] ]);
                                geom.transform('EPSG:4326', 'EPSG:3857');

                                var feature = new ol.Feature(geom);
                                feature.setStyle(ringStyle);
                                StaticFeatures.push(feature);
                        }
                }
        });

        request.fail(function(jqxhr, status, error) {
                // no rings available, do nothing
        });

}

function createSiteCircleFeatures() {
    // Clear existing circles first
    SiteCircleFeatures.forEach(function(circleFeature) {
       StaticFeatures.remove(circleFeature); 
    });
    SiteCircleFeatures.clear();

    var circleStyle = function(distance) {
    	return new ol.style.Style({
            fill: null,
            stroke: new ol.style.Stroke({
                    color: '#000000',
                    width: 1
            }),
            text: new ol.style.Text({
            	font: '10px Helvetica Neue, sans-serif',
            	fill: new ol.style.Fill({ color: '#000' }),
				offsetY: -8,
				text: format_distance_long(distance, DisplayUnits, 0)

			})
		});
    };

    var conversionFactor = 1000.0;
    if (DisplayUnits === "nautical") {
        conversionFactor = 1852.0;
    } else if (DisplayUnits === "imperial") {
        conversionFactor = 1609.0;
    }

    for (var i=0; i < SiteCirclesDistances.length; ++i) {
            var distance = SiteCirclesDistances[i] * conversionFactor;
            var circle = make_geodesic_circle(SitePosition, distance, 360);
            circle.transform('EPSG:4326', 'EPSG:3857');
            var feature = new ol.Feature(circle);
            feature.setStyle(circleStyle(distance));
            StaticFeatures.push(feature);
            SiteCircleFeatures.push(feature);
    }
}

// This looks for planes to reap out of the master Planes variable
function reaper() {
        //console.log("Reaping started..");

        // Look for planes where we have seen no messages for >300 seconds
        var newPlanes = [];
        for (var i = 0; i < PlanesOrdered.length; ++i) {
                var plane = PlanesOrdered[i];
                if (plane.seen > 300) {
                        // Reap it.                                
                        plane.tr.parentNode.removeChild(plane.tr);
                        plane.tr = null;
// Start CJS Add
                        EmitCircleFeatures.forEach(function(emitCircFeature) {
                            if (emitCircFeature.ICAO == plane.icao) {
                                EmitCircleFeatures.remove(emitCircFeature);
                            }
                        },this);
// End CJS Add
                        delete Planes[plane.icao];
                        plane.destroy();
                } else {
                        // Keep it.
                        newPlanes.push(plane);
                }
        };

        PlanesOrdered = newPlanes;
        refreshTableInfo();
        refreshSelected();
        refreshHighlighted();
}

// Page Title update function
function refreshPageTitle() {
        if (!PlaneCountInTitle && !MessageRateInTitle) {
                document.title = PageName;
                return;
        }

        var subtitle = "";

        if (PlaneCountInTitle) {
                subtitle += TrackedAircraftPositions + '/' + TrackedAircraft;
        }

        if (MessageRateInTitle) {
                if (subtitle) subtitle += ' | ';
                subtitle += MessageRate.toFixed(1) + '/s';
        }

        document.title = PageName + ' - ' + subtitle;
}

// Refresh the detail window about the plane
function refreshSelected() {
        if (MessageCountHistory.length > 1) {
                var message_time_delta = MessageCountHistory[MessageCountHistory.length-1].time - MessageCountHistory[0].time;
                var message_count_delta = MessageCountHistory[MessageCountHistory.length-1].messages - MessageCountHistory[0].messages;
                if (message_time_delta > 0)
                        MessageRate = message_count_delta / message_time_delta;
        } else {
                MessageRate = null;
        }

	refreshPageTitle();
       
        var selected = false;
	if (typeof SelectedPlane !== 'undefined' && SelectedPlane != "ICAO" && SelectedPlane != null) {
    	        selected = Planes[SelectedPlane];
        }
        
        $('#dump1090_infoblock').css('display','block');
        $('#dump1090_version').text(Dump1090Version);
        $('#dump1090_total_ac').text(TrackedAircraft);
        $('#dump1090_total_ac_positions').text(TrackedAircraftPositions);
        $('#dump1090_total_history').text(TrackedHistorySize);

        if (MessageRate !== null) {
                $('#dump1090_message_rate').text(MessageRate.toFixed(1));
        } else {
                $('#dump1090_message_rate').text("n/a");
        }

        setSelectedInfoBlockVisibility();

        if (!selected) {
                return;
        }
      
        if (selected.flight !== null && selected.flight !== "") {
                $('#selected_callsign').text(selected.flight);
        } else {
                $('#selected_callsign').text('n/a');
        }
        $('#selected_flightaware_link').html(getFlightAwareModeSLink(selected.icao, selected.flight, "Visit Flight Page"));

        if (selected.registration !== null) {
                $('#selected_registration').text(selected.registration);
        } else {
                $('#selected_registration').text("n/a");
        }

        if (selected.icaotype !== null) {
                $('#selected_icaotype').text(selected.icaotype);
        } else {
                $('#selected_icaotype').text("n/a");
        }

        // Not using this logic for the redesigned info panel at the time, but leaving it in  if/when adding it back
        // var emerg = document.getElementById('selected_emergency');
        // if (selected.squawk in SpecialSquawks) {
        //         emerg.className = SpecialSquawks[selected.squawk].cssClass;
        //         emerg.textContent = NBSP + 'Squawking: ' + SpecialSquawks[selected.squawk].text + NBSP ;
        // } else {
        //         emerg.className = 'hidden';
        // }

//Start CJS Add
        $("#selected_version").text(selected.version);
        $("#selected_incat").text(selected.in10+selected.in9);
        $('#selected_FAANNumberLookup_link').html(getFAANNumberLookupLink(selected.icao, selected.flight, selected.registration)); 
//End CJS Add

        $("#selected_altitude").text(format_altitude_long(selected.altitude, selected.vert_rate, DisplayUnits));

		$('#selected_onground').text(format_onground(selected.altitude));

        if (selected.squawk === null || selected.squawk === '0000') {
                $('#selected_squawk').text('n/a');
        } else {
                $('#selected_squawk').text(selected.squawk);
        }
	
		$('#selected_speed').text(format_speed_long(selected.gs, DisplayUnits));
		$('#selected_ias').text(format_speed_long(selected.ias, DisplayUnits));
		$('#selected_tas').text(format_speed_long(selected.tas, DisplayUnits));
		$('#selected_vertical_rate').text(format_vert_rate_long(selected.baro_rate, DisplayUnits));
		$('#selected_vertical_rate_geo').text(format_vert_rate_long(selected.geom_rate, DisplayUnits));
        $('#selected_icao').text(selected.icao.toUpperCase());
        $('#airframes_post_icao').attr('value',selected.icao);
		$('#selected_track').text(format_track_long(selected.track));

        if (selected.seen <= 1) {
                $('#selected_seen').text('now');
        } else {
                $('#selected_seen').text(selected.seen.toFixed(1) + 's');
        }

        $('#selected_country').text(selected.icaorange.country);
        if (ShowFlags && selected.icaorange.flag_image !== null) {
                $('#selected_flag').removeClass('hidden');
                $('#selected_flag img').attr('src', FlagPath + selected.icaorange.flag_image);
                $('#selected_flag img').attr('title', selected.icaorange.country);
        } else {
                $('#selected_flag').addClass('hidden');
        }

	if (selected.position === null) {
                $('#selected_position').text('n/a');
                $('#selected_follow').addClass('hidden');
        } else {
                
                if (selected.seen_pos > 1) {
                        $('#selected_position').text(format_latlng(selected.position));
                } else {
                        $('#selected_position').text(format_latlng(selected.position));
				}
				
                $('#selected_follow').removeClass('hidden');
                if (FollowSelected) {
                        $('#selected_follow').css('font-weight', 'bold');
                        OLMap.getView().setCenter(ol.proj.fromLonLat(selected.position));
                } else {
                        $('#selected_follow').css('font-weight', 'normal');
                }
	}
		if (selected.getDataSource() === "adsb_icao") {
			$('#selected_source').text("ADS-B");
		} else if (selected.getDataSource() === "tisb_trackfile" || selected.getDataSource() === "tisb_icao" || selected.getDataSource() === "tisb_other") {
			$('#selected_source').text("TIS-B");
//Start CJS Add
        } else if (selected.getDataSource() === "adsr_icao_nt" || selected.getDataSource() === "adsr_icao" || selected.getDataSource() === "adsr_other") {
        	$('#selected_source').text("Rebr");
//End CJS Add
		} else if (selected.getDataSource() === "mlat") {
			$('#selected_source').text("MLAT");
		} else {
			$('#selected_source').text("Other");
		}
		$('#selected_category').text(selected.category ? selected.category : "n/a");
        $('#selected_sitedist').text(format_distance_long(selected.sitedist, DisplayUnits));
        $('#selected_rssi').text(selected.rssi.toFixed(1) + ' dBFS');
        $('#selected_message_count').text(selected.messages);
		$('#selected_photo_link').html(getFlightAwarePhotoLink(selected.registration));
		
		$('#selected_altitude_geom').text(format_altitude_long(selected.alt_geom, selected.geom_rate, DisplayUnits));
        $('#selected_mag_heading').text(format_track_long(selected.mag_heading));
        $('#selected_true_heading').text(format_track_long(selected.true_heading));
        $('#selected_ias').text(format_speed_long(selected.ias, DisplayUnits));
        $('#selected_tas').text(format_speed_long(selected.tas, DisplayUnits));
        if (selected.mach == null) {
                $('#selected_mach').text('n/a');
        } else {
                $('#selected_mach').text(selected.mach.toFixed(3));
        }
        if (selected.roll == null) {
                $('#selected_roll').text('n/a');
        } else {
                $('#selected_roll').text(selected.roll.toFixed(1));
        }
        if (selected.track_rate == null) {
                $('#selected_trackrate').text('n/a');
        } else {
                $('#selected_trackrate').text(selected.track_rate.toFixed(2));
        }
        $('#selected_geom_rate').text(format_vert_rate_long(selected.geom_rate, DisplayUnits));
        if (selected.nav_qnh == null) {
                $('#selected_nav_qnh').text("n/a");
        } else {
                $('#selected_nav_qnh').text(selected.nav_qnh.toFixed(1) + " hPa");
        }
        $('#selected_nav_altitude').text(format_altitude_long(selected.nav_altitude, 0, DisplayUnits));
        $('#selected_nav_heading').text(format_track_long(selected.nav_heading));
        if (selected.nav_modes == null) {
                $('#selected_nav_modes').text("n/a");
        } else {
                $('#selected_nav_modes').text(selected.nav_modes.join());
		}
		if (selected.nic_baro == null) {
			$('#selected_nic_baro').text("n/a");
		} else {
			if (selected.nic_baro == 1) {
				$('#selected_nic_baro').text("cross-checked");
			} else {
				$('#selected_nic_baro').text("not cross-checked");
			}
		}

		$('#selected_nac_p').text(format_nac_p(selected.nac_p));
		$('#selected_nac_v').text(format_nac_v(selected.nac_v));
		if (selected.rc == null) {
			$('#selected_rc').text("n/a");
		} else if (selected.rc == 0) {
			$('#selected_rc').text("unknown");
		} else {
			$('#selected_rc').text(format_distance_short(selected.rc, DisplayUnits));
		}

		if (selected.sil == null || selected.sil_type == null) {
			$('#selected_sil').text("n/a");
		} else {
			var sampleRate = "";
			var silDesc = "";
			if (selected.sil_type == "perhour") {
				sampleRate = " per flight hour";
			} else if (selected.sil_type == "persample") {
				sampleRate = " per sample";
			}
			
			switch (selected.sil) {
				case 0:
					silDesc = "&gt; 1×10<sup>-3</sup>";
					break;
				case 1:
					silDesc = "≤ 1×10<sup>-3</sup>";
					break;
				case 2:
					silDesc = "≤ 1×10<sup>-5</sup>";
					break;
				case 3:
					silDesc = "≤ 1×10<sup>-7</sup>";
					break;
				default:
					silDesc = "n/a";
					sampleRate = "";
					break;
			}
			$('#selected_sil').html(silDesc + sampleRate);
		}

        if (selected.version == null) {
                $('#selected_version').text('none');
        } else if (selected.version == 0) {
                $('#selected_version').text('v0 (DO-260)');
        } else if (selected.version == 1) {
                $('#selected_version').text('v1 (DO-260A)');
        } else if (selected.version == 2) {
                $('#selected_version').text('v2 (DO-260B)');
        } else {
                $('#selected_version').text('v' + selected.version);
        }

        }

function refreshHighlighted() {
	// this is following nearly identical logic, etc, as the refreshSelected function, but doing less junk for the highlighted pane
	var highlighted = false;

	if (typeof HighlightedPlane !== 'undefined' && HighlightedPlane !== null) {
		highlighted = Planes[HighlightedPlane];
	}

	// no highlighted plane
	if (!highlighted) {
		$('#highlighted_infoblock').hide();
		return;
	}

	$('#highlighted_infoblock').show();

	// Get info box position and size
	var infoBox = $('#highlighted_infoblock');
	var infoBoxPosition = infoBox.position();
	if (typeof infoBoxOriginalPosition.top === 'undefined') {
		infoBoxOriginalPosition.top = infoBoxPosition.top;
		infoBoxOriginalPosition.left = infoBoxPosition.left;
	} else {
		infoBox.css("left", infoBoxOriginalPosition.left);
		infoBox.css("top", infoBoxOriginalPosition.top);
		infoBoxPosition = infoBox.position();
	}
	var infoBoxExtent = getExtent(infoBoxPosition.left, infoBoxPosition.top, infoBox.outerWidth(), infoBox.outerHeight());

	// Get map size
	var mapCanvas = $('#map_canvas');
	var mapExtent = getExtent(0, 0, mapCanvas.width(), mapCanvas.height());

	var marker = highlighted.marker;
	var markerCoordinates = highlighted.marker.getGeometry().getCoordinates();
    var markerPosition = OLMap.getPixelFromCoordinate(markerCoordinates);

	// Check for overlap
	//FIXME TODO: figure out this/remove this check
	if (isPointInsideExtent(markerPosition[0], markerPosition[1], infoBoxExtent) || true) {
		// Array of possible new positions for info box
		var candidatePositions = [];
		candidatePositions.push( { x: 40, y: 80 } );
		candidatePositions.push( { x: markerPosition[0] + 20, y: markerPosition[1] + 60 } );

		// Find new position
		for (var i = 0; i < candidatePositions.length; i++) {
			var candidatePosition = candidatePositions[i];
			var candidateExtent = getExtent(candidatePosition.x, candidatePosition.y, infoBox.outerWidth(), infoBox.outerHeight());

			if (!isPointInsideExtent(markerPosition[0],  markerPosition[1], candidateExtent) && isPointInsideExtent(candidatePosition.x, candidatePosition.y, mapExtent)) {
				// Found a new position that doesn't overlap marker - move box to that position
				infoBox.css("left", candidatePosition.x);
				infoBox.css("top", candidatePosition.y);
			}
		}
	}

	if (highlighted.flight !== null && highlighted.flight !== "") {
		$('#highlighted_callsign').text(highlighted.flight);
	} else {
		$('#highlighted_callsign').text('n/a');
	}

	if (highlighted.icaotype !== null) {
		$('#higlighted_icaotype').text(highlighted.icaotype);
	} else {
		$('#higlighted_icaotype').text("n/a");
	}

	if (highlighted.getDataSource() === "adsb_icao") {
		$('#highlighted_source').text("ADS-B");
	} else if (highlighted.getDataSource() === "tisb_trackfile" || highlighted.getDataSource() === "tisb_icao" || highlighted.getDataSource() === "tisb_other") {
		$('#highlighted_source').text("TIS-B");
	} else if (highlighted.getDataSource() === "mlat") {
		$('#highlighted_source').text("MLAT");
	} else {
		$('#highlighted_source').text("Other");
	}

	if (highlighted.registration !== null) {
		$('#highlighted_registration').text(highlighted.registration);
	} else {
		$('#highlighted_registration').text("n/a");
	}

	$('#highlighted_speed').text(format_speed_long(highlighted.speed, DisplayUnits));

	$("#highlighted_altitude").text(format_altitude_long(highlighted.altitude, highlighted.vert_rate, DisplayUnits));

	$('#highlighted_icao').text(highlighted.icao.toUpperCase());

//Start CJS Add
    if (highlighted.getDataSource() === "adsb_icao") {
        if (highlighted.version == "2") {
            $('#highlighted_source').text("A" + highlighted.version + highlighted.in10 + highlighted.in9);
         }else {
             if (highlighted.version == "1") {
                 $('#highlighted_source').text("A1");
             }else {
                $('#highlighted_source').text("A0");
             }
         }
        } else if (highlighted.getDataSource() === "tisb_trackfile" || highlighted.getDataSource() === "tisb_icao" || highlighted.getDataSource() === "tisb_other") {
        	$('#highlighted_source').text("TIS-B");
        } else if (highlighted.getDataSource() === "adsr_icao") {
            $('#highlighted_source').text("Re" + highlighted.in10 + highlighted.in9);
        } else if (highlighted.getDataSource() === "adsr_icao_nt" || highlighted.getDataSource() === "adsr_other") {
            $('#highlighted_source').text("Rebr");
        } else if (highlighted.getDataSource() === "mlat") {
        	$('#highlighted_source').text("MLAT");
        } else {
        	$('#highlighted_source').text("Other");
        }
        if (highlighted.seen <= 1) {
                $('#highlighted_seen').text('now');
        } else {
                $('#highlighted_seen').text(highlighted.seen.toFixed(1) + 's');
        }

//End CJS Add
}

function refreshClock() {
	$('#clock_div').text(new Date().toLocaleString());
	var c = setTimeout(refreshClock, 500);
}

function removeHighlight() {
	HighlightedPlane = null;
	refreshHighlighted();
}

// Refreshes the larger table of all the planes
function refreshTableInfo() {
    var show_squawk_warning = false;

    TrackedAircraft = 0
    TrackedAircraftPositions = 0
    TrackedHistorySize = 0

    $(".altitudeUnit").text(get_unit_label("altitude", DisplayUnits));
    $(".speedUnit").text(get_unit_label("speed", DisplayUnits));
    $(".distanceUnit").text(get_unit_label("distance", DisplayUnits));
    $(".verticalRateUnit").text(get_unit_label("verticalRate", DisplayUnits));

    for (var i = 0; i < PlanesOrdered.length; ++i) {
	var tableplane = PlanesOrdered[i];
    TrackedHistorySize += tableplane.history_size;
	if (tableplane.seen >= 58 || tableplane.isFiltered()) {
        tableplane.tr.className = "plane_table_row hidden";
    } else {
        TrackedAircraft++;
        var classes = "plane_table_row";

        if (tableplane.position !== null && tableplane.seen_pos < 60) {
            ++TrackedAircraftPositions;
		}

		if (tableplane.getDataSource() === "adsb_icao") {
        	classes += " vPosition";
        } else if (tableplane.getDataSource() === "tisb_trackfile" || tableplane.getDataSource() === "tisb_icao" || tableplane.getDataSource() === "tisb_other") {
        	classes += " tisb";
//Start CJS Add
        } else if (tableplane.getDataSource() === "adsr_icao_nt" || tableplane.getDataSource() === "adsr_icao" || tableplane.getDataSource() === "adsr_other") {
        	classes += " adsr";
//End CJS Add
        } else if (tableplane.getDataSource() === "mlat") {
        	classes += " mlat";
        } else {
        	classes += " other";
        }

		if (tableplane.icao == SelectedPlane)
            classes += " selected";
                    
        if (tableplane.squawk in SpecialSquawks) {
            classes = classes + " " + SpecialSquawks[tableplane.squawk].cssClass;
            show_squawk_warning = true;
		}			                

        // ICAO doesn't change
        if (tableplane.flight) {
                tableplane.tr.cells[2].innerHTML = getFlightAwareModeSLink(tableplane.icao, tableplane.flight, tableplane.flight);
        } else {
                tableplane.tr.cells[2].innerHTML = "";
        }
        tableplane.tr.cells[3].textContent = (tableplane.registration !== null ? tableplane.registration : "");
        tableplane.tr.cells[4].textContent = (tableplane.icaotype !== null ? tableplane.icaotype : "");
        tableplane.tr.cells[5].textContent = (tableplane.squawk !== null ? tableplane.squawk : "");
        tableplane.tr.cells[6].innerHTML = format_altitude_brief(tableplane.altitude, tableplane.vert_rate, DisplayUnits);
        tableplane.tr.cells[7].textContent = format_speed_brief(tableplane.gs, DisplayUnits);
        tableplane.tr.cells[8].textContent = format_vert_rate_brief(tableplane.vert_rate, DisplayUnits);
        tableplane.tr.cells[9].textContent = format_distance_brief(tableplane.sitedist, DisplayUnits);
        tableplane.tr.cells[10].textContent = format_track_brief(tableplane.track);
        tableplane.tr.cells[11].textContent = tableplane.messages;
        tableplane.tr.cells[12].textContent = tableplane.seen.toFixed(0);
        tableplane.tr.cells[13].textContent = (tableplane.rssi !== null ? tableplane.rssi : "");
        tableplane.tr.cells[14].textContent = (tableplane.position !== null ? tableplane.position[1].toFixed(4) : "");
        tableplane.tr.cells[15].textContent = (tableplane.position !== null ? tableplane.position[0].toFixed(4) : "");
//Start CJS Add
        var dataSource = format_data_source(tableplane.getDataSource());
        if (dataSource == "ADSB") {
            if (tableplane.version == "2") 
                tableplane.tr.cells[16].textContent = "A2" + tableplane.in10 + tableplane.in9;
            else if (tableplane.version == "1") 
                tableplane.tr.cells[16].textContent = "A1SB";
            else
                tableplane.tr.cells[16].textContent = "A0SB"
        } else { 
            if (dataSource == "Rebr") {
                if (tableplane.in10 == null) {
                    tableplane.tr.cells[16].textContent = "Rebr";
                } else { 
                    tableplane.tr.cells[16].textContent = "Re" + tableplane.in10 + tableplane.in9;
                }
                } else { 
                tableplane.tr.cells[16].textContent = dataSource;
        }}
//End CJS Add
        tableplane.tr.cells[17].innerHTML = getAirframesModeSLink(tableplane.icao);
        tableplane.tr.cells[18].innerHTML = getFlightAwareModeSLink(tableplane.icao, tableplane.flight);
        tableplane.tr.cells[19].innerHTML = getFlightAwarePhotoLink(tableplane.registration);
        tableplane.tr.className = classes;
	}
}

if (show_squawk_warning) {
            $("#SpecialSquawkWarning").css('display','block');
    } else {
            $("#SpecialSquawkWarning").css('display','none');
    }

    resortTable();
}

//
// ---- table sorting ----
//

function compareAlpha(xa,ya) {
        if (xa === ya)
                return 0;
        if (xa < ya)
                return -1;
        return 1;
}

function compareNumeric(xf,yf) {
        if (Math.abs(xf - yf) < 1e-9)
                return 0;

        return xf - yf;
}

function sortByICAO()     { sortBy('icao',    compareAlpha,   function(x) { return x.icao; }); }
function sortByFlight()   { sortBy('flight',  compareAlpha,   function(x) { return x.flight; }); }
function sortByRegistration()   { sortBy('registration',    compareAlpha,   function(x) { return x.registration; }); }
function sortByAircraftType()   { sortBy('icaotype',        compareAlpha,   function(x) { return x.icaotype; }); }
function sortBySquawk()   { sortBy('squawk',  compareAlpha,   function(x) { return x.squawk; }); }
function sortByAltitude() { sortBy('altitude',compareNumeric, function(x) { return (x.altitude == "ground" ? -1e9 : x.altitude); }); }
function sortBySpeed()    { sortBy('speed',   compareNumeric, function(x) { return x.gs; }); }
function sortByVerticalRate()   { sortBy('vert_rate',      compareNumeric, function(x) { return x.vert_rate; }); }
function sortByDistance() { sortBy('sitedist',compareNumeric, function(x) { return x.sitedist; }); }
function sortByTrack()    { sortBy('track',   compareNumeric, function(x) { return x.track; }); }
function sortByMsgs()     { sortBy('msgs',    compareNumeric, function(x) { return x.messages; }); }
function sortBySeen()     { sortBy('seen',    compareNumeric, function(x) { return x.seen; }); }
function sortByCountry()  { sortBy('country', compareAlpha,   function(x) { return x.icaorange.country; }); }
function sortByRssi()     { sortBy('rssi',    compareNumeric, function(x) { return x.rssi }); }
function sortByLatitude()   { sortBy('lat',   compareNumeric, function(x) { return (x.position !== null ? x.position[1] : null) }); }
function sortByLongitude()  { sortBy('lon',   compareNumeric, function(x) { return (x.position !== null ? x.position[0] : null) }); }
function sortByDataSource() { sortBy('data_source',     compareAlpha, function(x) { return x.getDataSource() } ); }

//Start CJS Add
function assignSourceSortNum(sourceType) {
    //Sort order: ADSR, TISB, Mode A, ADSB-NT, ADSB, MLAT, mode-S
       switch (sourceType) {
		case 'mlat':
			return 12;
		case 'adsb_icao':
		case 'adsb_other':
			return 10;
		case 'adsb_icao_nt':
			return 8;
		case 'adsr_icao':
		case 'adsr_other':
			return 2;
		case 'tisb_icao':
		case 'tisb_trackfile':
		case 'tisb_other':
			return 4;
		case 'mode_s':
			return 14;
		case 'mode_ac':
			return 6;
	}
    return 16;
}
function compareSource(xf,yf) {
    var xf_num = assignSourceSortNum(xf);
    var yf_num = assignSourceSortNum(yf);
    
    if (Math.abs(xf_num - yf_num) < 1e-9)
        return 0;

    return xf_num - yf_num;
}
function sortByDataSource() { sortBy('addrtype',     compareSource, function(x) { return x.getDataSource(); });}
//End CJS Add

var sortId = '';
var sortCompare = null;
var sortExtract = null;
var sortAscending = true;

function sortFunction(x,y) {
        var xv = x._sort_value;
        var yv = y._sort_value;

        // always sort missing values at the end, regardless of
        // ascending/descending sort
        if (xv == null && yv == null) return x._sort_pos - y._sort_pos;
        if (xv == null) return 1;
        if (yv == null) return -1;

        var c = sortAscending ? sortCompare(xv,yv) : sortCompare(yv,xv);
        if (c !== 0) return c;

        return x._sort_pos - y._sort_pos;
}

function resortTable() {
        // number the existing rows so we can do a stable sort
        // regardless of whether sort() is stable or not.
        // Also extract the sort comparison value.
        for (var i = 0; i < PlanesOrdered.length; ++i) {
                PlanesOrdered[i]._sort_pos = i;
                PlanesOrdered[i]._sort_value = sortExtract(PlanesOrdered[i]);
        }

        PlanesOrdered.sort(sortFunction);
        
        var tbody = document.getElementById('tableinfo').tBodies[0];
        for (var i = 0; i < PlanesOrdered.length; ++i) {
                tbody.appendChild(PlanesOrdered[i].tr);
        }
}

function sortBy(id,sc,se) {
		if (id !== 'data_source') {
			$('#grouptype_checkbox').removeClass('settingsCheckboxChecked');
		} else {
			$('#grouptype_checkbox').addClass('settingsCheckboxChecked');
		}
        if (id === sortId) {
                sortAscending = !sortAscending;
                PlanesOrdered.reverse(); // this correctly flips the order of rows that compare equal
        } else {
                sortAscending = true;
        }

        sortId = id;
        sortCompare = sc;
        sortExtract = se;

        resortTable();
}

function selectPlaneByHex(hex,autofollow) {
        //console.log("select: " + hex);
	// If SelectedPlane has something in it, clear out the selected
	if (SelectedAllPlanes) {
		deselectAllPlanes();
	}

	if (SelectedPlane != null) {
		Planes[SelectedPlane].selected = false;
		Planes[SelectedPlane].clearLines();
		Planes[SelectedPlane].updateMarker();
                $(Planes[SelectedPlane].tr).removeClass("selected");
		// scroll the infoblock back to the top for the next plane to be selected
		$('.infoblock-container').scrollTop(0);
	}

	// If we are clicking the same plane, we are deselecting it.
	// (unless it was a doubleclick..)
	if (SelectedPlane === hex && !autofollow) {
		hex = null;
	}

	if (hex !== null) {
		// Assign the new selected
		SelectedPlane = hex;
		Planes[SelectedPlane].selected = true;
		Planes[SelectedPlane].updateLines();
		Planes[SelectedPlane].updateMarker();
	    $(Planes[SelectedPlane].tr).addClass("selected");
	} else { 
		SelectedPlane = null;
	}

	if (SelectedPlane !== null && autofollow) {
		FollowSelected = true;
		if (OLMap.getView().getZoom() < 8)
			OLMap.getView().setZoom(8);
	} else {
		FollowSelected = false;
	} 

	refreshSelected();
	refreshHighlighted();
}

function highlightPlaneByHex(hex) {

	if (hex != null) {
		HighlightedPlane = hex;
	}
}

// loop through the planes and mark them as selected to show the paths for all planes
function selectAllPlanes() {
    HighlightedPlane = null;
	// if all planes are already selected, deselect them all
	if (SelectedAllPlanes) {
		deselectAllPlanes();
	} else {
		// If SelectedPlane has something in it, clear out the selected
		if (SelectedPlane != null) {
			Planes[SelectedPlane].selected = false;
			Planes[SelectedPlane].clearLines();
			Planes[SelectedPlane].updateMarker();
			$(Planes[SelectedPlane].tr).removeClass("selected");
		}

		SelectedPlane = null;
		SelectedAllPlanes = true;

		for(var key in Planes) {
			if (Planes[key].visible && !Planes[key].isFiltered()) {
				Planes[key].selected = true;
				Planes[key].updateLines();
				Planes[key].updateMarker();
			}
		}
	}

	$('#selectall_checkbox').addClass('settingsCheckboxChecked');

	refreshSelected();
	refreshHighlighted();
}

// on refreshes, try to find new planes and mark them as selected
function selectNewPlanes() {
	if (SelectedAllPlanes) {
		for (var key in Planes) {
			if (!Planes[key].visible || Planes[key].isFiltered()) {
				Planes[key].selected = false;
				Planes[key].clearLines();
				Planes[key].updateMarker();
			} else {
				if (Planes[key].selected !== true) {
					Planes[key].selected = true;
					Planes[key].updateLines();
					Planes[key].updateMarker();
				}
			}
		}
	}
}

// deselect all the planes
function deselectAllPlanes() {
	for(var key in Planes) {
		Planes[key].selected = false;
		Planes[key].clearLines();
		Planes[key].updateMarker();
		$(Planes[key].tr).removeClass("selected");
	}
	$('#selectall_checkbox').removeClass('settingsCheckboxChecked');
	SelectedPlane = null;
	SelectedAllPlanes = false;
	refreshSelected();
	refreshHighlighted();
}

function toggleFollowSelected() {
        FollowSelected = !FollowSelected;
        if (FollowSelected && OLMap.getView().getZoom() < 8)
                OLMap.getView().setZoom(8);
        refreshSelected();
}

function resetMap() {
        // Reset localStorage values and map settings
        localStorage['CenterLat'] = CenterLat = DefaultCenterLat;
        localStorage['CenterLon'] = CenterLon = DefaultCenterLon;
        localStorage['ZoomLvl']   = ZoomLvl = DefaultZoomLvl;

        // Set and refresh
        OLMap.getView().setZoom(ZoomLvl);
	OLMap.getView().setCenter(ol.proj.fromLonLat([CenterLon, CenterLat]));
	
	selectPlaneByHex(null,false);

//Start CJS Add
        clearSpecialtyIconData();
        getSpecialtyIconData();
//End CJS Add

}

function updateMapSize() {
    OLMap.updateSize();
}

function toggleSidebarVisibility(e) {
    e.preventDefault();
    $("#sidebar_container").toggle();
    $("#expand_sidebar_control").toggle();
    $("#toggle_sidebar_button").toggleClass("show_sidebar");
    $("#toggle_sidebar_button").toggleClass("hide_sidebar");
    updateMapSize();
}

function expandSidebar(e) {
    e.preventDefault();
    $("#map_container").hide()
    $("#toggle_sidebar_control").hide();
    $("#splitter").hide();
    $("#sudo_buttons").hide();
    $("#show_map_button").show();
    $("#sidebar_container").width("100%");
    setColumnVisibility();
    setSelectedInfoBlockVisibility();
    updateMapSize();
}

function showMap() {
    $("#map_container").show()
    $("#toggle_sidebar_control").show();
    $("#splitter").show();
    $("#sudo_buttons").show();
    $("#show_map_button").hide();
    $("#sidebar_container").width("470px");
    setColumnVisibility();
    setSelectedInfoBlockVisibility();
    updateMapSize();    
}

function showColumn(table, columnId, visible) {
    var index = $(columnId).index();
    if (index >= 0) {
        var cells = $(table).find("td:nth-child(" + (index + 1).toString() + ")");
        if (visible) {
            cells.show();
        } else {
            cells.hide();
        }
    }
}

function setColumnVisibility() {
    var mapIsVisible = $("#map_container").is(":visible");
    var infoTable = $("#tableinfo");

    showColumn(infoTable, "#registration", !mapIsVisible);
    showColumn(infoTable, "#aircraft_type", !mapIsVisible);   
    showColumn(infoTable, "#vert_rate", !mapIsVisible);
    showColumn(infoTable, "#rssi", !mapIsVisible);
    showColumn(infoTable, "#lat", !mapIsVisible);
    showColumn(infoTable, "#lon", !mapIsVisible);
//    showColumn(infoTable, "#data_source", !mapIsVisible);
    showColumn(infoTable, "#squawk", !mapIsVisible);
    showColumn(infoTable, "#msgs", !mapIsVisible);
    showColumn(infoTable, "#flag", !mapIsVisible);
    showColumn(infoTable, "#airframes_mode_s_link", !mapIsVisible);
    showColumn(infoTable, "#flightaware_mode_s_link", !mapIsVisible);
    showColumn(infoTable, "#flightaware_photo_link", !mapIsVisible);
}

function setSelectedInfoBlockVisibility() {
    var mapIsVisible = $("#map_container").is(":visible");
    var planeSelected = (typeof SelectedPlane !== 'undefined' && SelectedPlane != null && SelectedPlane != "ICAO");

    if (planeSelected && mapIsVisible) {
        $('#selected_infoblock').show();
		$('#sidebar_canvas').css('margin-bottom', $('#selected_infoblock').height() + 'px');
    }
    else {
        $('#selected_infoblock').hide();
		$('#sidebar_canvas').css('margin-bottom', 0);
	}
}

// Reposition selected plane info box if it overlaps plane marker
function adjustSelectedInfoBlockPosition() {
    if (typeof Planes === 'undefined' || typeof SelectedPlane === 'undefined' || Planes === null) {
        return;
    }

    var selectedPlane = Planes[SelectedPlane];

    if (selectedPlane === undefined || selectedPlane === null || selectedPlane.marker === undefined || selectedPlane.marker === null) {
        return;
    }

    try {
        // Get marker position
        var marker = selectedPlane.marker;
        var markerCoordinates = selectedPlane.marker.getGeometry().getCoordinates();
		var markerPosition = OLMap.getPixelFromCoordinate(markerCoordinates);
		
        // Get map size
        var mapCanvas = $('#map_canvas');
        var mapExtent = getExtent(0, 0, mapCanvas.width(), mapCanvas.height());

        // Check for overlap
        if (isPointInsideExtent(markerPosition[0], markerPosition[1], infoBoxExtent)) {
            // Array of possible new positions for info box
            var candidatePositions = [];
            candidatePositions.push( { x: 40, y: 60 } );
            candidatePositions.push( { x: 40, y: markerPosition[1] + 80 } );

            // Find new position
            for (var i = 0; i < candidatePositions.length; i++) {
                var candidatePosition = candidatePositions[i];
                var candidateExtent = getExtent(candidatePosition.x, candidatePosition.y, infoBox.outerWidth(), infoBox.outerHeight());

                if (!isPointInsideExtent(markerPosition[0],  markerPosition[1], candidateExtent) && isPointInsideExtent(candidatePosition.x, candidatePosition.y, mapExtent)) {
                    // Found a new position that doesn't overlap marker - move box to that position
                    infoBox.css("left", candidatePosition.x);
                    infoBox.css("top", candidatePosition.y);
                    return;
                }
            }
        }
    } 
    catch(e) { }
}

function getExtent(x, y, width, height) {
    return {
        xMin: x,
        yMin: y,
        xMax: x + width - 1,
        yMax: y + height - 1,
    };
}

function isPointInsideExtent(x, y, extent) {
    return x >= extent.xMin && x <= extent.xMax && y >= extent.yMin && y <= extent.yMax;
}

function initializeUnitsSelector() {
    // Get display unit preferences from local storage
    if (!localStorage.getItem('displayUnits')) {
        localStorage['displayUnits'] = "nautical";
    }
    var displayUnits = localStorage['displayUnits'];
    DisplayUnits = displayUnits;

    setAltitudeLegend(displayUnits);

    // Initialize drop-down
    var unitsSelector = $("#units_selector");
    unitsSelector.val(displayUnits);
    unitsSelector.on("change", onDisplayUnitsChanged);
}

function onDisplayUnitsChanged(e) {
    var displayUnits = e.target.value;
    // Save display units to local storage
    localStorage['displayUnits'] = displayUnits;
    DisplayUnits = displayUnits;

    setAltitudeLegend(displayUnits);

    // Update filters
    updatePlaneFilter();

    // Refresh data
    refreshTableInfo();
    refreshSelected();
    refreshHighlighted();

    // Redraw range rings
    if (SitePosition !== null && SitePosition !== undefined && SiteCircles) {
        createSiteCircleFeatures();
    }

    // Reset map scale line units
    OLMap.getControls().forEach(function(control) {
        if (control instanceof ol.control.ScaleLine) {
            control.setUnits(displayUnits);
        }
    });
}

function setAltitudeLegend(units) {
    if (units === 'metric') {
        $('#altitude_chart_button').addClass('altitudeMeters');
    } else {
        $('#altitude_chart_button').removeClass('altitudeMeters');
    }
}

function onFilterByAltitude(e) {
    e.preventDefault();
    updatePlaneFilter();
    refreshTableInfo();

    var selectedPlane = Planes[SelectedPlane];
    if (selectedPlane !== undefined && selectedPlane !== null && selectedPlane.isFiltered()) {
        SelectedPlane = null;
        selectedPlane.selected = false;
        selectedPlane.clearLines();
        selectedPlane.updateMarker();         
        refreshSelected();
        refreshHighlighted();
    }
}

function filterGroundVehicles(switchFilter) {
	if (typeof localStorage['groundVehicleFilter'] === 'undefined') {
		localStorage['groundVehicleFilter'] = 'not_filtered';
	}
	var groundFilter = localStorage['groundVehicleFilter'];
	if (switchFilter === true) {
		groundFilter = (groundFilter === 'not_filtered') ? 'filtered' : 'not_filtered';
	}
	if (groundFilter === 'not_filtered') {
		$('#groundvehicle_filter').addClass('settingsCheckboxChecked');
	} else {
		$('#groundvehicle_filter').removeClass('settingsCheckboxChecked');
	}
	localStorage['groundVehicleFilter'] = groundFilter;
	PlaneFilter.groundVehicles = groundFilter;
}

function filterBlockedMLAT(switchFilter) {
	if (typeof localStorage['blockedMLATFilter'] === 'undefined') {
		localStorage['blockedMLATFilter'] = 'not_filtered';
	}
	var blockedMLATFilter = localStorage['blockedMLATFilter'];
	if (switchFilter === true) {
		blockedMLATFilter = (blockedMLATFilter === 'not_filtered') ? 'filtered' : 'not_filtered';
	}
	if (blockedMLATFilter === 'not_filtered') {
		$('#blockedmlat_filter').addClass('settingsCheckboxChecked');
	} else {
		$('#blockedmlat_filter').removeClass('settingsCheckboxChecked');
	}
	localStorage['blockedMLATFilter'] = blockedMLATFilter;
	PlaneFilter.blockedMLAT = blockedMLATFilter;
}

function toggleAltitudeChart(switchToggle) {
	if (typeof localStorage['altitudeChart'] === 'undefined') {
		localStorage['altitudeChart'] = 'show';
	}
	var altitudeChartDisplay = localStorage['altitudeChart'];
	if (switchToggle === true) {
		altitudeChartDisplay = (altitudeChartDisplay === 'show') ? 'hidden' : 'show';
	}
    // if you're using custom colors always hide the chart
    if (customAltitudeColors === true) {
        altitudeChartDisplay = 'hidden';
        // also hide the control option
        $('#altitude_chart_container').hide();
    }
	if (altitudeChartDisplay === 'show') {
		$('#altitude_checkbox').addClass('settingsCheckboxChecked');
		$('#altitude_chart').show();
	} else {
		$('#altitude_checkbox').removeClass('settingsCheckboxChecked');
		$('#altitude_chart').hide();
	}
	localStorage['altitudeChart'] = altitudeChartDisplay;
}

function onResetAltitudeFilter(e) {
    $("#altitude_filter_min").val("");
    $("#altitude_filter_max").val("");

    updatePlaneFilter();
    refreshTableInfo();
}

function updatePlaneFilter() {
    var minAltitude = parseFloat($("#altitude_filter_min").val().trim());
    var maxAltitude = parseFloat($("#altitude_filter_max").val().trim());

    if (minAltitude === NaN) {
        minAltitude = -Infinity;
    }

    if (maxAltitude === NaN) {
        maxAltitude = Infinity;
    }

    PlaneFilter.minAltitude = minAltitude;
    PlaneFilter.maxAltitude = maxAltitude;
    PlaneFilter.altitudeUnits = DisplayUnits;
}

function getFlightAwareIdentLink(ident, linkText) {
    if (ident !== null && ident !== "") {
        if (!linkText) {
            linkText = ident;
        }
        return "<a target=\"_blank\" href=\"https://flightaware.com/live/flight/" + ident.trim() + "\">" + linkText + "</a>";
    }

    return "";
}

function getFlightAwareModeSLink(code, ident, linkText) {
    if (code !== null && code.length > 0 && code[0] !== '~' && code !== "000000") {
        if (!linkText) {
            linkText = "FlightAware: " + code.toUpperCase();
        }

        var linkHtml = "<a target=\"_blank\" href=\"https://flightaware.com/live/modes/" + code ;
        if (ident !== null && ident !== "") {
            linkHtml += "/ident/" + ident.trim();
        }
        linkHtml += "/redirect\">" + linkText + "</a>";
        return linkHtml;
    }

    return "";
}

//Start CJS Add
function getFAANNumberLookupLink(icao, ident, reg) {
    if (icao.charAt(0) == "A" || icao.charAt(0) == "a") {
      if (!ident && !reg) {
        var linkHtml = "<a target=\"_blank\" href=\"http://registry.faa.gov/aircraftinquiry/NNum_inquiry.aspx\">FAA N number query</a>";
      } else {
        var NNumber;
        if (reg.charAt(0) == "N" || reg.charAt(0) == "n") {
            NNumber = reg;
        } else if (ident.charAt(0) == "N" || reg.charAt(0) == "n") {
                NNumber = ident;
            }
        var linkHtml = "<a target=\"_blank\" href=\"http://registry.faa.gov/aircraftinquiry/NNum_Results.aspx?NNumbertxt=" + NNumber+ "\">FAA N number query</a>";
      }
      return linkHtml;
    }
    return "";
}
//End CJS Add

function getFlightAwarePhotoLink(registration) {
    if (registration !== null && registration !== "") {
        return "<a target=\"_blank\" href=\"https://flightaware.com/photos/aircraft/" + registration.replace(/[^0-9a-z]/ig,'') + "\">See Photos</a>";
    }

    return "";   
}

function getAirframesModeSLink(code) {
    if (code !== null && code.length > 0 && code[0] !== '~' && code !== "000000") {
        return "<a href=\"http://www.airframes.org/\" onclick=\"$('#airframes_post_icao').attr('value','" + code + "'); document.getElementById('horrible_hack').submit.call(document.getElementById('airframes_post')); return false;\">Airframes.org: " + code.toUpperCase() + "</a>";
    }

    return "";   
}


// takes in an elemnt jQuery path and the OL3 layer name and toggles the visibility based on clicking it
function toggleLayer(element, layer) {
	// set initial checked status
	ol.control.LayerSwitcher.forEachRecursive(layers, function(lyr) { 
		if (lyr.get('name') === layer && lyr.getVisible()) {
			$(element).addClass('settingsCheckboxChecked');
		}
	});
	$(element).on('click', function() {
		var visible = false;
		if ($(element).hasClass('settingsCheckboxChecked')) {
			visible = true;
		}
		ol.control.LayerSwitcher.forEachRecursive(layers, function(lyr) { 
			if (lyr.get('name') === layer) {
				if (visible) {
					lyr.setVisible(false);
					$(element).removeClass('settingsCheckboxChecked');
				} else {
					lyr.setVisible(true);
					$(element).addClass('settingsCheckboxChecked');
				}
			}
		});
	});
}

// check status.json if it has a serial number for a flightfeeder
function flightFeederCheck() {
	$.ajax('/status.json', {
		success: function(data) {
			if (data.type === "flightfeeder") {
				isFlightFeeder = true;
				updatePiAwareOrFlightFeeder();
			}
		}
	})
}

// updates the page to replace piaware with flightfeeder references
function updatePiAwareOrFlightFeeder() {
	if (isFlightFeeder) {
		$('.piAwareLogo').hide();
		$('.flightfeederLogo').show();
		PageName = 'FlightFeeder Skyview';
	} else {
		$('.flightfeederLogo').hide();
		$('.piAwareLogo').show();
		PageName = 'PiAware Skyview';
	}
	refreshPageTitle();
}
