varying vec2 vertexUV;
varying vec3 vectorNormal;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    vertexUV = uv;
    vectorNormal = normalize(normalMatrix * normal );
}