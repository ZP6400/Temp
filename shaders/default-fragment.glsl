#version 300 es

precision mediump float;

in vec3 fPosition;
in vec3 fNormal;

uniform vec3 lightPosition;

out vec4 fragColor;

void main() {
        //Ambient lighting
    float ambient = 0.3;

    //Diffuse lighting
    vec3 L = normalize(lightPosition - fPosition);
    vec3 N = normalize(fNormal);
    float diffuse = max(dot(L, N), 0.0);

    float totalLight = ambient + diffuse;
    fragColor = vec4(vec3(0.4, 0.2, 0.1) * totalLight, 1.0);

}
