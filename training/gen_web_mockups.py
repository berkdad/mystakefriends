"""Generate static HTML mockups of My Stake Friends web screens (EN + ES).

Class strings / DOM structure mirror src/App.jsx, src/components/circles/*,
src/components/SetupPassword.jsx and src/i18n/LanguageContext.jsx, with
responsive prefixes resolved to their desktop (>=1280px) values.
"""
import json, os, re, sys, html

ROOT = r"C:\firebaseProjects\mystakefriends"
OUT = os.path.join(ROOT, "training", "mockups")
HERE = os.path.dirname(os.path.abspath(__file__))
ES = json.load(open(os.path.join(HERE, "es.json"), encoding="utf-8"))

# ---- head block copied verbatim from public/index.html (lines 7-63) ----
_idx = open(os.path.join(ROOT, "public", "index.html"), encoding="utf-8").read().splitlines()
_start = next(i for i, l in enumerate(_idx) if 'cdn.tailwindcss.com' in l)
_end = next(i for i, l in enumerate(_idx) if l.strip() == '</style>')
HEAD_LINES = _idx[_start:_end + 1]
HEAD_LINES[0] = HEAD_LINES[0].lstrip()  # file must start with the <script> tag
HEAD = "\n".join(HEAD_LINES)
assert HEAD.startswith('<script src="https://cdn.tailwindcss.com"></script>')

# ---- translations not present in the app dictionary (demo content) ----
EXTRA_ES = {
    "Demo Stake": "Estaca Demo",
    "Demo Ward": "Barrio Demo",
    "Sunrise Circle": "Círculo Amanecer",
    "Book Lovers": "Amantes de los Libros",
    "ANNOUNCE_DRAFT": "Actividad de la Sociedad de Socorro este jueves a las 7:00 p. m. en el salón cultural. ¡Trae a una amiga!",
    "ANNOUNCE_LIVE": "¡Bienvenidas a My Stake Friends! Revisa tu círculo para ver los próximos eventos.",
}
EXTRA_EN = {
    "ANNOUNCE_DRAFT": "Relief Society activity this Thursday at 7:00 PM in the cultural hall. Bring a friend!",
    "ANNOUNCE_LIVE": "Welcome to My Stake Friends! Check your circle for upcoming events.",
}
# Strings the app renders untranslated in Spanish too (no dictionary key).
PASSTHROUGH = {"My Stake Friends", "English", "Español", "No"}

LANG = "en"
MISSING = set()


def T(s):
    """tr(): exact-key lookup in the app's esTranslations.js."""
    if LANG == "en":
        return EXTRA_EN.get(s, s)
    if s in ES:
        return ES[s]
    if s in EXTRA_ES:
        return EXTRA_ES[s]
    if s in PASSTHROUGH:
        return s
    MISSING.add(s)
    return s


def TF(tpl, args):
    out = T(tpl)
    for i, a in enumerate(args):
        out = out.replace("{%d}" % i, str(a))
    return out


def e(s):
    return html.escape(s, quote=True)


def cls(*parts):
    return " ".join(" ".join(parts).split())


# ---- Lucide icons (24x24, stroke 2, round caps/joins) ----
ICONS = {
    "heart": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
    "user": '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
    "user-plus": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line>',
    "mail": '<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>',
    "bell": '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>',
    "bell-off": '<path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5"></path><path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path><path d="m2 2 20 20"></path>',
    "megaphone": '<path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>',
    "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line>',
    "chevron-down": '<path d="m6 9 6 6 6-6"></path>',
    "chevron-up": '<path d="m18 15-6-6-6 6"></path>',
    "target": '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
    "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>',
    "send": '<path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>',
    "upload": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line>',
    "pen": '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>',
    "trash-2": '<path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line>',
    "arrow-right-left": '<path d="m16 3 4 4-4 4"></path><path d="M20 7H4"></path><path d="m8 21-4-4 4-4"></path><path d="M4 17h16"></path>',
    "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>',
    "crown": '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>',
    "more-vertical": '<circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle>',
    "play-circle": '<circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon>',
    "pause-circle": '<circle cx="12" cy="12" r="10"></circle><line x1="10" x2="10" y1="15" y2="9"></line><line x1="14" x2="14" y1="15" y2="9"></line>',
    "grip-vertical": '<circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>',
    "filter": '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>',
    "printer": '<polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect width="12" height="8" x="6" y="14"></rect>',
    "list": '<line x1="8" x2="21" y1="6" y2="6"></line><line x1="8" x2="21" y1="12" y2="12"></line><line x1="8" x2="21" y1="18" y2="18"></line><line x1="3" x2="3.01" y1="6" y2="6"></line><line x1="3" x2="3.01" y1="12" y2="12"></line><line x1="3" x2="3.01" y1="18" y2="18"></line>',
    "plus": '<path d="M5 12h14"></path><path d="M12 5v14"></path>',
    "search": '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>',
    "x": '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
    "alert-circle": '<circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line>',
    "smartphone": '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path>',
    "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
    "eye": '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle>',
}


