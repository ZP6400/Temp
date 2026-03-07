/**
 * EXTRA CREDIT:
 * Water rendering uses multiple advanced techniques like physically-based light rendering
 * If the water looks weird, the waves probably generated poorly,
 * so press 'N' to regenerate them until they look good
 */


let canvas;
let gl;
let defaultShaders;

let baseURL = "https://ZP6400.github.io/Temp/model_files/";
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

let projectionMatrix;
let cameraViewMatrix = mat4();

let lightViewMatrix = mat4();
let lightProjectionMatrix = mat4();

let shadowSize = 1024;
let shadowFramebuffer;
let shadowDepthTexture;

function main() {

    //SETTING THINGS UP
    //Setting up the canvas and rendering context for WebGL
    canvas = document.getElementById('webgl');
    gl = WebGLUtils.setupWebGL(canvas, undefined);
    
    if (!gl) {

        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    initShadowBuffer();
    initSkybox();
    initModels();
    init_water();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    projectionMatrix = perspective(60, canvas.width/canvas.height, 0.1, 2000.00);

    //ESTABLISHING ONKEYDOWN EVENTS
    window.addEventListener("keydown", handleKeyPress);
    camX = startCam.x;
    camY = startCam.y;
    camZ = startCam.z;
    camYaw = startCam.yaw;
    render();
}


function render(timestamp) {

    let eye = vec3(camX, camY, camZ);
    let at = vec3(camX + Math.cos(camYaw * Math.PI/180), camY, camZ + Math.sin(camYaw * Math.PI/180));
    cameraViewMatrix = lookAt(eye, at, vec3(0, 1, 0));

    lightViewMatrix = lookAt(lightPos, vec3(boatX, boatY, boatZ), vec3(0, 1, 0));
    lightProjectionMatrix = perspective(45, 1.0, 1.0, 2000.0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer);
    gl.viewport(0, 0, shadowSize, shadowSize);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    drawModels(lightViewMatrix, lightProjectionMatrix, true); 

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); 
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowDepthTexture);
    
    drawSkybox();

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowDepthTexture);
    use_phong(); 
    drawModels(cameraViewMatrix, projectionMatrix, false);

    program = water_program; 
    draw_water(timestamp);

    requestAnimationFrame(render);
}


function handleKeyPress(event) {

    let step = 1.0;

    switch(event.key.toLowerCase()) {

        //Control x, y and x boat movement
        case 'w':
            boatZ -= step;
            break;
        case 'a':
            boatZ += step;
            break;
        case 's':
            boatX -= step;
            break;
        case 'd':
            boatX += step;
            break;
        case 'q':
            boatY += step;
            break;
        case 'e':
            boatY -= step;
            break;


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

        case 'i':
            lightPos[1] += 5.0;
            break;
        case 'k':
            lightPos[1] -= 5.0;
            break;
        case 'l':
            lightPos[0] += 5.0;
            break;
        case 'j':
            lightPos[0] -= 5.0;
            break;
        case 'o':
            lightPos[2] += 5.0;
        case 'p':
            lightPos[2] -= 5.0;
    }
}