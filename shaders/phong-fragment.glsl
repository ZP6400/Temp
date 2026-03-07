#version 300 es
precision mediump float;

in vec3 light_vector;
in vec3 normal;
in vec3 vertex; 
in vec2 fTexCoord;
in vec4 fPositionShadow;

uniform vec4 lightDiffuse, lightSpecular, lightAmbient;
uniform vec4 materialDiffuse, materialSpecular, materialAmbient;
uniform float shininess;
uniform sampler2D shadowMap;

out vec4 fragColor;

float calculateShadow() {

    vec3 shadowCoord = (fPositionShadow.xyz / fPositionShadow.w) * 0.5 + 0.5;
    float closestDepth = texture(shadowMap, shadowCoord.xy).r;
    float currentDepth = shadowCoord.z;
    
    float bias = 0.0001; 
    return currentDepth - bias > closestDepth ? 0.5 : 1.0; 
}

void main() {

    float shadow = calculateShadow();

    vec3 N = normalize(normal);
    vec3 L = normalize(light_vector);
    vec3 V = normalize(vertex); // This is your 'view' vector

    vec4 ambient = lightAmbient * materialAmbient;

    float kd = max(dot(L, N), 0.0);
    vec4 diffuse = kd * (lightDiffuse * materialDiffuse);

    vec3 R = reflect(-L, N);
    float ks = pow(max(dot(R, V), 0.0), shininess);
    vec4 specular = ks * (lightSpecular * materialSpecular);

    fragColor = vec4((ambient + (diffuse + specular) * shadow).rgb, 1.0);
    fragColor.a = 1.0;
}