def I(name, c):
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" '
            'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" '
            f'class="lucide lucide-{name} {c}">{ICONS[name]}</svg>')


# ---- demo data ----
# notif: 'on' | 'off' | 'no_report' | None ; youth: None | 'male' | 'female'
MEMBERS = {
    "anderson": dict(name="Anderson, Emily", email="emily.a@example.com", phone="(555) 010-2001", age=34, logged=True, notif="on"),
    "baker":    dict(name="Baker, Sarah", email="sarah.b@example.com", phone="(555) 010-2002", age=41, logged=False, notif=None),
    "clark":    dict(name="Clark, Jessica", email="jessica.c@example.com", phone="(555) 010-2003", age=29, logged=True, notif="off"),
    "davis":    dict(name="Davis, Amanda", email="amanda.d@example.com", phone="(555) 010-2004", age=52, logged=True, notif="no_report"),
    "evans":    dict(name="Evans, Rachel", email="rachel.e@example.com", phone="(555) 010-2005", age=38, logged=True, notif="on"),
    "foster":   dict(name="Foster, Megan", email="megan.f@example.com", phone="(555) 010-2006", age=45, logged=True, notif="on"),
    "garcia":   dict(name="Garcia, Maria", email="maria.g@example.com", phone="(555) 010-2007", age=33, logged=True, notif="on"),
    "hallj":    dict(name="Hall, Jennifer", email="jennifer.h@example.com", phone="(555) 010-2008", age=47, logged=True, notif="on"),
    "jacob":    dict(name="Hall, Jacob", email="jacob.h@example.com", phone="(555) 010-2009", age=16, logged=False, notif=None, gender="male"),
    "sofia":    dict(name="Garcia, Sofia", email="sofia.g@example.com", phone="(555) 010-2010", age=15, logged=True, notif="on", gender="female"),
    "irwin":    dict(name="Irwin, Laura", email="laura.i@example.com", phone="(555) 010-2011", age=36, logged=False, notif=None),
    "jones":    dict(name="Jones, Hannah", email="hannah.j@example.com", phone="(555) 010-2012", age=27, logged=False, notif=None),
}
for m in MEMBERS.values():
    m.setdefault("gender", "female")
    m["youth"] = m["age"] <= 17

OFF_SINCE = "10/14/2026"  # formatNotifDate() is always M/D/YYYY, in both languages


# ---- shared fragments ----
def language_toggle(extra=""):
    def btn(code, label):
        active = LANG == code
        c = cls("px-3 py-1 text-sm rounded-full transition-colors",
                "bg-primary-500 text-white font-medium" if active else "text-gray-600 hover:bg-gray-100")
        return f'<button class="{c}" aria-pressed="{"true" if active else "false"}">{e(label)}</button>'
    return (f'<div class="{cls("inline-flex items-center gap-1 border border-gray-200 rounded-full p-1 bg-white", extra)}" title="{e(T("Language"))}">'
            f'{btn("en", "English")}{btn("es", "Español")}</div>')


def menu_btn(icon, icon_cls, label):
    return (f'<button class="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50">'
            f'{I(icon, icon_cls)}{e(label)}</button>')


DIVIDER = '<div class="my-2 border-t border-gray-100"></div>'


def header(menu_open=False):
    chev = cls("w-4 h-4 transition-transform", "rotate-180" if menu_open else "")
    menu = ""
    if menu_open:
        menu = ('<div class="fixed inset-0 z-40"></div>'
                '<div class="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">'
                + menu_btn("users", "w-4 h-4 text-purple-500", T("My Dashboard"))
                + DIVIDER
                + menu_btn("user-plus", "w-4 h-4 text-blue-500", T("Stake Admins"))
                + menu_btn("user-plus", "w-4 h-4 text-green-500", T("Ward Admins"))
                + DIVIDER
                + menu_btn("mail", "w-4 h-4 text-primary-500", T("Email All Admins"))
                + menu_btn("mail", "w-4 h-4 text-orange-500", T("Email Ward"))
                + menu_btn("bell", "w-4 h-4 text-blue-500", T("Notify Ward"))
                + menu_btn("megaphone", "w-4 h-4 text-purple-500", T("Announcements"))
                + DIVIDER
                + menu_btn("log-out", "w-4 h-4", T("Sign Out"))
                + '</div>')
    return f'''<header class="bg-white shadow-sm border-b border-primary-100">
<div class="max-w-7xl mx-auto px-8 py-4">
<div class="flex items-center justify-between">
<div class="flex items-center gap-3">
{I("heart", "w-8 h-8 text-primary-500")}
<div>
<h1 class="text-2xl font-bold text-gray-800">My Stake Friends</h1>
<p class="text-sm text-gray-500">{e(T("Demo Stake"))}</p>
</div>
</div>
<div class="flex items-center gap-4">
{language_toggle()}
<div class="flex items-center gap-3">
<label class="text-sm font-medium text-gray-700">{e(T("View Ward:"))}</label>
<select class="text-sm font-medium text-gray-800 border border-gray-300 focus:ring-2 focus:ring-primary-500 rounded px-3 py-2">
<option value="all">{e(T("All Wards"))}</option>
<option value="demo-ward" selected>{e(T("Demo Ward"))}</option>
</select>
</div>
<div class="relative">
<button class="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
{e(T("Actions"))}
{I("chevron-down", chev)}
</button>
{menu}
</div>
</div>
</div>
</div>
</header>'''


