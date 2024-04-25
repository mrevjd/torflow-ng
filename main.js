/** @format */

// Initialize the map
const map = new maplibregl.Map({
    container: "map",
    style: "https://api.maptiler.com/maps/streets/style.json?key=" + mapTilerkey,
    center: [-74.5, 40],
    zoom: 9,
});

// Define the source and destination points
const source = [-74.0059, 40.7128]; // New York, NY
const destination = [-73.9865, 40.7306]; // Brooklyn, NY

// Create a web worker for particle simulation
const particleWorker = new Worker("helpers/particle-worker.js");

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
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const gl = canvas.getContext("webgl");

const vertexShaderSource = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;

  void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 clipSpace = zeroToOne * 2.0 - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    gl_PointSize = 4.0;
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

const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
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
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    const positions = new Float32Array(particles.length * 2);
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const [lng, lat] = particle.position;
        const [x, y] = map.project([lng, lat]);
        positions[i * 2] = x;
        positions[i * 2 + 1] = y;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttributeLocation);

    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

    const particleCount = particles.length;
    const maxParticles = 1000;
    const intensity = Math.min(1, particleCount / maxParticles);
    const color = [1, intensity, 0, 1];

    gl.uniform4fv(colorUniformLocation, color);
    gl.uniform1f(intensityUniformLocation, intensity);

    gl.drawArrays(gl.POINTS, 0, particles.length);

    const overlay = new maplibregl.Marker({
        element: canvas,
    }).setLngLat(map.getCenter());

    overlay.addTo(map);
}
