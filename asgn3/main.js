'use strict';


const WORLD = 32;

const MAX_STACK = 4;

const GRASS_SIDE_TOP_V0 = 0.62;
const GRASS_SIDE_TOP_V1 = 1.0;

const VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
varying vec2 v_TexCoord;
varying vec3 v_WorldPos;
void main() {
  vec4 wp = u_ModelMatrix * a_Position;
  v_WorldPos = wp.xyz;
  gl_Position = u_ProjectionMatrix * u_ViewMatrix * wp;
  v_TexCoord = a_TexCoord;
}
`;

const FSHADER_SOURCE = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_TexCoord;
varying vec3 v_WorldPos;
uniform sampler2D u_Sampler;
uniform vec4 u_BaseColor;
uniform float u_TexColorWeight;
uniform int u_SurfaceKind;
uniform vec3 u_SkyOrigin;

void main() {
  if (u_SurfaceKind == 1) {
    vec3 dir = normalize(v_WorldPos - u_SkyOrigin);
    float y = dir.y;
    vec3 horizonCol = vec3(0.78, 0.90, 1.0);
    vec3 midCol = vec3(0.58, 0.80, 0.99);
    vec3 zenithCol = vec3(0.45, 0.72, 0.98);
    float h = smoothstep(-0.35, 0.08, y);
    float hi = smoothstep(0.05, 0.85, y);
    vec3 grad = mix(horizonCol, midCol, h);
    grad = mix(grad, zenithCol, hi);
    vec3 tex = texture2D(u_Sampler, v_TexCoord).rgb;
    vec3 rgb = mix(grad, tex, 0.35);
    vec3 sunDir = normalize(vec3(0.35, 0.72, 0.32));
    float sun = pow(max(0.0, dot(dir, sunDir)), 96.0);
    rgb += vec3(1.0, 0.98, 0.92) * sun * 0.55;
    gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), 1.0);
    return;
  }
  if (u_SurfaceKind == 2) {
    vec2 guv = v_TexCoord * 48.0;
    vec3 coarse = texture2D(u_Sampler, guv).rgb;
    vec3 fine = texture2D(u_Sampler, guv * 2.6 + vec2(0.11, 0.19)).rgb;
    vec3 rgb = coarse * (0.62 + 0.58 * fine);
    rgb *= vec3(0.9, 1.05, 0.82);
    gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), 1.0);
    return;
  }
  vec4 texColor = texture2D(u_Sampler, v_TexCoord);
  float t = u_TexColorWeight;
  gl_FragColor = (1.0 - t) * u_BaseColor + t * texColor;
}
`;

let gl;
let canvas;
let camera;

let a_Position;
let a_TexCoord;
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_Sampler;
let u_BaseColor;
let u_TexColorWeight;
let u_SurfaceKind;
let u_SkyOrigin;

let texGrassFloor;
let texGrassBlockSide;
let texDirtBlock;
let texSky;
let texTreeBark;

let texCreeperFace;

let unitCubeBuffer;
let unitCubeCount;
let creeperHead5Buffer;
let creeperHead5Count;
let creeperHeadFaceBuffer;
let creeperHeadFaceCount;

let wallMap;
let terrainH;

let wallDirtBuffer;
let wallDirtCount;
let wallGrassSideBuffer;
let wallGrassSideCount;
let terrainBuffer;
let terrainVertexCount;
let skyBuffer;
let skyVertexCount;

const g_keys = {};
let g_mouseDragging = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;
let g_pointerLocked = false;

const MOVE_SPEED = 0.14;
const PAN_DEG = 2.5;
const MOUSE_SENS = 0.12;
const PLAYER_HALF = 0.26;
const PLAYER_BODY_H = 1.62;
const PLAYER_FEET_CLEAR = 0.08;

const SKY_TINT = new Float32Array([0.65, 0.82, 0.99, 1]);
const GRASS_TINT = new Float32Array([0.18, 0.5, 0.12, 1]);
const WHITE = new Float32Array([1, 1, 1, 1]);
const CREEPER_HEAD_BODY = new Float32Array([0.4, 0.72, 0.3, 1]);