def tiles(active):
    def tile(key, on_cls, off_cls, icon, icon_on, icon_off, sub_on, title, sub):
        is_on = active == key
        return (f'<button class="{cls("p-6 rounded-xl shadow-md border-2 transition-all", on_cls if is_on else off_cls)}">'
                f'{I(icon, cls("w-12 h-12 mx-auto mb-3", icon_on if is_on else icon_off))}'
                f'<h3 class="text-xl font-semibold mb-1">{e(title)}</h3>'
                f'<p class="{cls("text-sm", sub_on if is_on else "text-gray-600")}">{e(sub)}</p></button>')
    return ('<div class="grid grid-cols-4 gap-6 mb-8">'
            + tile("friends", "bg-primary-500 border-primary-600 text-white", "bg-white border-primary-100 text-gray-800 hover:border-primary-300",
                   "users", "text-white", "text-primary-500", "text-primary-100", T("Friends"), TF("{0} members", [24]))
            + tile("circles", "bg-green-500 border-green-600 text-white", "bg-white border-green-100 text-gray-800 hover:border-green-300",
                   "target", "text-white", "text-green-500", "text-green-100", T("Circles"), TF("{0} active circles", [3]))
            + tile("reports", "bg-amber-500 border-amber-600 text-white", "bg-white border-amber-100 text-gray-800 hover:border-amber-300",
                   "file-text", "text-white", "text-amber-500", "text-amber-100", T("Reports"), T("View analytics"))
            + tile("dropin", "bg-blue-500 border-blue-600 text-white", "bg-white border-blue-100 text-gray-800 hover:border-blue-300",
                   "heart", "text-white", "text-blue-500", "text-blue-100", T("Drop In"), T("Visit a circle"))
            + '</div>')


def notification_badge(code):
    styles = {
        "on": ("bg-green-100 text-green-700", T("Notifications on"), "bell"),
        "off": ("bg-red-100 text-red-700", T("Notifications off"), "bell-off"),
        "no_report": ("bg-gray-100 text-gray-500", T("No notification report"), "bell"),
    }
    c, label, icon = styles[code]
    since = (" " + TF("since {0}", [OFF_SINCE])) if code == "off" else ""
    if code == "no_report":
        title = T("No notification report yet. It appears after the member opens app version 1.1.33 or newer.")
    elif code == "on":
        title = f'{T("iPhone/iPad")}: {T("on")} ({TF("checked {0}", ["10/20/2026"])})'
    else:
        title = f'{T("iPhone/iPad")}: {T("off")} {TF("since {0}", [OFF_SINCE])} ({TF("checked {0}", ["10/19/2026"])})'
    return (f'<span class="{cls("inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full", c)}" title="{e(title)}">'
            f'{I(icon, "w-3 h-3")}{e(label + since)}</span>')


def member_card(m):
    if m["youth"]:
        border = "bg-blue-50 border-blue-300 hover:shadow-md" if m["gender"] == "male" else "bg-purple-50 border-purple-300 hover:shadow-md"
    else:
        border = "border-gray-200 hover:shadow-md"
    status = ('<span class="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">' + e(T("Active")) + '</span>'
              if m["logged"] else
              '<span class="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">' + e(T("Pending")) + '</span>')
    badge = notification_badge(m["notif"]) if (m["logged"] and m["notif"]) else ""
    invite = (f'<button class="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="{e(T("Send invitation"))}">{I("send", "w-4 h-4")}</button>'
              if not m["logged"] else "")
    return f'''<div class="{cls("border rounded-lg p-4 transition-all", border)}">
<div class="flex items-start justify-between mb-3">
<div class="flex items-start gap-3 flex-1">
<div class="relative">
<div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200">{I("user", "w-6 h-6 text-primary-400")}</div>
</div>
<div class="flex-1">
<h3 class="font-semibold text-gray-800 mb-1">{e(m["name"])}</h3>
<div class="flex gap-2 flex-wrap">{status}{badge}</div>
</div>
</div>
<div class="flex flex-col gap-1 items-end">
<div class="flex gap-1">{invite}<button class="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors">{I("pen", "w-4 h-4")}</button><button class="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">{I("trash-2", "w-4 h-4")}</button></div>
<button class="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="{e(T("Transfer to another ward"))}">{I("arrow-right-left", "w-4 h-4")}</button>
</div>
</div>
<div class="space-y-1 text-sm text-gray-600">
<div class="flex items-center gap-2">{I("mail", "w-3.5 h-3.5")}<span class="truncate">{e(m["email"])}</span></div>
<div class="flex items-center gap-2">{I("phone", "w-3.5 h-3.5 flex-shrink-0")}<span>{e(m["phone"])}</span></div>
</div>
</div>'''


