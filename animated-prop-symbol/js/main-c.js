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
			console.log(dataInfo); 

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
});