const LEVEL_MAP_ROWS = [
  '43232323232323232323232323232324',
  '30000000000000000000000000000002',
  '20000000000000000000000000000003',
  '30000000000000000000000000000002',
  '20000000000000000000000000000003',
  '30000121000000000000000000000002',
  '20000232000000000000000000000003',
  '30000121000000000000000000000002',
  '20000000000000000000000000000003',
  '30000000000000000000000000000002',
  '20000000000000000000000000000003',
  '30000000000000000000000000000002',
  '20000000000000000000000000000003',
  '30000000000000000000000000000002',
  '20000000000000000000000000000003',
  '30000000000000000000000000000002',
  '20000000000000000000000000000003',
  '30000000000000000000000000000002',
  '20000000000000000000000000000003',
  '30000000000000000000000000000002',
  '20000000000000000000000000000003',
  '30000000000000000000000121000002',
  '20000000000000000000000232000003',
  '30000000000000000000000121000002',
  '20000000000012300000000000000003',
  '30000000000000000000000000000002',
  '20000000000000000000000000000003',
  '30000000000000000000000000000002',
  '20000000000000000000000000000003',
  '30000000000000000000000000000002',
  '20000000000000000000000000000003',
  '42323232323232323232323232323234'
];

const QUEST_TARGET = { x: 10.5, z: 10.5, radius: 2.1 };
const QUEST_TIME_SEC = 120;

let gameWon = false;
let gameLost = false;
let gameStartTime = null;

function main() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    alert('WebGL not supported');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.error('Shader init failed');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  u_BaseColor = gl.getUniformLocation(gl.program, 'u_BaseColor');
  u_TexColorWeight = gl.getUniformLocation(gl.program, 'u_TexColorWeight');
  u_SurfaceKind = gl.getUniformLocation(gl.program, 'u_SurfaceKind');
  u_SkyOrigin = gl.getUniformLocation(gl.program, 'u_SkyOrigin');

  gl.clearColor(0.55, 0.78, 0.98, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  camera = new Camera(canvas);
  camera.eye.set(new Vector3([WORLD * 0.5, 2.4, WORLD - 4]));
  camera.at.set(new Vector3([WORLD * 0.5, 2.1, WORLD * 0.5]));
  camera.updateView();

  gameWon = false;
  gameLost = false;
  gameStartTime = null;

  initWorldData();
  initTextures(() => {
    loadCreeperFaceTexture(() => {
      rebuildGeometry();
      requestAnimationFrame(tick);
    });
  });

  window.addEventListener('resize', onResize);
  setupInput();
  onResize();
}

function onResize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor(window.innerHeight * dpr);
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  gl.viewport(0, 0, w, h);
  if (camera) {
    camera._canvas = canvas;
    camera.updateProjection();
    camera.updateView();
  }
}


const ACTOR_CLEAR_ZONES = [
  [8, 12, 8, 12],
  [14, 18, 12, 17],
  [5, 10, 19, 25],
  [20, 24, 10, 14]
];

function reservedForActors(x, z) {
  for (let i = 0; i < ACTOR_CLEAR_ZONES.length; i++) {
    const r = ACTOR_CLEAR_ZONES[i];
    if (x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3]) return true;
  }
  return false;
}

function initWorldData() {
  wallMap = [];
  for (let z = 0; z < WORLD; z++) {
    wallMap[z] = [];
    const row = LEVEL_MAP_ROWS[z];
    for (let x = 0; x < WORLD; x++) {
      let h = parseInt(row.charAt(x), 10);
      if (Number.isNaN(h) || h < 0) h = 0;
      if (h > MAX_STACK) h = MAX_STACK;
      if (reservedForActors(x, z)) h = 0;
      wallMap[z][x] = h;
    }
  }

  terrainH = [];
  for (let j = 0; j <= WORLD; j++) {
    terrainH[j] = [];
    for (let i = 0; i <= WORLD; i++) {
      terrainH[j][i] = 0;
    }
  }
}

function cellHeight(x, z) {
  if (x < 0 || z < 0 || x >= WORLD || z >= WORLD) return 0;
  return wallMap[z][x];
}

function terrainHeightAtWorld(px, pz) {
  const i = Math.floor(px);
  const j = Math.floor(pz);
  if (i < 0 || j < 0 || i >= WORLD || j >= WORLD) return 0;
  const fx = px - i;
  const fz = pz - j;
  const h00 = terrainH[j][i];
  const h10 = terrainH[j][i + 1];
  const h01 = terrainH[j + 1][i];
  const h11 = terrainH[j + 1][i + 1];
  const a = h00 * (1 - fx) + h10 * fx;
  const b = h01 * (1 - fx) + h11 * fx;
  return a * (1 - fz) + b * fz;
}

