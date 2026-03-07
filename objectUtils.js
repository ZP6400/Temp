
let skyboxSize = 500.0;
function initSkybox() {
    skygram = initShadersFromFiles(gl, "shaders/skybox-vertex.glsl", "shaders/skybox-fragment.glsl");
    gl.useProgram(skygram);
    program = skygram

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
    //INITIALIZING SKYBOX
    skyboxTextures = [

        loadTexture(baseURL + "sky.jpg"),
        loadTexture(baseURL + "sky.jpg"),
        loadTexture(baseURL + "sky.jpg"),
        loadTexture(baseURL + "sky.jpg"),
        loadTexture(baseURL + "sky.jpg"),
        loadTexture(baseURL + "sky.jpg")
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


    skybox.vBuffer = initBuffer();
    skybox.tBuffer = initBuffer();
    updateAttBuffer(skybox.vBuffer, skybox.vertices);
    updateAttBuffer(skybox.tBuffer, skybox.texCoords);
}

function drawSkybox() {

    gl.useProgram(skygram);
    program = skygram
    updateMat4Uniform("modelMatrix", mat4());
    updateMat4Uniform("projectionMatrix", projectionMatrix);
    updateMat4Uniform("viewMatrix", cameraViewMatrix);

    bindAttBuffer(skybox.vBuffer, "vPosition", 4);
    bindAttBuffer(skybox.tBuffer, "vTexCoord", 2);

    for (let i = 0; i < 6; i++) {

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, skyboxTextures[i]);
        gl.uniform1i(gl.getUniformLocation(program, "tex"), 0);
        gl.drawArrays(gl.TRIANGLES, i * 6, 6);
    }
}

