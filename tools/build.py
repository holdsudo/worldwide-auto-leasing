#!/usr/bin/env python3
"""Assemble the static site: src/pages/*.html + src/partials -> repo root.

Usage:  python3 tools/build.py
Every page fragment may start with a header block of `key: value` lines
terminated by a line containing only `---`. Tokens like {{title}} are replaced
from SITE + the page header. Edit SITE below to change business details
everywhere at once.
"""
import pathlib, re, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

SITE = {
    "name": "Worldwide Auto Leasing",
    "domain": "worldwideautoleasing.com",
    "url": "https://worldwideautoleasing.com",
    "phone": "(732) 534-4430",
    "phone_tel": "+17325344430",
    "email": "info@worldwideautoleasing.com",   # TODO confirm
    "address": "Serving New York, New Jersey & Pennsylvania",  # TODO street address
    "hours": "Mon–Fri 9am–7pm · Sat 10am–5pm",
    "tagline": "Making Dreams Come True… Worldwide Serving NY-NJ-PA",
    "year": str(datetime.date.today().year),
    "form_endpoint": "https://formsubmit.co/ajax/info@worldwideautoleasing.com",  # TODO swap for your own handler
}

def parse(fragment: str):
    meta, body = {}, fragment
    if "\n---\n" in fragment:
        head, body = fragment.split("\n---\n", 1)
        for line in head.splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
    return meta, body

def render(text: str, ctx: dict) -> str:
    return re.sub(r"\{\{\s*([a-z_]+)\s*\}\}", lambda m: str(ctx.get(m.group(1), "")), text)

def main():
    header = (SRC / "partials" / "header.html").read_text()
    footer = (SRC / "partials" / "footer.html").read_text()
    pages = sorted((SRC / "pages").glob("*.html"))
    for page in pages:
        meta, body = parse(page.read_text())
        ctx = {**SITE, "slug": page.stem, "body_class": "", "head_extra": "", "scripts": "",
               "description": SITE["tagline"], **meta}
        ctx["nav_" + ctx["slug"].replace("-", "_")] = ' aria-current="page"'
        html = render(header + body + footer, ctx)
        out = ROOT / page.name
        out.write_text(html)
        print("wrote", out.relative_to(ROOT), len(html), "bytes")
    # sitemap
    urls = "".join(f"  <url><loc>{SITE['url']}/{'' if p.stem=='index' else p.name}</loc></url>\n" for p in pages if p.stem not in ("404", "thank-you"))
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE['url']}/sitemap.xml\n")

if __name__ == "__main__":
    main()
