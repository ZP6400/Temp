#version 300 es

precision mediump float;

in vec3 fPosition;
in vec3 fNormal;
in vec2 fTexCoord;

uniform vec3 lightPosition;
uniform sampler2D tex;
uniform bool useTexture;

out vec4 fragColor;

void main() {
    if (useTexture) {
        fragColor = texture(tex, fTexCoord);
    } else {
        //Ambient lighting
        float ambient = 0.3;

        //Diffuse lighting
        vec3 L = normalize(lightPosition - fPosition);
        vec3 N = normalize(fNormal);
        float diffuse = max(dot(L, N), 0.0);

        float totalLight = ambient + diffuse;
        fragColor = vec4(vec3(0.1, 0.2, 0.4) * totalLight, 1.0);
    }
}
