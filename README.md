# PentestHub
Web estática (HTML+JS+JSON). Sin base de datos ni build.

## Desplegar en Debian
    scp -r pentest-hub usuario@servidor:~ ; ssh usuario@servidor
    cd pentest-hub && sudo ./deploy.sh
Actualizar tras editar: `sudo cp -r data app.js style.css index.html /var/www/pentesthub/`

## Añadir una herramienta
1. Crea `data/tools/miherramienta.json` (copia gobuster.json).
2. Añade `"miherramienta.json"` a `data/tools.json`.
3. Recarga el navegador.

## Formato de pregunta
- `type`: `select` | `text` | `number` | `bool`
- `select`: `options:[{id,label,frag}]` (frag = trozo de comando)
- `text/number/bool`: `flag` (usa `{v}` donde va el valor)
- `when`: `{"otraPregunta":"idOpcion"}` o lista de ids -> pregunta condicional
- `default`, `placeholder`, `help`, `required`
- El orden de `questions` es el orden en el comando final.
