#version 300 es

in vec4 vPosition;
in vec2 vTexCoord;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec2 fTexCoord;



void main() {

    vec4 worldPos = modelMatrix * vPosition;

    fTexCoord = vTexCoord;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}