let boat_water_offset = 0;
function drawModels() {

    use_phong();
    //Getting ready to draw models
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
    } else {
        boat_water_offset = -3;
        for (let w_ind in curr_waves) {
            let w = curr_waves[w_ind];
            let phase_time = (w.phase + scene_time) * w.phase_mod;
            let pointMag = Math.exp(
                Math.sin(dot(vec2(w.directionX, w.directionY), vec2(boatX, boatZ)) * w.frequency + phase_time) - 1.0);
            boat_water_offset += w.amplitude * pointMag;
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

    //Current boat position depends on diving animation and water height
    let totalBoatY = boatY + currentDiveY + boat_water_offset;

    let boatWorldMatrix = mult(translate(boatX, totalBoatY, boatZ), rotateY(boatRotation));
    spotlightPosition = mult(boatWorldMatrix, vec4(-50, 3, 3, 1));
    spotlightAngle = mult(rotateY(boatRotation), vec4(1, 0, 0, 0));
    //HANDLING MODEL TRANSFORMATIONS
    modelList.forEach(modelObj => {

        let model = modelObj.data;

        //Ensure both OBJ and MTL are parsed before continuing
        if (model.objParsed && model.mtlParsed) {
            let specularColor = vec4(1.0, 1.0, 1.0, 1.0);
            let diffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
            if (!model.buffersInitialized) {

                initBuffers(model);
            }

            let modelMatrix = mat4();

            if (modelObj.name === "propeller") {




                modelMatrix = modelObj.baseMatrix;
                modelMatrix = mult(modelMatrix, translate(0, 0, propellerPivot));
                modelMatrix = mult(modelMatrix, rotateY(currentPropRotation));
                modelMatrix = mult(modelMatrix, translate(0, 0, -propellerPivot));

                modelMatrix = mult(boatWorldMatrix, modelMatrix);
                diffuseColor = vec4(0.3, 0.8, 0.5, 1.0);
                //specularColor = vec4(0.3, 0.8, 0.5, 1.0);
                drawModel(model, modelMatrix, specularColor, diffuseColor);
                return;
            } else if (modelObj.name === "boat") {
                diffuseColor = vec4(0.8, 0.8, 1.0, 1.0);
                modelMatrix = boatWorldMatrix;
                modelMatrix = mult(modelMatrix, modelObj.baseMatrix);
            } else {
                diffuseColor = vec4(0.4, 0.2, 0.1, 1.0);
                modelMatrix = modelObj.baseMatrix;
            }

            drawModel(model, modelMatrix, specularColor, diffuseColor);
        }
    });

    updateVec3Uniform("lightPosition", lightPos);
}

function initBuffers(model) {

    let vertices = new Map();
    let normals = new Map();
    let texCoords = new Map();

    model.faces.forEach(face => {
        if (!vertices.has(face.material)) {
            vertices.set(face.material, []);
            normals.set(face.material, []);
            texCoords.set(face.material, []);
        }
        face.faceVertices.forEach(v => vertices.get(face.material).push(v));
        face.faceNormals.forEach(n => normals.get(face.material).push(n));
        face.faceTexCoords.forEach(t => texCoords.get(face.material).push(t));
    });

    normals.forEach((list, k) => {
        if (list.length === 0) { // generate flat normals if the model doesn't have any normals specified
            let fakeNormals = generateFlatNormals(vertices.get(k));
            normals.set(k, fakeNormals);
        }
    })

    model.vBuffer = initBuffer();
    model.nBuffer = initBuffer();
    model.tBuffer = initBuffer();

    model.materialVerts = vertices;
    model.materialNormals = normals;
    model.materialTexCoords = texCoords;

    console.log(model.materialVerts)
    console.log(model.materialNormals)
    console.log(model.materialTexCoords)

    if (model.textured) {
        model.texture = loadBoatTexture(model.imagePath);
    }

    model.buffersInitialized = true;
}

function generateFlatNormals(vertices) {
    let normals = [];
    for (let i = 0; i < vertices.length; i += 3) {
        let first = vertices[i];
        let second = vertices[i+1];
        let third = vertices[i+2];
        let normal = vec4(0, 0, 0, 0);
        // calculate face normals via Newell method
        normal[0] = (first[1] - second[1]) * (first[2] + second[2]) +
            (second[1] - third[1]) * (second[2] + third[2]) +
            (third[1] - first[1]) * (third[2] + first[2]);

        normal[1] = (first[2] - second[2]) * (first[0] + second[0]) +
            (second[2] - third[2]) * (second[0] + third[0]) +
            (third[2] - first[2]) * (third[0] + first[0]);

        normal[2] += (first[0] - second[0]) * (first[1] + second[1]) +
            (second[0] - third[0]) * (second[1] + third[1]) +
            (third[0] - first[0]) * (third[1] + first[1]);
        // push once for each vertex
        normals.push(normal, normal, normal);
    }

    return normals;
}

function drawModel(model, modelMatrix, specularColor, diffuseColor) {
    updateMat4Uniform("transformMatrix", modelMatrix);
    bindAttBuffer(model.vBuffer, "vPosition", 4);
    bindAttBuffer(model.nBuffer, "vNormal", 4);
    // if (model.textured) {
    //     bindAttBuffer(model.tBuffer, "vTexCoord", 2);
    // }
    // group render calls by material to reduce API calls
    for (let [mat_name, verts] of model.materialVerts) {
        updateAttBuffer(model.vBuffer, verts);
        updateAttBuffer(model.nBuffer, model.materialNormals.get(mat_name));
        // if (model.textured) {
        //     updateAttBuffer(model.tBuffer, model.materialTexCoords.get(mat_name));
        //     gl.activeTexture(gl.TEXTURE5);
        //     gl.bindTexture(gl.TEXTURE_2D, model.texture);
        //     gl.uniform1i(gl.getUniformLocation(program, "modelTexture"), 5);
        // } else {
        //     gl.activeTexture(gl.TEXTURE5);
        //     gl.bindTexture(gl.TEXTURE_2D, null);
        // }

        updateFloatUniform("shininess", 20.0);
        if (mat_name) {
            specularColor = model.specularMap.get(mat_name);
            diffuseColor = model.diffuseMap.get(mat_name);
        }
        updateVec4Uniform("materialSpecular", specularColor);
        updateVec4Uniform("materialDiffuse", diffuseColor);
        updateVec4Uniform("materialAmbient", vec4(0.1, 0.1, 0.1, 1));
        gl.drawArrays(gl.TRIANGLES, 0, verts.length);
    }

}

function loadBoatTexture(url) {

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

function loadTexture(url) {

    let texture = gl.createTexture();
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = function() {

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        images.push(image);
        if (images.length === 6) {
            configureCubeMap();
        }
    };

    image.src = url;
    return texture;
}