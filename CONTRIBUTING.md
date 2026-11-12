# Contribuir / Contributing

¡Gracias por querer aportar! Thanks for helping out.

## Cómo probar cambios

No hay build. Sirve la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8000
```

La cámara exige **https** (o `localhost`). Para probar en el celular usa un túnel https (por ejemplo `cloudflared` o `ngrok`) o publica tu fork en GitHub Pages.

## Qué ayuda más

- Reportar en qué celulares/navegadores funciona o falla (usa la plantilla de issue).
- Nuevos tipos de contenido en `config.js` (modelos 3D `.glb`, audio, texto).
- Mejoras de rendimiento en gama baja.
- Traducciones del README y ejemplos de marcadores para mapping.

## Pull requests

1. Haz fork y crea una rama (`git checkout -b mi-mejora`).
2. Mantén el proyecto **sin build y sin dependencias que instalar**.
3. Prueba al menos en Chrome Android o Safari iOS y dilo en el PR.
4. Describe qué cambia y por qué.

Al contribuir aceptas que tu aporte se publique bajo la licencia [MIT](LICENSE).
