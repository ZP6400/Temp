#version 300 es

uniform mat4 lightViewMatrix;
uniform mat4 lightProjectionMatrix;

in vec4 vPosition;
uniform float time;
uniform vec4 cameraPos;
uniform sampler2D waveTexture;
uniform uint wave_count;
uniform mat4 cameraViewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
uniform vec4 lightPosition;
uniform vec3 spotlightPosition;

out vec4 fPositionShadow;

out vec3 vertex, light_vector, spotlight_vector;
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

void main() {

	vec4 worldVert = transformMatrix * vPosition;

	vec2 derivatives = vec2(0.0);
	float displacement = 0.0;
	vec2 prev_derivs = vec2(0.0);
	vec2 uv = worldVert.xz;
	for (uint i = 0u; i < wave_count; i++) {
		Wave w = get_wave(i, waveTexture);
		float x = 0.0;
		displacement += w.amplitude*expsine(uv,w, x);
		prev_derivs = w.amplitude * d_expsine(uv, w, x);
		uv += -prev_derivs * w.direction * w.amplitude * 1.17;

		derivatives += prev_derivs;
	}
	worldVert.xz = uv;

	float d = distance(cameraPos, worldVert);

	float fadeStart = 50.0;
	float fadeEnd   = 200.0;

	float dist_factor = clamp((fadeEnd - d) / (fadeEnd - fadeStart), 0.0, 1.0);
	worldVert.y += displacement * pow(dist_factor, 0.9);

	fPositionShadow = lightProjectionMatrix * lightViewMatrix * worldVert;

	worldVert = cameraViewMatrix * worldVert;

	vertex = worldVert.xyz;

	gl_Position = projectionMatrix * worldVert;

	light_vector = normalize((cameraViewMatrix * lightPosition).xyz - vertex.xyz);
	spotlight_vector = normalize((cameraViewMatrix * vec4(spotlightPosition, 1.0)).xyz - vertex.xyz);
}