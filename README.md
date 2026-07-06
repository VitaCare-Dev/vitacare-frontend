# VitaCare — App móvil

Aplicación móvil de **VitaCare**, construida con React Native y Expo, para el seguimiento de salud de pacientes con enfermedades crónicas: registro de mediciones (glucosa, signos vitales, perfil lipídico), gestión de tratamiento farmacológico, alertas y recomendaciones generadas por IA, y un asistente conversacional.

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Funcionalidades principales](#funcionalidades-principales)
- [Requisitos previos](#requisitos-previos)
- [Configuración](#configuración)
- [Ejecución en desarrollo](#ejecución-en-desarrollo)
- [Pruebas y cobertura](#pruebas-y-cobertura)
- [Build nativo (Android)](#build-nativo-android)
- [Integración continua](#integración-continua)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Convenciones](#convenciones)

## Stack tecnológico

| Componente | Detalle |
|---|---|
| Framework | React Native 0.85 + Expo SDK 56 |
| Lenguaje | TypeScript (modo estricto) |
| Navegación | Expo Router (basado en archivos) |
| Autenticación | Firebase Authentication |
| Estado de servidor | TanStack React Query |
| Formularios | React Hook Form + Zod |
| Notificaciones | expo-notifications (recordatorios locales de medicamentos) |
| Testing | Jest + React Native Testing Library |
| Build / distribución | EAS Build (Expo Application Services) |
| CI | GitHub Actions |

## Funcionalidades principales

- Registro e inicio de sesión (correo/contraseña vía Firebase), con recuperación de contraseña.
- Registro de paciente en varios pasos, incluida la selección de enfermedad crónica.
- Registro y consulta de mediciones: glucosa, signos vitales y perfil lipídico, con gráficos de tendencia.
- Gestión de tratamiento farmacológico, con recordatorios locales configurables.
- Alertas proactivas y recomendaciones alimentarias generadas por un servicio de IA.
- Asistente conversacional (chatbot de IA) para consultas de salud generales.
- Directorio de prestadores de salud (simulado con fines académicos).
- Tema claro/oscuro con persistencia, aplicado a toda la app.
- Pull-to-refresh en las pantallas con datos remotos.

## Requisitos previos

- Node.js LTS y npm
- Expo CLI (`npx expo`, no requiere instalación global)
- Una cuenta de Firebase con Authentication habilitado
- Para builds nativos: cuenta de Expo/EAS y, en Windows, evitar rutas con espacios (ver [Build nativo](#build-nativo-android))

## Configuración

El proyecto usa variables de entorno con prefijo `EXPO_PUBLIC_` (se incrustan en el bundle de JS en tiempo de build, no son secretas del lado del servidor).

Crea un archivo `.env` en la raíz (se versiona, para el valor real de producción/staging del backend):

```bash
EXPO_PUBLIC_API_BASE_URL=https://bff-vitacare.<tu-entorno>.azurecontainerapps.io
```

Si necesitas apuntar a un BFF corriendo en tu propia máquina durante desarrollo, crea un `.env.local` (ignorado por git, tiene prioridad sobre `.env`):

```bash
EXPO_PUBLIC_API_BASE_URL=http://<tu-ip-local>:8086
```

> `src/config/api.ts` lanza un error explícito al arrancar si `EXPO_PUBLIC_API_BASE_URL` no está definida en ningún `.env*`.

También se necesita la configuración de Firebase del proyecto en `src/config/firebase.ts` (credenciales públicas del cliente, no secretas).

## Ejecución en desarrollo

```bash
npm install
npx expo start
```

Desde la salida del comando puedes abrir la app en:

- **Expo Go** (sandbox limitado — no soporta `expo-notifications` en Android; ver nota abajo)
- Un **development build** propio (`npx expo run:android`)
- El emulador de Android / simulador de iOS

> **Nota sobre notificaciones**: `expo-notifications` no se puede ni importar en Expo Go para Android (limitación de la SDK). La app detecta el entorno (`Constants.appOwnership`) y deshabilita los recordatorios de forma controlada en Expo Go, en vez de fallar. Para probar notificaciones reales, usa un development build.

## Pruebas y cobertura

```bash
npm test                    # corre toda la suite
npm test -- --coverage      # con reporte de cobertura
```

La suite cubre las 24 pantallas, los componentes compartidos, servicios, contexto de autenticación/tema, navegación y utilidades (>350 tests, >90% de cobertura de statements). El reporte HTML queda en `coverage/lcov-report/index.html`.

## Build nativo (Android)

> **Importante (Windows)**: si tu proyecto vive en una ruta con espacios (ej. `C:\...\backend - vitacare\...`), el build nativo de Gradle puede fallar con `ninja: manifest still dirty`. Trabaja desde una copia sin espacios en la ruta (ej. `C:\dev\vitacare-frontend`) solo para el build nativo, sincronizando con `robocopy` antes de cada build.

```bash
npx expo prebuild --clean -p android
npx expo run:android
```

Para builds de distribución (APK descargable sin pasar por Play Store), el proyecto usa **EAS Build** — ver `eas.json` (perfil `preview`).

## Integración continua

`.github/workflows/eas-build.yml` corre en cada push a `main`:

1. Typecheck (`tsc --noEmit`) y la suite de tests completa.
2. Si pasan, dispara un build de Android en EAS (perfil `preview`), disponible para descarga en el [dashboard de Expo](https://expo.dev).

## Estructura del proyecto

```
src/
├── app/            # Rutas de Expo Router (file-based). Los archivos aquí son
│                   # solo wrappers finos; la implementación vive en screens/.
├── components/     # Componentes de UI reutilizables
├── config/         # Configuración de Firebase y de la URL del API
├── context/        # Contexto de autenticación (AuthContext)
├── data/           # Datos estáticos (regiones de Chile, catálogos simulados)
├── navigation/      # Lógica de redirección según estado de autenticación
├── screens/        # Implementación real de cada pantalla
├── services/       # Cliente HTTP y llamadas a la API del BFF
├── test-utils/     # Utilidades compartidas para tests
├── theme/          # Definición de temas claro/oscuro y su contexto
├── types/          # Tipos compartidos de TypeScript
└── utils/          # Formateo, validaciones y esquemas de formularios (Zod)
```

## Convenciones

- Formularios migrados a **React Hook Form + Zod**, con esquemas centralizados en `src/utils/formSchemas.ts`.
- El tema (`useTheme()` / `useThemeMode()`) se inyecta en cada pantalla; los estilos se generan con una función `createStyles(theme)` llamada dentro del componente, no a nivel de módulo.
- Los mensajes de error del backend nunca se muestran crudos al usuario: se traducen a mensajes genéricos en la capa de servicios (`src/services/apiClient.ts`), y el detalle técnico solo se registra en consola.
