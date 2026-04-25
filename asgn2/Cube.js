class Cube {
  constructor() {
    this.type = 'cube';
    //this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    //this.size = 5.0;
    this.matrix= new Matrix4();
  }

  render() {
    var rgba = this.color;
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Front face
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    drawTriangle3D([0,0,0, 1,1,0, 1,0,0]);
    drawTriangle3D([0,0,0, 0,1,0, 1,1,0]);

    // Top face 
    gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);
    drawTriangle3D([0,1,0, 0,1,1, 1,1,1]);
    drawTriangle3D([0,1,0, 1,1,1, 1,1,0]);

    // Right face
    gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
    drawTriangle3D([1,0,0, 1,1,0, 1,1,1]);
    drawTriangle3D([1,0,0, 1,1,1, 1,0,1]);

    // Left face
    gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
    drawTriangle3D([0,0,0, 0,1,1, 0,1,0]);
    drawTriangle3D([0,0,0, 0,0,1, 0,1,1]);

    // Bottom face
    gl.uniform4f(u_FragColor, rgba[0] * 0.7, rgba[1] * 0.7, rgba[2] * 0.7, rgba[3]);
    drawTriangle3D([0,0,0, 1,0,1, 0,0,1]);
    drawTriangle3D([0,0,0, 1,0,0, 1,0,1]);

    // Back face
    gl.uniform4f(u_FragColor, rgba[0] * 0.6, rgba[1] * 0.6, rgba[2] * 0.6, rgba[3]);
    drawTriangle3D([0,0,1, 1,1,1, 1,0,1]);
    drawTriangle3D([0,0,1, 0,1,1, 1,1,1]);
  }
}