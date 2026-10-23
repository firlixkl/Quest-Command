# > _ QuestCommand

**Repositorio personal de herramientas de ciberseguridad, con asistente interactivo de construcción de comandos.**

Web estática, autoalojada, sin base de datos ni dependencias de backend. Cada herramienta se define en un único fichero JSON, lo que permite ampliar el catálogo sin tocar una línea de código.

🔗 **Demo en vivo:** [questcommand.servebeer.com](https://questcommand.servebeer.com)

---

## ✨ Qué es esto

QuestCommand nace como repositorio personal para auditorías y CTFs: en vez de recordar la sintaxis exacta de cada herramienta (o perder tiempo buscando en el `--help` o en el repositorio oficial), eliges la herramienta, respondes unas preguntas guiadas y obtienes el comando exacto, listo para copiar.

No es una enciclopedia estática de comandos: **el comando se construye en vivo**, adaptado a las respuestas, igual que lo haría alguien que ya domina la herramienta y piensa en voz alta mientras la usa.

## 🖥️ Capturas

| Catálogo | Asistente paso a paso |
|---|---|
| <img width="1852" height="862" alt="image" src="https://github.com/user-attachments/assets/3f29139b-d02d-4b33-b896-d82bf5e329a6" />| <img width="1110" height="705" alt="image" src="https://github.com/user-attachments/assets/dd46e0f6-15cc-43ea-8341-be7ac84a3b2d" />|

## 🧩 Características

- **Catálogo navegable** por categorías (reconocimiento, enumeración web, explotación, post-explotación, cracking de contraseñas, red/MITM...), con buscador en vivo.
- **Asistente interactivo**: selecciona una herramienta y responde preguntas (selección, texto, numérico, sí/no). El comando se recalcula en cada respuesta.
- **Preguntas condicionales**: una pregunta puede aparecer u ocultarse según respuestas anteriores (por ejemplo, en Gobuster, el modo `vhost` pide una URL y el modo `dns` pide un dominio).
- **Chuleta rápida** por herramienta: comandos típicos ya resueltos, por si no necesitas el asistente.
- **100% estático**: HTML + CSS + JavaScript vanilla + JSON. Sin frameworks, sin build, sin base de datos.
- **Modular por diseño**: cada herramienta vive en su propio fichero JSON. Añadir una herramienta nueva no requiere tocar el motor de la aplicación.

## 🛠️ Herramientas incluidas

| Categoría | Herramientas |
|---|---|
| Reconocimiento | Nmap, WhatWeb, searchsploit |
| Enumeración web | Gobuster, ffuf, Wfuzz, Nikto, WPScan |
| Explotación web | sqlmap |
| Fuerza bruta de credenciales | Hydra |
| Enumeración SMB / Windows | enum4linux-ng, SMBMap |
| Post-explotación / Active Directory | CrackMapExec / NetExec |
| Red / MITM | Bettercap, Responder |
| Cracking de contraseñas | John the Ripper, Hashcat |

*(lista viva: se amplía según el fichero `data/tools.json`)*

## 🏗️ Arquitectura

```
.
├── index.html              # Punto de entrada
├── app.js                  # Motor: catálogo, buscador, asistente, chuleta
├── style.css                # Tema oscuro, estética terminal
├── data/
│   ├── tools.json           # Índice: qué ficheros de herramienta cargar
│   └── tools/
│       ├── nmap.json
│       ├── gobuster.json
│       └── ...               # Una herramienta = un fichero
├── nginx-pentesthub.conf    # Configuración de referencia para nginx
├── deploy.sh                # Script de despliegue en Debian
└── README.md
```

Sin backend, sin build step: cualquier navegador sirve directamente estos ficheros. Esto simplifica el despliegue a instalar nginx y copiar la carpeta.

## 🧱 Formato de una herramienta

Cada fichero en `data/tools/` describe una herramienta completa: metadatos, preguntas del asistente y chuleta.

```json
{
  "id": "nmap",
  "name": "Nmap",
  "category": "Reconocimiento",
  "binary": "nmap",
  "summary": "Escaneo de puertos, servicios, versiones y scripts NSE.",
  "questions": [ /* ver tabla siguiente */ ],
  "cheats": [
    { "title": "Típico en CTF", "cmd": "nmap -p- --min-rate 5000 -oA full TARGET", "note": "Opcional" }
  ]
}
```

### Tipos de pregunta

| Campo | Tipos admitidos | Descripción |
|---|---|---|
| `type` | `select` \| `text` \| `number` \| `bool` | Tipo de control mostrado |
| `select` | — | Requiere `options: [{id, label, frag}]`; `frag` se inserta tal cual en el comando |
| `text` / `number` / `bool` | — | Requieren `flag` (usa `{v}` donde va el valor; para argumentos posicionales sin bandera, usa `"flag":"{v}"`) |
| `when` | — | Hace la pregunta condicional: `{"otraPregunta":"idOpcion"}` o una lista de ids |
| `default`, `placeholder`, `help`, `required` | — | Opcionales, autoexplicativos |

El **orden** del array `questions` determina el orden de los argumentos en el comando final.

## ➕ Añadir una herramienta nueva

1. Copia un fichero existente de `data/tools/` como plantilla.
2. Edítalo: `id`, `name`, `category`, `binary`, `summary`, `questions`, `cheats`.
3. Añade el nombre del fichero a `data/tools.json`.
4. Recarga el navegador. No hace falta build ni reiniciar nada.

> ⚠️ Toda pregunta de tipo `text`/`number` necesita el campo `flag`, aunque sea un argumento posicional (`"flag":"{v}"`). Olvidarlo es la causa más común de fallos en el asistente.

## 🚀 Despliegue

Pensado para un Debian mínimo, sin nada más que SSH:

```bash
scp -r pentest-hub usuario@servidor:~
ssh usuario@servidor
cd pentest-hub && sudo ./deploy.sh
```

El script instala nginx, publica el sitio en `/var/www/pentesthub` y configura el *virtual host*. HTTPS se gestiona aparte con Certbot (Let's Encrypt).

### Actualizar tras un cambio

```bash
sudo cp -r data app.js style.css index.html /var/www/pentesthub/
```

## 🔒 Seguridad del propio servidor

El proyecto se diseñó para exponerse públicamente asumiendo un enfoque de mínima superficie de ataque:

- Al ser estático, no hay backend, login ni base de datos que explotar: la superficie se reduce a nginx y al sistema operativo.
- SSH restringido a la red local, con autenticación solo por clave.
- Firewall (`ufw`) con política por defecto de denegar entrante; solo 80/443 abiertos al exterior.
- `fail2ban` y actualizaciones automáticas (`unattended-upgrades`).
- HTTPS obligatorio (redirección 301 + HSTS) vía Let's Encrypt.
- Cabeceras de seguridad (`X-Frame-Options`, `Content-Security-Policy`, `X-Content-Type-Options`, etc.) y *rate limiting* en nginx.

## 🗺️ Roadmap

- [ ] Más herramientas: Metasploit, amass/Sublist3r, BloodHound, Impacket
- [ ] Exportar el historial de comandos generados
- [ ] Modo offline / PWA
- [ ] Tema claro (opcional)

## 📄 Licencia

GNU GPLv3.

---

<sub>Construido como herramienta de uso personal para auditorías de seguridad y CTFs.</sub>
