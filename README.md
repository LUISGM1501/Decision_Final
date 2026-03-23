# Decisión Final

> Juego web de decisiones estratégicas de negocio — multijugador local, por turnos y rondas.

## Cómo correrlo localmente

### Opción 1: Abrir directamente (más fácil)

Simplemente abrí el archivo `index.html` en cualquier navegador moderno:

```
Doble clic en index.html
```

Eso es todo. No necesita servidor, no necesita internet, no necesita instalación.

### Opción 2: Con servidor local (recomendado para desarrollo)

Si querés hacer cambios y que se reflejen mejor:

**Con Python (ya viene en Mac/Linux):**
```bash
cd decision-final
python3 -m http.server 8000
```
Abrí `http://localhost:8000` en el navegador.

**Con Node.js:**
```bash
npx serve .
```

**Con VS Code:**
Instalá la extensión "Live Server", clic derecho en `index.html` → "Open with Live Server".

## Estructura del proyecto

```
decision-final/
├── index.html      ← Estructura HTML (5 pantallas)
├── styles.css      ← Estilos y diseño visual
├── data.js         ← Mazo de 16 cartas (4 por tipo)
├── script.js       ← Lógica del juego (modular)
├── assets/         ← (Opcional) Imágenes, logos
└── README.md       ← Este archivo
```

## Módulos de JavaScript

| Módulo   | Responsabilidad                                      |
|----------|------------------------------------------------------|
| `App`    | Navegación entre pantallas, modal, reset             |
| `Config` | Configuración de jugadores, validación               |
| `Cards`  | Selección de cartas con balanceo de tipos            |
| `Game`   | Loop principal: cargar, seleccionar, revelar, avanzar|
| `Score`  | Renderizado del marcador                             |
| `UI`     | Helpers DOM, mensajes del sistema, barra de progreso |

## Reglas del juego

- **10 rondas** con situaciones de oportunidad, crisis, innovación y riesgo
- Cada jugador elige **A o B** en cada ronda
- Puntuación: óptima (+2), aceptable (+1), neutra (0), errónea (−1)
- Puntaje mínimo: 0
- **Gana** quien tenga más puntos; desempate por decisiones óptimas, luego por última crisis

## Requisitos

- Navegador moderno (Chrome, Firefox, Edge, Safari)
- No requiere internet (las fuentes de Google son opcionales)
- Funciona en cualquier laptop estándar

## Tecnologías

- HTML5
- CSS3 (custom properties, grid, flexbox)
- JavaScript ES6+ (vanilla, sin frameworks)
