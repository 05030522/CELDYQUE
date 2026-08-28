"""Keep the active single-item catalog separate from packs and bundles."""
import json
import unittest
from urllib.parse import parse_qs, urlparse
import xml.etree.ElementTree as ET
from check_seo import ROOT, NS, Document, local_path

STOREFRONT = 'https://www.amazon.com/stores/page/176EC99B-F37D-4FC8-BC48-E30CEC0FA252'

# Owner-supplied single-item ASINs and existing Amazon Attribution ad groups.
SINGLES = {
    'product-volufiline-100.html': ('B0CPLDVTFP', '7982F2D6742712787939772A0788E56D'),
    'product-blue-copper-peptide-bakuchiol-serum.html': ('B0H6DCQPN8', 'A56A81A3EC8F72AA086ACA835C80CF42'),
    'product-bakuchiol-volume-collagen-cream.html': ('B0GXV5RJX5', '74F8B22ED5F8F87B0ED1F1AA5B1974B5'),
    'product-9-peptide-scalp-serum.html': ('B0GGZRNGKL', 'B3610BD8B3001B42E9EA2D0A7A72F58C'),
    'product-bakuchiol-30000.html': ('B0DC6H8MSW', 'CF21960666737CC63E9003F20D927B2C'),
    'product-pdrn-25.html': ('B0FMFBGW9N', '423AC43EAAC0FDA7535EF6FE63667104'),
    'product-pdrn-12-egf.html': ('B0F1Y8DML3', '650A715F4856800A04724A06656CFF91'),
    'product-pdrn-12-egf-cream.html': ('B0FJY6SCPX', '216C98761617EBF7B80D255DB5F838E4'),
    'product-arbutxa-glow-cream.html': ('B0FWBM5SR8', 'FD312B20E0F9A766AF64408015E6D02A'),
    'product-gentle-cleanser.html': ('B0FGPXK14C', 'FD9A03F5A5E1C2F315E98D088BF02599'),
    'product-cleansing-oil.html': ('B0FKM689SK', '8CC3CBC6AC803453B28CA24D0B64DD83'),
    'product-glutathione-30000.html': ('B0DP4FG8B9', 'D93AB1E59E3F992E567F61E5457CA82B'),
    'product-azelaic-12.html': ('B0DP4FQPDL', 'ADF10714365CF9D97EE4BBD33BD084E3'),
    'product-niacinamide-20-advanced.html': ('B0C2PH12CR', '9D8A330F96AA01A13A0033A6A67C5609'),
}


class AmazonIdentityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages = {}
        cls.graphs = {}
        for entry in ET.parse(ROOT / 'sitemap.xml').findall('s:url/s:loc', NS):
            path = local_path(entry.text)
            doc = Document(path.read_text(encoding='utf-8')).root
            cls.pages[path.name] = doc
            cls.graphs[path.name] = []
            for script in doc.find('script', type='application/ld+json'):
                data = json.loads(script.text())
                cls.graphs[path.name].extend(data.get('@graph', [data]))

    def test_only_existing_single_item_pages_are_active(self):
        product_pages = {name for name, graph in self.graphs.items()
                         if any(n.get('@type') == 'Product' for n in graph)}
        self.assertEqual(product_pages, set(SINGLES))

    def test_product_identity_matches_single_item_asin(self):
        for name, (asin, _) in SINGLES.items():
            with self.subTest(page=name):
                products = [n for n in self.graphs[name] if n.get('@type') == 'Product']
                self.assertEqual(len(products), 1)
                product = products[0]
                self.assertEqual(product['identifier']['propertyID'], 'ASIN')
                self.assertEqual(product['identifier']['value'], asin)
                self.assertEqual(product['sameAs'], [f'https://www.amazon.com/dp/{asin}'])
                if 'sku' in product:
                    self.assertEqual(product['sku'], asin)

    def test_brand_storefront_is_consistent(self):
        for name, graph in self.graphs.items():
            with self.subTest(page=name):
                brands = [n for n in graph if n.get('@type') == 'Organization'
                          and n.get('@id') == 'https://celdyque.com/#organization']
                self.assertEqual(len(brands), 1)
                amazon_urls = [u for u in brands[0].get('sameAs', [])
                               if urlparse(u).hostname == 'www.amazon.com']
                self.assertEqual(amazon_urls, [STOREFRONT])

    def test_storefront_matches_existing_visible_store_link(self):
        links = [a.attrs.get('href') for a in self.pages['store.html'].find('a')]
        self.assertIn(STOREFRONT, links)

    def test_purchase_links_keep_single_item_and_attribution(self):
        for name, (asin, ad_group) in SINGLES.items():
            with self.subTest(page=name):
                links = [urlparse(a.attrs.get('href', '')) for a in self.pages[name].find('a')]
                links = [u for u in links if u.hostname == 'www.amazon.com' and '/dp/' in u.path]
                self.assertTrue(links, 'Missing Amazon purchase link')
                for link in links:
                    parts = link.path.strip('/').split('/')
                    self.assertEqual(parts[parts.index('dp') + 1], asin)
                    query = parse_qs(link.query)
                    self.assertEqual(query.get('maas'), [f'maas_adg_{ad_group}_afap_abs'])
                    self.assertEqual(query.get('ref_'), ['aa_maas'])
                    self.assertEqual(query.get('tag'), ['maas'])


if __name__ == '__main__':
    unittest.main()
