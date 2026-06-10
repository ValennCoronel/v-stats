# Guía de Entornos y Deploy - V-Stats

Este documento explica cómo configurar la aplicación para correr contra un backend local (para desarrollo) o contra un backend de producción (Vercel).

---

## 1. Archivo de Variables de Entorno (`.env`)

Toda la configuración del entorno para la aplicación móvil (Expo) se maneja a través del archivo `.env` ubicado en la carpeta `v-stats-app/`:

```env
# v-stats-app/.env

# Únicamente las variables que comiencen con EXPO_PUBLIC_ se incluirán en la app.
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> **IMPORTANTE:** Siempre que modifiques el archivo `.env`, debes reiniciar el servidor de Expo (`npm start` o `npx expo start -c` para limpiar el caché) para que tome los cambios.

---

## 2. Desarrollo Local (Docker)

Para trabajar de manera local con tu propia base de datos y backend, debes levantar los contenedores de Docker.

### A. Levantar el Backend Local
1. Abre una terminal en la **raíz del proyecto** (donde está el `docker-compose.yml`).
2. Ejecuta el comando:
   ```bash
   docker compose up --build
   ```
   *(Esto levantará la API en el puerto 3000 y la base de datos).*

### B. Configurar la URL en el Frontend
Dependiendo de cómo pruebes la app, la URL que debes poner en tu `v-stats-app/.env` cambiará:

*   **Si pruebas en navegador Web o Emulador de PC:**
    Puedes usar `localhost` porque todo corre en la misma computadora.
    ```env
    EXPO_PUBLIC_API_URL=http://localhost:3000
    ```

*   **Si pruebas en tu Celular Físico (Expo Go):**
    No puedes usar `localhost` (tu celular pensaría que la API está adentro de él). Debes usar la **IP local de tu red Wi-Fi** (ej. `192.168.1.47` o `10.100.104.20`).
    Para averiguar tu IP en Windows, abre una terminal y ejecuta `ipconfig`.
    ```env
    EXPO_PUBLIC_API_URL=http://<TU_DIRECCION_IP>:3000
    ```
    *(Nota: Tu celular y tu PC deben estar conectados al mismo Wi-Fi. Ciertas redes públicas o universitarias bloquean esta conexión).*

---

## 3. Entorno de Producción (Vercel)

Cuando quieras compilar la app final (APK) o probar cómo funciona con la base de datos real de internet, debes apuntar al backend que está hosteado en Vercel.

### A. Configurar la URL de Producción
Edita tu archivo `v-stats-app/.env` y coloca la URL del proyecto desplegado:

```env
EXPO_PUBLIC_API_URL=https://v-stats-imgb.vercel.app
```
*(Asegúrate de no dejar una `/` al final de la URL).*

### B. Deploy del Backend (API)
Al estar conectado con Vercel, cualquier cambio que empujes (`git push`) a la rama principal (ej. `main` o `master`) en tu repositorio de GitHub disparará automáticamente un nuevo despliegue.
* Si por algún motivo da error *"Deployment not found"*, ingresa al panel de Vercel para confirmar que la última compilación ("Build") haya finalizado exitosamente y verifica si la URL cambió.

### C. Deploy de la App (Frontend)
*   **Web:** Si alojas la versión Web de la app en Vercel, funcionará igual que el backend (`git push` = auto-deploy).
*   **Móvil (Android / iOS):** Para generar el instalable real (`.apk` o `.aab`), debes usar [Expo EAS Build](https://docs.expo.dev/build/introduction/). Las variables de entorno de producción (`EXPO_PUBLIC_API_URL`) se empaquetarán en la app al momento de construirla.
