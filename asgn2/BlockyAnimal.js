const VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotateMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;\n' +
  '}\n';

const FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

let gl;
let canvas;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let g_globalYAngle = 0;
let g_mouseXAngle = 0;
let g_mouseYAngle = 0;
let g_leftWingUpper = 20;
let g_leftWingLower = -30;
let g_leftWingTip = 10;
let g_rightWingUpper = -20;
let g_rightWingLower = -25;
let g_headAngle = 0;
let g_leftLeg = 0;
let g_rightLeg = 0;
let g_leftFoot = 0;
let g_rightFoot = 0;

let g_animate = true;
let g_poke = false;
let g_pokeStart = 0;
let g_dragging = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

let g_startTime = performance.now() / 1000.0;
let g_seconds = 0;

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  gl.clearColor(0.75, 0.9, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Shader failed to initialize');
    return;
  }
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');

  const identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identityM.elements);
}

function addActionsForHtmlUI() {
  document.getElementById('globalYSlide').addEventListener('input', function () {
    g_globalYAngle = Number(this.value);
  });
  document.getElementById('leftWingUpperSlide').addEventListener('input', function () {
    g_leftWingUpper = Number(this.value);
  });
  document.getElementById('leftWingLowerSlide').addEventListener('input', function () {
    g_leftWingLower = Number(this.value);
  });
  document.getElementById('leftWingTipSlide').addEventListener('input', function () {
    g_leftWingTip = Number(this.value);
  });
  document.getElementById('rightWingUpperSlide').addEventListener('input', function () {
    g_rightWingUpper = Number(this.value);
  });
  document.getElementById('rightWingLowerSlide').addEventListener('input', function () {
    g_rightWingLower = Number(this.value);
  });
  document.getElementById('headSlide').addEventListener('input', function () {
    g_headAngle = Number(this.value);
  });
  document.getElementById('leftFootSlide').addEventListener('input', function () {
    g_leftFoot = Number(this.value);
  });
  document.getElementById('rightFootSlide').addEventListener('input', function () {
    g_rightFoot = Number(this.value);
  });
  document.getElementById('leftLegSlide').addEventListener('input', function () {
    g_leftLeg = Number(this.value);
  });
  document.getElementById('rightLegSlide').addEventListener('input', function () {
    g_rightLeg = Number(this.value);
  });
  document.getElementById('animOnButton').onclick = function () {
    g_animate = true;
  };
  document.getElementById('animOffButton').onclick = function () {
    g_animate = false;
  };
}

function addMouseControls() {
  canvas.onmousedown = function (ev) {
    g_dragging = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
    if (ev.shiftKey) {
      g_poke = true;
      g_pokeStart = g_seconds;
    }
  };
  canvas.onmouseup = function () {
    g_dragging = false;
  };
  canvas.onmouseleave = function () {
    g_dragging = false;
  };
  canvas.onmousemove = function (ev) {
    if (!g_dragging) return;
    const dx = ev.clientX - g_lastMouseX;
    const dy = ev.clientY - g_lastMouseY;
    g_mouseYAngle += dx * 0.4;
    g_mouseXAngle += dy * 0.4;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  };
}

function updateAnimationAngles() {
  if (g_animate) {
    // Gentler, bird-like flapping with phased joints.
    const flapSpeed = 2.2;
    const wingUpper = -18 - 10 * Math.sin(g_seconds * flapSpeed);
    const wingLower = -16 - 7 * Math.sin(g_seconds * flapSpeed + 0.55);
    g_rightWingUpper = wingUpper;
    g_rightWingLower = wingLower;

    g_leftWingUpper = wingUpper;
    g_leftWingLower = wingLower;
    g_leftWingTip = -10 - 5 * Math.sin(g_seconds * flapSpeed + 1.0);

    // Softer alternating steps.
    const legSpeed = 2.8;
    g_leftLeg = 6 * Math.sin(g_seconds * legSpeed);
    g_rightLeg = -6 * Math.sin(g_seconds * legSpeed);
    g_leftFoot = -10 + 4 * Math.sin(g_seconds * legSpeed + 0.6);
    g_rightFoot = -10 + 4 * Math.sin(g_seconds * legSpeed + 2.2);

    // Subtle head bob to reduce rigid look.
    g_headAngle = 4 * Math.sin(g_seconds * 1.8);
  }

  if (g_poke) {
    const t = g_seconds - g_pokeStart;
    if (t < 0.6) {
      g_headAngle = 20 * Math.sin(t * 20.0);
    } else {
      g_poke = false;
      g_headAngle = 0;
    }
  }
}