FRIENDS_GRID = ["anderson", "baker", "clark", "davis", "sofia", "jacob"]


def friends_tab():
    opts = [("all", "Notifications: All members"), ("off", "Notifications off"),
            ("not_asked", "Notifications not turned on yet"), ("on", "Notifications on"),
            ("no_report", "No notification report")]
    options = "".join(f'<option value="{v}"{" selected" if v == "all" else ""}>{e(T(l))}</option>' for v, l in opts)
    cards = "\n".join(member_card(MEMBERS[k]) for k in FRIENDS_GRID)
    return f'''<div class="bg-white rounded-xl shadow-md border border-primary-100">
<div class="p-6 border-b border-gray-200">
<div class="flex items-center justify-between mb-4">
<h2 class="text-xl font-semibold text-gray-800">{e(T("Members"))}</h2>
<div class="flex gap-2">
<button class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">{I("send", "w-4 h-4")}{e(TF("Invite All ({0})", [5]))}</button>
<button class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">{I("upload", "w-4 h-4")}{e(T("Upload Roster"))}</button>
<button class="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">{I("user-plus", "w-4 h-4")}{e(T("Add Member"))}</button>
</div>
</div>
<div class="flex flex-row gap-3">
<input type="text" placeholder="{e(T("Search members..."))}" value="" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
<select class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" title="{e(T("Filter by notification status"))}">{options}</select>
</div>
<button class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm hover:bg-red-100 transition-colors">{I("bell-off", "w-4 h-4")}{e(TF("{0} members have notifications turned off. Show them", [2]))}</button>
</div>
<div class="p-6">
<div class="grid grid-cols-3 gap-4">
{cards}
</div>
</div>
</div>'''


# ---- circle manager ----
def draggable_member(m, captain=False, show_age=False, in_circle=False):
    bg = ("bg-blue-50" if m["gender"] == "male" else "bg-purple-50") if m["youth"] else "bg-white"
    c = cls("border rounded-lg p-3 shadow-sm transition-all", bg, "hover:shadow-md",
            "border-amber-300 bg-amber-50" if captain else "border-gray-200")
    age = (f'<div class="text-xs text-gray-500">{e(TF("Age: {0}", [m["age"]]))}</div>' if show_age else "")
    right = ""
    if in_circle:
        if not m["logged"]:
            right += (f'<button class="p-1.5 rounded transition-colors text-purple-500 hover:text-purple-700 hover:bg-purple-50" '
                      f'title="{e(T("Resend invite email"))}">{I("send", "w-4 h-4")}</button>')
        cap_cls = ("text-amber-500 hover:text-gray-400 hover:bg-gray-50" if captain
                   else "text-gray-400 hover:text-amber-500 hover:bg-amber-50")
        right += (f'<button class="{cls("p-1.5 rounded transition-colors", cap_cls)}" '
                  f'title="{e(T("Remove as captain") if captain else T("Set as captain"))}">'
                  f'{I("crown", cls("w-4 h-4", "fill-current" if captain else ""))}</button>')
    return f'''<div class="{c}">
<div class="flex items-start gap-3">
<div class="cursor-grab active:cursor-grabbing pt-1 transition-colors text-gray-400 hover:text-gray-600">{I("grip-vertical", "w-4 h-4")}</div>
<div class="flex flex-col gap-2 flex-1 min-w-0">
<div class="flex items-center gap-2">
<div class="flex-shrink-0"><div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200">{I("user", "w-5 h-5 text-primary-400")}</div></div>
<p class="text-sm font-medium text-gray-900 flex-1">{e(m["name"])}</p>
</div>
<div class="space-y-0.5 pl-0">
<div class="flex items-start gap-1.5 text-xs text-gray-600 min-w-0">{I("mail", "w-3 h-3 mt-0.5 flex-shrink-0")}<span class="truncate flex-1" title="{e(m["email"])}">{e(m["email"])}</span></div>
<div class="flex items-center gap-1.5 text-xs text-gray-600">{I("phone", "w-3 h-3 flex-shrink-0")}<span>{e(m["phone"])}</span></div>
{age}
</div>
</div>
<div class="flex flex-col items-end gap-1">{right}</div>
</div>
</div>'''


