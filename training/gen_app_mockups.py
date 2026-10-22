# Generates static HTML mockups of the My Stake Friends Flutter app (v1.1.34+34)
# in English and Spanish. Spanish UI strings are checked against the app's own
# lib/l10n/es_translations.dart so they match exactly what tr() returns.
import html
import os
import re
import sys

APP = r"C:\firebaseProjects\mystakefriends_app"
OUT = r"C:\firebaseProjects\mystakefriends\training\mockups"

# ---------------------------------------------------------------- dictionary
def load_dart_map(path):
    src = open(path, encoding="utf-8").read()
    lines = [l for l in src.splitlines() if not l.strip().startswith("//")]
    body = "\n".join(lines)
    body = body[body.index("{") + 1: body.rindex("}")]
    lits = []
    i = 0
    while i < len(body):
        c = body[i]
        if c in "'\"":
            q = c
            j = i + 1
            buf = []
            while body[j] != q:
                if body[j] == "\\":
                    nxt = body[j + 1]
                    buf.append({"n": "\n", "t": "\t"}.get(nxt, nxt))
                    j += 2
                    continue
                buf.append(body[j])
                j += 1
            lits.append("".join(buf))
            i = j + 1
        else:
            i += 1
    assert len(lits) % 2 == 0, "odd literal count"
    return dict(zip(lits[0::2], lits[1::2]))

DART = load_dart_map(os.path.join(APP, "lib", "l10n", "es_translations.dart"))

# UI strings: key = exact English string passed to tr()/trf() in the app.
UI_ES = {
    '"Hearts Knit in Unity"': '"Corazones Unidos en Unidad"',
    'Email': 'Correo Electrónico',
    'Password': 'Contraseña',
    'Sign In': 'Iniciar Sesión',
    'Forgot password?': '¿Olvidaste tu contraseña?',
    "Don't have an account yet?\nAsk your ward administrator for an invitation.":
        '¿Aún no tienes una cuenta?\nPide una invitación al administrador de tu barrio.',
    'My Circle': 'Mi Círculo',
    '{0} members': '{0} miembros',
    '{0} visitor': '{0} visitante',
    'Chat': 'Chat',
    '{0} recent': '{0} recientes',
    'Activities': 'Actividades',
    '{0} upcoming': '{0} próximos',
    'My Profile': 'Mi Perfil',
    'Edit info': 'Editar información',
    'Recent Chats': 'Chats Recientes',
    'View All': 'Ver Todo',
    'Upcoming Activities': 'Próximas Actividades',
    'Today': 'Hoy',
    "🎂 {0}'s Birthday": '🎂 Cumpleaños de {0}',
    '{0}m ago': 'hace {0} min',
    '{0} is typing…': '{0} está escribiendo…',
    'Type a message...': 'Escribe un mensaje...',
    'Seen by all': 'Visto por todos',
    'Upcoming': 'Próximas',
    'Past': 'Pasadas',
    'Version': 'Versión',
    'Hearts Knit In Unity': 'Corazones Unidos en Unidad',
    'Language': 'Idioma',
    'Notifications': 'Notificaciones',
    'On': 'Activadas',
    'Contact Developer': 'Contactar al Desarrollador',
    'Close': 'Cerrar',
    'Not assigned to a circle yet': 'Aún no asignado a un círculo',
    'Retry': 'Reintentar',
    'Notifications are turned off on this device':
        'Las notificaciones están desactivadas en este dispositivo',
    "You won't hear about new messages and activities from your circle.":
        'No recibirás avisos de nuevos mensajes ni actividades de tu círculo.',
    'Tap Open Settings, then Notifications, then turn on Allow Notifications.':
        'Toca Abrir Ajustes, luego Notificaciones, y activa Permitir Notificaciones.',
    'Open Settings': 'Abrir Ajustes',
}
mismatch = [k for k in UI_ES if DART.get(k) != UI_ES[k]]
if mismatch:
    sys.exit("Dictionary mismatch vs es_translations.dart: %r" % mismatch)

