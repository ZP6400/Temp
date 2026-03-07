/**
 * Handles initializing an attribute buffer
 * @param attName The name of the attribute buffer in the shader file
 * @param dataSize The size of the datatype of the attribute buffer
 * @returns {AudioBuffer | WebGLBuffer}
 */
function bindAttBuffer(buffer, attName, dataSize) {

    let attrib = gl.getAttribLocation(program, attName);
    
    // Safety check: if the attribute isn't in this shader, just skip it
    if (attrib === -1) return buffer; 

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attrib, dataSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attrib);

    return buffer;
}

function initBuffer(data = null) {
    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    if (data) {
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);
    } else {
        gl.bufferData(gl.ARRAY_BUFFER, flatten([]), gl.STATIC_DRAW);
    }

    return buffer;
}

/**
 * Updates an existing attribute buffer with new data
 * @param buffer A valid WebGLBuffer to update
 * @param data The data to update the buffer with
 */
function updateAttBuffer(buffer, data) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);
}


/**
 * Updates a mat4 uniforms data
 * @param matName The name of the mat4 uniform in the shader file
 * @param data The data to update it with
 */
function updateMat4Uniform(matName, data) {

    let loc = gl.getUniformLocation(program, matName);
    // Safety check: if the uniform isn't in this shader, don't try to set it
    if (loc) {
        gl.uniformMatrix4fv(loc, false, flatten(data));
    }

}

/**
 * Updates a vec4 uniforms data
 * @param vecName The name of the vec4 uniform in the shader file
 * @param data The data to update it with
 */
function updateVec4Uniform(vecName, data) {
    
    let loc = gl.getUniformLocation(program, vecName);
    if (loc) {

        gl.uniform4fv(loc, flatten(data));
    }
}

/**
 * Updates a vec3 uniforms data
 * @param vecName The name of the vec3 uniform in the shader file
 * @param data The data to update it with
 */
function updateVec3Uniform(vecName, data) {
    
    let loc = gl.getUniformLocation(program, vecName);
    if (loc) {

        gl.uniform3fv(loc, flatten(data));
    }
}

/**
 * Updates a float uniforms data
 * @param floatName The name of the float uniform in the shader file
 * @param data The data to update it with
 */
function updateFloatUniform(floatName, data) {
    gl.uniform1f(gl.getUniformLocation(program, floatName), data);
}

/**
 * Updates an int uniforms data
 * @param intName The name of the int uniform in the shader file
 * @param data The data to update it with
 */
function updateIntUniform(intName, data) {
    
    let loc = gl.getUniformLocation(program, intName);
    if (loc) {
        
        gl.uniform1i(loc, data);
    }
}

/**
 * Updates a bool uniforms data (same effect as updateIntUniform, used for clarity)
 * @param boolName The name of the bool uniform in the shader file
 * @param data The data to update it with
 */
function updateBoolUniform(boolName, data) {
    gl.uniform1i(gl.getUniformLocation(program, boolName), data);
}

/**
 * Updates an uint uniforms data
 * @param uintName The name of the uint uniform in the shader file
 * @param data The data to update it with
 */
function updateUintUniform(uintName, data) {
    gl.uniform1ui(gl.getUniformLocation(program, uintName), data);
}