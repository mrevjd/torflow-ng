/** @format */

let particles = [];
let source, destination;

function createParticles(count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            position: [...source],
            velocity: [(destination[0] - source[0]) / 100, (destination[1] - source[1]) / 100],
        });
    }
}

self.onmessage = (event) => {
    const { source: newSource, destination: newDestination, command } = event.data;

    if (newSource && newDestination) {
        source = newSource;
        destination = newDestination;
        createParticles(1000);
    }

    if (command === "update") {
        particles = particles.filter((particle) => {
            particle.position[0] += particle.velocity[0];
            particle.position[1] += particle.velocity[1];

            // Check if the particle has reached the destination
            const dx = particle.position[0] - destination[0];
            const dy = particle.position[1] - destination[1];
            const distanceToDestination = Math.sqrt(dx * dx + dy * dy);

            if (distanceToDestination < 0.01) {
                // Particle has reached the destination, remove it
                return false;
            }

            return true;
        });

        self.postMessage({ particles });
    }
};
