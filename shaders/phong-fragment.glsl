#version 300 es

precision mediump float;

uniform vec4 lightDiffuse, lightSpecular, lightAmbient;
uniform vec4 spotlightDiffuse, spotlightSpecular, spotlightAmbient;
uniform vec4 materialDiffuse, materialSpecular, materialAmbient;
uniform float shininess;
in vec3 vertex, light_vector, normal;
in vec3 spotlight_vector;
uniform vec3 spotlightAngle;
in vec2 fTexCoord;
uniform sampler2D modelTexture;
out vec4 fragColor;
void main()
{
    vec4 fColor = vec4(0.0);
    // first, handle the point light
    //Diffuse
    //Id = Ld kd dot(l • n)
    vec4 diffuse = lightDiffuse * materialDiffuse * dot(light_vector, normal);

    //Specular
    //r = (2 (l · n ) n) - l
    vec3 R = 2.0 * (dot(light_vector, normal) * normal) - light_vector;

    //Is = Ls Ks dot(V, R)^a
    vec4 specular = lightSpecular * materialSpecular * pow(max(dot(vertex, R), 0.0), shininess);

    //Ambient
    //Ia = Laka
    vec4 ambient = lightAmbient * materialAmbient;

    fColor += diffuse + specular + ambient;

    // next, handle the spotlight
//
//    if(dot(spotlight_vector, -spotlightAngle) > 0.97)
//    {
        R = (2.0 * dot(spotlight_vector, normal) * normal) - spotlight_vector;
        diffuse = spotlightDiffuse * materialDiffuse * dot(spotlight_vector, normal);
        specular = spotlightSpecular * materialSpecular * pow(max(dot(vertex, R), 0.0), shininess);
//    }


    //Ambient
    //lightAmbient * material ambient coeff
    ambient = spotlightAmbient * materialAmbient;

    fColor += diffuse + specular + ambient;
    fColor *= texture(modelTexture, fTexCoord);
    fColor.a = 1.0;
    fragColor = fColor;

}