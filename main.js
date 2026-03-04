let canvas;
let gl;
let program;

let boat, propeller, mountain1, mountain2, mountain3, mountain4;
let modelList;

let skybox;
let skyboxSize = 50.0;

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

let camX = -57.0;
let camY = -31.0;
let camZ = 73.0;
let camYaw = -50.0;

let zoomCamX = -35.0
let zoomCamY = -45.0
let zoomCamZ = 45.0
let zoomCamYaw = -45.0

let boatX = -20.0;
let boatY = -52.0;
let boatZ = 29.0;

let propellerPivot = 2.9;

let startCam = { x: -57.0, y: -31.0, z: 73.0, yaw: -50.0 };
let targetCam = { x: -35.0, y: -45.0, z: 45.0, yaw: -45.0 };


function main() {

    //SETTING THINGS UP
    //Setting up the canvas and rendering context for WebGL
    canvas = document.getElementById('webgl');
    gl = WebGLUtils.setupWebGL(canvas, undefined);
    
    if (!gl) {

        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    let baseURL = "https://ZP6400.github.io/Temp/";

    //INITIALIZING SKYBOX
    skyboxTextures = [

        loadTexture(baseURL + "sky.jpg"),
        loadTexture(baseURL + "sky.jpg"),
        loadTexture(baseURL + "sky.jpg"),
        loadTexture(baseURL + "water.jpg"),
        loadTexture(baseURL + "sky.jpg"),
        loadTexture(baseURL + "sky.jpg")
    ];
    initSkybox();

    //INITIALIZING MODELS
    //Get the boat
    boat = new Model(
        baseURL + "12219_boat_v2_L2.obj", 
        baseURL + "12219_boat_v2_L2.mtl");

    //Get the propeller
    propeller = new Model(
        baseURL + "15530_Corsair_F4U_Propeller_v1.obj",
        baseURL + "New Bitmap Image.mtl");

    //Get mountain 1
    mountain1 = new Model(
        baseURL + "part.obj", 
        baseURL + "part.mtl");

    //Get mountain 2
    mountain2 = new Model(
        baseURL + "part.obj", 
        baseURL + "part.mtl");

   //Get mountain 3
    mountain3 = new Model(
        baseURL + "part.obj", 
        baseURL + "part.mtl");

    //Get mountain 4
    mountain4 = new Model(
        baseURL + "part.obj", 
        baseURL + "part.mtl");

    modelList = [
        { name: "boat", data: boat, baseMatrix: mult(rotateX(270.0), scalem(0.01, 0.01, 0.01)) },
        { name: "propeller", data: propeller, baseMatrix: mult(mult(translate(10, 3, -3), rotateZ(90)), scalem(1, 1, 1)) },
        { name: "mtn1", data: mountain1, baseMatrix: mult(translate(-18.0, -50.00, -36.00), scalem(1.5, 1.5, 1.5)) },
        { name: "mtn2", data: mountain2, baseMatrix: mult(translate(12.00, -50.00, -28.00), scalem(1.5, 1.5, 1.5)) },
        { name: "mtn3", data: mountain3, baseMatrix: mult(translate(44.00, -50.00, -18.00), scalem(1.5, 1.5, 1.5)) },
        { name: "mtn4", data: mountain4, baseMatrix: mult(translate(44.00, -50.00, 11.00), scalem(1.5, 1.5, 1.5)) }
    ];

    //ESTABLISHING ONKEYDOWN EVENTS
    window.onkeydown = function(event) {

        let step = 1.0; 
        let angleStep = 2.0;
    
        switch(event.key.toLowerCase()) {

            //Control x, y, and z camera movement
            case 'w': camZ -= step; break;
            case 's': camZ += step; break;
            case 'a': camX -= step; break;
            case 'd': camX += step; break;
            case 'q': event.preventDefault(); camY += step; break;
            case 'e': camY -= step; break;

            //Pivot the camera left and right
            case 'z': camYaw -= angleStep; break;
            case 'c': camYaw += angleStep; break;

            //Control x, y and x boat movement
            case 'u': boatZ -= step; break;
            case 'j': boatZ += step; break;
            case 'y': boatX -= step; break;
            case 'h': boatX += step; break;
            case 't': boatY += step; break;
            case 'g': boatY -= step; break;

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
                camX = -57.0; camY = -31.0; camZ = 73.0; camYaw = -50.0;
                boatX = -20.0; boatY = -52.0; boatZ = 29.0;
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
        }
    };

    render();
}


function loadTexture(url) {

    let texture = gl.createTexture();
    const image = new Image();
    image.crossOrigin = "anonymous"; 

    image.onload = function() {

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    };

    image.src = url;
    return texture;
}


function initSkybox() {

    let size = skyboxSize;
    let vertices = [

        //Front face
        vec4(-size, -size,  size, 1.0), vec4( size, -size,  size, 1.0), vec4( size,  size,  size, 1.0),
        vec4(-size, -size,  size, 1.0), vec4( size,  size,  size, 1.0), vec4(-size,  size,  size, 1.0),

        //Back face
        vec4(-size, -size, -size, 1.0), vec4(-size,  size, -size, 1.0), vec4( size,  size, -size, 1.0),
        vec4(-size, -size, -size, 1.0), vec4( size,  size, -size, 1.0), vec4( size, -size, -size, 1.0),

        //Top face
        vec4(-size,  size, -size, 1.0), vec4(-size,  size,  size, 1.0), vec4( size,  size,  size, 1.0),
        vec4(-size,  size, -size, 1.0), vec4( size,  size,  size, 1.0), vec4( size,  size, -size, 1.0),

        //Bottom face
        vec4(-size, -size, -size, 1.0), vec4( size, -size, -size, 1.0), vec4( size, -size,  size, 1.0),
        vec4(-size, -size, -size, 1.0), vec4( size, -size,  size, 1.0), vec4(-size, -size,  size, 1.0),

        //Right face
        vec4( size, -size, -size, 1.0), vec4( size,  size, -size, 1.0), vec4( size,  size,  size, 1.0),
        vec4( size, -size, -size, 1.0), vec4( size,  size,  size, 1.0), vec4( size, -size,  size, 1.0),

        //Left face
        vec4(-size, -size, -size, 1.0), vec4(-size, -size,  size, 1.0), vec4(-size,  size,  size, 1.0),
        vec4(-size, -size, -size, 1.0), vec4(-size,  size,  size, 1.0), vec4(-size,  size, -size, 1.0)
    ];

    let texCoords = [];
    for(let i = 0; i < 6; i++) {

        texCoords.push(vec2(0, 0), vec2(1, 0), vec2(1, 1), vec2(0, 0), vec2(1, 1), vec2(0, 1));
    }

    skybox = {

        vertices: vertices,
        texCoords: texCoords,
        numVertices: 36
    };

    skybox.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skybox.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(skybox.vertices), gl.STATIC_DRAW);

    skybox.tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skybox.tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(skybox.texCoords), gl.STATIC_DRAW);
}


