import feedparser, json, os, re
from urllib.parse import urlparse, urlunparse
import requests
from bs4 import BeautifulSoup

TIMEOUT = 10

feeds = {
    "onair-graphics": {
        "Ross Video": "https://www.rossvideo.com/company/news/rss/",
        "Vizrt": "https://www.vizrt.com/rss.xml",
        "Maxon": "https://www.maxon.net/en/rss"
    },
    "newsroom": {
        "Avid": "https://www.avid.com/rss",
        "TVBEurope": "https://www.tvbeurope.com/feed"
    },
    "playout": {
        "Grass Valley": "https://www.grassvalley.com/blog/feed/",
        "Pebble": "https://www.pebble.tv/feed/"
    },
    "ip-video": {
        "SMPTE": "https://www.smpte.org/rss.xml"
    },
    "audio": {
        "Calrec": "https://calrec.com/feed/"
    },
    "cloud-ai": {
        "AWS Media": "https://aws.amazon.com/blogs/media/feed/"
    }
}

def clean(text: str) -> str:
    if not text:
        return ""
    text = BeautifulSoup(text, "html.parser").get_text(" ", strip=True)
    text = text.replace("\n", " ").replace("\r", " ").strip()
    return text

def prefer_https(url: str) -> str:
    if not url:
        return ""
    try:
        p = urlparse(url)
        if p.scheme == "http":
            return urlunparse(("https",) + p[1:])
    except:
        pass
    return url

def looks_like_image(url: str) -> bool:
    if not url:
        return False
    return bool(re.search(r"\\.(jpg|jpeg|png|gif|webp|avif)(\\?|$)", url, re.I))

def extract_from_entry(e):
    # Try: media_content
    try:
        for m in getattr(e, "media_content", []):
            u = prefer_https(m.get("url", ""))
            if looks_like_image(u):
                return u
    except:
        pass

    # Try: media_thumbnail
    try:
        for m in getattr(e, "media_thumbnail", []):
            u = prefer_https(m.get("url", ""))
            if looks_like_image(u):
                return u
    except:
        pass

    # Try: enclosures
    try:
        for enc in getattr(e, "enclosures", []):
            u = prefer_https(enc.get("href") or enc.get("url", ""))
            if looks_like_image(u):
                return u
    except:
        pass

    # Try HTML content
    try:
        blocks = []
        if hasattr(e, "content"):
            blocks = [c.value for c in e.content]
        elif hasattr(e, "summary"):
            blocks = [e.summary]

        for html in blocks:
            soup = BeautifulSoup(html, "html.parser")
            img = soup.find("img")
            if img and img.get("src"):
                u = prefer_https(img["src"])
                if looks_like_image(u):
                    return u
    except:
        pass

    return ""

def extract_og(link):
    try:
        r = requests.get(link, timeout=TIMEOUT, headers={"User-Agent": "Mozilla"})
        if r.status_code != 200:
            return ""
        soup = BeautifulSoup(r.text, "html.parser")
        tag = soup.find("meta", property="og:image") or \
              soup.find("meta", attrs={"name": "twitter:image"}) or \
              soup.find("meta", attrs={"name": "twitter:image:src"})
        if tag:
            u = prefer_https(tag.get("content", ""))
            if looks_like_image(u):
                return u
    except:
        pass
    return ""

os.makedirs("data", exist_ok=True)

for category, sources in feeds.items():
    items = []
    for source, url in sources.items():
        feed = feedparser.parse(url)

        for e in feed.entries[:12]:
            title = clean(getattr(e, "title", ""))
            link = getattr(e, "link", "").strip()

            image = extract_from_entry(e)
            if not image:
                image = extract_og(link)

            image = prefer_https(image)

            items.append({
                "title": title,
                "link": link,
                "source": source,
                "image": image
            })

    with open(f"data/{category}.json", "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    print(f"{category}: {len(items)} items")
