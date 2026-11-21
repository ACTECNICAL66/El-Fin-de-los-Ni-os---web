/* ==========================================================================
 * NEUN 3D Articulated Robotics Engine v5.0
 * Pure WebGL · Zero External Dependencies · Exact 3-DOF Analytical Spider IK
 * Supports:
 *   - NEUN3D03 binary articulated STL (.bin) auto-load + drag/drop/file picker
 *   - Raw Binary & ASCII .stl auto-segmentation loader
 *   - CAD-matched NEUN procedural fallback mesh (until .bin/.stl is loaded)
 *   - True Zero-Slip World-Space Gait Engine for all 18 NEUN modes
 *   - Live sync with Panel (app.js): telemetry d.servos, IMU, joysticks, sliders
 * ========================================================================== */
(function () {
  'use strict';

  const MODEL_URLS = [
    './neun_model.bin'
  ];
  const SCALE = 0.01; // 100 mm = 1.0 scene unit
  const DEFAULT_MODEL_CENTER = [47.3447, -55.4999, 37.6298];

  // Servo sign convention verified directly against NEUN CAD (image-2.png & image-1.png):
  //  - All 4 Coxas upright (+Z shaft): +1 (+deg = CCW from above)
  //  - Front legs (FL, FR): F/T horns on FRONT (+X) face -> FL=[+1,+1], FR=[-1,-1]
  //  - Rear legs  (RL, RR): F/T horns on BACK  (-X) face -> RL=[-1,-1], RR=[+1,+1]
  const SERVO_SIGN = [
    [ 1,  1,  1], // FL (0, CH 0-2)
    [ 1, -1, -1], // RL (1, CH 3-5)
    [ 1, -1, -1], // FR (2, CH 6-8)
    [ 1,  1,  1]  // RR (3, CH 9-11)
  ];

  const LEG_NAMES = ['FL', 'RL', 'FR', 'RR'];

  const MODE_LABELS = {
    STAND:      'Stand · postura estable',
    WALK_FWD:   'Marcha Creep · 4 fases',
    TROT:       'Trote diagonal',
    CRAWL:      'Gateo sigiloso',
    TURN_LEFT:  'Giro antihorario',
    TURN_RIGHT: 'Giro horario',
    CRAB_LEFT:  'Cangrejo izquierda',
    CRAB_RIGHT: 'Cangrejo derecha',
    TILT:       'Balanceo 3D (IK cuerpo)',
    DANCE:      'Rutina de baile',
    SENTRY:     'Centinela · escaneo',
    EXPLORE:    'Exploración autónoma',
    SPIRAL:     'Trayectoria espiral',
    JUMP:       'Salto impulsado',
    WAVE:       'Saludo frontal',
    PUSHUP:     'Flexiones cinemáticas',
    ELEVATE:    'Ascenso y descenso · sube y baja',
    FOLLOW:     'Seguimiento activo',
    SLEEP:      'Reposo plegado'
  };

  // DOM helpers
  const getCanvas = () => document.getElementById('neun3dCanvas');
  const getStateLabel = () => document.getElementById('neun3dState');

  // WebGL state
  let gl = null;
  let meshProg = null;
  let floorProg = null;
  let solidProg = null;
  let width = 1;
  let height = 1;
  let raf = 0;

  // Geometry state
  let meshes = [];
  let legKinematics = [null, null, null, null];
  let modelSourceType = 'none'; // 'bin' | 'stl' | 'procedural'
  let modelSourceLabel = '';
  let chassisElevation = 0.56;  // lifts neutral standing feet to Y = 0
  let chassisBottomCadY = -0.20;
  let modelRadius = 1.6;
  let floorQuadBuf = null;
  let discBuf = null;
  let ringBuf = null;
  let arrowBuf = null;
  let coneBuf = null;

  // Camera state (smoothly damped orbit + follow)
  let orbitYaw = 0.72;
  let orbitPitch = 0.44;
  let distance = 4.6;
  let targetYaw = 0.72;
  let targetPitch = 0.44;
  let targetDistance = 4.6;
  let camTargetX = 0;
  let camTargetY = 0.38;
  let camTargetZ = 0;
  let followCamera = true;
  let pointer = null;
  const activePointers = new Map();
  let pinchDistance = 0;

  // Control & Simulation state
  const heldControls = new Set();
  let robotMode = 'STAND';          // One of the 18 NEUN modes
  let demoRunning = false;          // Demo play button state
  let demoGait = 'WALK_FWD';        // Selected gait for demo ('WALK_FWD' | 'TROT' | 'CRAWL' | ...)
  let angleSource = 'auto';         // 'auto' | 'kinematics' | 'hardware'
  let manualJointMode = false;
  let emergencyStopped = false;
  let headlightsOn = false;
  let headlightIntensity = 0.8;
  let hardwareConnected = false;
  let hardwareServos = null;
  let hardwareServosTimestamp = 0;
  let imuPitchRad = 0;
  let imuRollRad = 0;
  let imuYawRad = 0;
  let useImuOnStand = true;

  // External drive from panel (joystick / D-pad / rotation)
  let extDriveFwd = 0;
  let extDriveStrafe = 0;
  let extDriveTurn = 0;
  let extDriveUntil = 0;

  // Kinematics & World state
  let simulationSpeed = 0.55; // 0.15 .. 1.0
  let userHeightOffset = 0;   // Smoothed current vertical ride-height offset
  let userHeightTarget = 0;   // Target vertical ride-height offset (Subir / Bajar)
  let userTiltPitch = 0;      // Manual chassis pitch offset (-0.24..+0.24 rad)
  let userTiltRoll = 0;       // Manual chassis roll offset (-0.24..+0.24 rad)
  let heightHoldDir = 0;      // -1 (down), 0 (idle), +1 (up) while button held
  let heightHoldStart = 0;
  let simTime = 0;
  let modeClock = 0;
  let lastSpecialMode = 'STAND';
  let gaitPhase = 0;
  let lastFrameTime = 0;
  let exploreTimer = 0;
  let exploreTurnTarget = 0;
  let exploreTurnCurrent = 0;

  // Body world pose (on Y=0 floor)
  let bodyX = 0;
  let bodyZ = 0;
  let bodyHeading = 0; // radians around +Y (0 = facing +X)

  // Body local dynamic offset (COG shift, pitch, roll, heave, twist)
  let bodyShiftX = 0;
  let bodyShiftY = 0;
  let bodyShiftZ = 0;
  let bodyPitch = 0;
  let bodyRoll = 0;
  let bodyTwist = 0;

  // Joint angles & angular velocities (2nd-order critically damped filter, 1:1 with ESP32-S3!)
  let targetJointRad = Array.from({ length: 4 }, () => [0, 0, 0]);
  let shownJointRad = Array.from({ length: 4 }, () => [0, 0, 0]);
  let jointVelRad = Array.from({ length: 4 }, () => [0, 0, 0]);
  // Equivalent servo degrees [0..180]
  let currentServoDeg = Array.from({ length: 4 }, () => [90, 90, 90]);
  // Per-leg stance contact flag & foot world position (computed by exact FK!)
  let legInStance = [true, true, true, true];
  let footWorldPos = Array.from({ length: 4 }, () => [0, 0, 0]);
  let strideScale = 0;
  let isMirroringHardware = false;
  let hardwareBootSource = '';
  let hardwareRawServos = Array.from({ length: 4 }, () => [90, 90, 90]);
  let hardwareCenters = Array.from({ length: 4 }, () => [90, 90, 90]);
  let hardwareDirs = [
    [1, 1, 1],
    [1, -1, -1],
    [1, -1, -1],
    [1, 1, 1]
  ];
  let hardwareCalibrated = false;
  let calDrawerOpen = false;
  let calSliderActiveAt = 0;
  let calSendTimers = {};
  let lastJointSliderDragAt = 0;

  let modelStatus = 'Inicializando motor 3D…';
  let loadStarted = false;
  let lastHudSync = 0;

  // ========================================================================
  // SHADERS (3-Point Studio Metallic PBR-like + Infinite Procedural Floor)
  // ========================================================================
  const MESH_VS = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uMvp;
    uniform mat4 uModel;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    void main() {
      vec4 world = uModel * vec4(aPosition, 1.0);
      vWorldPos = world.xyz;
      vNormal = normalize(mat3(uModel) * aNormal);
      gl_Position = uMvp * vec4(aPosition, 1.0);
    }
  `;

  const MESH_FS = `
    precision mediump float;
    uniform vec3 uColor;
    uniform vec3 uEyePos;
    uniform float uSpecStrength;
    uniform float uShininess;
    uniform float uEmissive;
    uniform float uEmergency;
    varying vec3 vNormal;
    varying vec3 vWorldPos;

    void main() {
      vec3 n = normalize(vNormal);
      if (!gl_FrontFacing) n = -n;
      vec3 v = normalize(uEyePos - vWorldPos);

      // 3-point studio lighting
      vec3 lKey = normalize(vec3(0.45, 0.88, 0.42));
      vec3 lFill = normalize(vec3(-0.72, 0.38, -0.58));
      vec3 lRim = normalize(vec3(-0.15, 0.25, -0.95));

      float diffKey = max(dot(n, lKey), 0.0);
      float diffFill = max(dot(n, lFill), 0.0);
      float diffRim = max(dot(n, lRim), 0.0);

      // Blinn-Phong specular
      vec3 hKey = normalize(lKey + v);
      vec3 hFill = normalize(lFill + v);
      float specKey = pow(max(dot(n, hKey), 0.0), uShininess) * uSpecStrength;
      float specFill = pow(max(dot(n, hFill), 0.0), uShininess * 0.6) * (uSpecStrength * 0.35);

      // Fresnel edge accent & subtle height ambient occlusion
      float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);
      float hemi = 0.5 + 0.5 * n.y;
      float ao = clamp(0.62 + vWorldPos.y * 0.42, 0.55, 1.05);

      vec3 ambient = mix(vec3(0.08, 0.11, 0.17), vec3(0.26, 0.31, 0.39), hemi) * ao;
      vec3 keyCol = vec3(1.00, 0.98, 0.95) * diffKey * 0.78;
      vec3 fillCol = vec3(0.24, 0.68, 0.88) * diffFill * 0.30;
      vec3 rimCol = vec3(0.95, 0.22, 0.38) * (diffRim * 0.14 + fresnel * 0.22);

      vec3 lit = uColor * (ambient + keyCol + fillCol + uEmissive)
               + vec3(1.0, 0.99, 0.97) * specKey
               + vec3(0.35, 0.85, 1.0) * specFill
               + rimCol;

      if (uEmergency > 0.5) {
        lit = mix(lit, vec3(1.0, 0.12, 0.22), 0.22);
      }

      // Mild tone-mapping
      lit = lit / (lit + vec3(0.18));
      gl_FragColor = vec4(lit, 1.0);
    }
  `;

  // Infinite anti-aliased cyber floor grid (anchored in world space!)
  const FLOOR_VS = `
    attribute vec3 aPosition;
    uniform mat4 uVp;
    uniform vec3 uCenter;
    varying vec3 vWorldPos;
    varying vec2 vLocal;
    void main() {
      vec3 world = vec3(aPosition.x + uCenter.x, 0.0, aPosition.z + uCenter.z);
      vWorldPos = world;
      vLocal = aPosition.xz;
      gl_Position = uVp * vec4(world, 1.0);
    }
  `;

  const FLOOR_FS = `
    precision mediump float;
    varying vec3 vWorldPos;
    varying vec2 vLocal;
    uniform vec2 uRobotXZ;

    float gridLine(vec2 coord, float stepSize, float thickness) {
      vec2 p = abs(fract(coord / stepSize - 0.5) - 0.5) / (thickness / stepSize);
      float d = min(p.x, p.y);
      return 1.0 - clamp(d, 0.0, 1.0);
    }

    void main() {
      float distFromRobot = length(vWorldPos.xz - uRobotXZ);
      float fade = 1.0 - smoothstep(2.6, 8.8, distFromRobot);
      if (fade <= 0.002) discard;

      float minor = gridLine(vWorldPos.xz, 0.35, 0.009) * 0.22;
      float major = gridLine(vWorldPos.xz, 1.40, 0.015) * 0.42;

      // Subtle concentric distance rings around robot
      float ring1 = smoothstep(0.025, 0.0, abs(distFromRobot - 1.35)) * 0.22;
      float ring2 = smoothstep(0.028, 0.0, abs(distFromRobot - 2.60)) * 0.14;

      // Subtle origin axes cross
      float axisX = smoothstep(0.018, 0.0, abs(vWorldPos.z)) * smoothstep(5.0, 0.0, abs(vWorldPos.x)) * 0.22;
      float axisZ = smoothstep(0.018, 0.0, abs(vWorldPos.x)) * smoothstep(5.0, 0.0, abs(vWorldPos.z)) * 0.22;

      vec3 baseCol = vec3(0.032, 0.048, 0.078);
      vec3 gridCol = vec3(0.16, 0.68, 0.85);
      vec3 col = baseCol
        + gridCol * (minor + major + ring1 + ring2)
        + vec3(0.95, 0.22, 0.36) * axisX
        + vec3(0.20, 0.86, 0.65) * axisZ;

      float alpha = clamp((0.55 + minor + major + ring1 + ring2) * fade, 0.0, 0.92);
      gl_FragColor = vec4(col, alpha);
    }
  `;

  // Simple solid / radial-gradient overlay shader (shadows, foot contact rings, heading arrow, headlight cone)
  const SOLID_VS = `
    attribute vec3 aPosition;
    uniform mat4 uMvp;
    varying vec2 vLocalXZ;
    void main() {
      vLocalXZ = aPosition.xz;
      gl_Position = uMvp * vec4(aPosition, 1.0);
    }
  `;

  const SOLID_FS = `
    precision mediump float;
    uniform vec4 uColor;
    uniform float uRadialFalloff;
    varying vec2 vLocalXZ;
    void main() {
      float a = uColor.a;
      if (uRadialFalloff > 0.5) {
        float r = length(vLocalXZ);
        a *= smoothstep(1.0, 0.12, r);
      }
      if (a <= 0.004) discard;
      gl_FragColor = vec4(uColor.rgb, a);
    }
  `;

  // ========================================================================
  // MATH UTILITIES (Column-Major 4x4 Matrices & Vector Ops)
  // ========================================================================
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (e0, e1, x) => {
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  };

  function v3Cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }
  function v3Dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function v3Norm(v) {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }
  function v3Sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function v3Dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }

  function m4Identity() {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }
  function m4Multiply(a, b) {
    const out = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      const bc0 = b[c * 4], bc1 = b[c * 4 + 1], bc2 = b[c * 4 + 2], bc3 = b[c * 4 + 3];
      for (let r = 0; r < 4; r++) {
        out[c * 4 + r] = a[r] * bc0 + a[4 + r] * bc1 + a[8 + r] * bc2 + a[12 + r] * bc3;
      }
    }
    return out;
  }
  function m4Translate(x, y, z) {
    const m = m4Identity();
    m[12] = x; m[13] = y; m[14] = z;
    return m;
  }
  function m4Scale(sx, sy, sz) {
    const m = m4Identity();
    m[0] = sx; m[5] = sy; m[10] = sz;
    return m;
  }
  function m4RotateX(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  }
  function m4RotateY(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
  }
  function m4RotateZ(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }
  function m4RotateAxis(axis, a) {
    const l = Math.hypot(axis[0], axis[1], axis[2]) || 1;
    const x = axis[0] / l, y = axis[1] / l, z = axis[2] / l;
    const c = Math.cos(a), s = Math.sin(a), t = 1 - c;
    return new Float32Array([
      t * x * x + c,     t * x * y + s * z, t * x * z - s * y, 0,
      t * x * y - s * z, t * y * y + c,     t * y * z + s * x, 0,
      t * x * z + s * y, t * y * z - s * x, t * z * z + c,     0,
      0, 0, 0, 1
    ]);
  }
  function m4Around(pivot, rotMat) {
    return m4Multiply(
      m4Translate(pivot[0], pivot[1], pivot[2]),
      m4Multiply(rotMat, m4Translate(-pivot[0], -pivot[1], -pivot[2]))
    );
  }
  function m4TransformPoint(m, p) {
    return [
      m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
      m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
      m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]
    ];
  }
  function m4Perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ]);
  }
  function m4LookAt(eye, target, up) {
    let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
    let n = Math.hypot(zx, zy, zz) || 1; zx /= n; zy /= n; zz /= n;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    n = Math.hypot(xx, xy, xz) || 1; xx /= n; xy /= n; xz /= n;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
      -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
      -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1
    ]);
  }

  // ========================================================================
  // WEBGL PROGRAM & PRIMITIVE BUFFER HELPERS
  // ========================================================================
  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const err = gl.getShaderInfoLog(shader) || 'Shader compile error';
      gl.deleteShader(shader);
      throw new Error(err);
    }
    return shader;
  }

  function linkProgram(vsSrc, fsSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, compileShader(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(p, compileShader(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p) || 'Shader link error');
    }
    return p;
  }

  function initStaticBuffers() {
    // Floor quad (-10..+10 XZ)
    const f = 10.0;
    floorQuadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, floorQuadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -f, 0, -f,  f, 0, -f,  f, 0, f,
      -f, 0, -f,  f, 0,  f, -f, 0, f
    ]), gl.STATIC_DRAW);

    // Unit disc (radius 1 in XZ)
    const segs = 28;
    const discVerts = [];
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      discVerts.push(0, 0, 0, Math.cos(a0), 0, Math.sin(a0), Math.cos(a1), 0, Math.sin(a1));
    }
    discBuf = { buf: gl.createBuffer(), count: discVerts.length / 3 };
    gl.bindBuffer(gl.ARRAY_BUFFER, discBuf.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(discVerts), gl.STATIC_DRAW);

    // Unit ring (inner 0.72, outer 1.0 in XZ)
    const ringVerts = [];
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0);
      const c1 = Math.cos(a1), s1 = Math.sin(a1);
      const ir = 0.72;
      ringVerts.push(
        c0 * ir, 0, s0 * ir,  c0, 0, s0,  c1, 0, s1,
        c0 * ir, 0, s0 * ir,  c1, 0, s1,  c1 * ir, 0, s1 * ir
      );
    }
    ringBuf = { buf: gl.createBuffer(), count: ringVerts.length / 3 };
    gl.bindBuffer(gl.ARRAY_BUFFER, ringBuf.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ringVerts), gl.STATIC_DRAW);

    // Forward ground chevron arrow pointing +X
    arrowBuf = { buf: gl.createBuffer(), count: 6 };
    gl.bindBuffer(gl.ARRAY_BUFFER, arrowBuf.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
       0.24, 0,  0.00,  0.00, 0, -0.15,  0.07, 0,  0.00,
       0.24, 0,  0.00,  0.07, 0,  0.00,  0.00, 0,  0.15
    ]), gl.STATIC_DRAW);

    // Subtle headlight floor beam trapezoid (+X)
    coneBuf = { buf: gl.createBuffer(), count: 6 };
    gl.bindBuffer(gl.ARRAY_BUFFER, coneBuf.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0, 0, -0.16,  1.65, 0, -0.68,  1.65, 0, 0.68,
      0.0, 0, -0.16,  1.65, 0,  0.68,  0.0,  0, 0.16
    ]), gl.STATIC_DRAW);
  }

  // ========================================================================
  // MESH NORMAL COMPUTATION (Outward Signed-Volume + Crease-Aware Smoothing)
  // ========================================================================
  function buildOutwardCreaseNormals(pos, faceCount) {
    const faceNormals = new Float32Array(faceCount * 3);
    let signedVol = 0;

    for (let f = 0; f < faceCount; f++) {
      const b = f * 9;
      const x0 = pos[b], y0 = pos[b + 1], z0 = pos[b + 2];
      const x1 = pos[b + 3], y1 = pos[b + 4], z1 = pos[b + 5];
      const x2 = pos[b + 6], y2 = pos[b + 7], z2 = pos[b + 8];
      // Signed tetrahedron volume (6*V)
      signedVol += x0 * (y1 * z2 - z1 * y2)
                 + y0 * (z1 * x2 - x1 * z2)
                 + z0 * (x1 * y2 - y1 * x2);
      const abx = x1 - x0, aby = y1 - y0, abz = z1 - z0;
      const acx = x2 - x0, acy = y2 - y0, acz = z2 - z0;
      let nx = aby * acz - abz * acy;
      let ny = abz * acx - abx * acz;
      let nz = abx * acy - aby * acx;
      const len = Math.hypot(nx, ny, nz) || 1;
      faceNormals[f * 3] = nx / len;
      faceNormals[f * 3 + 1] = ny / len;
      faceNormals[f * 3 + 2] = nz / len;
    }

    // If mesh winding is inverted (negative volume), flip all face normals outward
    const flip = signedVol < -1e-7 ? -1 : 1;
    if (flip < 0) {
      for (let i = 0; i < faceNormals.length; i++) faceNormals[i] = -faceNormals[i];
    }

    const norm = new Float32Array(faceCount * 9);
    // For huge meshes, flat outward normals are fast & razor-sharp; for <= 25000 faces, do fast crease smoothing
    if (faceCount <= 25000) {
      const buckets = new Map();
      const q = v => Math.round(v * 2000);
      for (let f = 0; f < faceCount; f++) {
        for (let v = 0; v < 3; v++) {
          const i = f * 9 + v * 3;
          const key = `${q(pos[i])},${q(pos[i + 1])},${q(pos[i + 2])}`;
          let list = buckets.get(key);
          if (!list) { list = []; buckets.set(key, list); }
          list.push(f);
        }
      }
      const creaseCos = 0.78; // ~38 deg crease angle: smooth curves, crisp bevels
      for (let f = 0; f < faceCount; f++) {
        const fnx = faceNormals[f * 3], fny = faceNormals[f * 3 + 1], fnz = faceNormals[f * 3 + 2];
        for (let v = 0; v < 3; v++) {
          const i = f * 9 + v * 3;
          const key = `${q(pos[i])},${q(pos[i + 1])},${q(pos[i + 2])}`;
          const list = buckets.get(key);
          let sx = fnx, sy = fny, sz = fnz;
          if (list && list.length > 1 && list.length <= 24) {
            sx = 0; sy = 0; sz = 0;
            for (let k = 0; k < list.length; k++) {
              const nf = list[k] * 3;
              const onx = faceNormals[nf], ony = faceNormals[nf + 1], onz = faceNormals[nf + 2];
              if (fnx * onx + fny * ony + fnz * onz >= creaseCos) {
                sx += onx; sy += ony; sz += onz;
              }
            }
          }
          const l = Math.hypot(sx, sy, sz) || 1;
          norm[i] = sx / l; norm[i + 1] = sy / l; norm[i + 2] = sz / l;
        }
      }
    } else {
      for (let f = 0; f < faceCount; f++) {
        const nx = faceNormals[f * 3], ny = faceNormals[f * 3 + 1], nz = faceNormals[f * 3 + 2];
        for (let v = 0; v < 3; v++) {
          const i = f * 9 + v * 3;
          norm[i] = nx; norm[i + 1] = ny; norm[i + 2] = nz;
        }
      }
    }
    return norm;
  }

  function materialFor(segment, accent) {
    if (accent === 'sensor')   return { color: [0.08, 0.14, 0.22], spec: 0.90, shininess: 48, emissive: 0.12 };
    if (accent === 'led')      return { color: [0.10, 0.85, 0.94], spec: 0.40, shininess: 24, emissive: 0.72 };
    if (accent === 'claw')     return { color: [0.13, 0.15, 0.19], spec: 0.32, shininess: 18, emissive: 0.00 };
    if (segment === 1)         return { color: [0.14, 0.23, 0.35], spec: 0.42, shininess: 26, emissive: 0.00 }; // hip bracket
    if (segment === 2)         return { color: [0.23, 0.40, 0.56], spec: 0.52, shininess: 32, emissive: 0.00 }; // movable coxa
    if (segment === 3)         return { color: [0.84, 0.85, 0.88], spec: 0.68, shininess: 42, emissive: 0.00 }; // femur alloy
    if (segment === 4)         return { color: [0.82, 0.12, 0.22], spec: 0.62, shininess: 36, emissive: 0.02 }; // tibia NEUN red
    return                            { color: [0.48, 0.52, 0.58], spec: 0.58, shininess: 34, emissive: 0.00 }; // chassis graphite-silver
  }

  // ========================================================================
  // PARSER 1: NEUN3D03 ARTICULATED BINARY (.bin)
  // ========================================================================
  function parseNeunBin(buffer) {
    const view = new DataView(buffer);
    if (buffer.byteLength < 10) throw new Error('Archivo .bin demasiado pequeño');
    const magic = String.fromCharCode(...new Uint8Array(buffer, 0, 8));
    if (magic !== 'NEUN3D03') throw new Error('Formato .bin no reconocido (se esperaba NEUN3D03)');
    const count = view.getUint16(8, true);
    let offset = 10;
    const rawParts = [];

    for (let i = 0; i < count; i++) {
      const componentId = view.getUint16(offset, true); offset += 2;
      const leg = view.getUint8(offset++);
      const segment = view.getUint8(offset++);
      const faceCount = view.getUint32(offset, true); offset += 4;
      const meta = [];
      for (let j = 0; j < 27; j++, offset += 4) meta.push(view.getFloat32(offset, true));
      const rawVerts = new Float32Array(faceCount * 9);
      for (let k = 0; k < faceCount * 9; k++, offset += 4) {
        rawVerts[k] = view.getFloat32(offset, true);
      }
      rawParts.push({ componentId, leg, segment, faceCount, meta, rawVerts });
    }
    if (offset !== buffer.byteLength) {
      throw new Error('El archivo neun_model.bin está incompleto');
    }

    // Auto-detect center from chassis (segment 0) & true right-handed orientation from FL/RL/FR/RR hips!
    let cx = DEFAULT_MODEL_CENTER[0], cy = DEFAULT_MODEL_CENTER[1], cz = DEFAULT_MODEL_CENTER[2];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    let bodyVerts = 0;
    for (const p of rawParts) {
      if (p.segment === 0) {
        for (let k = 0; k < p.rawVerts.length; k += 3) {
          const vx = p.rawVerts[k], vy = p.rawVerts[k + 1], vz = p.rawVerts[k + 2];
          if (vx < minX) minX = vx; if (vx > maxX) maxX = vx;
          if (vy < minY) minY = vy; if (vy > maxY) maxY = vy;
          if (vz < minZ) minZ = vz; if (vz > maxZ) maxZ = vz;
          bodyVerts++;
        }
      }
    }
    if (bodyVerts > 0) {
      cx = (minX + maxX) * 0.5;
      cy = (minY + maxY) * 0.5;
      cz = (minZ + maxZ) * 0.5;
    }

    // Check leg hip CAD coordinates to enforce: Front = +X, Up = +Y, Left (FL/RL) = -Z, Right (FR/RR) = +Z
    const hipByLeg = [null, null, null, null];
    for (const p of rawParts) {
      if (p.leg <= 3 && p.segment === 4) hipByLeg[p.leg] = p.meta.slice(9, 12);
    }
    if (hipByLeg[0] && hipByLeg[1] && hipByLeg[2] && hipByLeg[3]) {
      // Center X/Y right at the exact 4-hip support centroid so turns pivot cleanly!
      cx = (hipByLeg[0][0] + hipByLeg[1][0] + hipByLeg[2][0] + hipByLeg[3][0]) * 0.25;
      cy = (hipByLeg[0][1] + hipByLeg[1][1] + hipByLeg[2][1] + hipByLeg[3][1]) * 0.25;
    }
    let signX = 1;
    let signZ = -1; // standard Blender right-handed Z-up -> WebGL Y-up: (x, y, z) -> (x, z, -y)
    if (hipByLeg[0] && hipByLeg[1]) {
      signX = (hipByLeg[0][0] >= hipByLeg[1][0]) ? 1 : -1;
    }
    if (hipByLeg[0] && hipByLeg[2]) {
      // Want FL (leg 0) at negative WebGL Z (-Z = Left) and FR (leg 2) at positive WebGL Z (+Z = Right)
      signZ = (hipByLeg[0][1] >= hipByLeg[2][1]) ? -1 : 1;
    }

    const mapPt = (x, y, z) => [
      signX * (x - cx) * SCALE,
      (z - cz) * SCALE,
      signZ * (y - cy) * SCALE
    ];
    const mapVec = (v) => [signX * v[0], v[2], signZ * v[1]];

    const parts = rawParts.map(rp => {
      const pos = new Float32Array(rp.faceCount * 9);
      for (let k = 0; k < rp.faceCount * 9; k += 3) {
        const pt = mapPt(rp.rawVerts[k], rp.rawVerts[k + 1], rp.rawVerts[k + 2]);
        pos[k] = pt[0]; pos[k + 1] = pt[1]; pos[k + 2] = pt[2];
      }
      const norm = buildOutwardCreaseNormals(pos, rp.faceCount);
      return {
        componentId: rp.componentId,
        leg: rp.leg,
        segment: rp.segment,
        faceCount: rp.faceCount,
        pos,
        norm,
        pivots: rp.leg <= 3 ? {
          hip: mapPt(rp.meta[9], rp.meta[10], rp.meta[11]),
          femurPivot: mapPt(rp.meta[12], rp.meta[13], rp.meta[14]),
          knee: mapPt(rp.meta[15], rp.meta[16], rp.meta[17]),
          foot: mapPt(rp.meta[18], rp.meta[19], rp.meta[20]),
          femurAxis: mapVec(rp.meta.slice(21, 24)),
          tibiaAxis: mapVec(rp.meta.slice(24, 27))
        } : null
      };
    });

    return parts;
  }

  // ========================================================================
  // PARSER 2: RAW BINARY OR ASCII .STL WITH AUTO-SEGMENTATION
  // ========================================================================
  function parseRawSTL(buffer) {
    const bytes = new Uint8Array(buffer);
    let triangles = [];

    // Detect binary vs ASCII STL
    let isBinary = false;
    if (buffer.byteLength >= 84) {
      const view = new DataView(buffer);
      const triCount = view.getUint32(80, true);
      if (84 + triCount * 50 === buffer.byteLength && triCount > 0) {
        isBinary = true;
        triangles = new Float32Array(triCount * 9);
        let off = 84;
        for (let i = 0; i < triCount; i++) {
          off += 12; // skip normal
          for (let k = 0; k < 9; k++, off += 4) {
            triangles[i * 9 + k] = view.getFloat32(off, true);
          }
          off += 2; // attr byte count
        }
      }
    }

    if (!isBinary) {
      const text = new TextDecoder('utf-8').decode(bytes);
      const regex = /vertex\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/g;
      const verts = [];
      let m;
      while ((m = regex.exec(text)) !== null) {
        verts.push(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
      }
      if (verts.length < 9) throw new Error('No se encontraron triángulos válidos en el STL');
      triangles = new Float32Array(verts.length - (verts.length % 9));
      for (let i = 0; i < triangles.length; i++) triangles[i] = verts[i];
    }

    const faceCount = triangles.length / 9;
    // Compute overall bounds to center & normalize scale (~3.0 units wide)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < triangles.length; i += 3) {
      const x = triangles[i], y = triangles[i + 1], z = triangles[i + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    const spanX = maxX - minX, spanY = maxY - minY, spanZ = maxZ - minZ;
    const maxSpan = Math.max(spanX, spanY, spanZ) || 1;
    // Auto scale so total span matches ~3.6 scene units (NEUN is ~360mm wide)
    const scale = maxSpan > 30 ? SCALE : (3.6 / maxSpan);
    const cx = (minX + maxX) * 0.5, cy = (minY + maxY) * 0.5, cz = (minZ + maxZ) * 0.5;

    // Split connected triangle shells using Union-Find on quantized vertices
    const parent = new Int32Array(faceCount);
    for (let i = 0; i < faceCount; i++) parent[i] = i;
    const find = a => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
    const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };

    const vMap = new Map();
    const qStep = maxSpan / 4000;
    const qk = (x, y, z) => `${Math.round(x / qStep)},${Math.round(y / qStep)},${Math.round(z / qStep)}`;
    for (let f = 0; f < faceCount; f++) {
      for (let v = 0; v < 3; v++) {
        const i = f * 9 + v * 3;
        const key = qk(triangles[i], triangles[i + 1], triangles[i + 2]);
        const prev = vMap.get(key);
        if (prev === undefined) vMap.set(key, f);
        else union(prev, f);
      }
    }

    const groups = new Map();
    for (let f = 0; f < faceCount; f++) {
      const r = find(f);
      let arr = groups.get(r);
      if (!arr) { arr = []; groups.set(r, arr); }
      arr.push(f);
    }

    // Build shell bounds in right-handed WebGL coords (CAD X->+X, Z->+Y, Y->-Z)
    const shells = [];
    groups.forEach((faces) => {
      let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity, sMinZ = Infinity, sMaxZ = -Infinity;
      const pos = new Float32Array(faces.length * 9);
      for (let idx = 0; idx < faces.length; idx++) {
        const f = faces[idx];
        for (let v = 0; v < 3; v++) {
          const src = f * 9 + v * 3;
          const dst = idx * 9 + v * 3;
          const wx = (triangles[src] - cx) * scale;
          const wy = (triangles[src + 2] - cz) * scale;
          const wz = -(triangles[src + 1] - cy) * scale;
          pos[dst] = wx; pos[dst + 1] = wy; pos[dst + 2] = wz;
          if (wx < sMinX) sMinX = wx; if (wx > sMaxX) sMaxX = wx;
          if (wy < sMinY) sMinY = wy; if (wy > sMaxY) sMaxY = wy;
          if (wz < sMinZ) sMinZ = wz; if (wz > sMaxZ) sMaxZ = wz;
        }
      }
      shells.push({
        pos,
        faceCount: faces.length,
        min: [sMinX, sMinY, sMinZ],
        max: [sMaxX, sMaxY, sMaxZ],
        center: [(sMinX + sMaxX) * 0.5, (sMinY + sMaxY) * 0.5, (sMinZ + sMaxZ) * 0.5],
        size: [sMaxX - sMinX, sMaxY - sMinY, sMaxZ - sMinZ]
      });
    });

    // Identify central body shell(s) vs 4 leg quadrants
    shells.sort((a, b) => (b.size[0] * b.size[1] * b.size[2]) - (a.size[0] * a.size[1] * a.size[2]));
    const mainBody = shells[0];
    const bodyHalfZ = Math.max(0.26, mainBody ? mainBody.size[2] * 0.46 : 0.35);
    const parts = [];
    const legCandidates = [];

    shells.forEach((sh, idx) => {
      const absZ = Math.abs(sh.center[2]);
      // Keep main chassis + head + recessed panels + bottom tray as fixed chassis (segment 0)
      if (idx === 0 || absZ < bodyHalfZ * 0.85) {
        parts.push({
          componentId: idx,
          leg: 255,
          segment: 0,
          faceCount: sh.faceCount,
          pos: sh.pos,
          norm: buildOutwardCreaseNormals(sh.pos, sh.faceCount),
          pivots: null
        });
      } else {
        legCandidates.push(sh);
      }
    });

    // Split Front vs Rear using the actual midpoint of the leg shells (immune to protruding front head!)
    const quadShells = [[], [], [], []];
    if (legCandidates.length) {
      let minLX = Infinity, maxLX = -Infinity;
      for (const sh of legCandidates) {
        if (sh.center[0] < minLX) minLX = sh.center[0];
        if (sh.center[0] > maxLX) maxLX = sh.center[0];
      }
      const midLegX = (minLX + maxLX) * 0.5;
      for (const sh of legCandidates) {
        const isRight = sh.center[2] > 0;
        const isFront = sh.center[0] >= midLegX;
        const leg = (isRight ? 2 : 0) + (isFront ? 0 : 1);
        quadShells[leg].push(sh);
      }
    }

    // Helper: compute radial bounds (along outward sideSign * Z) and exact XYZ bounds for a group of shells
    const radialBounds = (shList, side) => {
      let rMin = Infinity, rMax = -Infinity;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const sh of shList) {
        const ra = side * sh.min[2], rb = side * sh.max[2];
        const lo = Math.min(ra, rb), hi = Math.max(ra, rb);
        if (lo < rMin) rMin = lo;
        if (hi > rMax) rMax = hi;
        if (sh.min[0] < minX) minX = sh.min[0];
        if (sh.max[0] > maxX) maxX = sh.max[0];
        if (sh.min[1] < minY) minY = sh.min[1];
        if (sh.max[1] > maxY) maxY = sh.max[1];
      }
      return {
        rMin, rMax, rMid: (rMin + rMax) * 0.5, rLen: Math.max(0.01, rMax - rMin),
        minX, maxX, midX: (minX + maxX) * 0.5, sizeX: maxX - minX,
        minY, maxY, midY: (minY + maxY) * 0.5, sizeY: maxY - minY
      };
    };

    // Classify each leg's shells accurately (coxa=2 MOVABLE, femur=3, tibia=4) & extract exact pin-in-hole pivots!
    for (let leg = 0; leg < 4; leg++) {
      const list = quadShells[leg];
      if (!list.length) continue;
      const side = leg < 2 ? -1 : 1;

      // Measure each shell radially outward from the chassis
      const annotated = list.map(sh => {
        const ra = side * sh.min[2], rb = side * sh.max[2];
        const rMin = Math.min(ra, rb), rMax = Math.max(ra, rb);
        return { sh, rMin, rMax, rMid: (rMin + rMax) * 0.5, rLen: Math.max(0.005, rMax - rMin) };
      });
      annotated.sort((a, b) => a.rMid - b.rMid);

      const legInnerR = Math.min(...annotated.map(a => a.rMin));
      const legOuterR = Math.max(...annotated.map(a => a.rMax));
      const legSpan = Math.max(0.2, legOuterR - legInnerR);

      // Assign segment IDs:
      // In Neun completov3.stl each leg has 3 movable shells: [0]=Blue Coxa (seg 2), [1]=White Femur (seg 3), [2]=Red Tibia (seg 4).
      // (The fixed hip lug is part of the grey chassis!)
      const coxaList = [], femurList = [], tibiaList = [], fixedList = [];
      if (annotated.length === 3) {
        annotated[0].segment = 2; coxaList.push(annotated[0].sh);
        annotated[1].segment = 3; femurList.push(annotated[1].sh);
        annotated[2].segment = 4; tibiaList.push(annotated[2].sh);
      } else if (annotated.length === 2) {
        annotated[0].segment = 3; femurList.push(annotated[0].sh);
        annotated[1].segment = 4; tibiaList.push(annotated[1].sh);
      } else if (annotated.length === 1) {
        annotated[0].segment = 4; tibiaList.push(annotated[0].sh);
      } else {
        // 4+ shells per leg: detect if shell[0] is a tiny fixed chassis bracket vs the movable U-fork Coxa
        const firstIsTinyFixed = annotated[0].rLen < legSpan * 0.13 && annotated[1].rMid < legInnerR + legSpan * 0.28;
        const coxaIdx = firstIsTinyFixed ? 1 : 0;
        const tibiaIdx = annotated.length - 1;
        const coxaOuterEst = annotated[coxaIdx].rMax;
        const tibiaInnerEst = annotated[tibiaIdx].rMin;

        annotated.forEach((item, i) => {
          if (firstIsTinyFixed && i === 0) {
            item.segment = 1; fixedList.push(item.sh);
          } else if (i === coxaIdx || item.rMid <= coxaOuterEst + 0.015) {
            item.segment = 2; coxaList.push(item.sh);
          } else if (i === tibiaIdx || item.rMid >= tibiaInnerEst + (legOuterR - tibiaInnerEst) * 0.25) {
            item.segment = 4; tibiaList.push(item.sh);
          } else {
            item.segment = 3; femurList.push(item.sh);
          }
        });
      }

      // Compute EXACT mechanical joint pivots from the real shell geometry (verified on CAD diagrams!):
      //  - Femur is a symmetric stadium/capsule bar:
      //      F pivot = inner semicircle center = femur.rMin + femurHeight / 2
      //      T pivot = outer semicircle center = femur.rMax - femurHeight / 2
      //  - Coxa is a U-fork bracket embracing the vertical hip shaft:
      //      C pivot = vertical shaft at 33% of coxa radial span from its inner U-fork tips
      //  - Foot tip = lowest vertex near the outermost distal 10% of the curved Tibia!
      const cBox = coxaList.length ? radialBounds(coxaList, side) : null;
      const fBox = femurList.length ? radialBounds(femurList, side) : null;
      const tBox = tibiaList.length ? radialBounds(tibiaList, side) : null;

      let hip, femurPivot, knee, foot;
      if (fBox) {
        const endR = Math.min(fBox.sizeY * 0.50, fBox.rLen * 0.13);
        const rF = fBox.rMin + endR;
        const rT = fBox.rMax - endR;
        femurPivot = [fBox.midX, fBox.midY, side * rF];
        knee = [fBox.midX, fBox.midY, side * rT];
        if (cBox) {
          const rC = Math.min(rF - 0.08, cBox.rMin + cBox.rLen * 0.33);
          hip = [fBox.midX, fBox.midY, side * rC];
        } else {
          hip = [fBox.midX, fBox.midY, side * (rF - legSpan * 0.18)];
        }
      } else {
        const avgX = annotated.reduce((s, a) => s + a.sh.center[0], 0) / annotated.length;
        const avgY = annotated.reduce((s, a) => s + a.sh.center[1], 0) / annotated.length;
        hip = [avgX, avgY, side * (legInnerR + legSpan * 0.08)];
        femurPivot = [avgX, avgY, side * (legInnerR + legSpan * 0.26)];
        knee = [avgX, avgY, side * (legInnerR + legSpan * 0.56)];
      }

      // Scan actual tibia vertices near the distal tip to locate the exact curved foot contact claw!
      if (tBox && tibiaList.length) {
        const tipThresh = tBox.rMax - tBox.rLen * 0.12;
        let minTipY = Infinity;
        for (const sh of tibiaList) {
          for (let k = 0; k < sh.pos.length; k += 3) {
            if (side * sh.pos[k + 2] >= tipThresh && sh.pos[k + 1] < minTipY) {
              minTipY = sh.pos[k + 1];
            }
          }
        }
        let fx = 0, fy = 0, fz = 0, fc = 0;
        const yBand = minTipY + Math.max(0.015, tBox.sizeY * 0.08);
        for (const sh of tibiaList) {
          for (let k = 0; k < sh.pos.length; k += 3) {
            if (side * sh.pos[k + 2] >= tipThresh && sh.pos[k + 1] <= yBand) {
              fx += sh.pos[k]; fy += sh.pos[k + 1]; fz += sh.pos[k + 2]; fc++;
            }
          }
        }
        foot = fc > 0 ? [fx / fc, minTipY, fz / fc] : [tBox.midX, tBox.minY, side * tBox.rMax];
      } else {
        foot = [knee[0], knee[1] - 0.14, side * legOuterR];
      }

      const axisDir = side < 0 ? [1, 0, 0] : [-1, 0, 0];
      const pivots = { hip, femurPivot, knee, foot, femurAxis: axisDir, tibiaAxis: axisDir };

      annotated.forEach((item, i) => {
        parts.push({
          componentId: 100 + leg * 10 + i,
          leg,
          segment: item.segment,
          faceCount: item.sh.faceCount,
          pos: item.sh.pos,
          norm: buildOutwardCreaseNormals(item.sh.pos, item.sh.faceCount),
          pivots
        });
      });
    }

    return parts;
  }

  // ========================================================================
  // PROCEDURAL CAD-FAITHFUL NEUN FALLBACK MESH (Matches image-2.png!)
  // Built in flat CAD rest pose so it uses the EXACT same IK pipeline as .bin!
  // ========================================================================
  function createMeshBuilder() {
    const verts = [];
    const addTri = (a, b, c) => {
      verts.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    };
    const addQuad = (a, b, c, d) => { addTri(a, b, c); addTri(a, c, d); };
    const addBox = (cx, cy, cz, sx, sy, sz) => {
      const hx = sx * 0.5, hy = sy * 0.5, hz = sz * 0.5;
      const p = [
        [cx - hx, cy - hy, cz - hz], [cx + hx, cy - hy, cz - hz],
        [cx + hx, cy + hy, cz - hz], [cx - hx, cy + hy, cz - hz],
        [cx - hx, cy - hy, cz + hz], [cx + hx, cy - hy, cz + hz],
        [cx + hx, cy + hy, cz + hz], [cx - hx, cy + hy, cz + hz]
      ];
      addQuad(p[4], p[5], p[6], p[7]); // +Z
      addQuad(p[1], p[0], p[3], p[2]); // -Z
      addQuad(p[5], p[1], p[2], p[6]); // +X
      addQuad(p[0], p[4], p[7], p[3]); // -X
      addQuad(p[7], p[6], p[2], p[3]); // +Y
      addQuad(p[0], p[1], p[5], p[4]); // -Y
    };
    // Chamfered box along X-Y-Z
    const addChamferBox = (cx, cy, cz, sx, sy, sz, ch) => {
      const hx = sx * 0.5, hy = sy * 0.5, hz = sz * 0.5;
      const c = Math.min(ch, hx * 0.4, hy * 0.4, hz * 0.4);
      // 3-tier octagonal prism along X (beveled top & bottom edges)
      const prof = [
        [-hy, -hz + c], [-hy + c, -hz], [hy - c, -hz], [hy, -hz + c],
        [hy, hz - c], [hy - c, hz], [-hy + c, hz], [-hy, hz - c]
      ];
      const n = prof.length;
      const x0 = cx - hx, x1 = cx + hx;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const a0 = [x0, cy + prof[i][0], cz + prof[i][1]];
        const b0 = [x0, cy + prof[j][0], cz + prof[j][1]];
        const a1 = [x1, cy + prof[i][0], cz + prof[i][1]];
        const b1 = [x1, cy + prof[j][0], cz + prof[j][1]];
        addQuad(a0, a1, b1, b0);
      }
      // Caps
      const c0 = [x0, cy, cz], c1 = [x1, cy, cz];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        addTri(c0, [x0, cy + prof[j][0], cz + prof[j][1]], [x0, cy + prof[i][0], cz + prof[i][1]]);
        addTri(c1, [x1, cy + prof[i][0], cz + prof[i][1]], [x1, cy + prof[j][0], cz + prof[j][1]]);
      }
    };
    // Cylinder along X, Y, or Z
    const addCylinder = (cx, cy, cz, r, len, axis, segs = 16) => {
      const half = len * 0.5;
      const pt = (a, h) => {
        const ca = Math.cos(a) * r, sa = Math.sin(a) * r;
        if (axis === 'x') return [cx + h, cy + ca, cz + sa];
        if (axis === 'y') return [cx + ca, cy + h, cz + sa];
        return [cx + ca, cy + sa, cz + h];
      };
      const cNeg = axis === 'x' ? [cx - half, cy, cz] : (axis === 'y' ? [cx, cy - half, cz] : [cx, cy, cz - half]);
      const cPos = axis === 'x' ? [cx + half, cy, cz] : (axis === 'y' ? [cx, cy + half, cz] : [cx, cy, cz + half]);
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2;
        const a1 = ((i + 1) / segs) * Math.PI * 2;
        const p00 = pt(a0, -half), p10 = pt(a1, -half);
        const p01 = pt(a0,  half), p11 = pt(a1,  half);
        addQuad(p00, p01, p11, p10);
        addTri(cNeg, p10, p00);
        addTri(cPos, p01, p11);
      }
    };
    // Lofted curved tibia profile along radial Z direction (side = -1 for left, +1 for right)
    const addCurvedTibia = (kneeX, kneeY, kneeZ, side, len) => {
      const steps = 10;
      const rings = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const r = t * len;
        // Arched NEUN silhouette matching image-1.png / image-2.png
        const topY = kneeY + 0.085 * Math.sin(Math.pow(t, 0.72) * Math.PI) + 0.025 * (1 - t) - 0.095 * Math.pow(t, 2.2);
        const botY = kneeY - 0.048 * (1 - t * 0.45) - 0.135 * Math.pow(t, 2.6);
        const halfW = 0.088 * (1 - 0.36 * t) + 0.015 * Math.sin(t * Math.PI);
        const z = kneeZ + side * r;
        const midY = (topY + botY) * 0.5;
        rings.push([
          [kneeX - halfW, midY, z],
          [kneeX - halfW * 0.75, topY, z],
          [kneeX + halfW * 0.75, topY, z],
          [kneeX + halfW, midY, z],
          [kneeX + halfW * 0.72, botY, z],
          [kneeX - halfW * 0.72, botY, z]
        ]);
      }
      const m = 6;
      for (let i = 0; i < steps; i++) {
        for (let k = 0; k < m; k++) {
          const nk = (k + 1) % m;
          if (side > 0) addQuad(rings[i][k], rings[i + 1][k], rings[i + 1][nk], rings[i][nk]);
          else          addQuad(rings[i][nk], rings[i + 1][nk], rings[i + 1][k], rings[i][k]);
        }
      }
      // Close ends
      const cap = (ring, reverse) => {
        let mx = 0, my = 0, mz = 0;
        for (const p of ring) { mx += p[0]; my += p[1]; mz += p[2]; }
        const c = [mx / m, my / m, mz / m];
        for (let k = 0; k < m; k++) {
          const nk = (k + 1) % m;
          if (reverse) addTri(c, ring[nk], ring[k]);
          else         addTri(c, ring[k], ring[nk]);
        }
      };
      cap(rings[0], side > 0);
      cap(rings[steps], side < 0);
    };

    const build = (componentId, leg, segment, pivots, accent) => {
      const pos = new Float32Array(verts);
      const faceCount = pos.length / 9;
      return {
        componentId, leg, segment, faceCount, pos,
        norm: buildOutwardCreaseNormals(pos, faceCount),
        pivots, accent
      };
    };
    return { addBox, addChamferBox, addCylinder, addCurvedTibia, build };
  }

  function buildProceduralNeunParts() {
    const parts = [];

    // 1. Main Chassis + Front Ultrasonic Head (segment = 0)
    const body = createMeshBuilder();
    // Main beveled carapace (1.42 x 0.44 x 0.78)
    body.addChamferBox(-0.04, 0.04, 0.0, 1.38, 0.42, 0.76, 0.07);
    // Sloped forward hood
    body.addChamferBox(0.58, 0.02, 0.0, 0.28, 0.34, 0.66, 0.06);
    // Recessed top bay surround
    body.addBox(-0.06, 0.255, 0.0, 0.72, 0.03, 0.46);
    // Side vent ribs on both flanks (like image-2.png!)
    for (let v = 0; v < 5; v++) {
      const vx = -0.52 + v * 0.11;
      body.addBox(vx, 0.08,  0.385, 0.035, 0.16, 0.02);
      body.addBox(vx, 0.08, -0.385, 0.035, 0.16, 0.02);
    }
    // Front Ultrasonic Head Housing (HC-SR04 module at +X)
    body.addChamferBox(0.88, -0.02, 0.0, 0.34, 0.30, 0.48, 0.05);
    // Side ear sockets on head
    body.addCylinder(0.84, -0.02,  0.245, 0.08, 0.03, 'z', 14);
    body.addCylinder(0.84, -0.02, -0.245, 0.08, 0.03, 'z', 14);
    // Bottom battery tray
    body.addChamferBox(-0.04, -0.18, 0.0, 1.18, 0.09, 0.56, 0.03);
    parts.push(body.build(0, 255, 0, null));

    // Accent: Ultrasonic eyes (dark metallic barrels)
    const eyes = createMeshBuilder();
    eyes.addCylinder(1.06, -0.02, -0.11, 0.075, 0.045, 'x', 16);
    eyes.addCylinder(1.06, -0.02,  0.11, 0.075, 0.045, 'x', 16);
    parts.push(eyes.build(1, 255, 0, null, 'sensor'));

    // Accent: Top 8x8 NeoPixel LED Matrix glow panel + front eye rings
    const leds = createMeshBuilder();
    leds.addBox(-0.06, 0.280, 0.0, 0.44, 0.014, 0.28);
    leds.addCylinder(1.088, -0.02, -0.11, 0.052, 0.014, 'x', 14);
    leds.addCylinder(1.088, -0.02,  0.11, 0.052, 0.014, 'x', 14);
    parts.push(leds.build(2, 255, 0, null, 'led'));

    // 4 Articulated Legs: FL(0), RL(1), FR(2), RR(3)
    const legSpecs = [
      { leg: 0, hx:  0.42, side: -1 }, // FL: +X, -Z
      { leg: 1, hx: -0.44, side: -1 }, // RL: -X, -Z
      { leg: 2, hx:  0.42, side:  1 }, // FR: +X, +Z
      { leg: 3, hx: -0.44, side:  1 }  // RR: -X, +Z
    ];

    const hipY = -0.02;
    const hipZAbs = 0.42;
    const coxaLen = 0.24;
    const femurLen = 0.44;
    const tibiaLen = 0.74;

    for (const s of legSpecs) {
      const hip = [s.hx, hipY, s.side * hipZAbs];
      const femurPivot = [s.hx, hipY, s.side * (hipZAbs + coxaLen)];
      const knee = [s.hx, hipY, s.side * (hipZAbs + coxaLen + femurLen)];
      const foot = [s.hx, hipY - 0.14, s.side * (hipZAbs + coxaLen + femurLen + tibiaLen)];
      const pitchAxis = s.side < 0 ? [1, 0, 0] : [-1, 0, 0];
      const pivots = { hip, femurPivot, knee, foot, femurAxis: pitchAxis, tibiaAxis: pitchAxis };

      // Segment 1: Fixed hip mount bracket attached to chassis
      const seg1 = createMeshBuilder();
      seg1.addBox(hip[0], hipY + 0.11, s.side * (hipZAbs - 0.02), 0.22, 0.036, 0.16);
      seg1.addBox(hip[0], hipY - 0.11, s.side * (hipZAbs - 0.02), 0.22, 0.036, 0.16);
      seg1.addBox(hip[0], hipY,        s.side * (hipZAbs - 0.06), 0.20, 0.20,  0.08);
      seg1.addCylinder(hip[0], hipY, hip[2], 0.045, 0.26, 'y', 12);
      parts.push(seg1.build(10 + s.leg * 4, s.leg, 1, pivots));

      // Segment 2: Movable Coxa U-bracket
      const seg2 = createMeshBuilder();
      const czMid = s.side * (hipZAbs + coxaLen * 0.5);
      seg2.addBox(hip[0], hipY + 0.075, czMid, 0.16, 0.035, coxaLen + 0.08);
      seg2.addBox(hip[0], hipY - 0.075, czMid, 0.16, 0.035, coxaLen + 0.08);
      seg2.addBox(hip[0], hipY, s.side * (hipZAbs + coxaLen * 0.35), 0.14, 0.14, 0.14);
      seg2.addCylinder(femurPivot[0], femurPivot[1], femurPivot[2], 0.055, 0.19, 'x', 12);
      parts.push(seg2.build(11 + s.leg * 4, s.leg, 2, pivots));

      // Segment 3: Dual-rail Femur link + Servo horns + Knee housing
      const seg3 = createMeshBuilder();
      const fzMid = s.side * (hipZAbs + coxaLen + femurLen * 0.5);
      // Twin side rails (matching image-1.png!)
      seg3.addChamferBox(hip[0] + 0.095, hipY, fzMid, 0.038, 0.115, femurLen + 0.09, 0.015);
      seg3.addChamferBox(hip[0] - 0.095, hipY, fzMid, 0.038, 0.115, femurLen + 0.09, 0.015);
      // Cross braces & internal tibia servo box
      seg3.addBox(hip[0], hipY, fzMid, 0.15, 0.09, 0.20);
      seg3.addCylinder(knee[0], knee[1], knee[2], 0.058, 0.22, 'x', 12);
      parts.push(seg3.build(12 + s.leg * 4, s.leg, 3, pivots));

      // Segment 4: Sculpted curved NEUN Tibia + Foot claw pad
      const seg4 = createMeshBuilder();
      seg4.addCurvedTibia(knee[0], knee[1], knee[2], s.side, tibiaLen);
      // Knee clevis yoke
      seg4.addBox(knee[0], knee[1] + 0.02, knee[2] + s.side * 0.05, 0.18, 0.15, 0.12);
      parts.push(seg4.build(13 + s.leg * 4, s.leg, 4, pivots));

      // Foot tip claw pad (moves with segment 4)
      const claw = createMeshBuilder();
      claw.addCylinder(foot[0], foot[1] + 0.02, foot[2], 0.048, 0.10, 'x', 10);
      parts.push(claw.build(30 + s.leg, s.leg, 4, pivots, 'claw'));
    }

    return parts;
  }

  // ========================================================================
  // UPLOAD MESHES & PREPARE EXACT 3-DOF LEG KINEMATICS
  // ========================================================================
  function disposeMeshes() {
    if (!gl) return;
    for (const part of meshes) {
      if (part.positionBuffer) gl.deleteBuffer(part.positionBuffer);
      if (part.normalBuffer) gl.deleteBuffer(part.normalBuffer);
    }
    meshes = [];
  }

  function uploadParts(parts, sourceType, sourceLabel) {
    disposeMeshes();
    let minChassisY = Infinity;
    let maxRadius = 0.5;

    for (const part of parts) {
      if (part.segment === 0) {
        for (let k = 0; k < part.pos.length; k += 3) {
          if (part.pos[k + 1] < minChassisY) minChassisY = part.pos[k + 1];
          const r = Math.hypot(part.pos[k], part.pos[k + 2]);
          if (r > maxRadius) maxRadius = r;
        }
      }
      part.positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, part.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, part.pos, gl.STATIC_DRAW);

      part.normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, part.normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, part.norm, gl.STATIC_DRAW);

      part.material = materialFor(part.segment, part.accent);
      delete part.pos;
      delete part.norm;
    }

    chassisBottomCadY = Number.isFinite(minChassisY) ? minChassisY : -0.20;
    modelRadius = Math.max(1.2, maxRadius * 2.1);
    meshes = parts;
    modelSourceType = sourceType;
    modelSourceLabel = sourceLabel;
    prepareLegKinematics(parts);

    // Reset pose smoothly into authentic standing stance on the ground
    for (let leg = 0; leg < 4; leg++) {
      const geo = legKinematics[leg];
      if (!geo) continue;
      targetJointRad[leg] = [...geo.standJointRad];
      shownJointRad[leg] = [...geo.standJointRad];
    }
    syncServoDegreesFromJoints();
    setIsometricView(true);
    updateModelBadgeUI();
  }

  function prepareLegKinematics(parts) {
    // Safety net: if a leg has segment=1 parts but zero segment=2 parts, promote segment 1 -> 2 (movable Coxa!)
    for (let leg = 0; leg < 4; leg++) {
      const hasCoxa = parts.some(p => p.leg === leg && p.segment === 2);
      if (!hasCoxa) {
        for (const p of parts) {
          if (p.leg === leg && p.segment === 1) {
            p.segment = 2;
            p.material = materialFor(2, p.accent);
          }
        }
      }
    }

    legKinematics = [null, null, null, null];
    const up = [0, 1, 0];

    for (let leg = 0; leg < 4; leg++) {
      // Find tibia part (segment 4) for authoritative pivots
      const tibiaPart = parts.find(p => p.leg === leg && p.segment === 4 && p.pivots)
                     || parts.find(p => p.leg === leg && p.pivots);
      if (!tibiaPart) continue;

      const { hip, femurPivot, knee, foot, femurAxis, tibiaAxis } = tibiaPart.pivots;
      const isLeft = leg < 2;
      const isFront = leg === 0 || leg === 2;

      // Radial horizontal outward unit vector R0
      let rx = knee[0] - hip[0];
      let rz = knee[2] - hip[2];
      let rLen = Math.hypot(rx, rz);
      if (rLen < 0.05) {
        rx = femurPivot[0] - hip[0];
        rz = femurPivot[2] - hip[2];
        rLen = Math.hypot(rx, rz);
      }
      const R0 = rLen > 0.02 ? [rx / rLen, 0, rz / rLen] : [0, 0, isLeft ? -1 : 1];
      // Horizontal tangent T0 = U x R0 (exact match to +Y rotation of R0!)
      const T0 = [R0[2], 0, -R0[0]];
      // Ideal upward pitch axis = R0 x U (rotating R0 by +phi around this moves R0 toward +Y UP!)
      const idealUpAxis = v3Norm(v3Cross(R0, up));

      const orientAxis = (rawAxis) => {
        if (!rawAxis) return idealUpAxis;
        const l = Math.hypot(rawAxis[0], rawAxis[1], rawAxis[2]);
        if (l < 0.05) return idealUpAxis;
        const n = [rawAxis[0] / l, rawAxis[1] / l, rawAxis[2] / l];
        return v3Dot(n, idealUpAxis) >= 0 ? n : [-n[0], -n[1], -n[2]];
      };

      const femurUpAxis = orientAxis(femurAxis);
      const tibiaExtAxis = orientAxis(tibiaAxis);

      // Exact CAD link lengths & rest angles in CONSISTENT SCENE UNITS!
      const L_coxa = Math.max(0.04, (femurPivot[0] - hip[0]) * R0[0] + (femurPivot[2] - hip[2]) * R0[2]);
      const f_r0 = (knee[0] - femurPivot[0]) * R0[0] + (knee[2] - femurPivot[2]) * R0[2];
      const f_u0 = knee[1] - femurPivot[1];
      const L_femur = Math.max(0.10, Math.hypot(f_r0, f_u0));
      const alpha_f0 = Math.atan2(f_u0, f_r0);

      const t_r0 = (foot[0] - knee[0]) * R0[0] + (foot[2] - knee[2]) * R0[2];
      const t_u0 = foot[1] - knee[1];
      const L_tibia = Math.max(0.15, Math.hypot(t_r0, t_u0));
      const alpha_t0 = Math.atan2(t_u0, t_r0);

      // Compute natural athletic standing spider posture:
      //  - Clean chassis clearance above floor
      //  - Femurs gently arched upward (+12°..+22°), knees never hyper-cranked
      //  - Tibias planted outward-downward (-62°..-74°), never tucked inward!
      const bellyClearance = (femurPivot[1] - chassisBottomCadY) + L_tibia * 0.30;
      const standDrop = clamp(bellyClearance, L_tibia * 0.54, L_tibia * 0.68);
      const maxLinkSum = (L_femur + L_tibia) * 0.89;
      const maxSafeRadial = Math.sqrt(Math.max(0.04, maxLinkSum * maxLinkSum - standDrop * standDrop));
      const standRadial = clamp(
        L_femur * 0.92 + L_tibia * 0.42,
        L_femur * 0.65,
        maxSafeRadial
      );

      // Sleek X-stance spider splay (±17 deg): keeps blue Coxa U-fork clean & clear of chassis walls!
      const coxaFwdSign = Math.sign(T0[0]) || (isLeft ? -1 : 1);
      const splayRad = coxaFwdSign * (isFront ? 0.30 : -0.30);
      const rTotal = L_coxa + standRadial;
      const cosS = Math.cos(splayRad), sinS = Math.sin(splayRad);
      const dirX = R0[0] * cosS + T0[0] * sinS;
      const dirZ = R0[2] * cosS + T0[2] * sinS;

      const standFootBody = [
        hip[0] + dirX * rTotal,
        femurPivot[1] - standDrop,
        hip[2] + dirZ * rTotal
      ];

      const geo = {
        leg, isLeft, isFront,
        hip, femurPivot, knee, foot,
        R0, T0, coxaFwdSign,
        femurUpAxis, tibiaExtAxis,
        L_coxa, L_femur, L_tibia,
        alpha_f0, alpha_t0,
        standDrop, standRadial, standFootBody,
        standJointRad: [0, 0, 0]
      };
      geo.standJointRad = solveLegIKBody(geo, standFootBody);
      legKinematics[leg] = geo;
    }

    // Compute exact floor elevation so standing feet rest squarely on Y = 0!
    let footYSum = 0, footCount = 0;
    for (let leg = 0; leg < 4; leg++) {
      if (legKinematics[leg]) {
        footYSum += legKinematics[leg].standFootBody[1];
        footCount++;
      }
    }
    chassisElevation = footCount > 0 ? -(footYSum / footCount) : 0.56;

    // Frame camera distance nicely to model size
    let maxFootR = 0.8;
    for (let leg = 0; leg < 4; leg++) {
      if (legKinematics[leg]) {
        const f = legKinematics[leg].standFootBody;
        maxFootR = Math.max(maxFootR, Math.hypot(f[0], f[2]));
      }
    }
    modelRadius = Math.max(1.1, maxFootR * 1.15);
  }

  // Exact Analytical 3-DOF Knee-UP Spider Inverse Kinematics (all in body scene units!)
  function solveLegIKBody(geo, pBody) {
    const dx = pBody[0] - geo.hip[0];
    const dz = pBody[2] - geo.hip[2];
    const dR = dx * geo.R0[0] + dz * geo.R0[2];
    const dT = dx * geo.T0[0] + dz * geo.T0[2];

    const thetaC = clamp(Math.atan2(dT, Math.max(0.04, dR)), -0.82, 0.82);
    let rHoriz = Math.max(0.05, Math.hypot(dR, dT) - geo.L_coxa);
    let uVert = pBody[1] - geo.femurPivot[1];

    const Lf = geo.L_femur, Lt = geo.L_tibia;
    let D = Math.hypot(rHoriz, uVert);
    const minD = Math.abs(Lf - Lt) + 0.04 * (Lf + Lt);
    const maxD = (Lf + Lt) * 0.965;
    if (D < minD || D > maxD) {
      const targetD = clamp(D, minD, maxD);
      const scale = targetD / Math.max(D, 1e-5);
      rHoriz *= scale;
      uVert *= scale;
      D = targetD;
    }

    const beta = Math.atan2(uVert, rHoriz);
    const cosPsi = clamp((Lf * Lf + D * D - Lt * Lt) / (2 * Lf * D), -1, 1);
    const cosGamma = clamp((Lf * Lf + Lt * Lt - D * D) / (2 * Lf * Lt), -1, 1);
    const psi = Math.acos(cosPsi);
    const gamma = Math.acos(cosGamma);

    // Knee-UP spider solution: femur angles UP above hip-to-foot line, tibia bends DOWN
    const alphaF = beta + psi;
    const alphaT = alphaF - (Math.PI - gamma);

    const phiF = clamp(alphaF - geo.alpha_f0, -1.52, 1.52);
    const phiT = clamp((alphaT - geo.alpha_t0) - phiF, -1.66, 1.52);
    return [thetaC, phiF, phiT];
  }

  // Transform a foot target in robot ground-frame (Y = 0 on floor) into body-local coords
  // accounting for body translation (shiftX/Y/Z), elevation, twist, pitch, and roll!
  function groundToBodyLocal(pGround) {
    const qx = pGround[0] - bodyShiftX;
    const qy = pGround[1] - (chassisElevation + userHeightOffset + bodyShiftY);
    const qz = pGround[2] - bodyShiftZ;

    // Inverse of Ry(twist) * Rz(pitch) * Rx(roll) is Rx(-roll) * Rz(-pitch) * Ry(-twist)
    const ct = Math.cos(-bodyTwist), st = Math.sin(-bodyTwist);
    const x1 = ct * qx + st * qz;
    const y1 = qy;
    const z1 = -st * qx + ct * qz;

    const cp = Math.cos(-bodyPitch), sp = Math.sin(-bodyPitch);
    const x2 = cp * x1 - sp * y1;
    const y2 = sp * x1 + cp * y1;
    const z2 = z1;

    const cr = Math.cos(-bodyRoll), sr = Math.sin(-bodyRoll);
    return [
      x2,
      cr * y2 - sr * z2,
      sr * y2 + cr * z2
    ];
  }

  // Convert joint radians -> display servo degrees [0..180] (90° = neutral standing or CAD)
  function syncServoDegreesFromJoints() {
    for (let leg = 0; leg < 4; leg++) {
      const geo = legKinematics[leg];
      if (!geo) continue;
      for (let j = 0; j < 3; j++) {
        // Report relative to standing pose centered around 90° so dashboard telemetry matches real firmware!
        const deltaDeg = (shownJointRad[leg][j] - geo.standJointRad[j]) * 180 / Math.PI;
        currentServoDeg[leg][j] = clamp(Math.round(90 + deltaDeg * SERVO_SIGN[leg][j]), 5, 175);
      }
    }
  }

  // Convert real servo degrees [0..180] (from sliders or ESP32 hardware) -> joint radians
  function servoDegToJointRad(leg, joint, deg) {
    const geo = legKinematics[leg];
    if (!geo) return 0;
    // 90° corresponds to standing spider pose so real robot 90° neutral stands cleanly on its feet!
    const deltaRad = ((deg - 90) * SERVO_SIGN[leg][joint]) * Math.PI / 180;
    return clamp(geo.standJointRad[joint] + deltaRad, -1.65, 1.65);
  }

  // Build local-to-body matrix for a leg segment
  function componentMatrix(leg, segment, jointAngles) {
    if (leg > 3 || segment < 2) return m4Identity();
    const geo = legKinematics[leg];
    if (!geo) return m4Identity();
    const ang = jointAngles[leg];
    const coxaM = m4Around(geo.hip, m4RotateY(ang[0]));
    if (segment === 2) return coxaM;
    const femurM = m4Around(geo.femurPivot, m4RotateAxis(geo.femurUpAxis, ang[1]));
    const cf = m4Multiply(coxaM, femurM);
    if (segment === 3) return cf;
    const tibiaM = m4Around(geo.knee, m4RotateAxis(geo.tibiaExtAxis, ang[2]));
    return m4Multiply(cf, tibiaM);
  }

  function bodyLocalMatrix() {
    const elev = chassisElevation + userHeightOffset + bodyShiftY;
    return m4Multiply(
      m4Translate(bodyShiftX, elev, bodyShiftZ),
      m4Multiply(m4RotateY(bodyTwist), m4Multiply(m4RotateZ(bodyPitch), m4RotateX(bodyRoll)))
    );
  }

  function bodyWorldMatrix() {
    return m4Multiply(
      m4Translate(bodyX, 0, bodyZ),
      m4Multiply(m4RotateY(bodyHeading), bodyLocalMatrix())
    );
  }

  // ========================================================================
  // ZERO-SLIP BIOMECHANICAL GAIT & ALL 18 NEUN MODES
  // ========================================================================
  function getActiveDriveVector(now) {
    // Keyboard / simulator D-pad
    let fwd = (heldControls.has('forward') ? 1 : 0) - (heldControls.has('backward') ? 1 : 0);
    let strafe = (heldControls.has('right') ? 1 : 0) - (heldControls.has('left') ? 1 : 0);
    let turn = (heldControls.has('turn-right') ? 1 : 0) - (heldControls.has('turn-left') ? 1 : 0);

    // Panel external drive (joystick / D-pad)
    if (now < extDriveUntil || Math.abs(extDriveFwd) + Math.abs(extDriveStrafe) + Math.abs(extDriveTurn) > 0.02) {
      fwd += extDriveFwd;
      strafe += extDriveStrafe;
      turn += extDriveTurn;
    }

    const mag = Math.hypot(fwd, strafe);
    if (mag > 1) { fwd /= mag; strafe /= mag; }
    turn = clamp(turn, -1, 1);
    return { fwd, strafe, turn, hasManualDrive: (Math.hypot(fwd, strafe) + Math.abs(turn)) > 0.04 };
  }

  function stepLocomotionGait(dt, fwd, strafe, turn, gaitStyle) {
    const isTrot = gaitStyle === 'TROT' || gaitStyle === 'FOLLOW';
    const isCrawl = gaitStyle === 'CRAWL';
    const speedFactor = clamp(0.30 + simulationSpeed * 0.95, 0.25, 1.35);
    const inputMag = clamp(Math.max(Math.hypot(fwd, strafe), Math.abs(turn)), 0.15, 1.0);

    // Smooth stride entry ramp (exact 1:1 match with ESP32-S3 SERVO_RAMP_ALPHA = 0.16)
    const rampAlpha = 1 - Math.pow(1 - 0.16, Math.max(0.25, dt * 50));
    strideScale += (inputMag - strideScale) * rampAlpha;

    // Reference leg scale from loaded model
    const refGeo = legKinematics[0] || legKinematics[2];
    const legScale = refGeo ? (refGeo.L_femur + refGeo.L_tibia) : 1.18;

    const cycleFreq = (isTrot ? 1.32 : (isCrawl ? 0.55 : 0.82)) * speedFactor;
    const swingFrac = isTrot ? 0.42 : 0.25;
    const duty = 1.0 - swingFrac;

    const maxStride = legScale * (isTrot ? 0.40 : (isCrawl ? 0.28 : 0.36)) * strideScale;
    const maxYawStride = (isTrot ? 0.34 : (isCrawl ? 0.24 : 0.28)) * strideScale;
    const liftHeight = legScale * (isTrot ? 0.22 : (isCrawl ? 0.15 : 0.21)) * clamp(strideScale + 0.25, 0.45, 1.0);

    gaitPhase = (gaitPhase + dt * cycleFreq) % 1.0;

    // Statically-stable quadruped phase ordering: RL(0.00) -> FL(0.25) -> RR(0.50) -> FR(0.75)
    const phases = isTrot ? [0.00, 0.50, 0.50, 0.00] : [0.75, 0.00, 0.25, 0.50];

    // Exact no-slip body propulsion
    const linVel = (maxStride * cycleFreq) / duty;
    const yawVel = (maxYawStride * cycleFreq) / duty;

    bodyHeading -= turn * yawVel * dt;
    const cosH = Math.cos(bodyHeading);
    const sinH = Math.sin(bodyHeading);
    bodyX += (cosH * fwd + sinH * strafe) * linVel * dt;
    bodyZ += (-sinH * fwd + cosH * strafe) * linVel * dt;

    // Pre-shifted continuous CoG weight transfer (1:1 with ESP32-S3)
    const leadPh = (gaitPhase + 0.06) % 1.0;
    let cogX = 0, cogZ = 0, rollBias = 0, pitchBias = 0;
    if (!isTrot) {
      const latWave = Math.sin(leadPh * Math.PI * 2);
      const fwdWave = Math.sin(leadPh * Math.PI * 4);
      const ampScale = (isCrawl ? 1.12 : 1.0) * strideScale;
      cogZ = latWave * legScale * 0.060 * ampScale;
      cogX = fwdWave * legScale * 0.028 * ampScale;
      rollBias = latWave * 0.028 * ampScale;
      pitchBias = -fwdWave * 0.016 * ampScale;
    }

    const stanceFootTargets = [];

    for (let leg = 0; leg < 4; leg++) {
      const geo = legKinematics[leg];
      if (!geo) continue;
      const ph = (gaitPhase + phases[leg]) % 1.0;
      const inSwing = ph < swingFrac;
      legInStance[leg] = !inSwing;

      // C2-continuous minimum-jerk swing trajectory (1:1 with ESP32-S3!):
      //   - Horizontal sweep: 5th-order minimum-jerk 10p^3 - 15p^4 + 6p^5 (v=0 & a=0 at lift-off/touchdown)
      //   - Vertical arc:     smooth sin^2(pi*p) bell (zero vertical slap/stomp!)
      //   - Stance:           constant-velocity linear +0.5 -> -0.5 (zero foot slip)
      let s = 0;
      let lift = 0;
      if (inSwing) {
        const p = clamp(ph / swingFrac, 0, 1);
        const mj = (p * p * p) * (10 + p * (-15 + 6 * p));
        const sinP = Math.sin(Math.PI * p);
        s = -0.5 + mj;
        lift = (sinP * sinP) * liftHeight;
      } else {
        const p = (ph - swingFrac) / duty;
        s = 0.5 - p;
      }

      const wide = isCrawl ? 1.10 : 1.0;
      const bx = geo.standFootBody[0] * (isCrawl ? 1.04 : 1.0);
      const bz = geo.standFootBody[2] * wide;

      const dAngle = -turn * maxYawStride * s;
      const ca = Math.cos(dAngle), sa = Math.sin(dAngle);
      const rotX = bx * ca + bz * sa;
      const rotZ = -bx * sa + bz * ca;

      const gx = rotX + fwd * maxStride * s;
      const gz = rotZ + strafe * maxStride * s;
      const gy = lift;

      stanceFootTargets[leg] = [gx, gy, gz];
    }

    // Smooth torso motion (1:1 with ESP32-S3)
    const crawlDrop = isCrawl ? -legScale * 0.1333 : 0;
    const bounce = isTrot
      ? Math.abs(Math.sin(gaitPhase * Math.PI * 2)) * legScale * 0.0333 * strideScale
      : Math.sin(gaitPhase * Math.PI * 4) * legScale * 0.010 * strideScale;
    const leanPitch = -fwd * (isTrot ? 0.050 : 0.024) * strideScale;
    const leanRoll = strafe * 0.036 * strideScale;

    const k = clamp(dt * 12, 0.05, 0.45);
    bodyShiftX = lerp(bodyShiftX, cogX, k);
    bodyShiftY = lerp(bodyShiftY, crawlDrop + bounce, k);
    bodyShiftZ = lerp(bodyShiftZ, cogZ, k);
    bodyPitch = lerp(bodyPitch, pitchBias + leanPitch, k);
    bodyRoll = lerp(bodyRoll, rollBias + leanRoll, k);
    bodyTwist = lerp(bodyTwist, -turn * 0.045 * strideScale, k);

    for (let leg = 0; leg < 4; leg++) {
      const geo = legKinematics[leg];
      if (!geo || !stanceFootTargets[leg]) continue;
      targetJointRad[leg] = solveLegIKBody(geo, groundToBodyLocal(stanceFootTargets[leg]));
    }
  }

  function getSafeVerticalBounds() {
    const refGeo = legKinematics[0] || legKinematics[2];
    const legScale = refGeo ? (refGeo.L_femur + refGeo.L_tibia) : 1.18;
    const standDrop = refGeo ? refGeo.standDrop : 0.45;
    const standRadial = refGeo ? refGeo.standRadial : 0.70;
    const Lf = refGeo ? refGeo.L_femur : 0.44;
    const Lt = refGeo ? refGeo.L_tibia : 0.74;
    const realBellyGap = Math.max(0.10, chassisElevation + chassisBottomCadY);
    const maxSafeDrop = clamp(realBellyGap * 0.84, 0.08, standDrop * 0.68);
    const maxReach = (Lf + Lt) * 0.92;
    const maxDropAtStance = Math.sqrt(Math.max(0.01, maxReach * maxReach - standRadial * standRadial));
    const maxSafeRise = clamp(maxDropAtStance - standDrop, 0.08, legScale * 0.36);
    return { refGeo, legScale, standDrop, standRadial, Lf, Lt, realBellyGap, maxSafeDrop, maxSafeRise };
  }

  function updateHeightUI(notifyHardware) {
    const b = getSafeVerticalBounds();
    const maxUp = b.maxSafeRise * 0.92;
    const maxDn = b.maxSafeDrop * 0.92;
    const norm = userHeightTarget >= 0
      ? clamp(userHeightTarget / Math.max(0.01, maxUp), 0, 1)
      : -clamp(Math.abs(userHeightTarget) / Math.max(0.01, maxDn), 0, 1);
    const pct = Math.round(norm * 100);
    const label = pct > 0 ? `+${pct}%` : `${pct}%`;
    document.querySelectorAll('#neun3dHeightVal, [data-neun3d-height="reset"]').forEach(el => {
      el.textContent = label;
      el.classList.toggle('is-high', pct > 2);
      el.classList.toggle('is-low', pct < -2);
    });
    if (notifyHardware && typeof window.onNeun3dHeightChange === 'function') {
      window.onNeun3dHeightChange(Number(norm.toFixed(2)));
    }
  }

  function updateSpecialModePose(dt, mode) {
    if (mode !== lastSpecialMode) {
      modeClock = 0;
      lastSpecialMode = mode;
    }
    const { refGeo, legScale, realBellyGap, maxSafeDrop, maxSafeRise } = getSafeVerticalBounds();
    const speedFactor = clamp(0.45 + simulationSpeed * 0.9, 0.35, 1.4);
    modeClock += dt * speedFactor;
    const t = modeClock;
    const k = clamp(dt * 11, 0.08, 0.38);

    // Default: all 4 feet planted cleanly on floor (Y = 0)
    const feet = [0, 1, 2, 3].map(i => {
      const g = legKinematics[i];
      legInStance[i] = true;
      return g ? [g.standFootBody[0], 0, g.standFootBody[2]] : [0, 0, 0];
    });

    let tShiftX = 0, tShiftY = 0, tShiftZ = 0, tPitch = 0, tRoll = 0, tTwist = 0;
    let directBodySync = false;

    if (mode === 'STAND') {
      // Subtle alive breathing + manual chassis tilt + live IMU attitude if connected
      tShiftY = Math.sin(simTime * 1.9) * legScale * 0.010;
      tPitch = clamp(userTiltPitch, -0.24, 0.24);
      tRoll = clamp(userTiltRoll, -0.24, 0.24);
      if (useImuOnStand && hardwareConnected) {
        tPitch = clamp(tPitch + imuPitchRad, -0.28, 0.28);
        tRoll = clamp(tRoll + imuRollRad, -0.28, 0.28);
      }
    } else if (mode === 'TILT') {
      // Smooth 3D circular pitch/roll wave on 4 planted feet
      const w = t * 1.85;
      tPitch = Math.sin(w) * 0.20;
      tRoll = Math.cos(w) * 0.20;
      tTwist = Math.sin(w * 0.5) * 0.10;
      tShiftX = Math.cos(w) * legScale * 0.035;
      tShiftZ = Math.sin(w) * legScale * 0.035;
    } else if (mode === 'ELEVATE') {
      // Pure level Ascenso y Descenso ("sube y baja"): horizontal chassis, all 4 feet glued to Y=0!
      const raw = Math.sin(t * 1.85);
      // Soft dwell at top and bottom so ascent & descent feel smooth and hydraulic
      const shaped = raw * (1.26 - 0.26 * raw * raw);
      tShiftY = shaped >= 0
        ? shaped * (maxSafeRise * 0.90)
        : shaped * (maxSafeDrop * 0.92);
    } else if (mode === 'PUSHUP') {
      // Real athletic quadruped push-ups: rear anchored as fulcrum, front chest dips deep & pushes high!
      const p = (t * 0.54) % 1.0;
      let down = 0;
      if (p < 0.42) {
        down = smoothstep(0.00, 0.42, p);          // controlled descent
      } else if (p < 0.54) {
        down = 1.0;                                 // brief squeeze at bottom
      } else if (p < 0.86) {
        down = 1.0 - smoothstep(0.54, 0.86, p);     // crisp press back up
      } else {
        down = 0.0;                                 // brief hold at top
      }

      // Wide stable push-up stance on Y=0
      for (let i = 0; i < 4; i++) {
        const isFront = i === 0 || i === 2;
        if (isFront) {
          feet[i][0] += legScale * 0.04;
          feet[i][2] *= 1.05;
        } else {
          feet[i][0] -= legScale * 0.04;
        }
      }

      const frontNoseX = Math.max(0.55, (refGeo ? Math.abs(refGeo.hip[0]) : 0.42) * 1.50);
      const topPitch = 0.14;        // +8 deg proud chest at top
      const bottomPitch = -0.21;    // -12 deg front chest dipping toward floor
      const nosePitchDrop = frontNoseX * Math.sin(Math.abs(bottomPitch));
      const bottomBodyDrop = Math.max(0.03, Math.min(maxSafeDrop * 0.56, realBellyGap - nosePitchDrop - 0.045));

      tPitch = lerp(topPitch, bottomPitch, down);
      tShiftY = lerp(maxSafeRise * 0.42, -bottomBodyDrop, down);
      tShiftX = lerp(-0.03, 0.045, down) * legScale;
    } else if (mode === 'DANCE') {
      // Energetic rhythmic groove + alternating front foot taps!
      const beat = t * 3.6;
      tShiftY = Math.sin(beat * 2) * legScale * 0.075 - legScale * 0.03;
      tShiftZ = Math.sin(beat) * legScale * 0.09;
      tRoll = Math.sin(beat) * 0.16;
      tPitch = Math.cos(beat * 2) * 0.11;
      tTwist = Math.sin(beat) * 0.14;
      const tapL = Math.max(0, Math.sin(beat));
      const tapR = Math.max(0, -Math.sin(beat));
      if (tapL > 0.35) {
        const lift = (tapL - 0.35) / 0.65;
        feet[0][1] = lift * legScale * 0.22;
        feet[0][0] += lift * legScale * 0.14;
        legInStance[0] = false;
      }
      if (tapR > 0.35) {
        const lift = (tapR - 0.35) / 0.65;
        feet[2][1] = lift * legScale * 0.22;
        feet[2][0] += lift * legScale * 0.14;
        legInStance[2] = false;
      }
    } else if (mode === 'WAVE') {
      // Shift weight onto rear+opposite support triangle, lift front paw high, and wave!
      const cycle = (t * 0.42) % 2.0; // 0..1 wave FR, 1..2 wave FL
      const waveRight = cycle < 1.0;
      const local = cycle % 1.0;
      const env = smoothstep(0.06, 0.22, local) * (1 - smoothstep(0.78, 0.94, local));
      const waveLeg = waveRight ? 2 : 0;
      const sideSign = waveRight ? 1 : -1;

      tShiftX = -legScale * 0.09 * env;
      tShiftZ = -sideSign * legScale * 0.11 * env;
      tShiftY = legScale * 0.03 * env;
      tPitch = 0.14 * env; // nose tilts up proudly!
      tRoll = -sideSign * 0.09 * env;

      if (env > 0.02) {
        const osc = Math.sin(local * Math.PI * 8) * env;
        feet[waveLeg][0] += legScale * (0.34 * env + 0.08 * osc);
        feet[waveLeg][1] = legScale * (0.56 * env + 0.10 * Math.cos(local * Math.PI * 8) * env);
        feet[waveLeg][2] += sideSign * legScale * (0.06 * env + 0.14 * osc);
        legInStance[waveLeg] = env < 0.08;
      }
    } else if (mode === 'JUMP') {
      // 5-phase C1-continuous ballistic jump (zero pop, zero body-vs-foot lag, real push-off & tuck!):
      //  1) 0.00-0.26: Crouch & coil (feet planted)
      //  2) 0.26-0.39: Explosive push-off extension (feet still planted pushing floor!)
      //  3) 0.39-0.73: True parabolic airborne arc + symmetric mid-air leg tuck
      //  4) 0.73-0.87: Cushioned landing impact absorption (feet planted)
      //  5) 0.87-1.00: Smooth recovery to ready stance
      const p = (t * 0.52) % 1.0;
      const dropAmt = maxSafeDrop * 0.82;
      const pushExt = maxSafeRise * 0.72;
      const apexH = legScale * 0.66;
      directBodySync = t > 0.18;

      if (p < 0.26) {
        const u = smoothstep(0.00, 0.26, p);
        tShiftY = -dropAmt * u;
        tPitch = -0.10 * u;
        tShiftX = -0.04 * legScale * u;
      } else if (p < 0.39) {
        const u = (p - 0.26) / 0.13;
        const e = u * u * (3 - 2 * u);
        tShiftY = lerp(-dropAmt, pushExt, e);
        tPitch = lerp(-0.10, 0.15, e);
        tShiftX = lerp(-0.04, 0.02, e) * legScale;
      } else if (p < 0.73) {
        const u = (p - 0.39) / 0.34;
        const parabola = 4 * u * (1 - u);         // 0 -> 1 -> 0 gravity curve
        const tuck = Math.sin(Math.PI * u);       // 0 at takeoff -> 1 at apex -> 0 at touchdown
        tShiftY = pushExt + apexH * parabola;
        tPitch = 0.15 * Math.cos(Math.PI * u);
        tShiftX = 0.02 * legScale * Math.cos(Math.PI * u);
        const airFootY = (tShiftY - pushExt) + (pushExt + dropAmt * 0.56) * tuck;
        for (let i = 0; i < 4; i++) {
          feet[i][1] = Math.max(0, airFootY);
          feet[i][2] *= (1 - 0.10 * tuck);
          feet[i][0] += (i === 0 || i === 2 ? -1 : 1) * legScale * 0.055 * tuck;
          legInStance[i] = false;
        }
      } else if (p < 0.87) {
        const u = (p - 0.73) / 0.14;
        const e = Math.sin(u * Math.PI * 0.5);
        tShiftY = lerp(pushExt, -dropAmt * 0.64, e);
        tPitch = lerp(-0.15, -0.05, e);
        tShiftX = lerp(-0.02, 0.0, e) * legScale;
      } else {
        const u = smoothstep(0.87, 1.00, p);
        tShiftY = lerp(-dropAmt * 0.64, 0, u);
        tPitch = lerp(-0.05, 0, u);
      }
    } else if (mode === 'SENTRY') {
      // Alert guard stance with smooth horizontal sonar head/body sweep!
      const scan = Math.sin(t * 1.25);
      tTwist = scan * 0.32;
      tPitch = 0.04 + Math.sin(t * 2.5) * 0.025;
      tShiftY = legScale * 0.03;
    } else if (mode === 'SLEEP') {
      // Gently fold & lower chassis onto the ground into flat resting sleep pose
      tShiftY = -Math.max(0.05, realBellyGap - 0.025) + Math.sin(simTime * 0.9) * 0.006;
      for (let i = 0; i < 4; i++) {
        feet[i][2] *= 1.15;
      }
    }

    const kb = directBodySync ? 1.0 : k;
    bodyShiftX = lerp(bodyShiftX, tShiftX, kb);
    bodyShiftY = lerp(bodyShiftY, tShiftY, kb);
    bodyShiftZ = lerp(bodyShiftZ, tShiftZ, kb);
    bodyPitch = lerp(bodyPitch, tPitch, kb);
    bodyRoll = lerp(bodyRoll, tRoll, kb);
    bodyTwist = lerp(bodyTwist, tTwist, kb);

    for (let leg = 0; leg < 4; leg++) {
      const geo = legKinematics[leg];
      if (!geo) continue;
      targetJointRad[leg] = solveLegIKBody(geo, groundToBodyLocal(feet[leg]));
    }
  }

  function updateSimulation(dt, now) {
    if (emergencyStopped) return;
    simTime += dt;

    // Continuous smooth vertical ride-height glide while Subir / Bajar is held
    const vb = getSafeVerticalBounds();
    const minH = -vb.maxSafeDrop * 0.92;
    const maxH = vb.maxSafeRise * 0.92;
    if (heightHoldDir !== 0 && (now - heightHoldStart) > 170) {
      const rate = (heightHoldDir > 0 ? maxH : Math.abs(minH)) * 1.15;
      userHeightTarget = clamp(userHeightTarget + heightHoldDir * rate * dt, minH, maxH);
      updateHeightUI(true);
    } else {
      userHeightTarget = clamp(userHeightTarget, minH, maxH);
    }
    userHeightOffset = lerp(userHeightOffset, userHeightTarget, clamp(dt * 10.5, 0.08, 0.34));

    // 1. Manual 12-servo slider mode (dragging joint sliders directly)
    if (manualJointMode) {
      isMirroringHardware = false;
      strideScale = 0;
      bodyShiftX = lerp(bodyShiftX, 0, 0.15);
      bodyShiftY = lerp(bodyShiftY, 0, 0.15);
      bodyShiftZ = lerp(bodyShiftZ, 0, 0.15);
      bodyPitch = lerp(bodyPitch, 0, 0.15);
      bodyRoll = lerp(bodyRoll, 0, 0.15);
      bodyTwist = lerp(bodyTwist, 0, 0.15);
      return;
    }

    // 2. REAL ESP32 SERVO MIRRORING (ALWAYS mirrors real hardware angles when connected in 'auto' or 'hardware'!)
    const freshHardware = hardwareConnected && hardwareServos && (now - hardwareServosTimestamp < 4000);
    if (freshHardware && (angleSource === 'hardware' || angleSource === 'auto')) {
      isMirroringHardware = true;
      strideScale = 0;
      for (let leg = 0; leg < 4; leg++) {
        for (let j = 0; j < 3; j++) {
          targetJointRad[leg][j] = servoDegToJointRad(leg, j, hardwareServos[leg][j]);
        }
        legInStance[leg] = footWorldPos[leg][1] < 0.055;
      }
      // Neutralize local body offset so the 3D legs directly reflect real servo angles + real IMU attitude
      bodyShiftX = lerp(bodyShiftX, 0, 0.18);
      bodyShiftY = lerp(bodyShiftY, 0, 0.18);
      bodyShiftZ = lerp(bodyShiftZ, 0, 0.18);
      bodyPitch = lerp(bodyPitch, clamp(imuPitchRad, -0.35, 0.35), 0.15);
      bodyRoll = lerp(bodyRoll, clamp(imuRollRad, -0.35, 0.35), 0.15);
      bodyTwist = lerp(bodyTwist, 0, 0.18);
      return;
    }

    isMirroringHardware = false;

    // 3. Direct interactive drive (Joystick / D-pad / Rotate / WASD) when in Simulation/Demo
    const drive = getActiveDriveVector(now);
    if (drive.hasManualDrive) {
      const style = (robotMode === 'TROT' || demoGait === 'TROT') ? 'TROT'
                  : (robotMode === 'CRAWL' ? 'CRAWL' : 'WALK_FWD');
      stepLocomotionGait(dt, drive.fwd, drive.strafe, drive.turn, style);
      return;
    }

    // 4. Active NEUN Mode (or Demo Gait)
    const activeMode = demoRunning && robotMode === 'STAND' ? demoGait : robotMode;
    const isLocomotionMode = ['WALK_FWD', 'TROT', 'CRAWL', 'TURN_LEFT', 'TURN_RIGHT', 'CRAB_LEFT', 'CRAB_RIGHT', 'SPIRAL', 'EXPLORE', 'FOLLOW'].includes(activeMode);
    if (!isLocomotionMode) strideScale = 0;

    switch (activeMode) {
      case 'WALK_FWD':
        stepLocomotionGait(dt, 1.0, 0, 0, 'WALK_FWD');
        break;
      case 'TROT':
        stepLocomotionGait(dt, 1.0, 0, 0, 'TROT');
        break;
      case 'CRAWL':
        stepLocomotionGait(dt, 0.85, 0, 0, 'CRAWL');
        break;
      case 'TURN_LEFT':
        stepLocomotionGait(dt, 0, 0, -1.0, demoGait === 'TROT' ? 'TROT' : 'WALK_FWD');
        break;
      case 'TURN_RIGHT':
        stepLocomotionGait(dt, 0, 0,  1.0, demoGait === 'TROT' ? 'TROT' : 'WALK_FWD');
        break;
      case 'CRAB_LEFT':
        stepLocomotionGait(dt, 0, -1.0, 0, 'WALK_FWD');
        break;
      case 'CRAB_RIGHT':
        stepLocomotionGait(dt, 0,  1.0, 0, 'WALK_FWD');
        break;
      case 'SPIRAL': {
        const radiusWave = 0.45 + 0.35 * Math.sin(simTime * 0.25);
        stepLocomotionGait(dt, 0.92, 0, radiusWave, 'WALK_FWD');
        break;
      }
      case 'EXPLORE': {
        exploreTimer -= dt;
        if (exploreTimer <= 0) {
          exploreTimer = 2.6 + Math.random() * 2.4;
          const distFromOrigin = Math.hypot(bodyX, bodyZ);
          if (distFromOrigin > 5.0) {
            // Gently steer back toward center
            const angleToCenter = Math.atan2(-bodyZ, -bodyX);
            let diff = angleToCenter - (-bodyHeading);
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            exploreTurnTarget = clamp(-diff * 0.7, -0.85, 0.85);
          } else {
            exploreTurnTarget = (Math.random() - 0.5) * 1.1;
          }
        }
        exploreTurnCurrent = lerp(exploreTurnCurrent, exploreTurnTarget, clamp(dt * 2.2, 0, 0.2));
        stepLocomotionGait(dt, 0.92, 0, exploreTurnCurrent, 'WALK_FWD');
        break;
      }
      case 'FOLLOW': {
        const weave = Math.sin(simTime * 0.9) * 0.32;
        stepLocomotionGait(dt, 1.0, 0, weave, 'FOLLOW');
        break;
      }
      default:
        updateSpecialModePose(dt, activeMode);
        break;
    }
  }

  // ========================================================================
  // RENDER LOOP (Pure WebGL 60 FPS)
  // ========================================================================
  function render() {
    raf = requestAnimationFrame(render);
    if (!gl || !meshProg || width < 2 || height < 2) return;

    const now = performance.now();
    const dt = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, 0.05) : 0.016;
    lastFrameTime = now;

    if (meshes.length) {
      updateSimulation(dt, now);

      // 2nd-order critically damped joint filter (zeta = 1.0 -> zero overshoot, 1:1 with ESP32-S3!)
      const activeM = demoRunning && robotMode === 'STAND' ? demoGait : robotMode;
      const isJump = !isMirroringHardware && activeM === 'JUMP';
      const omega = isMirroringHardware ? 28.0 : (isJump ? 32.0 : (manualJointMode ? 22.0 : 24.0));
      const maxVel = (isJump ? 360 : (isMirroringHardware ? 300 : 240)) * Math.PI / 180;
      const maxAcc = (isJump ? 3600 : 2200) * Math.PI / 180;
      const h = Math.min(dt, 0.04) * 0.5;
      for (let leg = 0; leg < 4; leg++) {
        for (let j = 0; j < 3; j++) {
          let pos = shownJointRad[leg][j];
          let vel = jointVelRad[leg][j];
          const tgt = targetJointRad[leg][j];
          if (Math.abs(tgt - pos) < 0.002 && Math.abs(vel) < 0.02) {
            pos = tgt;
            vel = 0;
          } else {
            for (let sub = 0; sub < 2; sub++) {
              const acc = clamp(omega * omega * (tgt - pos) - 2 * omega * vel, -maxAcc, maxAcc);
              vel = clamp(vel + acc * h, -maxVel, maxVel);
              pos += vel * h;
            }
          }
          shownJointRad[leg][j] = pos;
          jointVelRad[leg][j] = vel;
        }
      }
      syncServoDegreesFromJoints();
    }

    // Smooth camera orbit + target tracking
    const camLerp = clamp(dt * 9, 0.08, 0.35);
    orbitYaw = lerp(orbitYaw, targetYaw, camLerp);
    orbitPitch = lerp(orbitPitch, targetPitch, camLerp);
    distance = lerp(distance, targetDistance, camLerp);

    const desiredTargetX = followCamera ? bodyX : 0;
    const desiredTargetZ = followCamera ? bodyZ : 0;
    const desiredTargetY = Math.max(0.18, (chassisElevation + userHeightOffset) * 0.62 + Math.max(0, bodyShiftY) * 0.35);
    camTargetX = lerp(camTargetX, desiredTargetX, clamp(dt * 6, 0.05, 0.25));
    camTargetY = lerp(camTargetY, desiredTargetY, clamp(dt * 6, 0.05, 0.25));
    camTargetZ = lerp(camTargetZ, desiredTargetZ, clamp(dt * 6, 0.05, 0.25));

    const eye = [
      camTargetX + Math.sin(orbitYaw) * distance * Math.cos(orbitPitch),
      camTargetY + Math.sin(orbitPitch) * distance,
      camTargetZ + Math.cos(orbitYaw) * distance * Math.cos(orbitPitch)
    ];

    const view = m4LookAt(eye, [camTargetX, camTargetY, camTargetZ], [0, 1, 0]);
    const proj = m4Perspective(Math.PI / 4.3, width / height, 0.05, 80);
    const vp = m4Multiply(proj, view);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!meshes.length) return;

    const bodyModel = bodyWorldMatrix();

    // Compute exact FK foot world positions (for pinpoint shadows & stance rings!)
    for (let leg = 0; leg < 4; leg++) {
      const geo = legKinematics[leg];
      if (!geo) continue;
      const mLeg = m4Multiply(bodyModel, componentMatrix(leg, 4, shownJointRad));
      footWorldPos[leg] = m4TransformPoint(mLeg, geo.foot);
    }

    // --- PASS 1: INFINITE SCROLLING CYBER FLOOR GRID ---
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    gl.useProgram(floorProg);
    const fPosLoc = gl.getAttribLocation(floorProg, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, floorQuadBuf);
    gl.enableVertexAttribArray(fPosLoc);
    gl.vertexAttribPointer(fPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(gl.getUniformLocation(floorProg, 'uVp'), false, vp);
    gl.uniform3fv(gl.getUniformLocation(floorProg, 'uCenter'), [bodyX, 0, bodyZ]);
    gl.uniform2fv(gl.getUniformLocation(floorProg, 'uRobotXZ'), [bodyX, bodyZ]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // --- PASS 2: CHASSIS DROP SHADOW, HEADING ARROW, HEADLIGHT BEAM & 4 FOOT CONTACT RINGS ---
    gl.useProgram(solidProg);
    const sPosLoc = gl.getAttribLocation(solidProg, 'aPosition');
    const sMvpLoc = gl.getUniformLocation(solidProg, 'uMvp');
    const sColLoc = gl.getUniformLocation(solidProg, 'uColor');
    const sRadLoc = gl.getUniformLocation(solidProg, 'uRadialFalloff');

    const drawOverlay = (geoBuf, mat, rgba, radial) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, geoBuf.buf);
      gl.enableVertexAttribArray(sPosLoc);
      gl.vertexAttribPointer(sPosLoc, 3, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(sMvpLoc, false, m4Multiply(vp, mat));
      gl.uniform4fv(sColLoc, rgba);
      gl.uniform1f(sRadLoc, radial ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, geoBuf.count);
    };

    // Soft chassis ground shadow (shrinks when jumping!)
    const heightRatio = clamp((chassisElevation + userHeightOffset + bodyShiftY) / 0.65, 0.35, 2.2);
    const shadowScale = clamp(1.18 - (heightRatio - 1.0) * 0.25, 0.55, 1.35);
    const shadowAlpha = clamp(0.56 / Math.sqrt(heightRatio), 0.14, 0.65);
    const shCos = Math.cos(bodyHeading), shSin = Math.sin(bodyHeading);
    const shX = bodyX + bodyShiftX * shCos + bodyShiftZ * shSin;
    const shZ = bodyZ - bodyShiftX * shSin + bodyShiftZ * shCos;
    const bodyShadowMat = m4Multiply(
      m4Translate(shX, 0.003, shZ),
      m4Multiply(m4RotateY(bodyHeading), m4Scale(modelRadius * 0.72 * shadowScale, 1, modelRadius * 0.48 * shadowScale))
    );
    drawOverlay(discBuf, bodyShadowMat, [0.01, 0.02, 0.04, shadowAlpha], true);

    // Subtle ground heading chevron in front of NEUN
    const arrowMat = m4Multiply(
      m4Translate(bodyX, 0.005, bodyZ),
      m4Multiply(m4RotateY(bodyHeading), m4Translate(modelRadius * 0.96, 0, 0))
    );
    drawOverlay(arrowBuf, arrowMat, [0.20, 0.85, 0.92, 0.48], false);

    // Optional Headlight floor beam cone when headlights toggled ON in panel
    if (headlightsOn) {
      const beamMat = m4Multiply(
        m4Translate(bodyX, 0.004, bodyZ),
        m4Multiply(m4RotateY(bodyHeading), m4Translate(modelRadius * 0.62, 0, 0))
      );
      drawOverlay(coneBuf, beamMat, [0.82, 0.95, 1.0, 0.18 * headlightIntensity], false);
    }

    // 4 Dynamic Foot Contact Shadows + Stance Rings!
    for (let leg = 0; leg < 4; leg++) {
      const fp = footWorldPos[leg];
      const footH = Math.max(0, fp[1]);
      const grounded = footH < 0.055;

      // Soft contact shadow directly under each foot tip
      const fShadowR = clamp(0.14 - footH * 0.12, 0.05, 0.15);
      const fShadowA = clamp(0.45 - footH * 0.7, 0.10, 0.48);
      drawOverlay(
        discBuf,
        m4Multiply(m4Translate(fp[0], 0.004, fp[2]), m4Scale(fShadowR, 1, fShadowR)),
        [0.01, 0.02, 0.04, fShadowA],
        true
      );

      // Glowing contact ring (bright emerald-cyan when planted, warm amber pulse when lifted!)
      const ringR = grounded ? 0.105 : clamp(0.085 + footH * 0.16, 0.08, 0.18);
      const ringCol = grounded
        ? [0.18, 0.94, 0.68, 0.62]
        : [1.00, 0.68, 0.20, clamp(0.42 - footH * 0.45, 0.14, 0.42)];
      drawOverlay(
        ringBuf,
        m4Multiply(m4Translate(fp[0], 0.006, fp[2]), m4Scale(ringR, 1, ringR)),
        ringCol,
        false
      );
    }

    // --- PASS 3: OPAQUE ARTICULATED NEUN ROBOT MESHES ---
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.useProgram(meshProg);

    const aPos = gl.getAttribLocation(meshProg, 'aPosition');
    const aNorm = gl.getAttribLocation(meshProg, 'aNormal');
    const uMvp = gl.getUniformLocation(meshProg, 'uMvp');
    const uModel = gl.getUniformLocation(meshProg, 'uModel');
    const uColor = gl.getUniformLocation(meshProg, 'uColor');
    const uEyePos = gl.getUniformLocation(meshProg, 'uEyePos');
    const uSpec = gl.getUniformLocation(meshProg, 'uSpecStrength');
    const uShine = gl.getUniformLocation(meshProg, 'uShininess');
    const uEmis = gl.getUniformLocation(meshProg, 'uEmissive');
    const uEmerg = gl.getUniformLocation(meshProg, 'uEmergency');

    gl.uniform3fv(uEyePos, eye);
    gl.uniform1f(uEmerg, emergencyStopped ? 1.0 : 0.0);

    // Precompute segment matrices per leg once per frame
    const legSegMats = [null, null, null, null];
    for (let leg = 0; leg < 4; leg++) {
      legSegMats[leg] = {
        2: m4Multiply(bodyModel, componentMatrix(leg, 2, shownJointRad)),
        3: m4Multiply(bodyModel, componentMatrix(leg, 3, shownJointRad)),
        4: m4Multiply(bodyModel, componentMatrix(leg, 4, shownJointRad))
      };
    }

    for (const part of meshes) {
      const model = (part.leg <= 3 && part.segment >= 2) ? legSegMats[part.leg][part.segment] : bodyModel;
      gl.bindBuffer(gl.ARRAY_BUFFER, part.positionBuffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, part.normalBuffer);
      gl.enableVertexAttribArray(aNorm);
      gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);

      gl.uniformMatrix4fv(uModel, false, model);
      gl.uniformMatrix4fv(uMvp, false, m4Multiply(vp, model));
      const mat = part.material;
      const emis = (part.accent === 'led' && headlightsOn) ? 1.15 : mat.emissive;
      gl.uniform3fv(uColor, mat.color);
      gl.uniform1f(uSpec, mat.spec);
      gl.uniform1f(uShine, mat.shininess);
      gl.uniform1f(uEmis, emis);
      gl.drawArrays(gl.TRIANGLES, 0, part.faceCount * 3);
    }

    // Periodic lightweight HUD & live servo UI sync (~12 Hz)
    if (now - lastHudSync > 85) {
      lastHudSync = now;
      updateLiveHudUI();
    }
  }

  // ========================================================================
  // UI, CONTROLS, DRAG-AND-DROP .BIN / .STL LOADER & PUBLIC API
  // ========================================================================
  function updateStatusText() {
    const el = getStateLabel();
    if (el) el.textContent = modelStatus;
  }

  function updateModelBadgeUI() {
    const modeTag = MODE_LABELS[robotMode] || robotMode;
    if (emergencyStopped) {
      modelStatus = 'PARADA DE EMERGENCIA · chasis bloqueado';
    } else if (manualJointMode) {
      modelStatus = `Articulación manual · ${modelSourceLabel}`;
    } else {
      modelStatus = `${modelSourceLabel} · ${modeTag}`;
    }
    updateStatusText();

    const modeBadge = document.getElementById('neun3dModeHud');
    if (modeBadge) {
      const activeMode = demoRunning && robotMode === 'STAND' ? demoGait : robotMode;
      modeBadge.textContent = activeMode;
    }
    const srcBadge = document.getElementById('neun3dSourceBadge');
    if (srcBadge) {
      srcBadge.textContent = modelSourceType === 'bin'
        ? 'STL BIN REAL'
        : (modelSourceType === 'stl' ? 'STL CARGADO' : 'MODELO BASE NEUN');
      srcBadge.classList.toggle('is-real', modelSourceType === 'bin' || modelSourceType === 'stl');
    }
  }

  function setCalToast(msg, isError) {
    const el = document.getElementById('neun3dCalToast');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-err', Boolean(isError));
    el.classList.toggle('is-ok', Boolean(msg) && !isError);
  }

  function syncCalibrationDrawerUI(forceSliders) {
    const calBtn = document.getElementById('neun3dCalToggle');
    if (calBtn) {
      calBtn.classList.toggle('is-calibrated', hardwareCalibrated);
      calBtn.classList.toggle('active', calDrawerOpen);
    }
    const skipSliders = !forceSliders && (performance.now() - calSliderActiveAt < 750);
    for (let leg = 0; leg < 4; leg++) {
      const pwmSub = document.getElementById(`neun3dJlPwm_${leg}`);
      if (pwmSub) {
        const r = hardwareRawServos[leg];
        const c = hardwareCenters[leg];
        const hasOffset = hardwareCalibrated || c[0] !== 90 || c[1] !== 90 || c[2] !== 90
                       || r[0] !== Math.round(currentServoDeg[leg][0])
                       || r[1] !== Math.round(currentServoDeg[leg][1])
                       || r[2] !== Math.round(currentServoDeg[leg][2]);
        pwmSub.textContent = hasOffset ? `PWM ${r[0]}/${r[1]}/${r[2]}° · NVS ${c[0]}/${c[1]}/${c[2]}°` : '';
        pwmSub.style.display = hasOffset ? 'block' : 'none';
      }
      for (let j = 0; j < 3; j++) {
        const raw = Math.round(clamp(hardwareRawServos[leg][j], 10, 170));
        const dir = hardwareDirs[leg][j] < 0 ? -1 : 1;
        if (!skipSliders) {
          const sl = document.getElementById(`neun3dCalSl_${leg}_${j}`);
          const vl = document.getElementById(`neun3dCalVal_${leg}_${j}`);
          if (sl) sl.value = String(raw);
          if (vl) vl.textContent = `${raw}°`;
        }
        const db = document.getElementById(`neun3dCalDir_${leg}_${j}`);
        if (db) {
          db.textContent = dir > 0 ? '+1' : '-1';
          db.classList.toggle('is-neg', dir < 0);
        }
      }
    }
  }

  function refreshCalibrationFromApi(forceSliders) {
    return fetch('/api/servos', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d && Array.isArray(d.servos) && d.servos.length === 4) {
          setHardwareServos(d.servos, Boolean(d.connected), d.boot_source || '', d);
          syncCalibrationDrawerUI(Boolean(forceSliders));
        }
        return d;
      })
      .catch(() => null);
  }

  function postCalibrateAction(payload, okMsg) {
    return fetch('/api/servos/calibrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json().then(d => ({ ok: r.ok && d && d.ok !== false, data: d })))
      .then(({ ok, data }) => {
        if (!ok) {
          setCalToast(`Error: ${(data && (data.detail || data.error)) || 'sin respuesta'}`, true);
          return null;
        }
        if (okMsg) setCalToast(data.detail || okMsg, false);
        return refreshCalibrationFromApi(payload.action !== 'preview');
      })
      .catch(err => {
        setCalToast(`Sin conexión: ${err.message || err}`, true);
        return null;
      });
  }

  function buildJointTelemetryStrip() {
    let host = document.getElementById('neun3dJointTelemetry');
    if (!host) {
      const c = getCanvas();
      const card = c && (c.closest('.neun3d-card') || c.closest('.sim-stage-card'));
      if (!card) return;
      host = document.createElement('div');
      host.id = 'neun3dJointTelemetry';
      host.className = 'neun3d-joints-live';
      card.appendChild(host);
    }
    const legMeta = [
      { id: 0, code: 'FL', title: 'Del. Izq', ch: 'CH 0–2' },
      { id: 1, code: 'RL', title: 'Tras. Izq', ch: 'CH 3–5' },
      { id: 2, code: 'FR', title: 'Del. Der', ch: 'CH 6–8' },
      { id: 3, code: 'RR', title: 'Tras. Der', ch: 'CH 9–11' }
    ];
    const jointShort = ['C', 'F', 'T'];
    host.innerHTML = `
      <div class="neun3d-jl-head">
        <div class="neun3d-jl-title">
          <span class="neun3d-jl-dot" id="neun3dJlDot"></span>
          <span>POSICIÓN DE ARTICULACIONES (12 SERVOS)</span>
          <span class="neun3d-jl-src" id="neun3dJlSrc">SIMULACIÓN 3D</span>
        </div>
        <div class="neun3d-jl-tools">
          <button type="button" class="neun3d-cal-toggle" id="neun3dCalToggle" title="Ajustar postura inicial STAND y sentidos por servo (se guarda en NVS del ESP32)">⚙ Calibrar STAND</button>
          <div class="neun3d-jl-switch" role="group" aria-label="Fuente de ángulos">
            <button type="button" class="active" data-neun3d-src="auto" title="Automático: espeja servos reales si el ESP32 está conectado">Auto</button>
            <button type="button" data-neun3d-src="hardware" title="Mostrar posición real leída del ESP32">Real</button>
            <button type="button" data-neun3d-src="kinematics" title="Mostrar cinemática local 3D">Sim 3D</button>
          </div>
        </div>
      </div>
      <div class="neun3d-jl-grid">
        ${legMeta.map(leg => `
          <div class="neun3d-jl-leg" id="neun3dJlLeg${leg.id}">
            <div class="neun3d-jl-leg-head">
              <b>${leg.code}</b>
              <span>${leg.title}</span>
              <em>${leg.ch}</em>
            </div>
            ${jointShort.map((jn, j) => `
              <div class="neun3d-jl-row">
                <span class="neun3d-jl-j">${jn}</span>
                <div class="neun3d-jl-bar">
                  <i class="neun3d-jl-mid"></i>
                  <span class="neun3d-jl-fill" id="neun3dJlBar_${leg.id}_${j}"></span>
                </div>
                <span class="neun3d-jl-deg" id="neun3dJlDeg_${leg.id}_${j}">90°</span>
              </div>
            `).join('')}
            <div class="neun3d-jl-pwm" id="neun3dJlPwm_${leg.id}" style="display:none"></div>
          </div>
        `).join('')}
      </div>
      <div class="neun3d-cal-drawer" id="neun3dCalDrawer" hidden>
        <div class="neun3d-cal-banner">
          <span><b>Calibración STAND (MG90S 3 cables):</b> mové cada servo hasta dejar las patas en postura inicial STAND y tocá <b>Guardar STAND</b> (queda en NVS al encender), o usá <b>Centrar a 90°</b> para reacomodar los horns con destornillador.</span>
        </div>
        <div class="neun3d-cal-actions">
          <button type="button" class="neun3d-cal-btn primary" id="neun3dCalSave">💾 Guardar Postura Actual como STAND</button>
          <button type="button" class="neun3d-cal-btn cyan" id="neun3dCalCenter90">🎯 Centrar 12 Servos a 90° (Armar Horns)</button>
          <button type="button" class="neun3d-cal-btn warn" id="neun3dCalReset">↺ Restaurar Fábrica (90°)</button>
          <span class="neun3d-cal-toast" id="neun3dCalToast"></span>
        </div>
        <div class="neun3d-cal-grid">
          ${legMeta.map(leg => `
            <div class="neun3d-cal-leg">
              <div class="neun3d-cal-leg-head"><b>${leg.code}</b> <span>${leg.title}</span> <em>${leg.ch}</em></div>
              ${jointShort.map((jn, j) => `
                <div class="neun3d-cal-row">
                  <span class="neun3d-cal-j">${jn}</span>
                  <input type="range" min="15" max="165" step="1" value="90"
                         id="neun3dCalSl_${leg.id}_${j}"
                         data-cal-leg="${leg.id}" data-cal-joint="${j}">
                  <span class="neun3d-cal-val" id="neun3dCalVal_${leg.id}_${j}">90°</span>
                  <button type="button" class="neun3d-cal-dir" id="neun3dCalDir_${leg.id}_${j}"
                          data-cal-dir-leg="${leg.id}" data-cal-dir-joint="${j}"
                          title="Invertir sentido de giro (+1 / -1) de este servo">+1</button>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    host.querySelectorAll('[data-neun3d-src]').forEach(btn => {
      btn.addEventListener('click', () => {
        setAngleSource(btn.dataset.neun3dSrc);
        host.querySelectorAll('[data-neun3d-src]').forEach(b =>
          b.classList.toggle('active', b.dataset.neun3dSrc === angleSource));
      });
    });

    const toggleBtn = document.getElementById('neun3dCalToggle');
    const drawer = document.getElementById('neun3dCalDrawer');
    if (toggleBtn && drawer) {
      toggleBtn.addEventListener('click', () => {
        calDrawerOpen = !calDrawerOpen;
        drawer.hidden = !calDrawerOpen;
        toggleBtn.classList.toggle('active', calDrawerOpen);
        if (calDrawerOpen) refreshCalibrationFromApi(true);
      });
    }

    const saveBtn = document.getElementById('neun3dCalSave');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        manualJointMode = false;
        postCalibrateAction({ action: 'save_stand' }, '✓ Postura STAND guardada en memoria NVS');
      });
    }
    const c90Btn = document.getElementById('neun3dCalCenter90');
    if (c90Btn) {
      c90Btn.addEventListener('click', () => {
        postCalibrateAction({ action: 'center_90' }, '✓ 12 servos clavados a 90° puros para alinear horns');
      });
    }
    const rstBtn = document.getElementById('neun3dCalReset');
    if (rstBtn) {
      rstBtn.addEventListener('click', () => {
        manualJointMode = false;
        postCalibrateAction({ action: 'reset' }, '✓ Calibración restaurada a 90° de fábrica');
      });
    }

    host.querySelectorAll('[data-cal-leg]').forEach(sl => {
      const sendSlider = (immediate) => {
        const leg = Number(sl.dataset.calLeg);
        const joint = Number(sl.dataset.calJoint);
        const angle = Math.round(clamp(Number(sl.value), 15, 165));
        calSliderActiveAt = performance.now();
        const vl = document.getElementById(`neun3dCalVal_${leg}_${joint}`);
        if (vl) vl.textContent = `${angle}°`;
        hardwareRawServos[leg][joint] = angle;
        const key = `${leg}_${joint}`;
        if (calSendTimers[key]) clearTimeout(calSendTimers[key]);
        const fire = () => {
          postCalibrateAction({ action: 'preview', leg, joint, angle }, null);
          if (!hardwareConnected) {
            const ratio = hardwareDirs[leg][joint] * SERVO_SIGN[leg][joint];
            const pose = clamp(90 + ratio * (angle - hardwareCenters[leg][joint]), 10, 170);
            setManualJoint(leg * 3 + joint, pose);
          }
        };
        if (immediate) fire();
        else calSendTimers[key] = setTimeout(fire, 55);
      };
      sl.addEventListener('input', () => sendSlider(false));
      sl.addEventListener('change', () => sendSlider(true));
    });

    host.querySelectorAll('[data-cal-dir-leg]').forEach(btn => {
      btn.addEventListener('click', () => {
        const leg = Number(btn.dataset.calDirLeg);
        const joint = Number(btn.dataset.calDirJoint);
        const nextDir = hardwareDirs[leg][joint] > 0 ? -1 : 1;
        hardwareDirs[leg][joint] = nextDir;
        syncCalibrationDrawerUI(false);
        postCalibrateAction(
          { action: 'set_dir', leg, joint, dir: nextDir },
          `✓ Sentido ${legMeta[leg].code} ${jointShort[joint]} cambiado a ${nextDir > 0 ? '+1' : '-1'}`
        );
      });
    });
  }

  function updateLiveHudUI() {
    // Update 4 leg stance contact indicators inside HUD
    for (let leg = 0; leg < 4; leg++) {
      const dot = document.getElementById(`neun3dFoot${leg}`);
      if (dot) {
        const planted = footWorldPos[leg][1] < 0.055;
        dot.classList.toggle('planted', planted);
        dot.classList.toggle('airborne', !planted);
      }
    }

    // Update live 12-servo telemetry strip (real hardware angles when connected, 1:1 sim in demo)
    const displayServos = (isMirroringHardware && hardwareServos) ? hardwareServos : currentServoDeg;
    const srcEl = document.getElementById('neun3dJlSrc');
    const dotEl = document.getElementById('neun3dJlDot');
    if (srcEl) {
      if (isMirroringHardware) {
        const extra = hardwareBootSource && hardwareBootSource !== 'STAND_DEFAULT' ? ` · ${hardwareBootSource}` : '';
        srcEl.textContent = `SERVOS REALES ESP32${extra}`;
        srcEl.classList.add('is-real');
      } else {
        srcEl.textContent = hardwareConnected ? 'SIMULACIÓN 3D (ESP32 en espera)' : 'SIMULACIÓN 3D';
        srcEl.classList.remove('is-real');
      }
    }
    if (dotEl) dotEl.classList.toggle('is-real', isMirroringHardware);

    for (let leg = 0; leg < 4; leg++) {
      const legCard = document.getElementById(`neun3dJlLeg${leg}`);
      if (legCard) legCard.classList.toggle('airborne', footWorldPos[leg][1] >= 0.055);
      for (let j = 0; j < 3; j++) {
        const deg = Math.round(clamp(displayServos[leg][j], 0, 180));
        const degEl = document.getElementById(`neun3dJlDeg_${leg}_${j}`);
        const barEl = document.getElementById(`neun3dJlBar_${leg}_${j}`);
        if (degEl) degEl.textContent = `${deg}°`;
        if (barEl) {
          // Center bar at 90 deg (range 10..170 deg -> ±80 deg)
          const norm = clamp((deg - 90) / 80, -1, 1);
          const leftPct = norm >= 0 ? 50 : 50 + norm * 50;
          const widthPct = Math.max(2, Math.abs(norm) * 50);
          barEl.style.left = `${leftPct.toFixed(1)}%`;
          barEl.style.width = `${widthPct.toFixed(1)}%`;
          barEl.classList.toggle('moved', Math.abs(deg - 90) >= 3);
          barEl.classList.toggle('is-real', isMirroringHardware);
        }
        // On /simulador/, also mirror live real servo angles onto the 12 joint sliders (unless user is dragging)
        if (isMirroringHardware && !manualJointMode && (performance.now() - lastJointSliderDragAt > 600)) {
          const ch = leg * 3 + j;
          const sl = document.querySelector(`[data-joint-slider="${ch}"]`);
          const vl = document.querySelector(`[data-joint-value="${ch}"]`);
          if (sl) sl.value = String(deg);
          if (vl) vl.textContent = `${deg}°`;
        }
      }
    }

    // Update top HUD badge to make REAL vs SIM immediately obvious
    const modeBadge = document.getElementById('neun3dModeHud');
    if (modeBadge) {
      const activeMode = demoRunning && robotMode === 'STAND' ? demoGait : robotMode;
      modeBadge.textContent = isMirroringHardware ? `REAL · ${activeMode}` : activeMode;
      modeBadge.classList.toggle('is-real', isMirroringHardware);
    }

    // Notify optional listener (app.js to sync servo cards s0c..s3t live)
    if (typeof window.onNeun3dServoFrame === 'function') {
      window.onNeun3dServoFrame(displayServos, {
        mode: demoRunning && robotMode === 'STAND' ? demoGait : robotMode,
        stance: legInStance,
        isRealHardware: isMirroringHardware,
        bodyX, bodyZ, bodyHeading
      });
    }
  }

  function startStandaloneServoPoll() {
    // Only poll directly when app.js is NOT running (e.g., /simulador/ standalone page)
    if (window.__NEUN_PANEL_POLLS_SERVOS) return;
    let busy = false;
    setInterval(() => {
      if (busy || document.hidden) return;
      busy = true;
      fetch('/api/servos', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          if (d && Array.isArray(d.servos) && d.servos.length === 4) {
            setHardwareServos(d.servos, Boolean(d.connected), d.boot_source || '', d);
            if (d.connected && d.mode) setRobotMode(d.mode);
          }
        })
        .catch(() => {})
        .finally(() => { busy = false; });
    }, 110);
  }

  function setIsometricView(immediate) {
    targetYaw = 0.72;
    targetPitch = 0.44;
    targetDistance = clamp(modelRadius * 2.9, 3.2, 7.2);
    if (immediate) {
      orbitYaw = targetYaw;
      orbitPitch = targetPitch;
      distance = targetDistance;
    }
  }

  function setCameraView(view) {
    const d = clamp(modelRadius * 2.9, 3.2, 7.2);
    if (view === 'front')       { targetYaw = Math.PI / 2; targetPitch = 0.14; targetDistance = d * 0.96; }
    else if (view === 'side')   { targetYaw = 0;           targetPitch = 0.12; targetDistance = d * 0.96; }
    else if (view === 'top')    { targetYaw = Math.PI / 2; targetPitch = 1.38; targetDistance = d * 1.15; }
    else if (view === 'bottom') { targetYaw = 0.72;        targetPitch = -0.75; targetDistance = d * 1.05; }
    else setIsometricView(false);
  }

  function setRobotMode(modeCode) {
    if (!modeCode) return;
    const upper = String(modeCode).toUpperCase();
    // Map legacy short names from simulator buttons
    const alias = {
      WALK: 'WALK_FWD', TROT: 'TROT', CRAWL: 'CRAWL', TURN: 'TURN_RIGHT',
      LIFT: 'ELEVATE', UPDOWN: 'ELEVATE', UP_DOWN: 'ELEVATE', SUBE_BAJA: 'ELEVATE', ASCENSO: 'ELEVATE'
    };
    const resolved = MODE_LABELS[upper] ? upper : (alias[upper] || 'STAND');

    if (robotMode !== resolved) {
      modeClock = 0;
      lastSpecialMode = resolved;
    }
    if (['ELEVATE', 'PUSHUP', 'JUMP', 'SLEEP'].includes(resolved)) {
      userHeightTarget = 0;
      heightHoldDir = 0;
      updateHeightUI();
    }
    robotMode = resolved;
    manualJointMode = false;
    if (resolved !== 'STAND') {
      demoRunning = false;
      const playBtn = document.getElementById('neun3dPlay');
      if (playBtn) playBtn.textContent = 'Demo de marcha';
    }

    // Highlight matching quick-mode buttons
    document.querySelectorAll('[data-neun3d-mode]').forEach(btn => {
      const m = btn.dataset.neun3dMode;
      const mapped = alias[m.toUpperCase()] || m.toUpperCase();
      btn.classList.toggle('active', mapped === resolved);
    });
    updateModelBadgeUI();
  }

  function setSimulationMode(mode) {
    const upper = String(mode || '').toUpperCase();
    const map = {
      WALK: 'WALK_FWD', WALK_FWD: 'WALK_FWD', TROT: 'TROT', CRAWL: 'CRAWL',
      TURN: 'TURN_RIGHT', TURN_LEFT: 'TURN_LEFT', TURN_RIGHT: 'TURN_RIGHT',
      CRAB_LEFT: 'CRAB_LEFT', CRAB_RIGHT: 'CRAB_RIGHT',
      TILT: 'TILT', DANCE: 'DANCE', WAVE: 'WAVE', PUSHUP: 'PUSHUP',
      ELEVATE: 'ELEVATE', UPDOWN: 'ELEVATE', UP_DOWN: 'ELEVATE', SUBE_BAJA: 'ELEVATE',
      JUMP: 'JUMP', SENTRY: 'SENTRY', EXPLORE: 'EXPLORE', SPIRAL: 'SPIRAL',
      SLEEP: 'SLEEP', STAND: 'STAND', LIFT: 'ELEVATE'
    };
    const resolved = map[upper];
    if (!resolved) return;

    demoGait = resolved;
    manualJointMode = false;

    // On clicking a gait mode button: activate it immediately if demo is running OR if it's a routine/non-stand mode
    const isRoutine = ['TILT', 'DANCE', 'WAVE', 'PUSHUP', 'ELEVATE', 'JUMP', 'SENTRY', 'SLEEP', 'STAND'].includes(resolved);
    if (isRoutine || demoRunning) {
      if (robotMode !== resolved) {
        modeClock = 0;
        lastSpecialMode = resolved;
      }
      if (['ELEVATE', 'PUSHUP', 'JUMP', 'SLEEP'].includes(resolved)) {
        userHeightTarget = 0;
        heightHoldDir = 0;
        updateHeightUI();
      }
      robotMode = resolved;
    } else if (robotMode !== 'STAND') {
      robotMode = resolved;
    }

    document.querySelectorAll('[data-neun3d-mode]').forEach(btn => {
      const m = map[String(btn.dataset.neun3dMode || '').toUpperCase()];
      btn.classList.toggle('active', m === resolved);
    });
    updateModelBadgeUI();
  }

  function toggleSimulation() {
    manualJointMode = false;
    emergencyStopped = false;
    if (robotMode !== 'STAND' && !demoRunning) {
      // Currently running a mode -> pause back to STAND
      robotMode = 'STAND';
      demoRunning = false;
    } else {
      demoRunning = !demoRunning;
      robotMode = demoRunning ? (demoGait === 'STAND' ? 'WALK_FWD' : demoGait) : 'STAND';
    }
    const btn = document.getElementById('neun3dPlay');
    if (btn) btn.textContent = (demoRunning || robotMode !== 'STAND') ? 'Pausar marcha' : 'Demo de marcha';
    updateModelBadgeUI();
  }

  function stopSimulation() {
    demoRunning = false;
    manualJointMode = false;
    robotMode = 'STAND';
    userHeightTarget = 0;
    userTiltPitch = 0;
    userTiltRoll = 0;
    heightHoldDir = 0;
    extDriveFwd = 0; extDriveStrafe = 0; extDriveTurn = 0; extDriveUntil = 0;
    heldControls.clear();
    document.querySelectorAll('[data-drive], [data-turn], [data-neun3d-height]').forEach(b => b.classList.remove('pressed'));
    const btn = document.getElementById('neun3dPlay');
    if (btn) btn.textContent = 'Demo de marcha';
    syncJointSlidersToNeutral();
    updateHeightUI();
    updateModelBadgeUI();
  }

  function resetPosition() {
    bodyX = 0; bodyZ = 0; bodyHeading = 0;
    userHeightTarget = 0;
    userHeightOffset = 0;
    userTiltPitch = 0;
    userTiltRoll = 0;
    heightHoldDir = 0;
    updateHeightUI();
    setIsometricView(false);
  }

  function setDriveVector(fwd, strafe, turn, holdMs) {
    extDriveFwd = clamp(Number(fwd) || 0, -1, 1);
    extDriveStrafe = clamp(Number(strafe) || 0, -1, 1);
    extDriveTurn = clamp(Number(turn) || 0, -1, 1);
    extDriveUntil = holdMs ? performance.now() + holdMs : 0;
    if (Math.hypot(extDriveFwd, extDriveStrafe) + Math.abs(extDriveTurn) > 0.04) {
      manualJointMode = false;
    }
  }

  function setSpeed(percent) {
    simulationSpeed = clamp((Number(percent) || 50) / 100, 0.15, 1.0);
    const slider = document.getElementById('simSpeed');
    const lbl = document.getElementById('simSpeedLabel');
    if (slider) slider.value = String(Math.round(simulationSpeed * 100));
    if (lbl) lbl.textContent = `${Math.round(simulationSpeed * 100)}%`;
  }

  function adjustHeight(delta) {
    manualJointMode = false;
    // Exit conflicting cyclic vertical routines so the manual raise/lower responds cleanly!
    if (['ELEVATE', 'PUSHUP', 'JUMP', 'SLEEP'].includes(robotMode)) {
      robotMode = 'STAND';
      demoRunning = false;
      document.querySelectorAll('[data-neun3d-mode]').forEach(btn => btn.classList.remove('active'));
      updateModelBadgeUI();
    }
    const vb = getSafeVerticalBounds();
    const minH = -vb.maxSafeDrop * 0.92;
    const maxH = vb.maxSafeRise * 0.92;
    if (delta === 0) {
      userHeightTarget = 0;
    } else {
      const step = delta > 0 ? maxH * 0.30 : -Math.abs(minH) * 0.30;
      userHeightTarget = clamp(userHeightTarget + step, minH, maxH);
    }
    updateHeightUI(true);
  }

  function setHeightNormalized(norm) {
    manualJointMode = false;
    const vb = getSafeVerticalBounds();
    const n = clamp(Number(norm) || 0, -1, 1);
    userHeightTarget = n >= 0 ? n * vb.maxSafeRise * 0.92 : n * vb.maxSafeDrop * 0.92;
    updateHeightUI(true);
  }

  function adjustTilt(dPitch, dRoll) {
    manualJointMode = false;
    if (robotMode !== 'STAND') {
      robotMode = 'STAND';
      demoRunning = false;
      updateModelBadgeUI();
    }
    userTiltPitch = clamp(userTiltPitch + (Number(dPitch) || 0) * 0.08, -0.24, 0.24);
    userTiltRoll = clamp(userTiltRoll + (Number(dRoll) || 0) * 0.08, -0.24, 0.24);
  }

  function resetTilt() {
    userTiltPitch = 0;
    userTiltRoll = 0;
  }

  function setEmergency(active) {
    emergencyStopped = Boolean(active);
    if (emergencyStopped) {
      heldControls.clear();
      extDriveFwd = extDriveStrafe = extDriveTurn = 0;
    }
    updateModelBadgeUI();
  }

  function setHeadlights(on, brightness) {
    headlightsOn = Boolean(on);
    if (brightness !== undefined) headlightIntensity = clamp(Number(brightness) / 100, 0.15, 1.0);
  }

  function setImuAttitude(pitchDeg, rollDeg, yawDeg) {
    imuPitchRad = (Number(pitchDeg) || 0) * Math.PI / 180;
    imuRollRad = (Number(rollDeg) || 0) * Math.PI / 180;
    imuYawRad = (Number(yawDeg) || 0) * Math.PI / 180;
  }

  function setHardwareServos(servos4x3, isConnected, bootSource, meta) {
    hardwareConnected = Boolean(isConnected);
    if (bootSource) hardwareBootSource = String(bootSource);
    if (Array.isArray(servos4x3) && servos4x3.length === 4) {
      hardwareServos = servos4x3.map(leg => leg.map(v => clamp(Number(v) || 90, 0, 180)));
      hardwareServosTimestamp = performance.now();
    }
    if (meta && typeof meta === 'object') {
      if (Array.isArray(meta.raw_servos) && meta.raw_servos.length === 4) {
        hardwareRawServos = meta.raw_servos.map(leg => leg.map(v => clamp(Number(v) || 90, 0, 180)));
      }
      if (Array.isArray(meta.centers) && meta.centers.length === 4) {
        hardwareCenters = meta.centers.map(leg => leg.map(v => clamp(Number(v) || 90, 0, 180)));
      }
      if (Array.isArray(meta.dirs) && meta.dirs.length === 4) {
        hardwareDirs = meta.dirs.map(leg => leg.map(v => (Number(v) < 0 ? -1 : 1)));
      }
      if (typeof meta.calibrated === 'boolean') {
        hardwareCalibrated = meta.calibrated;
      }
      syncCalibrationDrawerUI(false);
    }
  }

  function setManualJoint(channel, angle) {
    const ch = Number(channel);
    const leg = Math.floor(ch / 3);
    const joint = ch % 3;
    if (leg < 0 || leg > 3 || joint < 0 || joint > 2) return;
    manualJointMode = true;
    lastJointSliderDragAt = performance.now();
    demoRunning = false;
    heldControls.clear();
    targetJointRad[leg][joint] = servoDegToJointRad(leg, joint, Number(angle));
    const names = ['Cadera', 'Fémur', 'Tibia'];
    modelStatus = `Articulación manual · ${LEG_NAMES[leg]} ${names[joint]} · CH ${ch}: ${Math.round(angle)}°`;
    updateStatusText();
  }

  function setManualJointMode(enabled) {
    manualJointMode = Boolean(enabled);
    if (manualJointMode) {
      demoRunning = false;
      heldControls.clear();
    }
    updateModelBadgeUI();
  }

  function getServoAngle(leg, joint) {
    if (leg < 0 || leg > 3 || joint < 0 || joint > 2) return 90;
    // Leer de currentServoDeg (posición real suavizada, no el objetivo)
    return currentServoDeg[leg][joint] ?? 90;
  }

  function setAngleSource(src) {
    if (!['auto', 'kinematics', 'hardware'].includes(src)) return;
    angleSource = src;
    updateModelBadgeUI();
  }

  function setFollowCamera(enabled) {
    followCamera = Boolean(enabled);
    const btn = document.getElementById('neun3dFollow');
    if (btn) btn.classList.toggle('active', followCamera);
  }

  async function loadFromFile(file) {
    if (!file) return;
    const name = file.name || 'modelo';
    const isStl = /\.stl$/i.test(name);
    const isBin = /\.bin$/i.test(name);
    if (!isStl && !isBin) {
      modelStatus = 'Formato no compatible. Elegí un archivo .stl o .bin.';
      updateStatusText();
      return;
    }
    modelStatus = `Cargando ${name}…`;
    updateStatusText();
    try {
      const buf = await file.arrayBuffer();
      const head = buf.byteLength >= 8 ? String.fromCharCode(...new Uint8Array(buf, 0, 8)) : '';
      let parts;
      if (isBin) {
        if (head !== 'NEUN3D03') throw new Error('El .bin no tiene formato NEUN3D03 válido');
        parts = parseNeunBin(buf);
        uploadParts(parts, 'bin', `${name} · ${parts.length} piezas`);
      } else {
        parts = parseRawSTL(buf);
        uploadParts(parts, 'stl', `${name} · ${parts.length} piezas`);
      }
      resetPosition();
      if (!raf) raf = requestAnimationFrame(render);
    } catch (err) {
      modelStatus = `Error al cargar ${name}: ${err.message || err}`;
      updateStatusText();
      console.error('NEUN 3D file load:', err);
    }
  }

  async function autoLoadModel() {
    if (loadStarted) return;
    loadStarted = true;
    modelStatus = 'Buscando neun_model.bin…';
    updateStatusText();

    for (const url of MODEL_URLS) {
      try {
        const res = await fetch(url, { cache: 'force-cache' });
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        if (buf.byteLength < 10) continue;
        const head = String.fromCharCode(...new Uint8Array(buf, 0, 8));
        if (head !== 'NEUN3D03') continue;
        const parts = parseNeunBin(buf);
        uploadParts(parts, 'bin', `STL real · ${parts.length} piezas`);
        if (!raf) raf = requestAnimationFrame(render);
        return;
      } catch (_) {
        // Try next candidate path
      }
    }

    // No neun_model.bin found on server -> build high-detail NEUN CAD fallback & allow dropping .bin/.stl!
    const fallbackParts = buildProceduralNeunParts();
    uploadParts(fallbackParts, 'procedural', 'Modelo NEUN (puedes cargar .bin/.stl)');
    if (!raf) raf = requestAnimationFrame(render);
  }

  // ========================================================================
  // SIMULATOR PAGE JOINT SLIDERS & DRIVE CONTROLS
  // ========================================================================
  function buildJointControls() {
    const root = document.getElementById('simJointControls');
    if (!root) return;
    const legs = [['FL', 0], ['RL', 1], ['FR', 2], ['RR', 3]];
    const joints = [['C', 'Cadera'], ['F', 'Fémur'], ['T', 'Tibia']];
    root.innerHTML = legs.map(([name, leg]) => `
      <fieldset class="sim-leg-joints">
        <legend>${name}</legend>
        ${joints.map(([key, label], joint) => {
          const ch = leg * 3 + joint;
          const range = joint === 0 ? 60 : 75;
          return `<label class="sim-joint-row">
            <span><b>CH ${ch} · ${key}</b><em data-joint-value="${ch}">90°</em></span>
            <input type="range" min="${90 - range}" max="${90 + range}" step="1" value="90"
              data-joint-slider="${ch}" aria-label="${name} ${label}, canal ${ch}">
          </label>`;
        }).join('')}
      </fieldset>`).join('');

    root.querySelectorAll('[data-joint-slider]').forEach(slider => {
      slider.addEventListener('input', () => {
        const ch = Number(slider.dataset.jointSlider);
        const angle = Number(slider.value);
        const val = root.querySelector(`[data-joint-value="${ch}"]`);
        if (val) val.textContent = `${angle}°`;
        const play = document.getElementById('neun3dPlay');
        if (play) play.textContent = 'Demo de marcha';
        setManualJoint(ch, angle);
      });
    });

    const resetBtn = document.getElementById('simJointReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        stopSimulation();
        for (let leg = 0; leg < 4; leg++) {
          const geo = legKinematics[leg];
          if (geo) targetJointRad[leg] = [...geo.standJointRad];
        }
      });
    }
  }

  function syncJointSlidersToNeutral() {
    document.querySelectorAll('[data-joint-slider]').forEach(slider => {
      const ch = Number(slider.dataset.jointSlider);
      slider.value = '90';
      const val = document.querySelector(`[data-joint-value="${ch}"]`);
      if (val) val.textContent = '90°';
    });
  }

  function bindUIEvents(c) {
    // Camera orbit & pinch zoom
    c.addEventListener('pointerdown', e => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      c.setPointerCapture(e.pointerId);
      if (activePointers.size === 1) {
        pointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
        c.classList.add('dragging');
      } else if (activePointers.size === 2) {
        pointer = null;
        c.classList.remove('dragging');
        const pair = Array.from(activePointers.values());
        pinchDistance = Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y);
      }
    });
    c.addEventListener('pointermove', e => {
      if (activePointers.has(e.pointerId)) activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size >= 2) {
        const pair = Array.from(activePointers.values());
        const nextD = Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y);
        if (pinchDistance > 0 && nextD > 0) {
          targetDistance = clamp(targetDistance * pinchDistance / nextD, 2.0, 12.0);
        }
        pinchDistance = nextD;
        return;
      }
      if (!pointer || pointer.id !== e.pointerId) return;
      targetYaw -= (e.clientX - pointer.x) * 0.0085;
      targetPitch = clamp(targetPitch + (e.clientY - pointer.y) * 0.0075, -0.85, 1.42);
      pointer.x = e.clientX; pointer.y = e.clientY;
    });
    const endDrag = e => {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) pinchDistance = 0;
      if (activePointers.size === 1) {
        const [id, pos] = activePointers.entries().next().value;
        pointer = { id, x: pos.x, y: pos.y };
        c.classList.add('dragging');
      } else {
        pointer = null;
        c.classList.remove('dragging');
      }
    };
    c.addEventListener('pointerup', endDrag);
    c.addEventListener('pointercancel', endDrag);
    c.addEventListener('wheel', e => {
      e.preventDefault();
      targetDistance = clamp(targetDistance * (e.deltaY > 0 ? 1.09 : 0.91), 2.0, 12.0);
    }, { passive: false });

    // Drag & Drop .bin / .stl right onto canvas!
    const wrap = c.closest('.neun3d-stage') || c.parentElement;
    if (wrap) {
      wrap.addEventListener('dragover', e => {
        e.preventDefault();
        wrap.classList.add('neun3d-drop-active');
      });
      wrap.addEventListener('dragleave', () => wrap.classList.remove('neun3d-drop-active'));
      wrap.addEventListener('drop', e => {
        e.preventDefault();
        wrap.classList.remove('neun3d-drop-active');
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) loadFromFile(file);
      });
    }

    // File input button (.bin / .stl)
    const fileInput = document.getElementById('neun3dFileInput');
    const fileBtn = document.getElementById('neun3dLoadBtn');
    if (fileBtn && fileInput) {
      fileBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
          loadFromFile(fileInput.files[0]);
          fileInput.value = '';
        }
      });
    }

    // Camera preset buttons
    const resetBtn = document.getElementById('neun3dReset');
    if (resetBtn) resetBtn.addEventListener('click', resetPosition);

    const followBtn = document.getElementById('neun3dFollow');
    if (followBtn) {
      followBtn.classList.toggle('active', followCamera);
      followBtn.addEventListener('click', () => setFollowCamera(!followCamera));
    }

    document.querySelectorAll('[data-neun3d-view]').forEach(b => {
      b.addEventListener('click', () => setCameraView(b.dataset.neun3dView));
    });

    // Mode / Play / Stop buttons
    document.querySelectorAll('[data-neun3d-mode]').forEach(b => {
      b.addEventListener('click', () => setSimulationMode(b.dataset.neun3dMode));
    });
    const play = document.getElementById('neun3dPlay');
    const stop = document.getElementById('neun3dStop');
    if (play) play.addEventListener('click', toggleSimulation);
    if (stop) stop.addEventListener('click', stopSimulation);

    // Manual Raise / Lower buttons (Subir / Bajar: tap for crisp step, hold for smooth glide!)
    document.querySelectorAll('[data-neun3d-height]').forEach(btn => {
      const action = btn.dataset.neun3dHeight;
      if (action === 'reset') {
        btn.addEventListener('click', () => adjustHeight(0));
        return;
      }
      const dir = action === 'up' ? 1 : -1;
      const start = ev => {
        ev.preventDefault();
        adjustHeight(dir);
        heightHoldDir = dir;
        heightHoldStart = performance.now();
        btn.classList.add('pressed');
      };
      const end = () => {
        if (heightHoldDir === dir) heightHoldDir = 0;
        btn.classList.remove('pressed');
      };
      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointercancel', end);
      btn.addEventListener('pointerleave', end);
      btn.addEventListener('contextmenu', ev => ev.preventDefault());
    });

    // Directional pad buttons (simulador page)
    document.querySelectorAll('[data-drive], [data-turn]').forEach(btn => {
      const name = btn.dataset.drive || `turn-${btn.dataset.turn}`;
      const start = ev => {
        ev.preventDefault();
        manualJointMode = false;
        heldControls.add(name);
        btn.classList.add('pressed');
      };
      const end = () => {
        heldControls.delete(name);
        btn.classList.remove('pressed');
      };
      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointercancel', end);
      btn.addEventListener('pointerleave', end);
      btn.addEventListener('contextmenu', ev => ev.preventDefault());
    });

    // Speed slider (simulador page)
    const speedSlider = document.getElementById('simSpeed');
    if (speedSlider) {
      simulationSpeed = clamp(Number(speedSlider.value) / 100, 0.15, 1.0);
      speedSlider.addEventListener('input', () => setSpeed(speedSlider.value));
    }

    // Keyboard controls ONLY on standalone simulator page (panel uses app.js keybinds!)
    if (document.body.classList.contains('sim-page')) {
      const keyMap = {
        w: 'forward', arrowup: 'forward',
        s: 'backward', arrowdown: 'backward',
        a: 'left', arrowleft: 'left',
        d: 'right', arrowright: 'right',
        q: 'turn-left', e: 'turn-right'
      };
      window.addEventListener('keydown', ev => {
        if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT')) return;
        const k = ev.key.toLowerCase();
        if (k === ' ') { ev.preventDefault(); stopSimulation(); return; }
        if (k === 'r') { ev.preventDefault(); adjustHeight(1); return; }
        if (k === 'f') { ev.preventDefault(); adjustHeight(-1); return; }
        const ctrl = keyMap[k];
        if (ctrl) {
          ev.preventDefault();
          manualJointMode = false;
          heldControls.add(ctrl);
        }
      });
      window.addEventListener('keyup', ev => {
        const ctrl = keyMap[ev.key.toLowerCase()];
        if (ctrl) heldControls.delete(ctrl);
      });
      window.addEventListener('blur', () => { heldControls.clear(); heightHoldDir = 0; });
    }
  }

  function resize() {
    const c = getCanvas();
    if (!c) return;
    const rect = c.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.round(rect.width * dpr);
    height = Math.round(rect.height * dpr);
    if (c.width !== width || c.height !== height) {
      c.width = width;
      c.height = height;
    }
    if (gl) gl.viewport(0, 0, width, height);
    if (!loadStarted) autoLoadModel();
  }

  function init() {
    const c = getCanvas();
    if (!c) return;
    gl = c.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' })
      || c.getContext('experimental-webgl', { antialias: true, alpha: false });
    if (!gl) {
      modelStatus = 'WebGL no disponible en este navegador';
      updateStatusText();
      return;
    }
    try {
      meshProg = linkProgram(MESH_VS, MESH_FS);
      floorProg = linkProgram(FLOOR_VS, FLOOR_FS);
      solidProg = linkProgram(SOLID_VS, SOLID_FS);

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.CULL_FACE);
      gl.clearColor(0.024, 0.036, 0.062, 1.0);

      initStaticBuffers();
      new ResizeObserver(resize).observe(c);
      window.addEventListener('resize', resize, { passive: true });
      bindUIEvents(c);
      buildJointControls();
      buildJointTelemetryStrip();
      resize();
      startStandaloneServoPoll();
      raf = requestAnimationFrame(render);
    } catch (err) {
      modelStatus = 'Error iniciando motor WebGL';
      console.error('NEUN 3D init:', err);
      updateStatusText();
    }
  }

  window.NEUN3D = {
    init,
    resize,
    setRobotMode,
    setSimulationMode,
    setDriveVector,
    setSpeed,
    adjustHeight,
    setHeightNormalized,
    adjustTilt,
    resetTilt,
    setEmergency,
    setHeadlights,
    setImuAttitude,
    setHardwareServos,
    setManualJoint,
    setManualJointMode,
    getServoAngle,
    getServoAngles: () => currentServoDeg.map(l => [...l]),
    getServoSource: () => angleSource,
    setAngleSource,
    setFollowCamera,
    setCameraView,
    toggleSimulation,
    stopSimulation,
    resetPosition,
    loadFromFile,
    getState: () => ({
      mode: robotMode,
      demoRunning,
      isMirroringHardware,
      angleSource,
      modelSourceType,
      modelSourceLabel,
      legInStance: [...legInStance],
      bodyX, bodyZ, bodyHeading
    })
  };

  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
