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

			console.log(data); 

		})
		.fail(function() { alert("There has been a problem loading the data.")});

});