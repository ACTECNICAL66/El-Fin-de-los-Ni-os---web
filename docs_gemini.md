# Chat con Gemini

## Configurar

```bash
echo "GEMINI_API_KEY=AQ...." > .env
npm run dev
```

La clave se lee **solo en el servidor** (`api/routes/chat.ts`). Nunca lleva el
prefijo `VITE_`: todo lo `VITE_` se empaqueta en el bundle público y queda
visible para cualquiera que abra el sitio.

`GET /api/chat/estado` informa si hay clave configurada, sin revelarla.

## Formatos de clave: los dos sirven

| formato | largo | nombre | estado |
|---|---|---|---|
| `AQ.` | 53 | Auth key | lo que emite AI Studio desde 2026 |
| `AIza` | 39 | Standard key | en retiro: irrestrictas rechazadas desde 2026-06-19 |

**No validar el prefijo en el código.** Varias herramientas se rompieron por
exigir `AIza` y rechazar las `AQ.` válidas. Este proxy no mira el formato.

## Cómo se manda la clave

En el header, **nunca en la URL**:

```js
fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-goog-api-key": key },
  ...
});
```

Dos motivos:

1. Una clave en la URL termina en logs de servidores y proxies.
2. Las claves `AQ.` pueden devolver **401 `ACCESS_TOKEN_TYPE_UNSUPPORTED`** si se
   mandan por el query `?key=`. El header es la forma documentada y la que
   aceptan las dos familias.

Trampa relacionada: el endpoint compatible con OpenAI (`/v1beta/openai/`)
requiere `Authorization: Bearer` y **no** acepta `AQ.`. Este proyecto usa el
endpoint nativo.

## Modelo

Por defecto `gemini-3.8-flash`.

`gemini-2.5-flash` quedó **deprecado el 2026-11-02**; desde el 2026-12-01 las
llamadas se redirigen solas y se facturan al modelo destino. Fijarlo cambiaría
el comportamiento sin aviso. Se puede overridear con `GEMINI_MODEL`.

## Verificación hecha

El proxy se probó con `hono` real y `fetch` interceptado: confirma que sale el
pedido correcto (URL sin clave, header presente, `systemInstruction` con el
contexto del proyecto) sin llamar a Google.

## Verificación que falta

Desde el sandbox de desarrollo **no se puede llamar a Gemini**:
`googleapis.com` devuelve `SSL_ERROR_SYSCALL`. La primera llamada real hay que
hacerla desde un entorno con salida a internet.

## Rotar la clave

Cualquier clave compartida por chat, captura o issue debe darse de baja en
https://aistudio.google.com/apikey. El historial de una conversación no es un
lugar seguro, aunque el repo esté limpio.
