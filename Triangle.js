class Triangle {
  constructor() {
    this.type = 'triangle';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }

  render() {
    var rgba = this.color;
    var size = this.size;
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniform1f(u_Size, size);
    if (this.vertices && this.vertices.length >= 6) {
      drawTriangle(this.vertices);
      return;
    }
    var xy = this.position;
    let s = size / 200;
    drawTriangle([
      xy[0], xy[1],
      xy[0] + s, xy[1],
      xy[0], xy[1] + s
    ]);
  }
}