function renderScene() {
  const startTime = performance.now();

  const globalRotMat = new Matrix4()
    .rotate(g_globalYAngle, 0, 1, 0)
    .rotate(g_mouseXAngle, 1, 0, 0)
    .rotate(g_mouseYAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Body
  const body = new Cube();
  body.color = [0.1, 0.1, 0.12, 1.0];
  body.matrix.translate(-0.25, -0.4, -0.15);
  body.matrix.scale(0.5, 0.8, 0.3);
  body.render();

  // Belly
  const belly = new Cube();
  belly.color = [0.95, 0.95, 0.9, 1.0];
  belly.matrix.translate(-0.16, -0.3, -0.16);
  belly.matrix.scale(0.32, 0.55, 0.32);
  belly.render();

  // Head
  const headAnchor = new Matrix4();
  headAnchor.translate(-0.17, 0.42, -0.12);
  headAnchor.rotate(g_headAngle, 1, 0, 0);

  const head = new Cube();
  head.color = [0.12, 0.12, 0.14, 1.0];
  head.matrix = new Matrix4(headAnchor);
  head.matrix.scale(0.34, 0.28, 0.24);
  head.render();

  // Beak (non-cube primitive)
  const beak = new Pyramid();
  beak.color = [1.0, 0.5, 0.0, 1.0];
  beak.matrix = new Matrix4(headAnchor);
  // Keep pyramid apex pointing forward (+z) so beak is visible
  beak.matrix.translate(0.12, 0.08, 0.24);
  beak.matrix.scale(0.12, 0.12, 0.18);
  beak.render();

  // Eyes
  const leftEye = new Cube();
  leftEye.color = [1, 1, 1, 1];
  leftEye.matrix = new Matrix4(headAnchor);
  leftEye.matrix.translate(0.06, 0.17, 0.22);
  leftEye.matrix.scale(0.05, 0.05, 0.03);
  leftEye.render();

  const rightEye = new Cube();
  rightEye.color = [1, 1, 1, 1];
  rightEye.matrix = new Matrix4(headAnchor);
  rightEye.matrix.translate(0.23, 0.17, 0.22);
  rightEye.matrix.scale(0.05, 0.05, 0.03);
  rightEye.render();

  // Left wing chain (3 levels)
  const lwUpper = new Matrix4();
  // Shoulder outside left side of body.
  lwUpper.translate(-0.37, 0.02, 0.02);
  lwUpper.rotate(-g_leftWingUpper, 0, 0, 1);
  const leftWingUpper = new Cube();
  leftWingUpper.color = [0.08, 0.08, 0.1, 1];
  leftWingUpper.matrix = new Matrix4(lwUpper);
  leftWingUpper.matrix.scale(0.12, 0.35, 0.18);
  leftWingUpper.render();

  const lwLower = new Matrix4(lwUpper);
  lwLower.translate(0.0, 0.32, 0.0);
  lwLower.rotate(-g_leftWingLower, 0, 0, 1);
  const leftWingLower = new Cube();
  leftWingLower.color = [0.1, 0.1, 0.12, 1];
  leftWingLower.matrix = new Matrix4(lwLower);
  leftWingLower.matrix.scale(0.14, 0.28, 0.16);
  leftWingLower.render();

  const lwTip = new Matrix4(lwLower);
  lwTip.translate(0.0, 0.25, 0.0);
  lwTip.rotate(-g_leftWingTip, 0, 0, 1);
  const leftWingTip = new Cube();
  leftWingTip.color = [0.15, 0.15, 0.18, 1];
  leftWingTip.matrix = new Matrix4(lwTip);
  leftWingTip.matrix.scale(0.12, 0.18, 0.14);
  leftWingTip.render();

  // Right wing chain (upper + lower)
  const rwUpper = new Matrix4();
  rwUpper.translate(0.25, 0.1, 0.0);
  rwUpper.rotate(g_rightWingUpper, 0, 0, 1);
  const rightWingUpper = new Cube();
  rightWingUpper.color = [0.08, 0.08, 0.1, 1];
  rightWingUpper.matrix = new Matrix4(rwUpper);
  rightWingUpper.matrix.scale(0.16, 0.35, 0.18);
  rightWingUpper.render();

  const rwLower = new Matrix4(rwUpper);
  rwLower.translate(0.0, 0.32, 0.0);
  rwLower.rotate(g_rightWingLower, 0, 0, 1);
  const rightWingLower = new Cube();
  rightWingLower.color = [0.1, 0.1, 0.12, 1];
  rightWingLower.matrix = new Matrix4(rwLower);
  rightWingLower.matrix.scale(0.14, 0.26, 0.16);
  rightWingLower.render();

  // Left short black leg + attached foot
  const leftLegAnchor = new Matrix4();
  leftLegAnchor.translate(-0.12, -0.43, 0.02);
  leftLegAnchor.rotate(g_leftLeg, 1, 0, 0);
  const leftLeg = new Cube();
  leftLeg.color = [0.05, 0.05, 0.05, 1];
  leftLeg.matrix = new Matrix4(leftLegAnchor);
  leftLeg.matrix.scale(0.08, 0.12, 0.08);
  leftLeg.render();

  const leftFoot = new Cube();
  leftFoot.color = [1.0, 0.55, 0.0, 1];
  leftFoot.matrix = new Matrix4(leftLegAnchor);
  // Move foot to end of short leg so it stays attached
  leftFoot.matrix.translate(-0.04, -0.11, 0.02);
  leftFoot.matrix.rotate(g_leftFoot, 1, 0, 0);
  leftFoot.matrix.scale(0.16, 0.05, 0.16);
  leftFoot.render();

  // Right short black leg + attached foot
  const rightLegAnchor = new Matrix4();
  rightLegAnchor.translate(0.04, -0.43, 0.02);
  rightLegAnchor.rotate(g_rightLeg, 1, 0, 0);
  const rightLeg = new Cube();
  rightLeg.color = [0.05, 0.05, 0.05, 1];
  rightLeg.matrix = new Matrix4(rightLegAnchor);
  rightLeg.matrix.scale(0.08, 0.12, 0.08);
  rightLeg.render();

  const rightFoot = new Cube();
  rightFoot.color = [1.0, 0.55, 0.0, 1];
  rightFoot.matrix = new Matrix4(rightLegAnchor);
  // Move foot to end of short leg so it stays attached
  rightFoot.matrix.translate(-0.04, -0.11, 0.02);
  rightFoot.matrix.rotate(g_rightFoot, 1, 0, 0);
  rightFoot.matrix.scale(0.16, 0.05, 0.16);
  rightFoot.render();

  const duration = performance.now() - startTime;
  const fps = duration > 0 ? Math.floor(1000 / duration) : 0;
  sendTextToHTML('ms: ' + Math.floor(duration) + ' fps: ' + fps, 'numdot');
}

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  updateAnimationAngles();
  renderScene();
  requestAnimationFrame(tick);
}

function sendTextToHTML(text, htmlID) {
  const htmlElm = document.getElementById(htmlID);
  if (!htmlElm) return;
  htmlElm.innerHTML = text;
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();
  addMouseControls();
  requestAnimationFrame(tick);
}
 