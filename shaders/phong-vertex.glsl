#version 300 es

in vec4 vPosition, vNormal;
in vec2 vTexCoord;

uniform mat4 cameraViewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;

uniform mat4 lightViewMatrix;
uniform mat4 lightProjectionMatrix;

out vec3 light_vector, normal, vertex;
out vec3 spotlight_vector, spotlightDirection;
out vec2 fTexCoord;

out vec4 fPositionShadow;

uniform vec3 spotlightAngle;
uniform vec3 lightPosition;
uniform vec3 spotlightPosition;

void main() {

    fPositionShadow = lightProjectionMatrix * lightViewMatrix * transformMatrix * vPosition;

    vec4 nm = vPosition;
    vec3 pos = (cameraViewMatrix * transformMatrix * nm).xyz;
    light_vector = normalize((cameraViewMatrix * vec4(lightPosition, 1.0)).xyz - pos);

    spotlight_vector = normalize((cameraViewMatrix * vec4(spotlightPosition, 1.0)).xyz - pos);
    spotlightDirection = normalize((cameraViewMatrix * vec4(spotlightAngle, 0.0)).xyz);

    normal = normalize(cameraViewMatrix * transformMatrix * vNormal).xyz;

    vertex = normalize(-pos);
    fTexCoord = vTexCoord;
    
    gl_Position = projectionMatrix * cameraViewMatrix * transformMatrix * vPosition;
}