function render() {

    //Make sure every model has been loaded in and is ready
    let allReady = modelList.every(model => model.data.objParsed && model.data.mtlParsed);
    
    if (!allReady) {

        console.log("waiting");
        requestAnimationFrame(render);
        return;
    }

    console.log("DONE");

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

    let projectionMatrix = perspective(45, 1, 0.1, 300.00);
    let viewMatrix = lookAt(eye, at, up);

    let useTexture = gl.getUniformLocation(program, "useTexture");
    
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "viewMatrix"), false, flatten(viewMatrix));

    //DRAWING THE SKYBOX
    gl.uniform1i(useTexture, true);
    let skyboxMatrix = mat4();
    drawSkybox(skyboxMatrix);

    //Getting ready to draw models
    gl.uniform1i(useTexture, false);

    //HANDLING ANIMATIONS
    if (isRotating) {

        currentPropRotation += 10.0;
        boatRotation += 0.5;
    }

    let currentDiveY = 0;

    if (isDiving) {

        diveTimer += diveSpeed;
        currentDiveY = -Math.sin(diveTimer) * diveDepth;

        if (diveTimer >= Math.PI) {

            isDiving = false;
            currentDiveY = 0;
        }
    }

    if (isZooming) {

        zoomProgress += zoomSpeed;
        if (zoomProgress > 1.0) {
            
            zoomProgress = 1.0;
        }

        let from, to;

        if (cameraIsZoomedIn) {
            from = startCam;
            to = targetCam;
        } 
        else {

            from = targetCam;
            to = startCam;
        }

        camX = from.x + (to.x - from.x) * zoomProgress;
        camY = from.y + (to.y - from.y) * zoomProgress;
        camZ = from.z + (to.z - from.z) * zoomProgress;
        camYaw = from.yaw + (to.yaw - from.yaw) * zoomProgress;

        if (zoomProgress >= 1.0) {

            isZooming = false;
        }
    }

    //Current boat position depends on diving animation
    let totalBoatY = boatY + currentDiveY;

    //HANDLING MODEL TRANSFORMATIONS
    modelList.forEach(modelObj => {

        let model = modelObj.data;
        
        //Ensure both OBJ and MTL are parsed before continuing
        if (model.objParsed && model.mtlParsed) {
            
            if (!model.buffersInitialized) {

                initBuffers(model);
            }

            let modelMatrix = mat4();

            if (modelObj.name === "propeller") {

                let boatWorldMatrix = translate(boatX, totalBoatY, boatZ);
                modelMatrix = mult(boatWorldMatrix, rotateY(boatRotation));

                modelMatrix = mult(modelMatrix, modelObj.baseMatrix);

                modelMatrix = mult(modelMatrix, translate(0, 0, propellerPivot));
                modelMatrix = mult(modelMatrix, rotateY(currentPropRotation));
                modelMatrix = mult(modelMatrix, translate(0, 0, -propellerPivot));

                drawModel(model, modelMatrix);
                return;
            }
            else if (modelObj.name === "boat") {

                modelMatrix = translate(boatX, totalBoatY, boatZ);

                modelMatrix = mult(modelMatrix, modelObj.baseMatrix);

                modelMatrix = mult(modelMatrix, rotateZ(boatRotation));
            }
            else {

                modelMatrix = modelObj.baseMatrix;
            }

            drawModel(model, modelMatrix);
        }
    });

    let lightPos = vec3(0, 20, 0);
    gl.uniform3fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPos));

    requestAnimationFrame(render);
}


