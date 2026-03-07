function plane(fl, br, subdivs) {
    let front_right = vec3(br[0], 0, fl[1]);
    let back_left = vec3(fl[0], 0, br[1]);
    let front_left = vec3(fl[0], 0, fl[1]);
    let back_right = vec3(br[0], 0, br[1]);

    return squareFlat(front_left, front_right, back_right, back_left, subdivs);
}

function squareFlat(a, b, c, d, subdivisions) {
    let verts = [];

    divideTriangleFlat(a, b, c, subdivisions, verts);
    divideTriangleFlat(c, d, a, subdivisions, verts);
    return verts;
}

function divideTriangleFlat(a, b, c, subdivs, verts) {
    if ( subdivs > 0 ) {

        let ab = mix( a, b, 0.5);
        let ac = mix( a, c, 0.5);
        let bc = mix( b, c, 0.5);

        divideTriangleFlat( a, ab, ac, subdivs - 1, verts );
        divideTriangleFlat( ab, b, bc, subdivs - 1, verts );
        divideTriangleFlat( bc, c, ac, subdivs - 1, verts );
        divideTriangleFlat( ab, bc, ac, subdivs - 1, verts );
    }
    else {
        triangleFlat( a, b, c, verts );
    }
}

function triangleFlat(a, b, c, verts) {
    let first = vec4(a[0], a[1], a[2], 1.0);
    let second = vec4(b[0], b[1], b[2], 1.0);
    let third = vec4(c[0], c[1], c[2], 1.0);

    verts.push(first);
    verts.push(second);
    verts.push(third);
}