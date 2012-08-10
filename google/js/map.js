var map, popup;

function initialize() {

  map = new google.maps.Map(document.getElementById("map"), {
    center: new google.maps.LatLng(-41.2, 173),
    zoom: 6,
    mapTypeId: google.maps.MapTypeId.TERRAIN,
    panControl: false,
    scaleControl: true,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.SMALL,
      position: google.maps.ControlPosition.TOP_RIGHT
    },
    scaleControlOptions: {
      position: google.maps.ControlPosition.RIGHT_BOTTOM
    }         
  });

  popup = new google.maps.InfoWindow();

  gft.query('SELECT * FROM 1FRjC2jcNiW45bhExMOj12zPjKPxv4nDnaSrqM9M', addMarkers);
}

function addMarkers(data) {

  for (var i = 0; i < data.table.rows.length; i++) {
    var place = data.table.rows[i];
    
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(place[2], place[3]),
        map: map,
        icon: 'icons/' +  place[6] + '.png',
        title: place[0],
    });

    google.maps.event.addListener(marker, 'click', (function(marker, i) {
      return function() {
      	var content = data.table.rows[i];
      	if (content[1]) {
      	  var html = '<h2>' + content[0] + '</h2>' + content[1];
      	  if (content[4]) { 
      	  	html += '<br/><br/>' + content[4] + ' - ' + content[5];
      	  } 
	      popup.setContent(html);
	      popup.open(map, marker);
        }
      }
    })(marker, i));   
    
  }

}




