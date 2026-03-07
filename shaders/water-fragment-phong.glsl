#version 300 es

uniform sampler2D shadowMap;
in vec4 fPositionShadow;

precision highp float;
// shared uniforms
uniform float time;
uniform sampler2D waveTexture;
uniform highp uint wave_count;
uniform mat4 cameraViewMatrix;
uniform mat4 transformMatrix;

precision mediump float;
uniform vec3 light_color;

// these are all parameters affecting the water's appearance
const vec3 water_color = vec3(0.0, 0.086, 0.204);

in vec3 vertex;
in vec3 light_vector;
out vec4 fragColor;


#define REFLECTANCE 0.0201

struct Wave {
    vec2 direction;
    highp float amplitude;
    highp float frequency;
    highp float phase;
};



float expsine(vec2 uv, Wave w, out float x) {
    float phase_time = w.phase*time;
    x = dot(w.direction, uv)*w.frequency+phase_time;
    return exp(sin(x)-1.0);
}

vec2 d_expsine(vec2 uv, Wave w, float x) {
    vec2 d_sin = w.direction * w.frequency * cos(x) * exp(sin(x)-1.0);
    return d_sin;
}

Wave get_wave(uint index, sampler2D waves){
    vec3 p0 = texelFetch(waves, ivec2(index, 0), 0).xyz;
    vec3 p1 = texelFetch(waves, ivec2(index, 1), 0).xyz;
    return Wave(
    vec2(p0.r, p0.g),
    p1.r,
    p1.g,
    p1.b);
}


void main() {
    float dist = length(vertex.xyz);
    vec2 derivatives = vec2(0.0);
    float displacement = 0.0;
    vec2 prev_derivs = vec2(0.0);
    vec2 uv = (inverse(cameraViewMatrix) * vec4(vertex, 1.0)).xz;
    vec4 color = vec4(0);
    vec3 view = -normalize(vertex);

    for (uint i = 0u; i < wave_count; i++) {
        Wave w = get_wave(i, waveTexture);
        float x = 0.0;
        displacement += w.amplitude * expsine(uv,w, x);
        prev_derivs = w.amplitude * d_expsine(uv, w, x);
        uv += -prev_derivs * w.direction * w.amplitude * 1.17;

        derivatives += prev_derivs;
    }
    vec3 albedo = water_color.rgb;

    vec3 model_normal = vec3(-derivatives.x, 1.0, -derivatives.y);
    model_normal *= mix(0.015, 1.0, exp(-dist * 0.0175));

    vec4 L = vec4(light_vector, 1.0);
    vec4 wColor = vec4(water_color, 1.0);
    vec4 lColor = vec4(light_color, 1.0);


    vec4 normal = vec4(normalize(cameraViewMatrix * vec4(model_normal, 0.0)).xyz, 1.0);

    //Diffuse
    //Id = Ld kd dot(l • n)
    vec4 diffuse = lColor * wColor * dot(L, normal);

    //Specular
    //r = (2 (l · n ) n) - l
    vec4 R = 2.0 * (dot(L, normal) * normal) - L;

    //Is = Ls Ks dot(V, R)^a
    vec4 specular = lColor * wColor * pow(max(dot(vec4(vertex, 1.0), R), 0.0), 20.0);

    vec4 ambient = vec4(water_color * 0.2, 1.0);

    vec3 shadowCoord = (fPositionShadow.xyz / fPositionShadow.w) * 0.5 + 0.5;
    float closestDepth = texture(shadowMap, shadowCoord.xy).r;
    float currentDepth = shadowCoord.z;

    float bias = 0.005;  
    float shadow = (currentDepth - bias > closestDepth) ? 0.3 : 1.0;

    // We explicitly define the ambient and albedo here to match your vars
    vec3 finalAlbedo = water_color.rgb;
    vec4 ambientTerm = vec4(finalAlbedo * 0.2, 1.0);

    vec4 finalColor = ambientTerm + (diffuse + specular) * shadow;
    
    fragColor = vec4(finalColor.rgb, 1.0);
}