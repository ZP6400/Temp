#version 300 es

in vec4 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec3 fPosition;
out vec3 fNormal;
out vec2 fTexCoord;



void main() {

    vec4 worldPos = modelMatrix * vPosition;
    fPosition = worldPos.xyz;

    fNormal = normalize(mat3(modelMatrix) * vNormal);

    fTexCoord = vTexCoord;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}