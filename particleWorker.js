/** @format */

// particleWorker.js
self.onmessage = function (event) {
    // Get the start and end coordinates from the event data
    let start = event.data.start;
    let end = event.data.end;

    // Calculate the distance between the start and end coordinates
    let dx = end[0] - start[0];
    let dy = end[1] - start[1];
    let distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate the number of particles based on the distance
    let numParticles = Math.round(distance * 10); // Adjust this to get the desired density of particles

    // Initialize an array to hold the particles
    let particles = [];

    // Create the particles
    for (let i = 0; i < numParticles; i++) {
        // Calculate the position of the particle
        let t = i / (numParticles - 1);
        let longitude = start[0] + t * dx;
        let latitude = start[1] + t * dy;

        // Calculate the size and color of the particle based on its index
        let size = 1 + 4 * (i / numParticles); // Adjust this to get the desired size variation
        let color = `rgb(${Math.round(255 * t)}, ${Math.round(255 * (1 - t))}, 0)`; // Adjust this to get the desired color variation

        // Add the particle to the array
        particles.push({ longitude, latitude, size, color });
    }

    // Send the particles back to the main thread
    self.postMessage(particles);
};
