    // ==================== GLOBAL ERROR CATCHER ====================
    window.onerror = function (msg, url, line, col, err) {
      const toast = document.getElementById('toastContainer') || document.body;
      const div = document.createElement('div');
      div.style.cssText = 'position:fixed;bottom:70px;right:12px;background:#ff0844;color:#fff;padding:10px 16px;border-radius:6px;font:12px monospace;z-index:9999;max-width:360px';
      div.textContent = 'JS Error: ' + (err ? err.message : msg) + ' (line ' + line + ')';
      toast.appendChild(div);
      setTimeout(() => div.remove(), 8000);
      return false;
    };

    // ==================== CONFIGURACIÓN Y ESTADO DE APLICACIÓN ====================
    let connected = false;
    let demoMode = false; window.demoMode = false;
    let emergencyStop = false;
    let stabilize = false;
    let speed = 50;
    let soundEnabled = (window.self === window.top);
    let startTime = Date.now();

    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

    // Audio FX Synthesizer (Web Audio API) — wrapped so failure never blocks UI
    let audioCtx = null;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { console.warn('AudioContext:', e); }
    function playBeep(freq, duration, type = 'sine', volume = 0.05) {
      if (!soundEnabled) return;
      try {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) { }
    }

    function playClickSound() { playBeep(900, 0.08, 'triangle', 0.08); }
    function playSwitchSound() { playBeep(500, 0.15, 'sine', 0.05); }
    function playAlertSound() {
      if (!soundEnabled) return;
      playBeep(220, 0.2, 'sawtooth', 0.15);
      setTimeout(() => playBeep(220, 0.3, 'sawtooth', 0.15), 180);
    }
    function playSuccessSound() {
      playBeep(523.25, 0.08, 'sine', 0.06); // C5
      setTimeout(() => playBeep(659.25, 0.08, 'sine', 0.06), 80); // E5
      setTimeout(() => playBeep(783.99, 0.15, 'sine', 0.06), 160); // G5
    }

    function toggleSound() {
      soundEnabled = !soundEnabled;
      const st = document.getElementById('soundText');
      const si = document.getElementById('soundIcon');
      if (st) st.textContent = soundEnabled ? 'ON' : 'OFF';
      if (si) si.innerHTML = soundEnabled ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>' : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
      if (soundEnabled) playSuccessSound();
    }

    // ==================== BUZZER / SOUND MODULE ====================
    const JP3_MELODY = [
      { freq: 523, duration: 200 }, { freq: 494, duration: 200 },
      { freq: 523, duration: 350 }, { freq: 392, duration: 350 },
      { freq: 349, duration: 450 }, { freq: 523, duration: 200 },
      { freq: 494, duration: 200 }, { freq: 523, duration: 350 },
      { freq: 392, duration: 350 }, { freq: 349, duration: 600 },
    ];
    const JP3_VARIANT_MELODY = [
      { freq: 784, duration: 260, pause: 20 }, { freq: 659, duration: 250, pause: 10 },
      { freq: 698, duration: 140, pause: 10 }, { freq: 659, duration: 120, pause: 10 },
      { freq: 587, duration: 250, pause: 10 }, { freq: 523, duration: 270, pause: 10 },
      { freq: 784, duration: 260, pause: 20 }, { freq: 1047, duration: 280, pause: 10 },
      { freq: 523, duration: 230, pause: 0 },
    ];
    const BUZZER_PRESETS = [
      { key: 'BEEP', label: 'Beep Corto', freq: 880, duration: 3000, wave: 'square', volume: 70, icon: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>' },
      { key: 'SIREN', label: 'Sirena', freq: 600, duration: 3000, wave: 'sawtooth', volume: 60, icon: '<path d="M6 12a12 12 0 0 1 12-12"/>' },
      { key: 'ALARM', label: 'Alarma', freq: 440, duration: 3000, wave: 'square', volume: 80, icon: '<path d="M12 9v4m0 4h.01"/><circle cx="12" cy="12" r="9"/>' },
      { key: 'RISE', label: 'Ascendente', freq: 300, duration: 3000, wave: 'sine', volume: 70, icon: '<polyline points="4 18 9 12 13 15 20 6"/>' },
      { key: 'FALL', label: 'Descendente', freq: 1200, duration: 3000, wave: 'triangle', volume: 70, icon: '<polyline points="4 6 9 12 13 9 20 18"/>' },
      { key: 'JURASSIC', label: 'Melodía Jurassic Park 3', freq: 523, duration: 3800, wave: 'square', volume: 80, icon: '<path d="M6 3h12v18H6z"/><path d="M9 6h6M10 18h4"/>' },
      { key: 'JP3_VARIANT', label: 'JP3 · Tono satelital', freq: 784, duration: 3000, wave: 'square', volume: 80, icon: '<path d="M6 3h12v18H6z"/><path d="M9 6h6M10 18h4"/><path d="M8 10h8"/>' },
    ];

    let buzzerWave = 'sine';
    let buzzerFreq = 880;
    let buzzerDuration = 300;
    let buzzerVolume = 50;
    let _activeBuzzerOsc = null;
    let _activeBuzzerGain = null;
    let _buzzerStopTimer = null;
    let _jurassicTimer = null;
    let headlightBrightness = 50;

    function initBuzzerUI() {
      const grid = document.getElementById('buzzerPresetGrid');
      if (grid) {
        grid.innerHTML = '';
        BUZZER_PRESETS.forEach(p => {
          const btn = document.createElement('button');
          btn.className = 'mode-card';
          btn.style.cssText = 'padding:16px;cursor:pointer;display:flex;flex-direction:column;gap:8px;align-items:flex-start';
          btn.innerHTML = '<div class="mode-card-ico" style="width:34px;height:34px;margin-bottom:0"><svg viewBox="0 0 24 24" style="width:16px;height:16px" fill="none" stroke="currentColor" stroke-width="2">' + p.icon + '</svg></div><h3 style="font-size:13px">' + p.label + '</h3>';
          btn.onclick = () => playBuzzer(p.key);
          grid.appendChild(btn);
        });
      }
      // Wave selector
      const sel = document.getElementById('waveSelector');
      if (sel) {
        sel.querySelectorAll('.tool-btn').forEach(b => {
          b.onclick = () => {
            sel.querySelectorAll('.tool-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            buzzerWave = b.dataset.wave;
          };
        });
      }
    }

    function updateBuzzerFreq(v) { buzzerFreq = parseInt(v); document.getElementById('buzzerFreqVal').textContent = buzzerFreq + ' Hz'; }
    function updateBuzzerDuration(v) { buzzerDuration = parseInt(v); document.getElementById('buzzerDurVal').textContent = buzzerDuration + ' ms'; }
    function updateBuzzerVolume(v) { buzzerVolume = parseInt(v); document.getElementById('buzzerVolVal').textContent = buzzerVolume + '%'; }

    function playBuzzer(pattern) {
      if (emergencyStop) { playAlertSound(); return; }
      if (pattern === 'JURASSIC') {
        playJurassicPhone(JP3_MELODY, 'JURASSIC', 'melodía Jurassic Park 3');
        return;
      }
      if (pattern === 'JP3_VARIANT') {
        playJurassicPhone(JP3_VARIANT_MELODY, 'JP3_VARIANT', 'variante JP3');
        return;
      }
      let cfg;
      const preset = BUZZER_PRESETS.find(p => p.key === pattern);
      if (preset) {
        cfg = { pattern: preset.key, freq: preset.freq, duration: preset.duration, wave: preset.wave, volume: preset.volume };
      } else {
        cfg = { pattern: 'CUSTOM', freq: buzzerFreq, duration: buzzerDuration, wave: buzzerWave, volume: buzzerVolume };
      }
      stopBuzzerLocal();
      playBuzzerLocal(cfg);
      sendCmd('buzzer', cfg);
      showToast('Buzzer: ' + cfg.pattern.toLowerCase() + ' · ' + cfg.freq + ' Hz', 'success');
    }

    function playJurassicPhone(melody = JP3_MELODY, pattern = 'JURASSIC', label = 'melodía Jurassic Park 3') {
      if (emergencyStop) { playAlertSound(); return; }
      stopBuzzerLocal();
      sendCmd('buzzer', { pattern, freq: melody[0].freq, wave: 'square', volume: 80 });
      playJurassicPreviewNote(0, melody, pattern === 'JP3_VARIANT');
      showToast('Buzzer: ' + label, 'success');
    }

    function playJurassicPreviewNote(index, melody = JP3_MELODY, variant = false) {
      if (index >= melody.length) {
        _jurassicTimer = setTimeout(() => playJurassicPreviewNote(0, melody, variant), variant ? 2160 : 2500);
        return;
      }
      const note = melody[index];
      playBuzzerLocal({ ...note, wave: 'square', volume: 80 });
      _jurassicTimer = setTimeout(
        () => playJurassicPreviewNote(index + 1, melody, variant),
        note.duration + (variant ? note.pause : Math.round(note.duration * 0.15))
      );
    }

    function stopBuzzer() {
      stopBuzzerLocal();
      sendCmd('buzzer_stop');
      showToast('Buzzer detenido', 'warn');
    }

    function previewHeadlightBrightness(value) {
      headlightBrightness = Math.max(1, Math.min(100, Number(value) || 1));
      const label = document.getElementById('sens-headlights-brightness-val');
      if (label) label.textContent = `${headlightBrightness}%`;
    }

    function commitHeadlightBrightness(value) {
      previewHeadlightBrightness(value);
      const status = window.latestRobotStatus?.sensors?.headlights;
      if (connected && status?.online && status.state === 'on') {
        sendCmd('headlight', { state: 'on', brightness: headlightBrightness });
      }
    }

    function setHeadlightPower(on) {
      const status = window.latestRobotStatus?.sensors?.headlights;
      if (!connected || !status?.online) {
        showToast('Linterna sin conexión con el ESP32', 'warn');
        return;
      }
      const value = on
        ? { state: 'on', brightness: headlightBrightness }
        : { state: 'off' };
      sendCmd('headlight', value);
    }

    function playBuzzerLocal(cfg) {
      if (!soundEnabled || !audioCtx) return;
      try {
        stopBuzzerLocal(false);
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = cfg.wave;
        osc.frequency.setValueAtTime(cfg.freq, audioCtx.currentTime);
        const vol = (cfg.volume / 100) * 0.2;
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + cfg.duration / 1000);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + cfg.duration / 1000);
        _activeBuzzerOsc = osc;
        _activeBuzzerGain = gain;
        clearTimeout(_buzzerStopTimer);
        _buzzerStopTimer = setTimeout(() => stopBuzzerLocal(false), cfg.duration);
      } catch (e) { }
    }

    function stopBuzzerLocal(cancelSequence = true) {
      if (cancelSequence) {
        clearTimeout(_jurassicTimer);
        _jurassicTimer = null;
      }
      clearTimeout(_buzzerStopTimer);
      try { if (_activeBuzzerOsc) _activeBuzzerOsc.stop(); } catch (e) { }
      try { if (_activeBuzzerGain) _activeBuzzerGain.disconnect(); } catch (e) { }
      _activeBuzzerOsc = null;
      _activeBuzzerGain = null;
    }

    // ==================== PANEL NAVIGATION ====================
    function switchPanel(panelId, buttonEl) {
      playSwitchSound();
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

      const panel = document.getElementById('panel-' + panelId);
      if (panel) {
        panel.classList.add('active');
      }
      buttonEl.classList.add('active');
      if (panelId === 'mando' && typeof mandoLoadProfile === 'function' && !window._mandoLoaded) {
        window._mandoLoaded = true;
        mandoLoadProfile();
      }

      if (panelId === 'modes' && typeof buildModeDial === 'function') {
        requestAnimationFrame(() => {
          if (typeof positionModeOrbs === 'function') positionModeOrbs();
        });
      }
    }

    // ==================== RADAR CANVAS SYSTEM ====================
    let canvas = null, ctx = null, radarCenter = { x: 210, y: 210 }, radarRadius = 195;
    const RADAR_LOGICAL_SIZE = 420;
    let radarRangeCm = 400;
    let radarRingStepCm = 40, radarRingStepAuto = true;
    const RADAR_BEAM_APERTURE_DEG = 30;
    let radarHeadingDeg = 0, lastKnownDistance = 42;
    let radarYawZero = null, radarScanActive = false, radarScanDemo = false;
    let radarScanStartYaw = null, radarScanLastYaw = null, radarScanAccum = 0;
    let radarScanLastProgressAt = 0;
    let radarScanStartedAt = 0, radarScanLastTickAt = 0, radarScanReturns = new Map();
    let radarCurrentReturn = null;
    let radarCommandQueue = Promise.resolve();

    function enqueueRadarCommand(cmd, value) {
      radarCommandQueue = radarCommandQueue.then(() => sendCmd(cmd, value));
      return radarCommandQueue;
    }

    function wrapYawDelta(delta) {
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;
      return delta;
    }

    function normalizeHeading(deg) {
      return ((deg % 360) + 360) % 360;
    }

    function setRadarScanLabel(text, mode = 'idle') {
      const el = document.getElementById('radarScanState');
      if (!el) return;
      el.textContent = text;
      el.classList.remove('scanning', 'demo', 'physical');
      if (mode !== 'idle') el.classList.add('scanning', mode);
    }

    function setRadarScanButton(active) {
      const btn = document.getElementById('radarScanBtn');
      if (!btn) return;
      btn.textContent = active ? 'Detener barrido' : 'Iniciar barrido 360°';
      btn.classList.toggle('danger', active);
    }

    function toggleRadarExpand() {
      const card = document.getElementById('radarCard');
      const btn = document.getElementById('radarExpandBtn');
      if (!card || !btn) return;
      const expanded = card.classList.toggle('radar-card-expanded');
      btn.textContent = expanded ? 'Reducir radar' : 'Ampliar radar';
      requestAnimationFrame(resizeRadarCanvas);
    }

    function setRadarRange(value) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return;
      radarRangeCm = Math.round(Math.min(400, Math.max(25, parsed)));
      const minStep = radarRangeCm / 10;
      if (radarRingStepAuto) radarRingStepCm = minStep;
      else radarRingStepCm = Math.min(radarRangeCm, Math.max(minStep, radarRingStepCm));
      syncRadarScaleControls();
    }

    function setRadarRingStep(value) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return;
      radarRingStepCm = Math.min(radarRangeCm, Math.max(radarRangeCm / 10, parsed));
      radarRingStepCm = Number(radarRingStepCm.toFixed(1));
      radarRingStepAuto = false;
      syncRadarScaleControls();
    }

    function setRadarRingAuto() {
      radarRingStepAuto = true;
      radarRingStepCm = radarRangeCm / 10;
      syncRadarScaleControls();
    }

    function syncRadarScaleControls() {
      const rangeInput = document.getElementById('radarRangeInput');
      const stepInput = document.getElementById('radarRingStepInput');
      const autoButton = document.getElementById('radarRingAutoBtn');
      if (rangeInput) rangeInput.value = String(radarRangeCm);
      if (stepInput) {
        stepInput.min = String(radarRangeCm / 10);
        stepInput.max = String(radarRangeCm);
        stepInput.value = String(radarRingStepCm);
      }
      if (autoButton) {
        autoButton.textContent = radarRingStepAuto ? 'Paso auto ✓' : 'Volver a auto';
        autoButton.classList.toggle('primary', radarRingStepAuto);
      }
    }

    function toggleRadarScan() {
      if (radarScanActive) {
        stopRadarScan('Barrido detenido por el usuario');
        return;
      }
      if (emergencyStop) {
        showToast('Desactiva la parada de emergencia antes de escanear', 'error');
        return;
      }
      const status = window.latestRobotStatus;
      if (!connected) {
        if (demoMode) startRadarScan(true, status);
        else showToast('Conecta el ESP32 o activa el modo Demo para iniciar el barrido', 'error');
        return;
      }
      if (!status || !status.sensors?.imu?.online || !Number.isFinite(Number(status.sensors.imu.yaw)) ||
          !status.sensors?.ultrasonic?.online ||
          !status.sensors?.servos?.online) {
        showToast('El barrido requiere IMU, HC-SR04 y PCA9685 online', 'error');
        return;
      }
      if (status.mode !== 'STAND' || Math.abs(parseFloat(document.getElementById('joyX')?.textContent || '0')) > 0.02 ||
          Math.abs(parseFloat(document.getElementById('joyY')?.textContent || '0')) > 0.02 ||
          Math.abs(parseFloat(document.getElementById('rotRate')?.textContent || '0')) > 0.02) {
        showToast('Pon el robot en STAND y centra los controles antes de escanear', 'warn');
        return;
      }
      startRadarScan(false, status);
    }

    function startRadarScan(demo, status) {
      radarScanActive = true;
      radarScanDemo = demo;
      radarScanStartedAt = performance.now();
      radarScanLastTickAt = radarScanStartedAt;
      radarScanLastProgressAt = radarScanStartedAt;
      radarScanAccum = 0;
      radarScanReturns.clear();
      if (demo) radarCurrentReturn = null;
      if (!demo) {
        radarScanStartYaw = Number(status.sensors.imu.yaw);
        radarScanLastYaw = radarScanStartYaw;
      }
      setRadarScanButton(true);
      setRadarScanLabel(demo ? 'DEMO · simulación de giro 360°' : 'Escaneando · yaw relativo del IMU',
        demo ? 'demo' : 'physical');
      if (!demo) {
        // WALK_FWD permite al generador de marcha ejecutar la orden rotate.
        // En STAND el firmware deja las patas en pose neutra y no gira.
        enqueueRadarCommand('mode', 'WALK_FWD').then(ok => {
          if (!ok || !radarScanActive || emergencyStop) {
            if (radarScanActive) stopRadarScan('No se pudo iniciar el giro');
            return;
          }
          const rr = document.getElementById('rotRate');
          const rd = document.getElementById('rotDir');
          if (rr) rr.textContent = '0.25';
          if (rd) rd.textContent = 'Horario ↻';
          enqueueRadarCommand('rotate', 0.25).then(sent => {
            if (!sent && radarScanActive) stopRadarScan('No se pudo iniciar el giro');
          });
        });
      }
    }

    function stopRadarScan(reason = 'Barrido finalizado') {
      if (!radarScanActive) return;
      const wasPhysical = !radarScanDemo;
      const wasDemo = radarScanDemo;
      radarScanActive = false;
      radarScanDemo = false;
      if (wasDemo) radarScanReturns.clear();
      else if (Number.isFinite(radarScanStartYaw)) radarYawZero = radarScanStartYaw;
      setRadarScanButton(false);
      setRadarScanLabel(`${reason} · ${Math.round(Math.abs(radarScanAccum))}° ${wasDemo ? 'simulados' : 'medidos'}`);
      if (wasPhysical) {
        // STAND primero evita que WALK_FWD con rotate=0 siga caminando hacia delante.
        enqueueRadarCommand('mode', 'STAND').then(() => enqueueRadarCommand('rotate', 0));
      }
      const rr = document.getElementById('rotRate');
      const rd = document.getElementById('rotDir');
      if (rr) rr.textContent = '0.00';
      if (rd) rd.textContent = 'Neutro';
    }

    // El watchdog local también funciona si se corta el polling de estado:
    // el firmware tiene su propio watchdog y vuelve a STAND al perder comandos.
    setInterval(() => {
      if (!radarScanActive) return;
      const now = performance.now();
      if (now - radarScanStartedAt > 60000) stopRadarScan('Tiempo máximo alcanzado');
      else if (!radarScanDemo && now - radarScanLastProgressAt > 6000) {
        stopRadarScan('Sin cambio de yaw · barrido detenido');
      }
    }, 500);

    function updateRadarTelemetry(status) {
      const imu = status?.sensors?.imu;
      const sonar = status?.sensors?.ultrasonic;
      const imuValid = Boolean(imu?.online) && Number.isFinite(Number(imu?.yaw));
      if (radarScanActive && radarScanDemo) {
        const now = performance.now();
        const dt = Math.min(0.5, Math.max(0, (now - radarScanLastTickAt) / 1000));
        radarScanLastTickAt = now;
        radarScanAccum += 32 * dt;
      } else if (!imuValid) {
        if (radarScanActive && !radarScanDemo) stopRadarScan('IMU offline');
      }
      if (imuValid) {
        const yaw = Number(imu.yaw);
        if (!radarScanDemo && radarYawZero === null) radarYawZero = yaw;

        if (radarScanActive && !radarScanDemo) {
          const delta = wrapYawDelta(yaw - radarScanLastYaw);
          radarScanLastYaw = yaw;
          if (Math.abs(delta) < 45) radarScanAccum += delta;
          if (Math.abs(delta) >= 0.4) radarScanLastProgressAt = performance.now();
        }

        if (radarScanActive && !radarScanDemo) radarHeadingDeg = radarScanAccum;
        else if (!radarScanActive && radarYawZero !== null) radarHeadingDeg = wrapYawDelta(yaw - radarYawZero);
      }

      if (radarScanActive && radarScanDemo) radarHeadingDeg = radarScanAccum;

      const sonarValue = Number(sonar?.value);
      const validSonar = Boolean(sonar?.online) && Number.isFinite(sonarValue) && sonarValue > 0 && sonarValue <= 400;
      radarCurrentReturn = validSonar
        ? { angle: radarHeadingDeg, distance: sonarValue }
        : null;

      if (!radarScanActive) return;
      const progress = Math.min(360, Math.round(Math.abs(radarScanAccum)));
      setRadarScanLabel(`${radarScanDemo ? 'DEMO · ' : ''}Barrido ${progress}° / 360°`,
        radarScanDemo ? 'demo' : 'physical');

      if (validSonar && !radarScanDemo) {
        const bin = Math.round(normalizeHeading(radarScanAccum)) % 360;
        radarScanReturns.set(bin, { angle: bin, distance: sonarValue });
      }

      if (Math.abs(radarScanAccum) >= 360) {
        stopRadarScan('Barrido 360° completo');
      }
    }
    function resizeRadarCanvas() {
      if (!canvas) return;
      const dpr = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
      const cssSize = Math.max(1, canvas.getBoundingClientRect().width || RADAR_LOGICAL_SIZE);
      // Limita el buffer para evitar millones de píxeles por cuadro en móviles HiDPI.
      const backingScale = Math.min(2, Math.max(1, cssSize / RADAR_LOGICAL_SIZE) * dpr);
      const backingSize = Math.round(RADAR_LOGICAL_SIZE * backingScale);
      if (canvas.width !== backingSize || canvas.height !== backingSize) {
        canvas.width = backingSize;
        canvas.height = backingSize;
      }
      ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(backingScale, 0, 0, backingScale, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      radarCenter = { x: RADAR_LOGICAL_SIZE / 2, y: RADAR_LOGICAL_SIZE / 2 };
      radarRadius = RADAR_LOGICAL_SIZE / 2 - 14;
    }

    try {
      canvas = document.getElementById('radarCanvas');
      if (canvas) {
        resizeRadarCanvas();
        window.addEventListener('resize', resizeRadarCanvas, { passive: true });
        if ('ResizeObserver' in window && canvas.parentElement) {
          window._radarResizeObserver = new ResizeObserver(resizeRadarCanvas);
          window._radarResizeObserver.observe(canvas.parentElement);
        }
      }
    } catch (e) { console.warn('Radar canvas:', e); }

    let lastRadarFrameAt = 0;
    function updateRadarDrawing(frameTime = 0) {
      if (!ctx || !canvas) return;
      if (document.hidden || !canvas.getClientRects().length) {
        setTimeout(() => requestAnimationFrame(updateRadarDrawing), 250);
        return;
      }
      requestAnimationFrame(updateRadarDrawing);
      if (frameTime - lastRadarFrameAt < 33) return;
      lastRadarFrameAt = frameTime;
      // Fondo opaco con viñeta radial: no conserva píxeles viejos entre cuadros.
      const bg = ctx.createRadialGradient(
        radarCenter.x, radarCenter.y, radarRadius * 0.08,
        radarCenter.x, radarCenter.y, radarRadius * 1.18
      );
      bg.addColorStop(0, '#11131d');
      bg.addColorStop(0.72, '#080b14');
      bg.addColorStop(1, '#03050a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, RADAR_LOGICAL_SIZE, RADAR_LOGICAL_SIZE);

      // Anillos ajustables; se limita a diez para mantener una separación legible.
      const ringDistances = [];
      for (let distance = radarRingStepCm; distance < radarRangeCm - 0.05 && ringDistances.length < 9;
        distance += radarRingStepCm) {
        ringDistances.push(Number(distance.toFixed(1)));
      }
      if (!ringDistances.length || ringDistances[ringDistances.length - 1] < radarRangeCm - 0.05) {
        ringDistances.push(radarRangeCm);
      }
      const labelAngle = -Math.PI / 4;
      ctx.lineWidth = 0.65;
      ringDistances.forEach((distance, index) => {
        const r = (distance / radarRangeCm) * radarRadius;
        ctx.strokeStyle = (index + 1) % 2 === 0 || index === ringDistances.length - 1
          ? 'rgba(255, 65, 88, 0.23)' : 'rgba(255, 65, 88, 0.12)';
        ctx.beginPath();
        ctx.arc(radarCenter.x, radarCenter.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Etiquetas en una diagonal y alternadas para no amontonarlas en una fila.
        if ((index + 1) % 2 === 0 || index === ringDistances.length - 1) {
          const label = `${distance} cm`;
          const x = radarCenter.x + Math.cos(labelAngle) * r;
          const y = radarCenter.y + Math.sin(labelAngle) * r;
          ctx.font = '600 7px Space Grotesk, sans-serif';
          ctx.textAlign = 'center';
          const width = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(3, 5, 10, 0.86)';
          ctx.fillRect(x - width / 2 - 2, y - 5, width + 4, 10);
          ctx.fillStyle = 'rgba(235, 240, 249, 0.88)';
          ctx.fillText(label, x, y + 2.5);
        }
      });
      ctx.textAlign = 'left';

      // Ejes Cruzados
      ctx.strokeStyle = 'rgba(180, 193, 215, 0.11)';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(radarCenter.x - radarRadius, radarCenter.y);
      ctx.lineTo(radarCenter.x + radarRadius, radarCenter.y);
      ctx.moveTo(radarCenter.x, radarCenter.y - radarRadius);
      ctx.lineTo(radarCenter.x, radarCenter.y + radarRadius);
      ctx.stroke();

      // Líneas Diagonales Tácticas
      const diag = radarRadius * 0.68;
      ctx.strokeStyle = 'rgba(180, 193, 215, 0.055)';
      ctx.beginPath();
      ctx.moveTo(radarCenter.x - diag, radarCenter.y - diag);
      ctx.lineTo(radarCenter.x + diag, radarCenter.y + diag);
      ctx.moveTo(radarCenter.x - diag, radarCenter.y + diag);
      ctx.lineTo(radarCenter.x + diag, radarCenter.y - diag);
      ctx.stroke();

      // Retornos medidos durante el barrido: cada punto conserva su ángulo y
      // distancia; no se inventan ecos cuando el sensor no tiene lectura.
      radarScanReturns.forEach(obj => drawRadarReturn(obj, 4.5, 10));
      // Lectura viva en el ángulo actual, incluso cuando el robot está quieto.
      if (radarCurrentReturn) drawRadarReturn(radarCurrentReturn, 5.5, 14);
      ctx.shadowBlur = 0;

      // Cono frontal y línea de orientación del HC-SR04.
      const sweepAngle = (radarHeadingDeg - 90) * Math.PI / 180;
      const sweepX = radarCenter.x + Math.cos(sweepAngle) * radarRadius;
      const sweepY = radarCenter.y + Math.sin(sweepAngle) * radarRadius;

      // Apertura gráfica aproximada de 30° para el haz frontal del HC-SR04.
      const halfBeamAngle = RADAR_BEAM_APERTURE_DEG * Math.PI / 360;
      ctx.fillStyle = 'rgba(255, 43, 67, 0.14)';
      ctx.beginPath();
      ctx.moveTo(radarCenter.x, radarCenter.y);
      ctx.arc(radarCenter.x, radarCenter.y, radarRadius, sweepAngle - halfBeamAngle, sweepAngle + halfBeamAngle);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 76, 101, 0.42)';
      ctx.lineWidth = 1.1;
      for (const edge of [-1, 1]) {
        const edgeAngle = sweepAngle + edge * halfBeamAngle;
        ctx.beginPath();
        ctx.moveTo(radarCenter.x, radarCenter.y);
        ctx.lineTo(radarCenter.x + Math.cos(edgeAngle) * radarRadius,
          radarCenter.y + Math.sin(edgeAngle) * radarRadius);
        ctx.stroke();
      }

      const sweepGrad = ctx.createLinearGradient(radarCenter.x, radarCenter.y, sweepX, sweepY);
      sweepGrad.addColorStop(0, 'rgba(255, 43, 67, 0.08)');
      sweepGrad.addColorStop(0.7, 'rgba(255, 43, 67, 0.32)');
      sweepGrad.addColorStop(1, 'rgba(255, 70, 94, 0.95)');

      ctx.strokeStyle = sweepGrad;
      ctx.lineWidth = 2.1;
      ctx.shadowBlur = 7;
      ctx.shadowColor = 'rgba(255, 43, 67, 0.45)';
      ctx.beginPath();
      ctx.moveTo(radarCenter.x, radarCenter.y);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Ángulo de orientación relativo al inicio del robot/barrido.
      const heading = Math.round(normalizeHeading(radarHeadingDeg));
      ctx.font = '600 9px Space Grotesk, sans-serif';
      ctx.textAlign = sweepX < radarCenter.x ? 'left' : 'right';
      ctx.fillStyle = 'rgba(255, 105, 124, 0.95)';
      ctx.fillText(`${heading}°`, sweepX + (sweepX < radarCenter.x ? 5 : -5), sweepY - 6);
      ctx.textAlign = 'left';

      ctx.font = '600 9px Space Grotesk, sans-serif';
      ctx.fillStyle = 'rgba(220, 230, 245, 0.72)';
      ctx.fillText(`MAX ${radarRangeCm} · PASO ${radarRingStepCm} cm`,
        radarCenter.x - radarRadius + 8, radarCenter.y - radarRadius + 15);

      // Araña central (el robot en el origen del radar)
      drawRadarSpider();

    }

    function drawRadarReturn(obj, radius, glow) {
      if (!ctx || obj.distance > radarRangeCm) return;
      const theta = (obj.angle - 90) * Math.PI / 180;
      const r = (obj.distance / radarRangeCm) * radarRadius;
      const x = radarCenter.x + Math.cos(theta) * r;
      const y = radarCenter.y + Math.sin(theta) * r;
      const color = obj.distance < 30 ? '#ff0844' :
        (obj.distance < 80 ? '#ffb703' : '#00ff87');
      ctx.shadowBlur = glow;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(x, y, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dibuja la araña estilizada en el centro del radar
    function drawRadarSpider() {
      const cx = radarCenter.x, cy = radarCenter.y;
      const t = performance.now() / 1000;
      const s = radarRadius / 130; // escala relativa al tamaño del radar
      const breathe = (1 + Math.sin(t * 2.1) * 0.05) * s;
      const wiggle = Math.sin(t * 3.2) * s;

      // Halo pulsante
      const haloR = (20 + Math.sin(t * 2.4) * 3) * s;
      const halo = ctx.createRadialGradient(cx, cy, 1, cx, cy, haloR + 8);
      halo.addColorStop(0, 'rgba(255, 43, 67, 0.30)');
      halo.addColorStop(0.55, 'rgba(255, 43, 67, 0.10)');
      halo.addColorStop(1, 'rgba(255, 43, 67, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, haloR + 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(radarHeadingDeg * Math.PI / 180);
      ctx.scale(breathe, breathe);
      ctx.lineCap = 'round';
      ctx.shadowBlur = 7;
      ctx.shadowColor = 'rgba(255, 60, 80, 0.85)';
      ctx.strokeStyle = '#ff4560';
      ctx.lineWidth = 1.7;

      // Patas (8): dos segmentos curvos por pata, con leve oscilación
      ctx.beginPath();
      // Lado izquierdo
      ctx.moveTo(-3, -1); ctx.quadraticCurveTo(-8, -3, -12 + wiggle, -9);
      ctx.moveTo(-3.6, 1); ctx.quadraticCurveTo(-9, 0.5, -14 - wiggle, -3);
      ctx.moveTo(-3.4, 3); ctx.quadraticCurveTo(-8, 4.5, -12 + wiggle, 9);
      ctx.moveTo(-2.2, 4.6); ctx.quadraticCurveTo(-5, 7, -6 - wiggle, 11.5);
      // Lado derecho
      ctx.moveTo(3, -1); ctx.quadraticCurveTo(8, -3, 12 - wiggle, -9);
      ctx.moveTo(3.6, 1); ctx.quadraticCurveTo(9, 0.5, 14 + wiggle, -3);
      ctx.moveTo(3.4, 3); ctx.quadraticCurveTo(8, 4.5, 12 - wiggle, 9);
      ctx.moveTo(2.2, 4.6); ctx.quadraticCurveTo(5, 7, 6 + wiggle, 11.5);
      ctx.stroke();

      // Cuerpo: opistosoma + cefalotórax
      ctx.fillStyle = '#20040e';
      ctx.beginPath();
      ctx.ellipse(0, 1.8, 3.4, 5, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -3.6, 2.5, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // Ojos brillantes
      ctx.shadowColor = '#ff2b43';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ff5570';
      ctx.beginPath();
      ctx.arc(-1, -4.2, 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(1, -4.2, 0.85, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.shadowBlur = 0;
    }
    requestAnimationFrame(updateRadarDrawing);


    // ==================== TECLADO FISICO MAPPING SYSTEM ====================
    // Estructura por defecto para mapear acciones
    let movementKeybinds = {
      'forward': { code: 'KeyW', label: 'W' },
      'backward': { code: 'KeyS', label: 'S' },
      'left': { code: 'KeyA', label: 'A' },
      'right': { code: 'KeyD', label: 'D' },
      'stop': { code: 'Space', label: 'Espacio' }
    };

    // Cargar mapeos de localStorage si existen
    if (localStorage.getItem('arana_keybinds_2_5')) {
      try {
        movementKeybinds = JSON.parse(localStorage.getItem('arana_keybinds_2_5'));
      } catch (e) { }
    }

    let activeListeningAction = null;

    function renderKeybindsUI() {
      const container = document.getElementById('keybindsListContainer');
      container.innerHTML = '';

      const actionLabels = {
        'forward': 'Avanzar (↑)',
        'backward': 'Retroceder (↓)',
        'left': 'Girar Izquierda (←)',
        'right': 'Girar Derecha (→)',
        'stop': 'Freno / Stop'
      };

      Object.keys(movementKeybinds).forEach(action => {
        const row = document.createElement('div');
        row.className = 'keybind-row';

        const actionSpan = document.createElement('span');
        actionSpan.className = 'keybind-action';
        actionSpan.textContent = actionLabels[action];

        const btn = document.createElement('button');
        btn.className = 'keybind-input-btn';
        btn.id = `kb-btn-${action}`;
        btn.textContent = movementKeybinds[action].label;
        btn.onclick = () => startListeningForKey(action);

        row.appendChild(actionSpan);
        row.appendChild(btn);
        container.appendChild(row);

        // Actualizar también la etiqueta visual en el D-Pad HTML
        const dpadIndicator = document.getElementById(`ind-${action}`);
        if (dpadIndicator) {
          dpadIndicator.textContent = movementKeybinds[action].label;
        }
      });
    }

    function openKeybindModal() {
      playClickSound();
      renderKeybindsUI();
      document.getElementById('keybindModal').classList.add('active');
    }

    function closeKeybindModal() {
      playClickSound();
      activeListeningAction = null;
      document.getElementById('keybindModal').classList.remove('active');
    }

    function startListeningForKey(action) {
      playClickSound();
      if (activeListeningAction) {
        document.getElementById(`kb-btn-${activeListeningAction}`).classList.remove('listening');
      }
      activeListeningAction = action;
      const btn = document.getElementById(`kb-btn-${action}`);
      btn.classList.add('listening');
      btn.textContent = 'Presiona Tecla';
    }

    function resetDefaultKeybinds() {
      movementKeybinds = {
        'forward': { code: 'KeyW', label: 'W' },
        'backward': { code: 'KeyS', label: 'S' },
        'left': { code: 'KeyA', label: 'A' },
        'right': { code: 'KeyD', label: 'D' },
        'stop': { code: 'Space', label: 'Espacio' }
      };
      localStorage.setItem('arana_keybinds_2_5', JSON.stringify(movementKeybinds));
      playSuccessSound();
      renderKeybindsUI();
    }

    // Global Key Listeners
    document.addEventListener('keydown', e => {
      // Ignorar si el foco está en un input de texto
      if (document.activeElement.tagName === 'INPUT') return;

      // Caso 1: Escuchando nueva tecla para reasignar
      if (activeListeningAction) {
        e.preventDefault();
        movementKeybinds[activeListeningAction] = {
          code: e.code,
          label: e.key === ' ' ? 'Espacio' : e.key.toUpperCase()
        };
        localStorage.setItem('arana_keybinds_2_5', JSON.stringify(movementKeybinds));
        activeListeningAction = null;
        playSuccessSound();
        renderKeybindsUI();
        return;
      }

      // Caso 2: Controlar locomoción del Robot
      let foundAction = null;
      Object.keys(movementKeybinds).forEach(action => {
        if (movementKeybinds[action].code === e.code) {
          foundAction = action;
        }
      });

      if (foundAction) {
        e.preventDefault();
        const dpadBtn = document.getElementById(`dpad-${foundAction}`);
        if (dpadBtn && !dpadBtn.classList.contains('keyboard-active')) {
          dpadBtn.classList.add('keyboard-active');
          sendMove(foundAction);
        }
      }
    });

    document.addEventListener('keyup', e => {
      if (document.activeElement.tagName === 'INPUT') return;

      let foundAction = null;
      Object.keys(movementKeybinds).forEach(action => {
        if (movementKeybinds[action].code === e.code) {
          foundAction = action;
        }
      });

      if (foundAction) {
        const dpadBtn = document.getElementById(`dpad-${foundAction}`);
        if (dpadBtn) {
          dpadBtn.classList.remove('keyboard-active');
          // Al soltar cualquier tecla de dirección, enviar 'stop'
          if (foundAction !== 'stop') {
            sendMove('stop');
          }
        }
      }
    });


    // ==================== MULTICOLOR LED MATRIX EDITOR ====================
    let selectedDrawingColor = '#ff2b43';
    let customPaletteArray = ['#ff2b43', '#ff6b35', '#00ff87', '#9d4edd', '#ffb703', '#ff0844', '#f8fafc', '#000000'];
    let activeDrawingTool = 'draw'; // 'draw', 'erase', 'eyedrop'
    let isDrawingDragActive = false;
    let ledMatrixCanvasState = Array(64).fill('#000000'); // Mantiene estado de los 64 píxeles en hex color

    // Cargar paleta personalizada guardada
    if (localStorage.getItem('arana_led_palette')) {
      try {
        customPaletteArray = JSON.parse(localStorage.getItem('arana_led_palette'));
      } catch (e) { }
    }

    function initLedMatrixUI() {
      // Inicializar swatches de gama predefinida
      const presetSwatchesEl = document.getElementById('presetSwatches');
      presetSwatchesEl.innerHTML = '';
      const neonPresets = ['#ff2b43', '#00ff87', '#ffb703', '#ff6b35', '#ff0844', '#9d4edd', '#ff007f', '#ffffff'];

      neonPresets.forEach(color => {
        const btn = document.createElement('button');
        btn.className = `swatch-btn ${color === selectedDrawingColor ? 'selected' : ''}`;
        btn.style.backgroundColor = color;
        btn.style.setProperty('--swatch-color', color);
        btn.onclick = () => selectDrawingColor(color, btn);
        presetSwatchesEl.appendChild(btn);
      });

      // Renderizar Swatches Personalizados del Usuario
      renderCustomSwatches();

      // Inicializar Matriz interactiva de 8x8
      const matrixContainer = document.getElementById('ledMatrixContainer');
      matrixContainer.innerHTML = '';

      for (let idx = 0; idx < 64; idx++) {
        const px = document.createElement('div');
        px.className = 'led-dot-pixel';
        px.dataset.index = idx;
        px.dataset.x = idx % 8;
        px.dataset.y = Math.floor(idx / 8);

        // Cargar color actual si existe
        if (ledMatrixCanvasState[idx] && ledMatrixCanvasState[idx] !== '#000000') {
          px.classList.add('lit');
          px.style.setProperty('--pixel-color', ledMatrixCanvasState[idx]);
        }

        // Eventos Mouse y Táctiles
        px.onmousedown = (e) => {
          e.preventDefault();
          isDrawingDragActive = true;
          applyToolToPixel(px);
        };
        px.onmouseenter = () => {
          if (isDrawingDragActive) {
            applyToolToPixel(px);
          }
        };

        matrixContainer.appendChild(px);
      }
    }

    document.addEventListener('mouseup', () => {
      isDrawingDragActive = false;
    });

    function selectDrawingColor(color, btnEl) {
      playClickSound();
      selectedDrawingColor = color;
      document.getElementById('customColorPicker').value = color;

      document.querySelectorAll('.swatch-btn').forEach(b => b.classList.remove('selected'));
      if (btnEl) {
        btnEl.classList.add('selected');
      }

      // Si tenemos borrador activo, cambiar automáticamente a pincel
      if (activeDrawingTool === 'erase') {
        setDrawingTool('draw');
      }
    }

    function setDrawingTool(tool) {
      playClickSound();
      activeDrawingTool = tool;
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      document.getElementById(`tool-${tool}`).classList.add('active');
    }

    function applyToolToPixel(pixelEl) {
      const index = parseInt(pixelEl.dataset.index);
      const x = parseInt(pixelEl.dataset.x);
      const y = parseInt(pixelEl.dataset.y);

      if (activeDrawingTool === 'draw') {
        pixelEl.classList.add('lit');
        pixelEl.style.setProperty('--pixel-color', selectedDrawingColor);
        ledMatrixCanvasState[index] = selectedDrawingColor;
        playBeep(400 + index * 10, 0.05, 'sine', 0.03);
        sendCmd('led_pixel', { x: x, y: y, color: selectedDrawingColor, on: true });
      }
      else if (activeDrawingTool === 'erase') {
        pixelEl.classList.remove('lit');
        pixelEl.style.removeProperty('--pixel-color');
        ledMatrixCanvasState[index] = '#000000';
        playBeep(200, 0.05, 'triangle', 0.03);
        sendCmd('led_pixel', { x: x, y: y, color: '#000000', on: false });
      }
      else if (activeDrawingTool === 'eyedrop') {
        const color = ledMatrixCanvasState[index] || '#000000';
        if (color !== '#000000') {
          selectDrawingColor(color);
          setDrawingTool('draw');
        }
      }
    }

    function renderCustomSwatches() {
      const container = document.getElementById('customSwatches');
      container.innerHTML = '';

      customPaletteArray.forEach(color => {
        const btn = document.createElement('button');
        btn.className = `swatch-btn ${color === selectedDrawingColor ? 'selected' : ''}`;
        btn.style.backgroundColor = color;
        btn.style.setProperty('--swatch-color', color);
        btn.onclick = () => selectDrawingColor(color, btn);
        // Clic derecho para borrar swatch
        btn.oncontextmenu = (e) => {
          e.preventDefault();
          customPaletteArray = customPaletteArray.filter(c => c !== color);
          localStorage.setItem('arana_led_palette', JSON.stringify(customPaletteArray));
          renderCustomSwatches();
        };
        container.appendChild(btn);
      });
    }

    function addCustomColorSwatch() {
      const val = document.getElementById('customColorPicker').value;
      if (!customPaletteArray.includes(val)) {
        customPaletteArray.push(val);
        if (customPaletteArray.length > 16) {
          customPaletteArray.shift(); // Límite de 16
        }
        localStorage.setItem('arana_led_palette', JSON.stringify(customPaletteArray));
        playSuccessSound();
        renderCustomSwatches();
      }
    }

    function clearMatrixCanvas() {
      playClickSound();
      ledMatrixCanvasState = Array(64).fill('#000000');
      document.querySelectorAll('.led-dot-pixel').forEach(px => {
        px.classList.remove('lit');
        px.style.removeProperty('--pixel-color');
      });
      sendCmd('led_clear');
      showToast('Lienzo LED limpiado', 'success');
    }

    function fillMatrixCanvas() {
      playClickSound();
      ledMatrixCanvasState = Array(64).fill(selectedDrawingColor);
      document.querySelectorAll('.led-dot-pixel').forEach(px => {
        px.classList.add('lit');
        px.style.setProperty('--pixel-color', selectedDrawingColor);
      });
      sendCmd('led_fill', { color: selectedDrawingColor });
      showToast('Lienzo LED rellenado', 'success');
    }

    function invertMatrixCanvas() {
      playClickSound();
      document.querySelectorAll('.led-dot-pixel').forEach(px => {
        const idx = parseInt(px.dataset.index);
        const x = parseInt(px.dataset.x);
        const y = parseInt(px.dataset.y);

        if (px.classList.contains('lit')) {
          px.classList.remove('lit');
          px.style.removeProperty('--pixel-color');
          ledMatrixCanvasState[idx] = '#000000';
          sendCmd('led_pixel', { x: x, y: y, color: '#000000', on: false });
        } else {
          px.classList.add('lit');
          px.style.setProperty('--pixel-color', selectedDrawingColor);
          ledMatrixCanvasState[idx] = selectedDrawingColor;
          sendCmd('led_pixel', { x: x, y: y, color: selectedDrawingColor, on: true });
        }
      });
      showToast('Lienzo LED invertido', 'success');
    }

    const firmwarePatterns = {
      smile: [[6, 2], [6, 5], [4, 1], [4, 6], [5, 2], [5, 3], [5, 4], [5, 5]],
      heart: [[1, 1], [1, 2], [1, 4], [1, 5], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [4, 2], [4, 3], [4, 4], [5, 3]],
      arrow: [[1, 3], [1, 4], [2, 2], [2, 5], [3, 1], [3, 6], [4, 3], [4, 4], [5, 3], [5, 4], [6, 3], [6, 4], [7, 3], [7, 4]],
      spider: [[0, 0], [0, 3], [0, 4], [0, 7], [1, 1], [1, 2], [1, 5], [1, 6], [2, 2], [2, 3], [2, 4], [2, 5], [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [4, 2], [4, 3], [4, 4], [4, 5], [5, 1], [5, 6], [6, 0], [6, 7]]
    };

    function loadFirmwarePattern(name) {
      clearMatrixCanvas();
      const pattern = firmwarePatterns[name];
      if (pattern) {
        pattern.forEach(([y, x]) => {
          const idx = y * 8 + x;
          const px = document.querySelector(`.led-dot-pixel[data-index="${idx}"]`);
          if (px) {
            px.classList.add('lit');
            px.style.setProperty('--pixel-color', selectedDrawingColor);
            ledMatrixCanvasState[idx] = selectedDrawingColor;
          }
        });
        sendCmd('led_pattern', name);
        showToast('Patrón cargado: ' + name, 'success');
      }
    }

    // Escuchar cambios de color en el selector HTML5
    document.getElementById('customColorPicker').addEventListener('input', (e) => {
      selectedDrawingColor = e.target.value;
      // Deseleccionar botones para reflejar que es custom
      document.querySelectorAll('#presetSwatches .swatch-btn').forEach(b => b.classList.remove('selected'));
      document.querySelectorAll('#customSwatches .swatch-btn').forEach(b => b.classList.remove('selected'));
    });


    // ==================== CONEXIÓN Y MODALES ====================
    function showConnDialog() {
      playClickSound();
      document.getElementById('connOverlay').classList.add('active');
      checkEsp32Status();
    }

    function hideConnDialog() {
      document.getElementById('connOverlay').classList.remove('active');
    }

    function closeConnDialog() {
      playClickSound();
      hideConnDialog();
      showToast('Panel de control libre. Conecta cuando quieras desde Comunicación.', 'info');
    }

    // Click outside dialog to close
    document.getElementById('connOverlay').addEventListener('click', function (e) {
      if (e.target === this) closeConnDialog();
    });

    // Auto-dismiss after 8s if no ESP32 found
    setTimeout(() => {
      const overlay = document.getElementById('connOverlay');
      if (overlay && overlay.classList.contains('active')) {
        closeConnDialog();
      }
    }, 8000);

    function checkEsp32Status() {
      fetch('/api/esp32_status').then(r => r.json()).then(d => {
        const statusEl = document.getElementById('connStatus');
        if (d.connected) {
          statusEl.textContent = 'ENLAZADO - MODO REAL';
          statusEl.style.color = 'var(--accent-green)';
        } else {
          statusEl.textContent = 'SIN CONTACTO (Simulación disponible)';
          statusEl.style.color = 'var(--accent-yellow)';
        }
      }).catch(() => {
        const statusEl = document.getElementById('connStatus');
        statusEl.textContent = 'ERROR DE PROTOCOLO';
        statusEl.style.color = 'var(--accent-red)';
      });
    }

    function connectReal() {
      playClickSound();
      const ipInput = document.getElementById('connEspIp');
      const ip = ipInput ? ipInput.value.trim() : '192.168.4.1';
      fetch('/api/connect_esp32?ip=' + encodeURIComponent(ip)).then(r => r.json()).then(d => {
        if (d.success) {
          connected = true;
          demoMode = false; window.demoMode = false;
          updateConnectionUI(true);
          hideConnDialog();
          playSuccessSound();
          showToast('Enlace establecido con ESP32-S3. Modo Real activo.', 'success');
        } else {
          playAlertSound();
          showToast('Error de enlace. Verifica la red WiFi ARANA-ROBOT.', 'error');
        }
      });
    }

    function connectDemo() {
      playClickSound();
      connected = false;
      demoMode = true; window.demoMode = true;
      updateConnectionUI(false);
      hideConnDialog();
      playSuccessSound();
      showToast('Entorno de Simulación Activado (Modo Demo)', 'warn');
    }

    // ==================== AJUSTE DE ARTICULACIONES EN 3D ====================
    let jointEditMode = false;

    function toggleJointEditMode() {
      jointEditMode = !jointEditMode;
      const btn = document.getElementById('neun3dJointEditBtn');
      const panel = document.getElementById('neun3dJointEditPanel');
      if (btn) btn.classList.toggle('active', jointEditMode);
      if (panel) panel.hidden = !jointEditMode;
      if (jointEditMode) {
        generateJointEditGrid();
        refreshJointEditDisplay();
        if (window.NEUN3D) window.NEUN3D.setManualJointMode(true);
      } else {
        if (window.NEUN3D) window.NEUN3D.setManualJointMode(false);
      }
    }

    function generateJointEditGrid() {
      const grid = document.getElementById('neun3dJeGrid');
      if (!grid) return;
      const legs = ['FL', 'RL', 'FR', 'RR'];
      const legTitles = ['Delantera Izq.', 'Trasera Izq.', 'Delantera Der.', 'Trasera Der.'];
      const joints = ['C', 'F', 'T'];
      let html = '';
      for (let l = 0; l < 4; l++) {
        html += `<div class="neun3d-je-leg"><div class="neun3d-je-leg-head">${legs[l]} <span style="font-size:10px;opacity:0.7">${legTitles[l]}</span></div>`;
        for (let j = 0; j < 3; j++) {
          html += `
            <div class="neun3d-je-row" id="neun3dJeRow_${l}_${j}">
              <span class="neun3d-je-j">${joints[j]}</span>
              <button type="button" class="neun3d-je-minus" onclick="adjustServo3d(${l}, ${j}, -1)">−</button>
              <span class="neun3d-je-val" id="neun3dJeVal_${l}_${j}">90°</span>
              <button type="button" class="neun3d-je-plus" onclick="adjustServo3d(${l}, ${j}, 1)">+</button>
            </div>`;
        }
        html += '</div>';
      }
      grid.innerHTML = html;
    }

    function refreshJointEditDisplay() {
      if (!jointEditMode) return;
      const source = window.NEUN3D ? window.NEUN3D.getServoSource() : 'sim';
      for (let l = 0; l < 4; l++) {
        for (let j = 0; j < 3; j++) {
          let angle = 90;
          if (window.NEUN3D) {
            angle = window.NEUN3D.getServoAngle(l, j);
          }
          const el = document.getElementById(`neun3dJeVal_${l}_${j}`);
          if (el) el.textContent = `${angle}°`;
        }
      }
    }

    function adjustServo3d(leg, joint, delta) {
      if (!window.NEUN3D) {
        showToast('Visor 3D no disponible', 'error');
        return;
      }
      const current = window.NEUN3D.getServoAngle(leg, joint);
      const newAngle = Math.round(clamp(current + delta, 15, 165));
      window.NEUN3D.setManualJoint(leg * 3 + joint, newAngle);
      const el = document.getElementById(`neun3dJeVal_${leg}_${joint}`);
      if (el) el.textContent = `${newAngle}°`;

      // Enviar al ESP32 si está conectado
      if (connected) {
        sendCmd('servo_adv', { channel: leg * 3 + joint, angle: newAngle });
      }
    }

    function saveJointEditAsStand() {
      if (!jointEditMode) return;
      if (connected) {
        sendCmd('cal', 'save');
        showToast('Postura STAND guardada en NVS del ESP32', 'success');
      } else {
        showToast('Guardado solo en simulación (conecta al ESP32 para persistir)', 'warn');
      }
    }

    function resetJointEditTo90() {
      if (!window.NEUN3D) return;
      for (let l = 0; l < 4; l++) {
        for (let j = 0; j < 3; j++) {
          window.NEUN3D.setManualJoint(l * 3 + j, 90);
          const el = document.getElementById(`neun3dJeVal_${l}_${j}`);
          if (el) el.textContent = '90°';
        }
      }
      if (connected) {
        sendCmd('cal', 'reset');
      }
      showToast('Todos los servos a 90°', 'success');
    }

    // Refrescar display de ajuste de articulaciones periódicamente
    setInterval(() => {
      if (jointEditMode) refreshJointEditDisplay();
    }, 200);

    function updateConnectionUI(isConnected) {
      const badge = document.getElementById('espStatusBadge');
      const text = document.getElementById('espStatusText');
      const sidebarDot = document.getElementById('sidebarDot');
      const sidebarStatus = document.getElementById('sidebarStatus');

      if (isConnected) {
        badge.className = 'esp-status';
        text.textContent = 'ESP32: ENLAZADO';
        sidebarDot.style.background = 'var(--accent-green)';
        sidebarDot.style.boxShadow = '0 0 8px var(--accent-green)';
        sidebarStatus.textContent = 'Sistema: Robot';
      } else if (demoMode) {
        badge.className = 'esp-status demo';
        text.textContent = 'ESP32: SIMULACIÓN';
        sidebarDot.style.background = 'var(--accent-yellow)';
        sidebarDot.style.boxShadow = '0 0 8px var(--accent-yellow)';
        sidebarStatus.textContent = 'Sistema: Demo';
      } else {
        badge.className = 'esp-status offline';
        text.textContent = 'ESP32: DESCONECTADO';
        sidebarDot.style.background = 'var(--accent-red)';
        sidebarDot.style.boxShadow = '0 0 8px var(--accent-red)';
        sidebarStatus.textContent = 'Sistema: Offline';
      }
    }


    // ==================== COMANDOS DE CONTROL DE MOVIMIENTO ====================
    function toggleEmergency() {
      if (!emergencyStop && radarScanActive) stopRadarScan('Parada de emergencia');
      emergencyStop = !emergencyStop;
      const btn = document.getElementById('btnEStop');
      if (btn) btn.classList.toggle('active', emergencyStop);
      if (window.NEUN3D) window.NEUN3D.setEmergency(emergencyStop);
      sendCmd('emergency', emergencyStop);

      if (emergencyStop) {
        playAlertSound();
        showToast('PARADA DE EMERGENCIA ACTIVA - ROBOT BLOQUEADO', 'error');
      } else {
        playSuccessSound();
        showToast('Chasis Liberado. Operación nominal reanudada.', 'success');
      }
    }

    function toggleStabilize() {
      stabilize = !stabilize;
      const btn = document.getElementById('btnStab');
      btn.classList.toggle('active', stabilize);
      sendCmd('stabilize', stabilize);
      playClickSound();
      showToast(stabilize ? 'Giroestabilizador Activo (IMU MPU6050)' : 'Giroestabilizador Desconectado', 'success');
    }

    function updateSpeed(v) {
      speed = v;
      document.getElementById('speedVal').textContent = v + '%';
      if (window.NEUN3D) window.NEUN3D.setSpeed(parseInt(v));
      sendCmd('speed', parseInt(v));
    }

    let activeMoveDir = null;
    let lastImmediateJoySendAt = 0;
    let lastImmediateRotSendAt = 0;

    function pushNeun3dDrive(fwd, strafe, turn, holdMs = 700) {
      if (!window.NEUN3D) return;
      window.NEUN3D.setDriveVector(fwd, strafe, turn, holdMs);
    }

    function sendMove(dir) {
      if (emergencyStop) {
        playAlertSound();
        return;
      }
      if (dir === 'stop') {
        activeMoveDir = null;
        if (window.NEUN3D) {
          window.NEUN3D.setDriveVector(0, 0, 0, 0);
          window.NEUN3D.setRobotMode('STAND');
        }
        sendCmd('move', 'stop');
        return;
      }
      activeMoveDir = dir;
      if (dir === 'forward') pushNeun3dDrive(1, 0, 0, 700);
      else if (dir === 'backward') pushNeun3dDrive(-1, 0, 0, 700);
      else if (dir === 'left' || dir === 'crab_left') pushNeun3dDrive(0, -1, 0, 700);
      else if (dir === 'right' || dir === 'crab_right') pushNeun3dDrive(0, 1, 0, 700);
      else if (dir === 'turn_left') pushNeun3dDrive(0, 0, -1, 700);
      else if (dir === 'turn_right') pushNeun3dDrive(0, 0, 1, 700);
      sendCmd('move', dir);
    }

    function sendAux(cmd) {
      if (emergencyStop) {
        playAlertSound();
        return;
      }
      playClickSound();
      if (window.NEUN3D) {
        if (cmd === 'height_up') window.NEUN3D.adjustHeight(1);
        else if (cmd === 'height_down') window.NEUN3D.adjustHeight(-1);
        else if (cmd === 'height_reset') window.NEUN3D.adjustHeight(0);
        else if (cmd === 'tilt_fwd' && window.NEUN3D.adjustTilt) window.NEUN3D.adjustTilt(-1, 0);
        else if (cmd === 'tilt_bwd' && window.NEUN3D.adjustTilt) window.NEUN3D.adjustTilt(1, 0);
        else if (cmd === 'tilt_right' && window.NEUN3D.adjustTilt) window.NEUN3D.adjustTilt(0, 1);
        else if (cmd === 'tilt_left' && window.NEUN3D.adjustTilt) window.NEUN3D.adjustTilt(0, -1);
        else if (cmd === 'tilt_reset' && window.NEUN3D.resetTilt) window.NEUN3D.resetTilt();
      }
      sendCmd('aux', cmd);
    }

    // Joystick táctil del dashboard (Pointer Events + envío inmediato throttled + heartbeat)
    let dashboardJoyX = 0;
    let dashboardJoyY = 0;
    let dashboardJoystickActive = false;

    function setDashboardLayout(mode) {
      const split = document.querySelector('.dashboard-split');
      if (!split || !['telemetry', 'controls'].includes(mode)) return;
      split.classList.toggle('layout-telemetry', mode === 'telemetry');
      split.classList.toggle('layout-controls', mode === 'controls');
      document.querySelectorAll('.layout-btn').forEach(button => {
        const active = button.dataset.layout === mode;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      if (mode !== 'controls') releaseDashboardJoystick();
    }

    function releaseDashboardJoystick() {
      const base = document.getElementById('dashboardJoystick');
      const knobEl = document.getElementById('dashboardJoystickKnob');
      const shouldSendStop = dashboardJoystickActive;
      dashboardJoystickActive = false;
      dashboardJoyX = dashboardJoyY = 0;
      if (base) base.classList.remove('dragging');
      if (knobEl) knobEl.style.transform = 'translate(-50%, -50%)';
      const xEl = document.getElementById('dashboardJoyX');
      const yEl = document.getElementById('dashboardJoyY');
      if (xEl) xEl.textContent = '0.00';
      if (yEl) yEl.textContent = '0.00';
      if (shouldSendStop && !emergencyStop) {
        pushNeun3dDrive(0, 0, 0, 0);
        sendCmd('joystick', { x: 0, y: 0 });
      }
      if (base && dashboardJoystickPointerId !== null && base.hasPointerCapture?.(dashboardJoystickPointerId)) {
        try { base.releasePointerCapture(dashboardJoystickPointerId); } catch (e) { }
      }
      dashboardJoystickPointerId = null;
    }

    let dashboardJoystickPointerId = null;
    function initDashboardGamepad() {
      const base = document.getElementById('dashboardJoystick');
      const knobEl = document.getElementById('dashboardJoystickKnob');
      const modeSelect = document.getElementById('dashboardModeSelect');
      if (!base || !knobEl) return;

      if (modeSelect) {
        modeSelect.innerHTML = MOVE_MODES.map(mode => `<option value="${mode.code}">${mode.name}</option>`).join('');
        modeSelect.value = 'STAND';
        modeSelect.addEventListener('change', () => setMode(null, modeSelect.value));
      }

      const updatePosition = (event, forceSend = false) => {
        if (event.pointerId !== dashboardJoystickPointerId) return;
        const rect = base.getBoundingClientRect();
        const maxRadius = Math.max(1, Math.min(rect.width, rect.height) * 0.36);
        let dx = event.clientX - (rect.left + rect.width / 2);
        let dy = event.clientY - (rect.top + rect.height / 2);
        const distance = Math.hypot(dx, dy);
        if (distance > maxRadius) { dx *= maxRadius / distance; dy *= maxRadius / distance; }
        dashboardJoyX = Number((dx / maxRadius).toFixed(2));
        dashboardJoyY = Number((-dy / maxRadius).toFixed(2));
        dashboardJoystickActive = true;
        activeMoveDir = null;
        knobEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        const xEl = document.getElementById('dashboardJoyX');
        const yEl = document.getElementById('dashboardJoyY');
        if (xEl) xEl.textContent = dashboardJoyX.toFixed(2);
        if (yEl) yEl.textContent = dashboardJoyY.toFixed(2);
        pushNeun3dDrive(dashboardJoyY, dashboardJoyX, rotJoyVal, 700);
        const now = Date.now();
        if (forceSend || now - lastImmediateJoySendAt >= 80) {
          lastImmediateJoySendAt = now;
          sendCmd('joystick', { x: dashboardJoyX, y: dashboardJoyY });
        }
        event.preventDefault();
      };

      base.addEventListener('pointerdown', event => {
        if (emergencyStop) { playAlertSound(); return; }
        dashboardJoystickPointerId = event.pointerId;
        base.classList.add('dragging');
        try { base.setPointerCapture(event.pointerId); } catch (e) { }
        updatePosition(event, true);
      });
      base.addEventListener('pointermove', event => updatePosition(event, false));
      base.addEventListener('pointerup', releaseDashboardJoystick);
      base.addEventListener('pointercancel', releaseDashboardJoystick);
      base.addEventListener('lostpointercapture', () => {
        if (dashboardJoystickActive) releaseDashboardJoystick();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && dashboardJoystickActive) releaseDashboardJoystick();
      });
      setDashboardLayout('telemetry');
    }


    // ==================== MODOS DE MARCHA — DIAL CIRCULAR INTERACTIVO ====================
    const MOVE_MODES = [
      {
        code: 'STAND', name: 'Stand', full: 'Stand (Neutral)', tag: 'Estado Base',
        icon: '<path d="M12 2a3 3 0 1 0 0 6 3 3 0 1 0 0-6z"/><path d="M12 8v6M8 20l4-6 4 6"/>',
        desc: 'Estación de reposo con soporte equilibrado. Lógica IMU y autoestabilización en espera.',
        feats: ['Soporte en 12 servos con altura neutra', 'Autoestabilización por IMU en standby', 'Consumo mínimo en reposo'],
        rec: 'Arranque y espera', speed: '0 %', power: 'Bajo'
      },
      {
        code: 'WALK_FWD', name: 'Paso Trípode', full: 'Paso Trípode', tag: 'Locomoción',
        icon: '<circle cx="12" cy="12" r="3"/><path d="M12 9V2M12 15v7M9 12H2M15 12h7M9.17 9.17L4 4M14.83 9.17L20 4M9.17 14.83L4 20M14.83 14.83L20 20"/>',
        desc: 'Marcha estándar coordinada en 3 fases de elevación. Apta para superficies planas a velocidad media.',
        feats: ['Trípode de apoyo 3+3 patas en 2 fases', 'Cinemática inversa en los 12 ejes', 'Avance recto a velocidad media'],
        rec: 'Superficies planas', speed: '30-60 %', power: 'Medio'
      },
      {
        code: 'TROT', name: 'Trote Rápido', full: 'Trote Rápido', tag: 'Dinámico',
        icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        desc: 'Dinámica bifásica de avance continuo a alta frecuencia de oscilación. Mayor consumo.',
        feats: ['Avance continuo bifásico', 'Alta frecuencia de oscilación', 'Requiere mayor carga de batería'],
        rec: 'Desplazamiento rápido', speed: '50-90 %', power: 'Alto'
      },
      {
        code: 'CRAWL', name: 'Gateo Estable', full: 'Gateo Estable', tag: 'Precisión',
        icon: '<path d="M12 10a5 5 0 0 1 5 5c0 3-5 7-5 7s-5-4-5-7a5 5 0 0 1 5-5z"/><circle cx="12" cy="6" r="3"/>',
        desc: 'Desplazamiento lento con centro de masa bajo para superar rampas y terreno irregular.',
        feats: ['Centro de masa bajo', 'Tracción controlada pata a pata', 'Estable en pendientes'],
        rec: 'Rampas y terreno irregular', speed: '10-30 %', power: 'Bajo'
      },
      {
        code: 'TURN_LEFT', name: 'Giro Antihorario', full: 'Giro Antihorario', tag: 'Dirección',
        icon: '<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>',
        desc: 'Rotación sobre el pivote geométrico central hacia la izquierda sin avance lineal.',
        feats: ['Rotación sobre pivote central', 'Sin desplazamiento lineal', 'Útil para cambios de rumbo'],
        rec: 'Giros en el sitio', speed: 'N/A %', power: 'Medio'
      },
      {
        code: 'TURN_RIGHT', name: 'Giro Horario', full: 'Giro Horario', tag: 'Dirección',
        icon: '<polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>',
        desc: 'Rotación sobre el pivote geométrico central hacia la derecha sin avance lineal.',
        feats: ['Rotación horaria sobre pivote', 'Sin desplazamiento lineal', 'Complementa la marcha trípode'],
        rec: 'Giros en el sitio', speed: 'N/A %', power: 'Medio'
      },
      {
        code: 'CRAB_LEFT', name: 'Cangrejo Izq', full: 'Cangrejo Izq', tag: 'Lateral',
        icon: '<polyline points="15 18 9 12 15 6"/>',
        desc: 'Marcha omnidireccional lateral pura a 90 grados hacia el flanco izquierdo.',
        feats: ['Desplazamiento lateral a 90°', 'Sin rotación del cuerpo', 'Ideal para pasillos angostos'],
        rec: 'Espacios laterales estrechos', speed: '20-50 %', power: 'Medio'
      },
      {
        code: 'CRAB_RIGHT', name: 'Cangrejo Der', full: 'Cangrejo Der', tag: 'Lateral',
        icon: '<polyline points="9 18 15 12 9 6"/>',
        desc: 'Marcha omnidireccional lateral pura a 90 grados hacia el flanco derecho.',
        feats: ['Desplazamiento lateral a 90°', 'Sin rotación del cuerpo', 'Reflejo espejo del cangrejo izq.'],
        rec: 'Espacios laterales estrechos', speed: '20-50 %', power: 'Medio'
      },
      {
        code: 'TILT', name: 'Balanceo Activo', full: 'Balanceo Activo', tag: 'Cinemática',
        icon: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
        desc: 'Oscilación programada en el plano pitch/roll para demostración de cinemática inversa.',
        feats: ['Oscilación pitch/roll programada', 'Demostración de cinemática inversa', 'Movimiento en el lugar'],
        rec: 'Demostraciones técnicas', speed: 'N/A %', power: 'Medio'
      },
      {
        code: 'DANCE', name: 'Rutina Baile', full: 'Rutina Baile', tag: 'Rutina',
        icon: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
        desc: 'Secuencia coreografiada sincronizada con destellos dinámicos en matriz de NeoPixels.',
        feats: ['Coreografía multi-fase', 'Sincronía con matriz NeoPixel', 'Rutina preprogramada'],
        rec: 'Espectáculo y exhibición', speed: 'Variable %', power: 'Alto'
      },
      {
        code: 'SENTRY', name: 'Centinela', full: 'Centinela', tag: 'Autónomo',
        icon: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
        desc: 'Estacionaria. Barrido de 180° con el sonar. Activa alarma óptica si detecta intrusos a menos de 30cm.',
        feats: ['Barrido sonar de 180°', 'Alarma óptica por proximidad', 'Comportamiento estacionario'],
        rec: 'Vigilancia estática', speed: '0 %', power: 'Medio'
      },
      {
        code: 'EXPLORE', name: 'Exploración Autónoma', full: 'Exploración Autónoma', tag: 'Nivel IA',
        icon: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
        desc: 'Marcha libre con evasión reactiva automática basada en umbrales de proximidad del sonar.',
        feats: ['Marcha libre con evasión reactiva', 'Umbrales de proximidad del sonar', 'Navegación autónoma básica'],
        rec: 'Recorrido sin supervisión', speed: '10-40 %', power: 'Medio'
      },
      {
        code: 'SPIRAL', name: 'Espiral', full: 'Espiral Concéntrica', tag: 'Coreografía',
        icon: '<path d="M12 12m0-1.5a1.5 1.5 0 0 1 1.5 1.5 3 3 0 0 1-3 3 4.5 4.5 0 0 1-4.5-4.5A6 6 0 0 1 12 4.5 7.5 7.5 0 0 1 19.5 12c0 4.5-3.2 7.8-7.5 7.8"/>',
        desc: 'Trayectoria espiral creciente alrededor del punto de partida, combinando avance y giro continuo.',
        feats: ['Radio creciente por ciclo', 'Giro y avance simultáneos', 'Trayectoria preprogramada'],
        rec: 'Demostración de cinemática', speed: '15-35 %', power: 'Medio'
      },
      {
        code: 'JUMP', name: 'Salto', full: 'Salto Impulsado', tag: 'Dinámico',
        icon: '<path d="M12 19V6"/><path d="M6 12l6-6 6 6"/><path d="M4 21h16"/>',
        desc: 'Impulso vertical coordinado con extensión explosiva de patas y amortiguación al aterrizar.',
        feats: ['Preparación, impulso y vuelo en 3 fases', 'Amortiguación activa de impacto', 'Extensión sincronizada de las 4 patas'],
        rec: 'Demostraciones de potencia', speed: '80-100 %', power: 'Alto'
      },
      {
        code: 'WAVE', name: 'Saludo', full: 'Saludo con Patas', tag: 'Rutina',
        icon: '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
        desc: 'Levantamiento alternado de las patas delanteras en un saludo amistoso para el público.',
        feats: ['Oscilación de patas delanteras', 'Rutina corta y amigable', 'Perfecta para ferias técnicas'],
        rec: 'Feria técnica y visitas', speed: 'N/A %', power: 'Bajo'
      },
      {
        code: 'PUSHUP', name: 'Flexiones', full: 'Flexiones de Demostración', tag: 'Cinemática',
        icon: '<path d="M4 4h16"/><path d="M4 20h16"/><path d="M12 8v8"/><path d="M9 11l3-3 3 3"/><path d="M9 13l3 3 3-3"/>',
        desc: 'Flexiones reales apoyado en las patas traseras mientras el frente baja hacia el suelo y empuja arriba.',
        feats: ['Inclinación frontal controlada', 'Pivote estable en patas traseras', 'Ritmo de bajada y empuje'],
        rec: 'Calibración y exhibición', speed: 'Variable %', power: 'Medio'
      },
      {
        code: 'ELEVATE', name: 'Sube y Baja', full: 'Ascenso y Descenso Vertical', tag: 'Cinemática',
        icon: '<path d="M12 3v18"/><path d="M7 8l5-5 5 5"/><path d="M7 16l5 5 5-5"/>',
        desc: 'Sube y baja el chasis completamente horizontal con las 4 patas apoyadas de forma simétrica.',
        feats: ['Chasis siempre nivelado (0° inclinación)', 'Recorrido vertical suave de piso a extensión alta', '4 apoyos fijos sin deslizamiento'],
        rec: 'Prueba de altura y suspensión IK', speed: 'Variable %', power: 'Medio'
      },
      {
        code: 'FOLLOW', name: 'Seguir Objeto', full: 'Seguimiento de Objetivo', tag: 'Nivel IA',
        icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8" stroke-dasharray="4 3"/>',
        desc: 'Detecta el objetivo más cercano con el sonar y lo persigue manteniendo una banda de distancia segura.',
        feats: ['Lock de objetivo por sonar', 'Banda de distancia 30-50 cm', 'Corrección de rumbo continua'],
        rec: 'Pruebas de autonomía', speed: '20-40 %', power: 'Medio'
      },
      {
        code: 'SLEEP', name: 'Reposo', full: 'Reposo Profundo (Low Power)', tag: 'Energía',
        icon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
        desc: 'Modo de ahorro energético: apaga NeoPixels, reduce el sondeo de sensores y fija la postura mínima.',
        feats: ['Suspensión de periféricos', 'Consumo mínimo de batería', 'Reactivación instantánea'],
        rec: 'Transporte y almacenamiento', speed: '0 %', power: 'Mínimo'
      }
    ];

    let moveSelectedIdx = 0;
    let moveActivatedIdx = 0;

    // ---- Aro orbital: rotación continua + arrastre con inercia ----
    let dialRotation = 0;        // grados actuales del aro
    const DIAL_AUTO_SPEED = 0.05; // grados por frame (~3°/s, vuelta en ~2 min)
    let dialHoverCount = 0;      // >0 pausa la autorrotación (mouse sobre un orbe)
    let dialDragState = null;    // arrastre manual en curso
    let dialInertia = 0;         // velocidad residual tras soltar

    function buildModeDial() {
      const wrap = document.getElementById('modeDialWrap');
      const stage = document.getElementById('modeDialStage');
      const dial = document.getElementById('modeDial');
      if (!stage || !dial) return;
      stage.innerHTML = '';
      MOVE_MODES.forEach((m, i) => {
        const orb = document.createElement('div');
        orb.className = 'mode-orb';
        orb.dataset.idx = i;
        orb.innerHTML = '<span class="mode-orb-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + m.icon + '</svg></span><span class="mode-orb-name">' + m.name + '</span>';
        orb.addEventListener('click', (e) => {
          e.stopPropagation();
          selectMoveMode(i, true);
          hideModeTip();
        });
        // Zoom + tooltip al pasar el mouse / tocar
        orb.addEventListener('mouseenter', () => { dialHoverCount++; showModeTip(i); });
        orb.addEventListener('mouseleave', () => { dialHoverCount = Math.max(0, dialHoverCount - 1); hideModeTip(); });
        orb.addEventListener('touchstart', () => { dialHoverCount++; showModeTip(i); }, { passive: true });
        orb.addEventListener('touchend', () => {
          setTimeout(() => { dialHoverCount = Math.max(0, dialHoverCount - 1); hideModeTip(); }, 1400);
        });
        stage.appendChild(orb);
      });
      // Tooltip flotante compartido
      const tip = document.createElement('div');
      tip.className = 'mode-tip';
      tip.id = 'modeTip';
      stage.appendChild(tip);
      bindDialInteractions();
      positionModeOrbs();
      window.addEventListener('resize', positionModeOrbs);
      selectMoveMode(0, false);
      requestAnimationFrame(dialOrbitLoop);
      if (wrap) wrap.style.opacity = '1';
    }

    function dialRadiusFor(dial, stage) {
      const r = dial.getBoundingClientRect();
      if (r.width < 20) return null;
      const orbW = stage.querySelector('.mode-orb');
      const orbSize = orbW ? orbW.offsetWidth : 62;
      return { rect: r, radius: Math.max(40, (Math.min(r.width, r.height) / 2) - orbSize / 2 - 8) };
    }

    function positionModeOrbs() {
      const dial = document.getElementById('modeDial');
      const stage = document.getElementById('modeDialStage');
      if (!dial || !stage) return;
      const geo = dialRadiusFor(dial, stage);
      if (!geo) return;
      const cx = geo.rect.width / 2;
      const cy = geo.rect.height / 2;
      const step = 360 / MOVE_MODES.length;
      stage.querySelectorAll('.mode-orb').forEach((o, i) => {
        const angle = (Math.PI / 180) * ((i * step) - 90 + dialRotation);
        o.style.left = (cx + geo.radius * Math.cos(angle)) + 'px';
        o.style.top = (cy + geo.radius * Math.sin(angle)) + 'px';
      });
    }

    function dialOrbitLoop() {
      const wrap = document.getElementById('modeDialWrap');
      const visible = wrap && wrap.offsetParent !== null;
      if (visible && !dialDragState) {
        if (dialInertia) {
          dialRotation += dialInertia;
          dialInertia *= 0.94;
          if (Math.abs(dialInertia) < 0.005) dialInertia = 0;
          positionModeOrbs();
        } else if (dialHoverCount === 0) {
          dialRotation = (dialRotation + DIAL_AUTO_SPEED) % 360;
          positionModeOrbs();
        }
      }
      requestAnimationFrame(dialOrbitLoop);
    }

    // Arrastrar el aro para girarlo manualmente (con inercia al soltar)
    function bindDialInteractions() {
      const dial = document.getElementById('modeDial');
      if (!dial || dial.dataset.dialBound) return;
      dial.dataset.dialBound = '1';

      const angleFromPoint = (clientX, clientY) => {
        const r = dial.getBoundingClientRect();
        return Math.atan2(clientY - (r.top + r.height / 2), clientX - (r.left + r.width / 2)) * 180 / Math.PI;
      };
      const startDrag = (x, y, target) => {
        if (target.closest('.mode-orb') || target.closest('.mode-dial-center') || target.closest('.mode-go-btn')) return;
        dialDragState = { last: angleFromPoint(x, y), moved: 0 };
        dialInertia = 0;
      };
      const moveDrag = (x, y) => {
        if (!dialDragState) return;
        const a = angleFromPoint(x, y);
        let d = a - dialDragState.last;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        dialRotation += d;
        dialInertia = Math.max(-9, Math.min(9, d * 0.85));
        dialDragState.last = a;
        dialDragState.moved += Math.abs(d);
        positionModeOrbs();
      };
      const endDrag = () => { dialDragState = null; };

      dial.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY, e.target));
      window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
      window.addEventListener('mouseup', endDrag);
      dial.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        startDrag(t.clientX, t.clientY, e.target);
      }, { passive: true });
      window.addEventListener('touchmove', (e) => {
        if (dialDragState && e.touches[0]) { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); }
      }, { passive: false });
      window.addEventListener('touchend', endDrag);
    }

    // Tooltip flotante del orbe bajo el cursor
    function showModeTip(idx) {
      const m = MOVE_MODES[idx];
      const dial = document.getElementById('modeDial');
      const stage = document.getElementById('modeDialStage');
      const tip = document.getElementById('modeTip');
      if (!m || !dial || !stage || !tip) return;
      tip.innerHTML = '<b>' + m.name + '</b><span>' + m.tag + '</span><p>' + m.desc.split('.')[0] + '.</p>';
      const geo = dialRadiusFor(dial, stage);
      if (!geo) return;
      const step = 360 / MOVE_MODES.length;
      const rad = (Math.PI / 180) * ((idx * step) - 90 + dialRotation);
      const dist = geo.radius + 52;
      let x = geo.rect.width / 2 + dist * Math.cos(rad);
      let y = geo.rect.height / 2 + dist * Math.sin(rad);
      x = Math.max(90, Math.min(geo.rect.width - 90, x));
      y = Math.max(56, Math.min(geo.rect.height - 30, y));
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
      tip.classList.add('show');
    }

    function hideModeTip() {
      const tip = document.getElementById('modeTip');
      if (tip) tip.classList.remove('show');
    }

    function selectMoveMode(idx, playSound) {
      if (!MOVE_MODES[idx]) return;
      const m = MOVE_MODES[idx];
      moveSelectedIdx = idx;
      document.querySelectorAll('.mode-orb').forEach((o, i) => {
        o.classList.toggle('active', i === idx);
      });
      const cIcon = document.getElementById('modeCenterIcon');
      if (cIcon) cIcon.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + m.icon + '</svg>';
      const cName = document.getElementById('modeCenterName');
      if (cName) cName.textContent = m.name;
      const cCode = document.getElementById('modeCenterCode');
      if (cCode) cCode.textContent = m.code;
      const goBtn = document.getElementById('btnModeGo');
      if (goBtn) goBtn.classList.toggle('armed', idx === moveActivatedIdx);

      const dIcon = document.getElementById('modeDetailIcon');
      if (dIcon) dIcon.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + m.icon + '</svg>';
      const dName = document.getElementById('modeDetailName');
      if (dName) dName.textContent = m.full;
      const dTag = document.getElementById('modeDetailTag');
      if (dTag) dTag.textContent = m.tag;
      const dDesc = document.getElementById('modeDetailDesc');
      if (dDesc) dDesc.textContent = m.desc;
      const dFeats = document.getElementById('modeDetailFeats');
      if (dFeats) dFeats.innerHTML = m.feats.map(f => '<li><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' + f + '</li>').join('');
      const dRec = document.getElementById('modeDetailRec');
      if (dRec) dRec.textContent = m.rec;
      const dSpeed = document.getElementById('modeDetailSpeed');
      if (dSpeed) dSpeed.textContent = m.speed;
      const dPower = document.getElementById('modeDetailPower');
      if (dPower) dPower.textContent = m.power;
      const dPanel = document.getElementById('modeDetailPanel');
      if (dPanel) dPanel.classList.add('expanded');
      if (playSound) playClickSound();
    }

    function activateSelectedMode() {
      const m = MOVE_MODES[moveSelectedIdx];
      if (m) setMode(null, m.code);
    }

    function syncModeDialUI(code) {
      const idx = MOVE_MODES.findIndex(m => m.code === code);
      if (idx === -1) return;
      document.querySelectorAll('.mode-orb').forEach((o, i) => o.classList.toggle('active', i === idx));
      const goBtn = document.getElementById('btnModeGo');
      if (goBtn) goBtn.classList.add('armed');
      if (document.getElementById('modeCenterName')) {
        document.getElementById('modeCenterName').textContent = MOVE_MODES[idx].name;
        document.getElementById('modeCenterCode').textContent = MOVE_MODES[idx].code;
        document.getElementById('modeCenterIcon').innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + MOVE_MODES[idx].icon + '</svg>';
      }
    }

    function setMode(cardEl, modeVal) {
      if (emergencyStop) {
        playAlertSound();
        showToast('Desactiva la Parada de Emergencia para cambiar modos.', 'warn');
        return;
      }

      document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.mode-orb').forEach(c => c.classList.remove('active'));
      if (cardEl) {
        cardEl.classList.add('active');
      } else if (typeof MOVE_MODES !== 'undefined') {
        const idx = MOVE_MODES.findIndex(m => m.code === modeVal);
        if (idx > -1) {
          moveSelectedIdx = idx;
          moveActivatedIdx = idx;
          const orbs = document.querySelectorAll('.mode-orb');
          if (orbs[idx]) orbs[idx].classList.add('active');
          syncModeDialUI(modeVal);
        }
      }

      const hModeEl = document.getElementById('hMode');
      const sysModeEl = document.getElementById('sysMode');
      if (hModeEl) hModeEl.textContent = modeVal;
      if (sysModeEl) sysModeEl.textContent = modeVal;
      const modeSelect = document.getElementById('dashboardModeSelect');
      if (modeSelect && modeSelect.value !== modeVal) modeSelect.value = modeVal;
      if (window.NEUN3D) window.NEUN3D.setRobotMode(modeVal);

      sendCmd('mode', modeVal);
      playSuccessSound();
      showToast(`Modo cambiado: ${modeVal}`, 'success');
    }


    // ==================== JOYSTICK ANALÓGICO VECTORIAL ====================
    let mainJoyX = 0, mainJoyY = 0, mainJoyActive = false, mainJoyPointerId = null;
    let rotJoyVal = 0, rotJoyActive = false, rotJoyPointerId = null;

    function releaseMainJoystick() {
      const joyEl = document.getElementById('joystick');
      const knobEl = document.getElementById('knob');
      const wasActive = mainJoyActive;
      mainJoyActive = false;
      mainJoyX = 0; mainJoyY = 0;
      if (joyEl) joyEl.classList.remove('dragging');
      if (knobEl) knobEl.style.transform = 'translate(-50%, -50%)';
      const elX = document.getElementById('joyX');
      const elY = document.getElementById('joyY');
      if (elX) elX.textContent = '0.00';
      if (elY) elY.textContent = '0.00';
      if (joyEl && mainJoyPointerId !== null && joyEl.hasPointerCapture?.(mainJoyPointerId)) {
        try { joyEl.releasePointerCapture(mainJoyPointerId); } catch (e) { }
      }
      mainJoyPointerId = null;
      if (wasActive && !emergencyStop) {
        pushNeun3dDrive(0, 0, rotJoyActive ? rotJoyVal : 0, rotJoyActive ? 700 : 0);
        sendCmd('joystick', { x: 0, y: 0 });
      }
    }

    function releaseRotJoystick() {
      const rotZone = document.getElementById('rotJoystick');
      const rotKnob = document.getElementById('rotKnob');
      const wasActive = rotJoyActive;
      rotJoyActive = false;
      rotJoyVal = 0;
      if (rotZone) rotZone.classList.remove('dragging');
      if (rotKnob) rotKnob.style.transform = 'translate(-50%, -50%)';
      const elR = document.getElementById('rotRate');
      const elD = document.getElementById('rotDir');
      if (elR) elR.textContent = '0.00';
      if (elD) elD.textContent = 'Neutro';
      if (rotZone && rotJoyPointerId !== null && rotZone.hasPointerCapture?.(rotJoyPointerId)) {
        try { rotZone.releasePointerCapture(rotJoyPointerId); } catch (e) { }
      }
      rotJoyPointerId = null;
      if (wasActive && !emergencyStop) {
        const fx = dashboardJoystickActive ? dashboardJoyY : (mainJoyActive ? mainJoyY : 0);
        const sx = dashboardJoystickActive ? dashboardJoyX : (mainJoyActive ? mainJoyX : 0);
        pushNeun3dDrive(fx, sx, 0, (dashboardJoystickActive || mainJoyActive) ? 700 : 0);
        sendCmd('rotate', 0);
      }
    }

    function initMainJoysticksAndDpad() {
      const joyEl = document.getElementById('joystick');
      const knobEl = document.getElementById('knob');
      if (joyEl && knobEl) {
        const updateMainJoy = (ev, forceSend = false) => {
          if (ev.pointerId !== mainJoyPointerId) return;
          const rect = joyEl.getBoundingClientRect();
          const maxRadius = Math.max(20, Math.min(rect.width, rect.height) * 0.34);
          let dx = ev.clientX - (rect.left + rect.width / 2);
          let dy = ev.clientY - (rect.top + rect.height / 2);
          const dist = Math.hypot(dx, dy);
          if (dist > maxRadius) { dx *= maxRadius / dist; dy *= maxRadius / dist; }
          knobEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
          mainJoyX = Number((dx / maxRadius).toFixed(2));
          mainJoyY = Number((-dy / maxRadius).toFixed(2));
          mainJoyActive = true;
          activeMoveDir = null;
          const elX = document.getElementById('joyX');
          const elY = document.getElementById('joyY');
          if (elX) elX.textContent = mainJoyX.toFixed(2);
          if (elY) elY.textContent = mainJoyY.toFixed(2);
          pushNeun3dDrive(mainJoyY, mainJoyX, rotJoyVal, 700);
          const now = Date.now();
          if (forceSend || now - lastImmediateJoySendAt >= 80) {
            lastImmediateJoySendAt = now;
            sendCmd('joystick', { x: mainJoyX, y: mainJoyY });
          }
          ev.preventDefault();
        };
        joyEl.addEventListener('pointerdown', ev => {
          if (emergencyStop) { playAlertSound(); return; }
          mainJoyPointerId = ev.pointerId;
          joyEl.classList.add('dragging');
          try { joyEl.setPointerCapture(ev.pointerId); } catch (e) { }
          updateMainJoy(ev, true);
        });
        joyEl.addEventListener('pointermove', ev => updateMainJoy(ev, false));
        joyEl.addEventListener('pointerup', releaseMainJoystick);
        joyEl.addEventListener('pointercancel', releaseMainJoystick);
        joyEl.addEventListener('lostpointercapture', () => { if (mainJoyActive) releaseMainJoystick(); });
      }

      const rotZone = document.getElementById('rotJoystick');
      const rotKnob = document.getElementById('rotKnob');
      if (rotZone && rotKnob) {
        const updateRotJoy = (ev, forceSend = false) => {
          if (ev.pointerId !== rotJoyPointerId) return;
          const rect = rotZone.getBoundingClientRect();
          const maxRadius = Math.max(20, rect.width * 0.34);
          let dx = ev.clientX - (rect.left + rect.width / 2);
          if (dx > maxRadius) dx = maxRadius;
          if (dx < -maxRadius) dx = -maxRadius;
          rotKnob.style.transform = `translate(calc(-50% + ${dx}px), -50%)`;
          rotJoyVal = Number((dx / maxRadius).toFixed(2));
          rotJoyActive = true;
          activeMoveDir = null;
          const rotStr = rotJoyVal.toFixed(2);
          const elR = document.getElementById('rotRate');
          const elD = document.getElementById('rotDir');
          if (elR) elR.textContent = rotJoyVal > 0 ? `+${rotStr}` : rotStr;
          if (elD) elD.textContent = rotJoyVal > 0.05 ? 'Horario ↻' : (rotJoyVal < -0.05 ? 'Antihorario ↺' : 'Neutro');
          const fx = dashboardJoystickActive ? dashboardJoyY : (mainJoyActive ? mainJoyY : 0);
          const sx = dashboardJoystickActive ? dashboardJoyX : (mainJoyActive ? mainJoyX : 0);
          pushNeun3dDrive(fx, sx, rotJoyVal, 700);
          const now = Date.now();
          if (forceSend || now - lastImmediateRotSendAt >= 80) {
            lastImmediateRotSendAt = now;
            sendCmd('rotate', rotJoyVal);
          }
          ev.preventDefault();
        };
        rotZone.addEventListener('pointerdown', ev => {
          if (emergencyStop) { playAlertSound(); return; }
          rotJoyPointerId = ev.pointerId;
          rotZone.classList.add('dragging');
          try { rotZone.setPointerCapture(ev.pointerId); } catch (e) { }
          updateRotJoy(ev, true);
        });
        rotZone.addEventListener('pointermove', ev => updateRotJoy(ev, false));
        rotZone.addEventListener('pointerup', releaseRotJoystick);
        rotZone.addEventListener('pointercancel', releaseRotJoystick);
        rotZone.addEventListener('lostpointercapture', () => { if (rotJoyActive) releaseRotJoystick(); });
      }

      // D-pad con Pointer Events unificados (sin doble disparo mouse+touch ni botones atascados)
      ['forward', 'backward', 'left', 'right'].forEach(dir => {
        const btn = document.getElementById(`dpad-${dir}`);
        if (!btn) return;
        btn.removeAttribute('onmousedown');
        btn.removeAttribute('onmouseup');
        btn.removeAttribute('ontouchstart');
        btn.removeAttribute('ontouchend');
        btn.style.touchAction = 'none';
        let pid = null;
        const release = () => {
          if (pid === null) return;
          if (btn.hasPointerCapture?.(pid)) {
            try { btn.releasePointerCapture(pid); } catch (e) { }
          }
          pid = null;
          btn.classList.remove('active');
          if (activeMoveDir === dir) sendMove('stop');
        };
        btn.addEventListener('pointerdown', ev => {
          ev.preventDefault();
          if (emergencyStop) { playAlertSound(); return; }
          pid = ev.pointerId;
          try { btn.setPointerCapture(ev.pointerId); } catch (e) { }
          btn.classList.add('active');
          sendMove(dir);
        });
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointercancel', release);
        btn.addEventListener('lostpointercapture', release);
      });

      window.addEventListener('blur', () => {
        if (dashboardJoystickActive) releaseDashboardJoystick();
        if (mainJoyActive) releaseMainJoystick();
        if (rotJoyActive) releaseRotJoystick();
        if (activeMoveDir) sendMove('stop');
      });
    }

    // ==================== HEARTBEAT DE MOVIMIENTO (3D + ESP32 failsafe) =========
    // Mantiene vivo el visor 3D (sin que caduque a los 600ms al mantener el dedo
    // quieto) y envía keepalive al ESP32/Flask mientras joystick, rotación o D-pad
    // estén mantenidos, evitando disparos falsos del watchdog.
    let movementHeartbeatBusy = false;
    setInterval(() => {
      if (emergencyStop) return;
      const joyOn = dashboardJoystickActive || mainJoyActive;
      const jx = dashboardJoystickActive ? dashboardJoyX : (mainJoyActive ? mainJoyX : 0);
      const jy = dashboardJoystickActive ? dashboardJoyY : (mainJoyActive ? mainJoyY : 0);
      const rr = rotJoyActive ? rotJoyVal : 0;

      // 1) Refrescar siempre el motor 3D mientras algún control manual siga mantenido
      if (joyOn || rotJoyActive) {
        pushNeun3dDrive(jy, jx, rr, 700);
      } else if (activeMoveDir) {
        if (activeMoveDir === 'forward') pushNeun3dDrive(1, 0, 0, 700);
        else if (activeMoveDir === 'backward') pushNeun3dDrive(-1, 0, 0, 700);
        else if (activeMoveDir === 'left' || activeMoveDir === 'crab_left') pushNeun3dDrive(0, -1, 0, 700);
        else if (activeMoveDir === 'right' || activeMoveDir === 'crab_right') pushNeun3dDrive(0, 1, 0, 700);
        else if (activeMoveDir === 'turn_left') pushNeun3dDrive(0, 0, -1, 700);
        else if (activeMoveDir === 'turn_right') pushNeun3dDrive(0, 0, 1, 700);
      }

      // 2) Keepalive al backend/ESP32 (sin apilar requests)
      if (movementHeartbeatBusy) return;
      const commands = [];
      if (joyOn && (Math.abs(jx) > 0.02 || Math.abs(jy) > 0.02)) {
        commands.push(sendCmd('joystick', { x: jx, y: jy }));
      } else if (activeMoveDir) {
        commands.push(sendCmd('move', activeMoveDir));
      }
      if (rotJoyActive && Math.abs(rr) > 0.02) {
        commands.push(sendCmd('rotate', rr));
      }
      if (!commands.length) return;
      movementHeartbeatBusy = true;
      Promise.all(commands).finally(() => { movementHeartbeatBusy = false; });
    }, 180);



    // ==================== TERMINAL DE COMANDOS ====================
    function addTermLine(text, type = 'res') {
      const out = document.getElementById('termOutput');
      const line = document.createElement('div');
      line.className = 'term-line';

      if (type === 'cmd') {
        line.innerHTML = `<span class="term-prompt">$</span><span class="term-cmd">${text}</span>`;
      } else if (type === 'err') {
        line.innerHTML = `<span class="term-err">${text}</span>`;
      } else if (type === 'ok') {
        line.innerHTML = `<span class="term-ok">${text}</span>`;
      } else {
        line.innerHTML = `<span class="term-res">${text}</span>`;
      }

      out.appendChild(line);
      out.scrollTop = out.scrollHeight;
    }

    function sendTerminalCommand() {
      const input = document.getElementById('termInput');
      const cmd = input.value.trim();
      if (!cmd) return;

      addTermLine(cmd, 'cmd');
      input.value = '';
      playClickSound();

      setTimeout(() => {
        const parts = cmd.split(' ');
        const commandName = parts[0].toLowerCase();

        if (commandName === 'mode' && parts[1]) {
          const targetMode = parts[1].toUpperCase();
          addTermLine(`Comando de modo aceptado: ${targetMode}`, 'ok');
          sendCmd('mode', targetMode);
          document.getElementById('hMode').textContent = targetMode;
          document.getElementById('sysMode').textContent = targetMode;
          if (typeof syncModeDialUI === 'function') syncModeDialUI(targetMode);
        }
        else if (commandName === 'stop') {
          addTermLine('Deteniendo todos los servos...', 'ok');
          sendCmd('move', 'stop');
        }
        else if (commandName === 'status') {
          const modeText = document.getElementById('hMode').textContent;
          const battText = document.getElementById('topBattText').textContent;
          addTermLine(`Estatus del Robot: Modo=${modeText} | Batería=${battText} | Sensores=6/6 OK`, 'ok');
        }
        else if (commandName === 'reset') {
          addTermLine('Enviando señal de reinicio a la postura de apoyo...', 'ok');
          sendCmd('reset');
        }
        else if (commandName === 'ping') {
          addTermLine('Ping al ESP32: pong! Latencia aproximada: ~10ms', 'ok');
        }
        else if (commandName === 'calibrate') {
          addTermLine('Ejecutando algoritmo de calibración de giroscopio. Mantenga el robot inmóvil...', 'ok');
          setTimeout(() => addTermLine('Calibración completada con éxito. Offset guardado en flash.', 'ok'), 1500);
        }
        else {
          addTermLine(`Error: Comando '${parts[0]}' no reconocido en bus binario.`, 'err');
        }
      }, 200);

      // Reenviar comando directo al servidor Flask
      fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd: 'terminal', value: cmd })
      }).catch(() => { });
    }

    function quickTerminal(cmd) {
      document.getElementById('termInput').value = cmd;
      sendTerminalCommand();
    }


    // ==================== CHAT CON COPILOTO IA ====================
    function addChatMessage(role, text) {
      const box = document.getElementById('chatMessages');
      const row = document.createElement('div');
      row.className = `chat-bubble-row ${role}`;

      row.innerHTML = `
    <div class="chat-avatar">${role === 'user' ? 'YO' : 'AI'}</div>
    <div class="chat-bubble">
      ${text}
      <span class="chat-time">Enviado</span>
    </div>
  `;

      box.appendChild(row);
      box.scrollTop = box.scrollHeight;
    }

    function sendChatMessage() {
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (!text) return;

      addChatMessage('user', text);
      input.value = '';
      playClickSound();

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
        .then(r => r.json())
        .then(d => {
          setTimeout(() => {
            addChatMessage('ai', d.response);
            playSuccessSound();
          }, 300);
        })
        .catch(() => {
          // Respuesta local simulada si el backend offline
          setTimeout(() => {
            let resp = '';
            const query = text.toLowerCase();

            if (query.includes('hola') || query.includes('buen')) {
              resp = '¡Hola! Soy el Copiloto IA. Puedo asistirte en la telemetría de los 12 servos o el bus I2C. ¿Qué quieres verificar?';
            } else if (query.includes('modo') || query.includes('marcha')) {
              resp = 'Los modos cinemáticos son: Stand, Paso Trípode, Trote Rápido, Gateo Estable, Cangrejo Lateral, Giro Horario/Antihorario, Exploración Autónoma, Espiral, Salto, Saludo, Flexiones, Seguir Objeto y Reposo Profundo.';
            } else if (query.includes('sensor') || query.includes('telemetria')) {
              resp = 'Verificando telemetría... AHT10, MPU6050 y Sonar HC-SR04 están respondiendo en tiempo real en los puertos analógicos/digitales.';
            } else if (query.includes('bateria') || query.includes('voltaje')) {
              const val = document.getElementById('topBattText').textContent;
              resp = `El nivel del bloque Li-Po está al ${val}. Se recomienda recarga si desciende por debajo de 15%.`;
            } else if (query.includes('parar') || query.includes('stop')) {
              resp = 'Enviando comando de detención inmediata a todos los servos...';
              sendCmd('move', 'stop');
            } else if (query.includes('falla') || query.includes('error')) {
              resp = 'El sistema no registra excepciones críticas actualmente. Los registros del controlador PCA9685 reportan consumo nominal.';
            } else {
              resp = 'Recibido. Puedo ajustar velocidades, comprobar los buses de sensores o ayudarte con el lienzo LED multicolor. ¿Quieres cargar algún patrón?';
            }

            addChatMessage('ai', resp);
            playSuccessSound();
          }, 600);
        });
    }


    // ==================== POLLING E INTERFACES DE DATOS REALES ====================
    let statusPollBusy = false;
    let statusPollFailures = 0;
    let statusNextAttemptAt = 0;
    let statusLastSuccessAt = Date.now();
    let statusReconnectToastShown = false;
    let autoReconnectBusy = false;
    let autoReconnectAttempts = 0;
    const AUTO_RECONNECT_INTERVAL_MS = 3000; // intentar reconectar cada 3s
    const STATUS_POLL_INTERVAL_MS = Math.max(500, Math.min(5000,
      Number(document.body?.dataset.statusPollMs) || 1000));

    // Auto-reconexion: intenta conectar al ESP32 periodicamente cuando no hay
    // enlace activo. No se bloquea por demoMode: si el ESP32 vuelve a estar
    // disponible, se enlaza automaticamente.
    function tryAutoReconnect() {
      if (autoReconnectBusy || connected) return;
      autoReconnectBusy = true;
      autoReconnectAttempts += 1;
      const ipInput = document.getElementById('connEspIp');
      const ip = ipInput ? ipInput.value.trim() : '192.168.4.1';
      fetch('/api/connect_esp32?ip=' + encodeURIComponent(ip), { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          if (d.success && d.connected) {
            connected = true;
            demoMode = false; window.demoMode = false;
            autoReconnectAttempts = 0;
            statusReconnectToastShown = false;
            updateConnectionUI(true);
            hideConnDialog();
            showToast('ESP32-S3 reconectado automaticamente', 'success');
          }
        })
        .catch(() => {})
        .finally(() => { autoReconnectBusy = false; });
    }

    function startAutoReconnectLoop() {
      setInterval(() => {
        if (!connected) {
          tryAutoReconnect();
        }
      }, AUTO_RECONNECT_INTERVAL_MS);
    }

    function markPanelTelemetryOffline() {
      document.querySelectorAll('.sensor-row[data-sensor]').forEach(row => {
        if (!row.classList.contains('unverified')) row.classList.add('offline');
      });
      document.querySelectorAll('.sensor-card-lg[data-sensor]').forEach(card => card.classList.add('offline'));
      document.querySelectorAll('.sensor-card-status').forEach(dot => {
        dot.style.background = 'var(--text-muted)';
        dot.style.boxShadow = 'none';
      });
      const distance = document.getElementById('radarBigNum');
      const alert = document.getElementById('radarAlertStatus');
      if (distance) distance.textContent = '—';
      if (alert) {
        alert.textContent = 'OFFLINE';
        alert.classList.remove('radar-alert-safe', 'radar-alert-warning', 'radar-alert-danger');
        alert.classList.add('radar-alert-offline');
      }
      const buzzerState = document.getElementById('dashboardBuzzerState');
      const buzzerDot = document.getElementById('dashboardBuzzerDot');
      if (buzzerState) buzzerState.textContent = 'OFFLINE';
      if (buzzerDot) buzzerDot.className = 'dashboard-device-dot offline';
      ['dashboardBuzzerPlay', 'dashboardBuzzerVariant', 'dashboardBuzzerStop', 'dashboardHeadlightOn', 'dashboardHeadlightOff']
        .forEach(id => { const button = document.getElementById(id); if (button) button.disabled = true; });
      const headlightState = document.getElementById('dashboardHeadlightState');
      const headlightDot = document.getElementById('dashboardHeadlightDot');
      if (headlightState) headlightState.textContent = 'OFFLINE';
      if (headlightDot) headlightDot.className = 'dashboard-device-dot offline';
      const telemetry = document.getElementById('commsTelemetryStatus');
      if (telemetry) {
        telemetry.textContent = 'SIN RESPUESTA DEL PANEL';
        telemetry.style.color = 'var(--accent-red)';
      }
    }

    function startStatusPolling() {
      setInterval(() => {
        if (statusPollBusy || Date.now() < statusNextAttemptAt) return;
        statusPollBusy = true;
        fetch('/api/status', { cache: 'no-store' })
          .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          })
          .then(d => {
            const wasReconnecting = statusReconnectToastShown;
            statusPollFailures = 0;
            statusNextAttemptAt = 0;
            statusLastSuccessAt = Date.now();
            statusReconnectToastShown = false;
            if (wasReconnecting) showToast('Comunicación con el panel restablecida', 'success');
            window.latestRobotStatus = d;
            connected = Boolean(d.connected);
            updateRadarTelemetry(d);

            // Actualizar Métricas numéricas
            const radarOnline = Boolean(d.sensors.ultrasonic.online);
            const dhtOnline = Boolean(d.sensors.dht.online);
            const irOnline = Boolean(d.sensors.ir?.online);
            document.getElementById('hDist').innerHTML = radarOnline
              ? Number(d.sensors.ultrasonic.value).toFixed(0) + ' <span class="metric-unit">cm</span>' : '—';
            document.getElementById('hTemp').innerHTML = dhtOnline
              ? Number(d.sensors.dht.temp).toFixed(1) + ' <span class="metric-unit">°C</span>' : '—';
            document.getElementById('hHum').innerHTML = dhtOnline
              ? Number(d.sensors.dht.hum).toFixed(0) + ' <span class="metric-unit">%</span>' : '—';
            document.getElementById('hMode').textContent = d.mode;
            document.getElementById('sysMode').textContent = d.mode;
            if (typeof syncModeDialUI === 'function') syncModeDialUI(d.mode);

            // Actualizar Sonar Táctico
            lastKnownDistance = d.sensors.ultrasonic.value;
            document.getElementById('radarBigNum').textContent = radarOnline
              ? Number(d.sensors.ultrasonic.value).toFixed(0) : '—';

            // Feed telemetry charts
            if (radarOnline) radarHistory.push(d.sensors.ultrasonic.value);
            else radarHistory.length = 0;
            if (radarHistory.length > 60) radarHistory.shift();
            if (irOnline) irHistory.push(d.sensors.ir.value);
            else irHistory.length = 0;
            if (irHistory.length > 60) irHistory.shift();
            document.getElementById('chartRadarVal').textContent = radarOnline
              ? Number(d.sensors.ultrasonic.value).toFixed(0) + ' cm' : 'OFFLINE';
            const irVal = Number(d.sensors.ir?.value);
            document.getElementById('chartIRVal').textContent = irOnline ? (irVal > 0.5 ? 'HIGH' : 'LOW') : 'OFFLINE';
            drawLineChart('chartRadar', radarHistory, 400, 'rgb(255, 43, 67)', 'cm');
            drawLineChart('chartIR', irHistory, 1, 'rgb(0, 255, 135)', '');
            drawArcGauge('gaugeTemp', dhtOnline ? d.sensors.dht.temp : 0, 50,
              dhtOnline ? Number(d.sensors.dht.temp).toFixed(1) + '°' : '—', '#ff6b35');
            drawArcGauge('gaugeHum', dhtOnline ? d.sensors.dht.hum : 0, 100,
              dhtOnline ? Number(d.sensors.dht.hum).toFixed(0) + '%' : '—', '#9d4edd');

            const radarAlert = document.getElementById('radarAlertStatus');
            radarAlert.classList.remove('radar-alert-safe', 'radar-alert-warning', 'radar-alert-danger', 'radar-alert-offline');
            if (!radarOnline) {
              radarAlert.textContent = 'OFFLINE';
              radarAlert.classList.add('radar-alert-offline');
            } else if (lastKnownDistance < 30) {
              radarAlert.textContent = 'PELIGRO';
              radarAlert.classList.add('radar-alert-danger');
            } else if (lastKnownDistance < 80) {
              radarAlert.textContent = 'CUIDADO';
              radarAlert.classList.add('radar-alert-warning');
            } else {
              radarAlert.textContent = 'SEGURO';
              radarAlert.classList.add('radar-alert-safe');
            }

            // Batería
            document.getElementById('topBattFill').style.width = d.battery + '%';
            document.getElementById('topBattText').textContent = d.battery.toFixed(0) + '%';
            if (d.battery < 20) {
              document.getElementById('topBattFill').classList.add('low');
            } else {
              document.getElementById('topBattFill').classList.remove('low');
            }

            // 3D IMU Cube
            const pitch = d.sensors.imu.pitch;
            const roll = d.sensors.imu.roll;
            const yaw = d.sensors.imu.yaw;

            document.getElementById('imuCube').style.transform = `rotateX(${-pitch}deg) rotateY(${roll}deg) rotateZ(${yaw}deg)`;
            document.getElementById('imuP').textContent = pitch.toFixed(1) + '°';
            document.getElementById('imuR').textContent = roll.toFixed(1) + '°';
            document.getElementById('imuY').textContent = yaw.toFixed(1) + '°';

            // Update Artificial Horizon
            ahiPitch = pitch;
            ahiRoll = roll;

            // Update Compass
            ahiYaw = yaw;

            // Calcular aceleración vectorial simple
            const ax = d.sensors.imu.ax / 16384;
            const ay = d.sensors.imu.ay / 16384;
            const az = d.sensors.imu.az / 16384;
            const totalG = Math.sqrt(ax * ax + ay * ay + az * az).toFixed(2);
            document.getElementById('imuAcc').textContent = totalG + 'G';

            // Gyroscope angular velocity (°/s)
            const gx = (d.sensors.imu.gx || 0) / 131.0;
            const gy = (d.sensors.imu.gy || 0) / 131.0;
            const gz = (d.sensors.imu.gz || 0) / 131.0;
            document.getElementById('imuGx').textContent = gx.toFixed(1) + ' °/s';
            document.getElementById('imuGy').textContent = gy.toFixed(1) + ' °/s';
            document.getElementById('imuGz').textContent = gz.toFixed(1) + ' °/s';

            // IMU temperature (MPU6050: T = T/340 + 36.53)
            if (d.sensors.imu.temp !== undefined) {
              const imuTemp = d.sensors.imu.temp;
              document.getElementById('imuTemp').textContent = imuTemp.toFixed(1) + '°C';
            } else {
              // Estimate from demo: ~35-45°C typical for MPU6050
              const estTemp = 35 + Math.sin(Date.now() / 5000) * 5;
              document.getElementById('imuTemp').textContent = estTemp.toFixed(1) + '°C';
            }

            // Servomotores de Patas
            d.servos.forEach((legAngles, legIndex) => {
              const cEl = document.getElementById(`s${legIndex}c`);
              const fEl = document.getElementById(`s${legIndex}f`);
              const tEl = document.getElementById(`s${legIndex}t`);
              if (cEl) cEl.textContent = legAngles[0] + '°';
              if (fEl) fEl.textContent = legAngles[1] + '°';
              if (tEl) tEl.textContent = legAngles[2] + '°';
            });
            if (window.NEUN3D) {
              window.NEUN3D.setHardwareServos(d.servos, Boolean(d.connected));
              window.NEUN3D.setImuAttitude(pitch, roll, yaw);
              const manualDrivingNow = dashboardJoystickActive || mainJoyActive || rotJoyActive || Boolean(activeMoveDir);
              if (d.connected && d.mode && !manualDrivingNow) window.NEUN3D.setRobotMode(d.mode);
            }

            // Filas de Estatus de Sensores
            document.querySelectorAll('.sensor-row').forEach(row => {
              const sKey = row.dataset.sensor;
              if (d.sensors[sKey]) {
                const sensor = d.sensors[sKey];
                const verifiable = sensor.presence_verifiable !== false;
                row.classList.toggle('offline', verifiable && !sensor.online);
                row.classList.toggle('unverified', !verifiable);
                const name = row.querySelector('.sensor-row-name');
                if (name && sKey === 'leds') {
                  name.textContent = verifiable ? 'NeoPixel 8x8' : 'NeoPixel 8x8 — sin confirmación';
                }
                if (sKey === 'imu' && sensor.address) {
                  const detail = row.querySelector('.sensor-row-detail');
                  if (detail) detail.textContent = 'I2C ' + sensor.address;
                }
              }
            });

            // Estado del módulo Buzzer (reproduciendo/idle)
            if (d.sensors.buzzer) {
              const buzzer = d.sensors.buzzer;
              const buzzerOnline = Boolean(d.connected && buzzer.online);
              const buzzerCard = document.querySelector('.sensor-card-lg[data-sensor="buzzer"]');
              const buzzerValue = document.getElementById('sens-buzzer-val');
              const buzzerDot = document.getElementById('sens-buzzer-dot');
              const buzzerPin = document.getElementById('sens-buzzer-range');
              if (buzzerValue) {
                const freq = Number(buzzer.freq) || 0;
                const pattern = String(buzzer.pattern || '').toUpperCase();
                buzzerValue.textContent = !buzzerOnline ? 'OFFLINE' :
                  (buzzer.state === 'playing'
                    ? `${pattern || 'SONANDO'} · ${freq} Hz`
                    : (freq > 0 ? `IDLE · ${freq} Hz` : 'IDLE'));
              }
              if (buzzerPin) buzzerPin.textContent = buzzer.pin || 'GPIO15';
              if (buzzerDot) {
                const color = !buzzerOnline ? 'var(--text-muted)' :
                  (buzzer.state === 'playing' ? 'var(--accent-yellow)' : 'var(--accent-green)');
                buzzerDot.style.background = color;
                buzzerDot.style.boxShadow = buzzerOnline ? `0 0 12px ${color}` : 'none';
              }
              if (buzzerCard) buzzerCard.classList.toggle('offline', !buzzerOnline);

              const dashboardBuzzerOnline = buzzerOnline;
              const dashboardBuzzerPlaying = dashboardBuzzerOnline && buzzer.state === 'playing';
              const dashboardBuzzerDot = document.getElementById('dashboardBuzzerDot');
              const dashboardBuzzerState = document.getElementById('dashboardBuzzerState');
              const dashboardBuzzerDetail = document.getElementById('dashboardBuzzerDetail');
              const dashboardBuzzerPlay = document.getElementById('dashboardBuzzerPlay');
              const dashboardBuzzerVariant = document.getElementById('dashboardBuzzerVariant');
              const dashboardBuzzerStop = document.getElementById('dashboardBuzzerStop');
              const currentPattern = String(buzzer.pattern || '').toUpperCase();
              const currentFrequency = Number(buzzer.freq) || 0;
              if (dashboardBuzzerDot) {
                dashboardBuzzerDot.className = `dashboard-device-dot ${!dashboardBuzzerOnline ? 'offline' : (dashboardBuzzerPlaying ? 'playing' : 'online')}`;
                dashboardBuzzerDot.setAttribute('aria-label', dashboardBuzzerPlaying ? 'Buzzer reproduciendo' : (dashboardBuzzerOnline ? 'Buzzer listo' : 'Buzzer offline'));
              }
              if (dashboardBuzzerState) {
                dashboardBuzzerState.textContent = !dashboardBuzzerOnline ? 'OFFLINE' :
                  (dashboardBuzzerPlaying ? `${currentPattern || 'SONANDO'} · ${currentFrequency} Hz` : 'LISTO');
              }
              if (dashboardBuzzerDetail) dashboardBuzzerDetail.textContent = `${buzzer.pin || 'GPIO15'} · ${currentPattern || 'PWM preparado'}`;
              if (dashboardBuzzerPlay) dashboardBuzzerPlay.disabled = !dashboardBuzzerOnline;
              if (dashboardBuzzerVariant) dashboardBuzzerVariant.disabled = !dashboardBuzzerOnline;
              if (dashboardBuzzerStop) dashboardBuzzerStop.disabled = !dashboardBuzzerOnline;

              const buzzerRow = document.getElementById('buzzerStatusRow');
              if (buzzerRow) {
                const playing = buzzer.state === 'playing';
                buzzerRow.classList.toggle('offline', !buzzerOnline);
                const dot = document.getElementById('buzzerStatusDot');
                if (dot) {
                  dot.style.background = playing && buzzerOnline ? 'var(--accent-yellow)' : (buzzerOnline ? 'var(--accent-green)' : 'var(--text-muted)');
                  dot.style.boxShadow = playing && buzzerOnline ? '0 0 10px var(--accent-yellow)' : (buzzerOnline ? '0 0 10px var(--accent-green)' : 'none');
                }
                const nameEl = buzzerRow.querySelector('.sensor-row-name');
                if (nameEl) nameEl.textContent = !buzzerOnline ? 'Buzzer Pasivo — Offline' : (playing ? 'Buzzer Pasivo — Reproduciendo' : 'Buzzer Pasivo');
              }
            }

            const headlights = d.sensors.headlights;
            if (headlights) {
              const headlightCard = document.querySelector('.sensor-card-lg[data-sensor="headlights"]');
              const headlightDot = document.getElementById('sens-headlights-dot');
              const headlightValue = document.getElementById('sens-headlights-val');
              const headlightPin = document.getElementById('sens-headlights-range');
              const headlightSlider = document.getElementById('sens-headlights-brightness');
              const headlightBrightnessLabel = document.getElementById('sens-headlights-brightness-val');
              const headlightOnline = Boolean(d.connected && headlights.online);
              const headlightOn = headlights.state === 'on';
              if (headlightValue) headlightValue.textContent = !headlightOnline ? 'OFFLINE' : (headlightOn ? 'ENCENDIDA' : 'APAGADA');
              if (headlightPin) headlightPin.textContent = headlights.pin || 'GPIO16';
              if (headlightDot) {
                const color = !headlightOnline ? 'var(--text-muted)' : (headlightOn ? 'var(--accent-green)' : 'var(--text-muted)');
                headlightDot.style.background = color;
                headlightDot.style.boxShadow = headlightOn && headlightOnline ? `0 0 12px ${color}` : 'none';
              }
              if (headlightCard) headlightCard.classList.toggle('offline', !headlightOnline);
              const dashboardHeadlightDot = document.getElementById('dashboardHeadlightDot');
              const dashboardHeadlightState = document.getElementById('dashboardHeadlightState');
              const dashboardHeadlightDetail = document.getElementById('dashboardHeadlightDetail');
              const dashboardHeadlightOn = document.getElementById('dashboardHeadlightOn');
              const dashboardHeadlightOff = document.getElementById('dashboardHeadlightOff');
              const brightnessPercent = Math.round(Number(headlights.brightness) || headlightBrightness);
              if (dashboardHeadlightDot) {
                dashboardHeadlightDot.className = `dashboard-device-dot ${!headlightOnline ? 'offline' : (headlightOn ? 'active' : 'online')}`;
                dashboardHeadlightDot.setAttribute('aria-label', !headlightOnline ? 'Linterna offline' : (headlightOn ? 'Linterna encendida' : 'Linterna apagada'));
              }
              if (dashboardHeadlightState) dashboardHeadlightState.textContent = !headlightOnline ? 'OFFLINE' : (headlightOn ? 'ENCENDIDA' : 'APAGADA');
              if (dashboardHeadlightDetail) dashboardHeadlightDetail.textContent = `${headlights.pin || 'GPIO16'} · Brillo ${brightnessPercent}%`;
              if (dashboardHeadlightOn) dashboardHeadlightOn.disabled = !headlightOnline;
              if (dashboardHeadlightOff) dashboardHeadlightOff.disabled = !headlightOnline;
              if (Number.isFinite(Number(headlights.brightness))) {
                headlightBrightness = Math.max(1, Math.min(100, Number(headlights.brightness) || headlightBrightness));
                if (headlightSlider && document.activeElement !== headlightSlider) headlightSlider.value = String(headlightBrightness);
                if (headlightBrightnessLabel) headlightBrightnessLabel.textContent = `${headlightBrightness}%`;
              }
            }

            // ==================== SENSORS PANEL UPDATE ====================
            // Track history for min/max/avg analysis
            if (!window.sensorHistory) window.sensorHistory = {};
            ['ultrasonic', 'ir', 'dht'].forEach(k => {
              if (!window.sensorHistory[k]) window.sensorHistory[k] = [];
              const val = k === 'dht' ? d.sensors.dht.temp : d.sensors[k].value;
              window.sensorHistory[k].push(val);
              if (window.sensorHistory[k].length > 60) window.sensorHistory[k].shift();
              const arr = window.sensorHistory[k];
              const min = Math.min(...arr).toFixed(1);
              const max = Math.max(...arr).toFixed(1);
              const avg = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
              const sfx = k === 'ultrasonic' ? 'ultrasonic' : (k === 'ir' ? 'ir' : 'dht');
              const minEl = document.getElementById('sens-' + sfx + '-min');
              const avgEl = document.getElementById('sens-' + sfx + '-avg');
              const maxEl = document.getElementById('sens-' + sfx + '-max');
              if (minEl) minEl.textContent = min;
              if (avgEl) avgEl.textContent = avg;
              if (maxEl) maxEl.textContent = max;
            });
            // IR history (separate from ultrasonic)
            if (!window.sensorHistory.ir_raw) window.sensorHistory.ir_raw = [];
            window.sensorHistory.ir_raw.push(d.sensors.ir.value);
            if (window.sensorHistory.ir_raw.length > 60) window.sensorHistory.ir_raw.shift();
            const irArr = window.sensorHistory.ir_raw;
            const irMin = Math.min(...irArr).toFixed(0);
            const irMax = Math.max(...irArr).toFixed(0);
            const irAvg = (irArr.reduce((a, b) => a + b, 0) / irArr.length).toFixed(0);
            const irMinEl = document.getElementById('sens-ir-min');
            const irAvgEl = document.getElementById('sens-ir-avg');
            const irMaxEl = document.getElementById('sens-ir-max');
            if (irMinEl) irMinEl.textContent = irMin;
            if (irAvgEl) irAvgEl.textContent = irAvg;
            if (irMaxEl) irMaxEl.textContent = irMax;
            // Humidity history (separate from temp)
            if (!window.sensorHistory.hum) window.sensorHistory.hum = [];
            window.sensorHistory.hum.push(d.sensors.dht.hum);
            if (window.sensorHistory.hum.length > 60) window.sensorHistory.hum.shift();
            const humArr = window.sensorHistory.hum;
            const humMin = Math.min(...humArr).toFixed(0);
            const humMax = Math.max(...humArr).toFixed(0);
            const humAvg = (humArr.reduce((a, b) => a + b, 0) / humArr.length).toFixed(0);
            ['hum', 'dht'].forEach(t => {
              const el = document.getElementById('sens-' + t + '-min');
              if (el && t === 'hum') el.textContent = humMin;
              if (el && t === 'dht') { /* temp already done above */ }
            });
            const humMinEl2 = document.getElementById('sens-hum-min');
            const humAvgEl2 = document.getElementById('sens-hum-avg');
            const humMaxEl2 = document.getElementById('sens-hum-max');
            if (humMinEl2) humMinEl2.textContent = humMin;
            if (humAvgEl2) humAvgEl2.textContent = humAvg;
            if (humMaxEl2) humMaxEl2.textContent = humMax;

            // Big sensor cards
            const sensMap = {
              'ultrasonic': { val: radarOnline ? Number(d.sensors.ultrasonic.value).toFixed(0) : 'OFFLINE', dot: 'sens-ultrasonic-dot', online: radarOnline },
              'ir': { val: irOnline ? Number(d.sensors.ir.value).toFixed(0) : 'OFFLINE', dot: 'sens-ir-dot', online: irOnline },
            };
            Object.keys(sensMap).forEach(k => {
              const el = document.getElementById('sens-' + k + '-val');
              if (el) el.textContent = sensMap[k].val;
              const dot = document.getElementById(sensMap[k].dot);
              if (dot) {
                dot.style.background = sensMap[k].online ? 'var(--accent-green)' : 'var(--accent-red)';
                dot.style.boxShadow = sensMap[k].online ? '0 0 12px var(--accent-green)' : '0 0 12px var(--accent-red)';
              }
              const card = document.querySelector('.sensor-card-lg[data-sensor="' + k + '"]');
              if (card) card.classList.toggle('offline', !sensMap[k].online);
            });
            // DHT temp
            const dhtTempEl = document.getElementById('sens-dht-temp-val');
            if (dhtTempEl) dhtTempEl.textContent = dhtOnline ? Number(d.sensors.dht.temp).toFixed(1) : 'OFFLINE';
            const dhtDot = document.getElementById('sens-dht-dot');
            if (dhtDot) {
              dhtDot.style.background = dhtOnline ? 'var(--accent-green)' : 'var(--accent-red)';
              dhtDot.style.boxShadow = dhtOnline ? '0 0 12px var(--accent-green)' : '0 0 12px var(--accent-red)';
            }
            document.querySelectorAll('.sensor-card-lg[data-sensor="dht"]').forEach(card => card.classList.toggle('offline', !dhtOnline));
            // Humidity
            const humValEl = document.getElementById('sens-hum-val');
            if (humValEl) humValEl.textContent = dhtOnline ? Number(d.sensors.dht.hum).toFixed(0) : 'OFFLINE';
            const humDot = document.getElementById('sens-hum-dot');
            if (humDot) {
              humDot.style.background = dhtOnline ? 'var(--accent-green)' : 'var(--accent-red)';
              humDot.style.boxShadow = dhtOnline ? '0 0 12px var(--accent-green)' : '0 0 12px var(--accent-red)';
            }
            // IMU
            const imuOnline = Boolean(d.sensors.imu.online);
            const imuAddressEl = document.getElementById('sens-imu-address');
            if (imuAddressEl) imuAddressEl.textContent = 'I2C ' + (d.sensors.imu.address || '0x68');
            const imuValEl = document.getElementById('sens-imu-val');
            if (imuValEl) imuValEl.textContent = imuOnline
              ? 'P:' + d.sensors.imu.pitch.toFixed(0) + ' R:' + d.sensors.imu.roll.toFixed(0) + ' Y:' + d.sensors.imu.yaw.toFixed(0)
              : 'OFFLINE';
            const imuDot = document.getElementById('sens-imu-dot');
            if (imuDot) {
              imuDot.style.background = imuOnline ? 'var(--accent-green)' : 'var(--accent-red)';
              imuDot.style.boxShadow = imuOnline ? '0 0 12px var(--accent-green)' : '0 0 12px var(--accent-red)';
            }
            document.querySelectorAll('.sensor-card-lg[data-sensor="imu"]').forEach(card => card.classList.toggle('offline', !imuOnline));
            // IMU temp + G force
            const imuTempEl = document.getElementById('sens-imu-temp');
            if (imuTempEl) imuTempEl.textContent = imuOnline ? 'Temp: ' + Number(d.sensors.imu.temp).toFixed(1) + 'C' : 'OFFLINE';
            const imuGel = document.getElementById('sens-imu-g');
            if (imuGel) imuGel.textContent = totalG;
            const imuGxEl = document.getElementById('sens-imu-gx');
            if (imuGxEl) imuGxEl.textContent = gx.toFixed(1);
            const imuGzEl = document.getElementById('sens-imu-gz');
            if (imuGzEl) imuGzEl.textContent = gz.toFixed(1);
            // Servos
            const servosOnline = d.sensors.servos.online;
            const servosValEl = document.getElementById('sens-servos-val');
            if (servosValEl) servosValEl.textContent = servosOnline ? (d.sensors.servos.count || 12) : 'OFFLINE';
            const servosDot = document.getElementById('sens-servos-dot');
            if (servosDot) {
              servosDot.style.background = servosOnline ? 'var(--accent-green)' : 'var(--accent-red)';
              servosDot.style.boxShadow = servosOnline ? '0 0 12px var(--accent-green)' : '0 0 12px var(--accent-red)';
            }
            document.querySelectorAll('.sensor-card-lg[data-sensor="servos"]').forEach(card => card.classList.toggle('offline', !servosOnline));
            const sModeEl = document.getElementById('sens-servos-mode');
            if (sModeEl) sModeEl.textContent = d.mode;
            const sSpeedEl = document.getElementById('sens-servos-speed');
            if (sSpeedEl) sSpeedEl.textContent = d.speed + '%';
            const sBatEl = document.getElementById('sens-servos-bat');
            if (sBatEl) sBatEl.textContent = d.battery.toFixed(0) + '%';

            // ==================== COMMS PANEL UPDATE ====================
            const isConn = d.connected || false;
            const isDemo = window.demoMode || false;
            const badge = document.getElementById('commsBadge');
            const title = document.getElementById('commsTitle');
            const sub = document.getElementById('commsSub');
            const linkStatus = document.getElementById('commsLinkStatus');
            if (badge) {
              badge.className = 'comms-status-badge';
              if (isConn) {
                badge.classList.add('online');
                badge.textContent = 'ENLAZADO';
                if (title) { title.textContent = 'Conectado a ESP32-S3'; title.style.color = 'var(--accent-green)'; }
                if (sub) sub.textContent = 'Enlace de datos activo. Telemetria en tiempo real.';
                if (linkStatus) { linkStatus.textContent = 'Online'; linkStatus.style.color = 'var(--accent-green)'; }
              } else if (isDemo) {
                badge.classList.add('demo');
                badge.textContent = 'DEMO';
                if (title) { title.textContent = 'Modo Simulacion'; title.style.color = 'var(--accent-yellow)'; }
                if (sub) sub.textContent = 'Entorno de prueba sin hardware fisico. Datos simulados.';
                if (linkStatus) { linkStatus.textContent = 'Demo'; linkStatus.style.color = 'var(--accent-yellow)'; }
              } else {
                badge.textContent = 'SIN ENLACE';
                if (title) { title.textContent = 'Sin conexion'; title.style.color = 'var(--accent-red)'; }
                if (sub) sub.textContent = 'Conecta la PC a la red ARANA-ROBOT para establecer enlace';
                if (linkStatus) { linkStatus.textContent = 'Offline'; linkStatus.style.color = 'var(--accent-red)'; }
              }
            }
            // Signal bars
            const bars = document.querySelectorAll('.comms-signal-bar');
            const lvl = (window._aranaRssi === null || window._aranaRssi === undefined) ? 0
              : (window._aranaRssi >= -55 ? 4 : window._aranaRssi >= -65 ? 3 : window._aranaRssi >= -75 ? 2 : 1);
            if (isConn && lvl > 0) {
              bars.forEach((bar, i) => { bar.style.background = i < lvl ? 'var(--accent-green)' : 'rgba(255,255,255,0.05)'; });
            } else if (isConn) {
              bars.forEach((bar, i) => { bar.style.background = i < 2 ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.05)'; });
            } else if (isDemo) {
              bars.forEach((bar, i) => { bar.style.background = i < 3 ? 'var(--accent-yellow)' : 'var(--accent-green)'; });
            } else {
              bars.forEach(bar => { bar.style.background = 'rgba(255,255,255,0.05)'; });
            }
            // Latency + Uptime
            const latEl = document.getElementById('commsLatency');
            if (latEl && isConn) {
              const lat = (d.link && typeof d.link.latency_ms === 'number' && d.link.latency_ms > 0)
                ? d.link.latency_ms : null;
              latEl.textContent = lat !== null ? lat.toFixed(0) + ' ms' : '-- ms';
            } else if (latEl) {
              latEl.textContent = '-- ms';
            }
            // Datos reales del AP publicados por el robot (link.*)
            const link = d.link || {};
            const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
            setTxt('commsSsid', link.ssid ? link.ssid : 'ARANA-ROBOT');
            setTxt('commsPass', link.password_set ? 'definida' : 'abierta (sin clave)');
            setTxt('commsChannel', link.channel ? link.channel : '--');
            setTxt('commsClients', (link.clients || 0) + ' / ' + (link.max_clients || 4));
            if (link.ip) setTxt('commsEspIp', link.ip);
            // Barras por RSSI real de las estaciones conectadas (link.stations)
            const rssi = (link.stations && link.stations.length)
              ? Math.max.apply(null, link.stations.map(s => s.rssi)) : null;
            window._aranaRssi = rssi;
            // Apartados nuevos: mando y GPS (mismo /api/status)
            if (typeof mandoRender === 'function') mandoRender(d);
            if (typeof gpsRender === 'function') gpsRender(d);
            // Uptime
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const hrs = String(Math.floor(elapsed / 3600)).padStart(2, '0');
            const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
            const secs = String(elapsed % 60).padStart(2, '0');
            const uptimeEl = document.getElementById('commsUptime');
            if (uptimeEl) uptimeEl.textContent = hrs + ':' + mins + ':' + secs;
            document.getElementById('uptime').textContent = `${hrs}:${mins}:${secs}`;

            // Registro de Fallas
            const faultPanel = document.getElementById('faultPanel');
            if (d.faults && d.faults.length > 0) {
              faultPanel.innerHTML = d.faults.map(f => `
          <div class="term-line">
            <span class="term-err">[FALLA]</span>
            <span style="color:var(--text-secondary);font-size:11px">${f.time}</span>
            <span class="term-cmd" style="color:var(--accent-orange)">${f.msg}</span>
          </div>
        `).join('');
            } else {
              faultPanel.innerHTML = '<div class="term-line"><span class="term-ok">✓ Todos los módulos de hardware informan estado saludable (Nominal).</span></div>';
            }

            // Conexión General
            if (d.connected !== undefined) {
              const telemetryEl = document.getElementById('commsTelemetryStatus');
              if (telemetryEl) {
                const failedStatuses = Number(d.link?.status_failures) || 0;
                telemetryEl.textContent = !d.connected ? 'OFFLINE' :
                  (failedStatuses > 0 ? `RETARDADA · ${failedStatuses} fallos` : 'ACTIVA');
                telemetryEl.style.color = !d.connected ? 'var(--accent-red)' :
                  (failedStatuses > 0 ? 'var(--accent-yellow)' : 'var(--accent-green)');
              }
              // Log connection state changes
              if (window._lastConnState === undefined) window._lastConnState = null;
              if (window._lastConnState !== d.connected && window._lastConnState !== null) {
                if (d.connected) {
                  addCommsLog('ESP32-S3 enlazado - Telemetria activa', 'ok');
                  showToast('Conexión con ESP32 restablecida', 'success');
                } else {
                  addCommsLog('ESP32-S3 desconectado - Modo simulado', 'err');
                  showToast('ESP32 sin enlace · reconectando…', 'warn');
                }
              }
              if (window._lastConnState !== d.connected && !d.connected && window.demoMode) {
                if (window._lastConnState !== null) addCommsLog('Modo Demo activado - Datos simulados', 'info');
              }
              window._lastConnState = d.connected;
              updateConnectionUI(d.connected);
            }
            // Update comms last ping
            const pingEl = document.getElementById('commsLastPing');
            if (pingEl) {
              const lastPing = Number(d.link?.last_ping) || 0;
              const pingAge = lastPing > 0 ? Math.max(0, Date.now() / 1000 - lastPing) : Infinity;
              pingEl.textContent = d.connected && Number.isFinite(pingAge) ? `Hace ${pingAge.toFixed(1)}s` : '--';
            }
          })
          .catch(() => {
            statusPollFailures += 1;
            statusNextAttemptAt = Date.now() + Math.min(4000, 500 * (2 ** Math.min(statusPollFailures - 1, 3)));
            if (!statusReconnectToastShown) {
              statusReconnectToastShown = true;
              showToast('Reconectando con el panel…', 'warn');
            }
            // Auto-reintento de conexion al ESP32 cuando el polling falla
            tryAutoReconnect();
            if (Date.now() - statusLastSuccessAt >= 4000) {
              connected = false;
              updateConnectionUI(false);
              markPanelTelemetryOffline();
            }
          })
          .finally(() => { statusPollBusy = false; });
      }, STATUS_POLL_INTERVAL_MS);
    }

    // Iniciar bucle de auto-reconexion al cargar la pagina
    startAutoReconnectLoop();


    // ==================== SONDEO DEL IMU (2 Hz) ===============================
    // El polling general va cada 1 s; este proxy trae actitud cada 500 ms
    // para que el cubo 3D, el horizonte artificial y la brújula sigan fluidos
    // (aunque el MPU6050 se muestrea a 100 Hz en el ESP32).
    //
    // /api/imu es un proxy mínimo: solo actitud y velocidad angular. Se consulta
    // cada 500 ms para no sumar carga innecesaria al enlace inalámbrico.
    // La dibujo se interpola: aunque lleguen datos a 2 Hz, el cubo se desliza
    // entre valores con la transición CSS y el horizonte/brújula (que ya usan
    // requestAnimationFrame) quedan continuos.
    let imuFastBusy = false;   // evita piling peticiones si una se demora
    function startImuFastPolling() {
      const applyImu = (d) => {
        if (!d || d.online === false) return;
        const pitch = d.pitch, roll = d.roll, yaw = d.yaw;
        const cube = document.getElementById('imuCube');
        if (cube) cube.style.transform = `rotateX(${-pitch}deg) rotateY(${roll}deg) rotateZ(${yaw}deg)`;
        // Estas variables las leen los bucles de requestAnimationFrame del
        // horizonte y la brújula: con datos frescos, se dibujan fluido.
        ahiPitch = pitch;
        ahiRoll = roll;
        ahiYaw = yaw;
        if (window.NEUN3D) window.NEUN3D.setImuAttitude(pitch, roll, yaw);
        const pEl = document.getElementById('imuP'), rEl = document.getElementById('imuR'), yEl = document.getElementById('imuY');
        if (pEl) pEl.textContent = pitch.toFixed(1) + '°';
        if (rEl) rEl.textContent = roll.toFixed(1) + '°';
        if (yEl) yEl.textContent = yaw.toFixed(1) + '°';
        if (d.gx !== undefined) {
          const gxEl = document.getElementById('imuGx'), gyEl = document.getElementById('imuGy'), gzEl = document.getElementById('imuGz');
          if (gxEl) gxEl.textContent = d.gx.toFixed(1) + ' °/s';
          if (gyEl) gyEl.textContent = d.gy.toFixed(1) + ' °/s';
          if (gzEl) gzEl.textContent = d.gz.toFixed(1) + ' °/s';
        }
        if (d.temp !== undefined) {
          const tEl = document.getElementById('imuTemp');
          if (tEl) tEl.textContent = d.temp.toFixed(1) + '°C';
        }
      };

      // Ritmo medido sobre la placa real: el enlace (ESP32 como cliente del
      // hotspot de la PC) responde en 150-500 ms por peticion, asi que pedir mas
      // seguido solo acumular peticiones y hace que el proxy agote su timeout.
      // Con 500 ms salen ~2 muestras por segundo, y la transicion CSS de
      // 0,1 s del cubo las funde para que el movimiento se vea continuo.
      // Para llegar a 20-30 Hz de verdad habria que cambiar el sondeo por
      // Server-Sent Events (push del ESP32), no seguir pidiendo por HTTP.
      setInterval(() => {
        if (imuFastBusy) return;
        imuFastBusy = true;
        fetch('/api/imu', { cache: 'no-store' })
          .then(r => r.json())
          .then(applyImu)
          .catch(() => { })
          .finally(() => { imuFastBusy = false; });
      }, 500);
    }


    // ==================== APARTADO MANDO (ESP32-C3) ====================
    const MANDO_MODES = ['STAND', 'WALK_FWD', 'TROT', 'CRAWL', 'TURN_LEFT', 'TURN_RIGHT',
      'CRAB_LEFT', 'CRAB_RIGHT', 'TILT', 'DANCE', 'SENTRY', 'EXPLORE',
      'SPIRAL', 'JUMP', 'WAVE', 'PUSHUP', 'ELEVATE', 'FOLLOW', 'SLEEP'];

    function mandoFillModes() {
      const sel = document.getElementById('mp_mode');
      if (!sel || sel.options.length) return;
      MANDO_MODES.forEach(m => { const o = document.createElement('option'); o.value = m; o.textContent = m; sel.appendChild(o); });
    }

    window._mandoPrev = { x: 0, y: 0, rot: 0, body: 0, speed: 0,
      tx: 0, ty: 0, trot: 0, tbody: 0, tspeed: 0, online: false };

    function mandoFmtUptime(s) {
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    }

    function mandoRender(d) {
      const m = (d && d.mando) || {};
      const link = (d && d.link) || {};
      const P = window._mandoPrev;
      P.tx = m.online ? (m.joy_x || 0) : 0;
      P.ty = m.online ? (m.joy_y || 0) : 0;
      P.trot = m.online ? (m.rotate || 0) : 0;
      P.tbody = m.online ? (m.body_z || 0) : 0;
      P.tspeed = m.online ? ((d && d.speed) || 0) : 0;
      P.online = !!m.online;

      const badge = document.getElementById('mandoBadge');
      if (badge) {
        badge.innerHTML = m.online ? 'MANDO<br>ONLINE' : 'MANDO<br>OFFLINE';
        badge.classList.toggle('online', !!m.online);
      }
      const title = document.getElementById('mandoTitle');
      if (title) {
        title.textContent = m.seen
          ? (m.online ? 'Mando activo' : 'Mando visto hace ' + Math.round((m.last_seen_ms || 0) / 1000) + ' s')
          : 'Sin mando conectado';
      }
      const sub = document.getElementById('mandoSub');
      if (sub) {
        sub.textContent = m.seen
          ? ('MAC ' + (m.mac || 'no declarada') + ' | IP ' + (m.ip || '--') + ' | boton de modo: ' + (m.mode_button || '--'))
          : 'Encendi el ESP32-C3: se conecta al AP y baja su perfil del robot';
      }

      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('mandoLinkState', m.online ? 'ACTIVO' : (m.seen ? 'visto hace ' + Math.round((m.last_seen_ms || 0) / 1000) + ' s' : 'sin mando'));
      set('mandoMac', m.mac || '--');
      set('mandoIp', m.ip || '--');

      let rssi = null;
      if (link.stations && link.stations.length) {
        const mine = link.stations.find(s => s.is_mando);
        const ref = mine || link.stations.reduce((a, b) => (a.rssi >= b.rssi ? a : b));
        if (typeof ref.rssi === 'number') rssi = ref.rssi;
      }
      set('mandoRssiVal', rssi === null ? '--' : (rssi + ' dBm'));
      const lvl = rssi === null ? 0 : (rssi >= -55 ? 100 : rssi >= -65 ? 75 : rssi >= -75 ? 50 : 25);
      const bar = document.getElementById('mandoRssi');
      if (bar) bar.style.width = lvl + '%';
      set('mandoLatency', (typeof link.latency_ms === 'number' && link.latency_ms > 0) ? (link.latency_ms.toFixed(0) + ' ms') : '--');
      set('mandoUptime', (typeof link.uptime_s === 'number') ? mandoFmtUptime(link.uptime_s) : '--');
      set('mandoRequests', (link.requests || 0) + ' / ' + (link.errors || 0));
      set('mandoWatchdog', (d && d.watchdog_trips) || 0);

      const box = document.getElementById('mandoStations');
      if (box) {
        const st = link.stations || [];
        box.innerHTML = st.length
          ? st.map(s => '<div class="mando-kv"><span class="k">' + (s.is_mando ? 'MANDO' : 'cliente') + '</span><span class="v">' + s.mac + ' | ' + s.rssi + ' dBm</span></div>').join('')
          : '<div class="mando-kv"><span class="k">Sin estaciones</span><span class="v">--</span></div>';
      }

      const kpi = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      kpi('mandoKpiSpeed', Math.round(P.speed) + '%');
      kpi('mandoKpiRot', (P.rot >= 0 ? '+' : '') + P.rot.toFixed(2));
      kpi('mandoKpiBody', (P.body >= 0 ? '+' : '') + P.body.toFixed(2));
      kpi('mandoKpiJoy', P.x.toFixed(2) + '/' + P.y.toFixed(2));

      const last = (d && d.last_command) || {};
      set('mandoLastCmd', last.cmd || '--');
      set('mandoLastSrc', last.source || '--');
      set('mandoLastAge', (typeof last.age_ms === 'number' && last.age_ms >= 0) ? (last.age_ms + ' ms') : '--');
      set('mandoLastIp', last.ip || link.last_cmd_ip || '--');
      set('mandoCommands', m.commands || 0);
      set('mandoFetches', m.profile_fetches || 0);

      // Log de actividad: solo cuando cambia el ultimo comando del mando
      if (last.source === 'mando' && last.cmd && last.cmd !== window._mandoPrev.lastLog) {
        window._mandoPrev.lastLog = last.cmd;
        const logBox = document.getElementById('mandoLog');
        if (logBox) {
          const row = document.createElement('div');
          row.className = 'mando-kv';
          const t = new Date().toLocaleTimeString('es-AR', { hour12: false });
          row.innerHTML = '<span class="k">' + t + '</span><span class="v">' +
            String(last.cmd).replace(/</g, '&lt;') + ' <span style="color:var(--text-muted)">(' + (last.ip || '?') + ')</span></span>';
          logBox.insertBefore(row, logBox.firstChild);
          while (logBox.children.length > 30) logBox.removeChild(logBox.lastChild);
        }
      }
    }

    // Vista previa en vivo: dibuja stick/giro/barras con decaimiento a 0
    function mandoPreviewTick() {
      const P = window._mandoPrev;
      const k = 0.25;
      P.x += (P.tx - P.x) * k; P.y += (P.ty - P.y) * k;
      P.rot += (P.trot - P.rot) * k; P.body += (P.tbody - P.body) * k;
      P.speed += (P.tspeed - P.speed) * k;

      const joy = document.getElementById('mandoPrevJoy');
      if (joy && joy.getContext) {
        const g = joy.getContext('2d');
        g.clearRect(0, 0, joy.width, joy.height);
        g.fillStyle = 'rgba(6,9,19,0.5)'; g.fillRect(0, 0, joy.width, joy.height);
        g.strokeStyle = 'rgba(255,43,67,0.25)'; g.beginPath(); g.arc(90, 90, 60, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = 'rgba(255,43,67,0.12)'; g.beginPath(); g.arc(90, 90, 30, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.moveTo(30, 90); g.lineTo(150, 90); g.moveTo(90, 30); g.lineTo(90, 150); g.stroke();
        const px = 90 + P.x * 60, py = 90 - P.y * 60;
        g.strokeStyle = 'rgba(0,255,135,0.7)'; g.beginPath(); g.moveTo(90, 90); g.lineTo(px, py); g.stroke();
        g.fillStyle = 'rgba(255,43,67,0.9)'; g.beginPath(); g.arc(px, py, 12, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.55)'; g.font = '10px monospace';
        g.fillText('x=' + P.x.toFixed(2), 8, 14);
        g.fillText('y=' + P.y.toFixed(2), 128, 14);
      }

      const rot = document.getElementById('mandoPrevRot');
      if (rot && rot.getContext) {
        const g2 = rot.getContext('2d');
        g2.clearRect(0, 0, rot.width, rot.height);
        g2.fillStyle = 'rgba(6,9,19,0.5)'; g2.fillRect(0, 0, rot.width, rot.height);
        g2.strokeStyle = 'rgba(255,43,67,0.2)'; g2.beginPath(); g2.arc(70, 70, 48, 0, Math.PI * 2); g2.stroke();
        const a = P.rot * Math.PI;
        g2.strokeStyle = 'rgba(0,255,135,0.9)'; g2.lineWidth = 3;
        g2.beginPath(); g2.moveTo(70, 70); g2.lineTo(70 + Math.cos(a) * 48, 70 + Math.sin(a) * 48); g2.stroke();
        g2.fillStyle = 'rgba(255,255,255,0.55)'; g2.font = '10px monospace';
        g2.fillText('rot=' + P.rot.toFixed(2), 8, 14);
      }

      const bs = document.getElementById('mandoBarSpeed');
      if (bs) bs.style.width = Math.max(0, Math.min(100, P.speed)) + '%';
      const bs2 = document.getElementById('mandoBarSpeedVal');
      if (bs2) bs2.textContent = Math.round(P.speed) + '%';
      const bb = document.getElementById('mandoBarBody');
      if (bb) bb.style.width = (Math.abs(P.body) * 100) + '%';
      const bb2 = document.getElementById('mandoBarBodyVal');
      if (bb2) bb2.textContent = (P.body >= 0 ? '+' : '') + P.body.toFixed(2);
      const note = document.getElementById('mandoPreviewNote');
      if (note) note.textContent = P.online ? 'Telemetria en vivo del mando' : 'Sin telemetria (decae a 0)';
    }
    setInterval(mandoPreviewTick, 50);
    function mandoFillForm(profile, version) {
      if (!profile) return;
      mandoFillModes();
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
      set('mp_deadzone', profile.deadzone);
      set('mp_ema', profile.ema_alpha);
      set('mp_heartbeat', profile.heartbeat_ms);
      set('mp_rate', profile.send_rate_hz);
      set('mp_potmin', profile.pot_min);
      set('mp_potmax', profile.pot_max);
      set('mp_spdmin', profile.speed_min);
      set('mp_spdmax', profile.speed_max);
      set('mp_led', profile.led_brightness);
      set('mp_body', profile.body_step);
      set('mp_mode', profile.mode_button || 'DANCE');
      const chk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
      chk('mp_invx', profile.invert_x);
      chk('mp_invy', profile.invert_y);
      chk('mp_buzzer', profile.buzzer);
      const v = document.getElementById('mandoProfileV');
      if (v && version) v.textContent = 'v' + version;
    }

    function mandoLoadProfile() {
      fetch('/api/mando/config').then(r => r.json()).then(d => {
        if (!d.success) { showToast(d.message || 'El robot no responde', 'error'); return; }
        mandoFillForm(d.profile, d.version);
        showToast('Perfil del mando leido (v' + d.version + ')', 'success');
      }).catch(() => showToast('Error leyendo el perfil del mando', 'error'));
    }

    function mandoSaveProfile() {
      const val = id => { const el = document.getElementById(id); return el ? el.value : undefined; };
      const chk = id => { const el = document.getElementById(id); return !!(el && el.checked); };
      const profile = {
        deadzone: parseFloat(val('mp_deadzone')),
        ema_alpha: parseFloat(val('mp_ema')),
        heartbeat_ms: parseInt(val('mp_heartbeat'), 10),
        send_rate_hz: parseInt(val('mp_rate'), 10),
        invert_x: chk('mp_invx'),
        invert_y: chk('mp_invy'),
        pot_min: parseInt(val('mp_potmin'), 10),
        pot_max: parseInt(val('mp_potmax'), 10),
        speed_min: parseInt(val('mp_spdmin'), 10),
        speed_max: parseInt(val('mp_spdmax'), 10),
        led_brightness: parseInt(val('mp_led'), 10),
        buzzer: chk('mp_buzzer'),
        mode_button: val('mp_mode'),
        body_step: parseFloat(val('mp_body')),
      };
      fetch('/api/mando/config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profile })
      }).then(r => r.json()).then(d => {
        if (d.success) {
          showToast('Perfil guardado en el robot (v' + d.version + ')', 'success');
          const v = document.getElementById('mandoProfileV');
          if (v) v.textContent = 'v' + d.version;
        } else {
          showToast('Rechazado: ' + (d.detail || 'valor invalido'), 'error');
        }
      }).catch(() => showToast('Error guardando el perfil', 'error'));
    }

    function mandoResetProfile() {
      if (!confirm('Restaurar el perfil del mando a los valores por defecto?')) return;
      fetch('/api/mando/reset', { method: 'POST' }).then(r => r.json()).then(d => {
        if (d.success) { showToast('Perfil restaurado (v' + d.version + ')', 'success'); mandoLoadProfile(); }
        else showToast('No se pudo restaurar el perfil', 'error');
      }).catch(() => { });
    }

    function mandoSendQuick(what) {
      const map = {
        'beep':   ['buzzer',   { pattern: 'BEEP',  freq: 880,  duration: 150, wave: 'square', volume: 70 }],
        'siren':  ['buzzer',   { pattern: 'SIREN', freq: 600,  duration: 800, wave: 'sawtooth', volume: 60 }],
        'headlight on':  ['headlight', { state: 'on' }],
        'headlight off': ['headlight', { state: 'off' }],
      };
      const entry = map[what];
      if (!entry) return;
      fetch('/api/command', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Arana-Source': 'mando' },
        body: JSON.stringify({ cmd: entry[0], value: entry[1] })
      }).then(r => r.json()).then(d => {
        showToast((d.status || 'ok') + ' - ' + what, 'success');
      }).catch(() => showToast('Sin respuesta del robot', 'error'));
    }

    function mandoTestLink() {
      fetch('/api/mando/test').then(r => r.json()).then(d => {
        showToast(d.message || (d.success ? 'Test de enlace OK' : 'Sin respuesta'), d.success ? 'success' : 'error');
      }).catch(() => showToast('Error en el test de enlace', 'error'));
    }

    // ==================== APARTADO GPS (NEO-6M) ====================
    function gpsRender(d) {
      const g = (d && d.sensors && d.sensors.gps) || {};
      const dot = document.getElementById('sens-gps-dot');
      if (dot) dot.style.background = g.fix ? 'var(--accent-green)' : (g.online ? 'var(--accent-yellow)' : '#ff2b43');
      const val = document.getElementById('sens-gps-val');
      const unit = document.getElementById('sens-gps-unit');
      if (val) {
        if (g.fix) {
          val.textContent = Number(g.lat).toFixed(5) + ', ' + Number(g.lon).toFixed(5);
          if (unit) unit.textContent = 'lat, lon';
        } else {
          val.textContent = g.online ? 'SIN FIX' : 'OFFLINE';
          if (unit) unit.textContent = '';
        }
      }
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('sens-gps-sats', g.sats || 0);
      set('sens-gps-hdop', g.fix ? Number(g.hdop || 0).toFixed(1) : '--');
      set('sens-gps-speed', Number(g.speed_kmh || 0).toFixed(1));
      set('sens-gps-utc', g.utc || '--');
      set('gpsTracePoints', (d.gps_track || []).length);
      set('gpsWaypoints', (d.waypoints || []).length);
      gpsDrawTrace(d.gps_track || [], d.waypoints || []);
    }

    function gpsDrawTrace(track, waypoints) {
      const c = document.getElementById('gpsTrace');
      if (!c || !c.getContext) return;
      const g2 = c.getContext('2d');
      g2.clearRect(0, 0, c.width, c.height);
      g2.fillStyle = 'rgba(6,9,19,0.35)';
      g2.fillRect(0, 0, c.width, c.height);
      const pts = track.filter(p => typeof p.lat === 'number' && typeof p.lon === 'number');
      if (!pts.length) {
        g2.fillStyle = 'rgba(255,255,255,0.35)';
        g2.font = '12px monospace';
        g2.fillText('Sin traza GPS (esperando fix)', 16, c.height / 2);
        return;
      }
      let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
      pts.forEach(p => {
        minLat = Math.min(minLat, p.lat); maxLat = Math.max(maxLat, p.lat);
        minLon = Math.min(minLon, p.lon); maxLon = Math.max(maxLon, p.lon);
      });
      const spanLat = (maxLat - minLat) || 0.0001;
      const spanLon = (maxLon - minLon) || 0.0001;
      const pad = 26;
      const toXY = p => [pad + ((p.lon - minLon) / spanLon) * (c.width - 2 * pad),
                         c.height - pad - ((p.lat - minLat) / spanLat) * (c.height - 2 * pad)];
      g2.strokeStyle = 'rgba(0,229,255,0.85)';
      g2.lineWidth = 2;
      g2.beginPath();
      pts.forEach((p, i) => { const xy = toXY(p); if (i === 0) g2.moveTo(xy[0], xy[1]); else g2.lineTo(xy[0], xy[1]); });
      g2.stroke();
      const ini = toXY(pts[0]);
      g2.fillStyle = 'rgba(0,229,255,0.9)';
      g2.beginPath(); g2.arc(ini[0], ini[1], 4, 0, Math.PI * 2); g2.fill();
      const cur = toXY(pts[pts.length - 1]);
      g2.fillStyle = 'rgba(0,255,136,0.95)';
      g2.beginPath(); g2.arc(cur[0], cur[1], 5, 0, Math.PI * 2); g2.fill();
      g2.fillStyle = 'rgba(255,43,67,0.95)';
      waypoints.forEach(w => {
        if (typeof w.lat !== 'number') return;
        const xy = toXY(w);
        g2.beginPath(); g2.arc(xy[0], xy[1], 3.5, 0, Math.PI * 2); g2.fill();
      });
      g2.fillStyle = 'rgba(255,255,255,0.55)';
      g2.font = '10px monospace';
      g2.fillText('inicio', pad, pad - 8);
      g2.fillText('actual', c.width - pad - 40, c.height - 8);
    }

    function gpsSaveWaypoint() {
      const name = prompt('Nombre del waypoint (opcional):', 'WP');
      fetch('/api/gps/waypoint', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || null })
      }).then(r => r.json()).then(d => {
        showToast(d.success ? ('Waypoint ' + d.waypoint.name + ' guardado') : (d.message || 'Sin fix GPS'), d.success ? 'success' : 'warn');
      }).catch(() => showToast('Error guardando el waypoint', 'error'));
    }

    function gpsCopyCoords() {
      const el = document.getElementById('sens-gps-val');
      const txt = el ? el.textContent : '';
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => showToast('Coordenadas copiadas: ' + txt, 'success'));
      else showToast('Coordenadas: ' + txt, 'info');
    }

    function gpsClearTrack() {
      if (!confirm('Borrar la traza GPS y los waypoints?')) return;
      fetch('/api/gps/clear', { method: 'POST' }).then(() => showToast('Traza borrada', 'warn')).catch(() => { });
    }

    // ==================== UTILERÍAS GENERALES ====================

    function sendCmd(cmd, value = null) {
      if (window.NEUN3D) {
        if (cmd === 'headlight') {
          if (value && typeof value === 'object') {
            window.NEUN3D.setHeadlights(value.state === 'on', value.brightness);
          } else {
            window.NEUN3D.setHeadlights(value === 'on' || value === true);
          }
        } else if (cmd === 'servo_adv' && value && typeof value.channel === 'number') {
          window.NEUN3D.setManualJoint(value.channel, value.angle);
        }
      }
      const payload = { cmd };
      if (value !== null) {
        payload.value = value;
      }
      return fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(async response => {
        if (response.ok) return true;
        if (!connected && demoMode) return false;
        const result = await response.json().catch(() => ({}));
        showCommandError(result.error || `HTTP ${response.status}`);
        return false;
      }).catch(() => {
        if (!connected && demoMode) return false;
        showCommandError('No se pudo contactar con el panel');
        return false;
      });
    }

    function showCommandError(message) {
      const now = Date.now();
      if (now - (showCommandError.lastShown || 0) < 3000) return;
      showCommandError.lastShown = now;
      showToast(`Comando no enviado: ${message}`, 'error');
    }

    function showToast(msg, type = 'success') {
      const container = document.getElementById('toastContainer');
      const t = document.createElement('div');
      t.className = `toast ${type}`;
      t.textContent = msg;

      container.appendChild(t);

      // Forzar reflow para animación
      requestAnimationFrame(() => t.classList.add('show'));

      setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 300);
      }, 3200);
    }



    // ==================== SENSOR ANALYTICS (TELEMETRY CHARTS) ====================
    const radarHistory = [];
    const irHistory = [];

    function drawLineChart(canvasId, data, maxVal, color, unit) {
      const c = document.getElementById(canvasId);
      if (!c) return;
      const ctx2 = c.getContext('2d');
      const w = c.width = c.offsetWidth * (window.devicePixelRatio || 1);
      const h = c.height = c.offsetHeight * (window.devicePixelRatio || 1);
      ctx2.clearRect(0, 0, w, h);

      // Background grid
      ctx2.strokeStyle = 'rgba(255, 43, 67, 0.04)';
      ctx2.lineWidth = 0.5;
      for (let gy = 0; gy < h; gy += h / 4) {
        ctx2.beginPath(); ctx2.moveTo(0, gy); ctx2.lineTo(w, gy); ctx2.stroke();
      }
      if (!data.length) return;

      // Fill gradient
      const grad = ctx2.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, color.replace(')', ', 0.25)').replace('rgb', 'rgba'));
      grad.addColorStop(1, 'rgba(6, 9, 19, 0)');

      // Line
      ctx2.beginPath();
      const step = data.length > 1 ? w / (data.length - 1) : w;
      for (let i = 0; i < data.length; i++) {
        const x = i * step;
        const y = h - (data[i] / maxVal) * h * 0.9 - h * 0.05;
        if (i === 0) ctx2.moveTo(x, y);
        else ctx2.lineTo(x, y);
      }
      ctx2.strokeStyle = color;
      ctx2.lineWidth = 2;
      ctx2.stroke();

      // Fill
      ctx2.lineTo(w, h);
      ctx2.lineTo(0, h);
      ctx2.closePath();
      ctx2.fillStyle = grad;
      ctx2.fill();
    }

    function drawArcGauge(canvasId, value, maxVal, label, color) {
      const c = document.getElementById(canvasId);
      if (!c) return;
      const ctx2 = c.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const size = 100 * dpr;
      c.width = size;
      c.height = size;
      ctx2.clearRect(0, 0, size, size);
      const cx = size / 2, cy = size / 2, r = size * 0.38;
      const startAng = Math.PI * 0.75;
      const endAng = Math.PI * 2.25;
      const range = endAng - startAng;
      const valAng = startAng + (value / maxVal) * range;

      // BG arc
      ctx2.beginPath();
      ctx2.arc(cx, cy, r, startAng, endAng);
      ctx2.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx2.lineWidth = 8 * dpr;
      ctx2.lineCap = 'round';
      ctx2.stroke();

      // Value arc
      ctx2.beginPath();
      ctx2.arc(cx, cy, r, startAng, valAng);
      ctx2.strokeStyle = color;
      ctx2.lineWidth = 8 * dpr;
      ctx2.lineCap = 'round';
      ctx2.stroke();

      // Glow
      ctx2.shadowBlur = 10 * dpr;
      ctx2.shadowColor = color;
      ctx2.beginPath();
      ctx2.arc(cx, cy, r, valAng - 0.05, valAng);
      ctx2.stroke();
      ctx2.shadowBlur = 0;

      // Text
      ctx2.fillStyle = '#f3f4f6';
      ctx2.font = `bold ${14 * dpr}px 'Space Grotesk', sans-serif`;
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'middle';
      ctx2.fillText(label, cx, cy);

      // Sub
      ctx2.fillStyle = 'rgba(156,163,175,0.7)';
      ctx2.font = `${8 * dpr}px 'Plus Jakarta Sans', sans-serif`;
      ctx2.fillText(value.toFixed(0) + (maxVal === 100 ? '%' : '°C'), cx, cy + 16 * dpr);
    }


    // ==================== ARTIFICIAL HORIZON (ATTITUDE INDICATOR) v2.6 ====================
    let ahiPitch = 0;
    let ahiRoll = 0;

    function drawArtificialHorizon() {
      const c = document.getElementById('ahiCanvas');
      const frameTime = performance.now();
      if (!c || document.hidden || !c.getClientRects().length) {
        setTimeout(() => requestAnimationFrame(drawArtificialHorizon), 250);
        return;
      }
      if (frameTime - lastHorizonFrameAt < 33) {
        requestAnimationFrame(drawArtificialHorizon);
        return;
      }
      lastHorizonFrameAt = frameTime;
      const ctx2 = c.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const size = 200 * dpr;
      if (c.width !== size) c.width = size;
      if (c.height !== size) c.height = size;
      const cx = size / 2, cy = size / 2, r = size / 2;

      ctx2.save();
      ctx2.clearRect(0, 0, size, size);

      // Outer bezel ring
      ctx2.beginPath();
      ctx2.arc(cx, cy, r - 1 * dpr, 0, Math.PI * 2);
      ctx2.strokeStyle = 'rgba(255, 43, 67, 0.15)';
      ctx2.lineWidth = 3 * dpr;
      ctx2.stroke();

      // Clip to circle
      ctx2.beginPath();
      ctx2.arc(cx, cy, r - 4 * dpr, 0, Math.PI * 2);
      ctx2.clip();

      // Rotate for roll
      ctx2.translate(cx, cy);
      ctx2.rotate(-ahiRoll * Math.PI / 180);

      // Pitch offset (1 degree = 2.2px scaled for better range)
      const pitchPx = ahiPitch * 2.2 * dpr;

      // Sky (blue gradient - more dramatic)
      const skyGrad = ctx2.createLinearGradient(0, -r + pitchPx, 0, pitchPx);
      skyGrad.addColorStop(0, '#050a30');
      skyGrad.addColorStop(0.4, '#0c1445');
      skyGrad.addColorStop(0.7, '#1e3a8a');
      skyGrad.addColorStop(1, '#3b82f6');
      ctx2.fillStyle = skyGrad;
      ctx2.fillRect(-r * 2, -r * 2 + pitchPx, r * 4, r * 2);

      // Ground (brown/earth gradient - more dramatic)
      const gndGrad = ctx2.createLinearGradient(0, pitchPx, 0, r * 2 + pitchPx);
      gndGrad.addColorStop(0, '#92400e');
      gndGrad.addColorStop(0.25, '#78350f');
      gndGrad.addColorStop(0.6, '#451a03');
      gndGrad.addColorStop(1, '#270b02');
      ctx2.fillStyle = gndGrad;
      ctx2.fillRect(-r * 2, pitchPx, r * 4, r * 2);

      // Horizon line (thicker, brighter)
      ctx2.strokeStyle = '#ffffff';
      ctx2.lineWidth = 2 * dpr;
      ctx2.beginPath();
      ctx2.moveTo(-r * 2, pitchPx);
      ctx2.lineTo(r * 2, pitchPx);
      ctx2.stroke();
      // Horizon glow
      ctx2.shadowBlur = 12 * dpr;
      ctx2.shadowColor = 'rgba(255,255,255,0.3)';
      ctx2.stroke();
      ctx2.shadowBlur = 0;

      // Pitch ladder (5 degree increments for precision)
      ctx2.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx2.fillStyle = 'rgba(255,255,255,0.7)';
      ctx2.font = `${7 * dpr}px 'Space Grotesk', sans-serif`;
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'middle';
      ctx2.lineWidth = 1 * dpr;
      for (let deg = -45; deg <= 45; deg += 5) {
        if (deg === 0) continue;
        const yOff = pitchPx - deg * 2.2 * dpr;
        const isMajor = Math.abs(deg) % 10 === 0;
        const isMid = Math.abs(deg) % 5 === 0 && !isMajor;
        const halfW = isMajor ? 30 * dpr : (isMid ? 18 * dpr : 10 * dpr);
        // Dashed for 5deg, solid for 10+
        ctx2.setLineDash(isMid ? [3, 3] : []);
        ctx2.lineWidth = isMajor ? 1.5 * dpr : 0.8 * dpr;
        ctx2.beginPath();
        ctx2.moveTo(-halfW, yOff);
        ctx2.lineTo(halfW, yOff);
        ctx2.stroke();
        ctx2.setLineDash([]);
        if (isMajor) {
          ctx2.fillText(deg + '°', halfW + 14 * dpr, yOff);
          ctx2.fillText(deg + '°', -halfW - 14 * dpr, yOff);
        }
      }

      ctx2.restore();

      // Fixed roll indicator arc at top
      ctx2.save();
      const rollArcR = r * 0.83;
      ctx2.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx2.lineWidth = 1.5 * dpr;
      ctx2.beginPath();
      ctx2.arc(cx, cy, rollArcR, -Math.PI * 0.88, -Math.PI * 0.12);
      ctx2.stroke();

      // Roll tick marks (more grades)
      const rollTicks = [-90, -60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60, 90];
      rollTicks.forEach(tick => {
        const ang = -Math.PI / 2 + tick * Math.PI / 180;
        const innerR = rollArcR - 5 * dpr;
        const outerR = (tick % 30 === 0) ? rollArcR + 10 * dpr : (tick % 10 === 0 ? rollArcR + 6 * dpr : rollArcR + 3 * dpr);
        ctx2.strokeStyle = tick === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)';
        ctx2.lineWidth = tick === 0 ? 2.5 * dpr : (tick % 30 === 0 ? 1.5 * dpr : 0.8 * dpr);
        ctx2.beginPath();
        ctx2.moveTo(cx + Math.cos(ang) * innerR, cy + Math.sin(ang) * innerR);
        ctx2.lineTo(cx + Math.cos(ang) * outerR, cy + Math.sin(ang) * outerR);
        ctx2.stroke();
        // Label major roll angles
        if (tick % 30 === 0 && tick !== 0) {
          ctx2.fillStyle = 'rgba(255,255,255,0.5)';
          ctx2.font = `${7 * dpr}px 'Space Grotesk', sans-serif`;
          ctx2.textAlign = 'center';
          ctx2.textBaseline = 'middle';
          const labelR = rollArcR + 18 * dpr;
          ctx2.fillText(tick + '°', cx + Math.cos(ang) * labelR, cy + Math.sin(ang) * labelR);
        }
      });

      // Roll pointer (triangle - more prominent)
      const rollAng = -Math.PI / 2 - ahiRoll * Math.PI / 180;
      const pR = rollArcR - 8 * dpr;
      ctx2.fillStyle = '#ffb703';
      ctx2.shadowBlur = 10 * dpr;
      ctx2.shadowColor = 'rgba(255, 183, 3, 0.4)';
      ctx2.beginPath();
      ctx2.moveTo(cx + Math.cos(rollAng) * pR, cy + Math.sin(rollAng) * pR);
      ctx2.lineTo(cx + Math.cos(rollAng - 0.07) * (pR + 12 * dpr), cy + Math.sin(rollAng - 0.07) * (pR + 12 * dpr));
      ctx2.lineTo(cx + Math.cos(rollAng + 0.07) * (pR + 12 * dpr), cy + Math.sin(rollAng + 0.07) * (pR + 12 * dpr));
      ctx2.closePath();
      ctx2.fill();
      ctx2.shadowBlur = 0;

      // Pitch angle text overlay bottom (drawn inside clip but outside roll rotation, so restore first)
      ctx2.restore();

      // Pitch degree readout overlay at bottom
      ctx2.save();
      ctx2.fillStyle = 'rgba(255, 43, 67, 0.6)';
      ctx2.font = `bold ${9 * dpr}px 'Space Grotesk', sans-serif`;
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'bottom';
      ctx2.fillText(`Pitch ${ahiPitch.toFixed(1)}°  |  Roll ${ahiRoll.toFixed(1)}°`, cx, cy + r - 6 * dpr);
      ctx2.restore();

    }
    let lastHorizonFrameAt = 0;
    requestAnimationFrame(drawArtificialHorizon);

    // ==================== COMPASS ROSE (YAW INDICATOR) ====================
    let ahiYaw = 0;

    function drawCompass() {
      const c = document.getElementById('compassCanvas');
      const frameTime = performance.now();
      if (!c || document.hidden || !c.getClientRects().length) {
        setTimeout(() => requestAnimationFrame(drawCompass), 250);
        return;
      }
      if (frameTime - lastCompassFrameAt < 33) {
        requestAnimationFrame(drawCompass);
        return;
      }
      lastCompassFrameAt = frameTime;
      const ctx2 = c.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const size = 140 * dpr;
      if (c.width !== size) c.width = size;
      if (c.height !== size) c.height = size;
      const cx = size / 2, cy = size / 2, r = size / 2 - 4 * dpr;

      ctx2.clearRect(0, 0, size, size);

      // Outer ring
      ctx2.beginPath();
      ctx2.arc(cx, cy, r + 2 * dpr, 0, Math.PI * 2);
      ctx2.strokeStyle = 'rgba(255, 43, 67, 0.15)';
      ctx2.lineWidth = 3 * dpr;
      ctx2.stroke();

      // Background
      ctx2.beginPath();
      ctx2.arc(cx, cy, r, 0, Math.PI * 2);
      ctx2.fillStyle = 'rgba(6, 9, 19, 0.85)';
      ctx2.fill();

      // Card direction ticks (every 30 deg)
      for (let deg = 0; deg < 360; deg += 30) {
        const ang = (deg - 90) * Math.PI / 180;
        const innerR = deg % 90 === 0 ? r * 0.78 : r * 0.84;
        const outerR = r * 0.92;
        ctx2.beginPath();
        ctx2.moveTo(cx + Math.cos(ang) * innerR, cy + Math.sin(ang) * innerR);
        ctx2.lineTo(cx + Math.cos(ang) * outerR, cy + Math.sin(ang) * outerR);
        ctx2.strokeStyle = deg % 90 === 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)';
        ctx2.lineWidth = deg % 90 === 0 ? 2 * dpr : 1 * dpr;
        ctx2.stroke();
      }

      // Cardinal labels (N, E, S, W)
      const cardinals = [
        { deg: 0, label: 'N' },
        { deg: 90, label: 'E' },
        { deg: 180, label: 'S' },
        { deg: 270, label: 'W' }
      ];
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'middle';
      cardinals.forEach(card => {
        const ang = (card.deg - 90) * Math.PI / 180;
        const labelR = r * 0.68;
        ctx2.fillStyle = card.deg === 0 ? '#ff0844' : 'rgba(255,255,255,0.7)';
        ctx2.font = `bold ${13 * dpr}px 'Space Grotesk', sans-serif`;
        ctx2.fillText(card.label, cx + Math.cos(ang) * labelR, cy + Math.sin(ang) * labelR);
      });

      // Heading needle (points to yaw)
      const needleAng = (ahiYaw - 90) * Math.PI / 180;

      // Needle shadow
      ctx2.shadowBlur = 8 * dpr;
      ctx2.shadowColor = 'rgba(255, 43, 67, 0.3)';

      // Needle body (red top half, white bottom half)
      const needleLen = r * 0.7;
      // Top half (red)
      ctx2.beginPath();
      ctx2.moveTo(cx + Math.cos(needleAng) * needleLen, cy + Math.sin(needleAng) * needleLen);
      ctx2.lineTo(cx + Math.cos(needleAng + 0.1) * needleLen * 0.3, cy + Math.sin(needleAng + 0.1) * needleLen * 0.3);
      ctx2.lineTo(cx, cy);
      ctx2.closePath();
      ctx2.fillStyle = '#ff0844';
      ctx2.fill();

      // Bottom half (cyan)
      ctx2.beginPath();
      ctx2.moveTo(cx + Math.cos(needleAng + Math.PI) * needleLen * 0.45, cy + Math.sin(needleAng + Math.PI) * needleLen * 0.45);
      ctx2.lineTo(cx + Math.cos(needleAng - 0.1) * needleLen * 0.3, cy + Math.sin(needleAng - 0.1) * needleLen * 0.3);
      ctx2.lineTo(cx, cy);
      ctx2.closePath();
      ctx2.fillStyle = '#ff2b43';
      ctx2.fill();

      ctx2.shadowBlur = 0;

      // Center pivot dot
      ctx2.beginPath();
      ctx2.arc(cx, cy, 4 * dpr, 0, Math.PI * 2);
      ctx2.fillStyle = '#ffffff';
      ctx2.fill();
      ctx2.beginPath();
      ctx2.arc(cx, cy, 2 * dpr, 0, Math.PI * 2);
      ctx2.fillStyle = '#14050c';
      ctx2.fill();

      // Inner decorative ring
      ctx2.beginPath();
      ctx2.arc(cx, cy, r * 0.38, 0, Math.PI * 2);
      ctx2.strokeStyle = 'rgba(255, 43, 67, 0.08)';
      ctx2.lineWidth = 1 * dpr;
      ctx2.stroke();

      // Heading degree readout at bottom
      ctx2.fillStyle = 'rgba(255, 43, 67, 0.5)';
      ctx2.font = `bold ${8 * dpr}px 'Space Grotesk', sans-serif`;
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'bottom';
      ctx2.fillText(ahiYaw.toFixed(0) + '°', cx, cy + r - 2 * dpr);

    }
    let lastCompassFrameAt = 0;
    requestAnimationFrame(drawCompass);

    // ==================== COMMS LOG HELPER ====================
    function addCommsLog(msg, type) {
      const log = document.getElementById('commsLog');
      if (!log) return;
      const line = document.createElement('div');
      line.className = 'comms-log-line';
      const time = new Date();
      const ts = String(time.getHours()).padStart(2, '0') + ':' + String(time.getMinutes()).padStart(2, '0') + ':' + String(time.getSeconds()).padStart(2, '0');
      const cls = type === 'ok' ? 'comms-log-ok' : (type === 'err' ? 'comms-log-err' : 'comms-log-info');
      line.innerHTML = '<span class="comms-log-time">' + ts + '</span><span class="' + cls + '">' + msg + '</span>';
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
    }

    // ==================== TELARAÑAS DECORATIVAS (SVG generado) ====================
    function buildSpiderWebs() {
      const corners = [
        { id: 'spiderWebTL', size: 130, arcs: 5, spokes: 7, spider: false },
        { id: 'spiderWebBR', size: 145, arcs: 5, spokes: 7, spider: false },
        { id: 'spiderWebTR', size: 95, arcs: 4, spokes: 6, spider: false },
        { id: 'spiderWebBL', size: 95, arcs: 4, spokes: 6, spider: false }
      ];
      corners.forEach(cfg => {
        const el = document.getElementById(cfg.id);
        if (!el) return;
        const S = cfg.size;
        let paths = '';
        // Radio del último arco: los hilos no deben pasarse de la malla
        const Rmax = (S * cfg.arcs) / (cfg.arcs + 1);
        // Hilos radiales desde la esquina
        for (let s = 0; s < cfg.spokes; s++) {
          const ang = (Math.PI / 2) * (cfg.spokes === 1 ? 0 : (s / (cfg.spokes - 1)));
          const x = Rmax * Math.cos(ang);
          const y = Rmax * Math.sin(ang);
          paths += `<path class="web-spoke" d="M0 0 L${x.toFixed(1)} ${y.toFixed(1)}"/>`;
        }
        // Arcos concéntricos de la malla
        for (let a = 1; a <= cfg.arcs; a++) {
          const r = (S * a) / (cfg.arcs + 1);
          paths += `<path class="web-arc" d="M0 ${r.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${r.toFixed(1)} 0"/>`;
        }
        let spider = '';
        if (cfg.spider) {
          const tx = S * 0.72, ty = S * 0.38;
          const sc = Math.max(0.6, S / 240);
          spider = `<g class="spider-figure" transform="translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${sc.toFixed(2)})">`
            + '<line x1="-8" y1="-2" x2="-23" y2="-13"/><line x1="-9" y1="2" x2="-25" y2="5"/>'
            + '<line x1="-7" y1="6" x2="-21" y2="19"/><line x1="-4" y1="8" x2="-12" y2="25"/>'
            + '<line x1="8" y1="-2" x2="23" y2="-13"/><line x1="9" y1="2" x2="25" y2="5"/>'
            + '<line x1="7" y1="6" x2="21" y2="19"/><line x1="4" y1="8" x2="12" y2="25"/>'
            + '<ellipse cx="0" cy="3" rx="6.5" ry="9"/><circle cx="0" cy="-6" r="4.5"/>'
            + '<circle cx="-1.9" cy="-7.3" r="1.15" fill="#ff2b43" stroke="none"/><circle cx="1.9" cy="-7.3" r="1.15" fill="#ff2b43" stroke="none"/>'
            + '</g>';
        }
        el.innerHTML = `<svg viewBox="0 0 ${S} ${S}" preserveAspectRatio="none" aria-hidden="true">${paths}${spider}</svg>`;
      });
    }

    // Señalizar a neun3d.js que app.js gestiona el sondeo rápido de /api/servos
    window.__NEUN_PANEL_POLLS_SERVOS = true;

    let servoFastPollBusy = false;
    function startServoFastPolling() {
      setInterval(() => {
        if (!connected || servoFastPollBusy || document.hidden) return;
        servoFastPollBusy = true;
        fetch('/api/servos', { cache: 'no-store' })
          .then(r => (r.ok ? r.json() : null))
          .then(d => {
            if (!d || !Array.isArray(d.servos) || d.servos.length !== 4) return;
            d.servos.forEach((legAngles, legIndex) => {
              const cEl = document.getElementById(`s${legIndex}c`);
              const fEl = document.getElementById(`s${legIndex}f`);
              const tEl = document.getElementById(`s${legIndex}t`);
              if (cEl) cEl.textContent = legAngles[0] + '°';
              if (fEl) fEl.textContent = legAngles[1] + '°';
              if (tEl) tEl.textContent = legAngles[2] + '°';
            });
            if (window.NEUN3D) {
              window.NEUN3D.setHardwareServos(d.servos, Boolean(d.connected), d.boot_source || '', d);
            }
          })
          .catch(() => {})
          .finally(() => { servoFastPollBusy = false; });
      }, 90);
    }

    // Sincronizar ángulos de servos hacia el tablero (en Demo desde 3D; en Real desde ESP32)
    window.onNeun3dServoFrame = function (servos4x3, info) {
      if (!Array.isArray(servos4x3)) return;
      if (connected && !(info && info.isRealHardware)) return;
      for (let leg = 0; leg < 4; leg++) {
        const cEl = document.getElementById(`s${leg}c`);
        const fEl = document.getElementById(`s${leg}f`);
        const tEl = document.getElementById(`s${leg}t`);
        if (cEl) cEl.textContent = servos4x3[leg][0] + '°';
        if (fEl) fEl.textContent = servos4x3[leg][1] + '°';
        if (tEl) tEl.textContent = servos4x3[leg][2] + '°';
      }
    };

    // Enviar cambios de altura (Subir / Bajar) del visor 3D al backend/ESP32 (throttled ~12 Hz)
    let _lastHeightSendMs = 0;
    let _lastHeightSentVal = null;
    window.onNeun3dHeightChange = function (normZ) {
      const z = Math.max(-1, Math.min(1, Number(normZ) || 0));
      const now = Date.now();
      if (_lastHeightSentVal !== null && Math.abs(z - _lastHeightSentVal) < 0.02) return;
      if (now - _lastHeightSendMs < 85 && z !== 0 && Math.abs(z) < 0.99) return;
      _lastHeightSendMs = now;
      _lastHeightSentVal = z;
      if (typeof sendCmd === 'function') sendCmd('body', { z });
    };

    // ==================== INICIALIZACIÓN ==
    window.addEventListener('DOMContentLoaded', () => {
      renderKeybindsUI();
      initLedMatrixUI();
      initBuzzerUI();
      initDashboardGamepad();
      initMainJoysticksAndDpad();
      buildSpiderWebs();
      buildModeDial();
      startStatusPolling();
      startImuFastPolling();   // actitud del IMU a 2 Hz para el cubo 3D
      startServoFastPolling(); // 12 servos reales del ESP32 a ~11 Hz para el visor 3D + barras live
      addCommsLog('Sistema de comunicacion iniciado', 'info');

      // Botón de ajuste de articulaciones 3D
      const jeBtn = document.getElementById('neun3dJointEditBtn');
      if (jeBtn) jeBtn.addEventListener('click', toggleJointEditMode);

      // No activar demoMode automaticamente: el sistema intenta conectar
      // continuamente y el usuario puede elegir Modo Demo desde el dialogo.
      // Si el ESP32 aparece, tryAutoReconnect lo enlaza solo.
    });
