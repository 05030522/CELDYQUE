"""Check Products labels without migrating the existing catalog URLs."""
import json
import unittest
from urllib.parse import urlparse

from check_seo import ROOT, BASE, Document, normalized


class ProductsNavigationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        paths = list(ROOT.glob('*.html')) + list((ROOT / 'partials').glob('*.html'))
        cls.pages = {p.relative_to(ROOT).as_posix(): Document(p.read_text(encoding='utf-8')).root
                     for p in paths}

    def test_shared_navigation_uses_products(self):
        header = self.pages['partials/header.html']
        links = header.find('a', href='/shop.html')
        self.assertEqual(sum(normalized(a.text()) == 'Products' for a in links), 2)
        footer = self.pages['partials/footer.html']
        self.assertIn('Products', [normalized(n.text()) for n in footer.find('h4')])
        for name, doc in self.pages.items():
            for node in doc.find():
                if node.tag in {'a', 'button', 'h4', 'div', 'span'}:
                    self.assertNotIn(normalized(node.text()),
                                     {'Shop', 'SHOP', 'Shop Now', 'Back to Shop', 'Go to Shop'}, name)
        home = self.pages['index.html']
        self.assertTrue(any('Explore Products' in a.text() for a in home.find('a', href='/shop.html')))

    def test_catalog_metadata_keeps_existing_url(self):
        doc = self.pages['shop.html']
        title = doc.find('title')[0].text()
        self.assertTrue(title.startswith('Korean Skincare Products | '))
        self.assertEqual(doc.find('meta', property='og:title')[0].attrs['content'], title)
        self.assertEqual(doc.find('meta', name='twitter:title')[0].attrs['content'], title)
        self.assertEqual(doc.find('link', rel='canonical')[0].attrs['href'], BASE + 'shop.html')
        self.assertEqual(doc.find('h1')[0].text(), 'All Products')

    def test_product_breadcrumb_labels_match_catalog(self):
        count = 0
        for name, doc in self.pages.items():
            for script in doc.find('script', type='application/ld+json'):
                data = json.loads(script.text())
                for node in data.get('@graph', [data]):
                    if node.get('@type') != 'BreadcrumbList':
                        continue
                    for item in node.get('itemListElement', []):
                        if urlparse(item.get('item', '')).path == '/shop.html':
                            count += 1
                            expected = 'Korean Skincare Products' if name == 'shop.html' else 'Products'
                            self.assertEqual(item['name'], expected, name)
        self.assertEqual(count, 15)

    def test_updated_navigation_assets_are_versioned_together(self):
        version = '?v=20260831-amazon-attribution'
        site = (ROOT / 'assets/site.js').read_text(encoding='utf-8')
        worker = (ROOT / 'sw.js').read_text(encoding='utf-8')
        for partial in ['header', 'footer']:
            url = '/partials/' + partial + '.html' + version
            self.assertIn(url, site)
            self.assertIn(url, worker)
        self.assertIn('/assets/site.js' + version, worker)
        self.assertIn('celdyque-v8-amazon-attribution', worker)
        for name, doc in self.pages.items():
            for script in doc.find('script'):
                src = script.attrs.get('src', '')
                if urlparse(src).path == '/assets/site.js':
                    self.assertEqual(src, '/assets/site.js' + version, name)

    def test_mobile_navigation_and_catalog_guards_exist(self):
        header = (ROOT / 'partials/header.html').read_text(encoding='utf-8')
        site = (ROOT / 'assets/site.js').read_text(encoding='utf-8')
        styles = (ROOT / 'assets/site.css').read_text(encoding='utf-8')
        shop = (ROOT / 'shop.html').read_text(encoding='utf-8')
        self.assertIn('aria-expanded="false"', header)
        self.assertIn("mobileMenu?.setAttribute('aria-hidden', 'false')", site)
        self.assertIn("searchReturnFocus?.focus()", site)
        self.assertIn("e.key === 'Tab'", site)
        self.assertIn('.search-label{position:absolute', styles)
        self.assertIn('grid-template-columns:repeat(2,minmax(0,1fr))', shop)
        self.assertIn('.shop-hero{height:210px', shop)


if __name__ == '__main__':
    unittest.main()
