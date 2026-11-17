# Tipografías estándar incluidas (recursos versionados del frontend)

Bytes oficiales de las familias que el catálogo vivo ya nombra, obtenidos de la
distribución oficial de Google Fonts (fonts.googleapis.com/css2 → fonts.gstatic.com)
el 14 nov 2026. NO son archivos aportados por el taller; son las caras reales de
esas familias estándar, fijadas por sha256 para que lo renderizado y lo grabado
coincidan exactamente con lo publicado.

Licencias: SIL OFL 1.1 (todas excepto Permanent Marker, Apache 2.0). Ambas
permiten uso comercial y redistribución del archivo sin modificar.

| archivo | familia real | peso | sha256 |
|---------|--------------|------|--------|
| lm-101-anton.ttf | Anton | 400 | fd9301f2837c99df2be07cc7f0be66e9470f5354d8fcf1606027c67fcd637a53 |
| lm-102-109-permanent-marker.ttf | Permanent Marker | 400 | a73712ce4f3b32d3c7a1a657d56c6aaf50c719b7fa7fe0541905fe77f5a9906c |
| lm-103-110-playfair-700.ttf | Playfair Display | 700 | adefc53e7b3d483f1fa5e85edd82b7689ca79db25a1f6786bd7949cdcfeec601 |
| lm-108-bebas-neue.ttf | Bebas Neue | 400 | 939fea723dad24504f40faadc34eeffadfbbee558754f70c3c736e13786b0ab6 |
| lm-104-plus-jakarta-800.ttf | Plus Jakarta Sans ExtraBold | 800 | d9e0ddb4a15a0054ad84b4ded3b4b9f354a0b7df426e21a1363d6933728da9d5 |
| lm-105-107-jetbrains-mono.ttf | JetBrains Mono | 400 | 44ce4a84f20d60f24539bd0cef11f79c29e38609e0f8adf18551c9794a5d9dc3 |
| lm-999-plus-jakarta-400.ttf | Plus Jakarta Sans | 400 | 076831b98043f50f829b6c91db3be4a844641f1c95bccff5c886ed87c661a852 |

La entrada 106 (Elegant Cursive, font-script2) NO tiene archivo: su inclinación
actual es sintetizada por CSS y Permanent Marker no publica cursiva real. Queda
bloqueada hasta que exista reproducción fiel; no se sustituye su apariencia.

El peso 700 de Playfair Display reproduce lo que los navegadores ya renderizan
hoy (la hoja pública solo carga esa cara; la clase CSS no fija peso y el navegador
resuelve a la única cara disponible).