# Demo content / strings not in the app dictionary (natural Spanish).
DEMO_ES = {
    'Sunrise Circle': 'Círculo Amanecer',
    'Game Night': 'Noche de Juegos',
    "Smith's Home": 'Casa de los Smith',
    'Happy birthday, Emily! 🎉': '¡Feliz cumpleaños, Emily! 🎉',
    'Is our planning meeting still on this week?':
        '¿Sigue en pie nuestra reunión de planificación esta semana?',
    'See everyone Thursday at 7!': '¡Nos vemos todas el jueves a las 7!',
    "I'll bring dessert 😊": 'Yo llevo el postre 😊',
    'about an hour ago': 'hace una hora',
    '25 minutes ago': 'hace 25 minutos',
    '12 minutes ago': 'hace 12 minutos',
    '2 minutes ago': 'hace 2 minutos',
    'Oct 6, 2026': '6 oct 2026',
    'Oct 9, 2026': '9 oct 2026',
    '7:00 PM': '7:00 p. m.',
}

LANG = "en"

def t(s):
    if LANG == "en":
        return s
    if s in UI_ES:
        return UI_ES[s]
    if s in DEMO_ES:
        return DEMO_ES[s]
    if s in ('My Stake Friends', 'English', 'Español'):
        return s  # brand name (not in dictionary, app shows it as-is) / language names
    raise KeyError("No Spanish for %r" % s)

def e(s):
    return html.escape(s, quote=True)

# ---------------------------------------------------------------- icons
ICONS = {
    "favorite": "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    "email_outlined": "M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z",
    "lock_outline": "M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6zM18 20H6V10h12v10z",
    "visibility_outlined": "M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17s-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 5c1.38 0 2.5 1.12 2.5 2.5S13.38 14 12 14s-2.5-1.12-2.5-2.5S10.62 9 12 9m0-2c-2.48 0-4.5 2.02-4.5 4.5S9.52 16 12 16s4.5-2.02 4.5-4.5S14.48 7 12 7z",
    "campaign_outlined": "M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm5.03 1.71L11 9.53v4.94l-1.97-1.18-.48-.29H4v-2h4.55l.48-.29zM15.5 12c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z",
    "info_outline": "M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
    "refresh": "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
    "logout": "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
    "group": "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    "chat_bubble": "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z",
    "event": "M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z",
    "person": "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    "cake": "M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 16.64 5.88 17 4.96 17c-.73 0-1.4-.23-1.96-.61V21c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-4.61c-.56.38-1.23.61-1.96.61-.92 0-1.79-.36-2.44-1.01zM18 9h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v1.54c0 1.08.88 1.96 1.96 1.96.52 0 1.02-.2 1.38-.57l2.14-2.13 2.13 2.13c.74.74 2.03.74 2.77 0l2.14-2.13 2.13 2.13c.37.37.86.57 1.38.57 1.08 0 1.96-.88 1.96-1.96V12C21 10.34 19.66 9 18 9z",
    "chevron_right": "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
    "format_size": "M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z",
    "notifications_active": "M7.58 4.08L6.15 2.65C3.75 4.48 2.17 7.3 2.03 10.5h2c.15-2.65 1.51-4.97 3.55-6.42zm12.39 6.42h2c-.15-3.2-1.73-6.02-4.12-7.85l-1.42 1.43c2.02 1.45 3.39 3.77 3.54 6.42zM18 11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2v-5zm-6 11c.14 0 .27-.01.4-.04.65-.14 1.18-.58 1.44-1.18.1-.24.15-.5.15-.78h-4c.01 1.1.9 2 2.01 2z",
    "notifications_active_outlined": "M18 16v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6zm-4 5c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zM7.58 4.08L6.15 2.65C3.75 4.48 2.17 7.3 2.03 10.5h2c.15-2.65 1.51-4.97 3.55-6.42zm12.39 6.42h2c-.15-3.2-1.73-6.02-4.12-7.85l-1.42 1.43c2.02 1.45 3.39 3.77 3.54 6.42z",
    "notifications_off_outlined": "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm0-15.5c2.49 0 4 2.02 4 4.5v.1l2 2V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.24.06-.47.15-.69.23l1.64 1.64c.18-.02.36-.05.55-.05zM5.41 3.35L4 4.76l2.81 2.81C6.29 8.57 6 9.74 6 11v5l-2 2v1h14.24l1.74 1.74 1.41-1.41L5.41 3.35zM16 17H8v-6c0-.68.12-1.32.34-1.9L16 16.76V17z",
    "settings_outlined": "M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.09-.16-.26-.25-.44-.25-.06 0-.12.01-.17.03l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.06-.02-.12-.03-.18-.03-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.09.16.26.25.44.25.06 0 .12-.01.17-.03l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.06.02.12.03.18.03.17 0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zm-1.98-1.71c.04.31.05.52.05.73 0 .21-.02.43-.05.73l-.14 1.13.89.7 1.08.84-.7 1.21-1.27-.51-1.04-.42-.9.68c-.43.32-.84.56-1.25.73l-1.06.43-.16 1.13-.2 1.35h-1.4l-.19-1.35-.16-1.13-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21 1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7-1.08-.84.7-1.21 1.27.51 1.04.42.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43.16-1.13.2-1.35h1.39l.19 1.35.16 1.13 1.06.43c.43.18.83.41 1.23.71l.91.7 1.06-.43 1.27-.51.7 1.21-1.07.85-.89.7.14 1.13zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z",
    "close": "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    "error_outline": "M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z",
    "attach_file": "M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z",
    "image": "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
    "open_in_full": "M21 11V3h-8l3.29 3.29-10 10L3 13v8h8l-3.29-3.29 10-10z",
    "send": "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z",
    "location_on": "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    "add": "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    "check": "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
    "arrow_back_ios_new": "M17.77 3.77L16 2 6 12l10 10 1.77-1.77L9.54 12z",
}

