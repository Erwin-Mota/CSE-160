class Triangle {
  constructor() {
    this.type = 'triangle';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }

  render() {
    var rgba = this.color;
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    if (this.vertices && this.vertices.length >= 6) {
      drawTriangle(this.vertices);
      return;
    }
    var xy = this.position;
    let s = this.size / 200;
    drawTriangle([
      xy[0], xy[1],
      xy[0] + s, xy[1],
      xy[0], xy[1] + s
    ]);
  }
}

let g_triangleBuffer = null;

function getTriangleBuffer() {
  if (g_triangleBuffer) return g_triangleBuffer;
  g_triangleBuffer = gl.createBuffer();
  if (!g_triangleBuffer) {
    console.log('Failed to create shared triangle buffer');
    return null;
  }
  return g_triangleBuffer;
}

function drawTriangle(vertices) {
  var n = 3; // The number of vertices
  var vertexBuffer = getTriangleBuffer();
  if (!vertexBuffer) return -1;

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle3D(vertices) {
  var n = 3; // The number of vertices
  var vertexBuffer = getTriangleBuffer();
  if (!vertexBuffer) return -1;

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}