def member_filters():
    def sel(label, options):
        opts = "".join(f'<option value="{v}"{" selected" if i == 0 else ""}>{e(T(l))}</option>' for i, (v, l) in enumerate(options))
        return (f'<div><label class="block text-xs font-medium text-gray-700 mb-1">{e(T(label))}</label>'
                f'<select class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent">{opts}</select></div>')
    yn = [("all", "All"), ("yes", "Yes"), ("no", "No")]
    num = "w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    return ('<div class="border-b border-gray-200 p-4 space-y-4">'
            '<div class="flex items-center justify-between"><div class="flex items-center gap-2">'
            f'{I("filter", "w-4 h-4 text-gray-500")}<span class="text-sm font-medium text-gray-700">{e(T("Filters"))}</span></div></div>'
            + sel("Sort By", [("name", "Name"), ("age", "Age")])
            + f'<div><label class="block text-xs font-medium text-gray-700 mb-1">{e(T("Age Between"))}</label>'
              f'<div class="flex items-center gap-2"><input type="number" value="0" class="{num}" min="0" max="120">'
              f'<span class="text-sm text-gray-500">{e(T("to"))}</span>'
              f'<input type="number" value="120" class="{num}" min="0" max="120"></div></div>'
            + sel("Marital Status", [("all", "All"), ("single", "Single"), ("married", "Married"), ("widowed", "Widowed"), ("divorced", "Divorced")])
            + sel("Cultural Background", [("all", "All"), ("asian", "Asian"), ("black", "Black/African American"), ("hispanic", "Hispanic/Latino"),
                                          ("white", "White/Caucasian"), ("pacific islander", "Pacific Islander"), ("native american", "Native American"),
                                          ("middle eastern", "Middle Eastern"), ("other", "Other")])
            + sel("Has Children", yn) + sel("Has Email", yn)
            + sel("Account Status", [("all", "All"), ("yes", "Active"), ("no", "Pending")])
            + '</div>')


def circle_card(name, mode, member_keys, captain_key=None):
    members = [MEMBERS[k] for k in member_keys]
    captain = MEMBERS[captain_key] if captain_key else None
    regular = sorted([MEMBERS[k] for k in member_keys if k != captain_key], key=lambda m: m["name"])
    edit = mode == "edit"
    outer = cls("bg-white rounded-lg shadow-md border-2 overflow-hidden break-inside-avoid mb-4 transition-all", "flex flex-col",
                "border-yellow-400" if edit else "border-green-500")
    head = cls("p-4 flex-shrink-0", "border-b border-gray-200",
               "bg-gradient-to-r from-yellow-100 to-yellow-200" if edit else "bg-gradient-to-r from-green-100 to-green-200")
    mode_btn = cls("flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all",
                   "bg-yellow-500 text-white hover:bg-yellow-600" if edit else "bg-green-600 text-white hover:bg-green-700")
    mode_inner = (I("pause-circle", "w-4 h-4") + f'<span>{e(T("Edit Mode"))}</span>' if edit
                  else I("play-circle", "w-4 h-4") + f'<span>{e(T("Live"))}</span>')
    count = TF("{0} members", [len(members)]) if len(members) != 1 else TF("{0} member", [1])
    cap_span = (f'<span class="ml-2 text-primary-600">{e(TF("• Captain: {0}", [captain["name"]]))}</span>' if captain else "")
    body = '<div class="space-y-2">'
    if captain:
        body += ('<div class="mb-4"><div class="flex items-center gap-2 mb-2">' + I("crown", "w-4 h-4 text-amber-500")
                 + f'<span class="text-xs font-semibold text-gray-600 uppercase">{e(T("Captain"))}</span></div>'
                 + draggable_member(captain, captain=True, in_circle=True) + '</div>')
    if regular:
        body += '<div>'
        if captain:
            body += ('<div class="flex items-center gap-2 mb-2">' + I("users", "w-4 h-4 text-gray-400")
                     + f'<span class="text-xs font-semibold text-gray-600 uppercase">{e(T("Members"))}</span></div>')
        body += "".join(draggable_member(m, in_circle=True) for m in regular) + '</div>'
    body += '</div>'
    return f'''<div class="{outer}">
<div class="{head}">
<div class="flex items-center justify-between mb-2">
<h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">{I("users", "w-5 h-5 text-primary-500")}{e(T(name))}</h3>
<div class="flex items-center gap-1">
<button class="p-1.5 text-gray-600 hover:bg-white rounded transition-colors" title="{e(T("Collapse circle"))}">{I("chevron-up", "w-5 h-5")}</button>
<button class="{mode_btn}" title="{e(T("Click to go Live and send notifications") if edit else T("Click to Edit mode"))}">{mode_inner}</button>
<div class="relative"><button class="p-1.5 text-gray-600 hover:bg-white rounded transition-colors" title="{e(T("Circle options"))}">{I("more-vertical", "w-5 h-5")}</button></div>
</div>
</div>
<p class="text-sm text-gray-600">{e(count)}{cap_span}</p>
</div>
<div class="flex-1 p-4 min-h-24">{body}</div>
</div>'''


