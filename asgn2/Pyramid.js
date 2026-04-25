class Pyramid {
  constructor() {
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
  }

  render() {
    const c = this.color;
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Square base on z=0 plane
    gl.uniform4f(u_FragColor, c[0] * 0.8, c[1] * 0.8, c[2] * 0.8, c[3]);
    drawTriangle3D([0, 0, 0, 1, 0, 0, 1, 1, 0]);
    drawTriangle3D([0, 0, 0, 1, 1, 0, 0, 1, 0]);

    gl.uniform4f(u_FragColor, c[0], c[1], c[2], c[3]);
    drawTriangle3D([0, 0, 0, 1, 0, 0, 0.5, 0.5, 1]);
    drawTriangle3D([1, 0, 0, 1, 1, 0, 0.5, 0.5, 1]);
    drawTriangle3D([1, 1, 0, 0, 1, 0, 0.5, 0.5, 1]);
    drawTriangle3D([0, 1, 0, 0, 0, 0, 0.5, 0.5, 1]);
  }
}
