/** @format */

// Initialize the map
const map = new maplibregl.Map({
    container: "map",
    style: "https://api.maptiler.com/maps/streets/style.json?key=" + mapTilerKey,
    center: [-74.5, 40],
    zoom: 9,
});

// Define the source and destination points
const source = [-74.0059, 40.7128]; // New York, NY
const destination = [-73.9865, 40.7306]; // Brooklyn, NY

// Create a web worker for particle simulation
const particleWorker = new Worker("./helpers/particle-worker.js");

// Listen for messages from the worker
particleWorker.onmessage = (event) => {
    const { particles } = event.data;

    // Render the particles on the map
    renderParticles(particles, map);
};

// Send initial data to the worker
particleWorker.postMessage({ source, destination });

// Update the particle simulation on each animation frame
function animate() {
    requestAnimationFrame(animate);
    particleWorker.postMessage({ command: "update" });
}

animate();

// WebGL particle rendering code
const canvas = document.createElement("canvas");
canvas.style.position = "absolute";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.pointerEvents = "none"; // Allow mouse events to pass through the canvas
const gl = canvas.getContext("webgl");

const vertexShaderSource = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position * 2.0 - 1.0, 0, 1);
    gl_PointSize = 8.0;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform vec4 u_color;
  uniform float u_intensity;

  void main() {
    gl_FragColor = u_color * u_intensity;
  }
`;

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const colorUniformLocation = gl.getUniformLocation(program, "u_color");
const intensityUniformLocation = gl.getUniformLocation(program, "u_intensity");

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
}

function renderParticles(particles, map) {
    canvas.width = map.getCanvas().clientWidth;
    canvas.height = map.getCanvas().clientHeight;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    const positions = new Float32Array(particles.length * 2);
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const particlePosition = particle.position;
        const lng = particlePosition[0];
        const lat = particlePosition[1];
        const pixelCoords = map.project([lng, lat]);
        positions[i * 2] = pixelCoords.x / canvas.width;
        positions[i * 2 + 1] = pixelCoords.y / canvas.height;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttributeLocation);

    const particleCount = particles.length;
    const maxParticles = 1000;
    const intensity = Math.min(1, particleCount / maxParticles);
    const color = [1, intensity, 0, 1];

    gl.uniform4fv(colorUniformLocation, color);
    gl.uniform1f(intensityUniformLocation, intensity);

    gl.drawArrays(gl.POINTS, 0, particles.length);

    // Add the canvas as an overlay
    const mapContainer = map.getContainer();
    mapContainer.appendChild(canvas);
}

// Wait for the map to load before rendering particles
map.once("load", () => {
    renderParticles([], map); // Initial render with empty particles
});
