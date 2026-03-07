let water_program;
const wave_count = 42;
const baseFrequency = 0.1, baseAmplitude = 1.3, basePhase = 1, phaseModifier = 1.04, gain = 1.18, lacunarity = 0.82;
let water;

let useWireframe = false;
class Wave {
    directionX;
    directionY;
    frequency;
    amplitude;
    phase;
    phase_mod;
}
let curr_waves = [];
let wave_texture;
let water_height = -52;
let cubemap;
function init_water() {
    water_program = initShadersFromFiles(gl, "shaders/water-vertex.glsl", "shaders/water-fragment-brdf.glsl");
    gl.useProgram(water_program);
    program = water_program;
    let verts = plane(vec3(-200, -200), vec3(500, 500),7);
    water = {
        vBuffer: initBuffer(verts),
        vCount: verts.length,
    }

    bindAttBuffer(water.vBuffer, "vPosition", 4);
    UpdateShaderWaves();

}


let prevTime = 0;
let scene_time = 0;
function draw_water(timestamp) {

    gl.useProgram(water_program);
    program = water_program;

    let deltaTime = (timestamp - prevTime) / 1000;
    if (Number.isFinite(deltaTime)) {
        scene_time += deltaTime;
    }
    prevTime = timestamp;

    bindAttBuffer(water.vBuffer, "vPosition", 4);
    updateMat4Uniform("projectionMatrix", projectionMatrix);
    updateMat4Uniform("cameraViewMatrix", cameraViewMatrix);
    updateMat4Uniform("transformMatrix", translate(0, water_height, 0));

    updateMat4Uniform("lightViewMatrix", lightViewMatrix);
    updateMat4Uniform("lightProjectionMatrix", lightProjectionMatrix);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowDepthTexture); 
    updateIntUniform("shadowMap", 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, wave_texture);
    updateIntUniform("waveTexture", 2);

    updateIntUniform("skybox", 3);

    updateVec4Uniform("lightPosition", vec4(lightPos[0], lightPos[1], lightPos[2], 1.0));
    updateVec3Uniform("spotlight_position", vec3(spotlightPosition));
    updateVec3Uniform("spotlight_angle", vec3(spotlightAngle));
    updateVec4Uniform("cameraPos", vec4(camX, water_height, camZ, 1.0));
    updateFloatUniform("time", scene_time);
    updateUintUniform("wave_count", wave_count);
    updateVec3Uniform("light_color", vec3(pointLightProperties.specular[0], pointLightProperties.specular[1], pointLightProperties.specular[2]));
    updateVec3Uniform("spotlight_color", vec3(spotlightProperties.specular[0], spotlightProperties.specular[1], spotlightProperties.specular[2]));

    let render_mode = useWireframe ? gl.LINE_LOOP : gl.TRIANGLES;

    for (let i = 0; i < water.vCount; i += 3)
        gl.drawArrays(render_mode, i, 3);
}

let images = [];
function configureCubeMap() {
    cubemap = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[0]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[1]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[2]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[3]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[4]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[5]);
}

function GenerateSineWaves() {
    curr_waves = [];
    let seed = 0.0;
    let seedMod = Math.random() * 2 * Math.PI;
    let frequency = baseFrequency;
    let amplitude = baseAmplitude;
    let phase = basePhase;
    let phaseMod = phaseModifier;
    for (let i = 0; i < wave_count; i++) {
        let wave = new Wave();
        wave.directionX = Math.sin(seed);
        wave.directionY = Math.cos(seed);
        wave.amplitude = amplitude;
        wave.frequency = frequency;
        wave.phase = phase;
        wave.phase_mod = phaseMod;
        curr_waves.push(wave);

        seed += seedMod; //
        frequency *= gain;
        phase = Math.random() * 10;
        phaseMod *= phaseModifier;
        amplitude *= lacunarity;
    }

}


function UpdateShaderWaves() {
    GenerateSineWaves();
    const floatsPerPixel = 3;
    const texHeight = 2;
    let floatArray = new Float32Array(floatsPerPixel * texHeight * wave_count);
    for (let i = 0; i < wave_count; i++) {
        let upperPixelBase = i * floatsPerPixel;
        floatArray[upperPixelBase] = curr_waves[i].directionX;
        floatArray[upperPixelBase + 1] = curr_waves[i].directionY;
        floatArray[upperPixelBase + 2] = curr_waves[i].phase_mod;
        let lowerPixelBase = (wave_count + i) * floatsPerPixel;
        floatArray[lowerPixelBase] = curr_waves[i].amplitude;
        floatArray[lowerPixelBase + 1] = curr_waves[i].frequency;
        floatArray[lowerPixelBase + 2] = curr_waves[i].phase;
    }

    gl.activeTexture(gl.TEXTURE2);
    wave_texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, wave_texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, wave_count, 2, 0, gl.RGB, gl.FLOAT, floatArray);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.useProgram(water_program);
    gl.uniform1i(gl.getUniformLocation(water_program, "waveTexture"), 2);

}