def ic(name, size=24, color="currentColor", style=""):
    st = f' style="{style}"' if style else ""
    return (f'<svg class="ic" width="{size}" height="{size}" viewBox="0 0 24 24" '
            f'fill="{color}" aria-hidden="true"{st}><path d="{ICONS[name]}"/></svg>')

ROSE, ROSE_ACC, AMBER, BLUE, GREEN = "#f472b6", "#be185d", "#fbbf24", "#3b82f6", "#22c55e"

# ---------------------------------------------------------------- shared CSS
CSS = """
*{box-sizing:border-box}
html,body{margin:0}
body{background:#e5e7eb;font-family:'Segoe UI',Roboto,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:44px 0;-webkit-font-smoothing:antialiased}
.device{position:relative;flex:none;width:390px;height:844px;border-radius:40px;overflow:hidden;background:#fff;box-shadow:0 0 0 11px #111827,0 0 0 13px #4b5563,0 28px 60px rgba(0,0,0,.35)}
.ic{display:block;flex:none}
.statusbar{position:absolute;top:0;left:0;right:0;height:47px;z-index:60;display:flex;align-items:center;justify-content:space-between;padding:2px 24px 0 36px;color:#000;pointer-events:none}
.statusbar .time{font-size:16px;font-weight:600;letter-spacing:.2px}
.statusbar .sys{display:flex;align-items:center;gap:6px}
.island{position:absolute;top:11px;left:50%;margin-left:-62px;width:124px;height:34px;border-radius:18px;background:#000;z-index:61}
.home-ind{position:absolute;bottom:8px;left:50%;margin-left:-67px;width:134px;height:5px;border-radius:3px;background:#000;z-index:60}
.screen{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column}
.grad{background:linear-gradient(to bottom right,#FEF2F2,#FEF3C7,#F0FDF4)}
.scaffold-bg{background:#FEF2F2}
.appbar{flex:none;background:#fff;padding-top:47px;position:relative;z-index:5}
.toolbar{height:56px;display:flex;align-items:center}
.lead{width:56px;height:56px;flex:none;display:flex;align-items:center;justify-content:center;color:rgba(0,0,0,.87)}
.ttl{flex:1;min-width:0;padding-left:16px;display:flex;flex-direction:column;justify-content:center}
.lead + .ttl{padding-left:16px}
.t1{font-size:20px;font-weight:600;color:rgba(0,0,0,.87);line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.t2{font-size:12px;color:rgba(0,0,0,.54);line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.actions{display:flex;flex:none}
.ibtn{width:48px;height:48px;display:flex;align-items:center;justify-content:center;color:rgba(0,0,0,.87)}
.body{flex:1;min-height:0;overflow-y:auto;scrollbar-width:none}
.body::-webkit-scrollbar{display:none}
.card{background:#fff;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.16),0 2px 6px rgba(0,0,0,.08)}
.lt{display:flex;align-items:center;min-height:72px;padding:8px 24px 8px 16px;gap:16px}
.lt-main{flex:1;min-width:0}
.lt-title{font-size:16px;font-weight:600;color:rgba(0,0,0,.87);line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lt-sub{font-size:14px;color:#1f1f1f;line-height:1.43}
.lt-sub.one{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lt-trail{flex:none;font-size:12px;color:rgba(0,0,0,.54)}
.av{width:40px;height:40px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:500}
.chip{display:inline-flex;align-items:center;height:36px;padding:0 20px;border-radius:16px;border:1px solid #000;background:rgba(251,191,36,.3);font-size:14px;font-weight:500;color:rgba(0,0,0,.87);white-space:nowrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:12px 24px;border-radius:8px;background:#f472b6;color:#fff;font-size:14px;font-weight:500;line-height:20px;white-space:nowrap}
.obtn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:10px 22px;border-radius:8px;border:2px solid #f472b6;color:#f472b6;background:transparent;font-size:14px;font-weight:500;line-height:20px;white-space:nowrap}
.tbtn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:8px 16px;color:#f472b6;font-size:14px;font-weight:500;line-height:20px;border-radius:20px;white-space:nowrap}
.fit{display:inline-block;white-space:nowrap;transform-origin:center center}
"""

