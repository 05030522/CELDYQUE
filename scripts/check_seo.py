"""Check the published page set using only the Python standard library."""
from html.parser import HTMLParser
import json
from pathlib import Path
import sys
from urllib.parse import unquote, urljoin, urlparse
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://celdyque.com/'
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9',
      'image': 'http://www.google.com/schemas/sitemap-image/1.1'}
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'param', 'source', 'track', 'wbr'}


class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def find(self, tag=None, **attrs):
        found = []
        for child in self.children:
            if not isinstance(child, Node):
                continue
            if (tag is None or child.tag == tag) and all(child.attrs.get(k) == v for k, v in attrs.items()):
                found.append(child)
            found.extend(child.find(tag, **attrs))
        return found

    def text(self):
        return ''.join(c.text() if isinstance(c, Node) else c for c in self.children)


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def local_path(url):
    parsed = urlparse(urljoin(BASE, url))
    if parsed.netloc != 'celdyque.com':
        return None
    return ROOT / (unquote(parsed.path).lstrip('/') or 'index.html')


def normalized(text):
    return ' '.join(text.split())


def check():
    errors, warnings, pages = [], [], {}
    sitemap = ET.parse(ROOT / 'sitemap.xml')
    entries = sitemap.findall('s:url', NS)
    urls = [entry.findtext('s:loc', namespaces=NS) for entry in entries]
    assert len(urls) == len(set(urls)), 'Duplicate sitemap URLs'
    for url in urls:
        path = local_path(url)
        assert path and path.is_file(), f'Missing sitemap page: {url}'
        pages[url] = Document(path.read_text(encoding='utf-8')).root
    robots = RobotFileParser()
    robots.parse((ROOT / 'robots.txt').read_text(encoding='utf-8').splitlines())
    for url, doc in pages.items():
        label = local_path(url).name
        def require(condition, message):
            if not condition:
                errors.append(f'{label}: {message}')
        canonical = doc.find('link', rel='canonical')
        require(len(canonical) == 1 and canonical[0].attrs.get('href') == url, 'Canonical must match sitemap')
        require(len(doc.find('title')) == 1, 'Exactly one title required')
        require(len(doc.find('h1')) == 1, 'Exactly one H1 required')
        require(len(doc.find('meta', name='viewport')) == 1, 'Viewport metadata required')
        description = doc.find('meta', name='description')
        require(len(description) == 1 and bool(description[0].attrs.get('content')), 'Description required')
        meta_robots = doc.find('meta', name='robots')
        require(len(meta_robots) == 1 and 'noindex' not in meta_robots[0].attrs.get('content', ''), 'Page must allow indexing')
        for bot in ['Googlebot', 'bingbot', 'OAI-SearchBot', 'PerplexityBot']:
            require(robots.can_fetch(bot, url), f'{bot} blocked')
        for key in ['og:image', 'og:url']:
            tags = doc.find('meta', property=key)
            require(len(tags) == 1, f'{key} missing or duplicated')
            if tags and key == 'og:image':
                image_path = local_path(tags[0].attrs.get('content', ''))
                require(image_path and image_path.is_file(), 'Missing sharing image')
            if tags and key == 'og:url':
                require(tags[0].attrs.get('content') == url, 'og:url differs from canonical')
        graph = []
        for script in doc.find('script', type='application/ld+json'):
            data = json.loads(script.text())
            graph.extend(data.get('@graph', [data]))
        require(bool(graph), 'Structured data missing')
        for node in graph:
            if node.get('@type') == 'ItemList':
                items = node.get('itemListElement', [])
                require(node.get('numberOfItems') == len(items), 'ItemList count mismatch')
                links = {urljoin(url, a.attrs.get('href', '')) for a in doc.find('a')}
                require(all(item.get('url') in links for item in items), 'ItemList contains non-visible product links')
            if node.get('@type') == 'Product' and not node.get('offers', {}).get('price'):
                warnings.append(f'{label}: no verified live offer price; Google product rich results are not validated')
        if label == 'faq.html':
            faq = next(n for n in graph if n.get('@type') == 'FAQPage')
            visible = doc.find('details', **{'class': 'faq-item'})
            schema_questions = faq['mainEntity']
            require(len(visible) == len(schema_questions), 'FAQ count differs from schema')
            for question, details in zip(schema_questions, visible):
                title = details.find('span', **{'class': 'faq-question'})[0].text()
                answer = details.find('div', **{'class': 'faq-answer'})[0].find('p')[0].text()
                require(normalized(question['name']) == normalized(title), 'FAQ question differs from visible text')
                require(normalized(question['acceptedAnswer']['text']) == normalized(answer), 'FAQ answer differs from visible text')
        for tag in doc.find():
            if tag.tag not in ['a', 'img', 'script', 'link', 'source', 'video']:
                continue
            attr = 'href' if tag.tag in ['a', 'link'] else 'poster' if tag.tag == 'video' else 'src'
            value = tag.attrs.get(attr)
            if not value or value.startswith(('mailto:', 'tel:', '#', 'data:')):
                continue
            target = local_path(value)
            if target:
                require(target.is_file(), f'Missing local {attr}: {value}')
        for image in doc.find('img'):
            require('alt' in image.attrs, 'Image missing alt attribute')
    image_count = 0
    for entry in entries:
        images = entry.findall('image:image/image:loc', NS)
        if '/product-' in entry.findtext('s:loc', namespaces=NS):
            assert images, 'Product sitemap entry missing images'
        for image in images:
            path = local_path(image.text)
            assert path and path.is_file(), f'Missing sitemap image: {image.text}'
            assert ' ' not in image.text, f'Unescaped sitemap image URL: {image.text}'
            image_count += 1
    shop_links = {BASE + local_path(a.attrs['href']).name for a in pages[BASE + 'shop.html'].find('a')
                  if a.attrs.get('href', '').startswith('/product-')}
    assert len(shop_links) == 14, 'Active catalog changed; review the expected product set'
    assert shop_links <= set(urls), 'Active products missing from sitemap'
    print(f'Checked {len(pages)} pages, {len(shop_links)} products and {image_count} sitemap image references.')
    if warnings:
        print(f'NOTICE: {len(warnings)} product pages lack verified live offer prices; no rich-result eligibility claim is made.')
    for error in errors:
        print('ERROR:', error)
    if errors:
        return 1
    print('PASS: canonical, metadata, local links/assets, robots, JSON-LD, FAQ parity and sitemap checks.')
    return 0


if __name__ == '__main__':
    sys.exit(check())
