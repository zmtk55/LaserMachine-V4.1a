# Configuración Deploy Automático a Netlify

## Paso 1: Obtener tokens de Netlify

1. Ve a https://app.netlify.com/user/applications/personal
2. Click en "New access token"
3. Guarda el token (se muestra solo una vez)

## Paso 2: Obtener Site ID

1. Ve a tu sitio en Netlify Dashboard
2. Settings → General → Site details
3. Copia el "Site ID" (ej: `abc123def-456g-789h-012i-345jklmnopqr`)

## Paso 3: Configurar secrets en GitHub

1. Ve a tu repo en GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Agrega estos 2 secrets:

   - **Name:** `NETLIFY_AUTH_TOKEN`
   - **Value:** (tu token del paso 1)

   - **Name:** `NETLIFY_SITE_ID`
   - **Value:** (tu site ID del paso 2)

## Paso 4: Hacer push

```bash
git add .
git commit -m "setup: GitHub Actions para deploy automático a Netlify"
git push origin main
```

## Resultado

- Cada push a `main` hará deploy automático
- Puedes ver el progreso en GitHub → Actions tab
- El deploy se verá en: https://lasermachine-mx.netlify.app/