def circle_manager(available, book_lovers, modal=""):
    avail = [MEMBERS[k] for k in available]
    avail_html = "".join(draggable_member(m, show_age=True) for m in avail)
    circles = (circle_card("Sunrise Circle", "live", ["anderson", "baker", "clark", "davis", "evans"], captain_key="anderson")
               + circle_card("Book Lovers", "edit", book_lovers))
    return f'''<div class="h-full flex flex-col">
<div class="flex-1 flex gap-6 overflow-y-auto">
<div class="w-80 flex flex-col bg-white rounded-lg shadow-md border border-gray-200 flex-shrink-0">
<div class="p-4 border-b border-gray-200 bg-primary-50 flex-shrink-0">
<h3 class="font-semibold text-gray-800 flex items-center gap-2">{I("target", "w-5 h-5 text-primary-500")}{e(T("Available Members"))}</h3>
<p class="text-sm text-gray-600 mt-1">{e(TF("{0} of {1} shown", [len(avail), len(avail)]))}</p>
</div>
<div class="flex-shrink-0">{member_filters()}</div>
<div class="p-4 space-y-2 transition-all overflow-y-auto flex-1 border border-transparent">{avail_html}</div>
</div>
<div class="flex-1 flex flex-col min-w-0">
<div class="mb-4 flex-shrink-0">
<div class="flex items-center justify-between mb-3">
<h2 class="text-xl font-semibold text-gray-800">{e(T("Friendship Circles"))} (2)</h2>
<div class="flex items-center gap-2">
<button class="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" title="{e(T("Print Circles PDF"))}">{I("printer", "w-4 h-4")}<span class="inline">{e(T("Print"))}</span></button>
<button class="flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors border-gray-300 text-gray-700 hover:bg-gray-50" title="{e(T("Switch to Compact View"))}">{I("list", "w-4 h-4")}<span class="inline">{e(T("Compact View"))}</span></button>
<button class="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" title="{e(T("Collapse All"))}">{I("chevron-up", "w-4 h-4")}<span class="inline">{e(T("Collapse All"))}</span></button>
<button class="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">{I("plus", "w-4 h-4")}{e(T("Create Circle"))}</button>
</div>
</div>
<div class="flex items-center gap-2">
<div class="relative flex-1 max-w-md">
{I("search", "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400")}
<input type="text" value="" placeholder="{e(T("Find circles or members..."))}" class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
</div>
</div>
</div>
<div class="columns-3 gap-4 pb-4 [column-fill:balance]">
{circles}
</div>
</div>
</div>
{modal}
</div>'''


