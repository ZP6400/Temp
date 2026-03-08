#version 300 es
precision mediump float;

in vec3 light_vector;
in vec3 spotlight_vector, spotlightDirection;

in vec3 normal;
in vec3 vertex; 
in vec2 fTexCoord;
in vec4 fPositionShadow;

uniform vec4 lightAmbient;
uniform vec4 pointlightDiffuse, pointlightSpecular;
uniform vec4 spotlightDiffuse, spotlightSpecular;

uniform vec4 materialDiffuse, materialSpecular;
uniform float shininess;
uniform sampler2D shadowMap;
uniform sampler2D texture0;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform int diffuseTextureIndex;
uniform int ambientTextureIndex;

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

    vec4 matDiffuse = materialDiffuse;
    vec4 matAmbient = materialDiffuse;
    if (diffuseTextureIndex != -1) {
        if (diffuseTextureIndex == 0){
            matDiffuse *= texture(texture0, fTexCoord);
        } else if (diffuseTextureIndex == 1){
            matDiffuse *= texture(texture1, fTexCoord);
        } else if (diffuseTextureIndex == 2){
            matDiffuse *= texture(texture2, fTexCoord);
        }
    }
    if (ambientTextureIndex != -1) {
        if (ambientTextureIndex == 0){
            matAmbient *= texture(texture0, fTexCoord);
        } else if (ambientTextureIndex == 1){
            matAmbient *= texture(texture1, fTexCoord);
        } else if (ambientTextureIndex == 2){
            matAmbient *= texture(texture2, fTexCoord);
        }
    }

    vec4 ambient = lightAmbient * matAmbient;



    float kd = max(dot(L, N), 0.0);
    vec4 diffuse = kd * (pointlightDiffuse * matDiffuse)* shadow;

    vec3 R = reflect(-L, N);
    float ks = pow(max(dot(R, V), 0.0), shininess);
    vec4 specular = ks * (pointlightSpecular * materialSpecular) * shadow;

    if(dot(spotlight_vector, -spotlightDirection) > 0.97)
    {
        float kd = max(dot(L, N), 0.0);
        diffuse += kd * (spotlightDiffuse * matDiffuse);

        vec3 R = reflect(-L, N);
        float ks = pow(max(dot(R, V), 0.0), shininess);
        specular += ks * (spotlightSpecular * materialSpecular);
    }

    fragColor = vec4((specular + diffuse + ambient).rgb, 1.0);
}