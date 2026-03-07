#version 300 es

precision mediump float;

in vec2 fTexCoord;

uniform sampler2D tex;

out vec4 fragColor;

void main() {
    fragColor = texture(tex, fTexCoord);
}
