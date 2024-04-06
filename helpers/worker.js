self.onmessage = function(event) {
    const particles = event.data;

    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];

        // Update the particle's position based on its velocity
        particle.x += particle.vx;
        particle.y += particle.vy;

        // If the particle has reached one of the edges, reverse its velocity
        if (particle.x > 1 || particle.x < -1) {
            particle.vx = -particle.vx;
        }
        if (particle.y > 1 || particle.y < -1) {
            particle.vy = -particle.vy;
        }
    }

    // Send the updated particle data back to the main thread
    self.postMessage(particles);
};
