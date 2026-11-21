/* ==========================================================================
 * NEUN × El Fin de los Niños — Réplica Reproducible Estática (API Shim)
 * Permite ejecutar el Centro de Control NEUN y el Simulador 3D en GitHub Pages
 * o cualquier hosting estático sin requerir un servidor Flask activo.
 * Si el usuario conecta su PC a la red local del ESP32-S3 (ej. 192.168.4.1),
 * intenta enlazar directamente; de lo contrario, mantiene la simulación local
 * explícita 1:1 con arana_robot.cpp y app.py (IPET N°66 · Córdoba, Argentina).
 * ========================================================================== */
(function () {
  'use strict';

  const nativeFetch = window.fetch.bind(window);

  const SERVO_SIGN = [
    [1, 1, 1],
    [1, -1, -1],
    [1, -1, -1],
    [1, 1, 1],
  ];
  const LEG_SIGNS = [
    [1.0, 1.0],
    [-1.0, 1.0],
    [1.0, -1.0],
    [-1.0, -1.0],
  ];
  const HIP_X = 48.0;
  const HIP_Y = 39.0;
  const L_COXA = 32.0;
  const L_FEMUR = 60.0;
  const L_TIBIA = 90.0;
  const STAND_HEIGHT = 49.0;
  const STAND_RADIAL = 93.0;
  const STAND_SPLAY = (17.2 * Math.PI) / 180.0;
  const STRIDE_MM = 54.0;
  const LIFT_MM = 31.5;
  const RISE_MAX_MM = 48.0;
  const DROP_MAX_MM = 29.0;

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function solveLegIkBody(leg, bx, by, bz) {
    const [front, side] = LEG_SIGNS[leg];
    const dx = bx - front * HIP_X;
    const dy = by - side * HIP_Y;
    const dR = side * dy;
    const dT = -side * dx;
    const thetaC = Math.atan2(dT, Math.max(5.0, dR));
    let rHoriz = Math.max(5.0, Math.hypot(dR, dT) - L_COXA);
    let zRel = bz;
    let dist = Math.hypot(rHoriz, zRel);
    const minR = Math.abs(L_TIBIA - L_FEMUR) + 6.0;
    const maxR = (L_FEMUR + L_TIBIA) * 0.94;
    if (dist > maxR && dist > 1e-4) {
      const s = maxR / dist;
      rHoriz *= s;
      zRel *= s;
      dist = maxR;
    } else if (dist < minR && dist > 1e-4) {
      const s = minR / dist;
      rHoriz *= s;
      zRel *= s;
      dist = minR;
    }
    const cosB = clamp((L_FEMUR * L_FEMUR + dist * dist - L_TIBIA * L_TIBIA) / (2.0 * L_FEMUR * dist), -1.0, 1.0);
    const cosG = clamp((L_FEMUR * L_FEMUR + L_TIBIA * L_TIBIA - dist * dist) / (2.0 * L_FEMUR * L_TIBIA), -1.0, 1.0);
    const alphaF = Math.atan2(zRel, rHoriz) + Math.acos(cosB);
    const relT = -(Math.PI - Math.acos(cosG));
    return [(thetaC * 180) / Math.PI, (alphaF * 180) / Math.PI, (relT * 180) / Math.PI];
  }

  const STAND_FEET = [];
  const STAND_POSES = [];
  for (let l = 0; l < 4; l++) {
    const [f, s] = LEG_SIGNS[l];
    const rTot = L_COXA + STAND_RADIAL;
    const fx = f * HIP_X + f * rTot * Math.sin(STAND_SPLAY);
    const fy = s * HIP_Y + s * rTot * Math.cos(STAND_SPLAY);
    STAND_FEET.push([fx, fy]);
    STAND_POSES.push(solveLegIkBody(l, fx, fy, -STAND_HEIGHT));
  }

  const DEFAULT_MANDO = {
    deadzone: 0.12,
    ema_alpha: 0.35,
    heartbeat_ms: 200,
    send_rate_hz: 12,
    invert_x: false,
    invert_y: false,
    pot_min: 0,
    pot_max: 4095,
    speed_min: 20,
    speed_max: 100,
    led_brightness: 60,
    buzzer: true,
    mode_button: 'SENTRY',
    body_step: 0.25,
  };

  // Coordenada base de referencia: Cuenca 1 · Sierras de Córdoba (1167 m s.n.m.)
  const BASE_LAT = -31.3782;
  const BASE_LON = -64.4328;

  const state = {
    startedAt: Date.now() / 1000,
    lastSimTs: Date.now() / 1000,
    esp32Ip: '192.168.4.1',
    connected: false,
    latencyMs: 0,
    mode: 'STAND',
    speed: 60,
    emergencyStop: false,
    stabilize: true,
    move: 'stop',
    joyX: 0,
    joyY: 0,
    rotate: 0,
    bodyZ: 0,
    bodyPitch: 0,
    bodyRoll: 0,
    manualHold: false,
    gaitPhase: 0,
    servos: [
      [90, 90, 90],
      [90, 90, 90],
      [90, 90, 90],
      [90, 90, 90],
    ],
    rawServos: [
      [90, 90, 90],
      [90, 90, 90],
      [90, 90, 90],
      [90, 90, 90],
    ],
    calCenters: [
      [90, 90, 90],
      [90, 90, 90],
      [90, 90, 90],
      [90, 90, 90],
    ],
    calDirs: SERVO_SIGN.map(r => r.slice()),
    calibrated: false,
    headlightsOn: false,
    headlightsBrightness: 70,
    buzzerState: 'idle',
    buzzerPattern: 'BEEP',
    buzzerFreq: 880,
    buzzerUntil: 0,
    ledBrightness: 55,
    ledPattern: 'idle',
    mandoProfile: Object.assign({}, DEFAULT_MANDO),
    mandoVersion: 1,
    missionId: 'standby',
    missionLabel: 'Espera en coronamiento (Cuenca 1 · 1167 m)',
    gpsTrack: [],
    gpsWaypoints: [
      { name: 'Coronamiento Cuenca 1 (1167 m)', lat: BASE_LAT, lon: BASE_LON, ts: Date.now() / 1000 - 180 },
      { name: 'Aliviadero Lateral Este', lat: BASE_LAT + 0.00042, lon: BASE_LON + 0.00061, ts: Date.now() / 1000 - 90 },
    ],
  };

  function recomputeRawFromPose() {
    for (let l = 0; l < 4; l++) {
      for (let j = 0; j < 3; j++) {
        const ratio = state.calDirs[l][j] * SERVO_SIGN[l][j];
        const raw = state.calCenters[l][j] + ratio * (state.servos[l][j] - 90);
        state.rawServos[l][j] = Math.round(clamp(raw, 10, 170));
      }
    }
  }

  function recomputePoseFromRaw() {
    for (let l = 0; l < 4; l++) {
      for (let j = 0; j < 3; j++) {
        const ratio = state.calDirs[l][j] * SERVO_SIGN[l][j];
        const pose = 90 + ratio * (state.rawServos[l][j] - state.calCenters[l][j]);
        state.servos[l][j] = Math.round(clamp(pose, 10, 170));
      }
    }
  }

  function smoothstep5(p) {
    return p * p * p * (10 - 15 * p + 6 * p * p);
  }

  function stepSimulator() {
    const now = Date.now() / 1000;
    const dt = clamp(now - state.lastSimTs, 0.005, 0.25);
    state.lastSimTs = now;

    if (state.buzzerState === 'playing' && now >= state.buzzerUntil) {
      state.buzzerState = 'idle';
    }
    if (state.emergencyStop || state.manualHold) return;

    let fwd = state.joyY;
    let strafeR = state.joyX;
    let turnR = state.rotate;
    if (Math.abs(fwd) < 0.05 && Math.abs(strafeR) < 0.05 && Math.abs(turnR) < 0.05) {
      if (state.move === 'forward') fwd = 1.0;
      else if (state.move === 'backward') fwd = -1.0;
      else if (state.move === 'right' || state.move === 'crab_right') strafeR = 1.0;
      else if (state.move === 'left' || state.move === 'crab_left') strafeR = -1.0;
      else if (state.move === 'turn_right') turnR = 1.0;
      else if (state.move === 'turn_left') turnR = -1.0;
    }

    const manual = Math.abs(fwd) > 0.05 || Math.abs(strafeR) > 0.05 || Math.abs(turnR) > 0.05;
    const mode = state.mode;
    const gaitModes = new Set([
      'WALK_FWD', 'TROT', 'CRAWL', 'TURN_LEFT', 'TURN_RIGHT',
      'CRAB_LEFT', 'CRAB_RIGHT', 'SPIRAL', 'EXPLORE', 'FOLLOW',
    ]);
    const isGait = manual || gaitModes.has(mode);
    const speedN = clamp(state.speed / 100.0, 0.15, 1.0);
    let bodyZMm = state.bodyZ >= 0 ? state.bodyZ * RISE_MAX_MM : state.bodyZ * DROP_MAX_MM;
    let pitchRad = state.bodyPitch * 0.22;
    let rollRad = state.bodyRoll * 0.22;
    let shiftX = 0;
    let shiftY = 0;
    let shiftZ = 0;
    const feet = [0, 1, 2, 3].map(l => [STAND_FEET[l][0], STAND_FEET[l][1], 0.0]);
    const t = now - state.startedAt;

    if (isGait) {
      const isTrot = mode === 'TROT';
      const isCrawl = mode === 'CRAWL';
      if (!manual) {
        if (mode === 'WALK_FWD' || mode === 'TROT' || mode === 'FOLLOW') fwd = 1.0;
        else if (mode === 'CRAWL') fwd = 0.85;
        else if (mode === 'TURN_LEFT') turnR = -1.0;
        else if (mode === 'TURN_RIGHT') turnR = 1.0;
        else if (mode === 'CRAB_LEFT') strafeR = -1.0;
        else if (mode === 'CRAB_RIGHT') strafeR = 1.0;
        else if (mode === 'SPIRAL') { fwd = 0.9; turnR = 0.55; }
        else if (mode === 'EXPLORE') { fwd = 0.9; turnR = 0.35 * Math.sin(now * 0.6); }
      }
      const mag = Math.hypot(fwd, strafeR);
      if (mag > 1.0) { fwd /= mag; strafeR /= mag; }
      const inputMag = clamp(Math.max(Math.hypot(fwd, strafeR), Math.abs(turnR)), 0.15, 1.0);
      const speedFactor = clamp(0.30 + speedN * 0.95, 0.25, 1.35);
      const hz = (isTrot ? 1.32 : isCrawl ? 0.55 : 0.82) * speedFactor;
      state.gaitPhase = (state.gaitPhase + hz * dt) % 1.0;
      const phases = isTrot ? [0.0, 0.5, 0.5, 0.0] : [0.75, 0.0, 0.25, 0.5];
      const swingF = isTrot ? 0.42 : 0.25;
      const stride = STRIDE_MM * (isCrawl ? 0.78 : isTrot ? 1.11 : 1.0) * inputMag;
      const lift = LIFT_MM * (isCrawl ? 0.68 : 1.0);
      if (isCrawl) bodyZMm -= 12.0;

      for (let l = 0; l < 4; l++) {
        const ph = (state.gaitPhase + phases[l]) % 1.0;
        const [bx, by] = STAND_FEET[l];
        const yawStep = turnR * 0.26;
        const tx = -by * yawStep * 0.55 + fwd * stride * 0.5;
        const ty = bx * yawStep * 0.55 - strafeR * stride * 0.5;
        if (ph < swingF) {
          const p = ph / swingF;
          const s = -1.0 + 2.0 * smoothstep5(p);
          const zLift = lift * Math.pow(Math.sin(Math.PI * p), 2);
          feet[l] = [bx + tx * s, by + ty * s, zLift];
        } else {
          const p = (ph - swingF) / (1.0 - swingF);
          const s = 1.0 - 2.0 * p;
          feet[l] = [bx + tx * s, by + ty * s, 0.0];
        }
      }
    } else if (mode === 'SENTRY') {
      pitchRad += Math.sin(t * 1.1) * 0.12;
      rollRad += Math.cos(t * 0.85) * 0.14;
      shiftZ = 14.0 + Math.sin(t * 0.7) * 6.0;
    } else if (mode === 'TILT') {
      pitchRad = Math.sin(t * 1.4) * 0.20;
      rollRad = Math.cos(t * 1.4) * 0.20;
    } else if (mode === 'ELEVATE') {
      shiftZ = Math.sin(t * 1.6) * 26.0;
    } else if (mode === 'PUSHUP') {
      shiftZ = Math.sin(t * 2.4) * 24.0;
      pitchRad = Math.sin(t * 2.4) * 0.12;
    } else if (mode === 'DANCE') {
      shiftY = Math.sin(t * 3.0) * 16.0;
      shiftZ = Math.abs(Math.sin(t * 3.0)) * 18.0;
      rollRad = Math.sin(t * 3.0) * 0.16;
    } else if (mode === 'WAVE') {
      const [fx, fy] = feet[2];
      const osc = Math.sin(t * 5.0);
      feet[2] = [fx + 38.0 + 10.0 * osc, fy - 14.0 * osc, 68.0 + 12.0 * Math.cos(t * 5.0)];
    } else if (mode === 'JUMP') {
      const p = (t * 0.52) % 1.0;
      shiftZ = p < 0.39 ? -DROP_MAX_MM * 0.82 * Math.sin((p / 0.39) * Math.PI) : RISE_MAX_MM * 0.72 * Math.sin(((p - 0.39) / 0.61) * Math.PI);
    } else if (mode === 'SLEEP') {
      shiftZ = -DROP_MAX_MM * 0.95;
    }

    const totalZ = STAND_HEIGHT + bodyZMm + shiftZ;
    const cp = Math.cos(pitchRad), sp = Math.sin(pitchRad);
    const cr = Math.cos(rollRad), sr = Math.sin(rollRad);
    for (let l = 0; l < 4; l++) {
      const [gx, gy, gz] = feet[l];
      const rx = gx - shiftX, ry = gy - shiftY, rz = gz - totalZ;
      const x1 = cp * rx + sp * rz;
      const z1 = -sp * rx + cp * rz;
      const y2 = cr * ry + sr * z1;
      const z2 = -sr * ry + cr * z1;
      const [cDeg, fDeg, tDeg] = solveLegIkBody(l, x1, y2, z2);
      const [nc, nf, nt] = STAND_POSES[l];
      const [sc, sf, st] = SERVO_SIGN[l];
      state.servos[l] = [
        Math.round(clamp(90.0 + sc * (cDeg - nc), 10.0, 170.0)),
        Math.round(clamp(90.0 + sf * (fDeg - nf), 10.0, 170.0)),
        Math.round(clamp(90.0 + st * (tDeg - nt), 10.0, 170.0)),
      ];
    }
    recomputeRawFromPose();

    // Avanza ligeramente la traza GPS simulada cuando camina
    if (isGait) {
      const lat = BASE_LAT + Math.sin(t * 0.08) * 0.00035;
      const lon = BASE_LON + Math.cos(t * 0.08) * 0.00045;
      const last = state.gpsTrack[state.gpsTrack.length - 1];
      if (!last || now - last.ts > 2.5) {
        state.gpsTrack.push({ lat, lon, ts: now });
        if (state.gpsTrack.length > 180) state.gpsTrack.shift();
      }
    }
  }

  function buildSimulatedImu() {
    const t = Date.now() / 1000 - state.startedAt;
    // Si está en misión de talud, simula una pendiente real de 14°
    const slopeBias = state.missionId === 'talud' ? 14.2 : 0.0;
    const pitch = Number((slopeBias + state.bodyPitch * 12.0 + Math.sin(t * 1.1) * 1.1).toFixed(1));
    const roll = Number((state.bodyRoll * 12.0 + Math.cos(t * 0.9) * 0.9).toFixed(1));
    const yaw = Number((((t * 6.0 * (state.rotate || 0.05)) % 360.0 + 360.0) % 360.0).toFixed(1));
    return {
      online: true,
      pitch,
      roll,
      yaw,
      ax: Math.round(Math.sin((pitch * Math.PI) / 180) * 16384),
      ay: Math.round(Math.sin((roll * Math.PI) / 180) * 16384),
      az: Math.round(Math.cos((pitch * Math.PI) / 180) * 16384),
      gx: Math.round(Math.cos(t * 1.1) * 42),
      gy: Math.round(-Math.sin(t * 0.9) * 38),
      gz: Math.round(state.rotate * 620),
      temp: Number((31.4 + 0.4 * Math.sin(t * 0.2)).toFixed(1)),
      name: 'MPU6050',
      pin: 'I2C',
      address: '0x68',
    };
  }

  function buildStatusPayload() {
    stepSimulator();
    const now = Date.now() / 1000;
    const t = now - state.startedAt;
    const imu = buildSimulatedImu();

    // Valores hidrológicos coherentes con cada misión simulada
    let distCm = Number((118.0 + 24.0 * Math.sin(t * 0.35)).toFixed(1));
    let tempC = Number((21.8 + 0.7 * Math.sin(t * 0.15)).toFixed(1));
    let humPct = Number((58.0 + 5.0 * Math.cos(t * 0.12)).toFixed(0));
    if (state.missionId === 'alcantarilla') {
      distCm = Number((46.0 + 12.0 * Math.sin(t * 0.55)).toFixed(1));
      tempC = 17.4;
      humPct = 84;
    } else if (state.missionId === 'sentry') {
      distCm = Number((74.0 - 16.0 * Math.sin(t * 0.4)).toFixed(1));
      tempC = 19.6;
      humPct = 76;
    } else if (state.missionId === 'talud') {
      distCm = Number((142.0 + 10.0 * Math.cos(t * 0.3)).toFixed(1));
      tempC = 25.2;
      humPct = 36;
    }

    const lastPt = state.gpsTrack[state.gpsTrack.length - 1] || { lat: BASE_LAT, lon: BASE_LON };
    const gpsFix = state.missionId !== 'alcantarilla'; // bajo conducto pierde fix satelital (realista!)

    return {
      connected: false,
      boot_source: 'REPLICA_SIMULADA',
      mission: { id: state.missionId, label: state.missionLabel },
      mode: state.mode,
      speed: state.speed,
      emergency_stop: state.emergencyStop,
      stabilize: state.stabilize,
      move: state.move,
      joystick: { x: Number(state.joyX.toFixed(2)), y: Number(state.joyY.toFixed(2)) },
      rotate: Number(state.rotate.toFixed(2)),
      body: {
        z: Number(state.bodyZ.toFixed(2)),
        pitch: Number(state.bodyPitch.toFixed(2)),
        roll: Number(state.bodyRoll.toFixed(2)),
      },
      battery: Number(clamp(94.0 - (t / 3600.0) * 4.0, 22.0, 100.0).toFixed(1)),
      servos: state.servos.map(r => r.slice()),
      raw_servos: state.rawServos.map(r => r.slice()),
      centers: state.calCenters.map(r => r.slice()),
      dirs: state.calDirs.map(r => r.slice()),
      calibrated: state.calibrated,
      gps_track: state.gpsTrack.slice(),
      gps_waypoints: state.gpsWaypoints.slice(),
      faults: [],
      link: {
        ssid: 'ARANA-ROBOT (Simulación Web)',
        password_set: false,
        channel: 1,
        clients: 0,
        max_clients: 4,
        ip: state.esp32Ip,
        latency_ms: 0,
        stations: [],
      },
      mando: {
        online: false,
        seen: false,
        last_seen_ms: 0,
        joy_x: 0,
        joy_y: 0,
        rotate: 0,
        body_z: 0,
      },
      sensors: {
        ultrasonic: { online: true, value: distCm, pin: 'GPIO10/11', name: 'HC-SR04' },
        dht: { online: true, temp: tempC, hum: humPct, pin: 'I2C 0x38', name: 'AHT10' },
        ir: { online: true, value: distCm < 38 ? 1 : 0, pin: 'GPIO12', name: 'TCRT5000' },
        imu,
        servos: { online: true, count: 12, address: '0x40', name: 'PCA9685' },
        leds: { online: true, presence_verifiable: true, brightness: state.ledBrightness, pattern: state.ledPattern, pin: 'GPIO14' },
        buzzer: { online: true, state: state.buzzerState, pattern: state.buzzerPattern, freq: state.buzzerFreq, pin: 'GPIO15' },
        headlights: { online: true, state: state.headlightsOn ? 'on' : 'off', brightness: state.headlightsBrightness, pin: 'GPIO16' },
        gps: {
          online: true,
          fix: gpsFix,
          sats: gpsFix ? 8 : 0,
          hdop: gpsFix ? 1.15 : 99.9,
          lat: lastPt.lat,
          lon: lastPt.lon,
          alt: 1167.0,
          speed_kmh: state.mode === 'STAND' ? 0.0 : 0.42,
        },
      },
    };
  }

  function applyMissionPreset(presetId) {
    state.emergencyStop = false;
    state.manualHold = false;
    state.move = 'stop';
    state.joyX = 0;
    state.joyY = 0;
    state.rotate = 0;

    if (presetId === 'talud') {
      state.missionId = 'talud';
      state.missionLabel = 'Inspección de talud agrietado post-sequía (MPU6050 + TCRT5000)';
      state.mode = 'WALK_FWD';
      state.speed = 45;
      state.bodyZ = -0.15;
      state.bodyPitch = -0.25;
      state.bodyRoll = 0.0;
      state.headlightsOn = false;
    } else if (presetId === 'alcantarilla') {
      state.missionId = 'alcantarilla';
      state.missionLabel = 'Reconocimiento de alcantarilla / descargador pre-El Niño (sin GPS)';
      state.mode = 'CRAWL';
      state.speed = 38;
      state.bodyZ = -0.65;
      state.bodyPitch = 0.0;
      state.bodyRoll = 0.0;
      state.headlightsOn = true;
      state.ledPattern = 'scan';
    } else if (presetId === 'transecta') {
      state.missionId = 'transecta';
      state.missionLabel = 'Transecta Ground-Truthing microclima y borde EVA (AHT10 + NEO-6M)';
      state.mode = 'EXPLORE';
      state.speed = 65;
      state.bodyZ = 0.1;
      state.bodyPitch = 0.0;
      state.bodyRoll = 0.0;
      state.headlightsOn = false;
    } else if (presetId === 'sentry') {
      state.missionId = 'sentry';
      state.missionLabel = 'Centinela temporal de crecida serrana (+48 mm despeje + HC-SR04)';
      state.mode = 'SENTRY';
      state.speed = 55;
      state.bodyZ = 0.95;
      state.bodyPitch = 0.15;
      state.bodyRoll = 0.0;
      state.headlightsOn = true;
    } else {
      state.missionId = 'standby';
      state.missionLabel = 'Postura neutra STAND · Coronamiento Cuenca 1 (1167 m)';
      state.mode = 'STAND';
      state.speed = 60;
      state.bodyZ = 0.0;
      state.bodyPitch = 0.0;
      state.bodyRoll = 0.0;
    }

    if (window.NEUN3D) {
      if (typeof window.NEUN3D.setRobotMode === 'function') window.NEUN3D.setRobotMode(state.mode);
      if (typeof window.NEUN3D.setHeadlights === 'function') window.NEUN3D.setHeadlights(state.headlightsOn, state.headlightsBrightness / 100);
    }
    return { ok: true, mission: state.missionId, label: state.missionLabel, mode: state.mode };
  }

  window.NEUN_HYDRO_MISSION = applyMissionPreset;

  // Escucha mensajes desde NeunPage.tsx (React padre) para activar misiones en vivo en el iframe
  window.addEventListener('message', ev => {
    const msg = ev && ev.data;
    if (!msg || msg.source !== 'el-fin-de-los-ninos-neun') return;
    if (msg.type === 'mission' && msg.preset) {
      const res = applyMissionPreset(msg.preset);
      if (typeof window.showToast === 'function') {
        window.showToast('Misión activa: ' + res.label, 'info');
      }
      const badge = document.getElementById('hydroMissionBadge');
      if (badge) badge.textContent = res.label;
    }
  });

  function applyCommand(cmdRaw, value) {
    const cmd = String(cmdRaw || '').trim().toLowerCase();
    if (!cmd) return [400, { ok: false, error: 'missing_cmd' }];

    if (cmd === 'mode') {
      state.mode = String(value || 'STAND').toUpperCase();
      state.manualHold = false;
      if (state.mode === 'STAND') {
        state.move = 'stop';
        state.joyX = state.joyY = state.rotate = 0;
      }
    } else if (cmd === 'move') {
      state.move = String(value || 'stop').toLowerCase();
      state.manualHold = false;
      if (state.move === 'stop') {
        state.joyX = state.joyY = state.rotate = 0;
        state.mode = 'STAND';
      }
    } else if (cmd === 'joystick' && value && typeof value === 'object') {
      state.joyX = clamp(Number(value.x) || 0, -1, 1);
      state.joyY = clamp(Number(value.y) || 0, -1, 1);
      state.manualHold = false;
    } else if (cmd === 'rotate') {
      state.rotate = clamp(Number(value) || 0, -1, 1);
      state.manualHold = false;
    } else if (cmd === 'speed') {
      state.speed = Math.round(clamp(Number(value) || 60, 0, 100));
    } else if (cmd === 'body' && value && typeof value === 'object') {
      if ('z' in value) state.bodyZ = clamp(Number(value.z) || 0, -1, 1);
      if ('pitch' in value) state.bodyPitch = clamp(Number(value.pitch) || 0, -1, 1);
      if ('roll' in value) state.bodyRoll = clamp(Number(value.roll) || 0, -1, 1);
    } else if (cmd === 'aux') {
      const act = String(value || '').toLowerCase();
      if (act === 'height_up') state.bodyZ = clamp(state.bodyZ + 0.25, -1, 1);
      else if (act === 'height_down') state.bodyZ = clamp(state.bodyZ - 0.25, -1, 1);
      else if (act === 'height_reset') state.bodyZ = 0;
      else if (act === 'tilt_fwd') state.bodyPitch = clamp(state.bodyPitch - 0.35, -1, 1);
      else if (act === 'tilt_bwd') state.bodyPitch = clamp(state.bodyPitch + 0.35, -1, 1);
      else if (act === 'tilt_right') state.bodyRoll = clamp(state.bodyRoll + 0.35, -1, 1);
      else if (act === 'tilt_left') state.bodyRoll = clamp(state.bodyRoll - 0.35, -1, 1);
      else if (act === 'tilt_reset') { state.bodyPitch = 0; state.bodyRoll = 0; }
    } else if (cmd === 'emergency') {
      state.emergencyStop = Boolean(value);
      if (state.emergencyStop) {
        state.mode = 'STAND';
        state.move = 'stop';
        state.joyX = state.joyY = state.rotate = 0;
      }
    } else if (cmd === 'stabilize') {
      state.stabilize = Boolean(value);
    } else if (cmd === 'reset') {
      applyMissionPreset('standby');
    } else if (cmd === 'servo_adv' && value && typeof value === 'object') {
      const ch = Number(value.channel);
      const ang = Math.round(clamp(Number(value.angle) || 90, 10, 170));
      if (ch >= 0 && ch < 12) {
        state.manualHold = true;
        state.servos[Math.floor(ch / 3)][ch % 3] = ang;
        recomputeRawFromPose();
      }
    } else if (cmd === 'servo' && value && typeof value === 'object') {
      const leg = Number(value.leg);
      const joint = Number(value.joint);
      const ang = Math.round(clamp(Number(value.angle) || 90, 10, 170));
      if (leg >= 0 && leg < 4 && joint >= 0 && joint < 3) {
        state.manualHold = true;
        state.servos[leg][joint] = ang;
        recomputeRawFromPose();
      }
    } else if (cmd === 'headlight') {
      if (value && typeof value === 'object') {
        if ('state' in value) state.headlightsOn = String(value.state).toLowerCase() === 'on';
        if ('brightness' in value) state.headlightsBrightness = Math.round(clamp(Number(value.brightness) || 70, 0, 100));
      } else {
        state.headlightsOn = ['on', 'true', '1'].includes(String(value).toLowerCase());
      }
    } else if (cmd === 'buzzer') {
      state.buzzerState = 'playing';
      state.buzzerPattern = value && value.pattern ? String(value.pattern).toUpperCase() : 'BEEP';
      state.buzzerFreq = value && value.freq ? Number(value.freq) : 880;
      state.buzzerUntil = Date.now() / 1000 + Math.max(0.25, ((value && value.duration) || 300) / 1000);
    } else if (cmd === 'buzzer_stop') {
      state.buzzerState = 'idle';
    } else if (cmd === 'mission') {
      return [200, applyMissionPreset(String(value || 'standby'))];
    }

    return [200, { ok: true, status: 'ok', cmd, mode: state.mode }];
  }

  function calibrateServos(payload) {
    const act = String((payload && payload.action) || '').trim().toLowerCase();
    if (act === 'preview') {
      const leg = Number(payload.leg);
      const jnt = Number(payload.joint);
      const ang = Math.round(clamp(Number(payload.angle) || 90, 10, 170));
      if (leg >= 0 && leg < 4 && jnt >= 0 && jnt < 3) {
        state.mode = 'STAND';
        state.manualHold = true;
        state.rawServos[leg][jnt] = ang;
        recomputePoseFromRaw();
        return [200, { ok: true, action: 'preview', leg, joint: jnt, angle: ang }];
      }
    } else if (act === 'center_90') {
      state.mode = 'STAND';
      state.manualHold = true;
      state.rawServos = [[90, 90, 90], [90, 90, 90], [90, 90, 90], [90, 90, 90]];
      recomputePoseFromRaw();
      return [200, { ok: true, action: 'center_90', detail: '12 servos en 90° (Simulación)' }];
    } else if (act === 'save_stand') {
      state.calCenters = state.rawServos.map(r => r.map(v => clamp(v, 15, 165)));
      state.calibrated = true;
      state.manualHold = false;
      state.servos = [[90, 90, 90], [90, 90, 90], [90, 90, 90], [90, 90, 90]];
      recomputeRawFromPose();
      return [200, { ok: true, action: 'save_stand', detail: 'Postura STAND guardada en sesión' }];
    } else if (act === 'set_dir') {
      const leg = Number(payload.leg);
      const jnt = Number(payload.joint);
      const d = Number(payload.dir) < 0 ? -1 : 1;
      if (leg >= 0 && leg < 4 && jnt >= 0 && jnt < 3) {
        state.calDirs[leg][jnt] = d;
        recomputePoseFromRaw();
        return [200, { ok: true, action: 'set_dir', leg, joint: jnt, dir: d }];
      }
    } else if (act === 'reset') {
      state.calCenters = [[90, 90, 90], [90, 90, 90], [90, 90, 90], [90, 90, 90]];
      state.calDirs = SERVO_SIGN.map(r => r.slice());
      state.calibrated = false;
      state.manualHold = false;
      state.servos = [[90, 90, 90], [90, 90, 90], [90, 90, 90], [90, 90, 90]];
      state.rawServos = [[90, 90, 90], [90, 90, 90], [90, 90, 90], [90, 90, 90]];
      return [200, { ok: true, action: 'reset', detail: 'Calibración reiniciada a 90°' }];
    }
    return [400, { ok: false, error: 'accion_desconocida' }];
  }

  function jsonResponse(body, status = 200) {
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  function parseBody(init) {
    if (!init || !init.body) return {};
    if (typeof init.body === 'string') {
      try { return JSON.parse(init.body); } catch { return {}; }
    }
    return {};
  }

  window.fetch = function (input, init) {
    const rawUrl = typeof input === 'string' ? input : (input && input.url) || '';
    let parsed;
    try {
      parsed = new URL(rawUrl, window.location.href);
    } catch {
      return nativeFetch(input, init);
    }

    const path = parsed.pathname;
    const apiIdx = path.indexOf('/api/');
    if (apiIdx === -1) {
      return nativeFetch(input, init);
    }
    const apiPath = path.slice(apiIdx);

    if (apiPath === '/api/status') {
      return jsonResponse(buildStatusPayload());
    }
    if (apiPath === '/api/imu') {
      return jsonResponse(buildSimulatedImu());
    }
    if (apiPath === '/api/servos') {
      stepSimulator();
      return jsonResponse({
        connected: false,
        online: true,
        calibrated: state.calibrated,
        mode: state.mode,
        boot_source: 'SIMULACION',
        servos: state.servos.map(r => r.slice()),
        raw_servos: state.rawServos.map(r => r.slice()),
        centers: state.calCenters.map(r => r.slice()),
        dirs: state.calDirs.map(r => r.slice()),
      });
    }
    if (apiPath === '/api/servos/calibrate') {
      const [code, res] = calibrateServos(parseBody(init));
      return jsonResponse(res, code);
    }
    if (apiPath === '/api/esp32_status') {
      return jsonResponse({ connected: false, ip: state.esp32Ip, latency_ms: 0, replica: true });
    }
    if (apiPath === '/api/connect_esp32') {
      const qIp = parsed.searchParams.get('ip');
      const bIp = parseBody(init).ip;
      if (qIp || bIp) state.esp32Ip = String(qIp || bIp).trim();
      return jsonResponse({
        success: false,
        connected: false,
        ip: state.esp32Ip,
        latency_ms: 0,
        message: 'Réplica web estática activa (sin enlace físico a ARANA-ROBOT).',
      });
    }
    if (apiPath === '/api/disconnect_esp32' || apiPath === '/api/disconnect') {
      state.connected = false;
      return jsonResponse({ success: true, connected: false });
    }
    if (apiPath === '/api/command') {
      const payload = parseBody(init);
      const [code, res] = applyCommand(payload.cmd, payload.value);
      return jsonResponse(res, code);
    }
    if (apiPath === '/api/mando/config') {
      const method = ((init && init.method) || 'GET').toUpperCase();
      if (method === 'POST') {
        const payload = parseBody(init);
        Object.assign(state.mandoProfile, payload.profile || payload);
        state.mandoVersion += 1;
      }
      return jsonResponse({ success: true, version: state.mandoVersion, profile: Object.assign({}, state.mandoProfile) });
    }
    if (apiPath === '/api/mando/reset') {
      state.mandoProfile = Object.assign({}, DEFAULT_MANDO);
      state.mandoVersion += 1;
      return jsonResponse({ success: true, version: state.mandoVersion });
    }
    if (apiPath === '/api/mando/test') {
      return jsonResponse({
        success: false,
        message: 'Modo Réplica Reproducible (El Fin de los Niños · IPET N°66). Sin ESP32-S3 físico enlazado.',
      });
    }
    if (apiPath === '/api/gps/waypoint') {
      const payload = parseBody(init);
      const st = buildStatusPayload();
      const name = String(payload.name || `WP-${state.gpsWaypoints.length + 1}`).trim();
      const wp = { name, lat: st.sensors.gps.lat, lon: st.sensors.gps.lon, ts: Date.now() / 1000 };
      state.gpsWaypoints.push(wp);
      return jsonResponse({ success: true, waypoint: wp });
    }
    if (apiPath === '/api/gps/clear') {
      state.gpsTrack = [];
      state.gpsWaypoints = [];
      return jsonResponse({ success: true });
    }
    if (apiPath === '/api/gps/export') {
      return jsonResponse({ waypoints: state.gpsWaypoints, track: state.gpsTrack });
    }
    if (apiPath === '/api/chat') {
      const msg = String(parseBody(init).message || '').toLowerCase();
      let resp = '';
      if (msg.includes('talud') || msg.includes('sequia') || msg.includes('sequía')) {
        applyMissionPreset('talud');
        resp = 'Misión Talud Post-Sequía activada: marcha WALK_FWD cautelosa e inclinómetro MPU6050 midiendo pendiente de ribera.';
      } else if (msg.includes('alcantarilla') || msg.includes('niño') || msg.includes('conducto')) {
        applyMissionPreset('alcantarilla');
        resp = 'Misión Alcantarilla Pre-El Niño activada: gateo bajo CRAWL (-65% altura), faros encendidos y radar HC-SR04 buscando obstrucciones.';
      } else if (msg.includes('crecida') || msg.includes('centinela') || msg.includes('sentry')) {
        applyMissionPreset('sentry');
        resp = 'Modo Centinela Serrana (SENTRY) activo: torso elevado al máximo (+48 mm) vigilando pelo de agua con HC-SR04.';
      } else if (msg.includes('eva') || msg.includes('nasa') || msg.includes('transecta')) {
        applyMissionPreset('transecta');
        resp = 'Transecta Ground-Truthing iniciada sobre Cuenca 1 (1167 m): registrando microclima AHT10 y waypoints GPS.';
      } else if (msg.includes('parar') || msg.includes('stop') || msg.includes('stand')) {
        applyMissionPreset('standby');
        resp = 'Locomoción detenida. Postura neutra STAND (90° en los 12 servos).';
      } else {
        const st = buildStatusPayload();
        resp = `Copiloto NEUN · Réplica Hídrica IPET N°66 | Modo: ${st.mode} | Radar: ${st.sensors.ultrasonic.value} cm | AHT10: ${st.sensors.dht.temp}°C / ${st.sensors.dht.hum}%. Probá escribir: "talud", "alcantarilla", "crecida", "transecta" o "parar".`;
      }
      return jsonResponse({ response: resp, mode: state.mode });
    }

    return nativeFetch(input, init);
  };

  // Inicializa demoMode = true automáticamente al cargar para mostrar estado "DEMO" claro
  window.addEventListener('DOMContentLoaded', () => {
    window.demoMode = true;
    setTimeout(() => {
      if (typeof window.connectDemo === 'function') {
        try {
          const origSound = window.playSuccessSound;
          const origClick = window.playClickSound;
          window.playSuccessSound = function () {};
          window.playClickSound = function () {};
          window.connectDemo();
          window.playSuccessSound = origSound;
          window.playClickSound = origClick;
        } catch {
          const ov = document.getElementById('connOverlay');
          if (ov) ov.classList.remove('active');
        }
      }
      const params = new URLSearchParams(window.location.search);
      const preset = params.get('mission');
      if (preset) applyMissionPreset(preset);
    }, 120);
  });
})();
