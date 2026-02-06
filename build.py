# build.py
# Streamic: simple RSS/HTML -> JSON builder (no external deps)
# Writes normalized lists your front-end already expects:
#   title, link, source, image

import json, sys, time, urllib.request, urllib.error, xml.etree.ElementTree as ET
from html import unescape

USER_AGENT = ("Mozilla/5.0 (X11; Linux x86_64) "
              "AppleWebKit/537.36 (KHTML, like Gecko) "
              "Chrome/122.0 Safari/537.36")

def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def try_text(n, path, default=""):
    el = n.find(path)
    return (el.text or "").strip() if el is not None and el.text else default

def find_image_rss(item):
    # Try media thumbnails
    img = None
    # Common media namespaces
    media = "{http://search.yahoo.com/mrss/}"
    if item.find(f"{media}thumbnail") is not None:
        img = item.find(f"{media}thumbnail").get("url")
        if img: return img
    if item.find(f"{media}content") is not None:
        img = item.find(f"{media}content").get("url")
        if img: return img
    # enclosure
    enc = item.find("enclosure")
    if enc is not None and enc.get("type", "").startswith("image/"):
        return enc.get("url")
    # content:encoded with <img>
    content = item.find("{http://purl.org/rss/1.0/modules/content/}encoded")
    if content is not None and content.text:
        txt = content.text
    else:
        txt = try_text(item, "description", "")
    # crude img src pull
    if txt:
        txt = unescape(txt)
        lower = txt.lower()
        i = lower.find("<img ")
        if i != -1:
            src_pos = lower.find("src=", i)
            if src_pos != -1:
                quote = txt[src_pos+4:src_pos+5]
                if quote in "\"'":
                    end = txt.find(quote, src_pos+5)
                    if end != -1:
                        return txt[src_pos+5:end]
    return ""

def parse_rss(xml_bytes):
    # Try RSS or Atom
    items = []
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        return items

    # Namespaces
    atom = "{http://www.w3.org/2005/Atom}"

    # RSS
    chan = root.find("channel")
    if chan is not None:
        source_title = try_text(chan, "title", "Source")
        for it in chan.findall("item"):
            title = try_text(it, "title", "Untitled")
            link = try_text(it, "link", "")
            img = find_image_rss(it)
            items.append({
                "title": title,
                "link": link,
                "source": source_title,
                "image": img or ""
            })
        return items

    # Atom
    if root.tag == f"{atom}feed":
        source_title = try_text(root, f"{atom}title", "Source")
        for it in root.findall(f"{atom}entry"):
            title = try_text(it, f"{atom}title", "Untitled")
            link = ""
            for l in it.findall(f"{atom}link"):
                if l.get("rel") in (None, "alternate"):
                    link = l.get("href", "") or link
            # images not standardized in Atom; skip
            items.append({
                "title": title,
                "link": link,
                "source": source_title,
                "image": ""
            })
        return items

    return items

def normalize_and_trim(items, dedupe=True, limit=50):
    # dedupe by link
    if dedupe:
        seen, out = set(), []
        for it in items:
            lk = it.get("link","")
            if lk and lk not in seen:
                seen.add(lk); out.append(it)
        items = out
    return items[:limit]

def build_feed(out_file, sources):
    """
    sources: list of dicts {type, url, label}
      type='rss' -> fetch & parse RSS
      type='openrss' -> fetch generated RSS from Open RSS
    """
    all_items = []
    for src in sources:
        url = src["url"]
        try:
            data = fetch(url)
            items = parse_rss(data)
            # If generator feed provides no title, force label
            if src.get("label"):
                for x in items:
                    x["source"] = src["label"]
            all_items.extend(items)
            time.sleep(0.3)
        except urllib.error.URLError:
            continue
        except Exception:
            continue

    all_items = normalize_and_trim(all_items, limit=60)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)
    print(f"Wrote {out_file} ({len(all_items)} items)")

def main():
    # ---------- 3D & VFX (Maxon + Autodesk) ----------
    # Maxon News has no public RSS → use Open RSS generator
    # Ref: Maxon News hub; Open RSS makes a standards feed from any site. 
    # (If Maxon later exposes an official feed, drop it here.)
    three_d_vfx_sources = [
        {"type": "openrss",
         "label": "Maxon News",
         "url": "https://openrss.org/www.maxon.net/en/news"},
        {"type": "rss",
         "label": "Autodesk Design & Make",
         "url": "https://www.autodesk.com/design-make/rss"}
    ]

    # ---------- Editing & Post (Adobe + Frame.io) ----------
    # Adobe Blog “News” doesn’t publish a straightforward RSS; prefer Newsroom if Adobe publishes one later.
    # Using Frame.io’s official RSS plus Adobe Blog page via Open RSS for now.
    edit_post_sources = [
        {"type": "openrss",
         "label": "Adobe Blog – News",
         "url": "https://openrss.org/blog.adobe.com/en/topics/news"},
        {"type": "rss",
         "label": "Frame.io Insider",
         "url": "https://blog.frame.io/feed/"}
    ]

    # ---------- Hardware/IT (TV Technology) ----------
    # TVTechnology site confirmed; if native feed not exposed, use Open RSS safely.
    hw_it_sources = [
        {"type": "openrss",
         "label": "TVTechnology",
         "url": "https://openrss.org/www.tvtechnology.com"}
    ]

    build_feed("data/out-3d-vfx.json", three_d_vfx_sources)
    build_feed("data/out-editing.json", edit_post_sources)
    build_feed("data/out-hardware.json", hw_it_sources)

if __name__ == "__main__":
    main()
