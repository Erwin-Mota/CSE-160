class Camera {
  constructor(canvas) {
    this.fov = 60;
    this.eye = new Vector3([0, 0, 0]);
    this.at = new Vector3([0, 0, -1]);
    this.up = new Vector3([0, 1, 0]);
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this._canvas = canvas;
    this.updateProjection();
    this.updateView();
  }

  updateProjection() {
    const c = this._canvas;
    this.projectionMatrix.setPerspective(this.fov, c.width / c.height, 0.1, 3000);
  }

  updateView() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );
  }

  moveForward(speed) {
    const f = new Vector3();
    f.set(this.at).sub(this.eye);
    f.normalize();
    f.mul(speed);
    this.eye.add(f);
    this.at.add(f);
    this.updateView();
  }

  moveBackwards(speed) {
    const b = new Vector3();
    b.set(this.eye).sub(this.at);
    b.normalize();
    b.mul(speed);
    this.eye.add(b);
    this.at.add(b);
    this.updateView();
  }

  moveLeft(speed) {
    const f = new Vector3();
    f.set(this.at).sub(this.eye);
    const s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(speed);
    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  moveRight(speed) {
    const f = new Vector3();
    f.set(this.at).sub(this.eye);
    const s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(speed);
    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  panLeft(alpha) {
    const f = new Vector3();
    f.set(this.at).sub(this.eye);
    const rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
      alpha,
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2]
    );
    const fPrime = rotationMatrix.multiplyVector3(f);
    this.at.set(this.eye).add(fPrime);
    this.updateView();
  }

  panRight(alpha) {
    this.panLeft(-alpha);
  }

  tiltPitch(deltaDeg) {
    const f = new Vector3();
    f.set(this.at).sub(this.eye);
    const right = Vector3.cross(f, this.up);
    if (right.magnitude() < 1e-6) return;
    right.normalize();
    const rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
      deltaDeg,
      right.elements[0],
      right.elements[1],
      right.elements[2]
    );
    const fPrime = rotationMatrix.multiplyVector3(f);
    const horiz = Math.hypot(fPrime.elements[0], fPrime.elements[2]);
    const maxPitch = 0.24;
    if (horiz < 1e-4) return;
    const ratio = fPrime.elements[1] / horiz;
    if (ratio > maxPitch && deltaDeg > 0) return;
    if (ratio < -maxPitch && deltaDeg < 0) return;
    this.at.set(this.eye).add(fPrime);
    this.updateView();
  }
}