SIGNAL = ('<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true">'
          '<rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/>'
          '<rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>')
WIFI = ('<svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">'
        '<path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.3-1.3C13.4 1.6 10.8.5 8 .5S2.6 1.6.7 3.4L2 4.7c1.6-1.5 3.7-2.4 6-2.4zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.3-1.3C11.5 4.8 9.8 4.1 8 4.1s-3.5.7-4.7 1.8l1.3 1.3c.9-.8 2.1-1.3 3.4-1.3zM8 9.4c-.5 0-1 .2-1.4.6L8 11.5l1.4-1.5c-.4-.4-.9-.6-1.4-.6z"/></svg>')
BATTERY = ('<svg width="27" height="13" viewBox="0 0 27 13" fill="currentColor" aria-hidden="true">'
           '<rect x="0.5" y="0.5" width="22" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/>'
           '<rect x="2" y="2" width="19" height="9" rx="2"/>'
           '<path d="M24 4.5v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2z" opacity=".4"/></svg>')
STATUS = (f'<div class="statusbar"><span class="time">9:41</span>'
          f'<span class="sys">{SIGNAL}{WIFI}{BATTERY}</span></div><div class="island"></div>')

# FittedBox(BoxFit.scaleDown) behaviour for the tile labels.
FIT_JS = ("document.querySelectorAll('.fit').forEach(function(el){"
          "var avail=el.parentElement.clientWidth;var w=el.scrollWidth;"
          "if(w>avail){el.style.transform='scale('+(avail/w).toFixed(3)+')';}});"
          "if(location.hash==='#scrolled'){var b=document.querySelector('.body');if(b){b.scrollTop=b.scrollHeight;}}")

def page(title, inner, extra_css=""):
    return f"""<!DOCTYPE html>
<html lang="{LANG}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{e(title)}</title>
<style>{CSS}{extra_css}</style>
</head>
<body>
<div class="device">
{inner}
{STATUS}
<div class="home-ind"></div>
</div>
<script>{FIT_JS}</script>
</body>
</html>
"""

def appbar(title, sub=None, actions=(), back=False, bottom=""):
    lead = f'<div class="lead">{ic("arrow_back_ios_new")}</div>' if back else ""
    sub_html = f'<div class="t2">{e(sub)}</div>' if sub else ""
    acts = "".join(f'<div class="ibtn">{ic(a)}</div>' for a in actions)
    return (f'<div class="appbar"><div class="toolbar">{lead}'
            f'<div class="ttl"><div class="t1">{e(title)}</div>{sub_html}</div>'
            f'<div class="actions">{acts}</div></div>{bottom}</div>')

# ---------------------------------------------------------------- 1. login
LOGIN_CSS = """
.login{flex:1;display:flex;align-items:center;justify-content:center;padding:47px 0 34px}
.lwrap{width:100%;padding:24px}
.lcard{margin:8px 16px;background:#fff;border-radius:16px;border:1px solid rgba(244,114,182,.3);box-shadow:0 5px 5px -3px rgba(0,0,0,.2),0 8px 10px 1px rgba(0,0,0,.14),0 3px 14px 2px rgba(0,0,0,.12);padding:24px;display:flex;flex-direction:column;align-items:center;text-align:center}
.lt1{margin-top:16px;font-size:28px;font-weight:700;color:rgba(0,0,0,.87);line-height:1.2}
.ltag{margin-top:8px;font-size:16px;font-style:italic;color:#757575;line-height:1.4}
.field{width:100%;height:52px;display:flex;align-items:center;border:1px solid #e0e0e0;border-radius:8px;background:#fff;color:#1f1f1f;text-align:left}
.field .pre{width:48px;display:flex;justify-content:center}
.field .lbl{flex:1;font-size:16px;color:#1f1f1f}
.field .suf{width:48px;display:flex;justify-content:center}
.signin{width:100%;height:48px;font-size:16px;font-weight:600;margin-top:24px}
.linfo{margin-top:16px;font-size:12px;color:rgba(0,0,0,.54);line-height:1.35}
"""

