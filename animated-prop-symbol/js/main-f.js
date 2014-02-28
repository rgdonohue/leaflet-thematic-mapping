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
});