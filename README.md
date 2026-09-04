# LUCO Estudio - Landing Mobile First

## Stack elegido
- HTML5 semantico para una landing rapida y mantenible.
- CSS3 modular (base, componentes y secciones) para escalar estilo sin deuda tecnica.
- JavaScript ES Modules para interacciones puntuales (carrusel) sin sobrecargar el proyecto.

Este formato es el mejor punto de partida para el estado actual porque:
- Permite una entrega fiel al diseno visual de forma inmediata.
- Tiene coste de mantenimiento bajo para una landing.
- Escala de forma ordenada hacia un framework con rutas privadas (por ejemplo, Next.js o Astro) reutilizando estilos, naming y componentes.

## Estructura

```text
.
|-- index.html
|-- README.md
`-- src
    |-- scripts
    |   |-- main.js
    |   `-- modules
    |       `-- carousel.js
    `-- styles
        |-- base.css
        |-- components.css
        `-- sections.css
```

## Recursos usados
- Carpeta de marca: `Univero_Grafico_Luco/`
- Imagen escaparate: `luco_escaparate.png`
- Imagen retrato: `woman_1.png`

## Escalabilidad futura (sin implementar aun)
- Crear carpeta `src/features/` para modulos por dominio (publico, academia, perfil, etc.).
- Incorporar un router (o migrar a framework SSR/SSG) para secciones privadas.
- Integrar autenticacion y autorizacion por roles en una capa separada de UI.
- Mantener diseno y tokens de color/fuente ya definidos en `src/styles/base.css`.

## Vista local
Abrir `index.html` en navegador o usar un servidor estatico.