def login():
    info = e(t("Don't have an account yet?\nAsk your ward administrator for an invitation.")).replace("\n", "<br />")
    inner = f"""<div class="screen grad"><div class="login"><div class="lwrap"><div class="lcard">
{ic("favorite", 64, ROSE)}
<div class="lt1">{e(t("My Stake Friends"))}</div>
<div class="ltag">{e(t('"Hearts Knit in Unity"'))}</div>
<div class="field" style="margin-top:32px"><div class="pre">{ic("email_outlined")}</div><div class="lbl">{e(t("Email"))}</div></div>
<div class="field" style="margin-top:16px"><div class="pre">{ic("lock_outline")}</div><div class="lbl">{e(t("Password"))}</div><div class="suf">{ic("visibility_outlined")}</div></div>
<div class="btn signin">{e(t("Sign In"))}</div>
<div class="tbtn" style="margin-top:8px">{e(t("Forgot password?"))}</div>
<div class="linfo">{info}</div>
</div></div></div></div>"""
    return page(f"My Stake Friends – {t('Sign In')}", inner, LOGIN_CSS)

# ---------------------------------------------------------------- 2. dashboard
DASH_CSS = """
.dpad{padding:16px}
.grid{display:grid;grid-template-columns:1fr 1fr;column-gap:16px;row-gap:16px}
.cell{aspect-ratio:1/1;padding:8px 16px}
.tile{height:100%;background:#fff;border-radius:16px;border:2px solid;box-shadow:0 2px 4px -1px rgba(0,0,0,.2),0 4px 5px 0 rgba(0,0,0,.14),0 1px 10px 0 rgba(0,0,0,.12);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px;overflow:hidden}
.tl{width:100%;display:flex;justify-content:center}
.tt{font-size:16px;font-weight:700;color:rgba(0,0,0,.87);line-height:1.3}
.ts{font-size:12px;color:rgba(0,0,0,.54);line-height:1.35}
.sec{margin-top:24px}
.sec-h{display:flex;align-items:center;justify-content:space-between;min-height:40px}
.sec-t{font-size:18px;font-weight:700;color:rgba(0,0,0,.87)}
.list{margin-top:12px}
.list .card{margin-bottom:8px}
.banner{flex:none;margin:12px 12px 0;padding:12px 6px 12px 14px;background:#FFF8E1;border:1px solid #FFCA28;border-radius:12px;display:flex;align-items:flex-start}
.banner .bt{flex:1;min-width:0;margin-left:12px}
.banner .b1{font-size:14px;font-weight:600;color:rgba(0,0,0,.87);line-height:1.43}
.banner .b2{margin-top:4px;font-size:12px;color:rgba(0,0,0,.54);line-height:1.35}
.banner .btn{margin-top:8px}
.banner .x{width:48px;height:40px;display:flex;align-items:center;justify-content:center;color:#1f1f1f;flex:none;margin-top:-8px}
"""

BANNER_LINE1 = "You won't hear about new messages and activities from your circle."
BDAY_KEY = "🎂 {0}'s Birthday"
SMITH = "Smith's Home"

def tile(title, sub, icon, color, rgba):
    return (f'<div class="cell"><div class="tile" style="border-color:{rgba}">{ic(icon, 48, color)}'
            f'<div class="tl" style="margin-top:8px"><span class="fit tt">{e(title)}</span></div>'
            f'<div class="tl" style="margin-top:2px"><span class="fit ts">{e(sub)}</span></div></div></div>')

def chat_row(name, msg, when):
    return (f'<div class="card"><div class="lt"><div class="av" style="background:rgba(59,130,246,.2);color:{BLUE}">{e(name[0])}</div>'
            f'<div class="lt-main"><div class="lt-title">{e(name)}</div><div class="lt-sub one">{e(msg)}</div></div>'
            f'<div class="lt-trail">{e(when)}</div></div></div>')

def event_row(title, sub, birthday=False, today=False):
    if birthday:
        av = f'<div class="av" style="background:rgba(244,114,182,.2)">{ic("cake", 24, ROSE)}</div>'
    else:
        av = f'<div class="av" style="background:rgba(34,197,94,.2)">{ic("event", 24, GREEN)}</div>'
    trail = f'<div class="chip">{e(t("Today"))}</div>' if today else ""
    return (f'<div class="card"><div class="lt">{av}<div class="lt-main"><div class="lt-title">{e(title)}</div>'
            f'<div class="lt-sub one">{e(sub)}</div></div>{trail}</div></div>')