function terrainHeightAt(ix, iz) {
  return terrainHeightAtWorld(ix + 0.5, iz + 0.5);
}

function creeperFace8x8Pattern() {
  const rows = [
    '        ',
    '        ',
    '  XX XX ',
    '  XX XX ',
    '        ',
    '  XXXX  ',
    ' X    X ',
    '  XXXX  '
  ];
  const pat = [];
  for (let r = 0; r < 8; r++) {
    const line = rows[r];
    const row = [];
    for (let c = 0; c < 8; c++) row.push(line.charAt(c) === 'X' ? 1 : 0);
    pat.push(row);
  }
  return pat;
}

function uploadTextureFromCanvas(canvas) {
  const tex = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function createProceduralCreeperFaceTexture() {
  const W = 64;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = W;
  const ctx = c.getContext('2d');
  const pat = creeperFace8x8Pattern();
  const green = '#6aaf3f';
  const black = '#0f0f0f';
  const cell = W / 8;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      ctx.fillStyle = pat[row][col] ? black : green;
      ctx.fillRect(col * cell, row * cell, cell + 0.5, cell + 0.5);
    }
  }
  return uploadTextureFromCanvas(c);
}

function loadCreeperFaceTexture(done) {
  const img = new Image();
  img.onload = function () {
    const tex = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    texCreeperFace = tex;
    done();
  };
  img.onerror = function () {
    texCreeperFace = createProceduralCreeperFaceTexture();
    done();
  };
  img.src = 'textures/creeper_face.png';
}

function initTextures(done) {
  const jobs = [
    { key: 'grassFloor', url: 'textures/grass.png', mode: 'mipmap' },
    { key: 'grassSide', url: 'textures/grass_block_side.png', mode: 'npot' },
    { key: 'dirtBlock', url: 'textures/dirt_block.png', mode: 'npot' },
    { key: 'treeBark', url: 'textures/tree_bark.png', mode: 'npot' },
    { key: 'sky', url: 'textures/sky.png', mode: 'mipmap' }
  ];
  const loaded = {};
  let pending = jobs.length;

  function finishOne() {
    pending--;
    if (pending === 0) {
      texGrassFloor = loaded.grassFloor;
      texGrassBlockSide = loaded.grassSide;
      texDirtBlock = loaded.dirtBlock;
      texTreeBark = loaded.treeBark;
      texSky = loaded.sky;
      done();
    }
  }

  for (const job of jobs) {
    const img = new Image();
    img.onload = function () {
      const tex = gl.createTexture();
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      if (job.mode === 'npot') {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.generateMipmap(gl.TEXTURE_2D);
      }
      loaded[job.key] = tex;
      finishOne();
    };
    img.onerror = function () {
      console.error('Missing texture', job.url);
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d');
      let fill = '#3d8c2a';
      if (job.key === 'sky') fill = '#7ec0ff';
      else if (job.key === 'dirtBlock') fill = '#6b4f3a';
      else if (job.key === 'treeBark') fill = '#5c4030';
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, 64, 64);
      const tex = gl.createTexture();
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      loaded[job.key] = tex;
      finishOne();
    };
    img.src = job.url;
  }
}

function aabbOverlap(px0, px1, py0, py1, pz0, pz1, bx0, bx1, by0, by1, bz0, bz1) {
  if (px1 <= bx0 || px0 >= bx1) return false;
  if (py1 <= by0 || py0 >= by1) return false;
  if (pz1 <= bz0 || pz0 >= bz1) return false;
  return true;
}

function playerIntersectsWall(ex, ez, py0, py1) {
  const px0 = ex - PLAYER_HALF;
  const px1 = ex + PLAYER_HALF;
  const pz0 = ez - PLAYER_HALF;
  const pz1 = ez + PLAYER_HALF;
  const ix0 = Math.max(0, Math.floor(px0));
  const ix1 = Math.min(WORLD - 1, Math.floor(px1));
  const iz0 = Math.max(0, Math.floor(pz0));
  const iz1 = Math.min(WORLD - 1, Math.floor(pz1));
  for (let iz = iz0; iz <= iz1; iz++) {
    for (let ix = ix0; ix <= ix1; ix++) {
      const h = cellHeight(ix, iz);
      for (let y = 0; y < h; y++) {
        if (aabbOverlap(px0, px1, py0, py1, pz0, pz1, ix, ix + 1, y, y + 1, iz, iz + 1)) {
          return true;
        }
      }
    }
  }
  return false;
}