def confirm_live_modal():
    circle = T("Book Lovers")
    added = [MEMBERS["irwin"], MEMBERS["jones"]]
    existing = [MEMBERS["foster"], MEMBERS["garcia"], MEMBERS["hallj"]]
    added_html = "".join(f'''<div class="flex items-start gap-3">
<div class="flex-shrink-0"><div class="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center border-2 border-green-300">{I("user-plus", "w-5 h-5 text-green-700")}</div></div>
<div class="flex-1 min-w-0">
<p class="font-medium text-gray-900">{e(m["name"])}</p>
<p class="text-sm text-gray-600 truncate">{e(m["email"])}</p>
<div class="flex items-center gap-4 mt-2">
<div class="flex items-center gap-1 text-xs text-green-700">{I("smartphone", "w-3 h-3")}<span>{e(TF('Push: "Welcome to {0}!"', [circle]))}</span></div>
<div class="flex items-center gap-1 text-xs text-green-700">{I("mail", "w-3 h-3")}<span>{e(T("Email: Welcome message"))}</span></div>
</div>
</div>
</div>''' for m in added)
    existing_html = "".join(f'''<div class="flex items-center gap-2">
<div class="flex-shrink-0"><div class="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">{I("users", "w-4 h-4 text-blue-700")}</div></div>
<p class="text-sm text-gray-900">{e(m["name"])}</p>
</div>''' for m in existing)
    added_names = ", ".join(m["name"] for m in added)
    total = len(added) + len(existing)
    return f'''<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
<div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
<div class="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
<div class="flex items-start justify-between">
<div class="flex items-start gap-3">
{I("play-circle", "w-7 h-7 text-green-600 flex-shrink-0 mt-1")}
<div>
<h2 class="text-xl font-bold text-gray-800">{e(T("Switch to Live Mode?"))}</h2>
<p class="text-sm text-gray-600 mt-1">{e(circle)}</p>
</div>
</div>
<button class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors">{I("x", "w-5 h-5")}</button>
</div>
</div>
<div class="flex-1 overflow-y-auto p-6 space-y-6">
<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
<div class="flex items-start gap-3">
{I("alert-circle", "w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5")}
<div>
<h3 class="font-semibold text-amber-900">{e(T("Notifications Will Be Sent"))}</h3>
<p class="text-sm text-amber-800 mt-1">{e(T("The following members will receive notifications (both push and email):"))}</p>
</div>
</div>
</div>
<div class="space-y-3">
<div class="flex items-center gap-2">{I("user-plus", "w-5 h-5 text-green-600")}<h3 class="font-semibold text-gray-800">{e(TF("New Members Added ({0})", [len(added)]))}</h3></div>
<div class="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
{added_html}
</div>
</div>
<div class="space-y-3">
<div class="flex items-center gap-2">{I("users", "w-5 h-5 text-blue-600")}<h3 class="font-semibold text-gray-800">{e(TF("Existing Members ({0})", [len(existing)]))}</h3></div>
<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
<div class="space-y-2">
{existing_html}
</div>
<div class="mt-3 pt-3 border-t border-blue-300">
<div class="space-y-1">
<div class="flex items-start gap-2 text-xs text-blue-700">{I("smartphone", "w-3 h-3 mt-0.5 flex-shrink-0")}<span>{e(TF('Push & Email: "{0} were added to your circle"', [added_names]))}</span></div>
</div>
</div>
</div>
</div>
<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
<h4 class="font-semibold text-gray-800 text-sm mb-2">{e(T("What happens in Live mode:"))}</h4>
<ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
<li>{e(T("Circle is marked as active and finalized"))}</li>
<li>{e(T("Members can see and interact with the circle"))}</li>
<li>{e(T("You can switch back to Edit mode anytime to make more changes"))}</li>
</ul>
</div>
</div>
<div class="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
<button class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium">{e(T("Cancel"))}</button>
<button class="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">{I("play-circle", "w-5 h-5")}{e(TF("Confirm & Send {0} Notifications", [total]))}</button>
</div>
</div>
</div>'''


def messages_modal():
    scope = T("Demo Ward")  # scope='ward' because a specific ward is selected
    durations = ["1 day", "3 days", "1 week", "2 weeks", "1 month", "Until I turn it off"]
    opts = "".join(f'<option value="{e(d)}"{" selected" if d == "1 week" else ""}>{e(T(d))}</option>' for d in durations)
    return f'''<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
<div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
<div class="p-6 border-b border-gray-200 flex items-center justify-between">
<div>
<h2 class="text-xl font-bold text-gray-800">{e(T("Announcements"))}</h2>
<p class="text-sm text-gray-500 mt-1">{I("megaphone", "w-4 h-4 inline mr-1")}{e(TF("Banner shown in the app to {0}", [scope]))}</p>
</div>
<button class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">{I("x", "w-5 h-5")}</button>
</div>
<div class="flex-1 overflow-y-auto p-6 space-y-6">
<div class="space-y-3">
<textarea rows="3" maxlength="500" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" placeholder="{e(TF("Write an announcement for {0}...", [scope]))}">{e(T("ANNOUNCE_DRAFT"))}</textarea>
<div class="flex items-center gap-3">
<label class="text-sm text-gray-600">{e(T("Show for:"))}</label>
<select class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">{opts}</select>
<button class="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 ml-auto">{I("plus", "w-4 h-4")}{e(T("Post"))}</button>
</div>
</div>
<div class="space-y-2">
<h3 class="text-sm font-semibold text-gray-700">{e(T("Current messages"))}</h3>
<div class="border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3">
<div class="flex-1 min-w-0">
<p class="text-sm text-gray-800 whitespace-pre-wrap">{e(T("ANNOUNCE_LIVE"))}</p>
<p class="text-xs text-gray-500 mt-1">{e(T("Demo Ward"))} · Emily Anderson · <span class="text-green-600">{e(T("Active"))}</span></p>
</div>
<div class="flex items-center gap-2 shrink-0">
<button class="px-2 py-1 text-xs rounded-lg border text-gray-600 border-gray-300 hover:bg-gray-50">{e(T("Turn off"))}</button>
<button class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="{e(T("Delete"))}">{I("trash-2", "w-4 h-4")}</button>
</div>
</div>
</div>
</div>
<div class="p-6 border-t border-gray-200 flex justify-end">
<button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">{e(T("Close"))}</button>
</div>
</div>
</div>'''


def dashboard(active="friends", menu_open=False, content="", trailing=""):
    return f'''<div class="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-tertiary-50">
{header(menu_open)}
<main class="max-w-7xl mx-auto px-8 py-8">
{tiles(active)}
{content}
</main>
{trailing}
</div>'''