def dashboard_screen(banner=False):
    circle = t("Sunrise Circle")
    tiles = "".join([
        tile(t("My Circle"), f'{t("{0} members").format(8)}, {t("{0} visitor").format(1)}', "group", ROSE, "rgba(244,114,182,.3)"),
        tile(t("Chat"), t("{0} recent").format(3), "chat_bubble", BLUE, "rgba(59,130,246,.3)"),
        tile(t("Activities"), t("{0} upcoming").format(2), "event", GREEN, "rgba(34,197,94,.3)"),
        tile(t("My Profile"), t("Edit info"), "person", AMBER, "rgba(251,191,36,.3)"),
    ])
    chats = (chat_row("Jessica", t("I'll bring dessert 😊"), t("{0}m ago").format(2)) +
             chat_row("Emily", t("See everyone Thursday at 7!"), t("{0}m ago").format(12)))
    events = (event_row(t("🎂 {0}'s Birthday").format("Emily"), t("Today"), birthday=True, today=True) +
              event_row(t("Game Night"), "10/9/2026"))
    ban = ""
    if banner:
        ban = (f'<div class="banner">{ic("notifications_off_outlined", 24, "#FF8F00")}<div class="bt">'
               f'<div class="b1">{e(t("Notifications are turned off on this device"))}</div>'
               f'<div class="b2">{e(t(BANNER_LINE1))}</div>'
               f'<div class="b2">{e(t("Tap Open Settings, then Notifications, then turn on Allow Notifications."))}</div>'
               f'<div class="btn">{ic("settings_outlined", 18)}{e(t("Open Settings"))}</div></div>'
               f'<div class="x">{ic("close", 20)}</div></div>')
    return f"""<div class="screen">
{appbar(t("My Circle"), circle, ("campaign_outlined", "info_outline", "refresh", "logout"))}
<div class="screen-body grad" style="flex:1;min-height:0;display:flex;flex-direction:column">
{ban}
<div class="body"><div class="dpad">
<div class="grid">{tiles}</div>
<div class="sec"><div class="sec-h"><div class="sec-t">{e(t("Recent Chats"))}</div><div class="tbtn">{e(t("View All"))}</div></div>
<div class="list">{chats}</div></div>
<div class="sec"><div class="sec-h"><div class="sec-t">{e(t("Upcoming Activities"))}</div><div class="tbtn">{e(t("View All"))}</div></div>
<div class="list">{events}</div></div>
</div></div>
</div>
</div>"""

def dashboard():
    return page(f"My Stake Friends – {t('My Circle')}", dashboard_screen(), DASH_CSS)

def notif_banner():
    return page(f"My Stake Friends – {t('Notifications')}", dashboard_screen(banner=True), DASH_CSS)

# ---------------------------------------------------------------- 3. chat
CHAT_CSS = """
.clist{flex:1;min-height:0;overflow-y:auto;padding:16px;scrollbar-width:none}
.clist::-webkit-scrollbar{display:none}
.sep{display:flex;align-items:center;padding:12px 0}
.sep .ln{flex:1;height:1px;background:#e0e0e0}
.sep .lb{padding:0 12px;font-size:12px;font-weight:600;color:#757575}
.msg{display:flex;align-items:flex-start;padding-bottom:16px}
.msg.me{justify-content:flex-end}
.cav{width:32px;height:32px;border-radius:50%;background:rgba(59,130,246,.2);color:#1976D2;font-size:14px;display:flex;align-items:center;justify-content:center;flex:none;margin-right:8px}
.mcol{display:flex;flex-direction:column;align-items:flex-start;min-width:0}
.me .mcol{align-items:flex-end}
.mname{font-size:12px;font-weight:600;color:rgba(0,0,0,.54);padding-bottom:4px}
.bub{padding:12px;border-radius:16px;background:#EEEEEE;color:rgba(0,0,0,.87);font-size:15px;line-height:1.35}
.me .bub{background:#3b82f6;color:#fff}
.mtime{margin-top:4px;font-size:12px;color:#757575}
.seen{margin-top:2px;font-size:11px;color:#9E9E9E}
.typing{flex:none;padding:4px 16px;font-size:12px;font-style:italic;color:#757575}
.inbar{flex:none;background:#fff;box-shadow:0 -2px 4px rgba(0,0,0,.05);padding:8px 8px 42px;display:flex;align-items:center}
.inbar .ib{width:48px;height:48px;display:flex;align-items:center;justify-content:center;color:#1f1f1f;flex:none}
.tf{flex:1;min-width:0;height:38px;border:1px solid #e0e0e0;border-radius:8px;background:#fff;padding:0 16px;display:flex;align-items:center;font-size:15px;color:#9E9E9E}
.tf span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
"""

