$(document).ready(function() {

	var cities,	
		map = L.map('map', { 
			center: [37.8, -96], 
			zoom: 4,	
			minZoom: 4  
		});
	
	L.tileLayer(  
		'http://{s}.acetate.geoiq.com/tiles/acetate/{z}/{x}/{y}.png', {
			attribution: 'Acetate tileset from GeoIQ'  
	}).addTo(map);	

	$.getJSON("data/city-data.json")  	
		.done(function(data) {

			var dataInfo = processData(data);	
			createPropSymbols(dataInfo.timestamps, data);  
			createLegend(dataInfo.min,dataInfo.max);	
			createSliderUI(dataInfo.timestamps);	
			
		})
		.fail(function() { alert("There has been a problem loading the data.")});

	function processData(data) {

		var timestamps = [],	
			min = Infinity,	
			max = -Infinity;

		for (var feature in data.features) {	

			var properties = data.features[feature].properties;	

			for (var attribute in properties) {	

				if ( attribute != 'id' &&	
					 attribute != 'name' &&
					 attribute != 'lat' &&
					 attribute != 'lon' ) 
				{
					if ( $.inArray(attribute,timestamps) ===  -1) {	
						timestamps.push(attribute);	
					}
					if (properties[attribute] < min) {	
						min = properties[attribute];	
					}
					if (properties[attribute] > max) { 
						max = properties[attribute];
					}
				}
			}
		}

		return {	
			timestamps : timestamps,
			min : min,
			max : max
		}
	}  // end processData()
	function createPropSymbols(timestamps, data) {

		cities = L.geoJson(data, {		

			pointToLayer: function(feature, latlng) {	

				return L.circleMarker(latlng, {		
				
				    fillColor: "#708598",	
				    color: '#537898',	
				    weight: 1,	
				    fillOpacity: 0.6  

				});
			}
		}).addTo(map);  

		updatePropSymbols(timestamps[0]);	

	} // end createPropSymbols()
	function updatePropSymbols(timestamp) {

		cities.eachLayer(function(layer) {  
			
			var props = layer.feature.properties,
				radius = calcPropRadius(props[timestamp]),
				popupContent = "<b>" + String(props[timestamp]) + " units</b><br>" +
							   "<i>" + props.name +
							   "</i> in </i>" + timestamp + "</i>";

			layer.setRadius(radius);
			layer.bindPopup(popupContent, { offset: new L.Point(0,-radius) }); 
			layer.on({

				mouseover: function(e) {
					this.openPopup();
					this.setStyle({color: 'yellow'});
				},
				mouseout: function(e) {
					this.closePopup();
					this.setStyle({color: '#537898'});
						
				}
			});  

		});
	} // end updatePropSymbols
	function calcPropRadius(attributeValue) {
			
		var scaleFactor = 16,  // value dependent upon particular data set
			area = attributeValue * scaleFactor; 

		return Math.sqrt(area/Math.PI)*2;  
			
	} // end calcPropRadius
	function createLegend(min, max) {
		 
		if (min < 10) {	
			min = 10; 
		}
		function roundNumber(inNumber) {

       		return (Math.round(inNumber/10) * 10);  
		}

		var legend = L.control( { position: 'bottomright' } );

		legend.onAdd = function(map) {

			var legendContainer = L.DomUtil.create("div", "legend"),  
				symbolsContainer = L.DomUtil.create("div", "symbolsContainer"),
				classes = [roundNumber(min), roundNumber((max-min)/2), roundNumber(max)], 
				legendCircle,  
				diameter,
				diameters = [];  

			L.DomEvent.addListener(legendContainer, 'mousedown', function(e) { L.DomEvent.stopPropagation(e); });  

			$(legendContainer).append("<h2 id='legendTitle'># of somethings</h2>");
			
			for (var i = 0; i < classes.length; i++) {  

				legendCircle = L.DomUtil.create("div", "legendCircle");  
				diameter = calcPropRadius(classes[i])*2; 
				diameters.push(diameter);
				
				var lastdiameter;
				
				if (diameters[i-1]){
					lastdiameter = diameters[i-1];
				} else {
					lastdiameter = 0;
				};
				$(legendCircle).attr("style", "width: "+diameter+"px; height: "+diameter+
					"px; margin-left: -"+((diameter+lastdiameter+2)/2)+"px" );

				
				$(legendCircle).append("<span class='legendValue'>"+classes[i]+"<span>");

			
				$(symbolsContainer).append(legendCircle);	

			};

			$(legendContainer).append(symbolsContainer); 

			return legendContainer; 

		};

		legend.addTo(map);  
	} // end createLegend()
	function createSliderUI(timestamps) {
	
		var sliderControl = L.control({ position: 'bottomleft'} );

		sliderControl.onAdd = function(map) {

			var slider = L.DomUtil.create("input", "range-slider");

			L.DomEvent.addListener(slider, 'mousedown', function(e) { 

				L.DomEvent.stopPropagation(e); 

			});

			$(slider)
				.attr({'type':'range', 'max': timestamps[timestamps.length-1], 'min':timestamps[0], 'step': 1,'value': String(timestamps[0])})
		        .on('input change', function() {
		        	updatePropSymbols($(this).val().toString());
		            $(".temporal-legend").text(this.value);
		        });

			return slider;
		}

		sliderControl.addTo(map);
		createTemporalLegend(timestamps[0]);
	} // end createSliderUI()
	function createTemporalLegend(startTimestamp) {

		var temporalLegend = L.control({ position: 'bottomleft' });  

		temporalLegend.onAdd = function(map) {  

			var output = L.DomUtil.create("output", "temporal-legend");

			return output;  
		}

		temporalLegend.addTo(map);  
		$(".temporal-legend").text(startTimestamp); 
	}	// end createTemporalLegend()
});