# ---- screens ----
def s_login():
    return f'''<div class="min-h-screen bg-gradient-to-br from-primary-100 via-accent-50 to-tertiary-100 flex items-center justify-center p-4">
<div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-primary-200 relative">
<div class="absolute top-4 right-4">{language_toggle()}</div>
<div class="text-center mb-8 pt-6">
{I("heart", "w-16 h-16 text-primary-500 mx-auto mb-4")}
<h1 class="text-3xl font-bold text-gray-800 mb-2">My Stake Friends</h1>
<p class="text-gray-600 italic">{e(T('"Hearts Knit in Unity"'))}</p>
</div>
<div class="space-y-4">
<div>
<label class="block text-sm font-medium text-gray-700 mb-1">{e(T("Email"))}</label>
<input type="email" value="emily.a@example.com" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
</div>
<div>
<label class="block text-sm font-medium text-gray-700 mb-1">{e(T("Password"))}</label>
<input type="password" value="demodemo" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
</div>
<button class="w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 font-medium">{e(T("Sign In"))}</button>
<div class="text-center">
<button class="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors">{e(T("Forgot Password?"))}</button>
</div>
</div>
</div>
</div>'''


def s_setup_password():
    lock = I("lock", "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400")
    return f'''<div class="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-tertiary-50 flex items-center justify-center p-4">
<div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-8">
<div class="absolute top-4 right-4">{language_toggle()}</div>
<div class="text-center mb-8">
<div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">{I("heart", "w-8 h-8 text-white")}</div>
<h1 class="text-2xl font-bold text-gray-800 mb-2">{e(T("Set Your Password"))}</h1>
<p class="text-gray-600">{e(TF("Welcome to {0}", ["My Stake Friends"]))}</p>
<p class="text-sm text-gray-500 italic mt-1">"{e(T("Hearts Knit in Unity"))}"</p>
</div>
<form class="space-y-4">
<div>
<label class="block text-sm font-medium text-gray-700 mb-1">{e(T("New Password"))}</label>
<div class="relative">
{lock}
<input type="password" value="" class="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="{e(T("Enter your password"))}" required>
<button type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">{I("eye", "w-5 h-5")}</button>
</div>
<p class="text-xs text-gray-500 mt-1">{e(T("At least 8 characters with uppercase, lowercase, and numbers"))}</p>
</div>
<div>
<label class="block text-sm font-medium text-gray-700 mb-1">{e(T("Confirm Password"))}</label>
<div class="relative">
{lock}
<input type="password" value="" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="{e(T("Confirm your password"))}" required>
</div>
</div>
<button type="submit" class="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-medium hover:from-primary-600 hover:to-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{e(T("Set Password & Sign In"))}</button>
</form>
<p class="text-center text-sm text-gray-500 mt-6">{e(T("Already have an account?"))} <button class="text-primary-600 hover:text-primary-700 font-medium">{e(T("Sign In"))}</button></p>
</div>
</div>'''


BUILDER_AVAIL = ["jacob", "sofia", "jones"]
BUILDER_BOOK = ["foster", "garcia", "hallj", "irwin"]

SCREENS = {
    "web-login.html": s_login,
    "web-admin-dashboard.html": lambda: dashboard("friends", True, friends_tab()),
    "web-friends-tab.html": lambda: dashboard("friends", False, friends_tab()),
    "web-circle-builder.html": lambda: dashboard("circles", False, circle_manager(BUILDER_AVAIL, BUILDER_BOOK)),
    # Jones, Hannah has just been dragged into Book Lovers (2 added since last Live snapshot of 3)
    "web-golive-modal.html": lambda: dashboard("circles", False,
                                                circle_manager(["jacob", "sofia"], BUILDER_BOOK + ["jones"], confirm_live_modal())),
    "web-announcements-modal.html": lambda: dashboard("friends", False, friends_tab(), messages_modal()),
    "web-setup-password.html": s_setup_password,
}


def page(body):
    return (HEAD + "\n"
            '<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            '<title>My Stake Friends</title>\n'
            '<style>body{width:1280px;margin:0}</style>\n'
            f'<body lang="{LANG}">\n<div id="root">\n{body}\n</div>\n</body>\n')


def main():
    global LANG
    written = []
    for lang in ("en", "es"):
        LANG = lang
        d = os.path.join(OUT, lang)
        os.makedirs(d, exist_ok=True)
        for fn, fn_body in SCREENS.items():
            out = page(fn_body())
            # Non-ASCII as numeric entities: charset-proof even though <meta charset>
            # sits after the >1KB tailwind config block.
            out = out.encode("ascii", "xmlcharrefreplace").decode("ascii")
            p = os.path.join(d, fn)
            with open(p, "w", encoding="ascii", newline="\n") as f:
                f.write(out)
            written.append(p)
    if MISSING:
        print("MISSING ES:", sorted(MISSING), file=sys.stderr)
        sys.exit(1)
    print(json.dumps(written, indent=1))


if __name__ == "__main__":
    main()