def incoming(name, text_, when):
    return (f'<div class="msg"><div class="cav">{e(name[0])}</div><div class="mcol">'
            f'<div class="mname">{e(name)}</div><div class="bub">{e(text_)}</div>'
            f'<div class="mtime">{e(when)}</div></div></div>')

def outgoing(text_, when, seen=False):
    s = f'<div class="seen">{e(t("Seen by all"))}</div>' if seen else ""
    return (f'<div class="msg me"><div class="mcol"><div class="bub">{e(text_)}</div>'
            f'<div class="mtime">{e(when)}</div>{s}</div></div>')

def chat():
    msgs = (outgoing(t("Happy birthday, Emily! 🎉"), t("about an hour ago")) +
            outgoing(t("Is our planning meeting still on this week?"), t("25 minutes ago"), seen=True) +
            incoming("Emily", t("See everyone Thursday at 7!"), t("12 minutes ago")) +
            incoming("Jessica", t("I'll bring dessert 😊"), t("2 minutes ago")))
    inner = f"""<div class="screen scaffold-bg">
{appbar(t("Sunrise Circle"), t("{0} members").format(8), ("format_size", "notifications_active"), back=True)}
<div class="clist">
<div class="sep"><div class="ln"></div><div class="lb">{e(t("Today"))}</div><div class="ln"></div></div>
{msgs}
</div>
<div class="typing">{e(t("{0} is typing…").format("Maria"))}</div>
<div class="inbar">
<div class="ib">{ic("attach_file")}</div><div class="ib">{ic("image")}</div>
<div class="tf"><span>{e(t("Type a message..."))}</span></div>
<div class="ib">{ic("open_in_full")}</div><div class="ib" style="color:{BLUE}">{ic("send")}</div>
</div>
</div>"""
    return page(f"My Stake Friends – {t('Chat')}", inner, CHAT_CSS)

# ---------------------------------------------------------------- 4. activities
ACT_CSS = """
.tabs{display:flex;height:48px;border-bottom:1px solid #000}
.tab{flex:1;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:500;color:#1f1f1f}
.tab span{position:relative}
.tab.sel{color:#f472b6}
.tab.sel span::after{content:'';position:absolute;left:0;right:0;bottom:-14px;height:3px;border-radius:3px 3px 0 0;background:#f472b6}
.alist{padding:16px}
.alist .card{margin-bottom:12px}
.thumb{width:52px;height:52px;border-radius:8px;flex:none;background:linear-gradient(135deg,#c4b5fd,#f9a8d4 55%,#fde68a);display:flex;align-items:center;justify-content:center;font-size:26px}
.loc{display:flex;align-items:center;gap:4px}
.fab{position:absolute;right:16px;bottom:50px;width:56px;height:56px;border-radius:16px;background:#f472b6;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 5px -1px rgba(0,0,0,.2),0 6px 10px 0 rgba(0,0,0,.14),0 1px 18px 0 rgba(0,0,0,.12);z-index:6}
.chip.sm{font-size:12px;height:34px}
"""

def activities():
    tabs = (f'<div class="tabs"><div class="tab sel"><span>{e(t("Upcoming"))}</span></div>'
            f'<div class="tab"><span>{e(t("Past"))}</span></div></div>')
    bday = (f'<div class="card"><div class="lt"><div class="av" style="background:rgba(244,114,182,.2)">{ic("cake", 24, ROSE)}</div>'
            f'<div class="lt-main"><div class="lt-title">{e(t(BDAY_KEY).format("Emily"))}</div>'
            f'<div class="lt-sub">{e(t("Oct 6, 2026"))}</div></div>'
            f'<div class="chip sm">{e(t("Today"))}</div></div></div>')
    game = (f'<div class="card"><div class="lt"><div class="thumb">🎲</div>'
            f'<div class="lt-main"><div class="lt-title">{e(t("Game Night"))}</div>'
            f'<div class="lt-sub">{e(t("Oct 9, 2026"))}</div><div class="lt-sub">{e(t("7:00 PM"))}</div>'
            f'<div class="lt-sub loc">{ic("location_on", 14, "rgba(0,0,0,.87)")}<span>{e(t(SMITH))}</span></div></div>'
            f'<div style="color:#1f1f1f">{ic("chevron_right")}</div></div></div>')
    inner = f"""<div class="screen scaffold-bg">
{appbar(t("Activities"), t("Sunrise Circle"), (), back=True, bottom=tabs)}
<div class="body"><div class="alist">{bday}{game}</div></div>
<div class="fab">{ic("add")}</div>
</div>"""
    return page(f"My Stake Friends – {t('Activities')}", inner, ACT_CSS)

