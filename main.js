/**
 * EXTRA CREDIT:
 * Water rendering uses multiple advanced techniques like physically-based light rendering
 * If the water looks weird, the waves probably generated poorly,
 * so press 'N' to regenerate them until they look good
 */


let canvas;
let gl;
let defaultShaders;

const baseURL = "https://ZP6400.github.io/Temp/model_files/";
let boat, propeller, mountain1, mountain2, mountain3, mountain4;
let modelList;

let skybox;
let skyboxTextures;


let boatRotation = 0.0;
let currentPropRotation = 0.0;
let isRotating = false;

let diveTimer = 0.0;
let diveSpeed = 0.05;
let diveDepth = 10.0;
let isDiving = false;

let zoomProgress = 0.0;
let zoomSpeed = 0.01;
let isZooming = false;
let cameraIsZoomedIn = false;

let camX;
let camY;
let camZ;
let camYaw;

let boatX = -20.0;
let boatY = -52.0;
let boatZ = 29.0;

let propellerPivot = 2.9;

let startCam = { x: -50.0, y: -40.0, z: 65.0, yaw: -50.0 };
let targetCam = { x: -35.0, y: -45.0, z: 45.0, yaw: -45.0 };
let lightPos = vec3(-10, 100, -500);

let baseProjMat;
let projectionMatrix;
let cameraViewMatrix = mat4();


let lightViewMatrix = mat4();
let lightProjectionMatrix = mat4();

let shadowSize = 8192;
let aspectRatio = 1;
let shadowFramebuffer;
let shadowDepthTexture;

let lightProjFOV = 45;
let lightProjNear = 50;
let lightProjFar = 600;

// mapping the boat texture to the indexes used in the shader
let textureIndexes = new Map([
    [baseURL + 'boat_buffer_diffuse.jpg', 2],
    [baseURL + 'boat_body_diffuse.jpg', 0],
    [baseURL + 'boat_roof_accessory_diffuse.jpg', 1]
]);

function main() {
    //Setting up the canvas and rendering context for WebGL
    canvas = document.getElementById('webgl');
    gl = WebGLUtils.setupWebGL(canvas, undefined);
    
    if (!gl) {

        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    window.addEventListener("keydown", handleKeyPress);

    initShadowBuffer();
    initSkybox();
    initModels();
    initTextureArray();
    initWater();


    aspectRatio = canvas.width/canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    baseProjMat = perspective(60, aspectRatio, 0.1, 2000.00);
    projectionMatrix = baseProjMat;


    camX = startCam.x;
    camY = startCam.y;
    camZ = startCam.z;
    camYaw = startCam.yaw;
    lightProjectionMatrix = perspective(lightProjFOV, 1, lightProjNear, lightProjFar);

    render();
}

let prevTime = 0;
let scene_time = 0;
let renderShadows = true;
function render(timestamp) {
    // update time proportionally so things move at a constant rate regardless of framerate
    let deltaTime = (timestamp - prevTime) / 1000;
    if (Number.isFinite(deltaTime)) {
        scene_time += deltaTime;
    }
    prevTime = timestamp;

    lightViewMatrix = lookAt(lightPos, vec3(50, -52, 29), vec3(0, 1, 0));
    let eye = vec3(camX, camY, camZ);
    let at = vec3(camX + Math.cos(camYaw * Math.PI/180), camY, camZ + Math.sin(camYaw * Math.PI/180));
    cameraViewMatrix = lookAt(eye, at, vec3(0, 1, 0));


    // *********** SHADOW PASS ***************

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer);
    gl.viewport(0, 0, shadowSize, shadowSize);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    // water is not rendered for the shadow pass
    if (renderShadows) drawModels(lightViewMatrix, lightProjectionMatrix, 0,true);


    // *********** DISPLAY PASS ***************

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); 
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowDepthTexture);
    
    drawSkybox();

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowDepthTexture);

    drawModels(cameraViewMatrix, projectionMatrix, deltaTime, false);
    drawWater();

    requestAnimationFrame(render);
}


function handleKeyPress(event) {
    switch(event.key.toLowerCase()) {
        case 'shift':
            isRotating = !isRotating;
            break;

        case ' ':
            //Prevent page from scrolling
            event.preventDefault();
            if (!isDiving) {

                isDiving = true;
                diveTimer = 0.0;
            }
            break;

        case 'c':
            if (!isZooming) {
                isZooming = true;
                zoomProgress = 0.0;
                cameraIsZoomedIn = !cameraIsZoomedIn;
            }
            break;

        case 'n':
            UpdateShaderWaves();
            break;

        case 'l':
            if (lightMult > 0) {
                lightMult = 0;
            } else {
                lightMult = 1;
            }
            break;

        case 's':
            renderShadows = !renderShadows;
            break;

        case 'w':
            useWireframe = !useWireframe;
            break;
    }
}