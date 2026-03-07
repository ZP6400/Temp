#version 300 es

precision highp float;
// shared uniforms
uniform float time;
uniform sampler2D waveTexture;
uniform highp uint wave_count;
uniform mat4 cameraViewMatrix;
uniform mat4 transformMatrix;
uniform samplerCube skybox;

precision mediump float;
uniform vec3 light_color;
uniform vec3 spotlight_color;

// these are all parameters affecting the water's appearance
const vec4 water_color = vec4(0.0, 0.086, 0.204, 1.0);
const vec4 water_scatter_color = vec4(0.0,1.052,0.212,1.0);
const vec4 air_bubble_color = vec4(0.157,0.063,0.827,1.0);
const float height_scale = 10.5; // affects subsurface scattering intensity from the height of the wave
const float k2 = 2.25; // affects subsurface scattering intensity from how close the water is to the camera
const float k3 = 0.35; // idk I wrote this code like 7 months ago and chose some bad names
const float k4 = 20.15; // ditto
const float air_bubble_density = 3.4; // the density of air bubbles within the water

in vec3 vertex;
in vec3 light_vector;
in vec3 spotlight_vector;
uniform vec3 spotlightAngle;
out vec4 fragColor;


#define REFLECTANCE 0.0201

struct Wave {
    vec2 direction;
    highp float amplitude;
    highp float frequency;
    highp float phase;
    highp float phaseMod;
};



float expsine(vec2 uv, Wave w, out float x) {
    float phase_time = (w.phase + time) * w.phaseMod;
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
    p1.b,
    p0.b);
}



float dotclamped(vec3 a, vec3 b){
    return max(dot(a, b),2e-5);
}

// Source: https://github.com/godotengine/godot/blob/7b56111c297f24304eb911fe75082d8cdc3d4141/drivers/gles3/shaders/scene.glsl#L995
float ggx_distribution(in vec3 normal, in vec3 halfway, in float alpha) {
    float cos_theta = dot(normal, halfway);
    float a_sq = alpha*alpha;
    float d = 1.0 + (a_sq - 1.0) * cos_theta * cos_theta;
    return a_sq / (3.14159 * d*d);
}


float smith_masking_shadowing(in float cos_theta, in float alpha) {
    float a = cos_theta / (alpha * sqrt(1.0 - cos_theta*cos_theta)); // Approximate: 1.0 / (alpha * tan(acos(cos_theta)))
    float a_sq = a*a;
    return a < 1.6 ? (1.0 - 1.259*a + 0.396*a_sq) / (3.535*a + 2.181*a_sq) : 0.0;
}


float schlick_fresnel(float cos_theta, float av) {
    float upper_term = pow(1.0-cos_theta,5.0 * exp(-2.69 * av));
    float lower_term = 1.0 + 22.7*pow(av, 1.5);
    return REFLECTANCE + (1.0 - REFLECTANCE) * upper_term / lower_term;
}

float dotpos(vec3 a, vec3 b) {
    return max(dot(a,b), 0.0);
}

// fma is a real function in modern GLSL but it seems to not be supported here
// so I'm creating these to make using this code require less refactoring
float fma(in float a, in float b, in float c) {
    return a * b + c;
}

vec3 fma(in vec3 a, in vec3 b, in vec3 c) {
    return a * b + c;
}

void brdf_lighting(in vec3 light, in vec3 light_color, in vec3 view, in mat4 view_matrix, in vec3 mesonormal, in float wave_height, inout vec3 specular, inout vec3 diffuse){
    vec3 halfway = normalize(light + view);
    vec3 macronormal = normalize(view_matrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz;
    float height = max(0.0, wave_height);

    float NdotLun = dot(macronormal, light);
    float NdotL = max(NdotLun, 2e-5);
    float NdotV = dotclamped(macronormal, view);

    float light_mask = smith_masking_shadowing(NdotL, REFLECTANCE);
    float view_mask = smith_masking_shadowing(NdotV, REFLECTANCE);

    float fresnel = schlick_fresnel(dot(halfway, light), REFLECTANCE);
    float distribution = ggx_distribution(mesonormal, halfway, REFLECTANCE);


    vec3 upper_specular_term = light_color * fresnel * distribution;
    float lower_specular_term = 4.0 * NdotV * (1.0 + light_mask + view_mask);
    specular += upper_specular_term / lower_specular_term;

    float height_dot = dotpos(light, -view);
    float height_dot_pow4 = height_dot * height_dot * height_dot * height_dot;

    float height_term2 = fma(-0.5, NdotLun, 0.5);
    float height_term2_pow3 = height_term2 * height_term2 * height_term2;

    float light_reflection_scatter = NdotV * NdotV  * k2;

    vec3 diffuse_out = fma(height_scale * height, height_dot_pow4 * height_term2_pow3, light_reflection_scatter) * water_scatter_color.rgb * light_color / (1.0 + light_mask);
    diffuse_out += fma(k3 * max(NdotLun, 0.0) * water_scatter_color.rgb, light_color, k4 * air_bubble_color.rgb * air_bubble_density * light_color);
    diffuse_out *= (1.0 - fresnel);
    diffuse += diffuse_out;

}

void main() {
    float dist = length(vertex.xyz);
    float wave_height;
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
    wave_height = displacement;
    vec3 albedo = water_color.rgb;

    vec3 model_normal = vec3(-derivatives.x, 1.0, -derivatives.y);
    model_normal *= mix(0.015, 1.0, exp(-dist * 0.0175));


    vec3 normal = normalize(cameraViewMatrix * transformMatrix * vec4(model_normal, 0.0)).xyz;

    vec3 specular = vec3(0.0);
    vec3 diffuse = vec3(0.0);


    brdf_lighting(light_vector, light_color, view, cameraViewMatrix, normal, wave_height, specular, diffuse);

//    if(dot(spotlight_vector, -spotlightAngle) > 0.97)
//    {
        brdf_lighting(spotlight_vector, spotlight_color, view, cameraViewMatrix, normal, wave_height, specular, diffuse);
//    }

    vec3 reflection_vector = reflect(vertex, normal);
    vec3 ambient = 0.215 * texture(skybox, reflection_vector).xyz;

    fragColor = vec4((specular + albedo * diffuse + ambient), 1.0); //(specular + albedo * diffuse + ambient)

}