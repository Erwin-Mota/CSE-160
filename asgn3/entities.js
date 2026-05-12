function drawEntityCube(modelM, baseColor, texWeight, drawCubeUnit) {
  gl.uniform1i(u_SurfaceKind, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelM.elements);
  gl.uniform4fv(u_BaseColor, baseColor);
  gl.uniform1f(u_TexColorWeight, texWeight);
  drawCubeUnit();
}

function renderTree(terrainHeightAt, texTreeBark, texGrassFloor, drawCubeUnit, Tx, Tz) {
  const gy = terrainHeightAt(Tx, Tz) + 0.01;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texTreeBark);
  gl.uniform1i(u_Sampler, 0);

  for (let i = 0; i < 8; i++) {
    const m = new Matrix4();
    m.setTranslate(Tx, gy + i, Tz);
    drawEntityCube(m, new Float32Array([1, 1, 1, 1]), 1, drawCubeUnit);
  }

  gl.bindTexture(gl.TEXTURE_2D, texGrassFloor);
  gl.uniform1i(u_Sampler, 0);
  const leafTint = new Float32Array([0.38, 0.95, 0.34, 1]);

  function leaf(dx, dy, dz) {
    const m = new Matrix4();
    m.setTranslate(Tx + dx, gy + dy, Tz + dz);
    drawEntityCube(m, leafTint, 0.92, drawCubeUnit);
  }

  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      leaf(dx, 8, dz);
    }
  }
  leaf(-1, 9, 0);
  leaf(0, 9, 0);
  leaf(1, 9, 0);
  leaf(0, 9, -1);
  leaf(0, 9, 1);
  leaf(0, 10, 0);
}

function renderCreeper(terrainHeightAt, texDirt, drawCubeUnit, drawCreeperHead, Cx, Cz) {
  const gy = terrainHeightAt(Cx, Cz) + 0.01;
  const stackEps = 0.006;
  const u = 0.88;
  const legW = 0.5 * u;
  const legH = 0.75 * u;
  const legD = 0.5 * u;
  const bodyW = u;
  const bodyH = 1.5 * u;
  const bodyD = 0.5 * u;
  const skin = new Float32Array([0.41, 0.69, 0.26, 1]);
  const skinLeg = new Float32Array([0.32, 0.58, 0.22, 1]);

  gl.bindTexture(gl.TEXTURE_2D, texDirt);
  gl.uniform1i(u_Sampler, 0);

  const ox = 0.25 * u;
  const oz = 0.25 * u;
  const legCenters = [
    [-ox, oz],
    [ox, oz],
    [-ox, -oz],
    [ox, -oz]
  ];
  for (let i = 0; i < 4; i++) {
    const m = new Matrix4();
    m.setTranslate(Cx + legCenters[i][0] - legW * 0.5, gy, Cz + legCenters[i][1] - legD * 0.5);
    m.multiply(new Matrix4().setScale(legW, legH, legD));
    drawEntityCube(m, skinLeg, 0, drawCubeUnit);
  }

  const body = new Matrix4();
  body.setTranslate(Cx - bodyW * 0.5, gy + legH + stackEps, Cz - bodyD * 0.5);
  body.multiply(new Matrix4().setScale(bodyW, bodyH, bodyD));
  drawEntityCube(body, skin, 0, drawCubeUnit);

  const head = new Matrix4();
  head.setTranslate(Cx - u * 0.5, gy + legH + bodyH + stackEps * 2, Cz - u * 0.5);
  head.multiply(new Matrix4().setScale(u, u, u));
  drawCreeperHead(head);
}

function renderPig(seconds, terrainHeightAt, texDirt, drawCubeUnit, Px, Pz) {
  const s = 1.48;
  const gy = terrainHeightAt(Px, Pz) + 0.01;
  const waddle = 0.04 * s * Math.sin(seconds * 4.0);
  const pink = new Float32Array([0.98, 0.72, 0.82, 1]);
  const snout = new Float32Array([0.92, 0.62, 0.72, 1]);
  gl.bindTexture(gl.TEXTURE_2D, texDirt);
  gl.uniform1i(u_Sampler, 0);

  const legY = gy;
  const lc = [
    [0.12 * s, 0.12 * s],
    [0.52 * s, 0.12 * s],
    [0.12 * s, 0.52 * s],
    [0.52 * s, 0.52 * s]
  ];
  for (let i = 0; i < 4; i++) {
    const m = new Matrix4();
    m.setTranslate(Px + lc[i][0] + waddle * (i % 2 === 0 ? 1 : -1) * 0.02, legY, Pz + lc[i][1]);
    m.multiply(new Matrix4().setScale(0.12 * s, 0.22 * s, 0.12 * s));
    m.translate(0.1 * s, 0, 0.1 * s);
    drawEntityCube(m, pink, 0.05, drawCubeUnit);
  }

  const body = new Matrix4();
  body.setTranslate(Px + 0.05 * s, gy + 0.24 * s, Pz + 0.06 * s);
  body.multiply(new Matrix4().setScale(0.62 * s, 0.45 * s, 0.55 * s));
  body.translate(0.08 * s, 0, 0.05 * s);
  drawEntityCube(body, pink, 0.08, drawCubeUnit);

  const head = new Matrix4();
  head.setTranslate(Px + 0.52 * s, gy + 0.38 * s, Pz + 0.22 * s);
  head.multiply(new Matrix4().setScale(0.38 * s, 0.38 * s, 0.38 * s));
  head.translate(0.02 * s, 0, 0.1 * s);
  drawEntityCube(head, pink, 0.08, drawCubeUnit);

  const sn = new Matrix4();
  sn.setTranslate(Px + 0.78 * s, gy + 0.44 * s, Pz + 0.32 * s);
  sn.multiply(new Matrix4().setScale(0.16 * s, 0.14 * s, 0.12 * s));
  sn.translate(0.05 * s, 0, 0.1 * s);
  drawEntityCube(sn, snout, 0, drawCubeUnit);
}

function renderWorldActors(seconds, terrainHeightAt, texTreeBark, texGrassFloor, texDirtBlock, drawCubeUnit, drawCreeperHead) {
  renderTree(terrainHeightAt, texTreeBark, texGrassFloor, drawCubeUnit, 10, 10);
  renderCreeper(terrainHeightAt, texDirtBlock, drawCubeUnit, drawCreeperHead, 16, 14);
  renderCreeper(terrainHeightAt, texDirtBlock, drawCubeUnit, drawCreeperHead, 7, 22);
  renderPig(seconds, terrainHeightAt, texDirtBlock, drawCubeUnit, 22, 12);
}
