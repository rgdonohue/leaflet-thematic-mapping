$(document).ready(function() {
	// start the magic here when the document is loaded (thnx JQuery)
	var cities, // create a global variable for our map symbols for access by UI later in program
		map = L.map('map', { //create the Leaflet map and store in global variable
			center: [37.8, -96], // set its initial view by centering
			zoom: 4,	// and provide a zoom level
			minZoom: 4  // and don't let the use zoom out past this level (could constrain more pan/zoom here)
		});
	
	L.tileLayer(  // create a tileLayer object
		'http://{s}.acetate.geoiq.com/tiles/acetate/{z}/{x}/{y}.png', { // request some tiles
			attribution: 'Acetate tileset from GeoIQ'  // thank you GeoIQ!!
	}).addTo(map); // add the tiled basemap to the map 

	$.getJSON("data/city-data.json")  // JQuery's call to retreive our JSON object
		.done(function(data) { // when file has finished loading

			var dataInfo = processData(data); // retreive specific information about the data and store in variable

			// Initialize the map's UI, prop symbols, and legend
			createPropSymbols(dataInfo.timestamps, data); // draw the prop symbols  
			createLegend(dataInfo.min,dataInfo.max); // draw a legend with max and min values from data	
			createSliderUI(dataInfo.timestamps); // prepare the UI with the data specifics	

		})
		.fail(function() { alert("There has been a problem loading the data.")}); // does the obvious poor solution

	function processData(data) {
		// function loops through the loaded data and extracts information used later in the program: e.g. attribute lables, min and max data values these values are stored in an object and return to caller for ease of access

		var timestamps = [], // empty array for storing our year attribute headings
			min = Infinity,	//  min and max values set 
			max = -Infinity;

		for (var feature in data.features) { // for each of our cities

			var properties = data.features[feature].properties; // shortcut to that city's properties	

			for (var attribute in properties) { // for each attribute heading (year) in each city's properties

				if ( attribute != 'id' &&	// if that heading is not one of the following (we are only looking for the data values attributes)
					 attribute != 'name' &&
					 attribute != 'lat' &&
					 attribute != 'lon' ) 
				{
					if ( $.inArray(attribute,timestamps) ===  -1) {	// if we haven't already stored that heading
						timestamps.push(attribute);	// push that attribute heading into the timestamps array
					}
					if (properties[attribute] < min) {	
						// calculate the min values of entire data range while we're looping through all the data
						min = properties[attribute];

					}
					if (properties[attribute] > max) { 
						max = properties[attribute];  // do same for max value
					}
				}
			}
		}

		return { // return the information we want from the data as an object
			timestamps : timestamps,
			min : min,
			max : max
		}
	}  // end processData()
	function createPropSymbols(timestamps, data) {
		// function draws SVG circles using Leaflet's circleMarker class
		cities = L.geoJson(data, { // parse and create new GeoJson layer		

			pointToLayer: function(feature, latlng) { // make each point a layer 	

				return L.circleMarker(latlng, { // and at that, a Leaflet circleMarker object	
				
				    fillColor: "#708598", // give them a fill color
				    color: '#537898', // more saturated outline helps with overlapping prop symbols	
				    weight: 1, // provide a stroke weight
				    fillOpacity: 0.6  // and let's bump up the default opacity from .4

				});
			}
		}).addTo(map); // add the layer of circleMarkers to the map 

		updatePropSymbols(timestamps[0]); // first call to symbolize the prop symbols (e.g. resize, pop-up info)


	} // end createPropSymbols()
	function updatePropSymbols(timestamp) {
		// function loops through all city symbols and updates their size and popup information based upon the current year
		cities.eachLayer(function(layer) { // Leaflet eachLayer method loops through our cities
			
			var props = layer.feature.properties, // shortcut to props stored in variable
				radius = calcPropRadius(props[timestamp]), // calculate the radius for given timestamp
				popupContent = "<b>" + String(props[timestamp]) + " units</b><br>" +
							   "<i>" + props.name +
							   "</i> in </i>" + timestamp + "</i>";  // build the popup content as html

			layer.setRadius(radius); // set the radius for 
			layer.bindPopup(popupContent, { offset: new L.Point(0,-radius) }); // bind the content and offset the popup
			layer.on({  // provide each layer with a listener event

				mouseover: function(e) {  // on mouseover
					this.openPopup(); // open that layer's popup
					this.setStyle({color: 'yellow'}); // change the stroke color
				},
				mouseout: function(e) { // on mouseout
					this.closePopup();  // close the popup
					this.setStyle({color: '#537898'});  // reset the stroke color back to original
						
				}
			});  

		});
	} // end updatePropSymbols
	function calcPropRadius(attributeValue) {
		// function accepts a value and with it caculates and returns the diameter for the prop symbol
		
		var scaleFactor = 16,  // set a scale factor value
			area = attributeValue * scaleFactor; // multiple our value by the scale factor 

		return Math.sqrt(area/Math.PI)*2;  //calculate the diameter and return it to the caller
			
	} // end calcPropRadius
	function createLegend(min, max) {
		// function draws a 3-class legend using input max,min values to dynamically resize html 
		// div elements, styled to look like ciricles.  

		if (min < 10) {	// if our lowest value is less than 10, 
			min = 10;  // let's just round that up to 10
		}
		function roundNumber(inNumber) {
       		// function rounds the number to the nearest meaningful digit

       		return (Math.round(inNumber/10) * 10);  // ten here needs to be modified for the data (#hack)
		}

		var legend = L.control( { position: 'bottomright' } );

		legend.onAdd = function(map) {

			var legendContainer = L.DomUtil.create("div", "legend"),  // create a element to hold legend
				symbolsContainer = L.DomUtil.create("div", "symbolsContainer"),  // let's keep the circles in their own div to help with positioning
				classes = [roundNumber(min), roundNumber((max-min)/2), roundNumber(max)], // create array of class values
				legendCircle,  // delcare this here to keep performance good in loop below (stack/heap in JS?)
				diameter,  // same
				diameters = [] // an empty array for holding our cacluated radius values;

			// keep user interaction from affecting the slippy map below
			L.DomEvent.addListener(legendContainer, 'mousedown', function(e) { L.DomEvent.stopPropagation(e); });  

			$(legendContainer).append("<h2 id='legendTitle'># of somethings</h2>"); // legend title
			
			for (var i = 0; i < classes.length; i++) {  // for each of our classes

				legendCircle = L.DomUtil.create("div", "legendCircle");  // create a new element with class legendCircle
				diameter = calcPropRadius(classes[i])*2; // get the diameter for sizing width of legend symbol
				diameters.push(diameter);
				
				var lastdiameter;
				if (diameters[i-1]){
					lastdiameter = diameters[i-1];  // determin offset of symbols from top
				} else {
					lastdiameter = 0; // max value is not offset
				};

				// dynamically change the style; negative margin-left with style.css display:inline-block will nest the symbols
				$(legendCircle).attr("style", "width: "+diameter+"px; height: "+diameter+"px; margin-left: -"+((diameter+lastdiameter+2)/2)+"px" );

				// give the element a style rule
				$(legendCircle).append("<span class='legendValue'>"+classes[i]+"<span>");

				// add the new element to the container html element
				$(symbolsContainer).append(legendCircle);	

			};

			$(legendContainer).append(symbolsContainer);  // add the symbols to the legend

			return legendContainer; // boomsauce

		};

		legend.addTo(map);  // we know what's happing here

	}// end createLegend()
	function createSliderUI(timestamps) {
		// function builds the UI element for the temporal slider using Leaflet's Control class
		var sliderControl = L.control({ position: 'bottomleft'} );  // create a new L.control object

		sliderControl.onAdd = function(map) {
			// when this control object is added to the map

			var slider = L.DomUtil.create("input", "range-slider");  // create an input element with a class of 'range-slider' 

			L.DomEvent.addListener(slider, 'mousedown', function(e) { 

				L.DomEvent.stopPropagation(e); // prevent panning when interacting with slider

			});

			$(slider)  // select the slider
				.attr({'type':'range', 'max': timestamps[timestamps.length-1], 'min':timestamps[0], 'step': 1,'value': String(timestamps[0])}) // give it attributes
		        .on('input change', function() {
		        	// when slider changes
		        	updatePropSymbols($(this).val().toString()); // update all the symbols (and info)
		            $(".temporal-legend").text(this.value); // update the temporal legend as well
		        });

			return slider; // return slider object to onAdd() function
		}

		sliderControl.addTo(map); // add the slider to the map
		createTemporalLegend(dataInfo.timestamps[0]); // create the temporalLegend and populate with initial timestamp

	} // end createSliderUI()
	function createTemporalLegend(startTimeStamp) {
		// function creates a new DOM element for outputing the temporal timestamp within it, similar to createSliderUI()

		var temporalLegend = L.control({ position: 'bottomleft' });  

		temporalLegend.onAdd = function(map) {  

			var output = L.DomUtil.create("output", "temporal-legend");

			return output;  
		}

		temporalLegend.addTo(map);  

		$(".temporal-legend").text(startTimeStamp);  // display inital timestamp
	}	// end createTemporalLegend()
}); // end program