function pushTri(out, ax, ay, az, au, av, bx, by, bz, bu, bv, cx, cy, cz, cu, cv) {
  out.push(ax, ay, az, au, av, bx, by, bz, bu, bv, cx, cy, cz, cu, cv);
}

function pushFace(out, ox, oy, oz, face, u0, v0, u1, v1) {
  switch (face) {
    case 'px':
      pushTri(out, ox + 1, oy, oz, u1, v0, ox + 1, oy + 1, oz, u1, v1, ox + 1, oy + 1, oz + 1, u0, v1);
      pushTri(out, ox + 1, oy, oz, u1, v0, ox + 1, oy + 1, oz + 1, u0, v1, ox + 1, oy, oz + 1, u0, v0);
      break;
    case 'nx':
      pushTri(out, ox, oy, oz, u1, v0, ox, oy, oz + 1, u0, v0, ox, oy + 1, oz + 1, u0, v1);
      pushTri(out, ox, oy, oz, u1, v0, ox, oy + 1, oz + 1, u0, v1, ox, oy + 1, oz, u1, v1);
      break;
    case 'pz':
      pushTri(out, ox, oy, oz + 1, u0, v0, ox + 1, oy + 1, oz + 1, u1, v1, ox, oy + 1, oz + 1, u0, v1);
      pushTri(out, ox, oy, oz + 1, u0, v0, ox + 1, oy, oz + 1, u1, v0, ox + 1, oy + 1, oz + 1, u1, v1);
      break;
    case 'nz':
      pushTri(out, ox + 1, oy, oz, u0, v0, ox, oy + 1, oz, u1, v1, ox + 1, oy + 1, oz, u0, v1);
      pushTri(out, ox + 1, oy, oz, u0, v0, ox, oy, oz, u1, v0, ox, oy + 1, oz, u1, v1);
      break;
    case 'py':
      pushTri(out, ox, oy + 1, oz, u0, v0, ox + 1, oy + 1, oz + 1, u1, v1, ox + 1, oy + 1, oz, u1, v0);
      pushTri(out, ox, oy + 1, oz, u0, v0, ox, oy + 1, oz + 1, u0, v1, ox + 1, oy + 1, oz + 1, u1, v1);
      break;
    case 'ny':
      pushTri(out, ox, oy, oz, u1, v1, ox + 1, oy, oz, u0, v1, ox + 1, oy, oz + 1, u0, v0);
      pushTri(out, ox, oy, oz, u1, v1, ox + 1, oy, oz + 1, u0, v0, ox, oy, oz + 1, u1, v0);
      break;
    default:
      break;
  }
}

function rebuildWallMeshes() {
  const dirtOut = [];
  const grassSideOut = [];
  const fullU0 = 0;
  const fullV0 = 0;
  const fullU1 = 1;
  const fullV1 = 1;
  const capV0 = GRASS_SIDE_TOP_V0;
  const capV1 = GRASS_SIDE_TOP_V1;

  for (let z = 0; z < WORLD; z++) {
    for (let x = 0; x < WORLD; x++) {
      const h = wallMap[z][x];
      if (h === 0) continue;
      const topY = h - 1;
      for (let y = 0; y < h; y++) {
        const isTop = y === topY;
        const sidePx = cellHeight(x + 1, z) <= y;
        const sideNx = cellHeight(x - 1, z) <= y;
        const sidePz = cellHeight(x, z + 1) <= y;
        const sideNz = cellHeight(x, z - 1) <= y;
        const topPy = isTop;
        const bottomNy = y === 0;

        const emit = function (fname, exposed) {
          if (!exposed) return;
          if (isTop && (fname === 'px' || fname === 'nx' || fname === 'pz' || fname === 'nz')) {
            pushFace(grassSideOut, x, y, z, fname, fullU0, fullV0, fullU1, fullV1);
          } else if (isTop && fname === 'py') {
            pushFace(grassSideOut, x, y, z, 'py', fullU0, capV0, fullU1, capV1);
          } else {
            pushFace(dirtOut, x, y, z, fname, fullU0, fullV0, fullU1, fullV1);
          }
        };

        emit('px', sidePx);
        emit('nx', sideNx);
        emit('pz', sidePz);
        emit('nz', sideNz);
        emit('py', topPy);
        emit('ny', bottomNy);
      }
    }
  }

  function uploadInterleaved(existingBuffer, vertexData) {
    const f32 = new Float32Array(vertexData);
    const buf = existingBuffer || gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW);
    return { buf, count: f32.length / 5 };
  }

  const dirt = uploadInterleaved(wallDirtBuffer, dirtOut);
  wallDirtBuffer = dirt.buf;
  wallDirtCount = dirt.count;
  const grass = uploadInterleaved(wallGrassSideBuffer, grassSideOut);
  wallGrassSideBuffer = grass.buf;
  wallGrassSideCount = grass.count;
}

