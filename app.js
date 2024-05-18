/** @format */

// Initialize the map
let map = new maplibregl.Map({
    container: "map",
    style: "https://api.maptiler.com/maps/streets/style.json?key=" + mapTilerKey,
    center: [-74.5, 40],
    zoom: 9,
});

// Create a new Worker
let worker = new Worker("particleWorker.js");

// Define the start and end coordinates
let start = [-74.0059, 40.7128];
let end = [-73.9865, 40.7306];

// Send the start and end coordinates to the Worker
worker.postMessage({ start, end });

// Add a source and layer for the particles
map.on("load", function () {
    map.addSource("particles", {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features: [],
        },
    });

    map.addLayer({
        id: "particles",
        type: "circle",
        source: "particles",
        paint: {
            "circle-radius": ["get", "size"],
            "circle-color": ["get", "color"],
        },
    });

    // Listen for messages from the Worker
    worker.onmessage = function (event) {
        // Get the particles from the event data
        let particles = event.data;

        // Create a new source with the particles
        map.getSource("particles").setData({
            type: "FeatureCollection",
            features: particles.map((particle) => {
                return {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [particle.longitude, particle.latitude],
                    },
                    properties: {
                        size: particle.size,
                        color: particle.color,
                    },
                };
            }),
        });
    };
});
