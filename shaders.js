let program;
let skygram;

let pointLightProperties = {
    specular: vec4(1.0, 1.0, 0.9, 1.0),
    diffuse: vec4(1.0, 1.0, 0.95, 1.0)
}

let spotlightProperties = {
    specular: vec4(0.8, 0.8, 1.0, 1.0),
    diffuse: vec4(0.6, 0.6, 1.0, 1.0)
}

let ambientLight = vec4(0.67, 0.67, 0.67, 1.0);

let spotlightBasePosition = vec4(-3, 9, 0, 1);
let spotlightBaseDirectionVector = normalize(vec4(-1, 0, 0, 0));
let spotlightPosition;
let spotlightDirectionVector;

let lightMult = 1.0;

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

    let lightScale = scalem(lightMult, lightMult, lightMult);
    updateVec4Uniform("pointlightDiffuse", mult(lightScale, pointLightProperties.diffuse));
    updateVec4Uniform("pointlightSpecular", mult(lightScale, pointLightProperties.specular));
    updateVec4Uniform("lightAmbient", ambientLight);
    
    updateVec3Uniform("lightPosition", lightPos);

    updateVec4Uniform("spotlightDiffuse", spotlightProperties.diffuse);
    updateVec4Uniform("spotlightSpecular", spotlightProperties.specular);

    updateVec3Uniform("spotlightPosition", spotlightPosition);
    updateVec3Uniform("spotlightAngle", spotlightDirectionVector);

    updateMat4Uniform("lightViewMatrix", lightViewMatrix);
    updateMat4Uniform("lightProjectionMatrix", lightProjectionMatrix);
    updateIntUniform("shadowMap", 1);
    updateIntUniform("texture0", 11);
    updateIntUniform("texture1", 12);
    updateIntUniform("texture2", 13);
}