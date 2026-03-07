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
let cameraViewMatrix;

function main() {

    //SETTING THINGS UP
    //Setting up the canvas and rendering context for WebGL
    canvas = document.getElementById('webgl');
    gl = WebGLUtils.setupWebGL(canvas, undefined);
    
    if (!gl) {

        console.log('Failed to get the rendering context for WebGL');
        return;
    }


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



    //CLEARING CANVAS AND INITIALIZING NEEDED VARIABLES
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let radians = camYaw * Math.PI / 180.0;
    let eye = vec3(camX, camY, camZ);

    let atX = camX + Math.cos(radians);
    let atZ = camZ + Math.sin(radians);

    //Makes it so camera is basically looking straight ahead
    let at = vec3(atX, camY, atZ);

    let up = vec3(0, 1, 0);
    cameraViewMatrix = lookAt(eye, at, up);


    //DRAWING THE SKYBOX
    drawSkybox();
    drawModels();
    draw_water(timestamp);

    requestAnimationFrame(render);
}
function handleKeyPress(event) {
    let step = 1.0;
    let angleStep = 2.0;

    switch(event.key.toLowerCase()) {

        //Control x, y, and z camera movement
        case 'w':
            camZ -= step;
            break;
        case 's':
            camZ += step;
            break;
        case 'a':
            camX -= step;
            break;
        case 'd':
            camX += step;
            break;
        case 'q':
            event.preventDefault();
            camY += step;
            break;
        case 'e':
            camY -= step;
            break;

        //Pivot the camera left and right
        case 'z':
            camYaw -= angleStep;
            break;
        case 'c':
            camYaw += angleStep;
            break;

        //Control x, y and x boat movement
        case 'u':
            boatZ -= step;
            break;
        case 'j':
            boatZ += step;
            break;
        case 'y':
            boatX -= step;
            break;
        case 'h':
            boatX += step;
            break;
        case 't':
            boatY += step;
            break;
        case 'g':
            boatY -= step;
            break;

        case 'p':

            let radians = camYaw * Math.PI / 180.0;
            let atX = camX + Math.cos(radians);
            let atZ = camZ + Math.sin(radians);
            console.log("Eye: (" + camX.toFixed(2) + ", " + camY.toFixed(2) + ", " + camZ.toFixed(2) + ")");
            console.log("Looking At: (" + atX.toFixed(2) + ", " + camY.toFixed(2) + ", " + atZ.toFixed(2) + ")");
            console.log("Boat: (" + boatX.toFixed(2) + ", " + boatY.toFixed(2) + ", " + boatZ.toFixed(2) + ")");
            break;

        case 'r':

            //Reset camera and boat to how they were before
            camX = startCam.x;
            camY = startCam.y;
            camZ = startCam.z;
            camYaw = startCam.yaw;
            boatX = -20.0;
            boatY = -52.0;
            boatZ = 29.0;
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

        case 'f':
            if (!isZooming) {

                isZooming = true;
                zoomProgress = 0.0;
                cameraIsZoomedIn = !cameraIsZoomedIn;
            }
            break;
        case 'n':
            UpdateShaderWaves();
            break;
    }
}