function rebuildTerrainBuffer() {
  const out = [];
  const Y = 0;
  for (let j = 0; j < WORLD; j++) {
    for (let i = 0; i < WORLD; i++) {
      const u00 = i / WORLD;
      const v00 = j / WORLD;
      const u10 = (i + 1) / WORLD;
      const v10 = j / WORLD;
      const u01 = i / WORLD;
      const v01 = (j + 1) / WORLD;
      const u11 = (i + 1) / WORLD;
      const v11 = (j + 1) / WORLD;
      pushTri(out, i, Y, j, u00, v00, i + 1, Y, j + 1, u11, v11, i + 1, Y, j, u10, v10);
      pushTri(out, i, Y, j, u00, v00, i, Y, j + 1, u01, v01, i + 1, Y, j + 1, u11, v11);
    }
  }
  const f32 = new Float32Array(out);
  if (!terrainBuffer) terrainBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, terrainBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW);
  terrainVertexCount = f32.length / 5;
}

function rebuildSkyBuffer() {
  const s = 1200;
  const cx = WORLD / 2;
  const cy = 12;
  const cz = WORLD / 2;
  const ox = cx - s / 2;
  const oy = cy - s / 2;
  const oz = cz - s / 2;
  const out = [];
  for (const f of ['px', 'nx', 'pz', 'nz', 'py', 'ny']) {
    pushFace(out, ox, oy, oz, f, 0, 0, 1, 1);
  }
  const f32 = new Float32Array(out);
  if (!skyBuffer) skyBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, skyBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW);
  skyVertexCount = f32.length / 5;
}

function makeUnitCubeBuffer() {
  const out = [];
  for (const f of ['px', 'nx', 'pz', 'nz', 'py', 'ny']) {
    pushFace(out, 0, 0, 0, f, 0, 0, 1, 1);
  }
  const f32 = new Float32Array(out);
  if (!unitCubeBuffer) unitCubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, unitCubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW);
  unitCubeCount = f32.length / 5;
}

function makeCreeperHeadBuffers() {
  const bodyFaces = [];
  for (const f of ['nx', 'px', 'nz', 'py', 'ny']) {
    pushFace(bodyFaces, 0, 0, 0, f, 0, 0, 1, 1);
  }
  const faceOnly = [];
  pushFace(faceOnly, 0, 0, 0, 'pz', 0, 0, 1, 1);
  let f32 = new Float32Array(bodyFaces);
  if (!creeperHead5Buffer) creeperHead5Buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, creeperHead5Buffer);
  gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW);
  creeperHead5Count = f32.length / 5;
  f32 = new Float32Array(faceOnly);
  if (!creeperHeadFaceBuffer) creeperHeadFaceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, creeperHeadFaceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW);
  creeperHeadFaceCount = f32.length / 5;
}

function rebuildGeometry() {
  makeUnitCubeBuffer();
  makeCreeperHeadBuffers();
  rebuildWallMeshes();
  rebuildTerrainBuffer();
  rebuildSkyBuffer();
}