function drawSkybox(matrix) {

    gl.useProgram(program);
    
    let u_ModelMatrix = gl.getUniformLocation(program, "modelMatrix");
    gl.uniformMatrix4fv(u_ModelMatrix, false, flatten(matrix));

    gl.bindBuffer(gl.ARRAY_BUFFER, skybox.vBuffer);
    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, skybox.tBuffer);
    let vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    gl.depthMask(false);

    for (let i = 0; i < 6; i++) {

        //Skipping the water texture
        if (i == 3) continue;
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, skyboxTextures[i]);
        gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
        gl.drawArrays(gl.TRIANGLES, i * 6, 6);
    }

    //Water acts like a solid barrier so that the boat can disappear underneath it
    gl.depthMask(true);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, skyboxTextures[3]);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    gl.drawArrays(gl.TRIANGLES, 3 * 6, 6);
}


function initBuffers(model) {

    let vertices = [];
    let normals = [];
    let texCoords = [];

    model.faces.forEach(face => {

        face.faceVertices.forEach(v => vertices.push(v));
        face.faceNormals.forEach(n => normals.push(n));
        face.faceTexCoords.forEach(t => texCoords.push(t));
    });

    model.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    if (normals.length > 0) {

        model.nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, model.nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    }

    model.numVertices = vertices.length; 
    model.buffersInitialized = true;
}


function drawModel(model, modelMatrix) {

    let u_ModelMatrix = gl.getUniformLocation(program, "modelMatrix");
    gl.uniformMatrix4fv(u_ModelMatrix, false, flatten(modelMatrix));

    gl.bindBuffer(gl.ARRAY_BUFFER, model.vBuffer);
    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    if (model.nBuffer) {

        gl.bindBuffer(gl.ARRAY_BUFFER, model.nBuffer);
        let vNormal = gl.getAttribLocation(program, "vNormal");
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);
    }

    let vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    if (vTexCoord !== -1) {

        gl.disableVertexAttribArray(vTexCoord); 
    }

    gl.drawArrays(gl.TRIANGLES, 0, model.numVertices);
}