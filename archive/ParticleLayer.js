
class ParticleLayer {
    constructor(gl) {
        this.id = 'particle-layer';
        this.type = 'custom';

        // Initialize the particles
        this.particles = [];
        for (let i = 0; i < 1000; i++) {
            this.particles.push({
                x: Math.random() * 2 - 1, // Random position between -1 and 1
                y: Math.random() * 2 - 1, // Random position between -1 and 1
                vx: Math.random() * 0.02 - 0.01, // Random velocity between -0.01 and 0.01
                vy: Math.random() * 0.02 - 0.01, // Random velocity between -0.01 and 0.01
            });
        }

        // Create a buffer for the particle data
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.particles.length * 4 * 4, gl.DYNAMIC_DRAW); // 4 floats per particle

        // Create a Web Worker to handle the physics simulation
        this.worker = new Worker('worker.js');

        // Send the initial particle data to the worker
        this.worker.postMessage(this.particles);

        // Listen for messages from the worker
        this.worker.onmessage = (event) => {
            // Update the particle data with the new positions and velocities
            this.particles = event.data;
        };
    }

    onAdd(map, gl) {
        this.map = map;

        // Create a WebGL context
        this.gl = gl;

        // Create a vertex shader
        const vertexSource = `
            attribute vec2 a_position;
            attribute vec2 a_velocity;

            void main() {
                // Calculate the position of the particle
                // ...

                gl_Position = vec4(a_position, 0.0, 1.0);
                gl_PointSize = 1.0;
            }
        `;
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);

        // Create a fragment shader
        const fragmentSource = `
            precision mediump float;

            void main() {
                // Calculate the color of the particle
                // ...

                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            }
        `;
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);

        // Create a program and link the shaders
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        // Create a buffer for the particle data
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.particles.length * 4 * 4, gl.DYNAMIC_DRAW); // 4 floats per particle

        // Get the location of the attributes and uniforms
        this.a_position = gl.getAttribLocation(this.program, 'a_position');
        this.a_velocity = gl.getAttribLocation(this.program, 'a_velocity');
    }

    update(deltaTime) {
        const particleData = new Float32Array(this.particles.length * 4);
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];

            // Update the particle's position based on its velocity
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;

            // If the particle has moved off the edge of the map, wrap it around to the other side
            if (particle.x < -1 || particle.x > 1 || particle.y < -1 || particle.y > 1) {
                particle.x = Math.random() * 2 - 1;
                particle.y = Math.random() * 2 - 1;
            }

            // Update the particle data
            particleData[i * 4] = particle.x;
            particleData[i * 4 + 1] = particle.y;
            particleData[i * 4 + 2] = particle.vx;
            particleData[i * 4 + 3] = particle.vy;
        }

        // Update the buffer with the new particle data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, particleData);
    }

    render(gl, matrix) {
        // Use high performance timer
        const now = performance.now();
        const deltaTime = (now - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = now;

        // Update the particle positions
        this.update(deltaTime);

        // Use the WebGL program
        gl.useProgram(this.program);

        // Bind the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

        // Enable the position attribute
        gl.enableVertexAttribArray(this.a_position);
        gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

        // Enable the velocity attribute
        gl.enableVertexAttribArray(this.a_velocity);
        gl.vertexAttribPointer(this.a_velocity, 2, gl.FLOAT, false, 0, 0);

        // Draw the particles
        gl.drawArrays(gl.POINTS, 0, this.particles.length);

        // Use requestAnimationFrame for the next frame
        requestAnimationFrame(() => this.render(gl, matrix));
    }
}