function drawCubeUnit() {
  gl.uniform1i(u_SurfaceKind, 0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  bindInterleaved(unitCubeBuffer);
  gl.drawArrays(gl.TRIANGLES, 0, unitCubeCount);
}

function drawCreeperHead(modelM) {
  gl.uniform1i(u_SurfaceKind, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelM.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texDirtBlock);
  gl.uniform1i(u_Sampler, 0);
  gl.uniform4fv(u_BaseColor, CREEPER_HEAD_BODY);
  gl.uniform1f(u_TexColorWeight, 0);
  bindInterleaved(creeperHead5Buffer);
  gl.drawArrays(gl.TRIANGLES, 0, creeperHead5Count);
  gl.uniform4fv(u_BaseColor, WHITE);
  gl.uniform1f(u_TexColorWeight, 1);
  gl.bindTexture(gl.TEXTURE_2D, texCreeperFace);
  gl.uniform1i(u_Sampler, 0);
  bindInterleaved(creeperHeadFaceBuffer);
  gl.drawArrays(gl.TRIANGLES, 0, creeperHeadFaceCount);
}

function bindInterleaved(buffer) {
  const stride = 5 * Float32Array.BYTES_PER_ELEMENT;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
  gl.enableVertexAttribArray(a_TexCoord);
}

function drawBuffered(modelM, viewM, projM, buffer, count, texture, baseColor, texW, surfaceKind) {
  if (!buffer || count === 0) return;
  const sk = surfaceKind === undefined ? 0 : surfaceKind;
  gl.uniform1i(u_SurfaceKind, sk);
  if (sk === 1) {
    gl.uniform3f(u_SkyOrigin, WORLD * 0.5, 10.0, WORLD * 0.5);
  }
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelM.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewM.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projM.elements);
  gl.uniform4fv(u_BaseColor, baseColor);
  gl.uniform1f(u_TexColorWeight, texW);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(u_Sampler, 0);
  bindInterleaved(buffer);
  gl.drawArrays(gl.TRIANGLES, 0, count);
}

function setupInput() {
  document.addEventListener('keydown', (e) => {
    g_keys[e.code] = true;
    if (e.code === 'KeyF' || e.code === 'KeyV') e.preventDefault();
  });
  document.addEventListener('keyup', (e) => {
    g_keys[e.code] = false;
  });

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    g_pointerLocked = document.pointerLockElement === canvas;
  });

  canvas.addEventListener('mousedown', (ev) => {
    if (!g_pointerLocked) {
      g_mouseDragging = true;
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
    }
  });
  canvas.addEventListener('mouseup', () => {
    g_mouseDragging = false;
  });
  canvas.addEventListener('mouseleave', () => {
    g_mouseDragging = false;
  });

  document.addEventListener('mousemove', onMouseMove);
}

function onMouseMove(ev) {
  if (g_pointerLocked) {
    camera.panLeft(-ev.movementX * MOUSE_SENS);
    camera.tiltPitch(-ev.movementY * MOUSE_SENS);
    return;
  }
  if (!g_mouseDragging) return;
  const dx = ev.clientX - g_lastMouseX;
  const dy = ev.clientY - g_lastMouseY;
  g_lastMouseX = ev.clientX;
  g_lastMouseY = ev.clientY;
  camera.panLeft(-dx * MOUSE_SENS * 0.15);
  camera.tiltPitch(-dy * MOUSE_SENS * 0.15);
}

function targetCell() {
  const ex = camera.eye.elements[0];
  const ez = camera.eye.elements[2];
  const fx = camera.at.elements[0] - ex;
  const fz = camera.at.elements[2] - ez;
  const len = Math.hypot(fx, fz);
  if (len < 1e-4) return null;
  const nx = fx / len;
  const nz = fz / len;
  const gx = Math.floor(ex + nx * 1.8);
  const gz = Math.floor(ez + nz * 1.8);
  if (gx < 0 || gx >= WORLD || gz < 0 || gz >= WORLD) return null;
  return { gx, gz };
}

function tryEditBlocks() {
  const cell = targetCell();
  if (!cell) return;
  const border =
    cell.gx === 0 || cell.gz === 0 || cell.gx === WORLD - 1 || cell.gz === WORLD - 1;
  if (border) return;
  if (reservedForActors(cell.gx, cell.gz)) return;
  if (g_keys['KeyF']) {
    if (wallMap[cell.gz][cell.gx] < MAX_STACK) {
      wallMap[cell.gz][cell.gx]++;
      rebuildWallMeshes();
    }
    g_keys['KeyF'] = false;
  }
  if (g_keys['KeyV']) {
    if (wallMap[cell.gz][cell.gx] > 0) {
      wallMap[cell.gz][cell.gx]--;
      rebuildWallMeshes();
    }
    g_keys['KeyV'] = false;
  }
}

function updateQuest(seconds) {
  if (gameStartTime === null) gameStartTime = seconds;
  if (gameWon || gameLost) return;
  const left = QUEST_TIME_SEC - (seconds - gameStartTime);
  if (left <= 0) {
    gameLost = true;
    return;
  }
  const ex = camera.eye.elements[0];
  const ez = camera.eye.elements[2];
  const d = Math.hypot(ex - QUEST_TARGET.x, ez - QUEST_TARGET.z);
  if (d < QUEST_TARGET.radius) gameWon = true;
}

