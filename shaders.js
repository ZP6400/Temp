let program;
let skygram;

let pointLightProperties = {
    specular: vec4(1.0, 1.0, 0.9, 1.0),
    diffuse: vec4(1.0, 1.0, 0.95, 1.0),
    ambient: vec4(1.0, 1.0, 0.99, 1.0)
    // specular: vec4(0.0, 0.0, 0.0, 1.0),
    // diffuse: vec4(0.0, 0.0, 0.0, 1.0),
    // ambient: vec4(0.0, 0.0, 0.0, 1.0),
}

let spotlightProperties = {
    // specular: vec4(0.9, 0.9, 1.0, 1.0),
    // diffuse: vec4(0.85, 0.85, 1.0, 1.0),
    // ambient: vec4(0, 0, 0, 1.0)
    specular: vec4(0.0, 0.0, 0.0, 1.0),
    diffuse: vec4(0.0, 0.0, 0.0, 1.0),
    ambient: vec4(0.0, 0.0, 0.0, 1.0),
}

let spotlightPosition = vec4(0, 0, 0, 1);
let spotlightAngle = vec4(0);

let mountain_scale = 10;
let mountain_height = -52;
function initModels(){
    defaultShaders = initShadersFromFiles(gl, "shaders/phong-vertex.glsl", "shaders/phong-fragment.glsl");
    gl.useProgram(defaultShaders);
    program = defaultShaders;
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

    let mountainScaleMatrix = scalem(mountain_scale, mountain_scale, mountain_scale);
    modelList = [
        { name: "boat", data: boat, baseMatrix: mult(rotateX(270.0), scalem(0.015, 0.015, 0.015)) },
        { name: "propeller", data: propeller, baseMatrix: mult(mult(translate(13.5, 3, -3), rotateZ(90)), scalem(1, 1, 1)) },
        { name: "mtn1", data: mountain1, baseMatrix: mult(translate(-80.0, mountain_height, -300.00), mountainScaleMatrix) },
        { name: "mtn2", data: mountain2, baseMatrix: mult(translate(40.00, mountain_height, -258.00), mountainScaleMatrix) },
        { name: "mtn3", data: mountain3, baseMatrix: mult(translate(170.00, mountain_height, -158.00), mountainScaleMatrix) },
        { name: "mtn4", data: mountain4, baseMatrix: mult(translate(400.00, mountain_height, -50.00), mountainScaleMatrix) }
    ];
}



function use_phong() {
    gl.useProgram(defaultShaders);
    program = defaultShaders;

    updateVec4Uniform("lightDiffuse", pointLightProperties.diffuse);
    updateVec4Uniform("lightSpecular", pointLightProperties.specular);
    updateVec4Uniform("lightAmbient", pointLightProperties.ambient);
    updateVec4Uniform("spotlightDiffuse", spotlightProperties.diffuse);
    updateVec4Uniform("spotlightSpecular", spotlightProperties.specular);
    updateVec4Uniform("spotlightAmbient", spotlightProperties.ambient);
    updateVec3Uniform("spotlight_position", vec3(spotlightPosition));
    updateVec3Uniform("spotlight_angle", vec3(spotlightAngle));

    updateMat4Uniform("projectionMatrix", projectionMatrix);
    updateMat4Uniform("cameraViewMatrix", cameraViewMatrix);
}

