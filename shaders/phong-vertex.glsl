#version 300 es

in vec4 vPosition, vNormal;
in vec2 vTexCoord;
uniform mat4 cameraViewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
out vec3 light_vector, normal, vertex;
out vec3 spotlight_vector;
out vec2 fTexCoord;
uniform vec3 lightPosition;
uniform vec3 spotlightPosition;

void main() {
    // POINT LIGHT --------
    //Calculate L
    vec4 nm = vPosition;
    vec3 pos = (cameraViewMatrix * transformMatrix * nm).xyz;
    light_vector = normalize((cameraViewMatrix * vec4(lightPosition, 1.0)).xyz - pos);

    // SPOT LIGHT --------
    spotlight_vector = normalize((cameraViewMatrix * vec4(spotlightPosition, 1.0)).xyz - pos);

    //Calculate N
    //Here, we need to convert the normal direction (not the position)
    normal = normalize(cameraViewMatrix * transformMatrix * vNormal).xyz;

    //Specular
    //V = origin - pos = -pos
    vertex = normalize(-pos);
    fTexCoord = vTexCoord;
    gl_Position = projectionMatrix * cameraViewMatrix * transformMatrix * vPosition;
}