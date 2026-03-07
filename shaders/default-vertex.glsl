#version 300 es

in vec4 vPosition;
in vec3 vNormal;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec3 fPosition;
out vec3 fNormal;



void main() {

    vec4 worldPos = modelMatrix * vPosition;
    fPosition = worldPos.xyz;

    fNormal = normalize(mat3(modelMatrix) * vNormal);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}