function updateHud(seconds) {
  const el = document.getElementById('hud-game');
  if (!el) return;
  if (gameWon) {
    el.textContent = 'You reached the old oak in time. The meadow is safe again.';
    return;
  }
  if (gameLost) {
    el.textContent = 'Time is up — the creeper heard you. Press F5 to try again.';
    return;
  }
  const left = Math.max(0, Math.ceil(QUEST_TIME_SEC - (seconds - (gameStartTime || seconds))));
  const ex = camera.eye.elements[0];
  const ez = camera.eye.elements[2];
  const d = Math.hypot(ex - QUEST_TARGET.x, ez - QUEST_TARGET.z).toFixed(1);
  el.textContent =
    'Quest: reach the voxel oak in the open glade before the timer hits zero. ' +
    'Timer: ' +
    left +
    's · Distance to oak: ' +
    d +
    ' blocks.';
}

function playerFeetTop(px, pz) {
  const fy = terrainHeightAtWorld(px, pz) + PLAYER_FEET_CLEAR;
  return { fy, top: fy + PLAYER_BODY_H };
}

function playerFitsAt(px, pz) {
  const y = playerFeetTop(px, pz);
  return !playerIntersectsWall(px, pz, y.fy, y.top);
}

function handleMovement() {
  const sx = camera.eye.elements[0];
  const sz = camera.eye.elements[2];

  if (g_keys['KeyW']) camera.moveForward(MOVE_SPEED);
  if (g_keys['KeyS']) camera.moveBackwards(MOVE_SPEED);
  if (g_keys['KeyA']) camera.moveLeft(MOVE_SPEED);
  if (g_keys['KeyD']) camera.moveRight(MOVE_SPEED);
  if (g_keys['KeyQ']) camera.panLeft(PAN_DEG);
  if (g_keys['KeyE']) camera.panRight(PAN_DEG);

  const nx = camera.eye.elements[0];
  const nz = camera.eye.elements[2];

  let ex = Math.max(0.35, Math.min(WORLD - 0.35, nx));
  let ez = Math.max(0.35, Math.min(WORLD - 0.35, nz));
  const rdx = ex - sx;
  const rdz = ez - sz;

  if (!playerFitsAt(ex, ez)) {
    ex = sx;
    ez = sz;
    if (playerFitsAt(sx + rdx, sz)) {
      ex = sx + rdx;
      ez = sz;
    } else if (playerFitsAt(sx, sz + rdz)) {
      ex = sx;
      ez = sz + rdz;
    }
  }

  camera.eye.elements[0] = ex;
  camera.eye.elements[2] = ez;
  camera.at.elements[0] += ex - sx;
  camera.at.elements[2] += ez - sz;

  const prevEyeY = camera.eye.elements[1];
  const gy = terrainHeightAtWorld(ex, ez) + 1.65;
  camera.eye.elements[1] = gy;
  camera.at.elements[1] += gy - prevEyeY;
  camera.updateView();
}

function tick() {
  const seconds = performance.now() * 0.001;
  handleMovement();
  tryEditBlocks();
  updateQuest(seconds);
  updateHud(seconds);

  const viewM = camera.viewMatrix;
  const projM = camera.projectionMatrix;
  const ident = new Matrix4();

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.depthMask(false);
  gl.disable(gl.CULL_FACE);
  drawBuffered(ident, viewM, projM, skyBuffer, skyVertexCount, texSky, SKY_TINT, 0.35, 1);
  gl.enable(gl.CULL_FACE);
  gl.depthMask(true);

  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1, 1);
  drawBuffered(ident, viewM, projM, terrainBuffer, terrainVertexCount, texGrassFloor, GRASS_TINT, 1.0, 2);
  gl.disable(gl.POLYGON_OFFSET_FILL);

  drawBuffered(ident, viewM, projM, wallDirtBuffer, wallDirtCount, texDirtBlock, WHITE, 1.0, 0);
  drawBuffered(ident, viewM, projM, wallGrassSideBuffer, wallGrassSideCount, texGrassBlockSide, WHITE, 1.0, 0);

  renderWorldActors(
    seconds,
    terrainHeightAt,
    texTreeBark,
    texGrassFloor,
    texDirtBlock,
    drawCubeUnit,
    drawCreeperHead
  );

  requestAnimationFrame(tick);
}
