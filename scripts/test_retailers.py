"""Keep the official retailer page ordered, accessible and search-readable."""
import json
import unittest

from check_seo import ROOT, Document


RETAILERS = [
    ('Amazon', 'https://www.amazon.com/stores/page/176EC99B-F37D-4FC8-BC48-E30CEC0FA252?maas=maas_adg_E856BC7BDD5C52C4C8DD6D3C8EFCB0D8_afap_abs&ref_=aa_maas&tag=maas&ingress=3'),
    ('TikTok Shop', 'https://www.tiktok.com/@celdyque'),
    ('YesStyle', 'https://www.yesstyle.com/en/celdyque/list.html/bpt.299_bid.331400'),
    ('Stylevana', 'https://www.stylevana.com/en_US/brands/celdyque.html'),
]


class RetailerPageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = (ROOT / 'store.html').read_text(encoding='utf-8')
        cls.doc = Document(cls.source).root
        cls.header = Document((ROOT / 'partials/header.html').read_text(encoding='utf-8')).root

    def test_visible_retailers_use_requested_order_and_links(self):
        cards = self.doc.find('a', **{'class': 'retailer-card'})
        self.assertEqual([a.attrs.get('href') for a in cards], [url for _, url in RETAILERS])
        self.assertEqual([a.attrs.get('target') for a in cards], ['_blank'] * 4)
        self.assertTrue(all('noopener' in a.attrs.get('rel', '') for a in cards))
        self.assertTrue(all(a.attrs.get('aria-label') for a in cards))

    def test_retailer_item_list_matches_visible_cards(self):
        graph = []
        for script in self.doc.find('script', type='application/ld+json'):
            data = json.loads(script.text())
            graph.extend(data.get('@graph', [data]))
        lists = [node for node in graph if node.get('@type') == 'ItemList']
        self.assertEqual(len(lists), 1)
        items = lists[0]['itemListElement']
        self.assertEqual([(item['name'], item['url']) for item in items], RETAILERS)
        self.assertEqual([item['position'] for item in items], [1, 2, 3, 4])

    def test_page_does_not_depend_on_external_logo_images(self):
        cards = self.doc.find('a', **{'class': 'retailer-card'})
        self.assertFalse(any(card.find('img') for card in cards))
        self.assertIn('/assets/store.css?v=20260831-retailers', self.source)

    def test_header_retailer_links_match_store_order(self):
        expected = [url for _, url in RETAILERS]
        links = [a for a in self.header.find('a') if a.attrs.get('href') in expected]
        self.assertEqual([a.attrs.get('href') for a in links], expected + expected)
        self.assertTrue(all(a.attrs.get('target') == '_blank' for a in links))


if __name__ == '__main__':
    unittest.main()
