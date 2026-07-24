#!/usr/bin/env python3
"""Validate static HTML pages for parseability and local link integrity."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
HTML_GLOBS = ("*.html", "articles/*.html")

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for attr in ("href", "src"):
            if attr in attrs:
                self.links.append((tag, attr, attrs[attr]))

def iter_html_files():
    seen = set()
    for pattern in HTML_GLOBS:
        for path in ROOT.glob(pattern):
            if path not in seen:
                seen.add(path)
                yield path

def is_external_or_virtual(url):
    return url.startswith(("http", "mailto:", "tel:", "data:", "#", "?", "//"))

def main():
    broken = []
    html_files = list(iter_html_files())
    for html_file in html_files:
        content = html_file.read_text(encoding="utf-8", errors="ignore")
        parser = LinkParser()
        parser.feed(content)
        for _tag, _attr, url in parser.links:
            if is_external_or_virtual(url):
                continue
            target = (html_file.parent / urlparse(url).path).resolve()
            if not target.exists():
                broken.append(f"{html_file.relative_to(ROOT)} -> {url}")
    if broken:
        print("Broken local links found:")
        print("\n".join(broken))
        raise SystemExit(1)
    print(f"Validated {len(html_files)} HTML files; no broken local href/src links found.")

if __name__ == "__main__":
    main()
