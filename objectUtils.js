let skyboxSize = 500;

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

        loadSkyboxTexture(baseURL + "sky.jpg"),
        loadSkyboxTexture(baseURL + "sky.jpg"),
        loadSkyboxTexture(baseURL + "sky.jpg"),
        loadSkyboxTexture(baseURL + "sky.jpg"),
        loadSkyboxTexture(baseURL + "sky.jpg"),
        loadSkyboxTexture(baseURL + "sky.jpg")
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
    let oldProgram = program;
    program = skygram;

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

    program = oldProgram;
}

let boat_water_offset = 0;
function drawModels(vMatrix, pMatrix, deltaTime, isShadowPass) {



    let currentDiveY = 0;

    if (!isShadowPass) {
        
        if (isRotating) {

        currentPropRotation += 300.0 * deltaTime;
        boatRotation += 30.0 * deltaTime;
        }


        if (isDiving) {

            diveTimer += diveSpeed * 30 * deltaTime;
            currentDiveY = -Math.sin(diveTimer) * diveDepth;

            if (diveTimer >= Math.PI) {

                isDiving = false;
                currentDiveY = 0;
            }
        } 
        else {
            // if the boat isn't diving, it should be affected by the water height

            // cheating a little by setting the boat to sit below the waves a little instead of
            // actually implementing buoyancy
            boat_water_offset = -3;

            // calculate the wave height at the boats origin and offset the boat by that much (minus 3)
            for (let w_ind in curr_waves) { // w_ind stands for wave index btw
                let w = curr_waves[w_ind];
                let phase_time = (w.phase + scene_time) * w.phase_mod;
                let pointMag = Math.exp(
                    Math.sin(dot(vec2(w.directionX, w.directionY), vec2(boatX, boatZ)) * w.frequency + phase_time) - 1.0);
                boat_water_offset += w.amplitude * pointMag;
            }
        }

        if (isZooming) {

            zoomProgress += zoomSpeed * 30 * deltaTime;
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
    } else {
        if (isDiving) {
            currentDiveY = -Math.sin(diveTimer) * diveDepth;
            if (diveTimer >= Math.PI) {
                currentDiveY = 0;
            }
        }
    }

    //Current boat position depends on diving animation and water height
    let totalBoatY = boatY + currentDiveY + boat_water_offset;

    let boatWorldMatrix = mult(translate(boatX, totalBoatY, boatZ), rotateY(boatRotation));
    spotlightPosition = vec3(mult(boatWorldMatrix, spotlightBasePosition));
    spotlightDirectionVector = vec3(mult(rotateY(boatRotation), spotlightBaseDirectionVector));
    use_phong();


    updateMat4Uniform("cameraViewMatrix", vMatrix);
    updateMat4Uniform("projectionMatrix", pMatrix);
    //HANDLING MODEL TRANSFORMATIONS
    modelList.forEach(modelObj => {

        let model = modelObj.data;

        //Ensure both OBJ and MTL are parsed before continuing
        if (model.objParsed && model.mtlParsed) {
            let specularColor = vec4(1.0, 1.0, 1.0, 1.0);
            let diffuseColor;
            if (!model.buffersInitialized) {

                initBuffers(model);
            }

            let modelMatrix;

            if (modelObj.name === "propeller") {




                modelMatrix = modelObj.baseMatrix;
                modelMatrix = mult(modelMatrix, translate(0, 0, propellerPivot));
                modelMatrix = mult(modelMatrix, rotateY(currentPropRotation));
                modelMatrix = mult(modelMatrix, translate(0, 0, -propellerPivot));

                modelMatrix = mult(boatWorldMatrix, modelMatrix);
                diffuseColor = vec4(0.3, 0.8, 0.5, 1.0);
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

// initialize the attribute buffers for a model
// to preserve performance while properly supporting materials, faces are sorted by the material they use
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

    model.materialVerts = vertices;
    model.materialNormals = normals;
    model.materialTexCoords = texCoords;

    let allVerts = [];
    let allNorms = [];
    let allTexCoords = [];
    model.materialCounts = []; 

    for (let [mat_name, verts] of model.materialVerts) {
        let norms = model.materialNormals.get(mat_name);
        
        if (!norms || norms.length === 0) {
            norms = generateFlatNormals(verts); // generate flat normals if the model doesn't have normals provided
        }
        let diffuseTexIndex = -1;
        let ambientTexIndex = -1;

        if (model.diffuseTextured.get(mat_name)) {
            let texturePath = model.diffuseTexturePaths.get(mat_name);
            diffuseTexIndex = textureIndexes.get(texturePath);
        }
        if (model.ambientTextured.get(mat_name)) {
            let texturePath = model.ambientTexturePaths.get(mat_name);
            ambientTexIndex = textureIndexes.get(texturePath);
        }

        model.materialCounts.push({
            name: mat_name,
            start: allVerts.length,
            count: verts.length,
            dTexIndex: diffuseTexIndex,
            aTexIndex: ambientTexIndex
        });

        let texs = model.materialTexCoords.get(mat_name);
        if (texs && texs.length !== 0) {
            allTexCoords = allTexCoords.concat(texs);
        }
        allVerts = allVerts.concat(verts);
        allNorms = allNorms.concat(norms);
    }

    model.vBuffer = initBuffer();
    model.nBuffer = initBuffer();
    model.tBuffer = null;
    updateAttBuffer(model.vBuffer, allVerts);
    updateAttBuffer(model.nBuffer, allNorms);
    if (allTexCoords.length > 0) { // if texture coordinates are provided, initialize the buffer
        model.tBuffer = initBuffer();
        updateAttBuffer(model.tBuffer, allTexCoords);
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
    if (model.tBuffer != null) {
        bindAttBuffer(model.tBuffer, "vTexCoord", 2);
    } else {
        gl.disableVertexAttribArray(gl.getAttribLocation(defaultShaders, "vTexCoord"));
    }

    // render all vertices for each material in one batch
    for (let part of model.materialCounts) {
        let shininess = 20.0;
        if (part.name) {
            specularColor = model.specularMap.get(part.name);
            diffuseColor = model.diffuseMap.get(part.name);
            shininess = model.shininessMap.get(part.name);
        }
        updateFloatUniform("shininess", shininess);
        updateVec4Uniform("materialSpecular", specularColor);
        updateVec4Uniform("materialDiffuse", diffuseColor);
        updateIntUniform("diffuseTextureIndex", part.dTexIndex);
        updateIntUniform("ambientTextureIndex", part.dTexIndex);

        gl.drawArrays(gl.TRIANGLES, part.start, part.count);
    }
}

// loads a texture for use in the material texture "array"
// originally planned to use a texture2DArray but had too many issues getting it working
function loadArrayTexture(url, texUnit) {

    let texture = gl.createTexture();
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = function() {
        gl.activeTexture(texUnit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

    };

    image.src = url;
    return texture;
}

function loadSkyboxTexture(url) {

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


function initShadowBuffer() {

    shadowFramebuffer = gl.createFramebuffer();
    shadowDepthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, shadowDepthTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, shadowSize, shadowSize, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shadowDepthTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function initTextureArray() {
    for (let [path, index] of textureIndexes) {
        let texUnit;
        switch (index) {
            case 0:
                texUnit = gl.TEXTURE11;
                break;
            case 1:
                texUnit = gl.TEXTURE12;
                break;
            case 2:
                texUnit = gl.TEXTURE13;
                break;
        }
        loadArrayTexture(path, texUnit);
    }
}

