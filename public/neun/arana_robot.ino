/* ============================================================================
 *  ARANA ROBOT - Firmware UNIFICADO (un solo archivo)
 *  IPET N66 - Electronica Digital III
 *
 *  GENERADO AUTOMATICAMENTE por esp32/tools/unificar.py
 *  NO EDITAR A MANO: cualquier cambio se pisa al regenerar.
 *  Para regenerar:  python esp32/tools/unificar.py
 *
 *  Fuente de verdad (modular): esp32/src/
 *
 *  Librerias necesarias en el Arduino IDE (Sketch > Include Library > Manage):
 *    ESPAsyncWebServer, AsyncTCP, ArduinoJson, TinyGPSPlus,
 *    Adafruit PWM Servo Driver, Adafruit Unified Sensor,
 *    Adafruit NeoPixel, Adafruit AHTX0
 *
 *  Placa: ESP32S3 Dev Module
 * ============================================================================ */

// --------------------------------------------------------------------------
//  Librerias externas
// --------------------------------------------------------------------------

#include <Arduino.h>
#include <Adafruit_AHTX0.h>
#include <Adafruit_NeoPixel.h>
#include <Adafruit_PWMServoDriver.h>
#include <ArduinoJson.h>
#include <ESPAsyncWebServer.h>
#include <Preferences.h>
#include <TinyGPSPlus.h>
#include <WiFi.h>
#include <Wire.h>
#include <esp_arduino_version.h>
#include <esp_wifi.h>
#include <math.h>
#include <string.h>
#include <strings.h>


// ==========================================================================
//  [00] CONSTANTES Y PINOUT
//  fuente: config.h
// ==========================================================================

#ifndef CONFIG_H
#define CONFIG_H


// ============================================================================
// ARAÑA ROBOT — Configuración global
// Pines, WiFi y constantes. El pinout se alinea con el estado de sensores que
// define la PC (pc/app.py -> SensorState).
// ============================================================================

// ------------------------------ WiFi (Access Point) --------------------------
#define WIFI_SSID         "ARANA-ROBOT"   // red a la que se conecta la PC
#define WIFI_PASSWORD     ""              // AP abierto (sin contraseña)
#define WIFI_CHANNEL      1
#define HTTP_PORT         80              // la PC espera el API en 192.168.4.1:80
#define WIFI_AP_MAX_CONN  4               // clientes simultáneos: PC + mando ESP32-C3
#define WIFI_AP_HIDDEN    false           // AP visible
#define WIFI_AP_RETRY_MS  5000            // reintento si el AP no arranca

// ------------------- WiFi cliente (STA) — red existente ----------------------
// Además de crear su AP, el robot puede conectarse a una red WiFi existente
// (por ejemplo la de la escuela, o el hotspot que crea la PC) y quedar
// accesible en su propia IP. Se usa cuando la placa no puede EMITIR su AP
// (etapa de RF de transmisión dañada) o cuando conviene tener internet.
//
// OJO CON ESTO: con WIFI_STA_ENABLED=true el AP "ARANA-ROBOT" DEJA de crearse.
// El codigo (comunicacion/wifi.cpp -> startAp) hace WiFi.mode(WIFI_STA) y nada
// mas, porque en AP+STA con canales distintos (AP en canal 1 y la red destino en
// otro) la radio de un solo canal salta y se pierden los frames de
// autenticacion -> reason=2 AUTH_EXPIRE. Se eligio STA puro por eso: fija la
// radio en el canal de la red destino. El precio es perder el AP, asi que con
// el STA activo el mando fisico ESP32-C3 tampoco podra conectarse por AP.
//
// Con WIFI_STA_ENABLED=false queda solo el AP (comportamiento original).
//
// Configuración predeterminada: AP ARANA-ROBOT (192.168.4.1), compatible con
// el panel y el mando. Para usar una red existente, activar STA y configurar
// ARANA_ESP32_IP en el PC con la IP que aparezca en el Monitor Serie.
#define WIFI_STA_ENABLED      false
#define WIFI_STA_SSID         "ARANA-PC"
#define WIFI_STA_PASSWORD     "arana1234"
// "" = DHCP. Con IP fija el panel PC siempre apunta a la misma direccion.
#define WIFI_STA_STATIC_IP    ""
// Gateway y subred del hotspot de Windows (Conexión de área local* / ICS).
#define WIFI_STA_GATEWAY      "192.168.137.1"
#define WIFI_STA_SUBNET       "255.255.255.0"
#define WIFI_STA_RETRY_MS     10000       // reintento si la conexión cliente cae

// ------------------------- Auto-recuperación del enlace STA -------------------
// El ESP32 puede quedarse "CONECTADO" según el driver (WIFI_STA_CONN de la placa)
// pero con el hotspot de la PC sin hacer pasar realmente el tráfico: el panel se
// queda en DEMO y ni siquiera responde a ping. Medido en esta placa, ocurre tras
// unos segundos de uso normal.
//
// Solo con WIFI_STA_ENABLED, el ESP32 no puede distinguir "nadie consulta" de
// "las peticiones no llegan". Si sigue asociado pero no atiende HTTP durante
// AUTO_RECONNECT_SILENCE_MS, fuerza una reconexión. Con el panel abierto hay
// ~2,5 peticiones/s en reposo (estado cada 2 s e IMU cada 500 ms); el control
// añade solicitudes solo mientras hay movimiento. Con el panel cerrado, el
// silencio es normal, asi que el umbral se estira a 10 min.
#define AUTO_RECONNECT_SILENCE_MS   30000  // silencio sospechoso antes de reconectar
#define AUTO_RECONNECT_MIN_GAP_MS  180000  // mínimo entre reconexiones forzosas
#define AUTO_RECONNECT_IDLE_MS    600000  // silencio "normal" (panel cerrado)

// --------------------------------- Pinout ------------------------------------
// Sensores
#define ULTRASONIC_TRIG_PIN  10           // HC-SR04  -> Trigger
#define ULTRASONIC_ECHO_PIN  11           // HC-SR04  -> Echo (5V: divisor 1k4/2k2)
#define IR_PIN               12           // TCRT5000 (salida analógica 0-4095)
// Actuadores
#define NEOPIXEL_PIN         14           // Matriz NeoPixel 8x8 (64 LEDs)
#define BUZZER_PIN           15           // Buzzer pasivo (PWM LEDC)
// Bus I2C compartido (3 dispositivos, direcciones distintas, sin conflicto):
//   MPU6050 (0x68) + PCA9685 (0x40) + AHT10 (0x38)
#define I2C_SDA_PIN           8           // por defecto en ESP32-S3-DevKitC-1
#define I2C_SCL_PIN           9

// ------------------------------- Constantes ----------------------------------
#define NEOPIXEL_COUNT       64           // matriz 8x8
#define SERVO_COUNT          12           // PCA9685: 4 patas x 3 articulaciones
#define PCA9685_I2C_ADDR     0x40
#define MPU6050_I2C_ADDR     0x68         // preferida; imu.cpp tambien prueba 0x69 (AD0)
#define AHT10_I2C_ADDR       0x38         // AHT10 / AHT20 / AHT21 (mismo driver)
#define AHT10_ENABLED        true         // false si no hay módulo en el bus I2C

// ------------------------------- Servos (PCA9685) ----------------------------
// Frecuencia de servos analógicos: 50 Hz -> periodo de 20 ms (20000 us).
// Pulso típico 500-2500 us; con 4096 cuentas por periodo:
//   counts = pulse_us * 4096 / 20000  ->  102 (0°) .. 512 (180°)
#define SERVO_PWM_FREQ_HZ    50
#define SERVO_PWM_PERIOD_US  20000
#define SERVO_PULSE_MIN_US   500          // pulso a 0 grados
#define SERVO_PULSE_MAX_US   2500          // pulso a 180 grados
#define SERVO_MIN_ANGLE      10            // límite mecánico (servos.h)
#define SERVO_NEUTRAL        90
#define SERVO_MAX_ANGLE      170
// Geometría exacta NEUN (1:1 con neun_model.bin y simulador 3D neun3d.js):
//   +X = adelante (sensor ultrasónico) | +Y = izquierda | +Z = arriba
// La cinemática inversa proyecta objetivos fuera del alcance al borde seguro.
#define SERVO_HIP_OFFSET_X_MM      48.0f  // media distancia longitudinal entre caderas
#define SERVO_HIP_OFFSET_Y_MM      39.0f  // media distancia lateral entre caderas
#define SERVO_COXA_LENGTH_MM       32.0f  // eje C (cadera) -> eje F (fémur)
#define SERVO_FEMUR_LENGTH_MM      60.0f  // eje F (fémur)  -> eje T (tibia)
#define SERVO_TIBIA_LENGTH_MM      90.0f  // eje T (tibia)  -> punta del pie
#define SERVO_STAND_HEIGHT_MM      49.0f  // altura de caderas al piso en STAND (igual a 3D)
#define SERVO_STAND_RADIAL_MM      93.0f  // alcance horizontal eje F -> pie en STAND (igual a 3D)
#define SERVO_STAND_SPLAY_DEG      17.2f  // apertura en X de la coxa (±0.30 rad = ±17.2°)

// Recorridos cartesianos limpios e identicos 1:1 a la simulacion 3D (neun3d.js, legScale=150 mm):
//   - Trayectoria C2 de minimo tiron (10p^3 - 15p^4 + 6p^5) + elevacion sin^2(pi*p) -> cero golpes!
//   - speed (0..100%) controla la FRECUENCIA de paso, NO encoge la zancada.
#define SERVO_STRIDE_MM            54.0f  // largo total del paso WALK (0.36 * 150 mm)
#define SERVO_LIFT_MM              31.5f  // despeje vertical del pie en SWING (0.21 * 150 mm)
#define SERVO_BODY_DROP_MAX_MM     29.0f  // máximo descenso seguro (bodyZ = -1)
#define SERVO_BODY_RISE_MAX_MM     48.0f  // máximo ascenso seguro  (bodyZ = +1)
#define SERVO_BODY_HEIGHT_MM       38.0f  // compatibilidad / amplitud de referencia
// Ritmo de actualización del generador de marcha (50 Hz): NO usar el mismo
// ritmo que el muestreo del IMU para no saturar el bus I2C compartido.
#define SERVO_UPDATE_MS      20
// Velocidad de la marcha en Hz para speed = 0 y speed = 100.
#define SERVO_GAIT_HZ_MIN    0.28f
#define SERVO_GAIT_HZ_MAX    1.85f
// Suavizado anti-vibracion (filtro 2do orden criticamente amortiguado + banda muerta):
//   - Desfase de pulsos PWM en PCA9685 (340 ticks/canal) para eliminar caidas de 5V a 50Hz.
//   - Banda muerta con histeresis en ticks para eliminar el zumbido/temblor en reposo.
//   - Rampa de arranque suave desde la postura previa leida (PCA9685 / NVS) hasta STAND.
#define SERVO_RAMP_ALPHA         0.16f
#define SERVO_SLEW_ALPHA         0.36f  // compatibilidad de firma
#define SERVO_BOOT_RAMP_S        1.20f  // segundos de transicion suave al iniciar -> STAND
#define SERVO_MODE_BLEND_S       0.32f  // segundos de transicion suave entre modos
#define SERVO_OMEGA_BOOT         12.0f  // rad/s en arranque inicial
#define SERVO_OMEGA_NORMAL       24.0f  // rad/s en marcha y rutinas (zeta=1 -> sin rebote)
#define SERVO_OMEGA_JUMP         32.0f  // rad/s en salto
#define SERVO_MAX_VEL_BOOT       95.0f  // deg/s maximo durante arranque a STAND
#define SERVO_MAX_VEL_NORMAL    240.0f  // deg/s maximo en marcha/rutinas (cero tirones)
#define SERVO_MAX_VEL_JUMP      360.0f  // deg/s maximo en salto
#define SERVO_MAX_ACCEL_NORMAL 2200.0f  // deg/s^2 limite de aceleracion (elimina vibracion)
#define SERVO_DEADBAND_COUNTS     1.35f // histeresis PWM (~0.59 deg) -> cero vibracion/zumbido
#define SERVO_PHASE_STEP_TICKS  340     // 12 * 340 = 4080 < 4096 (pulsos escalonados en 20ms)

// ------------------------------ NeoPixel (8x8) -------------------------------
// Brillo global por defecto en % (0-100). 64 LEDs a blanco pleno piden ~3.8 A,
// asi que el techo se limita aqui y el panel solo puede bajarlo.
#define NEOPIXEL_DEFAULT_BRIGHTNESS 40     // %
#define NEOPIXEL_MAX_BRIGHTNESS     80     // % (techo de seguridad)
// Refresco de las animaciones propias del firmware (no afecta a led_pixel,
// que se vuelca inmediatamente).
#define NEOPIXEL_ANIM_MS      40

// -------------------------- Ultrasonic (HC-SR04) -----------------------------
// El HC-SR04 necesita ~50-60 ms entre mediciones (ida y vuelta del ultrasonido).
#define ULTRASONIC_PERIOD_MS  60
#define ULTRASONIC_TIMEOUT_US 25000        // ~4.3 m: mas alla no hay eco valido
#define ULTRASONIC_SAMPLES    3            // mediana de 3 para filtrar el ruido
#define ULTRASONIC_MIN_CM     2.0f         // debajo -> lectura absurda
#define ULTRASONIC_MAX_CM     400.0f       // limite del modulo
#define ULTRASONIC_ONLINE_TIMEOUT_MS 1000  // eco reciente requerido para ONLINE

// -------------------------------- IR (TCRT5000) ------------------------------
#define IR_PERIOD_MS          50
#define IR_SAMPLES            8            // promedio de 8 lecturas ADC
// Lectura clavada en 0 o en el techo del ADC durante este numero de muestras
// seguidas = sensor desconectado (no se publica un valor inventado).
#define IR_STUCK_LIMIT        20
#define IR_RAW_MAX            4095
#define IR_DISCONNECTED_THRESHOLD 8       // pulldown: GPIO libre queda cerca de 0
#define IR_THRESHOLD          2048         // por encima = superficie clara

// ------------------------------ Buzzer (LEDC) --------------------------------
// Límites del protocolo del panel PC (ver esp32/README.md).
#define BUZZER_LEDC_CHANNEL      0        // canal PWM (solo Arduino core 2.x)
#define BUZZER_LEDC_RESOLUTION   8        // bits -> duty 0..255
#define BUZZER_FREQ_MIN_HZ       100
#define BUZZER_FREQ_MAX_HZ       4000
#define BUZZER_DURATION_MIN_MS   50
#define BUZZER_DURATION_MAX_MS   5000
#define BUZZER_DEFAULT_FREQ_HZ   880
#define BUZZER_DEFAULT_DURATION_MS 150
#define BUZZER_DEFAULT_VOLUME    70

// ------------------------------ Headlights (LEDC) -----------------------------
// Linterna frontal: un pin GPIO → PWM (LEDC) → dos LEDs en paralelo.
#define HEADLIGHT_PIN            16        // pin libre (no usado por UART ni I2C)
#define HEADLIGHT_LEDC_CHANNEL    1        // canal PWM dedicado (no compartido con buzzer)
#define HEADLIGHT_LEDC_RESOLUTION 8        // bits -> rango 0..255
#define HEADLIGHT_LEDC_FREQ_HZ   1000       // frecuencia fija adecuada para LEDs
#define HEADLIGHT_DEFAULT_BRIGHTNESS 128    // 50% brillo al encender


// --------------------------------- IMU (MPU6050) ------------------------------
// Rangos fijos: el panel PC convierte los valores crudos con escalas de
// ±2g (16384 LSB/g) y ±250°/s (131.0 LSB/°/s). NO cambiar sin actualizar
// también pc/templates/index.html.
#define IMU_SAMPLE_PERIOD_MS     10       // muestreo a 100 Hz (no bloqueante)
#define IMU_FILTER_ALPHA         0.98f    // peso del gyro (filtro complementario)
#define IMU_CALIB_SAMPLES        1000     // muestras para offset del gyro (~1 s)
#define IMU_RETRY_MS             5000     // reintentar detección si está offline
#define IMU_ACC_G_MIN            0.70f    // guarda anti-vibración: |a| mínimo (g)
#define IMU_ACC_G_MAX            1.30f    // guarda anti-vibración: |a| máximo (g)

// ------------------------------ GPS (UART) ------------------------------------
// Modulo NMEA por UART (NEO-6M / BN-220 / ATGM336H). GPS TX -> ESP RX (GPS_RX_PIN).
#define GPS_ENABLED          true         // false si no hay modulo conectado
#define GPS_RX_PIN           17           // ESP32 RX  <- TX del GPS
#define GPS_TX_PIN           18           // ESP32 TX  -> RX del GPS (solo config)
#define GPS_BAUD             9600         // 9600 en NEO-6M; 115200 en algunos clones
#define GPS_RETRY_MS         5000         // re-deteccion si no llegan tramas NMEA
#define GPS_FIX_TIMEOUT_MS   5000         // sin fix valido -> fix=false

// --------------------------- Bateria (opcional) -------------------------------
// Divisor 100k/100k + 100nF sobre un ADC1 libre (GPIO4 = ADC1_CH3 en el ESP32-S3).
// Mientras este en false NO se publica battery (no se inventan valores).
#define BATTERY_SENSE_ENABLED false       // true cuando el divisor este cableado
#define BATTERY_ADC_PIN       4
#define BATTERY_DIVIDER       2.0f        // Vbat = Vadc * (R1+R2)/R2
#define BATTERY_EMPTY_V       6.40f       // AJUSTAR a la bateria real (2S LiPo)
#define BATTERY_FULL_V        8.40f       // AJUSTAR a la bateria real (2S LiPo)
#define BATTERY_PERIOD_MS     5000

// ----------------------------- Mando fisico ----------------------------------
#define MANDO_OFFLINE_MS     3000         // sin comandos frescos -> mando offline
#define MAX_STATIONS         4            // tope de estaciones publicadas en /api/status
// --------------------------- Webserver / failsafe -----------------------------
// Límites del API REST (comunicacion/webserver.cpp) y del watchdog de comandos
// (robot_state.cpp): failsafe ante pérdida de enlace con la PC o el mando físico.
#define WEB_MAX_BODY_BYTES   1024         // tamaño máximo del body JSON aceptado
#define WEB_REPORT_MS        30000        // reporte periódico del tráfico HTTP
#define ROBOT_CMD_TIMEOUT_MS 2500         // sin comandos frescos en manejo manual -> STOP

#endif  // CONFIG_H

// --------------------------------------------------------------------------
//  Tipos propios (definidos aqui porque el toolchain de
//  Arduino antepone los prototipos de las funciones)
// --------------------------------------------------------------------------

#define SERVO_LEGS        4

struct ImuRawSample {
  int16_t ax, ay, az, temp, gx, gy, gz;
};

enum BuzzerPattern : uint8_t {
  BUZZER_PATTERN_BEEP   = 0,
  BUZZER_PATTERN_SIREN,
  BUZZER_PATTERN_ALARM,
  BUZZER_PATTERN_RISE,
  BUZZER_PATTERN_FALL,
  BUZZER_PATTERN_CUSTOM,
  BUZZER_PATTERN_JURASSIC,
  BUZZER_PATTERN_JP3_VARIANT,
  BUZZER_PATTERN_PROXIMITY,
  BUZZER_PATTERN_UNKNOWN,
};

struct LegPose {
  float coxa;
  float femur;
  float tibia;
};

struct GaitDef {
  const char* name;
  float phase[SERVO_LEGS];
  float swingFraction;
};

struct WifiStaInfo {
  uint8_t mac[6];
  int8_t  rssi;      // dBm (promedio informado por el driver)
};

struct MandoProfileData {
  float    deadzone       = 0.08f;
  float    emaAlpha       = 0.30f;
  uint16_t heartbeatMs    = 200;
  uint8_t  sendRateHz     = 20;
  bool     invertX        = false;
  bool     invertY        = true;
  uint16_t potMin         = 60;
  uint16_t potMax         = 4020;
  uint8_t  speedMin       = 0;
  uint8_t  speedMax       = 100;
  uint8_t  ledBrightness  = 64;
  bool     buzzer         = true;
  char     modeButton[16] = "DANCE";
  float    bodyStep       = 0.50f;
};


// ==========================================================================
//  [01] ESTADO GLOBAL DEL ROBOT
//  fuente: robot_state.h
// ==========================================================================

#ifndef ROBOT_STATE_H
#define ROBOT_STATE_H


// ============================================================================
// Módulo RobotState — estado global del robot (Araña NEUN, ESP32-S3)
//
// Es el espejo local del estado que espera el Control Center PC
// (pc/app.py -> SpiderState: mode, speed, emergency_stop) y el punto único
// donde el webserver aplica los comandos de POST /api/command.
//
// Además implementa el WATCHDOG de comandos (failsafe): si el robot está en
// movimiento y dejan de llegar comandos frescos (ROBOT_CMD_TIMEOUT_MS), se
// fuerza la postura de reposo (STAND). Cubre la pérdida de enlace con la PC
// o con el mando físico ESP32-C3 (ver docs/PLAN_CONTROLADOR_ESP32-C3.txt).
//
// Comandos aceptados por el webserver (aplicados aquí):
//   mode <MODO>           STAND, WALK_FWD, TROT, CRAWL, TURN_LEFT, TURN_RIGHT,
//                         CRAB_LEFT, CRAB_RIGHT, TILT, DANCE, SENTRY, EXPLORE,
//                         SPIRAL, JUMP, WAVE, PUSHUP, FOLLOW, SLEEP
//   move <dir>            forward | backward | left | right | stop
//   joystick {x,y}        vector normalizado -1.00 .. 1.00
//   rotate -1.00 .. 1.00  giro sobre eje propio (yaw)
//   speed 0..100          velocidad global
//   body {z}  -1.00..1.00 altura del chasis (lo aplicará el módulo servos)
//   emergency true|false  parada de emergencia con latch
//   stabilize true|false  giroestabilizador (IMU)
//
// Publicado en GET /api/status (además de sensors.*):
//   mode, speed, emergency_stop, stabilize, move, joystick{x,y}, rotate,
//   body{z}, last_command{cmd,source,age_ms}, commands_total, watchdog_trips
// ============================================================================

struct RobotState {
  // --- estado que refleja pc/app.py -> SpiderState --------------------------
  String   mode          = "STAND";   // modo de marcha (ver plan de servos)
  uint8_t  speed         = 50;        // 0..100 %
  bool     emergencyStop = false;     // parada de emergencia (latch)
  bool     stabilize     = false;     // giroestabilizador por IMU

  // --- entradas analógicas (mando físico / panel PC) ------------------------
  String   move          = "stop";    // forward|backward|left|right|crab_left|crab_right|turn_left|turn_right|stop
  float    joyX          = 0.0f;      // -1..1 (+ derecha)
  float    joyY          = 0.0f;      // -1..1 (+ adelante)
  float    rotate        = 0.0f;      // -1..1 (+ horario)
  float    bodyZ         = 0.0f;      // -1..1 (altura del chasis)
  float    bodyPitch     = 0.0f;      // -1..1 (inclinacion adelante/atras)
  float    bodyRoll      = 0.0f;      // -1..1 (inclinacion izquierda/derecha)

  // --- diagnóstico y watchdog ----------------------------------------------
  uint32_t lastCommandMs = 0;         // millis() del último comando aplicado
  uint32_t lastManualMs  = 0;         // millis() del último comando de manejo manual
  char     lastCommand[24] = "";      // nombre del último comando
  char     lastSource[8]   = "none";  // pc | mando | serial
  uint32_t commandsTotal   = 0;       // comandos aplicados desde el arranque
  uint32_t watchdogTrips   = 0;       // veces que actuó el failsafe
};

extern RobotState robotState;

// Inicializa el estado con los valores por defecto y loguea el modo inicial.
void robotStateInit();

// ------------------------- Setters de comandos ------------------------------
// Todos devuelven false si el valor es inválido (el webserver responde 400).
bool robotStateSetMode(const char* mode);
bool robotStateSetSpeed(int speed);
bool robotStateSetMove(const char* dir);
bool robotStateSetJoystick(float x, float y);
bool robotStateSetRotate(float rate);
bool robotStateSetBodyZ(float z);
bool robotStateSetBodyTilt(float pitch, float roll);
void robotStateSetEmergency(bool on);
void robotStateSetStabilize(bool on);

// ------------------------------ Consultas -----------------------------------
bool        robotStateIsValidMode(const char* mode);
const char* robotStateGetValidModesCsv();   // "STAND, WALK_FWD, ..." (para el log)
bool        robotStateHasManualDrive();     // joystick / rotate / d-pad activo
bool        robotStateIsMoving();           // hay orden de locomoción activa
bool        robotStateCommandAllowed(const char* cmd);  // política del latch

// Registra que un comando fue aplicado: actualiza lastCommandMs (watchdog),
// contadores y deja traza en el Monitor Serie.
void robotStateNotifyCommand(const char* cmd, const char* source);

// Failsafe: llamar en cada iteración de loop() (no bloqueante).
void robotStateWatchdogUpdate();

#endif  // ROBOT_STATE_H

// ==========================================================================
//  [02] ESTADO GLOBAL DEL ROBOT
//  fuente: robot_state.cpp
// ==========================================================================

// ----------------------------------------------------------------------------
// Tabla de modos válidos: son los códigos exactos que usa el panel PC
// (pc/templates/index.html -> MOVE_MODES) y el plan de servos
// (docs/PLAN_CONTROL_SERVOS_PCA9685.txt -> MODOS CINEMÁTICOS).
// ----------------------------------------------------------------------------
static const char* const VALID_MODES[] = {
  "STAND", "WALK_FWD", "TROT", "CRAWL", "TURN_LEFT", "TURN_RIGHT",
  "CRAB_LEFT", "CRAB_RIGHT", "TILT", "DANCE", "SENTRY", "EXPLORE",
  "SPIRAL", "JUMP", "WAVE", "PUSHUP", "ELEVATE", "FOLLOW", "SLEEP",
};
static const uint8_t VALID_MODE_COUNT = sizeof(VALID_MODES) / sizeof(VALID_MODES[0]);

// Modos que implican locomoción activa (los vigila el watchdog).
static const char* const GAIT_MODES[] = {
  "WALK_FWD", "TROT", "CRAWL", "TURN_LEFT", "TURN_RIGHT",
  "CRAB_LEFT", "CRAB_RIGHT", "SPIRAL", "FOLLOW", "EXPLORE",
};
static const uint8_t GAIT_MODE_COUNT = sizeof(GAIT_MODES) / sizeof(GAIT_MODES[0]);

// Comandos que siguen admitidos con la parada de emergencia activa: son
// informativos (luces, sonido, consola) o el propio rearme. Todo lo que mueve
// el robot queda bloqueado hasta enviar {"cmd":"emergency","value":false}.
static const char* const ALLOWED_WHEN_LOCKED[] = {
  "emergency", "stabilize", "aux", "terminal",
  "buzzer", "buzzer_stop", "headlight",
  "led_pixel", "led_clear", "led_fill", "led_pattern", "brightness",
  "led_off", "led_color", "led_matrix", "led_brightness",
};
static const uint8_t ALLOWED_LOCKED_COUNT =
    sizeof(ALLOWED_WHEN_LOCKED) / sizeof(ALLOWED_WHEN_LOCKED[0]);

static char s_modesCsv[240] = "";   // "STAND,WALK_FWD,..." para logs

// Instancia global del estado (declarada extern en robot_state.h)
RobotState robotState;

// ----------------------------------------------------------------------------
// Helpers internos
// ----------------------------------------------------------------------------

static bool inList(const char* value, const char* const* list, uint8_t count) {
  if (!value) return false;
  for (uint8_t i = 0; i < count; i++) {
    if (strcasecmp(value, list[i]) == 0) return true;
  }
  return false;
}

static bool modeIsGait(const char* mode) {
  return inList(mode, GAIT_MODES, GAIT_MODE_COUNT);
}

// Acepta solo valores -1.00..1.00 (NaN incluido en el rechazo)
static bool inUnitRange(float v) {
  return !isnan(v) && v >= -1.0f && v <= 1.0f;
}

// ----------------------------------------------------------------------------
// Init
// ----------------------------------------------------------------------------
void robotStateInit() {
  robotState.mode          = "STAND";
  robotState.speed         = 50;
  robotState.emergencyStop = false;
  robotState.stabilize     = false;
  robotState.move          = "stop";
  robotState.joyX          = 0.0f;
  robotState.joyY          = 0.0f;
  robotState.rotate        = 0.0f;
  robotState.bodyZ         = 0.0f;
  robotState.bodyPitch     = 0.0f;
  robotState.bodyRoll      = 0.0f;

  robotState.lastCommandMs  = 0;
  robotState.lastManualMs   = 0;
  robotState.lastCommand[0] = '\0';
  strncpy(robotState.lastSource, "none", sizeof(robotState.lastSource) - 1);
  robotState.lastSource[sizeof(robotState.lastSource) - 1] = '\0';
  robotState.commandsTotal = 0;
  robotState.watchdogTrips = 0;

  // CSV de modos validos (se arma una sola vez)
  s_modesCsv[0] = '\0';
  for (uint8_t i = 0; i < VALID_MODE_COUNT; i++) {
    if (i) strncat(s_modesCsv, ",", sizeof(s_modesCsv) - strlen(s_modesCsv) - 1);
    strncat(s_modesCsv, VALID_MODES[i], sizeof(s_modesCsv) - strlen(s_modesCsv) - 1);
  }

  Serial.printf("[STATE] init | mode=STAND speed=50 | watchdog=%u ms | %u modos\n",
                (unsigned)ROBOT_CMD_TIMEOUT_MS, (unsigned)VALID_MODE_COUNT);
}
// ----------------------------------------------------------------------------
// Setters (validan; devuelven false si el valor no es admisible -> HTTP 400)
// ----------------------------------------------------------------------------
bool robotStateIsValidMode(const char* mode) {
  return inList(mode, VALID_MODES, VALID_MODE_COUNT);
}

const char* robotStateGetValidModesCsv() { return s_modesCsv; }

static bool isDriveCompatibleMode(const char* mode) {
  return !mode || !mode[0] ||
         strcasecmp(mode, "STAND") == 0 ||
         strcasecmp(mode, "WALK_FWD") == 0 ||
         strcasecmp(mode, "TROT") == 0 ||
         strcasecmp(mode, "CRAWL") == 0;
}

bool robotStateSetMode(const char* mode) {
  if (!robotStateIsValidMode(mode)) return false;
  robotState.mode = mode;
  robotState.mode.toUpperCase();   // codigos canonicos en mayusculas
  if (robotState.mode == "STAND") {
    robotState.move   = "stop";
    robotState.joyX   = 0.0f;
    robotState.joyY   = 0.0f;
    robotState.rotate = 0.0f;
  }
  return true;
}

bool robotStateSetSpeed(int speed) {
  if (speed < 0 || speed > 100) return false;
  robotState.speed = (uint8_t)speed;
  return true;
}

bool robotStateSetMove(const char* dir) {
  static const char* const DIRS[] = {
    "forward", "backward", "left", "right",
    "crab_left", "crab_right", "turn_left", "turn_right", "stop"
  };
  if (!inList(dir, DIRS, sizeof(DIRS) / sizeof(DIRS[0]))) return false;
  robotState.move = dir;
  robotState.move.toLowerCase();
  if (robotState.move == "stop") {
    robotState.joyX   = 0.0f;
    robotState.joyY   = 0.0f;
    robotState.rotate = 0.0f;
    robotState.mode   = "STAND";
  } else {
    robotState.joyX         = 0.0f;
    robotState.joyY         = 0.0f;
    robotState.rotate       = 0.0f;
    robotState.lastManualMs = millis();
    if (!isDriveCompatibleMode(robotState.mode.c_str())) {
      robotState.mode = "STAND";
    }
  }
  return true;
}

bool robotStateSetJoystick(float x, float y) {
  if (!inUnitRange(x) || !inUnitRange(y)) return false;
  robotState.joyX = x;
  robotState.joyY = y;
  if (fabsf(x) > 0.05f || fabsf(y) > 0.05f) {
    robotState.move         = "stop";
    robotState.lastManualMs = millis();
    if (!isDriveCompatibleMode(robotState.mode.c_str())) {
      robotState.mode = "STAND";
    }
  }
  return true;
}

bool robotStateSetRotate(float rate) {
  if (!inUnitRange(rate)) return false;
  robotState.rotate = rate;
  if (fabsf(rate) > 0.05f) {
    robotState.lastManualMs = millis();
    if (!isDriveCompatibleMode(robotState.mode.c_str())) {
      robotState.mode = "STAND";
    }
  }
  return true;
}

bool robotStateSetBodyZ(float z) {
  if (!inUnitRange(z)) return false;
  robotState.bodyZ = z;
  return true;
}

bool robotStateSetBodyTilt(float pitch, float roll) {
  if (!inUnitRange(pitch) || !inUnitRange(roll)) return false;
  robotState.bodyPitch = pitch;
  robotState.bodyRoll  = roll;
  return true;
}

void robotStateSetEmergency(bool on) {
  if (on && !robotState.emergencyStop) {
    // Al activarse se corta TODA orden de locomocion (posicion segura).
    robotState.move      = "stop";
    robotState.joyX      = 0.0f;
    robotState.joyY      = 0.0f;
    robotState.rotate    = 0.0f;
    robotState.bodyZ     = 0.0f;
    robotState.bodyPitch = 0.0f;
    robotState.bodyRoll  = 0.0f;
    if (modeIsGait(robotState.mode.c_str())) robotState.mode = "STAND";
    Serial.println(F("[STATE] EMERGENCY ON  -> locomocion bloqueada (latch)"));
  } else if (!on && robotState.emergencyStop) {
    Serial.println(F("[STATE] EMERGENCY OFF -> rearme, robot en STAND"));
  }
  robotState.emergencyStop = on;
}

void robotStateSetStabilize(bool on) {
  robotState.stabilize = on;
}

// ----------------------------------------------------------------------------
// Consultas
// ----------------------------------------------------------------------------
bool robotStateHasManualDrive() {
  if (robotState.emergencyStop) return false;
  if (robotState.move != "stop") return true;
  if (fabsf(robotState.joyX) > 0.05f || fabsf(robotState.joyY) > 0.05f) return true;
  if (fabsf(robotState.rotate) > 0.05f) return true;
  return false;
}

bool robotStateIsMoving() {
  if (robotState.emergencyStop) return false;          // bloqueado
  if (modeIsGait(robotState.mode.c_str())) return true;
  return robotStateHasManualDrive();
}

bool robotStateCommandAllowed(const char* cmd) {
  if (!cmd) return false;
  if (!robotState.emergencyStop) return true;
  // Con el latch activo solo pasan los comandos informativos y el rearme.
  // Ojo: "mode" se valida aparte en el webserver (solo se admite STAND).
  return inList(cmd, ALLOWED_WHEN_LOCKED, ALLOWED_LOCKED_COUNT);
}

void robotStateNotifyCommand(const char* cmd, const char* source) {
  robotState.lastCommandMs = millis();
  robotState.commandsTotal++;
  strncpy(robotState.lastCommand, cmd ? cmd : "?", sizeof(robotState.lastCommand) - 1);
  robotState.lastCommand[sizeof(robotState.lastCommand) - 1] = '\0';
  if (source && *source) {
    strncpy(robotState.lastSource, source, sizeof(robotState.lastSource) - 1);
    robotState.lastSource[sizeof(robotState.lastSource) - 1] = '\0';
  }

  Serial.printf("[CMD] #%lu %s (fuente=%s) | mode=%s speed=%u move=%s joy=%.2f/%.2f rot=%.2f body=%.2f emg=%s\n",
                (unsigned long)robotState.commandsTotal, robotState.lastCommand,
                robotState.lastSource, robotState.mode.c_str(),
                (unsigned)robotState.speed, robotState.move.c_str(),
                robotState.joyX, robotState.joyY, robotState.rotate,
                robotState.bodyZ, robotState.emergencyStop ? "ON" : "OFF");
}

// ----------------------------------------------------------------------------
// Watchdog / failsafe (no bloqueante): si hay manejo manual continuo activo
// (joystick, D-pad o rotacion) y dejan de llegar heartbeats frescos, frena el
// manejo manual (perdida de enlace con PC o mando). Los modos autonomos/rutinas
// elegidos por boton (WALK_FWD, TROT, ELEVATE, etc.) siguen activos hasta
// que el usuario pulse STAND, STOP o Emergencia.
// ----------------------------------------------------------------------------
void robotStateWatchdogUpdate() {
  if (!robotStateHasManualDrive()) return;

  const uint32_t refMs = robotState.lastManualMs ? robotState.lastManualMs : robotState.lastCommandMs;
  if (refMs == 0) return;

  const uint32_t now = millis();
  if ((now - refMs) < ROBOT_CMD_TIMEOUT_MS) return;

  robotState.watchdogTrips++;
  Serial.printf("[WATCH] manejo manual sin heartbeat por %lu ms -> STOP (trip #%lu)\n",
                (unsigned long)(now - refMs),
                (unsigned long)robotState.watchdogTrips);

  robotState.move   = "stop";
  robotState.joyX   = 0.0f;
  robotState.joyY   = 0.0f;
  robotState.rotate = 0.0f;
  robotState.lastManualMs  = now;
  robotState.lastCommandMs = now;
}

// ==========================================================================
//  [03] SENSOR · IMU (MPU6050)
//  fuente: imu.h
// ==========================================================================

#ifndef SENSORES_IMU_H
#define SENSORES_IMU_H


// ============================================================================
// Módulo IMU (MPU6050 por I2C) — Araña Robot
//
// Lee acelerómetro + giroscopio + temperatura y publica los mismos campos que
// espera el Control Center PC (pc/app.py -> SensorState.imu), para que el
// futuro webserver los exponga en /api/status -> sensors.imu:
//
//   online  bool   detectado y leyendo bien
//   pitch/roll/yaw float en grados (filtro complementario)
//   ax/ay/az int16 crudos escala ±2g (16384 LSB/g)
//   gx/gy/gz int16 crudos escala ±250°/s (131.0 LSB/°/s)
//   temp    float  °C
//
// Actitud:
//   - pitch/roll: filtro complementario gyro+accel (IMU_FILTER_ALPHA).
//     El accel solo se usa si |a| está entre IMU_ACC_G_MIN y IMU_ACC_G_MAX
//     (guarda anti-vibración para cuando camine el robot).
//   - yaw: integración del gyro calibrado (el MPU6050 no tiene magnetómetro,
//     por lo que deriva lentamente; es lo esperado por el panel PC).
//
// Muestreo NO bloqueante a 100 Hz: llamar a imuUpdate() desde loop().
// Si el chip no responde al arranque (o se desconecta), online=false y se
// reintenta la detección cada IMU_RETRY_MS sin bloquear el loop.
// ============================================================================

// Inicializa I2C (GPIO8/9), detecta el MPU6050 en 0x68 o 0x69, configura rangos
// ±2g / ±250°/s y calibra offsets de giroscopio (~1 s con el robot QUIETO).
void imuInit();

// Muestreo + filtro de actitud. Llamar en cada iteración de loop().
void imuUpdate();

// Recalibra offsets de giroscopio (bloqueante ~1 s, robot quieto).
// Devuelve true si tuvo éxito.
bool imuRecalibrate();

bool        imuIsOnline();      //                       -> sensors.imu.online
uint8_t     imuGetI2cAddress(); // direccion encontrada (0x68 o 0x69)
float       imuGetPitch();      // grados                -> sensors.imu.pitch
float       imuGetRoll();       // grados                -> sensors.imu.roll
float       imuGetYaw();        // grados 0..360         -> sensors.imu.yaw
int16_t     imuGetAx();         // crudo ±2g             -> sensors.imu.ax
int16_t     imuGetAy();         // crudo ±2g             -> sensors.imu.ay
int16_t     imuGetAz();         // crudo ±2g             -> sensors.imu.az
int16_t     imuGetGx();         // crudo ±250°/s         -> sensors.imu.gx
int16_t     imuGetGy();         // crudo ±250°/s         -> sensors.imu.gy
int16_t     imuGetGz();         // crudo ±250°/s         -> sensors.imu.gz
float       imuGetTempC();      // °C                    -> sensors.imu.temp

#endif  // SENSORES_IMU_H

// ==========================================================================
//  [04] SENSOR · IMU (MPU6050)
//  fuente: imu.cpp
// ==========================================================================

// ============================================================================
// Módulo IMU (MPU6050) — Araña Robot (ESP32-S3)
//
// Driver I2C directo para MPU6050/MPU6500 compatible (GPIO8=SDA, GPIO9=SCL,
// dirección 0x68 o 0x69 según AD0). Lee una ráfaga de 14 bytes desde ACCEL_XOUT_H.
//
// Publica los valores con la escala que espera el panel PC:
//   ax/ay/az crudos ±2g  -> el frontend divide por 16384 para obtener G
//   gx/gy/gz crudos ±250°/s -> el frontend divide por 131.0 para obtener °/s
//   pitch/roll/yaw en grados, temp en °C.
//
// Actitud por filtro complementario (ver imu.h). Muestreo no bloqueante a
// 100 Hz desde loop(). Lectura robusta: si el chip falla o se desconecta,
// se marca offline y se reintenta cada IMU_RETRY_MS.
//
// Compatible con el estado del simulador de la PC: al arrancar con el robot
// quieto, yaw arranca en 0 y pitch/roll toman el valor real del acelerómetro.
// ============================================================================


// ----------------------------------------------------------------------------
// Estado interno
// ----------------------------------------------------------------------------
static uint8_t s_i2cAddr = MPU6050_I2C_ADDR;

static bool    imu_s_online      = false;   // chip detectado y leyendo bien
static uint32_t imu_s_nextRetryMs = 0;       // próximo intento de detección
static uint8_t imu_s_readErrors  = 0;       // lecturas fallidas consecutivas

static float   s_pitchDeg    = 0.0f;    // actitud filtrada
static float   s_rollDeg     = 0.0f;
static float   s_yawDeg      = 0.0f;

static float   s_gxOff       = 0.0f;    // offsets del gyro (°/s)
static float   s_gyOff       = 0.0f;
static float   s_gzOff       = 0.0f;
static int16_t s_ax = 0, s_ay = 0, s_az = 0;   // últimos crudos publicados
static int16_t s_gx = 0, s_gy = 0, s_gz = 0;
static float   imu_s_tempC       = 0.0f;

static uint32_t s_lastSampleUs = 0;        // para dt del filtro
static bool     s_haveLastUs   = false;

// Conversiones de unidades (constantes físicas + escalas del protocolo)
static const float RAW_PER_G   = 16384.0f;         // escala ±2g
static const float RAW_PER_DPS = 131.0f;           // escala ±250°/s
static const float DEG_PER_RAD = 57.29577951f;     // radianes -> grados
static const float TEMP_LSB_PER_C = 340.0f;
static const float TEMP_OFFSET_C = 36.53f;

static const uint8_t MPU_REG_SMPLRT_DIV = 0x19;
static const uint8_t MPU_REG_CONFIG = 0x1A;
static const uint8_t MPU_REG_GYRO_CONFIG = 0x1B;
static const uint8_t MPU_REG_ACCEL_CONFIG = 0x1C;
static const uint8_t MPU_REG_ACCEL_XOUT_H = 0x3B;
static const uint8_t MPU_REG_PWR_MGMT_1 = 0x6B;
static const uint8_t MPU_REG_WHO_AM_I = 0x75;

/* [tipo ImuRawSample definido arriba] */

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

// Satura un float al rango de un int16 antes de castear.
static int16_t clampToI16(float v) {
  if (v >  32767.0f) return  32767;
  if (v < -32768.0f) return -32768;
  return (int16_t)v;
}

static bool readRegisters(uint8_t address, uint8_t reg, uint8_t* data, uint8_t length) {
  if (!data || length == 0) return false;
  Wire.beginTransmission(address);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;
  const uint8_t received = Wire.requestFrom(address, length);
  if (received != length) {
    while (Wire.available()) Wire.read();
    return false;
  }
  for (uint8_t i = 0; i < length; i++) {
    if (!Wire.available()) return false;
    data[i] = (uint8_t)Wire.read();
  }
  return true;
}

static bool readRegister(uint8_t address, uint8_t reg, uint8_t& value) {
  return readRegisters(address, reg, &value, 1);
}

static bool writeRegister(uint8_t address, uint8_t reg, uint8_t value) {
  Wire.beginTransmission(address);
  Wire.write(reg);
  Wire.write(value);
  return Wire.endTransmission() == 0;
}

static int16_t signedWord(const uint8_t* bytes) {
  return (int16_t)(((uint16_t)bytes[0] << 8) | bytes[1]);
}

static bool readRawSample(ImuRawSample& sample) {
  uint8_t bytes[14];
  if (!readRegisters(s_i2cAddr, MPU_REG_ACCEL_XOUT_H, bytes, sizeof(bytes))) return false;
  sample.ax = signedWord(&bytes[0]);
  sample.ay = signedWord(&bytes[2]);
  sample.az = signedWord(&bytes[4]);
  sample.temp = signedWord(&bytes[6]);
  sample.gx = signedWord(&bytes[8]);
  sample.gy = signedWord(&bytes[10]);
  sample.gz = signedWord(&bytes[12]);
  return true;
}

static bool configureSensor(uint8_t address) {
  // PWR_MGMT_1 (0x6B)=0 despierta el chip; SMPLRT_DIV=9 fija 100 Hz
  // con DLPF activo. GYRO_CONFIG=0: ±250 °/s; ACCEL_CONFIG=0: ±2 g.
  if (!writeRegister(address, MPU_REG_PWR_MGMT_1, 0x00)) return false;
  delay(100);
  if (!writeRegister(address, MPU_REG_SMPLRT_DIV, 0x09) ||
      !writeRegister(address, MPU_REG_CONFIG, 0x04) ||
      !writeRegister(address, MPU_REG_GYRO_CONFIG, 0x00) ||
      !writeRegister(address, MPU_REG_ACCEL_CONFIG, 0x00)) return false;

  uint8_t pwr = 0xFF, gyroCfg = 0xFF, accelCfg = 0xFF;
  return readRegister(address, MPU_REG_PWR_MGMT_1, pwr) && (pwr & 0x40) == 0 &&
         readRegister(address, MPU_REG_GYRO_CONFIG, gyroCfg) && (gyroCfg & 0x18) == 0 &&
         readRegister(address, MPU_REG_ACCEL_CONFIG, accelCfg) && (accelCfg & 0x18) == 0;
}

// Detecta el chip por ACK + WHO_AM_I y configura sus registros directamente.
static bool tryDetect() {
  if (!Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN)) return false;
  const uint8_t alternateAddr = (MPU6050_I2C_ADDR == 0x68) ? 0x69 : 0x68;
  const uint8_t candidates[] = {MPU6050_I2C_ADDR, alternateAddr};
  for (uint8_t addr : candidates) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() != 0) continue;
    uint8_t whoAmI = 0;
    if (!readRegister(addr, MPU_REG_WHO_AM_I, whoAmI)) continue;
    // MPU6050 devuelve 0x68; algunos módulos compatibles MPU6500 devuelven 0x70.
    if (whoAmI != 0x68 && whoAmI != 0x70) continue;
    s_i2cAddr = addr;
    if (!configureSensor(addr)) continue;
    Serial.printf("[IMU] WHO_AM_I=0x%02X en direccion I2C 0x%02X\n", whoAmI, addr);
    return true;
  }
  return false;
}

// Calibra offsets de giroscopio con lecturas crudas; dejar el robot quieto.
static bool calibrateGyroOffsets() {
  double sx = 0, sy = 0, sz = 0;
  uint16_t valid = 0;
  const uint16_t N = IMU_CALIB_SAMPLES;

  Serial.printf("[IMU] Calibrando giroscopio (%u muestras, no mover el robot)...\n",
                (unsigned)N);
  for (uint16_t i = 0; i < N; i++) {
    ImuRawSample sample;
    if (readRawSample(sample)) {
      sx += (double)sample.gx / RAW_PER_DPS;
      sy += (double)sample.gy / RAW_PER_DPS;
      sz += (double)sample.gz / RAW_PER_DPS;
      valid++;
    }
    delay(1);
  }
  if (valid < (uint16_t)(N * 9U / 10U)) {
    Serial.printf("[IMU] calibracion incompleta: %u/%u lecturas I2C validas\n",
                  (unsigned)valid, (unsigned)N);
    return false;
  }
  s_gxOff = (float)(sx / valid);
  s_gyOff = (float)(sy / valid);
  s_gzOff = (float)(sz / valid);
  Serial.printf("[IMU] Offsets gyro -> x=%.3f y=%.3f z=%.3f °/s\n",
                s_gxOff, s_gyOff, s_gzOff);
  return true;
}

// Inicializa pitch/roll desde el acelerómetro (robot quieto al arrancar).
static void seedAnglesFromAccel(const ImuRawSample& sample) {
  const float axg = sample.ax / RAW_PER_G;
  const float ayg = sample.ay / RAW_PER_G;
  const float azg = sample.az / RAW_PER_G;

  s_rollDeg  = atan2f(ayg, azg) * DEG_PER_RAD;
  s_pitchDeg = atan2f(-axg, sqrtf(ayg * ayg + azg * azg)) * DEG_PER_RAD;
  s_yawDeg   = 0.0f;
}

// Marca el módulo como offline y agenda reintento de detección.
static void goOffline(const char* reason) {
  // Solo avisa si estaba online: si ya lo estaba, calla. Si no, cada reintento
  // periodico (IMU_RETRY_MS = 5 s) escupiria el mismo OFFLINE sin nada nuevo.
  if (imu_s_online) {
    Serial.printf("[IMU] OFFLINE (%s)\n", reason ? reason : "error de lectura");
  }
  imu_s_online     = false;
  imu_s_readErrors = 0;
  imu_s_nextRetryMs = millis() + IMU_RETRY_MS;
}

// ----------------------------------------------------------------------------
// API pública
// ----------------------------------------------------------------------------

void imuInit() {
  imu_s_online = false;
  s_haveLastUs = false;

  if (!tryDetect()) {
    goOffline("no responde en 0x68 ni 0x69");
    return;
  }

  calibrateGyroOffsets();

  // Ángulos iniciales desde una ráfaga de registros crudos.
  ImuRawSample sample;
  if (!readRawSample(sample)) {
    goOffline("no se pueden leer registros 0x3B-0x48");
    return;
  }
  seedAnglesFromAccel(sample);
  s_ax = sample.ax; s_ay = sample.ay; s_az = sample.az;
  s_gx = sample.gx; s_gy = sample.gy; s_gz = sample.gz;
  imu_s_tempC = (sample.temp / TEMP_LSB_PER_C) + TEMP_OFFSET_C;
  s_haveLastUs = false;
  imu_s_online = true;
  Serial.printf("[IMU] ONLINE -> MPU en 0x%02X (100 Hz, filtro complementario)\n", s_i2cAddr);
}

void imuUpdate() {
  // --- Sin chip: reintentar detección periódicamente (hot-plug) ---
  if (!imu_s_online) {
    if ((int32_t)(millis() - imu_s_nextRetryMs) >= 0) {
      if (tryDetect()) {
        calibrateGyroOffsets();
        ImuRawSample initialSample;
        if (!readRawSample(initialSample)) {
          imu_s_nextRetryMs = millis() + IMU_RETRY_MS;
          return;
        }
        seedAnglesFromAccel(initialSample);
        s_haveLastUs = false;
        imu_s_online = true;
        imu_s_readErrors = 0;
        Serial.printf("[IMU] ONLINE (reconectado en 0x%02X)\n", s_i2cAddr);
      } else {
        imu_s_nextRetryMs = millis() + IMU_RETRY_MS;
      }
    }
    return;
  }

  // --- Muestreo a ritmo fijo ---
  const uint32_t nowUs = micros();
  if (s_haveLastUs && (nowUs - s_lastSampleUs) < (IMU_SAMPLE_PERIOD_MS * 1000UL)) {
    return;
  }

  float dt;
  if (!s_haveLastUs) {
    dt = (float)IMU_SAMPLE_PERIOD_MS / 1000.0f;
  } else {
    dt = (float)(nowUs - s_lastSampleUs) / 1000000.0f;   // seguro ante overflow
  }
  s_lastSampleUs = nowUs;
  s_haveLastUs   = true;

  ImuRawSample sample;
  if (!readRawSample(sample)) {
    if (++imu_s_readErrors >= 10) goOffline("10 lecturas consecutivas fallidas");
    return;
  }
  imu_s_readErrors = 0;
  imu_s_tempC = (sample.temp / TEMP_LSB_PER_C) + TEMP_OFFSET_C;

  // --- Conversión a unidades útiles ---
  const float axg  = sample.ax / RAW_PER_G;
  const float ayg  = sample.ay / RAW_PER_G;
  const float azg  = sample.az / RAW_PER_G;
  const float gxDps = sample.gx / RAW_PER_DPS - s_gxOff;
  const float gyDps = sample.gy / RAW_PER_DPS - s_gyOff;
  const float gzDps = sample.gz / RAW_PER_DPS - s_gzOff;

  // Crudos en escala del protocolo (para sensors.imu.ax..gz)
  s_ax = clampToI16(axg  * RAW_PER_G);
  s_ay = clampToI16(ayg  * RAW_PER_G);
  s_az = clampToI16(azg  * RAW_PER_G);
  s_gx = clampToI16(gxDps * RAW_PER_DPS);
  s_gy = clampToI16(gyDps * RAW_PER_DPS);
  s_gz = clampToI16(gzDps * RAW_PER_DPS);

  // --- Filtro complementario ---
  // Pitch/roll: integra gyro y corrige suavemente con el acelerómetro.
  // El accel solo aporta si |a| ~ 1g (guarda anti-vibración: al caminar el
  // robot las aceleraciones lineales ensucian el ángulo real).
  const float magG = sqrtf(axg * axg + ayg * ayg + azg * azg);
  const bool  useAccel = (magG >= IMU_ACC_G_MIN) && (magG <= IMU_ACC_G_MAX);

  s_pitchDeg += gxDps * dt;
  s_rollDeg  += gyDps * dt;
  s_yawDeg   += gzDps * dt;              // solo gyro: deriva esperada

  if (useAccel) {
    const float pitchAcc = atan2f(-axg, sqrtf(ayg * ayg + azg * azg)) * DEG_PER_RAD;
    const float rollAcc  = atan2f(ayg, azg) * DEG_PER_RAD;
    const float kAcc     = 1.0f - IMU_FILTER_ALPHA;
    s_pitchDeg = IMU_FILTER_ALPHA * s_pitchDeg + kAcc * pitchAcc;
    s_rollDeg  = IMU_FILTER_ALPHA * s_rollDeg  + kAcc * rollAcc;
  }

  // Wrap de ángulos: pitch/roll a ±180°, yaw a 0..360° (como el simulador PC)
  if (s_pitchDeg >  180.0f) s_pitchDeg -= 360.0f;
  if (s_pitchDeg < -180.0f) s_pitchDeg += 360.0f;
  if (s_rollDeg  >  180.0f) s_rollDeg  -= 360.0f;
  if (s_rollDeg  < -180.0f) s_rollDeg  += 360.0f;
  while (s_yawDeg >= 360.0f) s_yawDeg -= 360.0f;
  while (s_yawDeg <    0.0f) s_yawDeg += 360.0f;
}

bool imuRecalibrate() {
  if (!imu_s_online) {
    Serial.println(F("[IMU] error: no hay chip conectado"));
    return false;
  }
  calibrateGyroOffsets();
  return true;
}  

bool    imuIsOnline() { return imu_s_online; }
uint8_t imuGetI2cAddress() { return s_i2cAddr; }
float   imuGetPitch() { return s_pitchDeg; }
float   imuGetRoll()  { return s_rollDeg; }
float   imuGetYaw()   { return s_yawDeg; }
int16_t imuGetAx()    { return s_ax; }
int16_t imuGetAy()    { return s_ay; }
int16_t imuGetAz()    { return s_az; }
int16_t imuGetGx()    { return s_gx; }
int16_t imuGetGy()    { return s_gy; }
int16_t imuGetGz()    { return s_gz; }
float   imuGetTempC() { return imu_s_tempC; }

// ==========================================================================
//  [05] SENSOR · GPS (NEO-6M)
//  fuente: gps.h
// ==========================================================================

#ifndef SENSORES_GPS_H
#define SENSORES_GPS_H


// ============================================================================
// Modulo GPS (NMEA por UART) - Arana Robot (ESP32-S3)
//
// Modulos soportados: NEO-6M, BN-220, ATGM336H y similares (NMEA 0183 a 9600).
// Cableado (config.h):
//   GPS TX  -> ESP GPIO17 (GPS_RX_PIN)
//   GPS RX  -> ESP GPIO18 (GPS_TX_PIN, solo para configurar el modulo)
//   VCC 3V3 / GND comun
//
// Dos estados distintos, que NO hay que confundir:
//   online : llegan tramas NMEA por el UART (el modulo responde)
//   fix    : hay posicion valida y fresca (requiere cielo despejado)
//
// Publica en /api/status -> sensors.gps exactamente los campos que lee la PC:
//   online, fix, sats, hdop, lat, lon, alt_m, speed_kmh, course, utc, name, pin
// Con fix=false se envian lat/lon como null (nunca se inventan coordenadas).
//
// Muestreo NO bloqueante: llamar a gpsUpdate() desde loop().
// ============================================================================

void gpsInit();
void gpsUpdate();

bool    gpsIsOnline();      // llegan tramas NMEA            -> sensors.gps.online
bool    gpsHasFix();        // posicion valida y fresca      -> sensors.gps.fix
uint8_t gpsGetSats();       // satelites en uso              -> sensors.gps.sats
float   gpsGetHdop();       // precision horizontal          -> sensors.gps.hdop
double  gpsGetLat();        // grados (solo valido con fix)  -> sensors.gps.lat
double  gpsGetLon();        // grados (solo valido con fix)  -> sensors.gps.lon
float   gpsGetAltM();       // metros                        -> sensors.gps.alt_m
float   gpsGetSpeedKmh();   // km/h                          -> sensors.gps.speed_kmh
float   gpsGetCourse();     // grados 0-360                  -> sensors.gps.course
const char* gpsGetUtc();    // "hh:mm:ss"                    -> sensors.gps.utc
uint32_t    gpsGetAgeMs();  // antiguedad de la ultima posicion valida
uint32_t    gpsGetSentences();  // tramas NMEA decodificadas (diagnostico)

#endif  // SENSORES_GPS_H

// ==========================================================================
//  [06] SENSOR · GPS (NEO-6M)
//  fuente: gps.cpp
// ==========================================================================

// UART2 del ESP32-S3 (UART0 queda para la consola)
static HardwareSerial  s_uart(2);
static TinyGPSPlus     s_gps;

static bool     gps_s_online      = false;   // llegan tramas NMEA
static bool     s_fix         = false;   // posicion valida y fresca
static uint32_t s_lastByteMs  = 0;       // ultimo byte recibido
static uint32_t s_sentences   = 0;       // tramas decodificadas
static uint32_t gps_s_retries     = 0;

void gpsInit() {
  if (!GPS_ENABLED) {
    Serial.println(F("[GPS] deshabilitado en config.h (GPS_ENABLED=false)"));
    return;
  }
  s_uart.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.printf("[GPS] UART2 RX=GPIO%d TX=GPIO%d @%d bps | esperando tramas NMEA...\n",
                GPS_RX_PIN, GPS_TX_PIN, GPS_BAUD);
  Serial.println(F("[GPS] El primer fix puede tardar 30-60 s (mas bajo techo)"));
}

void gpsUpdate() {
  if (!GPS_ENABLED) return;

  const uint32_t now = millis();

  // Lectura no bloqueante: se decodifica lo que haya en el buffer del UART
  while (s_uart.available() > 0) {
    const char c = (char)s_uart.read();
    s_lastByteMs = now;
    if (s_gps.encode(c)) s_sentences++;
    if (!gps_s_online) {
      gps_s_online = true;
      Serial.printf("[GPS] modulo detectado (ONLINE) | tramas=%lu\n",
                    (unsigned long)s_sentences);
    }
  }

  // online = el modulo esta hablando (llegan bytes NMEA)
  if (gps_s_online && (now - s_lastByteMs) > GPS_RETRY_MS) {
    gps_s_online = false;
    s_fix    = false;
    gps_s_retries++;
    Serial.printf("[GPS] sin datos por %u ms -> OFFLINE (reintento #%lu; revisar TX/RX y baudios)\n",
                  (unsigned)GPS_RETRY_MS, (unsigned long)gps_s_retries);
  }

  // fix = posicion valida y fresca
  const bool fresh = (s_gps.location.isValid() && s_gps.location.age() < GPS_FIX_TIMEOUT_MS);
  if (fresh != s_fix) {
    s_fix = fresh;
    if (s_fix) {
      Serial.printf("[GPS] FIX ok | lat=%.6f lon=%.6f sats=%u hdop=%.1f\n",
                    s_gps.location.lat(), s_gps.location.lng(),
                    s_gps.satellites.isValid() ? s_gps.satellites.value() : 0,
                    s_gps.hdop.isValid() ? (float)s_gps.hdop.hdop() : 0.0f);
    } else {
      Serial.println(F("[GPS] FIX perdido"));
    }
  }
}

bool gpsIsOnline() { return GPS_ENABLED && gps_s_online; }
bool gpsHasFix()   { return GPS_ENABLED && s_fix; }

uint8_t gpsGetSats() {
  if (!gpsHasFix() || !s_gps.satellites.isValid()) return 0;
  const uint32_t v = s_gps.satellites.value();
  return (v > 255) ? 255 : (uint8_t)v;
}

float gpsGetHdop() {
  if (!s_gps.hdop.isValid()) return 0.0f;
  return (float)s_gps.hdop.hdop();
}

double gpsGetLat() { return gpsHasFix() ? s_gps.location.lat() : 0.0; }
double gpsGetLon() { return gpsHasFix() ? s_gps.location.lng() : 0.0; }

float gpsGetAltM() {
  if (!gpsHasFix() || !s_gps.altitude.isValid()) return 0.0f;
  return (float)s_gps.altitude.meters();
}

float gpsGetSpeedKmh() {
  if (!gpsHasFix() || !s_gps.speed.isValid()) return 0.0f;
  return (float)s_gps.speed.kmph();
}

float gpsGetCourse() {
  if (!gpsHasFix() || !s_gps.course.isValid()) return 0.0f;
  return (float)s_gps.course.deg();
}

const char* gpsGetUtc() {
  static char buf[12];
  if (!s_gps.time.isValid()) {
    buf[0] = 0;
    return buf;
  }
  snprintf(buf, sizeof(buf), "%02u:%02u:%02u",
           (unsigned)s_gps.time.hour(), (unsigned)s_gps.time.minute(), (unsigned)s_gps.time.second());
  return buf;
}

uint32_t gpsGetAgeMs() {
  if (!s_gps.location.isValid()) return 0;
  return s_gps.location.age();
}

uint32_t gpsGetSentences() { return s_sentences; }

// ==========================================================================
//  [07] SENSOR · BATERIA
//  fuente: battery.h
// ==========================================================================

#ifndef SENSORES_BATTERY_H
#define SENSORES_BATTERY_H


// ============================================================================
// Modulo Battery - medicion de la bateria del robot (OPCIONAL)
//
// Requiere un divisor resistivo 100k/100k + 100nF sobre un pin ADC1 libre
// (config.h: BATTERY_ADC_PIN, por defecto GPIO4 = ADC1_CH3 en el ESP32-S3).
//
// Mientras BATTERY_SENSE_ENABLED sea false el modulo NO mide y el webserver NO
// publica "battery": nunca se inventan valores (el panel PC lo simula aparte
// cuando esta en modo demo).
//
// Publica en /api/status -> battery { volts, percent, raw, online }.
// ============================================================================

void batteryInit();
void batteryUpdate();      // muestreo periodico no bloqueante (BATTERY_PERIOD_MS)

bool     batteryIsEnabled();
bool     batteryIsOnline();
float    batteryGetVolts();
uint8_t  batteryGetPercent();   // 0-100 estimado entre BATTERY_EMPTY_V y FULL
uint16_t batteryGetRaw();

#endif  // SENSORES_BATTERY_H

// ==========================================================================
//  [08] SENSOR · BATERIA
//  fuente: battery.cpp
// ==========================================================================

static bool     bat_s_online  = false;
static float    s_volts   = 0.0f;
static uint8_t  s_percent = 0;
static uint16_t s_raw     = 0;
static uint32_t bat_s_nextMs  = 0;

void batteryInit() {
  if (!BATTERY_SENSE_ENABLED) {
    Serial.println(F("[BAT] medicion deshabilitada (config.h: BATTERY_SENSE_ENABLED=false)"));
    return;
  }
  pinMode(BATTERY_ADC_PIN, INPUT);
  analogReadResolution(12);
  analogSetPinAttenuation(BATTERY_ADC_PIN, ADC_11db);   // rango util ~0-3.1 V
  bat_s_nextMs = millis();
  Serial.printf("[BAT] medicion en GPIO%d | divisor x%.1f | %.2f-%.2f V = 0-100%%\n",
                BATTERY_ADC_PIN, BATTERY_DIVIDER, BATTERY_EMPTY_V, BATTERY_FULL_V);
}

void batteryUpdate() {
  if (!BATTERY_SENSE_ENABLED) return;

  const uint32_t now = millis();
  if ((int32_t)(now - bat_s_nextMs) < 0) return;
  bat_s_nextMs = now + BATTERY_PERIOD_MS;

  uint32_t acc = 0;
  for (uint8_t i = 0; i < 8; i++) acc += (uint32_t)analogRead(BATTERY_ADC_PIN);
  s_raw = (uint16_t)(acc / 8);

  // Con atenuacion 11 dB la escala satura cerca de 3.1 V.
  const float vAdc = (s_raw / 4095.0f) * 3.10f;
  s_volts  = vAdc * BATTERY_DIVIDER;
  bat_s_online = (s_volts > 1.0f);

  const float span = BATTERY_FULL_V - BATTERY_EMPTY_V;
  float pct = (span > 0.01f) ? ((s_volts - BATTERY_EMPTY_V) / span) * 100.0f : 0.0f;
  if (pct < 0.0f)   pct = 0.0f;
  if (pct > 100.0f) pct = 100.0f;
  s_percent = (uint8_t)pct;
}

bool     batteryIsEnabled() { return BATTERY_SENSE_ENABLED; }
bool     batteryIsOnline()  { return BATTERY_SENSE_ENABLED && bat_s_online; }
float    batteryGetVolts()  { return s_volts; }
uint8_t  batteryGetPercent() { return s_percent; }
uint16_t batteryGetRaw()    { return s_raw; }

// ==========================================================================
//  [09] SENSOR · ULTRASONICO (HC-SR04)
//  fuente: ultrasonic.h
// ==========================================================================

#ifndef SENSORES_ULTRASONIC_H
#define SENSORES_ULTRASONIC_H


// ============================================================================
// Modulo Ultrasonic - HC-SR04 - Araña Robot (ESP32-S3)
//
// IMPLEMENTADO: medicion no bloqueante por maquina de estados
// (sensores/ultrasonic.cpp). El webserver publica sensors.ultrasonic con el
// valor real en cm y online=true cuando hay al menos una lectura valida; si el
// modulo no responde, online=false y value=0 (nunca un valor inventado).
//
// Cableado (config.h):
//   TRIG -> GPIO10 (ULTRASONIC_TRIG_PIN), ECHO -> GPIO11 (ULTRASONIC_ECHO_PIN)
//   VCC 5V, GND comun. OJO: el ECHO del HC-SR04 devuelve 5V y la entrada del
//   ESP32-S3 es de 3.3 V -> hace falta un divisor (1k4/2k2) o un shifter en la
//   linea del ECHO si el modulo entrega tension de 5 V.
//
// MEDICION SEGURA (lo importante de este modulo):
//   1. timeOut(ULTRASONIC_ECHO_PIN, 20000) ANTES de cada medicion, para que un
//      sensor sin blanco se desconecte solo a los 20 ms en vez de bloquear el
//      loop() para siempre. Sin esto el watchdog de comandos nunca llega a
//      ejecutarse y el robot se queda "colgado" con el ultimo comando.
//   2. digitalWrite(TRIG, LOW); delayMicroseconds(2);
//      digitalWrite(TRIG, HIGH); delayMicroseconds(10); digitalWrite(TRIG, LOW);
//   3. duration = pulseIn(ECHO, HIGH, 30000)   -> 30000 us = timeout
//   4. cm = duration * 0.0343f / 2   (343 m/s, ida y vuelta)
//   5. Rechazar lecturas < 2 cm o > 400 cm como "sin objeto" (online=true,
//      value=0) en vez de publicar numeros absurdos.
//
// Periodo: no leer mas de 10-20 Hz (el HC-SR04 y el eco del ultrasonido lo
// necesitan) y promediar 2-3 muestras para reducir el ruido.
// ============================================================================

// Muestreo periodico NO bloqueante (llamar desde loop()). La medicion real se
// dispara con un pulso de 10 us y se resuelve en las iteraciones siguientes.
void ultrasonicInit();
void ultrasonicUpdate();

bool    ultrasonicIsOnline();     // el sensor responde
float   ultrasonicGetCm();        // distancia en cm; 0 = sin objeto
uint32_t ultrasonicGetLastMs();   // antiguedad de la ultima lectura valida

#endif  // SENSORES_ULTRASONIC_H

// ==========================================================================
//  [10] SENSOR · ULTRASONICO (HC-SR04)
//  fuente: ultrasonic.cpp
// ==========================================================================

// ============================================================================
// Modulo Ultrasonic (HC-SR04) - Araña Robot (ESP32-S3)
//
// MEDICION NO BLOQUEANTE con maquina de estados.
//
// Por que no se usa pulseIn() a secas: pulseIn() se queda esperando el eco.
// El HC-SR04 tarda hasta 25 ms (y si no hay blanco, se cuelga). Con el robot
// en marcha, 25 ms sin atender el loop() hacen que el watchdog de comandos
// (ROBOT_CMD_TIMEOUT_MS = 1500 ms) pueda llegar a dispararse si se acumulan
// varias lecturas fallidas, y el ESP32 dejaria de responder al mando.
//
// Estados:
//   IDLE           -> esperando el proximo turno (ULTRASONIC_PERIOD_MS)
//   DISPARO_HECHO  -> pulso de TRIG emitido, esperando que el ECHO suba
//   ESPERANDO_ECHO -> ECHO en HIGH, contando el ancho del pulso
//   TIMEOUT        -> fin del ciclo, sin lectura valida
//
// El paso de estados se resuelve en iteraciones sucesivas de loop(), asi que
// cada llamada a ultrasonicUpdate() tarda microsegundos.
//
// FILTRADO: se toman ULTRASONIC_SAMPLES (3) lecturas seguidas y se publica la
// MEDIANA, que descarta el pico de ruido sin suavizar tanto como la media.
// ============================================================================

enum UsState { US_IDLE, US_DISPARO_HECHO, US_ESPERANDO_ECHO, US_TIMEOUT };

// ----------------------------------------------------------------------------
// Estado interno
// ----------------------------------------------------------------------------
static UsState    s_state       = US_IDLE;
static uint32_t   us_s_nextMs      = 0;      // proximo turno de medicion
static uint32_t   s_echoStartUs = 0;      // flanco de subida del ECHO
static uint32_t   s_echoDeadlineMs = 0;   // instante en el que se declara timeout

static bool     us_s_online      = false;    // hubo al menos una lectura valida
static float    s_cm          = 0.0f;     // ultima distancia publicada
static uint32_t s_lastValidMs = 0;        // antiguedad de la ultima valida

static float    s_samples[ULTRASONIC_SAMPLES];
static uint8_t  s_sampleIdx   = 0;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

// Mediana de ULTRASONIC_SAMPLES valores (ordenacion por insercion, n es chico).
static float medianOf(float* v, uint8_t n) {
  for (uint8_t i = 1; i < n; i++) {
    const float key = v[i];
    int8_t j = (int8_t)i - 1;
    while (j >= 0 && v[j] > key) { v[j + 1] = v[j]; j--; }
    v[j + 1] = key;
  }
  return v[n / 2];
}

// Valida una distancia: fuera del rango fisico del modulo no se publica.
static bool distanceValid(float cm) {
  return cm >= ULTRASONIC_MIN_CM && cm <= ULTRASONIC_MAX_CM;
}

// ----------------------------------------------------------------------------
// API publica
// ----------------------------------------------------------------------------
void ultrasonicInit() {
  pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);
  // Un ECHO desconectado queda definido en LOW en vez de flotar y producir
  // pulsos espurios que parezcan una distancia válida.
  pinMode(ULTRASONIC_ECHO_PIN, INPUT_PULLDOWN);
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);

  s_state       = US_IDLE;
  us_s_nextMs      = millis();
  s_cm          = 0.0f;
  us_s_online      = false;
  s_lastValidMs = 0;
  s_sampleIdx   = 0;

  Serial.printf("[ULTRASONIC] HC-SR04 -> TRIG=GPIO%d ECHO=GPIO%d | periodo %d ms | "
                "timeout %lu us\n",
                ULTRASONIC_TRIG_PIN, ULTRASONIC_ECHO_PIN,
                ULTRASONIC_PERIOD_MS, (unsigned long)ULTRASONIC_TIMEOUT_US);
}

void ultrasonicUpdate() {
  const uint32_t now = millis();

  switch (s_state) {
    // ---- esperando el proximo turno ---------------------------------------
    case US_IDLE:
      if ((int32_t)(now - us_s_nextMs) < 0) return;
      // Pulso de disparo: 10 us en alto (el datasheet pide >= 10 us).
      digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
      delayMicroseconds(2);
      digitalWrite(ULTRASONIC_TRIG_PIN, HIGH);
      delayMicroseconds(10);
      digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
      s_echoDeadlineMs = now + (ULTRASONIC_TIMEOUT_US / 1000) + 10;
      s_state = US_DISPARO_HECHO;
      break;

    // ---- el ECHO tarda ~400 us en empezar a subir -------------------------
    case US_DISPARO_HECHO:
      if (digitalRead(ULTRASONIC_ECHO_PIN) == HIGH) {
        s_echoStartUs = micros();
        s_state = US_ESPERANDO_ECHO;
      } else if ((int32_t)(now - s_echoDeadlineMs) > 0) {
        // El eco no llego a subir: sin blanco. No bloquea, se reintenta.
        s_state = US_TIMEOUT;
      }
      break;

    // ---- midiendo el ancho del pulso de ECHO ------------------------------
    case US_ESPERANDO_ECHO: {
      if (digitalRead(ULTRASONIC_ECHO_PIN) == HIGH) {
        // Seguimos esperando... salvo que se pase el plazo.
        if ((int32_t)(now - s_echoDeadlineMs) > 0) s_state = US_TIMEOUT;
        return;
      }
      // Flanco de bajada: el pulso termino.
      const uint32_t durUs = micros() - s_echoStartUs;
      // 343 m/s, ida y vuelta: cm = us * 0.0343 / 2 = us / 58.3
      const float cm = durUs / 58.3f;
      if (distanceValid(cm)) {
        s_samples[s_sampleIdx++] = cm;
        if (s_sampleIdx >= ULTRASONIC_SAMPLES) {
          s_cm = medianOf(s_samples, ULTRASONIC_SAMPLES);
          s_sampleIdx = 0;
          s_lastValidMs = now;
          us_s_online = true;
        }
      } else {
        // Lectura absurda (objeto demasiado cerca o lejisimo): se descarta y
        // se reinicia la serie. No se publica un numero inventado.
        s_sampleIdx = 0;
      }
      s_state = US_TIMEOUT;
      break;
    }

    // ---- fin del ciclo: programa la siguiente medicion ---------------------
    case US_TIMEOUT:
    default:
      s_state = US_IDLE;
      us_s_nextMs = now + ULTRASONIC_PERIOD_MS;
      break;
  }
}

bool ultrasonicIsOnline() {
  return us_s_online && s_lastValidMs != 0 &&
         (uint32_t)(millis() - s_lastValidMs) <= ULTRASONIC_ONLINE_TIMEOUT_MS;
}
float    ultrasonicGetCm()     { return s_cm; }
uint32_t ultrasonicGetLastMs() { return s_lastValidMs; }

// ==========================================================================
//  [11] SENSOR · INFRARROJO (TCRT5000)
//  fuente: ir.h
// ==========================================================================

#ifndef SENSORES_IR_H
#define SENSORES_IR_H


// ============================================================================
// Modulo IR - TCRT5000 (sensor reflectivo) - Araña Robot (ESP32-S3)
//
// IMPLEMENTADO: lectura analogica 0-4095 con promedio de IR_SAMPLES y
// deteccion de sensor desconectado (sensores/ir.cpp). El webserver publica
// sensors.ir con el valor crudo real y online=true; si el pin queda clavado en
// un extremo se marca offline y value=0 (nunca un valor inventado).
//
// Cableado (config.h): salida -> GPIO12 (IR_PIN), VCC 5V, GND comun.
// El TCRT5000 es digital (comparador Schmitt) pero su salida es de 5 V: al
// ESP32-S3 hay que ponerle un divisor (1k4/2k2) o un shifter de nivel, igual
// que en el ECHO del HC-SR04. Si se conecta directo, alimentarlo con 3.3 V.
//
// Opciones de lectura, de mejor a peor para este robot:
//   1. analogRead(IR_PIN) -> valor crudo 0-4095, como espera el panel
//      (sensors.ir.value). Sirve para distinguir "cerca" de "muy cerca".
//   2. digitalRead(IR_PIN) -> solo 0/1, para deteccion de linea/obstaculo.
//
// Calibracion: leer el valor con el sensor sobre fondo claro (linea) y sobre
// el suelo (oscuras) y quedarse en medio como umbral. Guardar esos dos valores
// en el NVS, igual que el perfil del mando, para no recalibrar en cada arranque.
// ============================================================================

// Umbral de deteccion entre el valor sobre "linea" y sobre "fondo". Calibrar
// una vez al arrancar, con el robot apoyado en la pista.
void irInit();
void irUpdate();          // muestreo periodico no bloqueante (llamar desde loop())

bool     irIsOnline();
uint16_t irGetValue();    // lectura cruda 0-4095
bool     irIsReflecting();// true = linea clara (sensor oscuro)

#endif  // SENSORES_IR_H

// ==========================================================================
//  [12] SENSOR · INFRARROJO (TCRT5000)
//  fuente: ir.cpp
// ==========================================================================

// ============================================================================
// Modulo IR (TCRT5000) - Araña Robot (ESP32-S3)
//
// Lectura ANALOGICA del sensor reflectivo: analogRead(IR_PIN) -> 0-4095, que es
// exactamente lo que espera el panel PC (sensors.ir.value). Sirve para medir
// "cuanto" refleja, no solo "refleja o no" como daria un digitalRead().
//
// FILTRADO: se promedian IR_SAMPLES (8) lecturas por muestra. El TCRT5000 es
// ruidoso con luz ambiente, y la media baja el jitter sin perder la respuesta.
//
// DETECCION DE SENSOR DESCONECTADO
//   Un pin ADC al aire da valores que saltan por toda la escala, pero un pin
//   desconectado del todo (o un sensor sin alimentar) se queda clavado en 0 o
//   en el techo del ADC. Si eso pasa IR_STUCK_LIMIT veces seguidas se marca
//   offline y se deja de publicar: es preferible un offline honesto a un 0 o un
//   4095 que parezca una lectura valida.
//
// CALIBRACION: irIsReflecting() compara con IR_THRESHOLD. El valor real de
// "linea clara" y "suelo oscuro" depende del modulo y de la altura, asi que ese
// umbral es un punto de partida: para usarlo en serio hay que calibrarlo con el
// robot apoyado en la pista (ver el comando "ir" de la consola serie).
// ============================================================================

// ----------------------------------------------------------------------------
// Estado interno
// ----------------------------------------------------------------------------
static bool     ir_s_online   = false;    // hubo al menos una muestra valida
static uint16_t s_value    = 0;        // promedio actual (0-4095)
static uint32_t ir_s_nextMs   = 0;
static uint16_t s_stuckCnt = 0;        // muestras seguidas clavadas en un extremo

// ----------------------------------------------------------------------------
// API publica
// ----------------------------------------------------------------------------
void irInit() {
  // GPIO12 = ADC1_CH1 en el ESP32-S3. analogReadResolution(12) da el rango
  // 0-4095 que publica el panel (por defecto el core ya usa 12 bits).
  // El pulldown evita que un GPIO desconectado quede flotando y parezca una
  // lectura analógica válida.
  pinMode(IR_PIN, INPUT_PULLDOWN);
  analogReadResolution(12);
  // Una lectura de descarte: la primera tras configurar el pin suele ser basura.
  analogRead(IR_PIN);

  ir_s_online   = false;
  s_value    = 0;
  s_stuckCnt = 0;
  ir_s_nextMs   = millis();

  Serial.printf("[IR] TCRT5000 -> GPIO%d (ADC) | umbral %d | promedio de %d lecturas\n",
                IR_PIN, IR_THRESHOLD, IR_SAMPLES);
}

void irUpdate() {
  const uint32_t now = millis();
  if ((int32_t)(now - ir_s_nextMs) < 0) return;
  ir_s_nextMs = now + IR_PERIOD_MS;

  // Promedio de IR_SAMPLES lecturas seguidas.
  uint32_t sum = 0;
  uint16_t lo = IR_RAW_MAX, hi = 0;
  for (uint8_t i = 0; i < IR_SAMPLES; i++) {
    const uint16_t v = (uint16_t)analogRead(IR_PIN);
    sum += v;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  s_value = (uint16_t)(sum / IR_SAMPLES);

  // Deteccion de desconexion: valor clavado en un extremo. Se mira tambien que
  // TODAS las lecturas de la muestra sean iguales, porque un pin al aire da
  // valores dispersos aunque la media caiga cerca de un extremo.
  const bool disconnected = s_value <= IR_DISCONNECTED_THRESHOLD && hi <= IR_DISCONNECTED_THRESHOLD;
  const bool stuck = (s_value >= IR_RAW_MAX) && (lo == hi);
  if (stuck || disconnected) {
    if (++s_stuckCnt >= IR_STUCK_LIMIT) {
      if (ir_s_online) Serial.println(F("[IR] OFFLINE (sin señal analógica; revisar sensor/cableado)"));
      ir_s_online = false;
    }
  } else {
    s_stuckCnt = 0;
    ir_s_online = true;
  }
}

bool     irIsOnline()     { return ir_s_online; }
uint16_t irGetValue()     { return s_value; }
bool     irIsReflecting() { return ir_s_online && s_value >= IR_THRESHOLD; }

// ==========================================================================
//  [13] SENSOR · AHT10 (TEMP/HUMEDAD)
//  fuente: aht10.h
// ==========================================================================

#ifndef SENSORES_AHT10_H
#define SENSORES_AHT10_H


// ============================================================================
// Modulo AHT10 - temperatura + humedad por I2C - Araña Robot (ESP32-S3)
//
// REEMPLAZA al DHT22 del proyecto original. Motivos:
//   - El AHT10 va por I2C (direccion 0x38) en el bus que YA existe en la placa
//     (SDA=GPIO8, SCL=GPIO9, compartido con el MPU6050 en 0x68 y el PCA9685 en
//     0x40). No gasta ningun GPIO mas: el GPIO13 que usaba el DHT22 queda libre.
//   - La lectura es practicamente instantanea (~1-2 ms) y admite lecturas
//     seguidas cada ~1 s, contra los 2-6 ms bloqueantes y los 2 s de espera
//     obligatorios del DHT22. No hay que temporizar el loop() para el.
//   - Mejor precision: +-0.3 °C y +-2 % HR, frente a +-0.5 °C / +-2..5 % HR.
//   - Es el mismo chip en las variantes AHT10 / AHT20 / AHT21: la libreria
//     Adafruit AHTX0 las detecta sola, asi que vale cualquiera de las tres.
//
// Cableado: VCC 3.3 V (NO 5 V: el modulo no tiene regulador ni divisor en la
// mayoria de las placas), GND comun, SDA -> GPIO8, SCL -> GPIO9.
//
// Estado: el webserver publica sensors.dht con los valores reales y
// online=true cuando el chip responde. Si no responde, online=false y temp/hum
// quedan en 0 (nunca se inventa una lectura), y se reintenta cada 5 s.
// ============================================================================

void aht10Init();

// Muestreo periodico NO bloqueante (llamar desde loop()). Solo lanza una
// conversion cuando paso el periodo minimo del chip.
void aht10Update();

bool    aht10IsOnline();   // chip detectado y respondiendo
float   aht10GetTempC();   // grados Celsius
float   aht10GetHumidity(); // % de humedad relativa

#endif  // SENSORES_AHT10_H

// ==========================================================================
//  [14] SENSOR · AHT10 (TEMP/HUMEDAD)
//  fuente: aht10.cpp
// ==========================================================================

// ============================================================================
// Modulo AHT10 - Araña Robot (ESP32-S3)
//
// Implementa sensores/aht10.h con la libreria Adafruit AHTX0 sobre el bus I2C
// compartido (GPIO8=SDA, GPIO9=SCL, direccion 0x38).
//
// A diferencia del DHT22 al que reemplaza, la lectura I2C es casi instantanea
// y no tiene el minimo de 2 s entre conversiones, asi que aqui se refresca
// cada AHT10_PERIOD_MS (1 s) sin bloquear el loop(): cada llamada a update()
// hace UNA transaccion I2C de ~1,5 ms cuando toca leer.
//
// El bus I2C lo abre imuInit() (Wire.begin). Este modulo no lo reinicializa:
// si el AHT10 llegara a inicializarse antes que la IMU, Wire.begin() de la IMU
// lo volveria a poner a punto sin perder el estado del chip.
// ============================================================================


// ----------------------------------------------------------------------------
// Estado interno
// ----------------------------------------------------------------------------
static Adafruit_AHTX0 s_aht;

static bool     aht_s_online      = false;   // chip detectado y respondiendo
static uint32_t s_nextReadMs  = 0;       // proxima conversion programada
static uint32_t aht_s_nextRetryMs = 0;       // proximo reintento de deteccion
static uint8_t  aht_s_readErrors  = 0;       // fallos consecutivos (para ir a offline)

static float    aht_s_tempC       = 0.0f;
static float    s_humidity    = 0.0f;

// El AHT10 admite una conversion cada ~1 s sin degradarse. Con menos se
// recalienta el chip y la humedad sesga hacia arriba.
#define AHT10_PERIOD_MS 1000
// Fallos seguidos de lectura antes de declarar el chip offline.
#define AHT10_MAX_ERRORS 5

// ----------------------------------------------------------------------------
// Deteccion
// ----------------------------------------------------------------------------

// Intenta detectar e inicializar el chip. Una transaccion I2C fallida en este
// bus tarda ~1 ms, asi que no bloquea nada perceptible.
static bool aht10TryDetect() {
  if (s_aht.begin(&Wire, AHT10_I2C_ADDR)) {
    Serial.printf("[AHT10] detectado en I2C 0x%02X ONLINE\n", AHT10_I2C_ADDR);
    return true;
  }
  return false;
}

// ----------------------------------------------------------------------------
// API publica
// ----------------------------------------------------------------------------
void aht10Init() {
#if AHT10_ENABLED
  aht_s_online = aht10TryDetect();
  if (!aht_s_online) {
    Serial.printf("[AHT10] OFFLINE (se reintentara cada 5 s; verificar SDA=8 SCL=9, addr 0x%02X)\n",
                  AHT10_I2C_ADDR);
  }
  // Primera lectura de inmediato: el panel no tiene que esperar 1 s.
  s_nextReadMs  = 0;
  aht_s_nextRetryMs = millis() + 5000;
#else
  Serial.println(F("[AHT10] modulo deshabilitado en config.h (AHT10_ENABLED=false)"));
#endif
}

void aht10Update() {
#if AHT10_ENABLED
  const uint32_t now = millis();

  // --- chip sin detectar: reintento periodico (hot-plug) -------------------
  if (!aht_s_online) {
    if ((int32_t)(now - aht_s_nextRetryMs) >= 0) {
      aht_s_nextRetryMs = now + 5000;
      aht_s_online = aht10TryDetect();
      if (aht_s_online) s_nextReadMs = now;   // leer ya, sin esperar el periodo
    }
    return;
  }

  // --- todavia no toca leer ------------------------------------------------
  if ((int32_t)(now - s_nextReadMs) < 0) return;
  s_nextReadMs = now + AHT10_PERIOD_MS;

  // --- conversion ----------------------------------------------------------
  sensors_event_t humidityEvent, tempEvent;
  s_aht.getEvent(&humidityEvent, &tempEvent);

  // La libreria deja los campos a 0 si la conversion fallo (checksum o NACK).
  // Con temp <= -40 y hum <= 0 se considera lectura invalida: no se publica.
  const float t = tempEvent.temperature;
  const float h = humidityEvent.relative_humidity;
  if (t <= -40.0f || h <= 0.0f || h > 100.0f) {
    if (++aht_s_readErrors >= AHT10_MAX_ERRORS) {
      aht_s_online = false;
      aht_s_readErrors = 0;
      Serial.println(F("[AHT10] OFFLINE (lecturas invalidas seguidas)"));
    }
    return;
  }

  aht_s_readErrors = 0;
  aht_s_tempC    = t;
  s_humidity = h;
#endif
}

bool  aht10IsOnline()    { return aht_s_online; }
float aht10GetTempC()    { return aht_s_tempC; }
float aht10GetHumidity() { return s_humidity; }

// ==========================================================================
//  [15] ACTUADOR · BUZZER
//  fuente: buzzer.h
// ==========================================================================

#ifndef ACTUADORES_BUZZER_H
#define ACTUADORES_BUZZER_H


// ============================================================================
// Módulo Buzzer (pasivo, PWM LEDC) — Araña Robot
//
// Implementa el protocolo documentado en esp32/README.md, que es el que envía
// el Control Center PC (pc/app.py -> dispatch "buzzer" / "buzzer_stop"):
//
//   POST /api/command
//   {"cmd":"buzzer","value":{"pattern":"BEEP","freq":880,"duration":150,
//                            "wave":"square","volume":70}}
//   {"cmd":"buzzer_stop"}
//
// El estado se publica en /api/status -> sensors.buzzer.state ("playing"|"idle")
// y sensors.buzzer.online (bool), tal como espera pc/app.py (_merge_sensors).
//
// Patrones de usuario = identificadores de BUZZER_PRESETS del panel web:
//   BEEP / SIREN / ALARM / RISE / FALL / CUSTOM / JURASSIC / JP3_VARIANT.
// PROXIMITY es un patrón interno disparado por el HC-SR04, no por la API.
// `wave` (sine/square/triangle/sawtooth) no cambia el sonido real del buzzer
// pasivo (solo produce onda cuadrada); se acepta por compatibilidad de protocolo.
// JURASSIC reproduce la melodía JP3 en un secuenciador no bloqueante y repite
// hasta recibir buzzerStop().
//
// La reproducción es NO bloqueante: se debe llamar a buzzerUpdate() desde loop().
// ============================================================================

// Identificadores de patrón (coinciden con el JSON del panel PC)
/* [tipo BuzzerPattern definido arriba] */

// Inicializa el PWM LEDC y deja el buzzer en "idle".
void buzzerInit();

// Máquina de estados del sonido. Llamar en cada iteración de loop().
void buzzerUpdate();

// Activa el pitido de proximidad con prioridad mientras el HC-SR04 marca <=10 cm.
void buzzerSetProximityAlert(bool active);

// Reproduce un tono. Parámetros = campos exactos del JSON que envía la PC.
// Devuelve true si el comando fue aceptado, false si el patrón es inválido.
bool buzzerPlay(const char* pattern, uint16_t freqHz, uint16_t durationMs,
                const char* wave, uint8_t volume);

// Detiene el sonido inmediatamente.
void buzzerStop();

bool        buzzerIsPlaying();
const char* buzzerGetState();   // "playing" | "idle"   -> sensors.buzzer.state
const char* buzzerGetPattern(); // último patrón aceptado -> sensors.buzzer.pattern
uint16_t    buzzerGetFrequency(); // frecuencia base en Hz -> sensors.buzzer.freq
bool        buzzerIsOnline();   //                      -> sensors.buzzer.online

// Convierte el string del protocolo a BuzzerPattern.
BuzzerPattern buzzerPatternFromString(const char* pattern);

#endif  // ACTUADORES_BUZZER_H

// ==========================================================================
//  [16] ACTUADOR · BUZZER
//  fuente: buzzer.cpp
// ==========================================================================

// ============================================================================
// Módulo Buzzer — Araña Robot (ESP32-S3)
// Buzzer pasivo controlado por PWM (LEDC). Implementa el protocolo que envía
// el Control Center PC (ver esp32/README.md, sección "Protocolo Buzzer"):
//
//   {"cmd":"buzzer","value":{"pattern":"BEEP","freq":880,"duration":150,
//                            "wave":"square","volume":70}}
//   {"cmd":"buzzer_stop"}
//
// API pública en buzzer.h. Reproducción NO bloqueante: buzzerUpdate() debe
// llamarse desde loop() y avanza la máquina de estados del patrón.
//
// Compatible con Arduino core 2.x (API por canal) y 3.x (API por pin).
// ============================================================================


#if defined(ESP_ARDUINO_VERSION_MAJOR) && (ESP_ARDUINO_VERSION_MAJOR >= 3)
  #define BUZZER_LEDC_CORE3 1
#else
  #define BUZZER_LEDC_CORE3 0
#endif

// ----------------------------------------------------------------------------
// Estado interno
// ----------------------------------------------------------------------------
static bool          bz_s_online      = false;
static bool          s_playing     = false;
static BuzzerPattern bz_s_pattern     = BUZZER_PATTERN_UNKNOWN;
static uint16_t      s_freqHz      = 0;     // frecuencia base del comando
static uint32_t      s_durationMs  = 0;     // duración total del patrón
static uint8_t       s_duty        = 0;     // duty 0..127 (50% = onda cuadrada)
static uint32_t      s_startMs     = 0;
static uint32_t      s_nextPhaseMs = 0;     // próximo cambio de fase del patrón
static bool          s_phaseOn     = true;  // ALARM: ¿tono activo o silencio?
static bool          s_phaseHigh   = false; // SIREN: ¿frecuencia alta o baja?
static uint8_t       s_jp3NoteIndex = 0;
static uint8_t       s_jp3Phase = 0;        // 0=nota, 1=separación, 2=pausa entre timbrazos
static uint8_t       s_jp3VariantNoteIndex = 0;
static uint8_t       s_jp3VariantPhase = 0;  // 0=nota, 1=pausa entre notas, 2=pausa entre timbrazos

// Tiempos de los patrones (ms)
static const uint16_t SIREN_HALF_PERIOD_MS = 400;
static const uint16_t ALARM_ON_MS          = 150;
static const uint16_t ALARM_OFF_MS         = 100;
static const uint16_t SWEEP_STEP_MS        = 30;   // resolución del barrido
static const uint16_t JP3_NOTE_FREQS[] = {523, 494, 523, 392, 349, 523, 494, 523, 392, 349};
static const uint16_t JP3_NOTE_DURATIONS_MS[] = {200, 200, 350, 350, 450, 200, 200, 350, 350, 600};
static const uint8_t JP3_NOTE_COUNT = sizeof(JP3_NOTE_FREQS) / sizeof(JP3_NOTE_FREQS[0]);
static const uint16_t JP3_RING_PAUSE_MS = 2500;
static const uint16_t JP3_VARIANT_NOTE_FREQS[] = {
  784, 659, 698, 659, 587, 523, 784, 1047, 523
};
static const uint16_t JP3_VARIANT_NOTE_DURATIONS_MS[] = {
  260, 250, 140, 120, 250, 270, 260, 280, 230
};
static const uint16_t JP3_VARIANT_PAUSES_MS[] = {
  20, 10, 10, 10, 10, 10, 20, 10, 0
};
static const uint8_t JP3_VARIANT_NOTE_COUNT =
  sizeof(JP3_VARIANT_NOTE_FREQS) / sizeof(JP3_VARIANT_NOTE_FREQS[0]);
static const uint16_t JP3_VARIANT_RING_PAUSE_MS = 2160;
static const uint16_t PROXIMITY_ON_MS = 100;
static const uint16_t PROXIMITY_OFF_MS = 250;

// ----------------------------------------------------------------------------
// Helpers PWM (LEDC) con soporte Arduino core 2.x / 3.x
// ----------------------------------------------------------------------------

static void pwmWrite(uint8_t duty) {
#if BUZZER_LEDC_CORE3
  ledcWrite(BUZZER_PIN, duty);
#else
  ledcWrite(BUZZER_LEDC_CHANNEL, duty);
#endif
}

static void pwmSetFreq(uint16_t freqHz) {
  // Mantener la frecuencia dentro de los límites que soporta el panel PC
  if (freqHz < BUZZER_FREQ_MIN_HZ) freqHz = BUZZER_FREQ_MIN_HZ;
  if (freqHz > BUZZER_FREQ_MAX_HZ) freqHz = BUZZER_FREQ_MAX_HZ;
#if BUZZER_LEDC_CORE3
  ledcChangeFrequency(BUZZER_PIN, freqHz, BUZZER_LEDC_RESOLUTION);
  ledcWrite(BUZZER_PIN, s_duty);            // re-aplicar duty tras la frecuencia
#else
  ledcChangeFrequency(BUZZER_LEDC_CHANNEL, freqHz, BUZZER_LEDC_RESOLUTION);
  ledcWrite(BUZZER_LEDC_CHANNEL, s_duty);
#endif
}

static void pwmStart(uint16_t freqHz) {
#if BUZZER_LEDC_CORE3
  ledcAttach(BUZZER_PIN, freqHz, BUZZER_LEDC_RESOLUTION);
  ledcWrite(BUZZER_PIN, s_duty);
#else
  ledcSetup(BUZZER_LEDC_CHANNEL, freqHz, BUZZER_LEDC_RESOLUTION);
  ledcAttachPin(BUZZER_PIN, BUZZER_LEDC_CHANNEL);
  ledcWrite(BUZZER_LEDC_CHANNEL, s_duty);
#endif
}

// Volumen 0..100 -> duty 0..127 (el 50% del duty es la potencia máxima útil
// de una onda cuadrada en un buzzer pasivo).
static uint8_t volumeToDuty(uint8_t volume) {
  if (volume > 100) volume = 100;
  const uint16_t DUTY_MAX = ((1u << BUZZER_LEDC_RESOLUTION) / 2u) - 1u; // 127
  return (uint8_t)(((uint16_t)volume * DUTY_MAX) / 100u);
}

static uint16_t jp3InterNoteGapMs(uint8_t noteIndex) {
  // tone() apaga la nota tras su duración y el ejemplo espera 15% adicional.
  return (uint16_t)(JP3_NOTE_DURATIONS_MS[noteIndex] * 15u / 100u);
}

static void jp3StartNote(uint32_t now) {
  s_freqHz = JP3_NOTE_FREQS[s_jp3NoteIndex];
  pwmSetFreq(s_freqHz);
  pwmWrite(s_duty);
  s_jp3Phase = 0;
  s_nextPhaseMs = now + JP3_NOTE_DURATIONS_MS[s_jp3NoteIndex];
}

static void jp3VariantStartNote(uint32_t now) {
  s_freqHz = JP3_VARIANT_NOTE_FREQS[s_jp3VariantNoteIndex];
  pwmSetFreq(s_freqHz);
  pwmWrite(s_duty);
  s_jp3VariantPhase = 0;
  s_nextPhaseMs = now + JP3_VARIANT_NOTE_DURATIONS_MS[s_jp3VariantNoteIndex];
}

// ----------------------------------------------------------------------------
// API pública
// ----------------------------------------------------------------------------

void buzzerInit() {
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  s_playing = false;
  bz_s_online  = false;
  s_duty    = 0;
  pwmStart(BUZZER_DEFAULT_FREQ_HZ);   // deja el canal listo, en silencio
  bz_s_online = true;
}

BuzzerPattern buzzerPatternFromString(const char* pattern) {
  if (pattern == nullptr) return BUZZER_PATTERN_UNKNOWN;
  if (strcasecmp(pattern, "BEEP")   == 0) return BUZZER_PATTERN_BEEP;
  if (strcasecmp(pattern, "SIREN")  == 0) return BUZZER_PATTERN_SIREN;
  if (strcasecmp(pattern, "ALARM")  == 0) return BUZZER_PATTERN_ALARM;
  if (strcasecmp(pattern, "RISE")   == 0) return BUZZER_PATTERN_RISE;
  if (strcasecmp(pattern, "FALL")   == 0) return BUZZER_PATTERN_FALL;
  if (strcasecmp(pattern, "CUSTOM") == 0) return BUZZER_PATTERN_CUSTOM;
  if (strcasecmp(pattern, "JURASSIC") == 0) return BUZZER_PATTERN_JURASSIC;
  if (strcasecmp(pattern, "JP3_VARIANT") == 0) return BUZZER_PATTERN_JP3_VARIANT;
  return BUZZER_PATTERN_UNKNOWN;
}
bool buzzerPlay(const char* pattern, uint16_t freqHz, uint16_t durationMs,
                const char* wave, uint8_t volume) {
  const BuzzerPattern p = buzzerPatternFromString(pattern);
  if (p == BUZZER_PATTERN_UNKNOWN) {
    Serial.printf("[BUZZER] error: patrón desconocido '%s'\n",
                  pattern ? pattern : "(null)");
    return false;
  }
  if (!bz_s_online) return false;

  // Aplicar los límites que define el protocolo del panel PC
  if (p != BUZZER_PATTERN_JURASSIC && p != BUZZER_PATTERN_JP3_VARIANT) {
    if (freqHz     < BUZZER_FREQ_MIN_HZ)     freqHz     = BUZZER_FREQ_MIN_HZ;
    if (freqHz     > BUZZER_FREQ_MAX_HZ)     freqHz     = BUZZER_FREQ_MAX_HZ;
    if (durationMs < BUZZER_DURATION_MIN_MS) durationMs = BUZZER_DURATION_MIN_MS;
    if (durationMs > BUZZER_DURATION_MAX_MS) durationMs = BUZZER_DURATION_MAX_MS;
  }

  bz_s_pattern    = p;
  s_freqHz = (p == BUZZER_PATTERN_JURASSIC) ? JP3_NOTE_FREQS[0] :
             (p == BUZZER_PATTERN_JP3_VARIANT) ? JP3_VARIANT_NOTE_FREQS[0] : freqHz;
  s_durationMs = (p == BUZZER_PATTERN_JURASSIC || p == BUZZER_PATTERN_JP3_VARIANT)
                   ? 0 : durationMs;
  s_duty       = volumeToDuty(volume);
  s_startMs    = millis();
  s_phaseOn    = true;
  s_phaseHigh  = false;
  s_playing    = true;
  s_jp3NoteIndex = 0;
  s_jp3Phase = 0;
  s_jp3VariantNoteIndex = 0;
  s_jp3VariantPhase = 0;

  pwmSetFreq(s_freqHz); // arranca sonando a la frecuencia base/primera nota
  pwmWrite(s_duty);

  // Agendar la primera transición de fase según el patrón
  switch (p) {
    case BUZZER_PATTERN_SIREN:
      s_nextPhaseMs = s_startMs + SIREN_HALF_PERIOD_MS;
      break;
    case BUZZER_PATTERN_ALARM:
      s_nextPhaseMs = s_startMs + ALARM_ON_MS;
      break;
    case BUZZER_PATTERN_RISE:
    case BUZZER_PATTERN_FALL:
      s_nextPhaseMs = s_startMs + SWEEP_STEP_MS;
      break;
    case BUZZER_PATTERN_JURASSIC:
      s_nextPhaseMs = s_startMs + JP3_NOTE_DURATIONS_MS[0];
      break;
    case BUZZER_PATTERN_JP3_VARIANT:
      s_nextPhaseMs = s_startMs + JP3_VARIANT_NOTE_DURATIONS_MS[0];
      break;
    default:
      s_nextPhaseMs = 0;
      break;
  }

  if (p == BUZZER_PATTERN_JURASSIC) {
    Serial.printf("[BUZZER] play JURASSIC/JP3: %u notas, repetición hasta stop, vol=%u%%\n",
                  (unsigned)JP3_NOTE_COUNT, (unsigned)volume);
  } else if (p == BUZZER_PATTERN_JP3_VARIANT) {
    Serial.printf("[BUZZER] play JP3_VARIANT: %u notas, repetición hasta stop, vol=%u%%\n",
                  (unsigned)JP3_VARIANT_NOTE_COUNT, (unsigned)volume);
  } else {
    Serial.printf("[BUZZER] play pattern=%s freq=%uHz dur=%ums wave=%s vol=%u%%\n",
                  pattern, (unsigned)freqHz, (unsigned)durationMs,
                  wave ? wave : "-", (unsigned)volume);
  }
  return true;
}

void buzzerUpdate() {
  if (!s_playing) return;

  const uint32_t now     = millis();
  const uint32_t elapsed = now - s_startMs;   // seguro ante overflow de millis()

  if (bz_s_pattern != BUZZER_PATTERN_JURASSIC &&
      bz_s_pattern != BUZZER_PATTERN_JP3_VARIANT &&
      bz_s_pattern != BUZZER_PATTERN_PROXIMITY && elapsed >= s_durationMs) {
    buzzerStop();
    return;
  }

  switch (bz_s_pattern) {
    case BUZZER_PATTERN_BEEP:
    case BUZZER_PATTERN_CUSTOM:
      break;                                  // tono fijo hasta finalizar

    case BUZZER_PATTERN_JURASSIC:
      if ((int32_t)(now - s_nextPhaseMs) >= 0) {
        if (s_jp3Phase == 0) {
          // La nota ya duró lo indicado; apagar durante el 15% entre notas.
          pwmWrite(0);
          if (s_jp3NoteIndex + 1 >= JP3_NOTE_COUNT) {
            s_jp3Phase = 2;
            s_nextPhaseMs = now + jp3InterNoteGapMs(s_jp3NoteIndex) + JP3_RING_PAUSE_MS;
          } else {
            s_jp3Phase = 1;
            s_nextPhaseMs = now + jp3InterNoteGapMs(s_jp3NoteIndex);
          }
        } else if (s_jp3Phase == 1) {
          ++s_jp3NoteIndex;
          jp3StartNote(now);
        } else {
          // Repite el timbrazo completo tras los 2,5 s de pausa del ejemplo.
          s_jp3NoteIndex = 0;
          jp3StartNote(now);
        }
      }
      break;

    case BUZZER_PATTERN_JP3_VARIANT:
      if ((int32_t)(now - s_nextPhaseMs) >= 0) {
        if (s_jp3VariantPhase == 0) {
          pwmWrite(0);
          s_jp3VariantPhase = 1;
          s_nextPhaseMs = now + JP3_VARIANT_PAUSES_MS[s_jp3VariantNoteIndex];
        } else if (s_jp3VariantPhase == 1) {
          if (s_jp3VariantNoteIndex + 1 >= JP3_VARIANT_NOTE_COUNT) {
            s_jp3VariantPhase = 2;
            s_nextPhaseMs = now + JP3_VARIANT_RING_PAUSE_MS;
          } else {
            ++s_jp3VariantNoteIndex;
            jp3VariantStartNote(now);
          }
        } else {
          s_jp3VariantNoteIndex = 0;
          jp3VariantStartNote(now);
        }
      }
      break;

    case BUZZER_PATTERN_PROXIMITY:
      if ((int32_t)(now - s_nextPhaseMs) >= 0) {
        s_phaseOn = !s_phaseOn;
        pwmWrite(s_phaseOn ? s_duty : 0);
        s_nextPhaseMs = now + (s_phaseOn ? PROXIMITY_ON_MS : PROXIMITY_OFF_MS);
      }
      break;

    case BUZZER_PATTERN_SIREN:                // alterna frec. base y x1.5
      if ((int32_t)(now - s_nextPhaseMs) >= 0) {
        s_phaseHigh = !s_phaseHigh;
        pwmSetFreq(s_phaseHigh ? (uint16_t)(s_freqHz * 3u / 2u) : s_freqHz);
        s_nextPhaseMs = now + SIREN_HALF_PERIOD_MS;
      }
      break;

    case BUZZER_PATTERN_ALARM:                // beep 150ms / pausa 100ms
      if ((int32_t)(now - s_nextPhaseMs) >= 0) {
        s_phaseOn = !s_phaseOn;
        pwmWrite(s_phaseOn ? s_duty : 0);
        s_nextPhaseMs = now + (s_phaseOn ? ALARM_ON_MS : ALARM_OFF_MS);
      }
      break;

    case BUZZER_PATTERN_RISE:                 // barrido lineal x1 -> x4
    case BUZZER_PATTERN_FALL:                 // barrido lineal x1 -> x1/4
      if ((int32_t)(now - s_nextPhaseMs) >= 0) {
        const float k    = (float)elapsed / (float)s_durationMs;   // 0.0..1.0
        const float mult = (bz_s_pattern == BUZZER_PATTERN_RISE)
                               ? (1.0f + 3.0f * k)
                               : (1.0f - 0.75f * k);
        pwmSetFreq((uint16_t)(s_freqHz * mult));
        s_nextPhaseMs = now + SWEEP_STEP_MS;
      }
      break;

    default:
      break;
  }
}

void buzzerStop() {
  if (!s_playing) return;
  pwmWrite(0);
  s_playing = false;
  s_jp3NoteIndex = 0;
  s_jp3Phase = 0;
  s_jp3VariantNoteIndex = 0;
  s_jp3VariantPhase = 0;
  Serial.println("[BUZZER] stop -> idle");
}

void buzzerSetProximityAlert(bool active) {
  if (active) {
    if (bz_s_pattern != BUZZER_PATTERN_PROXIMITY || !s_playing) {
      if (s_playing) buzzerStop();
      bz_s_pattern = BUZZER_PATTERN_PROXIMITY;
      s_freqHz = 880;
      s_durationMs = 0;
      s_duty = volumeToDuty(75);
      s_startMs = millis();
      s_phaseOn = true;
      s_phaseHigh = false;
      s_playing = true;
      pwmSetFreq(s_freqHz);
      pwmWrite(s_duty);
      s_nextPhaseMs = s_startMs + PROXIMITY_ON_MS;
      Serial.println(F("[BUZZER] alerta de proximidad activa (<=10 cm)"));
    }
  } else if (bz_s_pattern == BUZZER_PATTERN_PROXIMITY && s_playing) {
    buzzerStop();
  }
}

bool buzzerIsPlaying() { return s_playing; }

const char* buzzerGetState() { return s_playing ? "playing" : "idle"; }

const char* buzzerGetPattern() {
  switch (bz_s_pattern) {
    case BUZZER_PATTERN_BEEP:      return "BEEP";
    case BUZZER_PATTERN_SIREN:     return "SIREN";
    case BUZZER_PATTERN_ALARM:     return "ALARM";
    case BUZZER_PATTERN_RISE:      return "RISE";
    case BUZZER_PATTERN_FALL:      return "FALL";
    case BUZZER_PATTERN_CUSTOM:    return "CUSTOM";
    case BUZZER_PATTERN_JURASSIC:  return "JURASSIC";
    case BUZZER_PATTERN_JP3_VARIANT: return "JP3_VARIANT";
    case BUZZER_PATTERN_PROXIMITY:  return "PROXIMITY";
    default:                       return "";
  }
}

uint16_t buzzerGetFrequency() { return s_freqHz; }

bool buzzerIsOnline() { return bz_s_online; }

// ==========================================================================
//  [17] ACTUADOR · HEADLIGHTS
//  fuente: leds.h
// ==========================================================================

#ifndef LEDS_H
#define LEDS_H


// Funciones públicas del driver de headlights
void ledsInit();
void ledsOn();
void ledsOff();
void ledsSetBrightness(uint8_t brightness); // 0-255
uint8_t ledsGetBrightness();
bool ledsGetState();

#endif // LEDS_H

// ==========================================================================
//  [18] ACTUADOR · HEADLIGHTS
//  fuente: leds.cpp
// ==========================================================================

// Compatibilidad Arduino core 2.x (API por canal) y 3.x (API por pin), con el
// mismo criterio que actuadores/buzzer.cpp.
#if defined(ESP_ARDUINO_VERSION_MAJOR) && (ESP_ARDUINO_VERSION_MAJOR >= 3)
  #define LEDS_LEDC_CORE3 1
#else
  #define LEDS_LEDC_CORE3 0
#endif

static bool led_state = false;
static uint8_t led_brightness = 0;

// Escribe el duty en el canal/pin de la linterna (canal, frecuencia y
// resolución salen de config.h: HEADLIGHT_LEDC_*).
static void ledsPwmWrite(uint8_t duty) {
#if LEDS_LEDC_CORE3
  ledcWrite(HEADLIGHT_PIN, duty);
#else
  ledcWrite(HEADLIGHT_LEDC_CHANNEL, duty);
#endif
}

void ledsInit() {
    pinMode(HEADLIGHT_PIN, OUTPUT);
    digitalWrite(HEADLIGHT_PIN, LOW);

    // Configuración LEDC
#if LEDS_LEDC_CORE3
    ledcAttach(HEADLIGHT_PIN, HEADLIGHT_LEDC_FREQ_HZ, HEADLIGHT_LEDC_RESOLUTION);
#else
    ledcSetup(HEADLIGHT_LEDC_CHANNEL, HEADLIGHT_LEDC_FREQ_HZ, HEADLIGHT_LEDC_RESOLUTION);
    ledcAttachPin(HEADLIGHT_PIN, HEADLIGHT_LEDC_CHANNEL);
#endif
    // Brillo por defecto en vez de 0: si no, "luces on" por consola encenderia
    // la linterna con duty 0 (es decir, apagada) y pareceria un fallo.
    led_brightness = HEADLIGHT_DEFAULT_BRIGHTNESS;
    ledsPwmWrite(0);   // arranca apagada, pero con el brillo ya definido
}

void ledsOn() {
    led_state = true;
    ledsPwmWrite(led_brightness);
}

void ledsOff() {
    led_state = false;
    ledsPwmWrite(0);
}

void ledsSetBrightness(uint8_t brightness) {
    led_brightness = brightness;
    if (led_state) {
        ledsPwmWrite(brightness);
    }
}

uint8_t ledsGetBrightness() {
    return led_brightness;
}

bool ledsGetState() {
    return led_state;
}

// ==========================================================================
//  [19] ACTUADOR · SERVOS (PCA9685)
//  fuente: servos.h  (Reconstruido y unificado con el modelo 3D NEUN)
// ==========================================================================

#ifndef ACTUADORES_SERVOS_H
#define ACTUADORES_SERVOS_H


// ============================================================================
// Modulo Servos - PCA9685 16 canales (12 servos usados) - Araña Robot (ESP32-S3)
//
// MAPEO DE CANALES PCA9685 (unificado con el Panel Web y el Visor 3D NEUN):
//   Lado IZQUIERDO -> canales 0..5   |   Lado DERECHO -> canales 6..11
//
//              FRENTE (HC-SR04)
//     0: FL (CH 0-2) ────── 2: FR (CH 6-8)
//            │                     │
//      IZQ   │        NEUN         │   DER
//            │                     │
//     1: RL (CH 3-5) ────── 3: RR (CH 9-11)
//
//   Por cada pata (leg * 3 + joint):
//     joint 0 = Coxa  (horquilla azul, giro horizontal)
//     joint 1 = Fémur (eslabón blanco, elevación)
//     joint 2 = Tibia (eslabón rojo, extensión)
//
// CONVENCION FISICA (image-1.png, servos de coxa montados derechos):
//   - Izquierdas (FL=0, RL=1): +° Coxa = CCW (atrás), +° Fémur = sube, +° Tibia = extiende
//   - Derechas   (FR=2, RR=3): +° Coxa = CCW (adelante), -° Fémur = sube, -° Tibia = extiende
//
// CINEMATICA:
//   - Sistema mano derecha en mm: +X adelante, +Y izquierda, +Z arriba
//   - Transformacion completa 6-GDL del chasis (traslacion X/Y/Z + pitch/roll/yaw)
//   - IK analitica 3-GDL "rodilla arriba" (sin NaN, alcance protegido)
//   - Marcha Creep estaticamente estable RL -> FL -> RR -> FR con transferencia
//     anticipada de centro de gravedad (CoG) y swing en 3 subfases sin arrastre
//   - Trote diagonal FL+RR <-> FR+RL con doble apoyo de transicion
//   - Modos completos: STAND (+ IMU stabilize), WALK_FWD, TROT, CRAWL,
//     TURN_LEFT/RIGHT, CRAB_LEFT/RIGHT, SPIRAL, EXPLORE, FOLLOW,
//     TILT 3D, ELEVATE (sube y baja), PUSHUP (flexiones reales),
//     WAVE (con transferencia de peso), DANCE, SENTRY (escaneo yaw),
//     JUMP (impulso seguro en 5 fases), SLEEP y altura manual body.z
// ============================================================================

#define SERVO_LEGS        4
#define SERVO_JOINTS      3
#define SERVO_MIN_ANGLE   10
#define SERVO_NEUTRAL     90
#define SERVO_MAX_ANGLE   170

bool    servosInit();
void    servosUpdate();
bool    servosIsOnline();
uint8_t servoGetAngle(uint8_t leg, uint8_t joint);
uint8_t servoGetRawAngle(uint8_t leg, uint8_t joint);
uint8_t servoGetCenterAngle(uint8_t leg, uint8_t joint);
bool    servoSetAngle(uint8_t leg, uint8_t joint, uint8_t angle);
bool    servoSetChannel(uint8_t channel, uint8_t angle);
void    servoStand();
void    servoCenterAll();
void    servoCenterRaw90();
bool    servoSaveCurrentAsStand();
bool    servoSetDir(uint8_t leg, uint8_t joint, int8_t dir);
int8_t  servoGetDir(uint8_t leg, uint8_t joint);
bool    servosAreCalibrated();
bool    servoTestPose(uint8_t leg, const char* action);
void    servosSetEnabled(bool on);
bool    servoSetTrim(uint8_t leg, uint8_t joint, int8_t offsetDeg);
int8_t  servoGetTrim(uint8_t leg, uint8_t joint);
void    servoResetTrims();
const char* servosGetBootSource();

#endif  // ACTUADORES_SERVOS_H

// ==========================================================================
//  [20] ACTUADOR · SERVOS (PCA9685)
//  fuente: servos.cpp  (Motor cinemático 6-GDL + IK 3-GDL unificado con NEUN 3D)
// ==========================================================================

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// ----------------------------------------------------------------------------
// Identificadores de pata (coinciden 1:1 con panel/index.html y neun3d.js)
// ----------------------------------------------------------------------------
enum NeunLeg : uint8_t {
  LEG_FL = 0,  // Delantera Izquierda -> CH 0 (C), CH 1 (F), CH 2 (T)
  LEG_RL = 1,  // Trasera Izquierda   -> CH 3 (C), CH 4 (F), CH 5 (T)
  LEG_FR = 2,  // Delantera Derecha   -> CH 6 (C), CH 7 (F), CH 8 (T)
  LEG_RR = 3,  // Trasera Derecha     -> CH 9 (C), CH 10 (F), CH 11 (T)
};

static const char* const LEG_LABELS[SERVO_LEGS] = {
  "FL (CH 0-2)", "RL (CH 3-5)", "FR (CH 6-8)", "RR (CH 9-11)"
};

// ----------------------------------------------------------------------------
// Calibracion mecanica por servo (ajustar aqui segun armado fisico)
// ----------------------------------------------------------------------------

// Centro mecanico en grados cuando la pata esta en postura STAND neutra.
// Ajustar ±5..10° si algun horn quedo levemente corrido al atornillar.
static const float SERVO_CENTER[SERVO_LEGS][SERVO_JOINTS] = {
  { 90.0f, 90.0f, 90.0f }, // 0: FL (CH 0-2)  Coxa, Femur, Tibia
  { 90.0f, 90.0f, 90.0f }, // 1: RL (CH 3-5)
  { 90.0f, 90.0f, 90.0f }, // 2: FR (CH 6-8)
  { 90.0f, 90.0f, 90.0f }, // 3: RR (CH 9-11)
};

// Sentido electrico/mecanico REAL de cada servo en el chasis NEUN (verificado
// directamente en el CAD):
//   - Las 4 Coxas (CH 0, 3, 6, 9) van verticales con el eje hacia ARRIBA (+Z):
//     +° (CCW desde arriba) = +1 en las 4 patas (FL/RL avanzan con -, FR/RR con +)
//   - Fémur y Tibia en patas DELANTERAS (FL, FR): los horns miran hacia ADELANTE (+X)
//     -> FL = { +1, +1 } | FR = { -1, -1 }
//   - Fémur y Tibia en patas TRASERAS (RL, RR): los horns miran hacia ATRÁS (-X,
//     espejadas adelante/atrás respecto a las delanteras!)
//     -> RL = { -1, -1 } (opuesto a FL) | RR = { +1, +1 } (opuesto a FR!)
// Si en tu armado físico algún servo puntual gira al revés, cambiá SOLO su ±1.
static const int8_t SERVO_DIRECTION[SERVO_LEGS][SERVO_JOINTS] = {
  {  1,  1,  1 }, // 0: FL (CH 0-2)  Delantera Izq. (horns adelante)
  {  1, -1, -1 }, // 1: RL (CH 3-5)  Trasera Izq.   (horns atrás -> espejo de FL)
  {  1, -1, -1 }, // 2: FR (CH 6-8)  Delantera Der. (horns adelante -> espejo de FL)
  {  1,  1,  1 }, // 3: RR (CH 9-11) Trasera Der.   (horns atrás -> espejo de FR)
};

// ----------------------------------------------------------------------------
// Estado interno del motor cinematico + anti-vibracion + persistencia NVS
// ----------------------------------------------------------------------------
static Adafruit_PWMServoDriver s_pwm(PCA9685_I2C_ADDR);
static Preferences             s_srvPrefs;

static bool     srv_s_online   = false;
static bool     s_enabled      = true;
static uint32_t s_nextUpdateMs = 0;
static uint32_t s_lastStepMs   = 0;

static float    s_angle[SERVO_LEGS][SERVO_JOINTS];        // angulo actual suavizado (deg)
static float    s_vel[SERVO_LEGS][SERVO_JOINTS];          // velocidad angular actual (deg/s)
static float    s_targetAngle[SERVO_LEGS][SERVO_JOINTS];  // angulo objetivo IK (deg)
static uint16_t s_lastCounts[SERVO_LEGS][SERVO_JOINTS];   // ultimo pulso 12-bit enviado al PCA9685
static int8_t   s_trim[SERVO_LEGS][SERVO_JOINTS];         // ajuste fino persistente en NVS (-75..+75 deg)
static int8_t   s_dir[SERVO_LEGS][SERVO_JOINTS];          // sentido real por servo (+1/-1) persistente en NVS
static bool     s_calibrated    = false;                  // true si existe postura STAND guardada en NVS
static uint8_t  s_lastSavedNvs[SERVO_LEGS][SERVO_JOINTS]; // ultima postura grabada en NVS
static uint32_t s_lastNvsSaveMs = 0;
static float    s_calmTimerS    = 0.0f;
static bool     s_manualHold    = false;
static bool     s_centerHold    = false;

// Rampa de arranque suave (desde postura previa leida -> postura inicial STAND)
static bool     s_bootRampActive  = false;
static float    s_bootRampElapsed = 0.0f;
static float    s_bootStart[SERVO_LEGS][SERVO_JOINTS];
static char     s_bootSource[24]  = "DEFAULT";

// Transicion suave al cambiar entre modos (evita golpes/sacudidas)
static float    s_modeBlendTimer  = 0.0f;
static float    s_imuFiltPitch    = 0.0f;
static float    s_imuFiltRoll     = 0.0f;

// Estado dinamico de marcha y rutinas
static float    s_gaitPhase    = 0.0f;
static float    s_strideScale  = 0.0f;
static float    s_modeClock    = 0.0f;
static char     s_lastMode[20] = "STAND";

// Estado suavizado del chasis en mm y radianes
static float    s_bodyShiftX   = 0.0f;  // + adelante (mm)
static float    s_bodyShiftY   = 0.0f;  // + izquierda (mm)
static float    s_bodyShiftZ   = 0.0f;  // + arriba respecto a STAND (mm)
static float    s_bodyPitch    = 0.0f;  // + nariz arriba (rad)
static float    s_bodyRoll     = 0.0f;  // + lado izquierdo arriba (rad)
static float    s_bodyYaw      = 0.0f;  // + giro antihorario CCW (rad)
static float    s_userHeightMm = 0.0f;  // altura manual suavizada desde body.z

// Estado interno del modo EXPLORE (giros suaves)
static float    s_exploreTimer = 0.0f;
static float    s_exploreTurn  = 0.0f;

// Pose neutra STAND precalculada por pata
static LegPose  s_standPose[SERVO_LEGS];
static float    s_standFootX[SERVO_LEGS];
static float    s_standFootY[SERVO_LEGS];

// ----------------------------------------------------------------------------
// Utilidades matematicas y conversion PWM <-> grados
// ----------------------------------------------------------------------------
static inline float clampf(float value, float lo, float hi) {
  return value < lo ? lo : (value > hi ? hi : value);
}

static inline float lerpf(float a, float b, float t) {
  return a + (b - a) * t;
}

static inline float smoothstepf(float e0, float e1, float x) {
  const float u = clampf((x - e0) / fmaxf(e1 - e0, 1e-5f), 0.0f, 1.0f);
  return u * u * (3.0f - 2.0f * u);
}

static inline float radToDeg(float r) { return r * (180.0f / (float)M_PI); }
static inline float degToRad(float d) { return d * ((float)M_PI / 180.0f); }

static inline uint8_t channelOf(uint8_t leg, uint8_t joint) {
  return (uint8_t)(leg * SERVO_JOINTS + joint);
}

static inline float getServoCenter(uint8_t leg, uint8_t joint) {
  return clampf(SERVO_CENTER[leg][joint] + (float)s_trim[leg][joint],
                (float)SERVO_MIN_ANGLE, (float)SERVO_MAX_ANGLE);
}

static inline float legSideSign(uint8_t leg) {
  // +1 = Izquierda (+Y: FL=0, RL=1) | -1 = Derecha (-Y: FR=2, RR=3)
  return (leg < 2) ? 1.0f : -1.0f;
}

static inline float legFrontSign(uint8_t leg) {
  // +1 = Delantera (+X: FL=0, FR=2) | -1 = Trasera (-X: RL=1, RR=3)
  return (leg == LEG_FL || leg == LEG_FR) ? 1.0f : -1.0f;
}

static float angleToCountsFloat(float angle) {
  angle = clampf(angle, 0.0f, 180.0f);
  const float pulse = (float)SERVO_PULSE_MIN_US
                    + (angle / 180.0f) * (float)(SERVO_PULSE_MAX_US - SERVO_PULSE_MIN_US);
  return clampf((pulse * 4096.0f) / (float)SERVO_PWM_PERIOD_US, 0.0f, 4095.0f);
}

static uint16_t angleToCounts(float angle) {
  return (uint16_t)(angleToCountsFloat(angle) + 0.5f);
}

static float countsToAngle(uint16_t counts) {
  const float pulse = ((float)counts * (float)SERVO_PWM_PERIOD_US) / 4096.0f;
  const float angle = ((pulse - (float)SERVO_PULSE_MIN_US)
                    / (float)(SERVO_PULSE_MAX_US - SERVO_PULSE_MIN_US)) * 180.0f;
  return clampf(angle, (float)SERVO_MIN_ANGLE, (float)SERVO_MAX_ANGLE);
}

static float clampServoAngle(float a) {
  return clampf(a, (float)SERVO_MIN_ANGLE, (float)SERVO_MAX_ANGLE);
}

// Envia el pulso PWM al canal con fase escalonada (on = ch * 340 ticks)
// para evitar que los 12 servos consuman pico de corriente al mismo instante.
static void writeChannelStaggered(uint8_t leg, uint8_t joint, uint16_t counts) {
  const uint8_t  ch  = channelOf(leg, joint);
  const uint16_t on  = (uint16_t)((ch * SERVO_PHASE_STEP_TICKS) & 0x0FFF);
  const uint16_t off = (uint16_t)((on + counts) & 0x0FFF);
  s_pwm.setPWM(ch, on, off);
  s_lastCounts[leg][joint] = counts;
}

// Lectura directa por I2C de los 12 canales del PCA9685 ANTES de resetearlo:
// en reinicios en caliente (reset ESP32 / carga USB con bateria conectada),
// el PCA9685 aun conserva los pulsos exactos donde quedo cada servo!
static bool readPca9685CurrentAngles(float outAngles[SERVO_LEGS][SERVO_JOINTS]) {
  Wire.beginTransmission(PCA9685_I2C_ADDR);
  Wire.write((uint8_t)0x00); // registro MODE1
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom((uint8_t)PCA9685_I2C_ADDR, (uint8_t)1) != 1) return false;
  const uint8_t mode1 = Wire.read();
  if (mode1 & 0x10) return false; // bit SLEEP activo -> encendido en frio

  uint8_t validCount = 0;
  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
      const uint8_t reg = (uint8_t)(0x06 + 4 * channelOf(l, j));
      Wire.beginTransmission(PCA9685_I2C_ADDR);
      Wire.write(reg);
      if (Wire.endTransmission(false) != 0) continue;
      if (Wire.requestFrom((uint8_t)PCA9685_I2C_ADDR, (uint8_t)4) != 4) continue;
      const uint8_t onL  = Wire.read();
      const uint8_t onH  = Wire.read();
      const uint8_t offL = Wire.read();
      const uint8_t offH = Wire.read();
      if ((onH & 0x10) || (offH & 0x10)) continue; // FULL_ON o FULL_OFF
      const uint16_t on     = (uint16_t)(((uint16_t)(onH  & 0x0F) << 8) | onL);
      const uint16_t off    = (uint16_t)(((uint16_t)(offH & 0x0F) << 8) | offL);
      const uint16_t counts = (uint16_t)((off - on) & 0x0FFF);
      if (counts >= 80 && counts <= 560) {
        outAngles[l][j] = countsToAngle(counts);
        validCount++;
      }
    }
  }
  return validCount >= 6; // al menos media arana con pulsos reales validos
}

// Carga trims mecanicos + polaridades + ultima postura guardada desde NVS (Preferences)
static bool loadServosFromNvs(float outLastPose[SERVO_LEGS][SERVO_JOINTS]) {
  bool hasPose = false;
  s_calibrated = false;
  if (!s_srvPrefs.begin("neun_srv", true)) return false;

  int8_t savedTrim[SERVO_COUNT];
  if (s_srvPrefs.getBytesLength("trim") == sizeof(savedTrim) &&
      s_srvPrefs.getBytes("trim", savedTrim, sizeof(savedTrim)) == sizeof(savedTrim)) {
    for (uint8_t l = 0; l < SERVO_LEGS; l++) {
      for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
        s_trim[l][j] = (int8_t)constrain((int)savedTrim[channelOf(l, j)], -75, 75);
        if (s_trim[l][j] != 0) s_calibrated = true;
      }
    }
  }

  int8_t savedDir[SERVO_COUNT];
  if (s_srvPrefs.getBytesLength("dir") == sizeof(savedDir) &&
      s_srvPrefs.getBytes("dir", savedDir, sizeof(savedDir)) == sizeof(savedDir)) {
    for (uint8_t l = 0; l < SERVO_LEGS; l++) {
      for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
        const int8_t d = savedDir[channelOf(l, j)];
        s_dir[l][j] = (d < 0) ? -1 : 1;
        if (s_dir[l][j] != SERVO_DIRECTION[l][j]) s_calibrated = true;
      }
    }
  }

  uint8_t savedPose[SERVO_COUNT];
  if (s_srvPrefs.getBytesLength("last") == sizeof(savedPose) &&
      s_srvPrefs.getBytes("last", savedPose, sizeof(savedPose)) == sizeof(savedPose)) {
    hasPose = true;
    for (uint8_t l = 0; l < SERVO_LEGS; l++) {
      for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
        const uint8_t a = (uint8_t)constrain((int)savedPose[channelOf(l, j)],
                                             SERVO_MIN_ANGLE, SERVO_MAX_ANGLE);
        outLastPose[l][j]    = (float)a;
        s_lastSavedNvs[l][j] = a;
      }
    }
  }
  s_srvPrefs.end();
  return hasPose;
}

static void saveTrimsToNvs() {
  if (!s_srvPrefs.begin("neun_srv", false)) return;
  int8_t buf[SERVO_COUNT];
  int8_t dbuf[SERVO_COUNT];
  s_calibrated = false;
  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
      buf[channelOf(l, j)]  = s_trim[l][j];
      dbuf[channelOf(l, j)] = s_dir[l][j];
      if (s_trim[l][j] != 0 || s_dir[l][j] != SERVO_DIRECTION[l][j]) s_calibrated = true;
    }
  }
  s_srvPrefs.putBytes("trim", buf, sizeof(buf));
  s_srvPrefs.putBytes("dir", dbuf, sizeof(dbuf));
  s_srvPrefs.end();
}

static void savePoseToNvsIfNeeded(bool force) {
  const uint32_t now = millis();
  if (!force && (now - s_lastNvsSaveMs) < 2500UL) return;

  bool changed = false;
  uint8_t buf[SERVO_COUNT];
  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
      const uint8_t a = (uint8_t)(clampServoAngle(s_angle[l][j]) + 0.5f);
      buf[channelOf(l, j)] = a;
      if (abs((int)a - (int)s_lastSavedNvs[l][j]) >= 3) changed = true;
    }
  }
  if (!changed && !force) return;

  if (!s_srvPrefs.begin("neun_srv", false)) return;
  s_srvPrefs.putBytes("last", buf, sizeof(buf));
  s_srvPrefs.end();
  for (uint8_t l = 0; l < SERVO_LEGS; l++)
    for (uint8_t j = 0; j < SERVO_JOINTS; j++)
      s_lastSavedNvs[l][j] = buf[channelOf(l, j)];
  s_lastNvsSaveMs = now;
}

// Filtro de 2do orden criticamente amortiguado (zeta = 1.0 -> cero sobrepaso)
// + limite de aceleracion y velocidad + banda muerta con histeresis en ticks:
// elimina la vibracion/temblor de cada servo y evita trafico I2C innecesario.
static void flushSmoothedServos(float dt, float omega, float maxVelDegS, float maxAccelDegS2) {
  if (!srv_s_online || !s_enabled) return;

  const float h = clampf(dt, 0.004f, 0.05f) * 0.5f; // 2 sub-pasos -> estabilidad garantizada
  float maxSpeedNow = 0.0f;

  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
      const float target = clampServoAngle(s_targetAngle[l][j]);
      float pos = s_angle[l][j];
      float vel = s_vel[l][j];

      if (fabsf(target - pos) < 0.12f && fabsf(vel) < 1.2f) {
        pos = target;
        vel = 0.0f;
      } else {
        for (uint8_t sub = 0; sub < 2; sub++) {
          float acc = omega * omega * (target - pos) - 2.0f * omega * vel;
          acc = clampf(acc, -maxAccelDegS2, maxAccelDegS2);
          vel = clampf(vel + acc * h, -maxVelDegS, maxVelDegS);
          pos = clampServoAngle(pos + vel * h);
        }
      }

      s_angle[l][j] = pos;
      s_vel[l][j]   = vel;
      if (fabsf(vel) > maxSpeedNow) maxSpeedNow = fabsf(vel);

      // Banda muerta con histeresis: solo escribe al PCA9685 si el pulso cambia de verdad
      const float    fCounts  = angleToCountsFloat(pos);
      const uint16_t prevCnt  = s_lastCounts[l][j];
      if (prevCnt == 0xFFFF || fabsf(fCounts - (float)prevCnt) >= SERVO_DEADBAND_COUNTS) {
        const uint16_t newCnt = (uint16_t)(fCounts + 0.5f);
        if (newCnt != prevCnt) {
          writeChannelStaggered(l, j, newCnt);
        }
      }
    }
  }

  // Si la arana quedo estable en una postura > 0.6 s, respaldar postura en NVS
  if (maxSpeedNow < 4.0f) {
    s_calmTimerS += dt;
    if (s_calmTimerS >= 0.60f) {
      savePoseToNvsIfNeeded(false);
    }
  } else {
    s_calmTimerS = 0.0f;
  }
}

// ----------------------------------------------------------------------------
// Cinematica inversa analitica 3-GDL (rodilla arriba) y transformacion 6-GDL
//
// Sistema de coordenadas en mm (mano derecha):
//   +X = adelante | +Y = izquierda | +Z = arriba
//   En marco del suelo: el piso es Z = 0 y las caderas en STAND estan en
//   Z = SERVO_STAND_HEIGHT_MM.
// ----------------------------------------------------------------------------
static bool solveLegIKBody(uint8_t leg, float bx, float by, float bz, LegPose& pose) {
  if (leg >= SERVO_LEGS) return false;

  const float side  = legSideSign(leg);   // +1 izquierda (+Y), -1 derecha (-Y)
  const float front = legFrontSign(leg);  // +1 adelante (+X),  -1 atras (-X)

  const float hipX = front * SERVO_HIP_OFFSET_X_MM;
  const float hipY = side  * SERVO_HIP_OFFSET_Y_MM;

  const float dx = bx - hipX;
  const float dy = by - hipY;
  const float dz = bz;                    // plano de caderas en marco cuerpo = 0

  // Vector radial hacia afuera R0 = (0, side, 0); tangente CCW (+Z x R0) = (-side, 0, 0)
  const float dR = dy * side;
  const float dT = -side * dx;

  // Angulo horizontal de la coxa (+ = CCW visto desde arriba), limitado a ±47°
  const float thetaC = clampf(atan2f(dT, fmaxf(5.0f, dR)), -0.82f, 0.82f);

  float rHoriz = fmaxf(5.0f, hypotf(dR, dT) - SERVO_COXA_LENGTH_MM);
  float uVert  = dz;

  const float Lf = SERVO_FEMUR_LENGTH_MM;
  const float Lt = SERVO_TIBIA_LENGTH_MM;
  float D = hypotf(rHoriz, uVert);
  const float minD = fabsf(Lf - Lt) + 4.0f;
  const float maxD = (Lf + Lt) * 0.96f;
  if (D < minD || D > maxD) {
    const float safeD = clampf(D, minD, maxD);
    const float sc = safeD / fmaxf(D, 1e-4f);
    rHoriz *= sc;
    uVert  *= sc;
    D = safeD;
  }

  const float cosPsi   = clampf((Lf * Lf + D * D - Lt * Lt) / (2.0f * Lf * D), -1.0f, 1.0f);
  const float cosGamma = clampf((Lf * Lf + Lt * Lt - D * D) / (2.0f * Lf * Lt), -1.0f, 1.0f);
  const float beta     = atan2f(uVert, rHoriz);
  const float psi      = acosf(cosPsi);
  const float gamma    = acosf(cosGamma);

  // Solucion "rodilla arriba" (igual que neun3d.js):
  //   alphaF: elevacion del femur sobre la horizontal (+ = sube)
  //   relT  : apertura relativa de la tibia (gamma - pi: + = extiende hacia afuera)
  const float alphaF = beta + psi;
  const float relT   = gamma - (float)M_PI;

  pose.coxa  = radToDeg(thetaC);
  pose.femur = radToDeg(alphaF);
  pose.tibia = radToDeg(relT);

  return isfinite(pose.coxa) && isfinite(pose.femur) && isfinite(pose.tibia);
}

// Convierte un punto del pie en marco del suelo (piso Z=0) al marco local del
// chasis aplicando posicion (shiftX/Y/Z + altura) y rotacion (yaw, pitch, roll).
//   +pitch = nariz arriba | +roll = lado izquierdo arriba | +yaw = giro CCW
static void groundToBodyLocal(float gx, float gy, float gz,
                              float& bx, float& by, float& bz) {
  const float bodyZ = SERVO_STAND_HEIGHT_MM + s_userHeightMm + s_bodyShiftZ;
  const float qx = gx - s_bodyShiftX;
  const float qy = gy - s_bodyShiftY;
  const float qz = gz - bodyZ;

  // Inversa de Rz(yaw) * Ry(-pitch) * Rx(roll) = Rx(-roll) * Ry(+pitch) * Rz(-yaw)
  const float cy = cosf(s_bodyYaw), sy = sinf(s_bodyYaw);
  const float x1 =  cy * qx + sy * qy;
  const float y1 = -sy * qx + cy * qy;
  const float z1 =  qz;

  const float cp = cosf(s_bodyPitch), sp = sinf(s_bodyPitch);
  const float x2 =  cp * x1 + sp * z1;
  const float y2 =  y1;
  const float z2 = -sp * x1 + cp * z1;

  const float cr = cosf(s_bodyRoll), sr = sinf(s_bodyRoll);
  bx = x2;
  by =  cr * y2 + sr * z2;
  bz = -sr * y2 + cr * z2;
}

static void initStandReference() {
  const float rTotal = SERVO_COXA_LENGTH_MM + SERVO_STAND_RADIAL_MM;
  const float splay  = degToRad(SERVO_STAND_SPLAY_DEG);
  const float cosS   = cosf(splay);
  const float sinS   = sinf(splay);

  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    const float side  = legSideSign(l);
    const float front = legFrontSign(l);
    const float hipX  = front * SERVO_HIP_OFFSET_X_MM;
    const float hipY  = side  * SERVO_HIP_OFFSET_Y_MM;

    // Postura atletica en X: patas delanteras abiertas +17° adelante, traseras -17° atras
    s_standFootX[l] = hipX + front * rTotal * sinS;
    s_standFootY[l] = hipY + side  * rTotal * cosS;

    solveLegIKBody(l, s_standFootX[l], s_standFootY[l], -SERVO_STAND_HEIGHT_MM, s_standPose[l]);
  }
}

static void setLegTargetFromGround(uint8_t leg, float gx, float gy, float gz) {
  float bx = 0.0f, by = 0.0f, bz = 0.0f;
  groundToBodyLocal(gx, gy, gz, bx, by, bz);
  LegPose pose;
  if (!solveLegIKBody(leg, bx, by, bz, pose)) return;

  const float logical[SERVO_JOINTS] = { pose.coxa, pose.femur, pose.tibia };
  const float neutral[SERVO_JOINTS] = { s_standPose[leg].coxa, s_standPose[leg].femur, s_standPose[leg].tibia };
  for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
    const float out = getServoCenter(leg, j)
                    + (float)s_dir[leg][j] * (logical[j] - neutral[j]);
    s_targetAngle[leg][j] = clampServoAngle(out);
  }
}

// ----------------------------------------------------------------------------
// Definicion de marchas (gaits) — orden estaticamente estable RL -> FL -> RR -> FR
//   ph = frac(s_gaitPhase + phase[leg]) dispara SWING cuando ph in [0, swingFraction)
//   Creep/Crawl:
//     s_gaitPhase = 0.00 -> RL (1)  [0.00 + 0.00 = 0.00]
//     s_gaitPhase = 0.25 -> FL (0)  [0.25 + 0.75 = 1.00]
//     s_gaitPhase = 0.50 -> RR (3)  [0.50 + 0.50 = 1.00]
//     s_gaitPhase = 0.75 -> FR (2)  [0.75 + 0.25 = 1.00]
//   Trot diagonal:
//     s_gaitPhase = 0.00 -> FL (0) + RR (3)
//     s_gaitPhase = 0.50 -> RL (1) + FR (2)
// ----------------------------------------------------------------------------
/* [tipo GaitDef definido arriba] */

static const GaitDef GAIT_WALK  = { "WALK",  { 0.75f, 0.00f, 0.25f, 0.50f }, 0.25f };
static const GaitDef GAIT_CRAWL = { "CRAWL", { 0.75f, 0.00f, 0.25f, 0.50f }, 0.25f };
static const GaitDef GAIT_TROT  = { "TROT",  { 0.00f, 0.50f, 0.50f, 0.00f }, 0.42f };

// Trayectoria C2-continua de minimo tiron (1:1 con neun3d.js):
//   - SWING horizontal: polinomio de 5to grado 10p^3 - 15p^4 + 6p^5 (v=0 y a=0 al despegar y apoyar!)
//   - SWING vertical:   campana suave sin^2(pi*p) (v=0 al despegar y al apoyar -> cero golpes!)
//   - STANCE:           empuje lineal constante +0.5 -> -0.5 (cero patinaje en el piso)
static void evalStepCurve(float local, float swingFrac, float& sweep, float& lift) {
  if (local < swingFrac) {
    const float p  = clampf(local / swingFrac, 0.0f, 1.0f);
    const float p2 = p * p;
    const float p3 = p2 * p;
    const float mj = p3 * (10.0f + p * (-15.0f + 6.0f * p));
    const float s  = sinf((float)M_PI * p);
    sweep = -0.5f + mj;
    lift  = s * s;
  } else {
    const float duty = fmaxf(0.10f, 1.0f - swingFrac);
    const float p = (local - swingFrac) / duty;
    sweep = 0.5f - p;
    lift  = 0.0f;
  }
}

// Selecciona gait y direccion unificada:
//   fwd         > 0 : adelante (+X)
//   strafeRight > 0 : derecha  (-Y)  [corregido: joyX, move y CRAB coinciden!]
//   turnRight   > 0 : giro horario CW (-Z)
static bool selectLocomotion(const char* mode, const GaitDef*& gait,
                             float& fwd, float& strafeRight, float& turnRight,
                             bool& isCrawl, bool& isTrot, float dt) {
  gait = &GAIT_WALK;
  fwd = 0.0f; strafeRight = 0.0f; turnRight = 0.0f;
  isCrawl = false; isTrot = false;

  // Entradas manuales (joystick vectorial + botones D-pad + rotate)
  fwd         = robotState.joyY;   // + adelante
  strafeRight = robotState.joyX;   // + derecha
  turnRight   = robotState.rotate; // + horario (derecha)
  if (fabsf(fwd) < 0.05f && fabsf(strafeRight) < 0.05f && fabsf(turnRight) < 0.05f) {
    if      (robotState.move == "forward")    fwd         =  1.0f;
    else if (robotState.move == "backward")   fwd         = -1.0f;
    else if (robotState.move == "right" || robotState.move == "crab_right") strafeRight =  1.0f;
    else if (robotState.move == "left"  || robotState.move == "crab_left")  strafeRight = -1.0f;
    else if (robotState.move == "turn_right") turnRight   =  1.0f;
    else if (robotState.move == "turn_left")  turnRight   = -1.0f;
  }

  const bool hasManualDrive = (fabsf(fwd) > 0.05f || fabsf(strafeRight) > 0.05f || fabsf(turnRight) > 0.05f);

  // Si hay mando manual activo, siempre responde de inmediato (incluso desde STAND o poses)
  if (!mode || !mode[0] || strcasecmp(mode, "STAND") == 0) {
    if (!hasManualDrive) return false;
    gait = &GAIT_WALK;
  } else if (strcasecmp(mode, "WALK_FWD") == 0) {
    gait = &GAIT_WALK;
    if (!hasManualDrive) fwd = 1.0f;
  } else if (strcasecmp(mode, "TROT") == 0) {
    gait = &GAIT_TROT; isTrot = true;
    if (!hasManualDrive) fwd = 1.0f;
  } else if (strcasecmp(mode, "CRAWL") == 0) {
    gait = &GAIT_CRAWL; isCrawl = true;
    if (!hasManualDrive) fwd = 0.85f;
  } else if (hasManualDrive) {
    gait = &GAIT_WALK;
  } else if (strcasecmp(mode, "TURN_LEFT") == 0) {
    gait = &GAIT_WALK;
    if (fabsf(turnRight) < 0.05f) turnRight = -1.0f;
  } else if (strcasecmp(mode, "TURN_RIGHT") == 0) {
    gait = &GAIT_WALK;
    if (fabsf(turnRight) < 0.05f) turnRight =  1.0f;
  } else if (strcasecmp(mode, "CRAB_LEFT") == 0) {
    gait = &GAIT_WALK;
    if (fabsf(strafeRight) < 0.05f) strafeRight = -1.0f;
  } else if (strcasecmp(mode, "CRAB_RIGHT") == 0) {
    gait = &GAIT_WALK;
    if (fabsf(strafeRight) < 0.05f) strafeRight =  1.0f;
  } else if (strcasecmp(mode, "SPIRAL") == 0) {
    gait = &GAIT_WALK;
    fwd = 0.90f;
    turnRight = 0.45f + 0.30f * sinf(s_modeClock * 0.30f);
  } else if (strcasecmp(mode, "EXPLORE") == 0) {
    gait = &GAIT_WALK;
    s_exploreTimer -= dt;
    if (s_exploreTimer <= 0.0f) {
      s_exploreTimer = 2.8f;
      // Si el ultrasonico detecta obstaculo valido (>1 cm y <28 cm) gira para esquivarlo
      const float dist = ultrasonicIsOnline() ? ultrasonicGetCm() : 0.0f;
      if (dist > 1.0f && dist < 28.0f) s_exploreTurn = (s_exploreTurn >= 0.0f) ? 0.85f : -0.85f;
      else                             s_exploreTurn = sinf(s_modeClock * 0.41f) * 0.45f;
    }
    fwd = (fabsf(s_exploreTurn) > 0.7f) ? 0.25f : 0.90f;
    turnRight = s_exploreTurn;
  } else if (strcasecmp(mode, "FOLLOW") == 0) {
    gait = &GAIT_TROT; isTrot = true;
    const float dist = ultrasonicIsOnline() ? ultrasonicGetCm() : 0.0f;
    if      (dist > 48.0f && dist < 180.0f) fwd =  0.85f;
    else if (dist > 1.0f  && dist < 24.0f)  fwd = -0.60f;
    else if (dist <= 1.0f && !hasManualDrive) fwd = ultrasonicIsOnline() ? 0.0f : 0.80f;
    else                                    fwd =  0.0f;
  } else {
    return false;
  }

  const float mag = hypotf(fwd, strafeRight);
  if (mag > 1.0f) { fwd /= mag; strafeRight /= mag; }
  turnRight = clampf(turnRight, -1.0f, 1.0f);
  return true;
}

// ----------------------------------------------------------------------------
// Generador de rutinas especiales (identicas al modelo 3D NEUN)
// ----------------------------------------------------------------------------
static void updateSpecialPose(const char* mode, float dt, float& slewAlpha) {
  const float speedFactor = clampf(0.45f + (robotState.speed / 100.0f) * 0.90f, 0.35f, 1.35f);
  s_modeClock += dt * speedFactor;
  const float t = s_modeClock;

  // Pies apoyados en el suelo (Z = 0) por defecto
  float fx[SERVO_LEGS], fy[SERVO_LEGS], fz[SERVO_LEGS];
  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    fx[l] = s_standFootX[l];
    fy[l] = s_standFootY[l];
    fz[l] = 0.0f;
  }

  float tx = 0.0f, ty = 0.0f, tz = 0.0f;
  float tPitch = 0.0f, tRoll = 0.0f, tYaw = 0.0f;
  float bodyLerp = clampf(dt * 10.0f, 0.08f, 0.36f);
  slewAlpha = SERVO_SLEW_ALPHA;

  if (!mode || !mode[0] || strcasecmp(mode, "STAND") == 0) {
    // Postura estable + inclinacion manual (bodyPitch/bodyRoll) + nivelacion IMU
    tPitch = clampf(robotState.bodyPitch * 0.22f, -0.24f, 0.24f);
    tRoll  = clampf(robotState.bodyRoll  * 0.22f, -0.24f, 0.24f);
    if (robotState.stabilize && imuIsOnline()) {
      // Filtro paso bajo + banda muerta +-1.5 deg en IMU para evitar vibracion en patas
      s_imuFiltPitch = lerpf(s_imuFiltPitch, imuGetPitch(), 0.14f);
      s_imuFiltRoll  = lerpf(s_imuFiltRoll,  imuGetRoll(),  0.14f);
      const float pDeg = (fabsf(s_imuFiltPitch) > 1.5f) ? s_imuFiltPitch : 0.0f;
      const float rDeg = (fabsf(s_imuFiltRoll)  > 1.5f) ? s_imuFiltRoll  : 0.0f;
      tPitch = clampf(tPitch - degToRad(pDeg) * 0.65f, -0.26f, 0.26f);
      tRoll  = clampf(tRoll  - degToRad(rDeg) * 0.65f, -0.26f, 0.26f);
    }
  } else if (strcasecmp(mode, "TILT") == 0) {
    // Balanceo 3D circular (1:1 con neun3d.js)
    const float w = t * 1.85f;
    tPitch = sinf(w) * 0.20f;
    tRoll  = cosf(w) * 0.20f;
    tYaw   = sinf(w * 0.5f) * 0.10f;
    tx     = cosf(w) * 5.25f;
    ty     = -sinf(w) * 5.25f;
  } else if (strcasecmp(mode, "ELEVATE") == 0) {
    // Sube y Baja horizontal (1:1 con neun3d.js)
    const float raw = sinf(t * 1.85f);
    const float shaped = raw * (1.26f - 0.26f * raw * raw);
    tz = (shaped >= 0.0f)
       ? shaped * (SERVO_BODY_RISE_MAX_MM * 0.90f)
       : shaped * (SERVO_BODY_DROP_MAX_MM * 0.92f);
  } else if (strcasecmp(mode, "PUSHUP") == 0) {
    // Flexiones reales (1:1 con neun3d.js)
    const float p = fmodf(t * 0.54f, 1.0f);
    float down = 0.0f;
    if      (p < 0.42f) down = smoothstepf(0.00f, 0.42f, p);
    else if (p < 0.54f) down = 1.0f;
    else if (p < 0.86f) down = 1.0f - smoothstepf(0.54f, 0.86f, p);
    else                down = 0.0f;

    for (uint8_t l = 0; l < SERVO_LEGS; l++) {
      if (l == LEG_FL || l == LEG_FR) {
        fx[l] += 6.0f;
        fy[l] *= 1.05f;
      } else {
        fx[l] -= 6.0f;
      }
    }
    tPitch = lerpf(0.14f, -0.21f, down);                      // +8° arriba -> -12° abajo
    tz     = lerpf(SERVO_BODY_RISE_MAX_MM * 0.42f,
                   -SERVO_BODY_DROP_MAX_MM * 0.56f, down);
    tx     = lerpf(-4.5f, 6.75f, down);
  } else if (strcasecmp(mode, "WAVE") == 0) {
    // Saludo equilibrado alternando FR y FL (1:1 con neun3d.js)
    const float cycle = fmodf(t * 0.42f, 2.0f);
    const bool  waveRight = (cycle < 1.0f);
    const float local = fmodf(cycle, 1.0f);
    const float env   = smoothstepf(0.06f, 0.22f, local)
                      * (1.0f - smoothstepf(0.78f, 0.94f, local));
    const uint8_t waveLeg = waveRight ? LEG_FR : LEG_FL;
    const float sideToSupport = waveRight ? 1.0f : -1.0f; // +Y izq si levanta FR

    tx     = -13.5f * env;                // desplaza peso hacia atras
    ty     =  16.5f * sideToSupport * env;// desplaza peso hacia el lado apoyado
    tz     =   4.5f * env;
    tPitch =  0.14f * env;                // levanta el frente con orgullo
    tRoll  = -0.09f * sideToSupport * env;

    if (env > 0.02f) {
      const float osc = sinf(local * (float)M_PI * 8.0f) * env;
      fx[waveLeg] += 51.0f * env + 12.0f * osc;
      fy[waveLeg] += (waveRight ? -1.0f : 1.0f) * (9.0f * env + 21.0f * osc);
      fz[waveLeg]  = 84.0f * env + 15.0f * cosf(local * (float)M_PI * 8.0f) * env;
    }
  } else if (strcasecmp(mode, "DANCE") == 0) {
    // Baile ritmico con desplazamiento de peso opuesto a la pata que golpea (1:1 con neun3d.js)
    const float beat = t * 3.6f;
    tz     = sinf(beat * 2.0f) * 11.25f - 4.5f;
    ty     = -sinf(beat) * 13.5f;         // -Y (derecha) cuando levanta FL (sin>0) -> equilibrio real!
    tRoll  = sinf(beat) * 0.16f;
    tPitch = cosf(beat * 2.0f) * 0.11f;
    tYaw   = sinf(beat) * 0.14f;

    const float tapL = fmaxf(0.0f,  sinf(beat));
    const float tapR = fmaxf(0.0f, -sinf(beat));
    if (tapL > 0.35f) {
      const float u = (tapL - 0.35f) / 0.65f;
      fz[LEG_FL] = u * 33.0f;
      fx[LEG_FL] += u * 21.0f;
    }
    if (tapR > 0.35f) {
      const float u = (tapR - 0.35f) / 0.65f;
      fz[LEG_FR] = u * 33.0f;
      fx[LEG_FR] += u * 21.0f;
    }
  } else if (strcasecmp(mode, "SENTRY") == 0) {
    // Centinela: escaneo horizontal ±18° con torso erguido (1:1 con neun3d.js)
    tYaw   = sinf(t * 1.25f) * 0.32f;
    tPitch = 0.04f + sinf(t * 2.5f) * 0.025f;
    tz     = 4.5f;
  } else if (strcasecmp(mode, "JUMP") == 0) {
    // Salto en 5 fases C1-continuo (1:1 con neun3d.js)
    const float p = fmodf(t * 0.52f, 1.0f);
    const float dropMm  = SERVO_BODY_DROP_MAX_MM * 0.82f;
    const float pushExt = SERVO_BODY_RISE_MAX_MM * 0.72f;
    bodyLerp  = (t > 0.18f) ? 0.72f : 0.25f;
    slewAlpha = 0.65f;

    if (p < 0.26f) {
      const float u = smoothstepf(0.00f, 0.26f, p);
      tz = -dropMm * u;
      tPitch = -0.10f * u;
      tx = -6.0f * u;
    } else if (p < 0.39f) {
      const float u = (p - 0.26f) / 0.13f;
      const float e = u * u * (3.0f - 2.0f * u);
      tz = lerpf(-dropMm, pushExt, e);
      tPitch = lerpf(-0.10f, 0.15f, e);
      tx = lerpf(-6.0f, 3.0f, e);
    } else if (p < 0.73f) {
      const float u = (p - 0.39f) / 0.34f;
      const float tuck = sinf((float)M_PI * u);
      tz = pushExt;
      tPitch = 0.15f * cosf((float)M_PI * u);
      tx = 3.0f * cosf((float)M_PI * u);
      const float footLift = (pushExt + dropMm * 0.56f) * tuck;
      for (uint8_t l = 0; l < SERVO_LEGS; l++) {
        fz[l] = footLift;
        fy[l] *= (1.0f - 0.10f * tuck);
        fx[l] += ((l == LEG_FL || l == LEG_FR) ? -1.0f : 1.0f) * 8.25f * tuck;
      }
    } else if (p < 0.87f) {
      const float u = (p - 0.73f) / 0.14f;
      const float e = sinf(u * (float)M_PI * 0.5f);
      tz = lerpf(pushExt, -dropMm * 0.64f, e);
      tPitch = lerpf(-0.15f, -0.05f, e);
      tx = lerpf(-3.0f, 0.0f, e);
    } else {
      const float u = smoothstepf(0.87f, 1.00f, p);
      tz = lerpf(-dropMm * 0.64f, 0.0f, u);
      tPitch = lerpf(-0.05f, 0.0f, u);
    }
  } else if (strcasecmp(mode, "SLEEP") == 0) {
    // Reposo plegado bajo con las patas levemente abiertas (1:1 con neun3d.js)
    tz = -SERVO_BODY_DROP_MAX_MM * 0.96f;
    for (uint8_t l = 0; l < SERVO_LEGS; l++) fy[l] *= 1.15f;
  }

  s_bodyShiftX = lerpf(s_bodyShiftX, tx, bodyLerp);
  s_bodyShiftY = lerpf(s_bodyShiftY, ty, bodyLerp);
  s_bodyShiftZ = lerpf(s_bodyShiftZ, tz, bodyLerp);
  s_bodyPitch  = lerpf(s_bodyPitch,  tPitch, bodyLerp);
  s_bodyRoll   = lerpf(s_bodyRoll,   tRoll,  bodyLerp);
  s_bodyYaw    = lerpf(s_bodyYaw,    tYaw,   bodyLerp);

  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    setLegTargetFromGround(l, fx[l], fy[l], fz[l]);
  }
}

// ----------------------------------------------------------------------------
// Actualizacion principal a 50 Hz (llamada desde loop())
// ----------------------------------------------------------------------------
void servosUpdate() {
  const uint32_t now = millis();
  if ((int32_t)(now - s_nextUpdateMs) < 0) return;

  float dt = (now - s_lastStepMs) / 1000.0f;
  s_lastStepMs = now;
  if (dt <= 0.0f) dt = SERVO_UPDATE_MS / 1000.0f;
  if (dt > 0.1f)  dt = 0.1f;
  s_nextUpdateMs = now + SERVO_UPDATE_MS;

  if (!srv_s_online) return;

  if (robotState.emergencyStop) {
    s_manualHold     = false;
    s_centerHold     = false;
    s_bootRampActive = false;
    if (s_enabled) servosSetEnabled(false);
    return;
  }
  if (!s_enabled) servosSetEnabled(true);

  // Rampa de arranque inicial suave: lee postura anterior (PCA9685 / NVS) y lleva
  // todas las patas de forma sincronizada y sin sacudidas a la postura STAND inicial.
  if (s_bootRampActive) {
    if (robotState.mode != "STAND" || robotStateIsMoving() || s_manualHold) {
      s_bootRampActive = false;
    } else {
      s_bootRampElapsed += dt;
      const float u = smoothstepf(0.0f, SERVO_BOOT_RAMP_S, s_bootRampElapsed);
      for (uint8_t l = 0; l < SERVO_LEGS; l++) {
        for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
          s_targetAngle[l][j] = lerpf(s_bootStart[l][j], getServoCenter(l, j), u);
        }
      }
      flushSmoothedServos(dt, SERVO_OMEGA_BOOT, SERVO_MAX_VEL_BOOT, 900.0f);
      if (s_bootRampElapsed >= SERVO_BOOT_RAMP_S) {
        s_bootRampActive = false;
        savePoseToNvsIfNeeded(true);
      }
      return;
    }
  }

  // En modo manual/calibracion ('servo', 'check', 'centro'), seguir suavizando hasta el objetivo
  if (s_manualHold) {
    if (robotState.mode != "STAND" || robotStateIsMoving()) {
      s_manualHold = false;
      s_centerHold = false;
    } else {
      flushSmoothedServos(dt, SERVO_OMEGA_NORMAL, 180.0f, 1400.0f);
      return;
    }
  }

  const char* mode = robotState.mode.c_str();
  if (strcasecmp(mode, s_lastMode) != 0) {
    strncpy(s_lastMode, mode, sizeof(s_lastMode) - 1);
    s_lastMode[sizeof(s_lastMode) - 1] = '\0';
    s_modeClock      = 0.0f;
    s_exploreTimer   = 0.0f;
    s_modeBlendTimer = SERVO_MODE_BLEND_S; // transicion suave al cambiar de modo
  }
  if (s_modeBlendTimer > 0.0f) {
    s_modeBlendTimer = fmaxf(0.0f, s_modeBlendTimer - dt);
  }
  const float blendFactor = 1.0f - (s_modeBlendTimer / SERVO_MODE_BLEND_S);

  // Suaviza la altura manual (body.z en [-1, +1] -> mm reales seguros)
  const float rawZ = clampf(robotState.bodyZ, -1.0f, 1.0f);
  const float targetUserMm = (rawZ >= 0.0f)
                           ? rawZ * SERVO_BODY_RISE_MAX_MM
                           : rawZ * SERVO_BODY_DROP_MAX_MM;
  // Durante rutinas verticales completas anulamos el offset manual para no topar
  const bool verticalRoutine = (strcasecmp(mode, "ELEVATE") == 0 ||
                                strcasecmp(mode, "PUSHUP")  == 0 ||
                                strcasecmp(mode, "JUMP")    == 0 ||
                                strcasecmp(mode, "SLEEP")   == 0);
  s_userHeightMm = lerpf(s_userHeightMm, verticalRoutine ? 0.0f : targetUserMm,
                         clampf(dt * 9.0f, 0.08f, 0.30f));

  const GaitDef* gait = nullptr;
  float fwd = 0.0f, strafeRight = 0.0f, turnRight = 0.0f;
  bool isCrawl = false, isTrot = false;

  if (!selectLocomotion(mode, gait, fwd, strafeRight, turnRight, isCrawl, isTrot, dt)) {
    s_strideScale = 0.0f;
    float slewAlpha = SERVO_SLEW_ALPHA;
    updateSpecialPose(mode, dt, slewAlpha);
    const bool  isJump = (strcasecmp(mode, "JUMP") == 0);
    const float omega  = isJump ? SERVO_OMEGA_JUMP
                                : lerpf(15.0f, SERVO_OMEGA_NORMAL, blendFactor);
    const float maxVel = isJump ? SERVO_MAX_VEL_JUMP
                                : lerpf(135.0f, SERVO_MAX_VEL_NORMAL, blendFactor);
    const float maxAcc = isJump ? 3600.0f : SERVO_MAX_ACCEL_NORMAL;
    flushSmoothedServos(dt, omega, maxVel, maxAcc);
    return;
  }

  // Rampa suave de amplitud (1:1 con neun3d.js):
  //   - inputMag controla la AMPLITUD de zancada (1.0 en modos/D-pad, proporcional en joystick)
  //   - robotState.speed controla la FRECUENCIA (velocidad de pasos), SIN encoger la zancada!
  const float speedN      = clampf(robotState.speed / 100.0f, 0.0f, 1.0f);
  const float inputMag    = clampf(fmaxf(hypotf(fwd, strafeRight), fabsf(turnRight)), 0.0f, 1.0f);
  const float targetSc    = (speedN > 0.01f && inputMag > 0.04f) ? clampf(inputMag, 0.15f, 1.0f) : 0.0f;
  s_strideScale += (targetSc - s_strideScale) * SERVO_RAMP_ALPHA;
  if (s_strideScale < 0.005f) {
    s_strideScale = 0.0f;
    float slewAlpha = SERVO_SLEW_ALPHA;
    updateSpecialPose("STAND", dt, slewAlpha);
    flushSmoothedServos(dt, 16.0f, 150.0f, 1500.0f);
    return;
  }

  // Avanza la fase de la marcha (misma formula exacta de ciclo que neun3d.js)
  const float speedFactor = clampf(0.30f + speedN * 0.95f, 0.25f, 1.35f);
  const float baseHz      = isTrot ? 1.32f : (isCrawl ? 0.55f : 0.82f);
  const float hz          = clampf(baseHz * speedFactor, SERVO_GAIT_HZ_MIN, SERVO_GAIT_HZ_MAX);
  s_gaitPhase += hz * dt;
  if (s_gaitPhase >= 1.0f) s_gaitPhase -= floorf(s_gaitPhase);

  // Transferencia anticipada del centro de gravedad (CoG) 1:1 con neun3d.js:
  //   0.00..0.50 (suben RL y FL izquierdas) -> cuerpo desplaza a DERECHA (-Y)
  //   0.50..1.00 (suben RR y FR derechas)   -> cuerpo desplaza a IZQUIERDA (+Y)
  float cogX = 0.0f, cogY = 0.0f, cogZ = 0.0f;
  float pitchBias = 0.0f, rollBias = 0.0f, yawBias = 0.0f;
  if (!isTrot) {
    const float leadPh  = fmodf(s_gaitPhase + 0.06f, 1.0f);
    const float latWave = sinf(leadPh * 2.0f * (float)M_PI);
    const float fwdWave = sinf(leadPh * 4.0f * (float)M_PI);
    const float amp     = (isCrawl ? 1.12f : 1.0f) * s_strideScale;
    cogY      = -latWave * 9.0f * amp;   // -Y = derecha cuando levanta lado izquierdo
    cogX      =  fwdWave * 4.2f * amp;   // +X = adelante cuando levanta pata trasera
    rollBias  =  latWave * 0.028f * amp; // levanta suavemente el hombro que despega
    pitchBias = -fwdWave * 0.016f * amp;
    cogZ      = (isCrawl ? -20.0f : 0.0f) + sinf(s_gaitPhase * 4.0f * (float)M_PI) * 1.5f * s_strideScale;
  } else {
    cogZ      = fabsf(sinf(s_gaitPhase * 2.0f * (float)M_PI)) * 5.0f * s_strideScale;
  }
  pitchBias += -fwd * (isTrot ? 0.050f : 0.024f) * s_strideScale;
  rollBias  += strafeRight * 0.036f * s_strideScale;
  yawBias    = -turnRight * 0.045f * s_strideScale;

  const float kBody = clampf(dt * 12.0f, 0.08f, 0.45f);
  s_bodyShiftX = lerpf(s_bodyShiftX, cogX, kBody);
  s_bodyShiftY = lerpf(s_bodyShiftY, cogY, kBody);
  s_bodyShiftZ = lerpf(s_bodyShiftZ, cogZ, kBody);
  s_bodyPitch  = lerpf(s_bodyPitch,  pitchBias, kBody);
  s_bodyRoll   = lerpf(s_bodyRoll,   rollBias,  kBody);
  s_bodyYaw    = lerpf(s_bodyYaw,    yawBias,   kBody);

  // Recorridos limpios y exactos 1:1 con neun3d.js (legScale = 150 mm):
  //   WALK: 54 mm (0.36) | TROT: 60 mm (0.40) | CRAWL: 42 mm (0.28)
  const float strideMm  = SERVO_STRIDE_MM * (isCrawl ? 0.7778f : (isTrot ? 1.1111f : 1.0f)) * s_strideScale;
  const float maxYawRad = (isTrot ? 0.34f : (isCrawl ? 0.24f : 0.28f)) * s_strideScale;
  const float liftMm    = SERVO_LIFT_MM * (isCrawl ? 0.7143f : (isTrot ? 1.0476f : 1.0f)) * clampf(s_strideScale + 0.25f, 0.45f, 1.0f);
  const float wideScale = isCrawl ? 1.10f : 1.0f;

  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    float local = s_gaitPhase + gait->phase[l];
    local -= floorf(local);

    float sweep = 0.0f, liftNorm = 0.0f;
    evalStepCurve(local, gait->swingFraction, sweep, liftNorm);

    const float bx = s_standFootX[l] * (isCrawl ? 1.04f : 1.0f);
    const float by = s_standFootY[l] * wideScale;

    // Rotacion exacta en torno al centro para giros sobre el eje (turnRight > 0 = horario -Z)
    const float dAngle = -turnRight * maxYawRad * sweep;
    const float ca = cosf(dAngle), sa = sinf(dAngle);
    const float rotX = bx * ca - by * sa;
    const float rotY = bx * sa + by * ca;

    // Traslacion lineal: +X adelante, -Y derecha (+Y izquierda)
    const float gx = rotX + fwd * strideMm * sweep;
    const float gy = rotY - strafeRight * strideMm * sweep;
    const float gz = liftNorm * liftMm;

    setLegTargetFromGround(l, gx, gy, gz);
  }

  const float omega  = lerpf(16.0f, SERVO_OMEGA_NORMAL, blendFactor);
  const float maxVel = lerpf(150.0f, isTrot ? 280.0f : SERVO_MAX_VEL_NORMAL, blendFactor);
  flushSmoothedServos(dt, omega, maxVel, SERVO_MAX_ACCEL_NORMAL);
}

// ----------------------------------------------------------------------------
// API publica (100% compatible con webserver, consola y main.cpp)
// ----------------------------------------------------------------------------
bool servosInit() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  initStandReference();

  // Inicializa arreglos internos, trims en 0 y sentidos CAD antes de leer NVS / PCA9685
  float detectedAngles[SERVO_LEGS][SERVO_JOINTS];
  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
      s_trim[l][j]         = 0;
      s_dir[l][j]          = SERVO_DIRECTION[l][j];
      s_vel[l][j]          = 0.0f;
      s_lastCounts[l][j]   = 0xFFFF;
      s_lastSavedNvs[l][j] = (uint8_t)SERVO_CENTER[l][j];
      detectedAngles[l][j] = SERVO_CENTER[l][j];
    }
  }

  // 1) Cargar trims mecanicos + ultima postura recordada desde NVS (Preferences)
  const bool hasNvsPose = loadServosFromNvs(detectedAngles);

  // 2) ANTES de resetear el PCA9685 con begin(), intentar LEER los pulsos PWM reales
  //    que siguen cargados en los registros del PCA9685 (reinicio en caliente).
  float hwAngles[SERVO_LEGS][SERVO_JOINTS];
  for (uint8_t l = 0; l < SERVO_LEGS; l++)
    for (uint8_t j = 0; j < SERVO_JOINTS; j++)
      hwAngles[l][j] = detectedAngles[l][j];
  const bool hasHwPose = readPca9685CurrentAngles(hwAngles);

  if (hasHwPose) {
    for (uint8_t l = 0; l < SERVO_LEGS; l++)
      for (uint8_t j = 0; j < SERVO_JOINTS; j++)
        detectedAngles[l][j] = hwAngles[l][j];
    strncpy(s_bootSource, "PCA9685_LIVE", sizeof(s_bootSource) - 1);
  } else if (hasNvsPose) {
    strncpy(s_bootSource, "NVS_LAST_POSE", sizeof(s_bootSource) - 1);
  } else {
    for (uint8_t l = 0; l < SERVO_LEGS; l++)
      for (uint8_t j = 0; j < SERVO_JOINTS; j++)
        detectedAngles[l][j] = getServoCenter(l, j);
    strncpy(s_bootSource, "STAND_DEFAULT", sizeof(s_bootSource) - 1);
  }
  s_bootSource[sizeof(s_bootSource) - 1] = '\0';

  srv_s_online = s_pwm.begin();
  if (!srv_s_online) {
    Serial.printf("[SERVO] PCA9685 (0x%02X) NO responde: marcha deshabilitada "
                  "(verificar SDA=%d SCL=%d y alimentacion del modulo)\n",
                  PCA9685_I2C_ADDR, I2C_SDA_PIN, I2C_SCL_PIN);
    return false;
  }

  s_pwm.setPWMFreq(SERVO_PWM_FREQ_HZ);
  s_enabled        = true;
  s_manualHold     = false;
  s_centerHold     = false;
  s_lastStepMs     = millis();
  s_nextUpdateMs   = 0;
  s_strideScale    = 0.0f;
  s_gaitPhase      = 0.0f;
  s_modeClock      = 0.0f;
  s_modeBlendTimer = 0.0f;
  s_calmTimerS     = 0.0f;
  s_bodyShiftX = s_bodyShiftY = s_bodyShiftZ = 0.0f;
  s_bodyPitch  = s_bodyRoll   = s_bodyYaw    = 0.0f;
  s_userHeightMm = 0.0f;

  // 3) Energizar pata por pata (escalonado cada 45 ms en arranque en frio) en su postura
  //    leida actual para eliminar golpes y caidas de voltaje, y activar la rampa S-curve
  //    suave (1.20 s) hacia la postura STAND correcta!
  bool needsRamp = false;
  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
      const float startA  = clampServoAngle(detectedAngles[l][j]);
      const float targetA = getServoCenter(l, j);
      s_bootStart[l][j]   = startA;
      s_angle[l][j]       = startA;
      s_vel[l][j]         = 0.0f;
      s_targetAngle[l][j] = targetA;
      writeChannelStaggered(l, j, angleToCounts(startA));
      if (fabsf(targetA - startA) > 1.0f) needsRamp = true;
    }
    if (!hasHwPose && l + 1 < SERVO_LEGS) {
      // yield() permite que el servidor AsyncWebServer atienda peticiones HTTP
      // durante el arranque escalonado (evita que el panel quede desconectado
      // los ~180 ms que tarda en encenderse las 4 patas).
      yield();
      delay(45); // encendido escalonado pata por pata -> sin picos de corriente
    }
  }

  s_bootRampActive  = needsRamp;
  s_bootRampElapsed = 0.0f;

  Serial.printf("[SERVO] PCA9685 -> I2C 0x%02X ONLINE | %d servos | %d Hz | "
                "FL:0-2 RL:3-5 FR:6-8 RR:9-11\n",
                PCA9685_I2C_ADDR, SERVO_COUNT, SERVO_PWM_FREQ_HZ);
  Serial.printf("[SERVO] Postura inicial leida desde %s -> rampa suave a STAND (%s)\n",
                s_bootSource, needsRamp ? "1.2 s" : "ya alineado");
  return true;
}

bool servosIsOnline() { return srv_s_online; }
const char* servosGetBootSource() { return s_bootSource; }
bool servosAreCalibrated() { return s_calibrated; }

uint8_t servoGetRawAngle(uint8_t leg, uint8_t joint) {
  if (leg >= SERVO_LEGS || joint >= SERVO_JOINTS) return SERVO_NEUTRAL;
  return (uint8_t)(clampServoAngle(s_angle[leg][joint]) + 0.5f);
}

uint8_t servoGetCenterAngle(uint8_t leg, uint8_t joint) {
  if (leg >= SERVO_LEGS || joint >= SERVO_JOINTS) return SERVO_NEUTRAL;
  return (uint8_t)(getServoCenter(leg, joint) + 0.5f);
}

// Angulo logico de postura (coherente con el IK y el visor 3D) para espejar 1:1.
//   s_dir YA incorpora SERVO_DIRECTION (se inicializa desde ahi en servosInit()
//   y el usuario puede sobrescribirlo con servoSetDir). No se multiplica dos veces.
//   La base es el angulo logico STAND de s_standPose (IK), no un 90 arbitrary.
uint8_t servoGetAngle(uint8_t leg, uint8_t joint) {
  if (leg >= SERVO_LEGS || joint >= SERVO_JOINTS) return SERVO_NEUTRAL;
  const float dirRatio = (float)s_dir[leg][joint];
  const float neutral = (joint == 0) ? s_standPose[leg].coxa :
                       (joint == 1) ? s_standPose[leg].femur :
                                      s_standPose[leg].tibia;
  const float poseDeg  = neutral + dirRatio * (s_angle[leg][joint] - getServoCenter(leg, joint));
  return (uint8_t)(clampServoAngle(poseDeg) + 0.5f);
}

bool servoSetAngle(uint8_t leg, uint8_t joint, uint8_t angle) {
  if (!srv_s_online) return false;
  if (leg >= SERVO_LEGS || joint >= SERVO_JOINTS) return false;
  s_bootRampActive = false;
  s_manualHold     = true;
  s_centerHold     = false;
  s_targetAngle[leg][joint] = clampServoAngle((float)angle); // angle ya es PWM crudo (calibracion/manual)
  return true;
}

// Establece un angulo LOGICO (90 = postura STAND del visor 3D) convirtiendolo
// automaticamente a PWM crudo con el centro y la direccion del servo.
// Usar este en lugar de servoSetAngle cuando el origen es una pose logica.
bool servoSetLogicalAngle(uint8_t leg, uint8_t joint, uint8_t logicalDeg) {
  if (!srv_s_online) return false;
  if (leg >= SERVO_LEGS || joint >= SERVO_JOINTS) return false;
  const float neutral = (joint == 0) ? s_standPose[leg].coxa :
                       (joint == 1) ? s_standPose[leg].femur :
                                      s_standPose[leg].tibia;
  const float dirRatio = (float)s_dir[leg][joint];
  const float raw = getServoCenter(leg, joint) + dirRatio * ((float)logicalDeg - neutral);
  s_bootRampActive = false;
  s_manualHold     = true;
  s_centerHold     = false;
  s_targetAngle[leg][joint] = clampServoAngle(raw);
  return true;
}

bool servoSetChannel(uint8_t channel, uint8_t angle) {
  if (!srv_s_online) return false;
  if (channel >= SERVO_COUNT) return false;
  const uint8_t leg   = channel / SERVO_JOINTS;
  const uint8_t joint = channel % SERVO_JOINTS;
  return servoSetAngle(leg, joint, angle);
}

// Lleva suavemente (sin sacudidas) las 4 patas desde su postura actual a STAND calibrado.
void servoStand() {
  if (!srv_s_online) return;
  s_manualHold     = false;
  s_centerHold     = false;
  s_gaitPhase      = 0.0f;
  s_strideScale    = 0.0f;
  s_modeBlendTimer = SERVO_MODE_BLEND_S;
  s_bodyShiftX = s_bodyShiftY = s_bodyShiftZ = 0.0f;
  s_bodyPitch  = s_bodyRoll   = s_bodyYaw    = 0.0f;
  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    setLegTargetFromGround(l, s_standFootX[l], s_standFootY[l], 0.0f);
  }
}

// Lleva suavemente los 12 servos a su centro STAND calibrado (90° + trim).
void servoCenterAll() {
  if (!srv_s_online) return;
  s_bootRampActive = false;
  s_manualHold     = true;
  s_centerHold     = true;
  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
      s_targetAngle[l][j] = getServoCenter(l, j);
    }
  }
}

// Clava suavemente los 12 servos a 90° PUROS (sin trim) para atornillar los horns alineados!
void servoCenterRaw90() {
  if (!srv_s_online) return;
  s_bootRampActive = false;
  s_manualHold     = true;
  s_centerHold     = false;
  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
      s_targetAngle[l][j] = 90.0f;
    }
  }
}

// Guarda la posicion fisica ACTUAL de los 12 servos como postura inicial STAND en NVS!
bool servoSaveCurrentAsStand() {
  s_bootRampActive = false;
  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
      const int cur = (int)(clampServoAngle(s_angle[l][j]) + 0.5f);
      s_trim[l][j]  = (int8_t)constrain(cur - (int)SERVO_CENTER[l][j], -75, 75);
    }
  }
  saveTrimsToNvs();
  savePoseToNvsIfNeeded(true);
  s_manualHold = false;
  s_centerHold = false;
  if (srv_s_online) servoStand();
  return true;
}

bool servoSetDir(uint8_t leg, uint8_t joint, int8_t dir) {
  if (leg >= SERVO_LEGS || joint >= SERVO_JOINTS) return false;
  s_dir[leg][joint] = (dir < 0) ? -1 : 1;
  saveTrimsToNvs();
  return true;
}

int8_t servoGetDir(uint8_t leg, uint8_t joint) {
  if (leg >= SERVO_LEGS || joint >= SERVO_JOINTS) return 1;
  return s_dir[leg][joint];
}

bool servoSetTrim(uint8_t leg, uint8_t joint, int8_t offsetDeg) {
  if (leg >= SERVO_LEGS || joint >= SERVO_JOINTS) return false;
  s_trim[leg][joint] = (int8_t)constrain((int)offsetDeg, -75, 75);
  saveTrimsToNvs();
  if (srv_s_online && (s_centerHold || (!s_manualHold && robotState.mode == "STAND"))) {
    s_targetAngle[leg][joint] = getServoCenter(leg, joint);
  }
  return true;
}

int8_t servoGetTrim(uint8_t leg, uint8_t joint) {
  if (leg >= SERVO_LEGS || joint >= SERVO_JOINTS) return 0;
  return s_trim[leg][joint];
}

void servoResetTrims() {
  for (uint8_t l = 0; l < SERVO_LEGS; l++) {
    for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
      s_trim[l][j] = 0;
      s_dir[l][j]  = SERVO_DIRECTION[l][j];
    }
  }
  saveTrimsToNvs();
  if (srv_s_online) servoStand();
}

// Prueba dirigida suave de una sola pata (para verificar sentidos fisicos en 5 s):
//   action: "fwd" (adelante), "back" (atras), "up" (sube pie),
//           "down" (baja pie), "out" (extiende), "stand" (90° neutro)
bool servoTestPose(uint8_t leg, const char* action) {
  if (!srv_s_online || leg >= SERVO_LEGS || !action) return false;
  s_bootRampActive = false;
  s_manualHold     = true;
  s_centerHold     = false;
  s_bodyShiftX = s_bodyShiftY = s_bodyShiftZ = 0.0f;
  s_bodyPitch  = s_bodyRoll   = s_bodyYaw    = 0.0f;
  s_userHeightMm = 0.0f;

  float gx = s_standFootX[leg];
  float gy = s_standFootY[leg];
  float gz = 0.0f;
  const float side = legSideSign(leg);

  if      (strcasecmp(action, "fwd")   == 0) gx += 25.0f;
  else if (strcasecmp(action, "back")  == 0) gx -= 25.0f;
  else if (strcasecmp(action, "up")    == 0) gz += 28.0f;
  else if (strcasecmp(action, "down")  == 0) gz -= 20.0f;
  else if (strcasecmp(action, "out")   == 0) gy += side * 22.0f;
  else if (strcasecmp(action, "stand") != 0) return false;

  setLegTargetFromGround(leg, gx, gy, gz);
  return true;
}

void servosSetEnabled(bool on) {
  if (on == s_enabled) return;
  s_enabled = on;
  if (!srv_s_online) return;
  if (on) {
    for (uint8_t l = 0; l < SERVO_LEGS; l++) {
      for (uint8_t j = 0; j < SERVO_JOINTS; j++) {
        s_vel[l][j] = 0.0f;
        writeChannelStaggered(l, j, angleToCounts(s_angle[l][j]));
      }
    }
  } else {
    savePoseToNvsIfNeeded(true);
    for (uint8_t ch = 0; ch < SERVO_COUNT; ch++) s_pwm.setPWM(ch, 4096, 0);
    for (uint8_t l = 0; l < SERVO_LEGS; l++)
      for (uint8_t j = 0; j < SERVO_JOINTS; j++)
        s_lastCounts[l][j] = 0xFFFF;
  }
}

// ==========================================================================
//  [21] ACTUADOR · MATRIZ NEOPIXEL 8x8
//  fuente: neopixel.h
// ==========================================================================

#ifndef ACTUADORES_NEOPIXEL_H
#define ACTUADORES_NEOPIXEL_H


// ============================================================================
// Modulo NeoPixel - matriz 8x8 (64 LEDs) - Araña Robot (ESP32-S3)
//
// IMPLEMENTADO (docs/PLAN_CONTROL_NEOPIXEL_8x8.txt):
//   - driver  adafruit/Adafruit NeoPixel (ya en lib_deps)
//   - pin     NEOPIXEL_PIN (GPIO14, ver config.h) - es una salida de DATOS en
//             serie, no un pin PWM. Hacen falta una resistencia de 330 ohmios
//             en serie con el dato y un condensador de 1000 uF entre +5V y GND
//             para que el pico de corriente no reinicie el ESP32.
//   - tipo    Adafruit_NeoPixel(NEOPIXEL_COUNT, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800)
//   - brillo  UN solo setBrightness() global (0-255) que el panel controla con
//             el comando "brightness" en porcentaje 0-100, con techo de
//             seguridad NEOPIXEL_MAX_BRIGHTNESS: 64 LEDs a blanco pleno piden
//             ~3.8 A y se llevarian por delante la fuente del robot.
//   - matriz  buffer propio de 8 filas x 8 columnas x 3 bytes (RGB 0-255)
//
// MAPEO DE COORDENADAS
//   El panel trabaja con led_matrix[fila][col] (origen arriba a la izquierda).
//   Las tiras van cableadas en SERPIENTE (zig-zag): las filas pares avanzan de
//   izquierda a derecha y las impares al reves. Por eso:
//
//     index = (y % 2 == 0) ? (y * 8 + x) : (y * 8 + (7 - x))
//
//   Si al probarlo la matriz sale espejada en filas alternas, el cableado es en
//   paralelo y no en serpiente: basta cambiar ZIGZAG a false.
//
// LATENCIA: show() bloquea ~1.3 ms para 64 LEDs. Las animaciones propias se
// limitan a NEOPIXEL_ANIM_MS (25 Hz); los comandos del panel (led_pixel,
// led_fill...) se vuelcan inmediatamente, sin esperar ese periodo.
//
// SEGURIDAD: si el modulo no se puede inicializar se marca offline y NO se
// publica ni se dibuja nada. El webserver responde 503 y sensors.leds.online
// queda en false.
// ============================================================================

#define NEOPIXEL_COLS   8
#define NEOPIXEL_ROWS   8

// Inicializa la tira y apaga todo. Devuelve true si el modulo quedo operativo.
bool neopixelInit();

// Refresca las animaciones propias del firmware (no bloqueante). Llamar desde
// loop(); no afecta a lo que dibuja el panel.
void neopixelUpdate();

bool neopixelIsOnline();

// Dibuja la matriz completa desde led_matrix[fila][col] (RGB 0-255) y la vuelca.
// Los indices fuera de rango se descartan.
void neopixelDraw(const uint8_t (&matrix)[NEOPIXEL_ROWS][NEOPIXEL_COLS][3]);

void neopixelClear();                                  // todo apagado
void neopixelFill(uint8_t r, uint8_t g, uint8_t b);    // todo a un color

// Enciende o apaga un pixel. x = columna, y = fila (origen arriba-izquierda).
void neopixelSetPixel(uint8_t x, uint8_t y, uint8_t r, uint8_t g, uint8_t b);

// Brillo global en % (0-100). Se satura a NEOPIXEL_MAX_BRIGHTNESS.
void   neopixelSetBrightness(uint8_t brightness);
uint8_t neopixelGetBrightness();

// Vuelca el buffer a la tira (show()).
void neopixelShow();

// ----------------------------------------------------------------------------
// Patrones y dibujos
// ----------------------------------------------------------------------------

// Patrones de animacion del firmware. Los nombres smile/heart/arrow/spider NO
// son animaciones: son dibujos fijos que el panel pinta pixel a pixel, y que
// aca se aceptan como glyphs predefinidos (neopixelDrawGlyph).
enum NeopixelPattern {
  NEO_PAT_NONE = 0,
  NEO_PAT_SOLID,
  NEO_PAT_RAINBOW,
  NEO_PAT_PULSE,
  NEO_PAT_BOUNCE,
  NEO_PAT_CONVERGE,
  NEO_PAT_SPIRAL,
  NEO_PAT_FIRE,
  NEO_PAT_WAVE,
  NEO_PAT_MATRIX_RAIN,
  NEO_PAT_TEST
};

// Arranca un patron por nombre (case-insensitive): CLEAR, SOLID, RAINBOW,
// PULSE, BOUNCE, CONVERGE, SPIRAL, FIRE, WAVE, MATRIX_RAIN, TEST.
// Devuelve false si el nombre no existe.
bool neopixelPlayPattern(const char* pattern);

void         neopixelStopPattern();
const char*  neopixelGetPattern();

// Dibuja un glyph 8x8 predefinido: smile, heart, arrow, spider. Devuelve false
// si el nombre no existe.
bool neopixelDrawGlyph(const char* glyph);

#endif  // ACTUADORES_NEOPIXEL_H

// ==========================================================================
//  [22] ACTUADOR · MATRIZ NEOPIXEL 8x8
//  fuente: neopixel.cpp
// ==========================================================================

// ============================================================================
// Modulo NeoPixel (matriz 8x8) - Araña Robot (ESP32-S3)
//
// Implementa actuadores/neopixel.h con la libreria Adafruit NeoPixel.
//
// ARQUITECTURA: el modulo tiene su PROPIO buffer de 8x8x3 (RGB). Los comandos
// del panel (led_pixel, led_fill, led_matrix...) escriben en el buffer y hacen
// show() inmediato. Los patrones de animacion, en cambio, se calculan sobre el
// mismo buffer desde neopixelUpdate() a NEOPIXEL_ANIM_MS. Asi un led_pixel y una
// animacion nunca se pelean por el estado: gana el ultimo comando recibido.
//
// COLOR: el panel manda los colores como texto "#RRGGBB". La conversion esta en
// webserver.cpp (hexToRgb) porque es protocolo, no hardware.
//
// MAPEO: cableado en serpiente, ver ZIGZAG en neopixel.h.
// ============================================================================


// ----------------------------------------------------------------------------
// Estado interno
// ----------------------------------------------------------------------------
static Adafruit_NeoPixel s_leds(NEOPIXEL_COUNT, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

// Cableado en SERPIENTE (zig-zag). Si la matriz sale espejada en filas
// alternas, el cableado es en paralelo: poner esto en false.
static const bool ZIGZAG = true;

static bool     neo_s_online   = false;
static uint8_t  s_brightPct = NEOPIXEL_DEFAULT_BRIGHTNESS;   // 0-100
static uint32_t s_nextAnimMs = 0;
static uint32_t s_animStartMs = 0;

// Buffer propio de la matriz: [fila][col][R,G,B], todo a 0 al arrancar.
static uint8_t s_matrix[NEOPIXEL_ROWS][NEOPIXEL_COLS][3];

// Patron en curso (NEO_PAT_NONE = el manda el panel).
static NeopixelPattern neo_s_pattern = NEO_PAT_NONE;

// ----------------------------------------------------------------------------
// Mapeo de coordenadas
// ----------------------------------------------------------------------------

// (x, y) -> indice lineal del LED en la tira.
static uint16_t xyToIndex(uint8_t x, uint8_t y) {
  if (x >= NEOPIXEL_COLS) x = NEOPIXEL_COLS - 1;
  if (y >= NEOPIXEL_ROWS) y = NEOPIXEL_ROWS - 1;
  if (!ZIGZAG) return (uint16_t)(y * NEOPIXEL_COLS + x);
  // Filas pares -> izquierda a derecha; impares -> derecha a izquierda.
  return (uint16_t)((y % 2 == 0) ? (y * NEOPIXEL_COLS + x)
                                 : (y * NEOPIXEL_COLS + (NEOPIXEL_COLS - 1 - x)));
}

// ----------------------------------------------------------------------------
// Buffer -> tira
// ----------------------------------------------------------------------------

// Vuelca s_matrix a la tira aplicando el brillo global y hace show().
static void flush() {
  if (!neo_s_online) return;
  for (uint8_t y = 0; y < NEOPIXEL_ROWS; y++) {
    for (uint8_t x = 0; x < NEOPIXEL_COLS; x++) {
      const uint16_t i = xyToIndex(x, y);
      s_leds.setPixelColor(i,
                           s_leds.Color(s_matrix[y][x][0],
                                        s_matrix[y][x][1],
                                        s_matrix[y][x][2]));
    }
  }
  s_leds.show();
}

// Pone un valor en el buffer SIN volcar (para no hacer 64 show() seguidos).
static inline void setBuf(uint8_t x, uint8_t y, uint8_t r, uint8_t g, uint8_t b) {
  if (x >= NEOPIXEL_COLS || y >= NEOPIXEL_ROWS) return;
  s_matrix[y][x][0] = r;
  s_matrix[y][x][1] = g;
  s_matrix[y][x][2] = b;
}

static void clearBuf() { memset(s_matrix, 0, sizeof(s_matrix)); }

// Rueda de color HSV simplificada: h en 0-255, devuelve RGB 0-255.
// Se usa para RAINBOW, WAVE y SPIRAL.
static void wheel(uint8_t h, uint8_t& r, uint8_t& g, uint8_t& b) {
  const uint8_t sector = h / 43;          // 6 sectores de 43
  const uint8_t pos    = (h % 43) * 6;
  switch (sector) {
    case 0:  r = 255 - pos; g = pos;       b = 0;   break;
    case 1:  r = 0;         g = 255 - pos; b = pos; break;
    case 2:  r = pos;       g = 0;         b = 255 - pos; break;
    case 3:  r = 255;       g = pos;       b = 0;   break;
    case 4:  r = 255 - pos; g = 255;       b = 0;   break;
    default: r = 255;       g = 255 - pos; b = pos; break;
  }
}


// ----------------------------------------------------------------------------
// Glyphs (dibujos 8x8) que el panel pide por nombre
// Cada uno son 8 filas de 8 bits; 1 = LED encendido, 0 = apagado.
// ----------------------------------------------------------------------------
struct Glyph { const char* name; uint8_t rows[8]; };

static const Glyph GLYPHS[] = {
  // Sonrisa
  { "smile", {
    0b00111100, 0b01000010, 0b10100101, 0b10000001,
    0b10100101, 0b10011001, 0b01000010, 0b00111100 } },
  // Corazon
  { "heart", {
    0b01100110, 0b11111111, 0b11111111, 0b11111111,
    0b01111110, 0b00111100, 0b00011000, 0b00000000 } },
  // Flecha hacia arriba
  { "arrow", {
    0b00011000, 0b00111100, 0b01111110, 0b11111111,
    0b00011000, 0b00011000, 0b00011000, 0b00011000 } },
  // Araña (el bicho del proyecto)
  { "spider", {
    0b10000001, 0b11000011, 0b01111110, 0b00111100,
    0b00111100, 0b01111110, 0b11000011, 0b10000001 } },
};

static const uint8_t GLYPH_COUNT = sizeof(GLYPHS) / sizeof(GLYPHS[0]);


// ----------------------------------------------------------------------------
// Patrones de animacion
// ----------------------------------------------------------------------------

// Calcula un frame del patron en curso sobre el buffer. t = segundos desde que
// arranco el patron.
static void renderPattern(float t) {
  clearBuf();
  uint8_t r, g, b;

  switch (neo_s_pattern) {
    case NEO_PAT_SOLID:
      for (uint8_t y = 0; y < NEOPIXEL_ROWS; y++)
        for (uint8_t x = 0; x < NEOPIXEL_COLS; x++) setBuf(x, y, 0, 200, 120);
      break;

    case NEO_PAT_RAINBOW: {
      // Ciclo de 6 s por vuelta completa de la rueda de color.
      const uint8_t base = (uint8_t)(t * 42.5f);
      for (uint8_t y = 0; y < NEOPIXEL_ROWS; y++)
        for (uint8_t x = 0; x < NEOPIXEL_COLS; x++) {
          wheel((uint8_t)(base + (x + y) * 4), r, g, b);
          setBuf(x, y, r, g, b);
        }
      break;
    }

    case NEO_PAT_PULSE: {
      // Respira en verde: sube y baja la intensidad.
      const float s = (sinf(t * 2.0f) + 1.0f) * 0.5f;   // 0..1
      const uint8_t v = (uint8_t)(s * 255.0f);
      for (uint8_t y = 0; y < NEOPIXEL_ROWS; y++)
        for (uint8_t x = 0; x < NEOPIXEL_COLS; x++)
          setBuf(x, y, 0, v, (uint8_t)(v * 0.5f));
      break;
    }

    case NEO_PAT_BOUNCE: {
      // Punto que rebota por la matriz (con dos periodos distintos para que no
      // repita siempre la misma diagonal).
      const float period = 2.5f;
      const float fx = 0.5f + 0.5f * sinf(t * 2.0f * (float)M_PI / period);
      const float fy = 0.5f + 0.5f * sinf(t * 2.0f * (float)M_PI / (period * 1.7f));
      const uint8_t x = (uint8_t)(fx * (NEOPIXEL_COLS - 1) + 0.5f);
      const uint8_t y = (uint8_t)(fy * (NEOPIXEL_ROWS - 1) + 0.5f);
      setBuf(x, y, 255, 60, 0);
      break;
    }

    case NEO_PAT_CONVERGE: {
      // Onda que converge al centro desde los bordes.
      const float d = (sinf(t * 3.0f) + 1.0f) * 0.5f;   // 0..1
      for (uint8_t y = 0; y < NEOPIXEL_ROWS; y++) {
        for (uint8_t x = 0; x < NEOPIXEL_COLS; x++) {
          const float dist = sqrtf((x - 3.5f) * (x - 3.5f) + (y - 3.5f) * (y - 3.5f)) / 4.95f;
          const float w = 1.0f - fabsf(dist - d) * 3.0f;
          if (w > 0.0f) {
            const uint8_t v = (uint8_t)(w * 255.0f);
            setBuf(x, y, v, (uint8_t)(v * 0.3f), 255 - v);
          }
        }
      }
      break;
    }

    case NEO_PAT_SPIRAL: {
      // Espiral de barrido por fase desde el centro.
      for (uint8_t y = 0; y < NEOPIXEL_ROWS; y++) {
        for (uint8_t x = 0; x < NEOPIXEL_COLS; x++) {
          const float dist = sqrtf((x - 3.5f) * (x - 3.5f) + (y - 3.5f) * (y - 3.5f)) / 4.95f;
          const float ph = dist - t * 1.5f;
          if (sinf(ph * 2.0f * (float)M_PI) > 0.85f) setBuf(x, y, 120, 0, 255);
        }
      }
      break;
    }

    case NEO_PAT_FIRE: {
      // Fuego: base caliente que se enfria hacia arriba, con chisporroteo.
      for (uint8_t x = 0; x < NEOPIXEL_COLS; x++) {
        for (uint8_t y = 0; y < NEOPIXEL_ROWS; y++) {
          const float noise = 0.5f + 0.5f * sinf(t * 6.0f + x * 1.7f + y * 0.9f);
          const float heat  = noise * (1.0f - (float)y / NEOPIXEL_ROWS);
          const uint8_t v   = (uint8_t)(heat * 255.0f);
          setBuf(x, y, v, (uint8_t)(v * 0.45f), 0);
        }
      }
      break;
    }

    case NEO_PAT_WAVE: {
      // Onda senoidal que cruza la matriz en diagonal.
      for (uint8_t y = 0; y < NEOPIXEL_ROWS; y++) {
        for (uint8_t x = 0; x < NEOPIXEL_COLS; x++) {
          const float s = sinf((x + y) * 0.8f - t * 4.0f);
          if (s > 0.6f) {
            const uint8_t v = (uint8_t)((s - 0.6f) * 637.0f);
            setBuf(x, y, 0, v, (uint8_t)(255 - v));
          }
        }
      }
      break;
    }

    case NEO_PAT_MATRIX_RAIN: {
      // Lluvia estilo Matrix: cabeza brillante con estela verde que se apaga.
      // El estado de las gotas es estatico para que cada gota mantenga su
      // columna y su altura entre frames.
      static uint8_t headX[8] = { 0, 2, 4, 6, 1, 3, 5, 7 };
      static float   headY[8] = { 0, 1, 2, 3, 4, 5, 6, 7 };
      for (uint8_t c = 0; c < 8; c++) {
        headY[c] += 0.25f;
        if (headY[c] >= NEOPIXEL_ROWS + 4) headY[c] = -((float)(c % 3));
        const uint8_t hy = (uint8_t)headY[c];
        for (uint8_t tr = 0; tr < 4; tr++) {
          const int yy = (int)hy - tr;
          if (yy < 0 || yy >= NEOPIXEL_ROWS) continue;
          const uint8_t v = (uint8_t)(255 - tr * 70);
          setBuf(headX[c], (uint8_t)yy, 0, v, 0);
        }
      }
      break;
    }

    case NEO_PAT_TEST:
      // Barrido de los 3 canales + blanco. Sirve para detectar LEDs muertos y
      // confirmar el orden de color (GRB) del modulo.
      for (uint8_t y = 0; y < NEOPIXEL_ROWS; y++) {
        for (uint8_t x = 0; x < NEOPIXEL_COLS; x++) {
          const uint8_t phase = (uint8_t)(t * 1.5f) & 0x03;
          if (phase == 0)      setBuf(x, y, 255, 0, 0);
          else if (phase == 1) setBuf(x, y, 0, 255, 0);
          else if (phase == 2) setBuf(x, y, 0, 0, 255);
          else                 setBuf(x, y, 255, 255, 255);
        }
      }
      break;

    default:
      break;
  }
}


// ----------------------------------------------------------------------------
// API publica
// ----------------------------------------------------------------------------
bool neopixelInit() {
  s_leds.begin();
  // La tira arranca apagada: setBrightness(0) + show() garantiza que no haya
  // un frame de basura al alimentarse (los NeoPixel encian con lo que haya en
  // el buffer la primera vez).
  s_leds.setBrightness(0);
  s_leds.clear();
  s_leds.show();

  clearBuf();
  neo_s_pattern    = NEO_PAT_NONE;
  s_nextAnimMs = 0;
  s_animStartMs = millis();

  // El driver de Adafruit no tiene forma de saber si hay tira conectada, asi
  // que se da por operativo y se marca online. Si no hay LEDs, los comandos se
  // aceptan igual (no hay forma honesta de detectarlo sin leer el pin).
  neo_s_online = true;

  // Aplica el brillo por defecto y apaga.
  s_leds.setBrightness(map(s_brightPct, 0, 100, 0, 255));
  s_leds.show();

  Serial.printf("[NEOPIXEL] matriz 8x8 -> GPIO%d ONLINE | %d LEDs | brillo %d%% | "
                "mapeo %s\n",
                NEOPIXEL_PIN, NEOPIXEL_COUNT, s_brightPct,
                ZIGZAG ? "serpiente" : "paralelo");
  return true;
}

bool neopixelIsOnline() { return neo_s_online; }

void neopixelUpdate() {
  if (!neo_s_online) return;
  // Sin patron no hay nada que animar: el manda el panel y ya esta dibujado.
  if (neo_s_pattern == NEO_PAT_NONE) return;

  const uint32_t now = millis();
  if ((int32_t)(now - s_nextAnimMs) < 0) return;
  s_nextAnimMs = now + NEOPIXEL_ANIM_MS;

  renderPattern((now - s_animStartMs) / 1000.0f);
  flush();
}

void neopixelDraw(const uint8_t (&matrix)[NEOPIXEL_ROWS][NEOPIXEL_COLS][3]) {
  if (!neo_s_online) return;
  // Una matriz explicita cancelada cualquier animacion en curso.
  neo_s_pattern = NEO_PAT_NONE;
  memcpy(s_matrix, matrix, sizeof(s_matrix));
  flush();
}

void neopixelClear() {
  if (!neo_s_online) return;
  neo_s_pattern = NEO_PAT_NONE;
  clearBuf();
  flush();
}

void neopixelFill(uint8_t r, uint8_t g, uint8_t b) {
  if (!neo_s_online) return;
  neo_s_pattern = NEO_PAT_NONE;
  for (uint8_t y = 0; y < NEOPIXEL_ROWS; y++)
    for (uint8_t x = 0; x < NEOPIXEL_COLS; x++)
      setBuf(x, y, r, g, b);
  flush();
}

void neopixelSetPixel(uint8_t x, uint8_t y, uint8_t r, uint8_t g, uint8_t b) {
  if (!neo_s_online) return;
  neo_s_pattern = NEO_PAT_NONE;
  setBuf(x, y, r, g, b);
  flush();          // el panel espera ver el pixel ya; no se acumulan frames
}

void neopixelSetBrightness(uint8_t brightness) {
  if (brightness > 100) brightness = 100;
  // Techo de seguridad: 64 LEDs a blanco pleno piden ~3.8 A.
  if (brightness > NEOPIXEL_MAX_BRIGHTNESS) brightness = NEOPIXEL_MAX_BRIGHTNESS;
  s_brightPct = brightness;
  if (!neo_s_online) return;
  s_leds.setBrightness(map(brightness, 0, 100, 0, 255));
}

uint8_t neopixelGetBrightness() { return s_brightPct; }

void neopixelShow() {
  if (!neo_s_online) return;
  flush();
}

bool neopixelPlayPattern(const char* pattern) {
  if (!pattern || !pattern[0]) return false;

  // CLEAR apaga y ademas cancela el patron en curso.
  if (strcasecmp(pattern, "CLEAR") == 0) { neopixelClear(); return true; }

  NeopixelPattern p = NEO_PAT_NONE;
  if      (strcasecmp(pattern, "SOLID")       == 0) p = NEO_PAT_SOLID;
  else if (strcasecmp(pattern, "RAINBOW")     == 0) p = NEO_PAT_RAINBOW;
  else if (strcasecmp(pattern, "PULSE")       == 0) p = NEO_PAT_PULSE;
  else if (strcasecmp(pattern, "BOUNCE")      == 0) p = NEO_PAT_BOUNCE;
  else if (strcasecmp(pattern, "CONVERGE")    == 0) p = NEO_PAT_CONVERGE;
  else if (strcasecmp(pattern, "SPIRAL")      == 0) p = NEO_PAT_SPIRAL;
  else if (strcasecmp(pattern, "FIRE")        == 0) p = NEO_PAT_FIRE;
  else if (strcasecmp(pattern, "WAVE")        == 0) p = NEO_PAT_WAVE;
  else if (strcasecmp(pattern, "MATRIX_RAIN") == 0) p = NEO_PAT_MATRIX_RAIN;
  else if (strcasecmp(pattern, "TEST")        == 0) p = NEO_PAT_TEST;
  else return false;

  neo_s_pattern    = p;
  s_animStartMs = millis();
  s_nextAnimMs  = 0;              // primer frame ya
  return true;
}

void neopixelStopPattern() {
  neo_s_pattern = NEO_PAT_NONE;
}

const char* neopixelGetPattern() {
  switch (neo_s_pattern) {
    case NEO_PAT_SOLID:       return "SOLID";
    case NEO_PAT_RAINBOW:     return "RAINBOW";
    case NEO_PAT_PULSE:       return "PULSE";
    case NEO_PAT_BOUNCE:      return "BOUNCE";
    case NEO_PAT_CONVERGE:    return "CONVERGE";
    case NEO_PAT_SPIRAL:      return "SPIRAL";
    case NEO_PAT_FIRE:        return "FIRE";
    case NEO_PAT_WAVE:        return "WAVE";
    case NEO_PAT_MATRIX_RAIN: return "MATRIX_RAIN";
    case NEO_PAT_TEST:        return "TEST";
    default:                  return "NONE";
  }
}

bool neopixelDrawGlyph(const char* glyph) {
  if (!glyph || !glyph[0]) return false;
  for (uint8_t i = 0; i < GLYPH_COUNT; i++) {
    if (strcasecmp(glyph, GLYPHS[i].name) != 0) continue;

    neo_s_pattern = NEO_PAT_NONE;
    clearBuf();
    for (uint8_t y = 0; y < NEOPIXEL_ROWS; y++) {
      for (uint8_t x = 0; x < NEOPIXEL_COLS; x++) {
        // El bit 0 de cada fila es la columna 7 (orden de escritura clasico),
        // pero los dibujos de arriba estan pensados con el bit de mas a la
        // izquierda = columna 0. Se lee de izquierda a derecha.
        if (GLYPHS[i].rows[y] & (0x80 >> x)) setBuf(x, y, 0, 255, 136);
      }
    }
    flush();
    return true;
  }
  return false;
}

// ==========================================================================
//  [23] COMUNICACION · WIFI
//  fuente: wifi.h
// ==========================================================================

#ifndef COMUNICACION_WIFI_H
#define COMUNICACION_WIFI_H


// ============================================================================
// Módulo WiFi (Access Point) — Araña Robot (ESP32-S3)
//
// Crea el AP "ARANA-ROBOT" (SSID/contraseña/canal en config.h) al que se
// conectan los clientes del sistema:
//   - la PC con el Control Center (pc/app.py -> ESP32Client, 192.168.4.1:80)
//   - el mando físico ESP32-C3 Super Mini (docs/PLAN_CONTROLADOR_ESP32-C3.txt)
//
// Además, con WIFI_STA_ENABLED=true, el robot también se conecta como CLIENTE
// (modo AP+STA) a una red existente (config.h: WIFI_STA_SSID/PASSWORD/IP) y
// queda accesible en esa IP: útil cuando la placa no puede emitir su AP.
//
// El servidor HTTP vive en el módulo comunicacion/webserver.
// Todo es NO bloqueante: wifiUpdate() revisa el AP y loguea entradas/salidas
// de clientes sin frenar el loop() (nunca usar while(!WiFi.isConnected())).
// ============================================================================

// Crea el AP y deja la radio lista. Llamar una vez desde setup().
void wifiInit();

// Mantiene el AP: reintenta crearlo si falló y reporta cambios de clientes.
void wifiUpdate();

bool        wifiIsApActive();
uint8_t     wifiGetStations();     // clientes conectados (PC + mando)
IPAddress   wifiGetIp();           // 192.168.4.1 por defecto en modo AP
uint32_t    wifiGetUptimeS();      // segundos desde que el AP quedó activo
const char* wifiGetStatusStr();    // "up" | "down"

// ----------------------------------------------------------------------------
// Modo cliente (STA): el robot se conecta a una red WiFi existente
// (config.h: WIFI_STA_*). El AP sigue activo (AP+STA). Sirve cuando la placa
// no puede emitir su AP o cuando conviene tener internet.
// ----------------------------------------------------------------------------
bool        wifiStaEnabled();      // WIFI_STA_ENABLED
bool        wifiStaIsConnected();  // asociado y con IP
IPAddress   wifiStaGetIp();        // IP del robot en la red cliente
int8_t      wifiStaGetRssi();      // dBm de la red cliente
const char* wifiStaGetSsid();      // SSID de la red cliente (config.h)
IPAddress   wifiGetAnyIp();        // IP util del robot (STA si conectado, si no AP)

// Control en caliente del modo cliente (consola serie: sta on | sta off).
// Apagarlo libera la radio para poder escanear (WiFi.scanNetworks()).
void        wifiStaStop();
void        wifiStaStart();
bool        wifiStaIsRunning();

// ----------------------------------------------------------------------------
// Lista de clientes conectados al AP (MAC + RSSI) via esp_wifi_ap_get_sta_list().
// El webserver la publica en /api/status -> link.stations[] para que el panel PC
// pueda mostrar el mando fisico con su calidad de enlace real.
// ----------------------------------------------------------------------------
/* [tipo WifiStaInfo definido arriba] */

// Llena "out" con hasta maxOut estaciones y devuelve cuantas escribio.
// La consulta de MAC/RSSI se cachea durante 5 s: esp_wifi_ap_get_sta_list()
// puede tardar y /api/status no necesita una lista nueva en cada sondeo.
uint8_t wifiGetStationsList(WifiStaInfo* out, uint8_t maxOut);

// ----------------------------------------------------------------------------
// Diagnostico de radio/antena (consola serie: "wifiscan")
// ----------------------------------------------------------------------------
// Escanea redes cercanas para verificar que la radio RECIBA. El AP puede
// crearse "bien" en software y aun asi no emitir si el modulo de RF esta
// danado, que es justo lo que hay que descartar antes de culpar al panel.
// OJO: WiFi.scanNetworks() cambia el modo de la radio y TUMBA el AP: despues de
// llamarlo hay que recrear el AP con wifiInit() (el .ino ya lo hace).
void wifiScanTest();

// Fuerza una reconexion del modo cliente. Se usa como auto-recuperacion cuando
// el ESP32 sigue "asociado" pero el trafico no pasa (ver AUTO_RECONNECT_* en
// config.h): es la unica forma de desatascar un enlace zombi, porque el driver
// reporta WL_CONNECTED y por eso wifiUpdate() no reintenta nunca solo.
void wifiStaReconnect();

const char* wifiGetSsid();          // SSID del AP (config.h: WIFI_SSID)
bool        wifiIsPasswordSet();   // false = AP abierto
uint8_t     wifiGetChannel();
uint8_t     wifiGetMaxConn();
#endif  // COMUNICACION_WIFI_H

// ==========================================================================
//  [24] COMUNICACION · WIFI
//  fuente: wifi.cpp
// ==========================================================================

// ----------------------------------------------------------------------------
// Estado interno
// ----------------------------------------------------------------------------
static bool     s_apActive      = false;
static uint32_t s_startedMs     = 0;
static uint32_t wifi_s_nextRetryMs   = 0;
static uint32_t wifi_s_retries       = 0;
static uint8_t  s_lastStations  = 0;
static WifiStaInfo s_stationCache[MAX_STATIONS] = {};
static uint8_t  s_stationCacheCount = 0;
static uint32_t s_stationCacheAtMs = 0;
static bool     s_stationCacheReady = false;
static const uint32_t STATION_LIST_CACHE_MS = 5000;

// --- Modo cliente (STA) ---
// Solo existen si WIFI_STA_ENABLED: con el modo cliente apagado el firmware no
// los usa y GCC avisaria de "defined but not used" en cada compilacion.
#if WIFI_STA_ENABLED
static bool     s_staLinked     = false;   // ultimo estado reportado
static uint32_t s_staNextTryMs  = 0;       // proximo intento de reconexion
#endif
static bool     s_staRun        = WIFI_STA_ENABLED;  // activo en caliente (sta on|off)

// ----------------------------------------------------------------------------
// Arranque del AP
// ----------------------------------------------------------------------------
static bool startAp() {
  WiFi.persistent(false);      // no guardar credenciales en NVS

#if WIFI_STA_ENABLED
  // MODO CLIENTE PURO (sin AP): con AP+STA en canales distintos (AP del robot
  // en canal 1 y la red destino en canal 11) la radio de un solo canal debe
  // saltar y se pierden los frames de autenticacion -> reason=2 AUTH_EXPIRE.
  // Con STA puro la radio queda fija en el canal de la red destino.
  // El panel PC alcanza al robot por la IP que le asigne esa red.
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setTxPower(WIFI_POWER_19_5dBm);
  s_apActive = false;
  Serial.println(F("[WIFI] modo CLIENTE puro (AP deshabilitado por WIFI_STA_ENABLED)"));
  return true;
#else
  WiFi.mode(WIFI_AP);
  WiFi.setSleep(false);        // AP con latencia baja (panel PC + mando)

  const char* pass = (WIFI_PASSWORD[0] == '\0') ? NULL : WIFI_PASSWORD;
  const bool ok = WiFi.softAP(WIFI_SSID, pass, WIFI_CHANNEL,
                              WIFI_AP_HIDDEN, WIFI_AP_MAX_CONN);
  if (!ok) {
    s_apActive    = false;
    wifi_s_nextRetryMs = millis() + WIFI_AP_RETRY_MS;
    Serial.printf("[WIFI] ERROR al crear el AP \"%s\" (reintento en %u ms)\n",
                  WIFI_SSID, (unsigned)WIFI_AP_RETRY_MS);
    return false;
  }

  WiFi.setTxPower(WIFI_POWER_19_5dBm);   // máxima potencia de transmisión

  s_apActive     = true;
  s_startedMs    = millis();
  s_lastStations = 0;
  Serial.printf("[WIFI] AP \"%s\" activo | IP=%s | canal=%d | max=%d clientes | puerto HTTP=%d\n",
                WIFI_SSID, WiFi.softAPIP().toString().c_str(), WIFI_CHANNEL,
                WIFI_AP_MAX_CONN, HTTP_PORT);
  Serial.printf("[WIFI] auth=%s | TX power=%d (x0.25 dBm)\n",
                wifiIsPasswordSet() ? "WPA2" : "ABIERTA", (int)WiFi.getTxPower());
  Serial.println(F("[WIFI] Esperando clientes: PC (pc/app.py) y/o mando ESP32-C3"));
  return true;
#endif  // WIFI_STA_ENABLED
}

// ----------------------------------------------------------------------------
// Conexión como CLIENTE (STA) a una red existente (config.h: WIFI_STA_*).
// Se usa para que el robot sea alcanzable por la PC aunque no pueda emitir AP.
// ----------------------------------------------------------------------------
#if WIFI_STA_ENABLED
// Solo se usa con el modo cliente activo: fuera de ese #if GCC daria
// warning de "defined but not used" en cada compilacion.
static const char* staStatusStr(wl_status_t st) {
  switch (st) {
    case WL_IDLE_STATUS:     return "idle";
    case WL_NO_SSID_AVAIL:   return "SSID no encontrado";
    case WL_SCAN_COMPLETED:  return "scan listo";
    case WL_CONNECTED:       return "conectado";
    case WL_CONNECT_FAILED:  return "fallo de conexion (clave?)";
    case WL_CONNECTION_LOST: return "conexion perdida";
    case WL_DISCONNECTED:    return "desconectado";
    default:                 return "desconocido";
  }
}
#endif

static void startSta() {
#if WIFI_STA_ENABLED
  if (!s_staRun) return;              // apagado en caliente por consola (sta off)
  // IP fija opcional: el panel PC siempre apunta a la misma direccion.
  if (strlen(WIFI_STA_STATIC_IP) > 0) {
    IPAddress ip, gw, mask;
    if (ip.fromString(WIFI_STA_STATIC_IP) && gw.fromString(WIFI_STA_GATEWAY) &&
        mask.fromString(WIFI_STA_SUBNET)) {
      WiFi.config(ip, gw, mask);
      Serial.printf("[WIFI] STA IP fija=%s gw=%s mask=%s\n",
                    WIFI_STA_STATIC_IP, WIFI_STA_GATEWAY, WIFI_STA_SUBNET);
    } else {
      Serial.println(F("[WIFI] STA IP fija invalida en config.h -> uso DHCP"));
    }
  }
  Serial.printf("[WIFI] STA conectando a \"%s\"...\n", WIFI_STA_SSID);
  WiFi.begin(WIFI_STA_SSID, WIFI_STA_PASSWORD);
  s_staNextTryMs = millis() + WIFI_STA_RETRY_MS;
#endif
}

// ----------------------------------------------------------------------------
// API pública
// ----------------------------------------------------------------------------
void wifiInit() {
  // Código de razón de cada desconexión del modo cliente: es el dato que
  // distingue "clave incorrecta" (205/15) de "no encuentra el AP" (201) de
  // "sin respuesta del AP" (200/15 = problema de transmision del robot).
  WiFi.onEvent([](WiFiEvent_t event, WiFiEventInfo_t info) {
    if (event == ARDUINO_EVENT_WIFI_STA_DISCONNECTED) {
      Serial.printf("[WIFI] STA desconectado | reason=%u\n",
                    (unsigned)info.wifi_sta_disconnected.reason);
    }
  }, ARDUINO_EVENT_WIFI_STA_DISCONNECTED);

  startAp();
  startSta();
}

// ---------------------------------------------------------------------------
// Variables de estado del servidor web (declaradas aquí para que wifiUpdate()
// pueda usarlas; se definen de nuevo como estáticas en la sección webserver
// pero el compilador necesita que estén visibles antes de wifiUpdate).
// ---------------------------------------------------------------------------
static uint32_t s_requests     = 0;
static uint32_t s_errors       = 0;
static uint32_t s_lastRequestMs = 0;   // ultima peticion HTTP atendida
static uint32_t s_lastReconnectMs = 0;  // ultima reconexion forzada

void wifiUpdate() {
  const uint32_t now = millis();

#if WIFI_STA_ENABLED
  // --- Modo cliente: reportar cambios y reintentar si se cae ---
  if (s_staRun) {
  const bool linked = (WiFi.status() == WL_CONNECTED);
  if (linked != s_staLinked) {
    s_staLinked = linked;
    if (linked) {
      Serial.printf("[WIFI] STA \"%s\" CONECTADO | IP=%s | RSSI=%d dBm\n",
                    WIFI_STA_SSID, WiFi.localIP().toString().c_str(),
                    (int)WiFi.RSSI());
      Serial.printf("[WIFI] El panel PC puede usar ARANA_ESP32_IP=%s\n",
                    WiFi.localIP().toString().c_str());
      // Reaplica el modo sin ahorro tras asociarse. WiFi.setSleep(false) se
      // llama en startAp(), pero el driver lo restablece al completar la
      // asociacion: con el ahorro activo, la PRIMERA peticion de cada rafaga
      // tiene que esperar al beacon DTIM y la latencia se va de ~100 ms a
      // 2-3 s. Eso hacia que el cubo 3D del panel diera tirones. Con esto el
      // enlace responde de inmediato (a costa de algo mas de consumo).
      WiFi.setSleep(false);
    } else {
      Serial.printf("[WIFI] STA \"%s\" desconectado (%s) -> reintento en %u ms\n",
                    WIFI_STA_SSID, staStatusStr(WiFi.status()),
                    (unsigned)WIFI_STA_RETRY_MS);
      s_staNextTryMs = now + WIFI_STA_RETRY_MS;
    }
  } else if (!linked && (int32_t)(now - s_staNextTryMs) >= 0) {
    Serial.printf("[WIFI] STA reintento de conexion (estado: %s)\n",
                  staStatusStr(WiFi.status()));
    WiFi.disconnect(false, false);      // no borra credenciales guardadas
    startSta();
  }
  }   // if (s_staRun)
#endif

#if !WIFI_STA_ENABLED
  if (!s_apActive) {                       // reintento con backoff fijo
    if ((int32_t)(now - wifi_s_nextRetryMs) >= 0) {
      wifi_s_retries++;
      Serial.printf("[WIFI] reintento de AP #%lu\n", (unsigned long)wifi_s_retries);
      startAp();
    }
    return;
  }

  // --- Watchdog del AP: si el AP está activo pero no responde a peticiones HTTP
  // durante mucho tiempo, reiniciamos el servidor web para recuperar el enlace.
  // Esto evita que el panel se quede "conectado" pero sin recibir datos.
  const uint32_t silence = now - s_lastRequestMs;
  if (silence > 30000UL && s_requests > 0) {  // 30 s sin peticiones y hubo tráfico antes
    Serial.printf("[WIFI] AP sin peticiones HTTP por %lu s -> reiniciando servidor web\n",
                  (unsigned long)silence / 1000UL);
    // No reiniciamos el AP completo (cortaría a los clientes), solo forzamos
    // que el servidor siga aceptando conexiones. AsyncWebServer debería hacerlo
    // solo, pero esto ayuda en casos extremos.
    s_lastRequestMs = now;   // evita bucle de reinicios
  }
#endif

  const uint8_t stations = WiFi.softAPgetStationNum();
  if (stations != s_lastStations) {
    if (stations > s_lastStations) {
      Serial.printf("[WIFI] cliente conectado -> %u activo(s)\n", stations);
    } else {
      Serial.printf("[WIFI] cliente desconectado -> %u activo(s)\n", stations);
    }
    s_lastStations = stations;
  }
}

bool wifiIsApActive() { return s_apActive; }

uint8_t wifiGetStations() { return s_apActive ? WiFi.softAPgetStationNum() : 0; }

IPAddress wifiGetIp() { return WiFi.softAPIP(); }

uint32_t wifiGetUptimeS() {
  return s_apActive ? (millis() - s_startedMs) / 1000UL : 0;
}

const char* wifiGetStatusStr() {
  return (s_apActive || WiFi.status() == WL_CONNECTED) ? "up" : "down";
}

// ----------------------------------------------------------------------------
// Modo cliente (STA)
// ----------------------------------------------------------------------------
bool      wifiStaEnabled()     { return WIFI_STA_ENABLED; }
bool      wifiStaIsConnected() { return WiFi.status() == WL_CONNECTED; }
IPAddress wifiStaGetIp()       { return wifiStaIsConnected() ? WiFi.localIP() : IPAddress(); }
int8_t    wifiStaGetRssi()     { return wifiStaIsConnected() ? (int8_t)WiFi.RSSI() : 0; }
const char* wifiStaGetSsid()   { return WIFI_STA_SSID; }

// IP util del robot: la de la red cliente si esta conectado (asi lo alcanza la
// PC cuando la placa no puede emitir su AP); si no, la del AP.
IPAddress wifiGetAnyIp() {
  return wifiStaIsConnected() ? WiFi.localIP() : WiFi.softAPIP();
}

// Control en caliente del modo cliente (consola serie: sta on | sta off).
// Apagarlo libera la radio: es necesario para que WiFi.scanNetworks() funcione.
void wifiStaStop() {
#if WIFI_STA_ENABLED
  s_staRun      = false;
  s_staLinked   = false;
  WiFi.disconnect(false, false);      // corta el intento, NO apaga la radio (AP sigue)
  Serial.println(F("[WIFI] STA detenido (radio libre para escanear)"));
#endif
}

void wifiStaStart() {
#if WIFI_STA_ENABLED
  s_staRun = true;
  startSta();
#endif
}

bool wifiStaIsRunning() { return s_staRun; }

void wifiStaReconnect() {
#if WIFI_STA_ENABLED
  if (!s_staRun) return;
  Serial.printf("[WIFI] reconexion forzada a \"%s\" (enlace sin trafico)\n",
                WIFI_STA_SSID);
  // Desasociar del todo: si solo se llama a WiFi.begin() el driver puede dar
  // la asociacion por buena y no volver a negociar, que es justo el problema.
  WiFi.disconnect(false, false);
  delay(500);
  startSta();
#endif
}

// ----------------------------------------------------------------------------
// Clientes conectados (MAC + RSSI)
// ----------------------------------------------------------------------------
uint8_t wifiGetStationsList(WifiStaInfo* out, uint8_t maxOut) {
  if (!out || maxOut == 0 || !s_apActive) return 0;

  const uint32_t now = millis();
  if (!s_stationCacheReady ||
      (uint32_t)(now - s_stationCacheAtMs) >= STATION_LIST_CACHE_MS) {
    wifi_sta_list_t list;
    memset(&list, 0, sizeof(list));
    if (esp_wifi_ap_get_sta_list(&list) == ESP_OK) {
      s_stationCacheCount = 0;
      for (int i = 0; i < list.num && s_stationCacheCount < MAX_STATIONS; i++) {
        WifiStaInfo& cached = s_stationCache[s_stationCacheCount++];
        memcpy(cached.mac, list.sta[i].mac, sizeof(cached.mac));
        cached.rssi = list.sta[i].rssi;
      }
    } else if (!s_stationCacheReady) {
      s_stationCacheCount = 0;
    }
    s_stationCacheAtMs = now;
    s_stationCacheReady = true;
  }

  const uint8_t count = (s_stationCacheCount < maxOut) ? s_stationCacheCount : maxOut;
  memcpy(out, s_stationCache, count * sizeof(WifiStaInfo));
  return count;
}

const char* wifiGetSsid()        { return WIFI_SSID; }
bool        wifiIsPasswordSet()  { return (strlen(WIFI_PASSWORD) > 0); }
uint8_t     wifiGetChannel()     { return (uint8_t)WIFI_CHANNEL; }
uint8_t     wifiGetMaxConn()     { return (uint8_t)WIFI_AP_MAX_CONN; }

// ----------------------------------------------------------------------------
// Escaneo WiFi desde el ESP32: verifica que la radio/antena RECIBA.
// (el AP puede crearse "bien" en software pero no emitir si la radio falla)
void wifiScanTest() {
  Serial.println(F("[WIFI] escaneando redes cercanas (prueba de radio/antena)..."));
  const int16_t n = WiFi.scanNetworks(false, false, false, 300);
  if (n < 0) {
    Serial.println(F("[WIFI] scan falló"));
    return;
  }
  Serial.printf("[WIFI] %d redes visibles\n", n);
  for (int16_t i = 0; i < n && i < 20; i++) {
    // Seguridad del BSSID: clave para saber si el ESP32 puede asociarse
    // (el ESP32 no soporta WPA3/SAE).
    const char* sec;
    switch (WiFi.encryptionType(i)) {
      case WIFI_AUTH_OPEN:         sec = "ABIERTA";       break;
      case WIFI_AUTH_WEP:          sec = "WEP";           break;
      case WIFI_AUTH_WPA_PSK:      sec = "WPA-PSK";       break;
      case WIFI_AUTH_WPA2_PSK:     sec = "WPA2-PSK";      break;
      case WIFI_AUTH_WPA3_PSK:     sec = "WPA3-PSK";      break;
      case WIFI_AUTH_WPA2_WPA3_PSK:sec = "WPA2/WPA3";     break;
      case WIFI_AUTH_WPA2_ENTERPRISE: sec = "WPA2-ENT";   break;
      default:                     sec = "?";             break;
    }
    Serial.printf("[WIFI]   %s ch=%d rssi=%d sec=%s\n",
                  WiFi.SSID(i).c_str(), WiFi.channel(i), WiFi.RSSI(i), sec);
  }
  WiFi.scanDelete();
}

// ==========================================================================
//  [25] COMUNICACION · PERFIL DEL MANDO
//  fuente: mando_profile.h
// ==========================================================================

#ifndef MANDO_PROFILE_H
#define MANDO_PROFILE_H


// ============================================================================
// Modulo MandoProfile - perfil de configuracion del mando fisico (ESP32-C3)
//
// El mando solo puede enviar (POST), no recibe ordenes. Por eso su configuracion
// vive en la NVS del robot: la web la edita (POST /api/mando/config), el robot la
// guarda con Preferences y el mando la baja al conectarse (GET /api/mando/config).
// "version" sube en cada cambio: el mando solo aplica el perfil si cambio.
//
// Campos y rangos validados al guardar:
//   deadzone        0.00-0.40  zona muerta del joystick (fraccion del recorrido)
//   ema_alpha       0.05-1.00  suavizado del ADC (1.0 = sin filtro)
//   heartbeat_ms    50-1000    reenvio mientras hay orden de movimiento
//   send_rate_hz    1-50       maximo de comandos por segundo
//   invert_x / y    bool       invierte el sentido del joystick
//   pot_min / max   0-4095     recorrido util del potenciometro de velocidad
//   speed_min / max 0-100      velocidad minima y maxima que puede pedir el mando
//   led_brightness  0-100      brillo del LED de estado del mando
//   buzzer          bool       permite que el clic del joystick active el buzzer del robot
//   mode_button     string     codigo de modo que dispara el boton (18 del panel)
//   body_step       0.10-1.00  paso de altura del chasis por pulsacion
// ============================================================================

/* [tipo MandoProfileData definido arriba] */

// Carga el perfil de la NVS (crea los valores por defecto la primera vez).
void mandoProfileInit();

// Guarda el perfil actual en NVS e incrementa "version" (false si la NVS falla).
bool mandoProfileSave();

// Vuelve a los valores por defecto y los guarda.
void mandoProfileReset();

uint32_t mandoProfileGetVersion();

// Estado actual del perfil (solo lectura).
const MandoProfileData& mandoProfileGet();

// JSON completo para GET /api/mando/config:  {"version":3,"profile":{...}}
String mandoProfileToJson();

// Aplica un perfil recibido en JSON (acepta el objeto pelado o {"profile":{...}}).
// Devuelve nullptr si se aplico y guardo, o el motivo del rechazo (HTTP 400).
const char* mandoProfileFromJson(const String& json);

#endif  // MANDO_PROFILE_H

// ==========================================================================
//  [26] COMUNICACION · PERFIL DEL MANDO
//  fuente: mando_profile.cpp
// ==========================================================================

static MandoProfileData s_profile;
static uint32_t         s_version = 0;
static Preferences      s_prefs;
static bool             s_prefsOk = false;
static char             s_error[128] = "";

static bool inRange(float v, float lo, float hi) { return v >= lo && v <= hi; }

static void setDefaults() {
  s_profile.deadzone      = 0.08f;
  s_profile.emaAlpha      = 0.30f;
  s_profile.heartbeatMs   = 200;
  s_profile.sendRateHz    = 20;
  s_profile.invertX       = false;
  s_profile.invertY       = true;
  s_profile.potMin        = 60;
  s_profile.potMax        = 4020;
  s_profile.speedMin      = 0;
  s_profile.speedMax      = 100;
  s_profile.ledBrightness = 64;
  s_profile.buzzer        = true;
  strncpy(s_profile.modeButton, "DANCE", sizeof(s_profile.modeButton) - 1);
  s_profile.modeButton[sizeof(s_profile.modeButton) - 1] = 0;
  s_profile.bodyStep      = 0.50f;
}

static void writeToNvs() {
  s_prefs.putFloat("deadzone",   s_profile.deadzone);
  s_prefs.putFloat("ema",        s_profile.emaAlpha);
  s_prefs.putUShort("hb_ms",     s_profile.heartbeatMs);
  s_prefs.putUChar("rate_hz",    s_profile.sendRateHz);
  s_prefs.putBool("inv_x",       s_profile.invertX);
  s_prefs.putBool("inv_y",       s_profile.invertY);
  s_prefs.putUShort("pot_min",   s_profile.potMin);
  s_prefs.putUShort("pot_max",   s_profile.potMax);
  s_prefs.putUChar("spd_min",    s_profile.speedMin);
  s_prefs.putUChar("spd_max",    s_profile.speedMax);
  s_prefs.putUChar("led",        s_profile.ledBrightness);
  s_prefs.putBool("buzzer",      s_profile.buzzer);
  s_prefs.putString("mode_btn",  s_profile.modeButton);
  s_prefs.putFloat("body_step",  s_profile.bodyStep);
}

static void readFromNvs() {
  s_profile.deadzone      = s_prefs.getFloat("deadzone",  s_profile.deadzone);
  s_profile.emaAlpha      = s_prefs.getFloat("ema",       s_profile.emaAlpha);
  s_profile.heartbeatMs   = s_prefs.getUShort("hb_ms",    s_profile.heartbeatMs);
  s_profile.sendRateHz    = s_prefs.getUChar("rate_hz",   s_profile.sendRateHz);
  s_profile.invertX       = s_prefs.getBool("inv_x",      s_profile.invertX);
  s_profile.invertY       = s_prefs.getBool("inv_y",      s_profile.invertY);
  s_profile.potMin        = s_prefs.getUShort("pot_min",  s_profile.potMin);
  s_profile.potMax        = s_prefs.getUShort("pot_max",  s_profile.potMax);
  s_profile.speedMin      = s_prefs.getUChar("spd_min",   s_profile.speedMin);
  s_profile.speedMax      = s_prefs.getUChar("spd_max",   s_profile.speedMax);
  s_profile.ledBrightness = s_prefs.getUChar("led",       s_profile.ledBrightness);
  s_profile.buzzer        = s_prefs.getBool("buzzer",     s_profile.buzzer);
  const String mode       = s_prefs.getString("mode_btn", s_profile.modeButton);
  strncpy(s_profile.modeButton, mode.c_str(), sizeof(s_profile.modeButton) - 1);
  s_profile.modeButton[sizeof(s_profile.modeButton) - 1] = 0;
  s_profile.bodyStep      = s_prefs.getFloat("body_step", s_profile.bodyStep);
}

void mandoProfileInit() {
  setDefaults();
  s_prefsOk = s_prefs.begin("mando", false);
  if (!s_prefsOk) {
    Serial.println(F("[MANDO] NVS no disponible: se usan los valores por defecto"));
    return;
  }
  s_version = s_prefs.getUInt("version", 0);
  if (s_version == 0) {
    mandoProfileSave();   // primera vez: persiste los defaults (version = 1)
  } else {
    readFromNvs();
  }
  Serial.printf("[MANDO] perfil v%lu | deadzone=%.2f ema=%.2f hb=%ums rate=%uHz modo=%s\n",
                (unsigned long)s_version, s_profile.deadzone, s_profile.emaAlpha,
                (unsigned)s_profile.heartbeatMs, (unsigned)s_profile.sendRateHz,
                s_profile.modeButton);
}

bool mandoProfileSave() {
  if (!s_prefsOk) return false;
  writeToNvs();
  s_version++;
  s_prefs.putUInt("version", s_version);
  return true;
}

void mandoProfileReset() {
  setDefaults();
  if (mandoProfileSave()) {
    Serial.printf("[MANDO] perfil restaurado a valores por defecto (v%lu)\n",
                  (unsigned long)s_version);
  }
}

uint32_t mandoProfileGetVersion() { return s_version; }
const MandoProfileData& mandoProfileGet() { return s_profile; }
// ----------------------------------------------------------------------------
// JSON: GET /api/mando/config
// ----------------------------------------------------------------------------
String mandoProfileToJson() {
  JsonDocument doc;
  doc["version"] = s_version;
  JsonObject p = doc["profile"].to<JsonObject>();
  p["deadzone"]       = s_profile.deadzone;
  p["ema_alpha"]      = s_profile.emaAlpha;
  p["heartbeat_ms"]   = s_profile.heartbeatMs;
  p["send_rate_hz"]   = s_profile.sendRateHz;
  p["invert_x"]       = s_profile.invertX;
  p["invert_y"]       = s_profile.invertY;
  p["pot_min"]        = s_profile.potMin;
  p["pot_max"]        = s_profile.potMax;
  p["speed_min"]      = s_profile.speedMin;
  p["speed_max"]      = s_profile.speedMax;
  p["led_brightness"] = s_profile.ledBrightness;
  p["buzzer"]         = s_profile.buzzer;
  p["mode_button"]    = s_profile.modeButton;
  p["body_step"]      = s_profile.bodyStep;

  String out;
  serializeJson(doc, out);
  return out;
}

// ----------------------------------------------------------------------------
// JSON: POST /api/mando/config (validacion estricta campo por campo)
// Devuelve nullptr si aplico y guardo, o el motivo del rechazo (HTTP 400).
// ----------------------------------------------------------------------------
const char* mandoProfileFromJson(const String& json) {
  JsonDocument doc;
  const DeserializationError err = deserializeJson(doc, json);
  if (err) {
    snprintf(s_error, sizeof(s_error), "JSON invalido: %s", err.c_str());
    return s_error;
  }

  JsonObject p = doc["profile"].is<JsonObject>() ? doc["profile"].as<JsonObject>()
                                                  : doc.as<JsonObject>();
  if (p.isNull() || p.size() == 0) {
    snprintf(s_error, sizeof(s_error), "falta el objeto profile");
    return s_error;
  }

  MandoProfileData next = s_profile;   // se valida sobre una copia

  if (!p["deadzone"].isNull()) {
    const float v = p["deadzone"].as<float>();
    if (!inRange(v, 0.0f, 0.40f)) { snprintf(s_error, sizeof(s_error), "deadzone fuera de rango (0.00-0.40)"); return s_error; }
    next.deadzone = v;
  }
  if (!p["ema_alpha"].isNull()) {
    const float v = p["ema_alpha"].as<float>();
    if (!inRange(v, 0.05f, 1.0f)) { snprintf(s_error, sizeof(s_error), "ema_alpha fuera de rango (0.05-1.00)"); return s_error; }
    next.emaAlpha = v;
  }
  if (!p["heartbeat_ms"].isNull()) {
    const int v = p["heartbeat_ms"].as<int>();
    if (v < 50 || v > 1000) { snprintf(s_error, sizeof(s_error), "heartbeat_ms fuera de rango (50-1000)"); return s_error; }
    next.heartbeatMs = (uint16_t)v;
  }
  if (!p["send_rate_hz"].isNull()) {
    const int v = p["send_rate_hz"].as<int>();
    if (v < 1 || v > 50) { snprintf(s_error, sizeof(s_error), "send_rate_hz fuera de rango (1-50)"); return s_error; }
    next.sendRateHz = (uint8_t)v;
  }
  if (!p["invert_x"].isNull()) next.invertX = p["invert_x"].as<bool>();
  if (!p["invert_y"].isNull()) next.invertY = p["invert_y"].as<bool>();
  if (!p["pot_min"].isNull() || !p["pot_max"].isNull()) {
    const int lo = p["pot_min"].isNull() ? next.potMin : p["pot_min"].as<int>();
    const int hi = p["pot_max"].isNull() ? next.potMax : p["pot_max"].as<int>();
    if (lo < 0 || hi > 4095 || lo >= hi) { snprintf(s_error, sizeof(s_error), "pot_min/pot_max invalidos (0-4095 y min < max)"); return s_error; }
    next.potMin = (uint16_t)lo;
    next.potMax = (uint16_t)hi;
  }
  if (!p["speed_min"].isNull() || !p["speed_max"].isNull()) {
    const int lo = p["speed_min"].isNull() ? next.speedMin : p["speed_min"].as<int>();
    const int hi = p["speed_max"].isNull() ? next.speedMax : p["speed_max"].as<int>();
    if (lo < 0 || hi > 100 || lo > hi) { snprintf(s_error, sizeof(s_error), "speed_min/speed_max invalidos (0-100 y min <= max)"); return s_error; }
    next.speedMin = (uint8_t)lo;
    next.speedMax = (uint8_t)hi;
  }
  if (!p["led_brightness"].isNull()) {
    const int v = p["led_brightness"].as<int>();
    if (v < 0 || v > 100) { snprintf(s_error, sizeof(s_error), "led_brightness fuera de rango (0-100)"); return s_error; }
    next.ledBrightness = (uint8_t)v;
  }
  if (!p["buzzer"].isNull()) next.buzzer = p["buzzer"].as<bool>();
  if (!p["mode_button"].isNull()) {
    const char* m = p["mode_button"].as<const char*>();
    if (!m || !robotStateIsValidMode(m)) {
      snprintf(s_error, sizeof(s_error), "mode_button invalido. Validos: %s", robotStateGetValidModesCsv());
      return s_error;
    }
    strncpy(next.modeButton, m, sizeof(next.modeButton) - 1);
    next.modeButton[sizeof(next.modeButton) - 1] = 0;
  }
  if (!p["body_step"].isNull()) {
    const float v = p["body_step"].as<float>();
    if (!inRange(v, 0.10f, 1.0f)) { snprintf(s_error, sizeof(s_error), "body_step fuera de rango (0.10-1.00)"); return s_error; }
    next.bodyStep = v;
  }

  s_profile = next;
  if (!mandoProfileSave()) {
    snprintf(s_error, sizeof(s_error), "no se pudo guardar en NVS");
    return s_error;
  }

  Serial.printf("[MANDO] perfil actualizado a v%lu | deadzone=%.2f hb=%u ms rate=%u Hz modo=%s\n",
                (unsigned long)s_version, s_profile.deadzone, s_profile.heartbeatMs,
                (unsigned)s_profile.sendRateHz, s_profile.modeButton);
  return nullptr;
}

// ==========================================================================
//  [27] COMUNICACION · API REST
//  fuente: webserver.h
// ==========================================================================

#ifndef COMUNICACION_WEBSERVER_H
#define COMUNICACION_WEBSERVER_H


// ============================================================================
// Módulo WebServer (ESPAsyncWebServer) — Araña Robot (ESP32-S3)
//
// API REST que consumen la PC (pc/app.py -> ESP32Client) y el mando físico
// ESP32-C3 (docs/PLAN_CONTROLADOR_ESP32-C3.txt). Escucha en 192.168.4.1:80.
//
//   GET  /                -> texto plano con los endpoints disponibles
//   GET  /api/status      -> estado completo (mismos campos que lee pc/app.py)
//   POST /api/command     -> {"cmd": "...", "value": ...}
//
// Respuestas de /api/command:
//   200 {"status":"ok","cmd":"<cmd>"}                          comando aplicado
//   400 {"status":"error","error":"bad_request"|"invalid_json"|
//        "unknown_cmd"|"invalid_value","detail":"..."}         body/valores mal
//   423 {"status":"error","error":"emergency_locked"}           E-STOP activo
//   503 {"status":"error","error":"hardware_offline",
//        "detail":"PCA9685 no responde: ..."}                   modulo sin conexion
//   404 {"status":"error","error":"not_found"}
//
// Comandos implementados (todos):
//   mode, move, joystick, rotate, speed, body, emergency, stabilize,
//   buzzer, buzzer_stop, headlight, reset, aux, terminal,
//   servo, servo_adv, servo_cal  (PCA9685),
//   led_pixel, led_fill, led_clear, led_matrix, led_pattern, led_off, led_color,
//   brightness, led_brightness  (matriz NeoPixel 8x8)
//
// Fuente del comando: header "X-Arana-Source: mando|pc" o el campo "source" del
// JSON. Se publica en /api/status -> last_command{cmd,source,age_ms}.
// ============================================================================

// Registra las rutas y arranca el servidor. Llamar después de wifiInit().
void webserverInit();

// Reporte periódico por consola (no bloqueante). Llamar desde loop().
void webserverUpdate();

uint32_t webserverGetRequestCount();
uint32_t webserverGetErrorCount();

#endif  // COMUNICACION_WEBSERVER_H

// ==========================================================================
//  [28] COMUNICACION · API REST
//  fuente: webserver.cpp
// ==========================================================================

// ----------------------------------------------------------------------------
// Estado interno
// ----------------------------------------------------------------------------
static AsyncWebServer s_server(HTTP_PORT);
static uint32_t s_lastReportMs = 0;
// s_requests, s_errors, s_lastRequestMs, s_lastReconnectMs ya estan
// declarados antes de wifiUpdate() (lineas 4574-4577) para evitar
// "not declared in scope" en wifiUpdate.

// Identidad de los clientes (para el panel web del mando):
//   s_lastClientIp  IP que envio el ultimo comando (request->client()->remoteIP())
//   s_mandoMac/Ip   MAC e IP declaradas por el mando con el header X-Arana-Mac
static char     s_lastClientIp[16] = "";
static char     s_mandoMac[18]     = "";
static char     s_mandoIp[16]      = "";
static uint32_t s_mandoLastSeenMs  = 0;
static uint32_t s_mandoCommands    = 0;
static uint32_t s_mandoFetches     = 0;

// ----------------------------------------------------------------------------
// Identidad de clientes y helpers de red
// ----------------------------------------------------------------------------
static void macToStr(const uint8_t* mac, char* out) {   // out >= 18
  snprintf(out, 18, "%02X:%02X:%02X:%02X:%02X:%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
}

static void ipToStr(const IPAddress& ip, char* out) {   // out >= 16
  snprintf(out, 16, "%u.%u.%u.%u", ip[0], ip[1], ip[2], ip[3]);
}

// Registra al mando fisico: MAC por el header X-Arana-Mac e IP del socket.
// (No hay API de DHCP para mapear MAC <-> IP: el mando se auto-declara.)
static void registerMandoRequest(AsyncWebServerRequest* request) {
  if (request->client()) ipToStr(request->client()->remoteIP(), s_mandoIp);
  if (request->hasHeader("X-Arana-Mac")) {
    const String mac = request->header("X-Arana-Mac");
    if (mac.length() >= 12) {
      strncpy(s_mandoMac, mac.c_str(), sizeof(s_mandoMac) - 1);
      s_mandoMac[sizeof(s_mandoMac) - 1] = 0;
    }
  }
  s_mandoLastSeenMs = millis();
}

// ----------------------------------------------------------------------------
// Body del POST en curso.
// ESPAsyncWebServer solo expone el cuerpo completo como parametro "body" cuando
// el cliente usa x-www-form-urlencoded; con Content-Type: application/json (lo
// que manda pc/app.py y el mando ESP32-C3) el cuerpo llega troceado al handler
// onBody (handleCommandBody), que lo acumula aqui ANTES de que se llame al
// handler principal. Por eso s_body se declara antes de takeBody().
//
// AISLAMIENTO POR PETICION: el panel PC y el mando fisico pueden postear a la
// vez (/api/command y /api/mando/config). Con un unico buffer global, el body
// del segundo se pisaba con el del primero y el comando se ejecutaba con el
// JSON equivocado. Se guardan hasta WEB_MAX_BODY_SLOTS cuerpos, indexados por
// la ranura libre mas antigua (round-robin con retroceso), y cada handler pide
// el suyo por el puntero de la peticion.
// ----------------------------------------------------------------------------
#define WEB_MAX_BODY_SLOTS 4

static String s_body[WEB_MAX_BODY_SLOTS];
static AsyncWebServerRequest* s_bodyOwner[WEB_MAX_BODY_SLOTS] = {nullptr};
static uint8_t s_bodyNext = 0;

// Devuelve el body del POST de ESTA peticion: el acumulado por
// handleCommandBody() o, si no hubo trozos, el parametro "body"
// (formato x-www-form-urlencoded). Libera la ranura para el siguiente POST.
static String takeBody(AsyncWebServerRequest* request) {
  for (uint8_t i = 0; i < WEB_MAX_BODY_SLOTS; i++) {
    if (s_bodyOwner[i] == request) {
      String body = s_body[i];
      s_body[i] = "";
      s_bodyOwner[i] = nullptr;
      return body;
    }
  }
  const AsyncWebParameter* param = request->getParam("body", true, false);
  return param ? param->value() : String();
}

// ----------------------------------------------------------------------------
// Helpers de respuesta JSON
// ----------------------------------------------------------------------------
static void sendJson(AsyncWebServerRequest* request, int code, const String& body) {
  AsyncWebServerResponse* response = request->beginResponse(code, "application/json", body);
  addCorsHeaders(response);
  request->send(response);
}

// Sobrecarga para strings en flash (F("...")) sin construir String en RAM.
static void sendJson(AsyncWebServerRequest* request, int code, const __FlashStringHelper* body) {
  AsyncWebServerResponse* response = request->beginResponse(code, "application/json", String(body));
  addCorsHeaders(response);
  request->send(response);
}

// ---------------------------------------------------------------------------
// Headers CORS y anti-cache: permite que el panel Flask (localhost:8080 o cualquier IP)
// consuma la API del ESP32 sin bloqueos de navegador, y evita que intermediarios
// cacheen respuestas de estado que deben ser siempre frescas.
// ---------------------------------------------------------------------------
static void addCorsHeaders(AsyncWebServerResponse* response) {
  response->addHeader("Access-Control-Allow-Origin", "*");
  response->addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response->addHeader("Access-Control-Allow-Headers", "Content-Type, X-Arana-Source, X-Arana-Mac");
  response->addHeader("Access-Control-Max-Age", "86400");
  response->addHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response->addHeader("Pragma", "no-cache");
  response->addHeader("Expires", "0");
}

// Wrapper que inyecta CORS antes de enviar JSON.
static void sendJsonCors(AsyncWebServerRequest* request, int code, const String& body) {
  AsyncWebServerResponse* response = request->beginResponse(code, "application/json", body);
  addCorsHeaders(response);
  request->send(response);
}

// Respuesta vacía con CORS (para preflight OPTIONS y health checks).
static void sendOkCors(AsyncWebServerRequest* request) {
  AsyncWebServerResponse* response = request->beginResponse(200, "text/plain", "OK");
  addCorsHeaders(response);
  request->send(response);
}

static String statusJson(const char* cmd) {
  String out = F("{\"status\":\"ok\",\"cmd\":\"");
  out += cmd ? cmd : "";
  out += F("\"}");
  return out;
}

static String jsonError(const char* error, const char* detail) {
  String out = F("{\"status\":\"error\",\"error\":\"");
  out += error;
  out += F("\"");
  if (detail && *detail) {
    out += F(",\"detail\":\"");
    out += detail;
    out += F("\"");
  }
  out += F("}");
  return out;
}

// ----------------------------------------------------------------------------
// Helpers de conversion de los valores JSON
// ----------------------------------------------------------------------------
static String variantToString(JsonVariant v) {
  if (v.isNull()) return String();
  if (v.is<const char*>()) return String(v.as<const char*>());
  return v.as<String>();
}

static bool variantToFloat(JsonVariant v, float& out) {
  if (v.isNull()) return false;
  if (v.is<float>() || v.is<int>() || v.is<long>()) { out = v.as<float>(); return true; }
  const String s = variantToString(v);
  if (!s.length()) return false;
  out = s.toFloat();
  return true;
}

static bool variantToInt(JsonVariant v, int& out) {
  float f = 0.0f;
  if (!variantToFloat(v, f)) return false;
  out = (int)lroundf(f);
  return true;
}

static bool variantToBool(JsonVariant v, bool& out) {
  if (v.isNull()) return false;
  if (v.is<bool>()) { out = v.as<bool>(); return true; }
  String s = variantToString(v);
  if (!s.length()) return false;
  s.toLowerCase();
  if (s == "true" || s == "1" || s == "on")   { out = true;  return true; }
  if (s == "false" || s == "0" || s == "off") { out = false; return true; }
  return false;
}

// ----------------------------------------------------------------------------
// Color "#RRGGBB" -> RGB 0-255. Acepta tambien "#RGB" abreviado y sin almohadilla.
// Es protocolo (lo manda el panel), no hardware, por eso vive aca y no en el
// modulo neopixel.
// ----------------------------------------------------------------------------
static bool hexToRgb(const String& hex, uint8_t& r, uint8_t& g, uint8_t& b) {
  String h = hex;
  h.trim();
  if (h.startsWith("#")) h = h.substring(1);
  if (h.length() != 6 && h.length() != 3) return false;

  // Forma abreviada "#0F8" -> "00FF88".
  if (h.length() == 3) {
    const char t[7] = { h[0], h[0], h[1], h[1], h[2], h[2], 0 };
    h = String(t);
  }
  char* end = nullptr;
  const long v = strtol(h.c_str(), &end, 16);
  if (end && *end != 0) return false;         // habia caracteres no hexadecimales
  r = (uint8_t)((v >> 16) & 0xFF);
  g = (uint8_t)((v >> 8) & 0xFF);
  b = (uint8_t)(v & 0xFF);
  return true;
}
// ----------------------------------------------------------------------------
// GET /api/status — mismos campos que lee pc/app.py -> ESP32Client.fetch_status:
//   top-level: mode, speed, servos[[pata][articulacion]], sensors{...}
//   extra para el mando físico: joystick, rotate, body, last_command, link
// ----------------------------------------------------------------------------
static String buildStatusJson() {
  JsonDocument doc;

  doc["mode"]           = robotState.mode;
  doc["speed"]          = robotState.speed;
  doc["emergency_stop"] = robotState.emergencyStop;
  doc["stabilize"]      = robotState.stabilize;
  doc["move"]           = robotState.move;

  JsonObject joy = doc["joystick"].to<JsonObject>();
  joy["x"] = robotState.joyX;
  joy["y"] = robotState.joyY;
  doc["rotate"] = robotState.rotate;

  JsonObject bodyObj = doc["body"].to<JsonObject>();
  bodyObj["z"]     = robotState.bodyZ;
  bodyObj["pitch"] = robotState.bodyPitch;
  bodyObj["roll"]  = robotState.bodyRoll;

  // Último comando recibido: permite que la PC vea lo que hizo el mando.
  JsonObject last = doc["last_command"].to<JsonObject>();
  last["cmd"]    = robotState.lastCommand;
  last["source"] = robotState.lastSource;
  last["age_ms"] = robotState.lastCommandMs ? (long)(millis() - robotState.lastCommandMs) : -1;
  doc["commands_total"] = robotState.commandsTotal;
  doc["watchdog_trips"] = robotState.watchdogTrips;

  JsonObject link = doc["link"].to<JsonObject>();
  link["ap"]       = wifiIsApActive();
  link["status"]   = wifiGetStatusStr();
  link["clients"]  = wifiGetStations();
  link["ip"]       = wifiGetIp().toString();
  // Modo cliente (STA): la PC alcanza al robot por esta IP cuando la placa no
  // puede emitir su propio AP (config.h: WIFI_STA_*).
  link["sta"]        = wifiStaIsConnected();
  link["sta_ssid"]   = wifiStaGetSsid();
  link["sta_ip"]     = wifiStaGetIp().toString();
  link["sta_rssi"]   = wifiStaGetRssi();
  link["robot_ip"]   = wifiGetAnyIp().toString();
  link["uptime_s"]     = wifiGetUptimeS();
  link["ssid"]         = wifiGetSsid();
  link["password_set"] = wifiIsPasswordSet();
  link["channel"]      = wifiGetChannel();
  link["max_clients"]  = wifiGetMaxConn();
  link["last_cmd_ip"]  = s_lastClientIp;

  // Estaciones conectadas al AP con su RSSI real (esp_wifi_ap_get_sta_list).
  // is_mando = true cuando la MAC coincide con la declarada por el mando fisico.
  WifiStaInfo stations[MAX_STATIONS];
  const uint8_t stationCount = wifiGetStationsList(stations, MAX_STATIONS);
  JsonArray stationArr = link["stations"].to<JsonArray>();
  for (uint8_t i = 0; i < stationCount; i++) {
    char mac[18];
    macToStr(stations[i].mac, mac);
    JsonObject st = stationArr.add<JsonObject>();
    st["mac"]      = mac;
    st["rssi"]     = stations[i].rssi;
    st["is_mando"] = (s_mandoMac[0] != 0) && (strcmp(mac, s_mandoMac) == 0);
  }

  // Mando fisico: online si envio algo hace menos de MANDO_OFFLINE_MS
  // (heartbeat de joystick o peticion del perfil).
  JsonObject mando = doc["mando"].to<JsonObject>();
  const uint32_t mandoAge = s_mandoLastSeenMs ? (millis() - s_mandoLastSeenMs) : 0;
  mando["seen"]            = (s_mandoLastSeenMs != 0);
  mando["online"]          = (s_mandoLastSeenMs != 0) && (mandoAge < MANDO_OFFLINE_MS);
  mando["last_seen_ms"]    = s_mandoLastSeenMs ? (long)mandoAge : -1;
  mando["mac"]             = s_mandoMac;
  mando["ip"]              = s_mandoIp;
  mando["commands"]        = s_mandoCommands;
  mando["profile_fetches"] = s_mandoFetches;
  mando["profile_version"] = mandoProfileGetVersion();
  mando["mode_button"]     = mandoProfileGet().modeButton;
  mando["joy_x"]           = robotState.joyX;
  mando["joy_y"]           = robotState.joyY;
  mando["rotate"]          = robotState.rotate;
  mando["body_z"]          = robotState.bodyZ;
  link["requests"] = s_requests;
  link["errors"]   = s_errors;

  // Lista 4 patas x 3 articulaciones con el angulo REAL de cada servo, que es
  // lo que dibuja el diagrama del panel.
  JsonArray servos = doc["servos"].to<JsonArray>();
  for (uint8_t leg = 0; leg < SERVO_LEGS; leg++) {
    JsonArray joints = servos.add<JsonArray>();
    for (uint8_t j = 0; j < SERVO_JOINTS; j++) joints.add(servoGetAngle(leg, j));
  }

  // --- sensores: exactamente las claves de pc/app.py -> SensorState ----------
  JsonObject sensors = doc["sensors"].to<JsonObject>();

  JsonObject imu = sensors["imu"].to<JsonObject>();
  imu["online"] = imuIsOnline();
  imu["pitch"]  = imuGetPitch();
  imu["roll"]   = imuGetRoll();
  imu["yaw"]    = imuGetYaw();
  imu["ax"]     = imuGetAx();
  imu["ay"]     = imuGetAy();
  imu["az"]     = imuGetAz();
  imu["gx"]     = imuGetGx();
  imu["gy"]     = imuGetGy();
  imu["gz"]     = imuGetGz();
  imu["temp"]   = imuGetTempC();
  imu["name"]   = "MPU6050";
  imu["pin"]    = "I2C";
  char imuAddress[5];
  snprintf(imuAddress, sizeof(imuAddress), "0x%02X", imuGetI2cAddress());
  imu["address"] = imuAddress;

  JsonObject buzzerInfo = sensors["buzzer"].to<JsonObject>();
  buzzerInfo["online"] = buzzerIsOnline();
  buzzerInfo["state"]  = buzzerGetState();
  buzzerInfo["pattern"] = buzzerGetPattern();
  buzzerInfo["freq"]    = buzzerGetFrequency();
  buzzerInfo["name"]   = "Buzzer Pasivo";
  buzzerInfo["pin"]    = String("GPIO") + BUZZER_PIN;

  JsonObject headlights = sensors["headlights"].to<JsonObject>();
  headlights["online"]     = true;
  headlights["state"]      = ledsGetState() ? "on" : "off";
  headlights["brightness"] = (int)((ledsGetBrightness() * 100L + 127L) / 255L);   // 0-100 %
  headlights["name"]       = "Headlight LED";
  headlights["pin"]        = String("GPIO") + HEADLIGHT_PIN;

  // --- servo driver (PCA9685) ---
  JsonObject servosInfo = sensors["servos"].to<JsonObject>();
  servosInfo["online"] = servosIsOnline();
  servosInfo["count"]  = SERVO_COUNT;
  servosInfo["name"]   = "PCA9685";
  servosInfo["pin"]    = "I2C";

  // --- matriz NeoPixel 8x8 ---
  JsonObject ledsInfo = sensors["leds"].to<JsonObject>();
  ledsInfo["online"]     = neopixelIsOnline();
  // NeoPixel no tiene canal de retorno: el firmware puede transmitir, pero no
  // confirmar si la matriz está físicamente conectada.
  ledsInfo["presence_verifiable"] = false;
  ledsInfo["brightness"] = neopixelGetBrightness();      // 0-100 %
  ledsInfo["pattern"]    = neopixelGetPattern();
  ledsInfo["name"]       = "NeoPixel 8x8";
  ledsInfo["pin"]        = String("GPIO") + NEOPIXEL_PIN;

  // --- radar (HC-SR04). value = 0 cuando no hay objeto dentro del rango ---
  JsonObject ultrasonic = sensors["ultrasonic"].to<JsonObject>();
  ultrasonic["online"] = ultrasonicIsOnline();
  ultrasonic["value"]  = ultrasonicIsOnline() ? ultrasonicGetCm() : 0.0f;
  ultrasonic["unit"]   = "cm";
  ultrasonic["name"]   = "Radar HC-SR04";
  ultrasonic["pin"]    = String("GPIO") + String(ULTRASONIC_TRIG_PIN) + "/" +
                         String(ULTRASONIC_ECHO_PIN);

  // --- sensor de linea (TCRT5000) ---
  JsonObject ir = sensors["ir"].to<JsonObject>();
  ir["online"] = irIsOnline();
  ir["value"]  = irIsOnline() ? irGetValue() : 0;
  ir["name"]   = "TCRT5000";
  ir["pin"]    = String("GPIO") + IR_PIN;

  // --- temperatura y humedad (AHT10 por I2C) ---
  // OJO: la clave sigue siendo "dht" porque es la que lee pc/app.py ->
  // SensorState.dht. El "name" ya dice el modelo real del chip.
  JsonObject dht = sensors["dht"].to<JsonObject>();
  dht["online"] = aht10IsOnline();
  dht["temp"]   = aht10IsOnline() ? aht10GetTempC()    : 0.0f;
  dht["hum"]    = aht10IsOnline() ? aht10GetHumidity() : 0.0f;
  dht["name"]   = "AHT10";
  dht["pin"]    = "I2C";

  // GPS: online = llegan tramas NMEA; fix = posicion valida y fresca.
  // Sin fix, lat/lon se publican como null (nunca se inventan coordenadas).
  JsonObject gps = sensors["gps"].to<JsonObject>();
  gps["online"]    = gpsIsOnline();
  gps["fix"]       = gpsHasFix();
  gps["sats"]      = gpsGetSats();
  gps["hdop"]      = gpsGetHdop();
  gps["alt_m"]     = gpsGetAltM();
  gps["speed_kmh"] = gpsGetSpeedKmh();
  gps["course"]    = gpsGetCourse();
  gps["utc"]       = gpsGetUtc();
  gps["age_ms"]    = gpsGetAgeMs();
  gps["sentences"] = gpsGetSentences();
  gps["name"]      = "NEO-6M";
  gps["pin"]       = "GPIO17/18";
  if (gpsHasFix()) {
    gps["lat"] = gpsGetLat();
    gps["lon"] = gpsGetLon();
  } else {
    gps["lat"].set(nullptr);
    gps["lon"].set(nullptr);
  }

  // Bateria (opcional): solo se publica si el divisor esta habilitado en config.h
  if (batteryIsEnabled()) {
    JsonObject batSensor = sensors["battery"].to<JsonObject>();
    batSensor["online"]  = batteryIsOnline();
    batSensor["volts"]   = batteryGetVolts();
    batSensor["percent"] = batteryGetPercent();
    batSensor["raw"]     = batteryGetRaw();
    batSensor["name"]    = "Divisor de bateria";
    batSensor["pin"]     = String("GPIO") + BATTERY_ADC_PIN;

    // pc/app.py espera "battery" de nivel superior como numero (porcentaje)
    doc["battery"] = batteryGetPercent();
  }

  String out;
  serializeJson(doc, out);
  return out;
}
// ----------------------------------------------------------------------------
// Aplicación de un comando de POST /api/command
//   devuelve 200 y deja error == nullptr ....... aplicado
//   devuelve 400/423/501 con error/detail ...... rechazado
// ----------------------------------------------------------------------------
static int applyCommand(const char* cmd, JsonVariant value, const char*& error, String& detail) {
  error = nullptr;

  // Regla del latch: con E-STOP activo solo pasan comandos informativos o el
  // rearme (robot_state.cpp -> ALLOWED_WHEN_LOCKED). "mode" se valida aparte.
  if (!robotStateCommandAllowed(cmd)) {
    error  = "emergency_locked";
    detail = F("parada de emergencia activa: enviar emergency=false para rearmar");
    return 423;
  }

  // ------------------------------ modo de marcha ----------------------------
  if (strcasecmp(cmd, "mode") == 0) {
    const String mode = variantToString(value);
    if (!mode.length()) {
      error  = "invalid_value";
      detail = F("falta value con el modo");
      return 400;
    }
    if (!robotStateIsValidMode(mode.c_str())) {
      error  = "invalid_value";
      detail = String(F("modo invalido. Validos: ")) + robotStateGetValidModesCsv();
      return 400;
    }
    if (robotState.emergencyStop && !mode.equalsIgnoreCase("STAND")) {
      error  = "emergency_locked";
      detail = F("con la emergencia activa solo se admite mode STAND");
      return 423;
    }
    robotStateSetMode(mode.c_str());
    return 200;
  }

  // ------------------------------- movimiento -------------------------------
  if (strcasecmp(cmd, "move") == 0) {
    const String dir = variantToString(value);
    if (!robotStateSetMove(dir.c_str())) {
      error  = "invalid_value";
      detail = F("direccion invalida. Validas: forward, backward, left, right, crab_left, crab_right, turn_left, turn_right, stop");
      return 400;
    }
    return 200;
  }

  // ------------------------ joystick vectorial (x, y) -----------------------
  if (strcasecmp(cmd, "joystick") == 0) {
    if (!value.is<JsonObject>()) {
      error  = "invalid_value";
      detail = F("value debe ser {\"x\":-1..1,\"y\":-1..1}");
      return 400;
    }
    JsonObject o = value.as<JsonObject>();
    float x = 0.0f, y = 0.0f;
    if (!variantToFloat(o["x"], x) || !variantToFloat(o["y"], y)) {
      error  = "invalid_value";
      detail = F("joystick requiere x e y numericos");
      return 400;
    }
    if (!robotStateSetJoystick(x, y)) {
      error  = "invalid_value";
      detail = F("x e y deben estar entre -1.00 y 1.00");
      return 400;
    }
    return 200;
  }

  // -------------------------- giro sobre eje (yaw) --------------------------
  if (strcasecmp(cmd, "rotate") == 0) {
    float rate = 0.0f;
    if (!variantToFloat(value, rate) || !robotStateSetRotate(rate)) {
      error  = "invalid_value";
      detail = F("rotate requiere un numero entre -1.00 y 1.00");
      return 400;
    }
    return 200;
  }

  // ------------------------------- velocidad --------------------------------
  if (strcasecmp(cmd, "speed") == 0) {
    int speed = 0;
    if (!variantToInt(value, speed) || !robotStateSetSpeed(speed)) {
      error  = "invalid_value";
      detail = F("speed requiere un entero 0-100");
      return 400;
    }
    return 200;
  }

  // -------------------------- altura del chasis (Z) -------------------------
  if (strcasecmp(cmd, "body") == 0) {
    if (!value.is<JsonObject>()) {
      error  = "invalid_value";
      detail = F("value debe ser {\"z\":-1..1}");
      return 400;
    }
    JsonObject o = value.as<JsonObject>();
    float z = 0.0f;
    if (!variantToFloat(o["z"], z) || !robotStateSetBodyZ(z)) {
      error  = "invalid_value";
      detail = F("body.z debe estar entre -1.00 (bajar) y 1.00 (subir)");
      return 400;
    }
    return 200;
  }

  // --------------------- parada de emergencia (con latch) -------------------
  if (strcasecmp(cmd, "emergency") == 0) {
    bool on = false;
    if (!variantToBool(value, on)) {
      error  = "invalid_value";
      detail = F("emergency requiere true o false");
      return 400;
    }
    robotStateSetEmergency(on);
    return 200;
  }

  // --------------------------- giroestabilizador (IMU) ----------------------
  if (strcasecmp(cmd, "stabilize") == 0) {
    bool on = false;
    if (!variantToBool(value, on)) {
      error  = "invalid_value";
      detail = F("stabilize requiere true o false");
      return 400;
    }
    robotStateSetStabilize(on);
    return 200;
  }
  // --------------------------------- buzzer ---------------------------------
  if (strcasecmp(cmd, "buzzer") == 0) {
    String sPattern, sWave;
    uint16_t freq = BUZZER_DEFAULT_FREQ_HZ;
    uint16_t dur  = BUZZER_DEFAULT_DURATION_MS;
    uint8_t  vol  = BUZZER_DEFAULT_VOLUME;

    if (value.is<JsonObject>()) {
      JsonObject o = value.as<JsonObject>();
      sPattern = variantToString(o["pattern"]);
      sWave    = variantToString(o["wave"]);
      float f = 0.0f;
      if (variantToFloat(o["freq"], f))     freq = (uint16_t)f;
      if (variantToFloat(o["duration"], f)) dur  = (uint16_t)f;
      int v = 0;
      if (variantToInt(o["volume"], v))     vol  = (uint8_t)v;
    }

    const char* pattern = sPattern.length() ? sPattern.c_str() : "BEEP";
    const char* wave    = sWave.length()    ? sWave.c_str()    : "square";
    if (!buzzerPlay(pattern, freq, dur, wave, vol)) {
      error  = "invalid_value";
      detail = F("patron invalido (BEEP, SIREN, ALARM, RISE, FALL, CUSTOM, JURASSIC, JP3_VARIANT)");
      return 400;
    }
    return 200;
  }

  if (strcasecmp(cmd, "buzzer_stop") == 0) {
    buzzerStop();
    return 200;
  }

  // ------------------------------- headlights -------------------------------
  if (strcasecmp(cmd, "headlight") == 0) {
    if (!value.is<JsonObject>()) {
      error  = "invalid_value";
      detail = F("value debe ser {\"state\":\"on|off\",\"brightness\":0-100}");
      return 400;
    }
    JsonObject o = value.as<JsonObject>();
    const String state = variantToString(o["state"]);
    float brightness = -1.0f;
    if (!o["brightness"].isNull() && !variantToFloat(o["brightness"], brightness)) {
      error  = "invalid_value";
      detail = F("brightness debe ser un numero 0-100");
      return 400;
    }
    if (brightness > 100.0f) {
      error  = "invalid_value";
      detail = F("brightness fuera de rango (0-100)");
      return 400;
    }
    if (state.equalsIgnoreCase("on")) {
      if (brightness >= 0.0f) {
        // Respeta el brillo pedido. El 0 se sube al minimo visible: map(0,0,100,255)
        // daria duty 0 y la linterna no encenderia (pareceria un fallo).
        const long duty = map((long)brightness, 0, 100, 0, 255);
        ledsSetBrightness(duty > 0 ? (uint8_t)duty : HEADLIGHT_DEFAULT_BRIGHTNESS);
      } else if (ledsGetBrightness() == 0) {
        ledsSetBrightness(HEADLIGHT_DEFAULT_BRIGHTNESS);   // 50 % por defecto
      }
      ledsOn();
      return 200;
    }
    if (state.equalsIgnoreCase("off")) {
      ledsOff();          // no toca el brillo: al reencender se recupera
      return 200;         // el ultimo brillo pedido por el panel (no se pierde)
    }
    error  = "invalid_value";
    detail = F("state debe ser on u off");
    return 400;
  }

  // -------------------- reinicio a postura de apoyo ------------------------
  if (strcasecmp(cmd, "reset") == 0) {
    robotStateSetMode("STAND");
    robotStateSetMove("stop");
    robotStateSetJoystick(0.0f, 0.0f);
    robotStateSetRotate(0.0f);
    robotStateSetBodyZ(0.0f);
    robotStateSetBodyTilt(0.0f, 0.0f);
    if (servosIsOnline()) servoStand();
    detail = F("chasis a la postura de apoyo configurada");
    return 200;
  }

  // ---------------------- servo individual (pata/art) ----------------------
  if (strcasecmp(cmd, "servo") == 0) {
    if (!servosIsOnline()) {
      error  = "hardware_offline";
      detail = F("PCA9685 no responde: no se mueve ningun servo");
      return 503;
    }
    if (!value.is<JsonObject>()) {
      error  = "invalid_value";
      detail = F("value debe ser {\"leg\":0-3,\"joint\":0-2,\"angle\":10-170}");
      return 400;
    }
    JsonObject o = value.as<JsonObject>();
    int leg = -1, joint = -1, angle = -1;
    if (!variantToInt(o["leg"], leg) || !variantToInt(o["joint"], joint) ||
        !variantToInt(o["angle"], angle)) {
      error  = "invalid_value";
      detail = F("servo requiere leg, joint y angle numericos");
      return 400;
    }
    if (leg < 0 || leg >= SERVO_LEGS || joint < 0 || joint >= SERVO_JOINTS) {
      error  = "invalid_value";
      detail = F("leg 0-3 y joint 0-2 (0=coxa, 1=femur, 2=tibia)");
      return 400;
    }
    // El modulo satura al rango mecanico, pero se avisa si el panel pide de mas.
    if (angle < SERVO_MIN_ANGLE || angle > SERVO_MAX_ANGLE) {
      error  = "invalid_value";
      detail = F("angle fuera del rango mecanico del servo");
      return 400;
    }
    // angle llega como angulo LOGICO (90 = STAND del visor 3D). Convertir a PWM crudo
    // con centro y direccion del servo antes de escribir al PCA9685.
    if (!servoSetLogicalAngle((uint8_t)leg, (uint8_t)joint, (uint8_t)angle)) {
      error  = "hardware_offline";
      detail = F("no se pudo escribir en el PCA9685");
      return 503;
    }
    return 200;
  }

  // -------------------- servo avanzado (canal directo) ---------------------
  if (strcasecmp(cmd, "servo_adv") == 0) {
    if (!servosIsOnline()) {
      error  = "hardware_offline";
      detail = F("PCA9685 no responde: no se mueve ningun servo");
      return 503;
    }
    if (!value.is<JsonObject>()) {
      error  = "invalid_value";
      detail = F("value debe ser {\"channel\":0-11,\"angle\":10-170}");
      return 400;
    }
    JsonObject o = value.as<JsonObject>();
    int ch = -1, angle = -1;
    if (!variantToInt(o["channel"], ch) || !variantToInt(o["angle"], angle)) {
      error  = "invalid_value";
      detail = F("servo_adv requiere channel y angle numericos");
      return 400;
    }
    if (ch < 0 || ch >= SERVO_COUNT) {
      error  = "invalid_value";
      detail = F("channel debe estar entre 0 y 11 (4 patas x 3 articulaciones)");
      return 400;
    }
    if (angle < SERVO_MIN_ANGLE || angle > SERVO_MAX_ANGLE) {
      error  = "invalid_value";
      detail = F("angle fuera del rango mecanico del servo");
      return 400;
    }
    if (!servoSetChannel((uint8_t)ch, (uint8_t)angle)) {
      error  = "hardware_offline";
      detail = F("no se pudo escribir en el PCA9685");
      return 503;
    }
    return 200;
  }

  // -------------------- postura configurada de apoyo -----------------------
  if (strcasecmp(cmd, "servo_cal") == 0) {
    if (!servosIsOnline()) {
      error  = "hardware_offline";
      detail = F("PCA9685 no responde: no se puede calibrar");
      return 503;
    }
    servoStand();
    detail = F("postura de apoyo aplicada; ajustar centros en servos.cpp");
    return 200;
  }

  // ---------------------------- matriz NeoPixel ----------------------------
  if (strcasecmp(cmd, "led_pixel") == 0) {
    if (!neopixelIsOnline()) {
      error  = "hardware_offline";
      detail = F("matriz NeoPixel no disponible");
      return 503;
    }
    if (!value.is<JsonObject>()) {
      error  = "invalid_value";
      detail = F("value debe ser {\"x\":0-7,\"y\":0-7,\"color\":\"#RRGGBB\",\"on\":true}");
      return 400;
    }
    JsonObject o = value.as<JsonObject>();
    int x = -1, y = -1;
    if (!variantToInt(o["x"], x) || !variantToInt(o["y"], y)) {
      error  = "invalid_value";
      detail = F("led_pixel requiere x e y enteros");
      return 400;
    }
    if (x < 0 || x >= NEOPIXEL_COLS || y < 0 || y >= NEOPIXEL_ROWS) {
      error  = "invalid_value";
      detail = F("x e y deben estar entre 0 y 7");
      return 400;
    }
    // on=false apaga el pixel sin necesidad de mandar un color.
    bool on = true;
    variantToBool(o["on"], on);
    if (!on) {
      neopixelSetPixel((uint8_t)x, (uint8_t)y, 0, 0, 0);
      return 200;
    }
    uint8_t r = 0, g = 0, b = 0;
    const String color = variantToString(o["color"]);
    if (!color.length() || !hexToRgb(color, r, g, b)) {
      error  = "invalid_value";
      detail = F("color debe ser texto hexadecimal \"#RRGGBB\"");
      return 400;
    }
    neopixelSetPixel((uint8_t)x, (uint8_t)y, r, g, b);
    return 200;
  }

  if (strcasecmp(cmd, "led_fill") == 0) {
    if (!neopixelIsOnline()) {
      error  = "hardware_offline";
      detail = F("matriz NeoPixel no disponible");
      return 503;
    }
    uint8_t r = 0, g = 0, b = 0;
    if (value.is<JsonObject>()) {
      const String color = variantToString(value.as<JsonObject>()["color"]);
      if (!color.length() || !hexToRgb(color, r, g, b)) {
        error  = "invalid_value";
        detail = F("led_fill requiere {\"color\":\"#RRGGBB\"}");
        return 400;
      }
    } else {
      // Sin color se rellena del color del proyecto (verde).
      r = 0; g = 255; b = 136;
    }
    neopixelFill(r, g, b);
    return 200;
  }

  if (strcasecmp(cmd, "led_clear") == 0) {
    if (!neopixelIsOnline()) {
      error  = "hardware_offline";
      detail = F("matriz NeoPixel no disponible");
      return 503;
    }
    neopixelClear();
    return 200;
  }

  if (strcasecmp(cmd, "led_off") == 0) {
    if (!neopixelIsOnline()) {
      error  = "hardware_offline";
      detail = F("matriz NeoPixel no disponible");
      return 503;
    }
    neopixelStopPattern();
    neopixelClear();
    return 200;
  }

  // Brillo global de la matriz, en % (0-100). El modulo lo satura a
  // NEOPIXEL_MAX_BRIGHTNESS (techo de seguridad de corriente).
  if (strcasecmp(cmd, "brightness") == 0 || strcasecmp(cmd, "led_brightness") == 0) {
    if (!neopixelIsOnline()) {
      error  = "hardware_offline";
      detail = F("matriz NeoPixel no disponible");
      return 503;
    }
    int pct = -1;
    if (!variantToInt(value, pct) || pct < 0 || pct > 100) {
      error  = "invalid_value";
      detail = F("brightness requiere un entero 0-100");
      return 400;
    }
    neopixelSetBrightness((uint8_t)pct);
    return 200;
  }

  // Color plano: {"r":..,"g":..,"b":..} o "#RRGGBB".
  if (strcasecmp(cmd, "led_color") == 0) {
    if (!neopixelIsOnline()) {
      error  = "hardware_offline";
      detail = F("matriz NeoPixel no disponible");
      return 503;
    }
    uint8_t r = 0, g = 0, b = 0;
    if (value.is<JsonObject>()) {
      JsonObject o = value.as<JsonObject>();
      int cr = 0, cg = 0, cb = 0;
      variantToInt(o["r"], cr);
      variantToInt(o["g"], cg);
      variantToInt(o["b"], cb);
      if (cr < 0 || cr > 255 || cg < 0 || cg > 255 || cb < 0 || cb > 255) {
        error  = "invalid_value";
        detail = F("r, g y b deben estar entre 0 y 255");
        return 400;
      }
      r = (uint8_t)cr; g = (uint8_t)cg; b = (uint8_t)cb;
    } else {
      const String color = variantToString(value);
      if (!color.length() || !hexToRgb(color, r, g, b)) {
        error  = "invalid_value";
        detail = F("led_color requiere {\"r\":..,\"g\":..,\"b\":..} o \"#RRGGBB\"");
        return 400;
      }
    }
    neopixelFill(r, g, b);
    return 200;
  }

  // ------------------------------- auxiliares -------------------------------
  if (strcasecmp(cmd, "aux") == 0) {
    const String action = variantToString(value);
    if (robotState.emergencyStop) {
      error = "emergency_locked";
      detail = F("aux bloqueado mientras la parada de emergencia esta activa");
      return 423;
    }
    if (action == "height_up" || action == "height_down" || action == "height_reset") {
      float next = 0.0f;
      if (action != "height_reset") {
        const float delta = (action == "height_up") ? 0.25f : -0.25f;
        next = constrain(robotState.bodyZ + delta, -1.0f, 1.0f);
      }
      robotStateSetBodyZ(next);
      detail = F("altura del chasis actualizada");
      return 200;
    }
    if (action == "tilt_fwd" || action == "tilt_bwd" ||
        action == "tilt_left" || action == "tilt_right" || action == "tilt_reset") {
      float p = robotState.bodyPitch;
      float r = robotState.bodyRoll;
      // +pitch = nariz arriba (inclinar atras), -pitch = nariz abajo (inclinar adelante)
      if      (action == "tilt_fwd")   p = constrain(p - 0.35f, -1.0f, 1.0f);
      else if (action == "tilt_bwd")   p = constrain(p + 0.35f, -1.0f, 1.0f);
      else if (action == "tilt_right") r = constrain(r + 0.35f, -1.0f, 1.0f);
      else if (action == "tilt_left")  r = constrain(r - 0.35f, -1.0f, 1.0f);
      else                             { p = 0.0f; r = 0.0f; }
      robotStateSetBodyTilt(p, r);
      detail = F("inclinacion del chasis actualizada");
      return 200;
    }
    error = "invalid_value";
    detail = F("aux admite height_up/down/reset y tilt_fwd/bwd/left/right/reset");
    return 400;
  }

  // -------------------- patrones de animacion y dibujos --------------------
  if (strcasecmp(cmd, "led_pattern") == 0) {
    if (!neopixelIsOnline()) {
      error  = "hardware_offline";
      detail = F("matriz NeoPixel no disponible");
      return 503;
    }
    const String pat = variantToString(value);
    if (!pat.length()) {
      error  = "invalid_value";
      detail = F("led_pattern requiere el nombre del patron");
      return 400;
    }
    // smile/heart/arrow/spider son dibujos, no animaciones: se aceptan aqui
    // para que el panel no tenga que distinguir unos de otros.
    if (strcasecmp(pat.c_str(), "smile")  == 0 || strcasecmp(pat.c_str(), "heart") == 0 ||
        strcasecmp(pat.c_str(), "arrow")  == 0 || strcasecmp(pat.c_str(), "spider") == 0) {
      if (!neopixelDrawGlyph(pat.c_str())) {
        error  = "invalid_value";
        detail = F("dibujo desconocido (smile, heart, arrow, spider)");
        return 400;
      }
      return 200;
    }
    if (!neopixelPlayPattern(pat.c_str())) {
      error  = "invalid_value";
      detail = F("patron desconocido: SOLID, RAINBOW, PULSE, BOUNCE, CONVERGE, "
                 "SPIRAL, FIRE, WAVE, MATRIX_RAIN, TEST, CLEAR");
      return 400;
    }
    return 200;
  }

  // Matriz completa: {"matrix": [[ [r,g,b] x8 ] x8 ]}. Es lo que manda el editor
  // del panel cuando pinta un dibujo entero de golpe.
  if (strcasecmp(cmd, "led_matrix") == 0) {
    if (!neopixelIsOnline()) {
      error  = "hardware_offline";
      detail = F("matriz NeoPixel no disponible");
      return 503;
    }
    if (!value.is<JsonObject>() || !value.as<JsonObject>()["matrix"].is<JsonArray>()) {
      error  = "invalid_value";
      detail = F("led_matrix requiere {\"matrix\":[[[r,g,b]x8]x8]}");
      return 400;
    }
    JsonArray rows = value.as<JsonObject>()["matrix"].as<JsonArray>();
    static uint8_t matrix[NEOPIXEL_ROWS][NEOPIXEL_COLS][3];
    memset(matrix, 0, sizeof(matrix));
    bool ok = (rows.size() == NEOPIXEL_ROWS);
    for (uint8_t y = 0; ok && y < NEOPIXEL_ROWS; y++) {
      if (!rows[y].is<JsonArray>() || rows[y].size() != NEOPIXEL_COLS) { ok = false; break; }
      JsonArray cols = rows[y].as<JsonArray>();
      for (uint8_t x = 0; x < NEOPIXEL_COLS; x++) {
        if (!cols[x].is<JsonArray>() || cols[x].size() < 3) { ok = false; break; }
        JsonArray rgb = cols[x].as<JsonArray>();
        matrix[y][x][0] = (uint8_t)(rgb[0].as<int>() & 0xFF);
        matrix[y][x][1] = (uint8_t)(rgb[1].as<int>() & 0xFF);
        matrix[y][x][2] = (uint8_t)(rgb[2].as<int>() & 0xFF);
      }
    }
    if (!ok) {
      error  = "invalid_value";
      detail = F("la matriz debe ser de 8 filas x 8 columnas x 3 componentes");
      return 400;
    }
    neopixelDraw(matrix);
    return 200;
  }

  // -------------------- terminal del panel (texto plano) --------------------
  if (strcasecmp(cmd, "terminal") == 0) {
    String line = variantToString(value);
    line.trim();
    if (!line.length()) {
      error  = "invalid_value";
      detail = F("terminal requiere el texto del comando");
      return 400;
    }
    String lowered = line;
    lowered.toLowerCase();

    if (lowered == "stop") {
      robotStateSetMode("STAND");
      robotStateSetMove("stop");
      detail = F("terminal: stop -> STAND");
      return 200;
    }
    if (lowered.startsWith("mode ")) {
      String mode = line.substring(5);
      mode.trim();
      if (!robotStateIsValidMode(mode.c_str())) {
        error  = "invalid_value";
        detail = String(F("terminal: modo invalido. Validos: ")) + robotStateGetValidModesCsv();
        return 400;
      }
      robotStateSetMode(mode.c_str());
      detail = String(F("terminal: mode ")) + mode;
      return 200;
    }
    detail = String(F("terminal registrado: ")) + line;
    return 200;
  }

  // Ningun modulo queda pendiente: todos los comandos del panel estan
  // implementados. Un comando desconocido es eso, no un modulo a medias.
  error  = "unknown_cmd";
  detail = String(F("comando desconocido: ")) + cmd;
  return 400;
}
// ----------------------------------------------------------------------------
// Handlers HTTP
// ----------------------------------------------------------------------------
static const char WEB_HELP_TEXT[] =
  "ARANA-ROBOT (ESP32-S3) - API REST\n"
  "\n"
  "GET  /api/status              estado completo (JSON)\n"
  "GET  /api/ping                latido minúsculo + uptime (para el monitor)\n"
  "GET  /api/imu                 actitud del IMU sola (ligero, para el cubo 3D)\n"
  "GET  /api/mando/config        perfil del mando fisico (lo baja el mando)\n"
  "POST /api/mando/config        guarda el perfil en NVS y sube version\n"
  "POST /api/mando/reset         restaura el perfil por defecto\n"
  "POST /api/command             {\"cmd\":\"...\",\"value\":...}\n"
  "\n"
  "Implementados: mode, move, joystick, rotate, speed, body, emergency,\n"
  "               stabilize, buzzer, buzzer_stop, headlight, reset, aux,\n"
  "               terminal, servo, servo_adv, servo_cal, led_pixel, led_fill,\n"
  "               led_clear, led_matrix, led_pattern, led_off, led_color,\n"
  "               brightness, led_brightness\n"
  "\n"
  "Los comandos de servo/LED responden 503 si el modulo no esta conectado\n"
  "(PCA9685 o NeoPixel), y 400 si los valores estan fuera de rango.\n";

static void handleRoot(AsyncWebServerRequest* request) {
  s_requests++; s_lastRequestMs = millis();
  AsyncWebServerResponse* response = request->beginResponse(200, "text/plain", WEB_HELP_TEXT);
  addCorsHeaders(response);
  request->send(response);
}

// ---------------------------------------------------------------------------
// /api/status ligero: versión reducida para polling frecuente del panel.
// No incluye la lista de estaciones WiFi (que es cara) ni detalles de sensores
// que no cambian rápido. Se usa cuando el panel solo necesita telemetría básica.
// ---------------------------------------------------------------------------
static String buildStatusJsonLight() {
  JsonDocument doc;
  doc["mode"]           = robotState.mode;
  doc["speed"]          = robotState.speed;
  doc["emergency_stop"] = robotState.emergencyStop;
  doc["stabilize"]      = robotState.stabilize;
  doc["move"]           = robotState.move;

  JsonObject joy = doc["joystick"].to<JsonObject>();
  joy["x"] = robotState.joyX;
  joy["y"] = robotState.joyY;
  doc["rotate"] = robotState.rotate;

  JsonObject link = doc["link"].to<JsonObject>();
  link["ap"]       = wifiIsApActive();
  link["status"]   = wifiGetStatusStr();
  link["clients"]  = wifiGetStations();
  link["ip"]       = wifiGetIp().toString();
  link["robot_ip"] = wifiGetAnyIp().toString();
  link["uptime_s"] = wifiGetUptimeS();

  String out;
  serializeJson(doc, out);
  return out;
}

static void handleStatus(AsyncWebServerRequest* request) {
  s_requests++; s_lastRequestMs = millis();
  // Si el cliente pide la versión light (header X-Light-Status: 1), usamos el JSON reducido.
  const bool light = request->hasHeader("X-Light-Status") &&
                     request->getHeader("X-Light-Status")->value() == "1";
  String body = light ? buildStatusJsonLight() : buildStatusJson();
  AsyncWebServerResponse* response = request->beginResponse(200, "application/json", body);
  addCorsHeaders(response);
  request->send(response);
}

// ----------------------------------------------------------------------------
// GET /api/ping - latido minúsculo para el monitor de conexión del PC (~25 B).
//
// buildStatusJson() arma un JSON de ~1,8 KB y consulta el estado de los clientes
// WiFi; la lista MAC/RSSI se cachea por 5 s en wifiGetStationsList() para no
// repetir esa llamada al driver en cada sondeo de estado. /api/ping queda como
// comprobación ligera del enlace cuando el monitor necesita distinguir una
// telemetría lenta de una desconexión real.
// ----------------------------------------------------------------------------
static void handlePing(AsyncWebServerRequest* request) {
  s_requests++; s_lastRequestMs = millis();
  char buf[64];
  const int n = snprintf(buf, sizeof(buf), "{\"ok\":true,\"up\":%lu}",
                         (unsigned long)(millis() / 1000));
  AsyncWebServerResponse* response = request->beginResponse(200, "application/json", String(buf, n));
  addCorsHeaders(response);
  request->send(response);
}

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// GET /api/imu - actitud SOLO, minúscula (~120 bytes).
//
// Por qué existe: /api/status pesa ~1,8 KB y tarda en armarse (recorre todos los
// sensores), así que el panel lo consulta cada 500 ms y el cubo 3D del IMU
// "saltaba" medio segundo entre valor y valor, aunque el muestreo real del
// MPU6050 es de 100 Hz. Este endpoint devuelve solo lo que dibuja el cubo
// (actitud + velocidad angular) para poder consultarlo varias veces por segundo
// sin cargarle al ESP32 el JSON de sensores entero.
// ----------------------------------------------------------------------------
static void handleImuFast(AsyncWebServerRequest* request) {
  s_requests++; s_lastRequestMs = millis();
  if (!imuIsOnline()) {
    AsyncWebServerResponse* response = request->beginResponse(503, "application/json", F("{\"online\":false}"));
    addCorsHeaders(response);
    request->send(response);
    return;
  }
  // Escala de +-250 °/s del MPU6050: 131.0 LSB por grado/segundo.
  const float gxDps = imuGetGx() / 131.0f;
  const float gyDps = imuGetGy() / 131.0f;
  const float gzDps = imuGetGz() / 131.0f;

  char buf[192];
  const int n = snprintf(buf, sizeof(buf),
    "{\"online\":true,\"pitch\":%.2f,\"roll\":%.2f,\"yaw\":%.2f,"
    "\"gx\":%.1f,\"gy\":%.1f,\"gz\":%.1f,\"temp\":%.1f}",
    imuGetPitch(), imuGetRoll(), imuGetYaw(), gxDps, gyDps, gzDps, imuGetTempC());
  AsyncWebServerResponse* response = request->beginResponse(200, "application/json", String(buf, n));
  addCorsHeaders(response);
  request->send(response);
}

// Endpoint ultraligero para espejar postura calibrada + angulos PWM fisicos + centros NVS
static void handleServosFast(AsyncWebServerRequest* request) {
  s_requests++; s_lastRequestMs = millis();
  char buf[540];
  const int n = snprintf(buf, sizeof(buf),
    "{\"connected\":true,\"online\":%s,\"calibrated\":%s,\"mode\":\"%s\",\"boot_source\":\"%s\","
    "\"servos\":[[%u,%u,%u],[%u,%u,%u],[%u,%u,%u],[%u,%u,%u]],"
    "\"raw_servos\":[[%u,%u,%u],[%u,%u,%u],[%u,%u,%u],[%u,%u,%u]],"
    "\"centers\":[[%u,%u,%u],[%u,%u,%u],[%u,%u,%u],[%u,%u,%u]],"
    "\"dirs\":[[%d,%d,%d],[%d,%d,%d],[%d,%d,%d],[%d,%d,%d]]}",
    servosIsOnline() ? "true" : "false",
    servosAreCalibrated() ? "true" : "false",
    robotState.mode.c_str(),
    servosGetBootSource(),
    servoGetAngle(0,0), servoGetAngle(0,1), servoGetAngle(0,2),
    servoGetAngle(1,0), servoGetAngle(1,1), servoGetAngle(1,2),
    servoGetAngle(2,0), servoGetAngle(2,1), servoGetAngle(2,2),
    servoGetAngle(3,0), servoGetAngle(3,1), servoGetAngle(3,2),
    servoGetRawAngle(0,0), servoGetRawAngle(0,1), servoGetRawAngle(0,2),
    servoGetRawAngle(1,0), servoGetRawAngle(1,1), servoGetRawAngle(1,2),
    servoGetRawAngle(2,0), servoGetRawAngle(2,1), servoGetRawAngle(2,2),
    servoGetRawAngle(3,0), servoGetRawAngle(3,1), servoGetRawAngle(3,2),
    servoGetCenterAngle(0,0), servoGetCenterAngle(0,1), servoGetCenterAngle(0,2),
    servoGetCenterAngle(1,0), servoGetCenterAngle(1,1), servoGetCenterAngle(1,2),
    servoGetCenterAngle(2,0), servoGetCenterAngle(2,1), servoGetCenterAngle(2,2),
    servoGetCenterAngle(3,0), servoGetCenterAngle(3,1), servoGetCenterAngle(3,2),
    (int)servoGetDir(0,0), (int)servoGetDir(0,1), (int)servoGetDir(0,2),
    (int)servoGetDir(1,0), (int)servoGetDir(1,1), (int)servoGetDir(1,2),
    (int)servoGetDir(2,0), (int)servoGetDir(2,1), (int)servoGetDir(2,2),
    (int)servoGetDir(3,0), (int)servoGetDir(3,1), (int)servoGetDir(3,2));
  AsyncWebServerResponse* response = request->beginResponse(200, "application/json", String(buf, n));
  addCorsHeaders(response);
  request->send(response);
}

// Calibracion interactiva de postura inicial STAND y polaridad por servo (guardada en NVS)
static void handleServosCalibrate(AsyncWebServerRequest* request) {
  s_requests++; s_lastRequestMs = millis();
  const String body = takeBody(request);
  JsonDocument doc;
  if (deserializeJson(doc, body) != DeserializationError::Ok) {
    sendJson(request, 400, F("{\"ok\":false,\"error\":\"json_invalido\"}"));
    return;
  }
  const char* act = doc["action"] | "";
  if (strcasecmp(act, "preview") == 0) {
    const int leg = doc["leg"] | -1;
    const int jnt = doc["joint"] | -1;
    const int ang = doc["angle"] | 90;
    if (leg < 0 || leg >= SERVO_LEGS || jnt < 0 || jnt >= SERVO_JOINTS) {
      sendJson(request, 400, F("{\"ok\":false,\"error\":\"leg_o_joint_invalido\"}"));
      return;
    }
    robotStateSetMode("STAND");
    servoSetAngle((uint8_t)leg, (uint8_t)jnt, (uint8_t)constrain(ang, SERVO_MIN_ANGLE, SERVO_MAX_ANGLE));
    sendJson(request, 200, F("{\"ok\":true,\"action\":\"preview\"}"));
    return;
  }
  if (strcasecmp(act, "save_stand") == 0) {
    servoSaveCurrentAsStand();
    robotStateSetMode("STAND");
    sendJson(request, 200, F("{\"ok\":true,\"action\":\"save_stand\",\"detail\":\"Postura STAND guardada en NVS\"}"));
    return;
  }
  if (strcasecmp(act, "center_90") == 0) {
    robotStateSetMode("STAND");
    servoCenterRaw90();
    sendJson(request, 200, F("{\"ok\":true,\"action\":\"center_90\",\"detail\":\"12 servos centrados a 90 deg puros para armar horns\"}"));
    return;
  }
  if (strcasecmp(act, "set_dir") == 0) {
    const int leg = doc["leg"] | -1;
    const int jnt = doc["joint"] | -1;
    const int dir = doc["dir"] | 1;
    if (leg < 0 || leg >= SERVO_LEGS || jnt < 0 || jnt >= SERVO_JOINTS) {
      sendJson(request, 400, F("{\"ok\":false,\"error\":\"leg_o_joint_invalido\"}"));
      return;
    }
    servoSetDir((uint8_t)leg, (uint8_t)jnt, dir < 0 ? -1 : 1);
    sendJson(request, 200, F("{\"ok\":true,\"action\":\"set_dir\"}"));
    return;
  }
  if (strcasecmp(act, "reset") == 0) {
    robotStateSetMode("STAND");
    servoResetTrims();
    sendJson(request, 200, F("{\"ok\":true,\"action\":\"reset\",\"detail\":\"Calibracion reiniciada a 90 deg\"}"));
    return;
  }
  sendJson(request, 400, F("{\"ok\":false,\"error\":\"accion_desconocida\"}"));
}

// Acumula los trozos del body de ESTA peticion en su propia ranura.
static void handleCommandBody(AsyncWebServerRequest* request, uint8_t* data, size_t len,
                              size_t index, size_t total) {
  // Tope duro por peticion: si el body completo excede el maximo se descarta el
  // trozo (y con el, el body entero). Asi un cliente no agota la memoria del
  // ESP32 aunque mande un POST gigante.
  if (total > WEB_MAX_BODY_BYTES) return;

  uint8_t slot = WEB_MAX_BODY_SLOTS;
  for (uint8_t i = 0; i < WEB_MAX_BODY_SLOTS; i++) {
    if (s_bodyOwner[i] == request) { slot = i; break; }
  }
  if (slot == WEB_MAX_BODY_SLOTS) {           // peticion nueva: toma la mas antigua
    slot = s_bodyNext;
    s_bodyNext = (uint8_t)((s_bodyNext + 1) % WEB_MAX_BODY_SLOTS);
    s_body[slot] = "";
    s_bodyOwner[slot] = request;
  }
  if (index == 0 && s_body[slot].length() > 0) s_body[slot] = "";

  if (s_body[slot].length() + len > WEB_MAX_BODY_BYTES) return;
  s_body[slot].concat((const char*)data, len);
}

// Fuente del comando: header "X-Arana-Source: mando" o campo "source" del JSON.
static const char* requestSource(AsyncWebServerRequest* request, JsonVariant sourceField) {
  if (request->hasHeader("X-Arana-Source")) {
    const String& header = request->header("X-Arana-Source");
    if (header.equalsIgnoreCase("mando")) return "mando";
    return "pc";
  }
  const String field = variantToString(sourceField);
  if (field.equalsIgnoreCase("mando")) return "mando";
  return "pc";
}

static void handleCommand(AsyncWebServerRequest* request) {
  s_requests++; s_lastRequestMs = millis();
  String body = takeBody(request);
  if (!body.length()) {
    s_errors++;
    sendJson(request, 400, jsonError("bad_request", "falta el body JSON"));
    return;
  }
  if (body.length() > WEB_MAX_BODY_BYTES) {
    s_errors++;
    sendJson(request, 413, jsonError("payload_too_large", "body demasiado grande"));
    return;
  }
  JsonDocument doc;
  const DeserializationError err = deserializeJson(doc, body);
  if (err) {
    s_errors++;
    sendJson(request, 400, jsonError("invalid_json", err.c_str()));
    return;
  }
  const String cmd = variantToString(doc["cmd"]);
  if (!cmd.length()) {
    s_errors++;
    sendJson(request, 400, jsonError("bad_request", "falta el campo cmd"));
    return;
  }
  const char* source = requestSource(request, doc["source"]);
  if (request->client()) ipToStr(request->client()->remoteIP(), s_lastClientIp);
  if (strcmp(source, "mando") == 0) {
    registerMandoRequest(request);
    s_mandoCommands++;
  }
  const char* error  = nullptr;
  String detail;
  const int code = applyCommand(cmd.c_str(), doc["value"], error, detail);
  if (code == 200) {
    robotStateNotifyCommand(cmd.c_str(), source);
    sendJson(request, 200, statusJson(cmd.c_str()));
  } else {
    s_errors++;
    sendJson(request, code, jsonError(error ? error : "error", detail.c_str()));
  }
}

static void handleMandoConfigGet(AsyncWebServerRequest* request) {
  s_requests++; s_lastRequestMs = millis();
  registerMandoRequest(request);
  s_mandoFetches++;
  request->send(200, "application/json", mandoProfileToJson());
}

static void handleMandoConfigPost(AsyncWebServerRequest* request) {
  s_requests++; s_lastRequestMs = millis();
  const String body = takeBody(request);
  if (!body.length()) {
    s_errors++;
    sendJson(request, 400, jsonError("bad_request", "falta el body JSON"));
    return;
  }
  const char* err = mandoProfileFromJson(body);
  if (err) {
    s_errors++;
    sendJson(request, 400, jsonError("invalid_value", err));
    return;
  }
  robotStateNotifyCommand("mando_config", "pc");
  sendJson(request, 200, String(F("{\"status\":\"ok\",\"version\":")) + String(mandoProfileGetVersion()) + "}");
}

static void handleMandoReset(AsyncWebServerRequest* request) {
  s_requests++; s_lastRequestMs = millis();
  mandoProfileReset();
  robotStateNotifyCommand("mando_reset", "pc");
  sendJson(request, 200, String(F("{\"status\":\"ok\",\"version\":")) + String(mandoProfileGetVersion()) + "}");
}

// ----------------------------------------------------------------------------
// API pública
// ----------------------------------------------------------------------------
void webserverInit() {
  // --- Opciones del servidor para estabilidad bajo carga del panel web ---
  // AsyncWebServer no expone setMaxClients directamente en todas las versiones,
  // pero podemos limitar el cuerpo y usar timeouts razonables.
  s_server.on("/", HTTP_GET, handleRoot);
  s_server.on("/api/status", HTTP_GET, handleStatus);
  s_server.on("/api/ping", HTTP_GET, handlePing);
  s_server.on("/api/imu", HTTP_GET, handleImuFast);
  s_server.on("/api/servos", HTTP_GET, handleServosFast);
  s_server.on("/api/servos/calibrate", HTTP_POST, handleServosCalibrate, nullptr, handleCommandBody);
  s_server.on("/api/command", HTTP_POST, handleCommand, nullptr, handleCommandBody);
  s_server.on("/api/mando/config", HTTP_GET, handleMandoConfigGet);
  s_server.on("/api/mando/config", HTTP_POST, handleMandoConfigPost, nullptr, handleCommandBody);
  s_server.on("/api/mando/reset", HTTP_POST, handleMandoReset);
  // Preflight CORS para navegadores que consumen la API desde otro origen
  s_server.on("/api/status", HTTP_OPTIONS, [](AsyncWebServerRequest* request) { sendOkCors(request); });
  s_server.on("/api/ping", HTTP_OPTIONS, [](AsyncWebServerRequest* request) { sendOkCors(request); });
  s_server.on("/api/imu", HTTP_OPTIONS, [](AsyncWebServerRequest* request) { sendOkCors(request); });
  s_server.on("/api/servos", HTTP_OPTIONS, [](AsyncWebServerRequest* request) { sendOkCors(request); });
  s_server.on("/api/command", HTTP_OPTIONS, [](AsyncWebServerRequest* request) { sendOkCors(request); });
  s_server.onNotFound([](AsyncWebServerRequest* request) {
    s_errors++;
    AsyncWebServerResponse* response = request->beginResponse(404, "application/json",
                                                              jsonError("not_found", "ruta inexistente; ver GET /"));
    addCorsHeaders(response);
    request->send(response);
  });

  s_server.begin();
  s_lastReportMs = millis();

  Serial.printf("[WEB] servidor HTTP listo en http://%s:%d (GET / para ayuda) | CORS habilitado\n",
                wifiGetIp().toString().c_str(), HTTP_PORT);
}

void webserverUpdate() {

  const uint32_t now = millis();

#if WIFI_STA_ENABLED
  // --- Auto-recuperacion del enlace zombi -------------------------------------
  // Si seguimos asociados al hotspot pero no entra NINGUNA peticion HTTP, el
  // enlace esta muerto: el driver sigue diciendo "conectado" pero el trafico no
  // pasa, y el panel se queda en DEMO sin poder ni hacer ping. Es lo que pasaba
  // con esta placa y el hotspot de la PC a los pocos segundos. wifiUpdate() no
  // lo puede arreglar (para el driver todo esta bien), asi que se fuerza aqui
  // una reconexion. Ver AUTO_RECONNECT_* en config.h.
  if (s_lastRequestMs != 0) {
    const uint32_t silence = now - s_lastRequestMs;
    const uint32_t gap     = now - s_lastReconnectMs;
    // Si el silencio es muy largo (panel cerrado) se esmera mas: no tiene
    // sentido reconectar cada 30 s si no hay nadie preguntando nada.
    const uint32_t threshold = (silence > AUTO_RECONNECT_IDLE_MS / 2)
                             ? AUTO_RECONNECT_IDLE_MS
                             : AUTO_RECONNECT_SILENCE_MS;
    if (silence > threshold && gap > AUTO_RECONNECT_MIN_GAP_MS) {
      s_lastReconnectMs = now;
      wifiStaReconnect();
    }
  }
#endif

  if ((now - s_lastReportMs) < WEB_REPORT_MS) return;
  s_lastReportMs = now;

  if (s_requests == 0) return;   // no ensuciar el monitor si no hubo tráfico
  Serial.printf("[WEB] %lu requests | %lu errores | clientes=%u | uptime=%lu s | ultimo comando: %s (%s)\n",
                (unsigned long)s_requests, (unsigned long)s_errors, wifiGetStations(),
                (unsigned long)wifiGetUptimeS(),
                robotState.lastCommand[0] ? robotState.lastCommand : "-",
                robotState.lastSource);
}

uint32_t webserverGetRequestCount() { return s_requests; }
uint32_t webserverGetErrorCount()   { return s_errors; }

// ==========================================================================
//  [29] PROGRAMA PRINCIPAL · setup() y loop()
//  fuente: arana_robot.ino
// ==========================================================================

// ----------------------------------------------------------------------------
// Módulos completos (todos implementados)
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Estado global del robot
// Vive en el módulo robot_state.{h,cpp}: mode, speed, emergency_stop, move,
// joystick{x,y}, rotate, body{z}, diagnóstico del último comando y watchdog
// (failsafe) que vuelve a STAND si se pierde el enlace con la PC o con el mando.
// Acá solo se usa la instancia global robotState.
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Consola de prueba por Monitor Serie
// (útil para probar el buzzer hasta que exista el webserver)
// ----------------------------------------------------------------------------
static void printBuzzerHelp() {
  Serial.println(F("  Comandos de prueba del Buzzer:"));
  Serial.println(F("    beep | siren | alarm | rise | fall | stop"));
  Serial.println(F("    tone <freq> <dur_ms> <vol>   (CUSTOM, ej: tone 880 500 70)"));
  Serial.println(F("  Comandos de prueba del IMU (MPU6050):"));
  Serial.println(F("    imu     -> dump de lecturas (pitch/roll/yaw, accel, gyro, temp)"));
  Serial.println(F("    imucal  -> recalibrar giroscopio (~1 s, robot QUIETO)"));
  Serial.println(F("    i2cscan -> escanear bus I2C (diagnóstico si el MPU no responde)"));
  Serial.println(F("  Comandos de prueba de las Luces (Headlights):"));
  Serial.println(F("    luces on  -> encender linterna"));
  Serial.println(F("    luces off -> apagar linterna"));
  Serial.println(F("    luces <brillo> -> ajustar brillo 0-255"));
  Serial.println(F("  Sensores nuevos:"));
  Serial.println(F("    gps         -> estado del GPS (online/fix/satelites) y posicion"));
  Serial.println(F("    bat         -> tension y porcentaje de la bateria (si esta habilitado)"));
  Serial.println(F("  Perfil del mando fisico (NVS):"));
  Serial.println(F("    mando       -> muestra el perfil actual"));
  Serial.println(F("    mando reset -> restaura el perfil por defecto"));
  Serial.println(F("    net     -> estado del AP y de los clientes (IP, uptime, requests)"));
  Serial.println(F("    wifiscan-> escanear redes desde el ESP32 (¡corta el AP un momento!)"));
  Serial.println(F("    status  -> estado global + watchdog + ultimo comando recibido"));
  Serial.println(F("    help    -> esta ayuda"));
  Serial.println(F("  API: GET http://192.168.4.1/api/status | POST /api/command {\"cmd\":..,\"value\":..}"));
}

// Dump de una lectura completa del IMU (los mismos campos que publicará
// /api/status -> sensors.imu para el panel PC).
static void printImuDump() {
  if (!imuIsOnline()) {
    Serial.println(F("[IMU] OFFLINE (verificar cableado I2C SDA=8 SCL=9)"));
    return;
  }
  const float axg = imuGetAx() / 16384.0f;
  const float ayg = imuGetAy() / 16384.0f;
  const float azg = imuGetAz() / 16384.0f;
  const float gxDps = imuGetGx() / 131.0f;
  const float gyDps = imuGetGy() / 131.0f;
  const float gzDps = imuGetGz() / 131.0f;

  Serial.printf("[IMU] pitch=%.2f roll=%.2f yaw=%.2f deg\n",
                imuGetPitch(), imuGetRoll(), imuGetYaw());
  Serial.printf("[IMU] accel G -> x=%.2f y=%.2f z=%.2f |a|=%.3f\n",
                axg, ayg, azg,
                sqrtf(axg * axg + ayg * ayg + azg * azg));
  Serial.printf("[IMU] gyro °/s -> x=%.1f y=%.1f z=%.1f\n", gxDps, gyDps, gzDps);
  Serial.printf("[IMU] temp=%.1f°C\n", imuGetTempC());
}

// Ayuda de los modulos completados (servos, NeoPixel y sensores).
static void printModuleHelp() {
  Serial.println(F("  Sensores de distancia y linea:"));
  Serial.println(F("    radar   -> distancia del HC-SR04 (cm)"));
  Serial.println(F("    ir      -> lectura cruda del TCRT5000 (0-4095)"));
  Serial.println(F("    aht     -> temperatura y humedad del AHT10 (I2C 0x38)"));
  Serial.println(F("  Servos (PCA9685) y marcha:"));
  Serial.println(F("    servos            -> angulo actual de las 12 articulaciones"));
  Serial.println(F("    servo <p> <a> <g> -> posiciona (pata 0-3, art 0-2, grados)"));
  Serial.println(F("    neutro            -> las 12 articulaciones a 90 grados"));
  Serial.println(F("  Matriz NeoPixel 8x8:"));
  Serial.println(F("    led <patron> -> SOLID, RAINBOW, PULSE, BOUNCE, CONVERGE,"));
  Serial.println(F("                     SPIRAL, FIRE, WAVE, MATRIX_RAIN, TEST, CLEAR"));
  Serial.println(F("    glyph <nombre> -> smile, heart, arrow, spider"));
  Serial.println(F("    brillo <0-100> -> brillo global (techo 80% por seguridad)"));
  Serial.println(F("    ledoff         -> apagar la matriz"));
}

static void handleSerialConsole() {
  if (!Serial.available()) return;

  String line = Serial.readStringUntil('\n');
  line.trim();
  line.toLowerCase();
  if (line.length() == 0) return;

  // Presets = mismos parámetros que BUZZER_PRESETS del panel web (index.html)
  if      (line == "beep")  { buzzerPlay("BEEP",  880, 1000, "square",   70); }
  else if (line == "siren") { buzzerPlay("SIREN", 600, 3000, "sawtooth", 60); }
  else if (line == "alarm") { buzzerPlay("ALARM", 440, 3000, "square",   80); }
  else if (line == "rise")  { buzzerPlay("RISE",  300, 3000, "sine",     70); }
  else if (line == "fall")  { buzzerPlay("FALL", 1200, 3000, "triangle", 70); }
  else if (line == "stop")  { buzzerStop(); }
  else if (line == "imu")   { printImuDump(); }
  else if (line == "imucal") {
    if (imuRecalibrate()) Serial.println(F("[IMU] recalibración OK"));
  }
  else if (line == "i2cscan") {
    // Escáner I2C: barre 0x01..0x7E en el bus compartido (SDA=8 SCL=9).
    // AD0 del MPU puede seleccionar 0x68 o 0x69; 0x70 no es una dirección.
    Serial.println(F("[I2C] escaneando bus (SDA=GPIO8 SCL=GPIO9)..."));
    uint8_t found = 0;
    uint8_t mpuAddr = 0;
    for (uint8_t addr = 1; addr < 127; addr++) {
      Wire.beginTransmission(addr);
      if (Wire.endTransmission() == 0) {
        const char* label = "";
        if (addr == 0x68 || addr == 0x69) {
          label = "  <- posible MPU (AD0)";
          if (addr == MPU6050_I2C_ADDR || mpuAddr == 0) mpuAddr = addr;
        } else if (addr == PCA9685_I2C_ADDR) {
          label = "  <- PCA9685";
        } else if (addr == AHT10_I2C_ADDR) {
          label = "  <- AHT10";
        }
        Serial.printf("[I2C] dispositivo responde en 0x%02X%s\n", addr, label);
        found++;
      }
    }
    if (found == 0) {
      Serial.println(F("[I2C] NINGUN dispositivo responde -> revisar cables, GND comun y pull-ups"));
      return;
    }
    Serial.printf("[I2C] %u dispositivo(s) encontrado(s)\n", found);

    if (mpuAddr == 0) {
      Serial.println(F("[I2C] No se detecto MPU en 0x68/0x69; revisar SDA/SCL, alimentacion y GND."));
      return;
    }

    // --- Diagnóstico profundo del MPU en la dirección que respondió ---
    // 1) WHO_AM_I (registro 0x75): en MPU6050 suele devolver 0x68.
    //    Se lee 5 veces (re-direccionando el puntero cada vez) para descartar
    //    errores puntuales de lectura. Solo cuenta el PRIMER byte de cada ráfaga.
    uint8_t e = 0;
    Serial.print(F("[I2C] WHO_AM_I x5 ="));
    for (int t = 0; t < 5; t++) {
      Wire.beginTransmission(mpuAddr);
      Wire.write((uint8_t)0x75);                       // fijar puntero en WHO_AM_I
      e = Wire.endTransmission(false);                 // repeated start
      Wire.requestFrom(mpuAddr, (uint8_t)1);
      if (e == 0 && Wire.available()) {
        Serial.printf(" 0x%02X", Wire.read());
      } else {
        Serial.print(F(" ERR"));
      }
      delay(10);
    }
    Serial.println(F("  (WHO_AM_I identifica el chip; no es la direccion I2C)"));

    // 2) Lectura cruda de 14 bytes desde ACCEL_OUT (0x3B): accel+gyro+temp.
    Wire.beginTransmission(mpuAddr);
    Wire.write(0x3B);
    e = Wire.endTransmission(false);
    Wire.requestFrom(mpuAddr, (uint8_t)14);
    const bool rawReadOk = e == 0 && Wire.available() >= 14;
    if (rawReadOk) {
      int16_t r[7];
      for (int i = 0; i < 7; i++) r[i] = (int16_t)((Wire.read() << 8) | Wire.read());
      Serial.printf("[I2C] ACCEL_OUT crudo: ax=%d ay=%d az=%d | temp=%d (az~16384=1g)\n",
                    r[0], r[1], r[2], r[6]);
    } else {
      Serial.printf("[I2C] lectura 0x3B falló: endTransmission=%u bytes=%d\n",
                    e, Wire.available());
    }

    // 3) La IMU del firmware usa lecturas directas por Wire; no depende de
    //    Adafruit_MPU6050.begin() ni del valor exacto que esa librería acepte.
    Serial.printf("[I2C] Lectura directa de registros en 0x%02X -> %s\n",
                  mpuAddr, rawReadOk ? "OK" : "FALLA");
  }
  else if (line == "status") {
    Serial.printf("[STATE] mode=%s speed=%u emg=%s stabilize=%s | move=%s joy=%.2f/%.2f rot=%.2f body=%.2f\n",
                  robotState.mode.c_str(), (unsigned)robotState.speed,
                  robotState.emergencyStop ? "ON" : "OFF",
                  robotState.stabilize ? "ON" : "OFF",
                  robotState.move.c_str(), robotState.joyX, robotState.joyY,
                  robotState.rotate, robotState.bodyZ);
    Serial.printf("[STATE] buzzer=%s online=%d | imu=%s online=%d | cmd#%lu=%s (%s) age=%lu ms | watchdog=%lu\n",
                  buzzerGetState(), buzzerIsOnline() ? 1 : 0,
                  imuIsOnline() ? "ready" : "offline", imuIsOnline() ? 1 : 0,
                  (unsigned long)robotState.commandsTotal,
                  robotState.lastCommand[0] ? robotState.lastCommand : "-",
                  robotState.lastSource,
                  robotState.lastCommandMs ? (unsigned long)(millis() - robotState.lastCommandMs) : 0UL,
                  (unsigned long)robotState.watchdogTrips);
  }
  else if (line == "gps") {
    Serial.printf("[GPS] online=%d fix=%d sats=%u hdop=%.1f tramas=%lu\n",
                  gpsIsOnline() ? 1 : 0, gpsHasFix() ? 1 : 0, gpsGetSats(),
                  gpsGetHdop(), (unsigned long)gpsGetSentences());
    if (gpsHasFix()) {
      Serial.printf("[GPS] lat=%.6f lon=%.6f | alt=%.1f m | vel=%.2f km/h | rumbo=%.0f | utc=%s\n",
                    gpsGetLat(), gpsGetLon(), gpsGetAltM(), gpsGetSpeedKmh(),
                    gpsGetCourse(), gpsGetUtc());
    } else {
      Serial.println(F("[GPS] sin fix: llevar el modulo a cielo abierto (puede tardar 30-60 s)"));
    }
  }
  else if (line == "bat") {
    if (!batteryIsEnabled()) {
      Serial.println(F("[BAT] medicion deshabilitada (config.h: BATTERY_SENSE_ENABLED=false)"));
    } else {
      Serial.printf("[BAT] %.2f V | %u%% | raw=%u | online=%d\n",
                    batteryGetVolts(), batteryGetPercent(), batteryGetRaw(),
                    batteryIsOnline() ? 1 : 0);
    }
  }
  else if (line == "mando") {
    const MandoProfileData& p = mandoProfileGet();
    Serial.printf("[MANDO] perfil v%lu | deadzone=%.2f ema=%.2f hb=%u ms rate=%u Hz modo=%s body=%.2f\n",
                  (unsigned long)mandoProfileGetVersion(), p.deadzone, p.emaAlpha,
                  (unsigned)p.heartbeatMs, (unsigned)p.sendRateHz, p.modeButton, p.bodyStep);
    Serial.printf("[MANDO] invert_x=%d invert_y=%d pot=%u-%u speed=%u-%u led=%u%% buzzer=%d\n",
                  p.invertX ? 1 : 0, p.invertY ? 1 : 0, p.potMin, p.potMax,
                  p.speedMin, p.speedMax, p.ledBrightness, p.buzzer ? 1 : 0);
    Serial.println(F("[MANDO] se edita desde el panel web (apartado Mando) o POST /api/mando/config"));
  }
  else if (line == "mando reset") {
    mandoProfileReset();
  }
  else if (line == "wifiscan") {
    // OJO: WiFi.scanNetworks() cambia el modo de radio y TUMBA el AP.
    // Por eso, al terminar, se vuelve a crear el AP (wifiInit()).
    wifiScanTest();
    Serial.println(F("[WIFI] recreando el AP tras el escaneo..."));
    wifiInit();
  }
  else if (line == "sta off") {
    wifiStaStop();
  }
  else if (line == "sta on") {
    wifiStaStart();
  }
  else if (line == "sta") {
    Serial.printf("[WIFI] STA activo=%d | conectado=%d | ssid=%s | ip=%s | rssi=%d\n",
                  wifiStaIsRunning() ? 1 : 0, wifiStaIsConnected() ? 1 : 0,
                  wifiStaGetSsid(), wifiStaGetIp().toString().c_str(),
                  (int)wifiStaGetRssi());
  }
  else if (line == "net") {
    Serial.printf("[NET] AP=%s ssid=%s ip=%s canal=%d clientes=%u uptime=%lu s\n",
                  wifiGetStatusStr(), WIFI_SSID, wifiGetIp().toString().c_str(),
                  WIFI_CHANNEL, wifiGetStations(), (unsigned long)wifiGetUptimeS());
    Serial.printf("[NET] STA=%s ssid=%s ip=%s rssi=%d | IP util=%s\n",
                  wifiStaIsConnected() ? "conectado" : "sin conexion",
                  wifiStaGetSsid(), wifiStaGetIp().toString().c_str(),
                  (int)wifiStaGetRssi(), wifiGetAnyIp().toString().c_str());
    Serial.printf("[NET] HTTP puerto=%d requests=%lu errores=%lu | API: /api/status y /api/command\n",
                  HTTP_PORT, (unsigned long)webserverGetRequestCount(),
                  (unsigned long)webserverGetErrorCount());
  }
  else if (line.startsWith("tone ")) {
    // Formato: tone <freq> <dur_ms> <vol>
    String rest = line.substring(5);
    const int p1 = rest.indexOf(' ');
    const int p2 = rest.indexOf(' ', p1 + 1);
    if (p1 > 0 && p2 > p1) {
      const uint16_t f = (uint16_t)rest.substring(0, p1).toInt();
      const uint16_t d = (uint16_t)rest.substring(p1 + 1, p2).toInt();
      const uint8_t  v = (uint8_t)rest.substring(p2 + 1).toInt();
      buzzerPlay("CUSTOM", f, d, "square", v);
    } else {
      Serial.println(F("[CONSOLE] Uso: tone <freq> <dur_ms> <vol>"));
    }
  }
    else if (line == "help" || line == "?") { printBuzzerHelp(); }
  else if (line == "luces on") {
    ledsOn();
    Serial.printf("[LED] Linterna ON | brillo=%d\n", ledsGetBrightness());
  }
  else if (line == "luces off") {
    ledsOff();
    Serial.println(F("[LED] Linterna OFF"));
  }
  else if (line.startsWith("luces ")) {
    String valStr = line.substring(6);
    int val = valStr.toInt();
    if (valStr.length() > 0 && val >= 0 && val <= 255) {
      ledsSetBrightness((uint8_t)val);
      if (ledsGetState()) {
        Serial.printf("[LED] Brillo ajustado a %d\n", val);
      } else {
        ledsOn();
        Serial.printf("[LED] Linterna ON | brillo=%d\n", val);
      }
    } else {
      Serial.println(F("[CONSOLE] Uso: luces <brillo> (0-255)"));
    }
  }
  // ------------------- sensores nuevos -------------------
  else if (line == "radar") {
    Serial.printf("[ULTRASONIC] %s | distancia=%.1f cm\n",
                  ultrasonicIsOnline() ? "ONLINE" : "OFFLINE", ultrasonicGetCm());
  }
  else if (line == "ir") {
    Serial.printf("[IR] %s | crudo=%u | umbral=%d -> %s\n",
                  irIsOnline() ? "ONLINE" : "OFFLINE",
                  (unsigned)irGetValue(), IR_THRESHOLD,
                  irIsReflecting() ? "REFLECTANDO" : "sin reflejo");
  }
  else if (line == "aht" || line == "temp") {
    if (aht10IsOnline()) {
      Serial.printf("[AHT10] temp=%.1f °C | humedad=%.1f %%\n",
                    aht10GetTempC(), aht10GetHumidity());
    } else {
      Serial.println(F("[AHT10] OFFLINE (verificar I2C 0x38, SDA=8 SCL=9)"));
    }
  }
  // ------------------- servos y marcha -------------------
  else if (line == "servos") {
    Serial.printf("[SERVO] PCA9685 %s\n", servosIsOnline() ? "ONLINE" : "OFFLINE");
    for (uint8_t l = 0; l < SERVO_LEGS; l++) {
      Serial.printf("[SERVO] pata %u %s -> coxa=%u femur=%u tibia=%u grados\n",
                    l, LEG_LABELS[l],
                    servoGetAngle(l, 0), servoGetAngle(l, 1), servoGetAngle(l, 2));
    }
  }
  else if (line.startsWith("servo ")) {
    // Formato: servo <pata> <articulacion> <angulo>
    String rest = line.substring(6);
    const int p1 = rest.indexOf(' ');
    const int p2 = rest.indexOf(' ', p1 + 1);
    if (p1 > 0 && p2 > p1) {
      const uint8_t leg   = (uint8_t)rest.substring(0, p1).toInt();
      const uint8_t joint = (uint8_t)rest.substring(p1 + 1, p2).toInt();
      const uint8_t ang   = (uint8_t)rest.substring(p2 + 1).toInt();
      if (servoSetAngle(leg, joint, ang)) {
        Serial.printf("[SERVO] pata %u art %u -> %u grados\n",
                      leg, joint, servoGetAngle(leg, joint));
      } else {
        Serial.println(F("[CONSOLE] Uso: servo <pata 0-3> <art 0-2> <ang 10-170>"));
      }
    } else {
      Serial.println(F("[CONSOLE] Uso: servo <pata 0-3> <art 0-2> <ang 10-170>"));
    }
  }
  else if (line == "neutro" || line == "stand") {
    servoStand();
    Serial.println(F("[SERVO] postura de apoyo configurada aplicada (90 deg)"));
  }
  else if (line == "centro") {
    servoCenterAll();
    Serial.println(F("[SERVO] 12 canales yendo suavemente a centro STAND calibrado (escribi 'stand' al terminar)"));
  }
  else if (line == "cal 90" || line == "centro90") {
    servoCenterRaw90();
    Serial.println(F("[SERVO] 12 canales en 90 deg PUROS para desatornillar y alinear horns fisicamente."));
  }
  else if (line == "cal save" || line == "guardar stand") {
    servoSaveCurrentAsStand();
    Serial.println(F("[SERVO] Postura ACTUAL guardada en NVS como postura inicial STAND!"));
  }
  else if (line == "cal reset") {
    servoResetTrims();
    Serial.println(F("[SERVO] Calibracion reiniciada a 90 deg y polaridades CAD por defecto."));
  }
  else if (line.startsWith("cal dir ")) {
    // Uso: cal dir <pata 0-3> <art 0-2> <1|-1>
    String rest = line.substring(8);
    const int p1 = rest.indexOf(' ');
    const int p2 = (p1 > 0) ? rest.indexOf(' ', p1 + 1) : -1;
    if (p1 > 0 && p2 > p1) {
      const uint8_t leg = (uint8_t)rest.substring(0, p1).toInt();
      const uint8_t jnt = (uint8_t)rest.substring(p1 + 1, p2).toInt();
      const int8_t  dir = (rest.substring(p2 + 1).toInt() < 0) ? -1 : 1;
      if (servoSetDir(leg, jnt, dir)) {
        Serial.printf("[SERVO] Sentido guardado en NVS -> pata %u (%s) art %u = %+d\n",
                      leg, LEG_LABELS[leg], jnt, (int)servoGetDir(leg, jnt));
      } else {
        Serial.println(F("[CONSOLE] Uso: cal dir <pata 0-3> <art 0-2> <1|-1>"));
      }
    } else {
      Serial.println(F("[CONSOLE] Uso: cal dir <pata 0-3> <art 0-2> <1|-1>"));
    }
  }
  else if (line == "cal show" || line == "postura" || line == "pos") {
    Serial.printf("[SERVO] Origen:%s | Calibrado:%s\n", servosGetBootSource(), servosAreCalibrated() ? "SI" : "NO");
    Serial.printf("  PWM real : FL:%u/%u/%u RL:%u/%u/%u FR:%u/%u/%u RR:%u/%u/%u\n",
                  servoGetRawAngle(0,0), servoGetRawAngle(0,1), servoGetRawAngle(0,2),
                  servoGetRawAngle(1,0), servoGetRawAngle(1,1), servoGetRawAngle(1,2),
                  servoGetRawAngle(2,0), servoGetRawAngle(2,1), servoGetRawAngle(2,2),
                  servoGetRawAngle(3,0), servoGetRawAngle(3,1), servoGetRawAngle(3,2));
    Serial.printf("  Centros  : FL:%u/%u/%u RL:%u/%u/%u FR:%u/%u/%u RR:%u/%u/%u\n",
                  servoGetCenterAngle(0,0), servoGetCenterAngle(0,1), servoGetCenterAngle(0,2),
                  servoGetCenterAngle(1,0), servoGetCenterAngle(1,1), servoGetCenterAngle(1,2),
                  servoGetCenterAngle(2,0), servoGetCenterAngle(2,1), servoGetCenterAngle(2,2),
                  servoGetCenterAngle(3,0), servoGetCenterAngle(3,1), servoGetCenterAngle(3,2));
  }
  else if (line == "trim" || line == "trim show") {
    Serial.printf("[SERVO] Trims NVS (deg) | FL:%+d/%+d/%+d RL:%+d/%+d/%+d FR:%+d/%+d/%+d RR:%+d/%+d/%+d\n",
                  servoGetTrim(0,0), servoGetTrim(0,1), servoGetTrim(0,2),
                  servoGetTrim(1,0), servoGetTrim(1,1), servoGetTrim(1,2),
                  servoGetTrim(2,0), servoGetTrim(2,1), servoGetTrim(2,2),
                  servoGetTrim(3,0), servoGetTrim(3,1), servoGetTrim(3,2));
  }
  else if (line == "trim reset") {
    servoResetTrims();
    Serial.println(F("[SERVO] Todos los trims reiniciados a 0 deg y guardados en NVS."));
  }
  else if (line.startsWith("trim ")) {
    // Uso: trim <pata 0-3> <art 0-2> <offset -75..+75>
    String rest = line.substring(5);
    const int p1 = rest.indexOf(' ');
    const int p2 = (p1 > 0) ? rest.indexOf(' ', p1 + 1) : -1;
    if (p1 > 0 && p2 > p1) {
      const uint8_t leg   = (uint8_t)rest.substring(0, p1).toInt();
      const uint8_t joint = (uint8_t)rest.substring(p1 + 1, p2).toInt();
      const int8_t  off   = (int8_t)rest.substring(p2 + 1).toInt();
      if (servoSetTrim(leg, joint, off)) {
        Serial.printf("[SERVO] Trim guardado en NVS -> pata %u (%s) art %u = %+d deg\n",
                      leg, LEG_LABELS[leg], joint, servoGetTrim(leg, joint));
      } else {
        Serial.println(F("[CONSOLE] Uso: trim <pata 0-3> <art 0-2> <offset -75..+75> | trim show | trim reset"));
      }
    } else {
      Serial.println(F("[CONSOLE] Uso: trim <pata 0-3> <art 0-2> <offset -75..+75> | trim show | trim reset"));
    }
  }
  else if (line.startsWith("check ")) {
    // Uso: check <0=FL|1=RL|2=FR|3=RR|all> <fwd|back|up|down|out|stand>
    String rest = line.substring(6);
    const int sp = rest.indexOf(' ');
    if (sp > 0) {
      String who = rest.substring(0, sp);
      who.trim();
      String act = rest.substring(sp + 1);
      act.trim();
      if (who.equalsIgnoreCase("all")) {
        bool ok = true;
        for (uint8_t l = 0; l < SERVO_LEGS; l++) {
          ok = servoTestPose(l, act.c_str()) && ok;
        }
        if (ok) {
          Serial.printf("[SERVO] check ALL (%s) | FL:%u/%u/%u RL:%u/%u/%u FR:%u/%u/%u RR:%u/%u/%u\n",
                        act.c_str(),
                        servoGetAngle(0,0), servoGetAngle(0,1), servoGetAngle(0,2),
                        servoGetAngle(1,0), servoGetAngle(1,1), servoGetAngle(1,2),
                        servoGetAngle(2,0), servoGetAngle(2,1), servoGetAngle(2,2),
                        servoGetAngle(3,0), servoGetAngle(3,1), servoGetAngle(3,2));
        } else {
          Serial.println(F("[CONSOLE] Uso: check <0-3|all> <fwd|back|up|down|out|stand>"));
        }
      } else {
        const uint8_t leg = (uint8_t)who.toInt();
        if (servoTestPose(leg, act.c_str())) {
          Serial.printf("[SERVO] check pata %u %s (%s) -> C=%u F=%u T=%u\n",
                        leg, LEG_LABELS[leg], act.c_str(),
                        servoGetAngle(leg, 0), servoGetAngle(leg, 1), servoGetAngle(leg, 2));
        } else {
          Serial.println(F("[CONSOLE] Uso: check <0=FL 1=RL 2=FR 3=RR|all> <fwd|back|up|down|out|stand>"));
        }
      }
    } else {
      Serial.println(F("[CONSOLE] Uso: check <0=FL 1=RL 2=FR 3=RR|all> <fwd|back|up|down|out|stand>"));
    }
  }
  // ------------------- matriz NeoPixel -------------------
  else if (line.startsWith("led ")) {
    // Formato: led <patron>  (CLEAR, SOLID, RAINBOW, PULSE, FIRE, TEST...)
    const String pat = line.substring(4);
    if (neopixelPlayPattern(pat.c_str())) {
      Serial.printf("[NEOPIXEL] patron=%s | brillo=%d%%\n",
                    neopixelGetPattern(), neopixelGetBrightness());
    } else {
      Serial.println(F("[CONSOLE] Patron no valido. Use: led CLEAR|SOLID|RAINBOW|"
                       "PULSE|BOUNCE|CONVERGE|SPIRAL|FIRE|WAVE|MATRIX_RAIN|TEST"));
    }
  }
  else if (line.startsWith("glyph ")) {
    // Formato: glyph <smile|heart|arrow|spider>
    const String g = line.substring(6);
    if (neopixelDrawGlyph(g.c_str())) {
      Serial.printf("[NEOPIXEL] dibujo=%s\n", g.c_str());
    } else {
      Serial.println(F("[CONSOLE] Dibujo no valido. Use: smile|heart|arrow|spider"));
    }
  }
  else if (line.startsWith("brillo ")) {
    const int b = line.substring(7).toInt();
    if (b >= 0 && b <= 100) {
      neopixelSetBrightness((uint8_t)b);
      Serial.printf("[NEOPIXEL] brillo=%d%% (aplicado a la matriz)\n",
                    neopixelGetBrightness());
    } else {
      Serial.println(F("[CONSOLE] Uso: brillo <0-100>"));
    }
  }
  else if (line == "ledoff") {
    neopixelClear();
    Serial.println(F("[NEOPIXEL] matriz apagada"));
  }
  else { Serial.println(F("[CONSOLE] Comando no reconocido. Escribí 'help'.")); }
}
// ----------------------------------------------------------------------------
// setup() — inicialización
// ----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(300);

  Serial.println();
  Serial.println(F("======================================="));
  Serial.println(F("   ARAÑA ROBOT — Firmware ESP32-S3"));
  Serial.println(F("   IPET N°66 · Electrónica Digital III"));
  Serial.println(F("======================================="));

  // --- Estado global: mode, speed, emergency, watchdog de comandos ---
  robotStateInit();
  mandoProfileInit();   // perfil del mando (NVS; se edita desde la web)


  // --- Buzzer ---
  buzzerInit();
  Serial.printf("[INIT] Buzzer -> GPIO%d %s | estado=%s\n", BUZZER_PIN,
                buzzerIsOnline() ? "ONLINE" : "ERROR", buzzerGetState());

  // Beep corto de arranque (autotest del módulo)
  buzzerPlay("BEEP", BUZZER_DEFAULT_FREQ_HZ, BUZZER_DEFAULT_DURATION_MS,
             "square", BUZZER_DEFAULT_VOLUME);

  // --- IMU MPU6050 (I2C compartido con el PCA9685) ---
  Serial.println(F("[INIT] IMU: mantener el robot QUIETO ~1 s (calibración gyro)..."));
  imuInit();
  if (imuIsOnline()) {
    Serial.printf("[INIT] IMU -> I2C 0x%02X ONLINE | pitch=%.1f roll=%.1f temp=%.1f°C\n",
                  imuGetI2cAddress(), imuGetPitch(), imuGetRoll(), imuGetTempC());
    Serial.println(F("[IMU] Escribí 'imu' para ver lecturas o 'imucal' para recalibrar."));
  } else {
    Serial.println(F("[INIT] IMU -> OFFLINE (se reintentará cada 5 s; verificar SDA=8 SCL=9)"));
  }

  // --- Headlights (LEDs) ---
  ledsInit();
  Serial.printf("[INIT] Headlights -> GPIO%d | estado=%s | canal LEDC=%d\n",
                HEADLIGHT_PIN, ledsGetState() ? "ON" : "OFF", HEADLIGHT_LEDC_CHANNEL);

  // --- GPS (NMEA por UART2) ---
  gpsInit();

  // --- Bateria (opcional, segun config.h) ---
  batteryInit();

  // --- Sensores de distancia y linea ---
  ultrasonicInit();
  irInit();

  // --- AHT10 (temperatura + humedad, I2C 0x38) ---
  aht10Init();

  // --- Servos (PCA9685): lee postura previa (PCA9685 / NVS) y rampa suave a STAND ---
  servosInit();

  // --- Matriz NeoPixel 8x8 ---
  neopixelInit();

  // --- WiFi (AP "ARANA-ROBOT") + servidor HTTP (API REST) ---
  // Con el AP y el webserver activos, el panel PC (pc/app.py) y el mando físico
  // ESP32-C3 ya pueden operar el robot (ver docs/PLAN_CONTROLADOR_ESP32-C3.txt).
  wifiInit();
  webserverInit();

  printBuzzerHelp();
  printModuleHelp();
}

// ----------------------------------------------------------------------------
// loop() — actualización continua
// ----------------------------------------------------------------------------
void loop() {
  buzzerUpdate();              // máquina de estados del sonido (no bloqueante)
  yield();                     // cede tiempo al servidor web y al Watchdog
  imuUpdate();                 // muestreo 100 Hz + filtro de actitud
  yield();
  ultrasonicUpdate();          // HC-SR04 (máquina de estados, no bloqueante)
  buzzerSetProximityAlert(ultrasonicIsOnline() && ultrasonicGetCm() <= 10.0f);
  irUpdate();                  // TCRT5000 (promedio periódico por ADC)
  yield();
  aht10Update();               // AHT10 (I2C, 1 lectura por segundo)
  servosUpdate();              // generador de marcha (autolimitado a 50 Hz)
  yield();
  neopixelUpdate();            // animaciones propias de la matriz 8x8
  gpsUpdate();                 // NMEA del GPS (no bloqueante)
  batteryUpdate();             // medicion periodica de bateria (si esta habilitada)
  yield();
  wifiUpdate();                // AP: reintentos y log de clientes conectados
  webserverUpdate();           // reporte periódico del tráfico HTTP
  robotStateWatchdogUpdate();  // failsafe: sin comandos frescos y en marcha -> STAND
  handleSerialConsole();       // consola de prueba por Monitor Serie
  yield();                     // cede tiempo al servidor web al final de cada ciclo
  // (ESPAsyncWebServer se atiende solo por eventos, sin polling)
}