# ---------------------------------------------------------------- 5. info dialog
DLG_CSS = """
.barrier{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.54);z-index:20;display:flex;align-items:center;justify-content:center}
.dialog{width:310px;background:#fff;border-radius:28px;box-shadow:0 11px 15px -7px rgba(0,0,0,.2),0 24px 38px 3px rgba(0,0,0,.14),0 9px 46px 8px rgba(0,0,0,.12);padding:24px 24px 24px}
.dtitle{display:flex;align-items:center;gap:12px;font-size:24px;line-height:1.33;color:#000;white-space:nowrap}
.dcontent{margin-top:16px;font-size:14px;color:#1f1f1f;line-height:1.43}
.dver{font-size:16px;color:rgba(0,0,0,.87);line-height:1.5}
.dtag{margin-top:16px;font-style:italic;color:#9E9E9E}
.dlabel{font-weight:600}
.langs{display:flex;gap:8px;margin-top:8px}
.langs > div{flex:1;padding-left:8px;padding-right:8px}
.nrow{display:flex;align-items:center;gap:8px;margin-top:6px;color:#388E3C;font-weight:600}
.dactions{display:flex;justify-content:flex-end;margin-top:24px;margin-right:-8px}
"""

def info_dialog():
    def lang_btn(label, code):
        if code == LANG:
            return f'<div class="btn">{ic("check", 16)}{e(label)}</div>'
        return f'<div class="obtn">{e(label)}</div>'
    dialog = f"""<div class="barrier"><div class="dialog" role="dialog">
<div class="dtitle">{ic("favorite", 40, ROSE)}<span>My Stake Friends</span></div>
<div class="dcontent">
<div class="dver">{e(t("Version"))} 1.1.34 (34)</div>
<div class="dtag">{e(t("Hearts Knit In Unity"))}</div>
<div class="dlabel" style="margin-top:24px">{e(t("Language"))}</div>
<div class="langs">{lang_btn("English", "en")}{lang_btn("Español", "es")}</div>
<div class="dlabel" style="margin-top:20px">{e(t("Notifications"))}</div>
<div class="nrow">{ic("notifications_active_outlined", 20, "#388E3C")}<span>{e(t("On"))}</span></div>
<div class="obtn" style="display:flex;width:100%;margin-top:24px">{ic("email_outlined", 18)}{e(t("Contact Developer"))}</div>
</div>
<div class="dactions"><div class="tbtn">{e(t("Close"))}</div></div>
</div></div>"""
    return page(f"My Stake Friends – {t('Version')}", dashboard_screen() + dialog, DASH_CSS + DLG_CSS)

# ---------------------------------------------------------------- 6. no circle
ERR_CSS = """
.err{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center}
.err .msg1{margin-top:16px;font-size:18px;font-weight:600;color:rgba(0,0,0,.87);line-height:1.35}
.err .btn{margin-top:24px}
"""

def no_circle():
    inner = f"""<div class="screen scaffold-bg">
{appbar("My Stake Friends", None, ("info_outline", "logout"))}
<div class="err">{ic("error_outline", 64, "#E57373")}
<div class="msg1">{e(t("Not assigned to a circle yet"))}</div>
<div class="btn">{e(t("Retry"))}</div></div>
</div>"""
    return page(f"My Stake Friends – {t('Retry')}", inner, ERR_CSS)

SCREENS = [
    ("app-login.html", login),
    ("app-dashboard.html", dashboard),
    ("app-chat.html", chat),
    ("app-activities.html", activities),
    ("app-info-dialog.html", info_dialog),
    ("app-no-circle.html", no_circle),
    ("app-notif-banner.html", notif_banner),
]

written = []
for lang in ("en", "es"):
    LANG = lang
    d = os.path.join(OUT, lang)
    os.makedirs(d, exist_ok=True)
    for fname, fn in SCREENS:
        p = os.path.join(d, fname)
        with open(p, "w", encoding="utf-8", newline="\n") as f:
            f.write(fn())
        written.append(p)
print("\n".join(written))
