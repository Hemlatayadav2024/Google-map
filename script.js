
mapboxgl.accessToken = 'pk.eyJ1Ijoic2hpZmEzMyIsImEiOiJjbTFjMDJzMmoyNWRvMnZzOGZzcXo3cHQ1In0.CLdUXxSpEVQV7OR2dhz6qw';

// Initialize the map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [78.9629, 20.5937], // Initial position centered in India
  zoom: 5
});

let currentCoordinates = null; // Store current coordinates

// Function to get directions
function getDirections() {
  const startLocation = document.getElementById('start-location').value;
  const endLocation = document.getElementById('end-location').value;
  const transportMode = document.getElementById('transport-mode').value;

  if (!startLocation || !endLocation) {
    alert("Please enter both start and end locations.");
    return;
  }

  const geocodeUrl = location => 
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxgl.accessToken}`;

  Promise.all([fetch(geocodeUrl(startLocation)), fetch(geocodeUrl(endLocation))])
    .then(responses => Promise.all(responses.map(response => response.json())))
    .then(data => {
      const startCoordinates = data[0].features[0].geometry.coordinates;
      const endCoordinates = data[1].features[0].geometry.coordinates;

      currentCoordinates = endCoordinates; // Set current coordinates

      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/${transportMode}/${startCoordinates.join(',')};${endCoordinates.join(',')}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

      fetch(directionsUrl)
        .then(response => response.json())
        .then(data => {
          const route = data.routes[0].geometry.coordinates;
          const distance = data.routes[0].distance / 1000;

          const geojson = {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: route }
          };

          if (map.getSource('route')) {
            map.getSource('route').setData(geojson);
          } else {
            map.addLayer({
              id: 'route',
              type: 'line',
              source: { type: 'geojson', data: geojson },
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#3887be', 'line-width': 5 }
            });
          }

          document.getElementById('distance').textContent = `Distance: ${distance.toFixed(2)} km`;

          map.flyTo({ center: endCoordinates, zoom: 12 });
        })
        .catch(error => console.error('Error fetching directions:', error));
    })
    .catch(error => console.error('Error fetching coordinates:', error));
}

// Function to search nearby places
function searchNearby(placeType) {
  if (!currentCoordinates) {
    alert("Please get directions first.");
    return;
  }

  const nearbyPlacesUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${placeType}.json?proximity=${currentCoordinates[0]},${currentCoordinates[1]}&access_token=${mapboxgl.accessToken}`;

  fetch(nearbyPlacesUrl)
    .then(response => response.json())
    .then(data => {
      const nearbyResults = data.features.map(feature => feature.place_name).slice(0, 5);
      document.getElementById('nearby-results').innerHTML = `<strong>Nearby ${placeType}s:</strong><br>` + nearbyResults.join('<br>');
    })
    .catch(error => console.error(`Error fetching nearby ${placeType}s:`, error));
}
