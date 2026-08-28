"""Regression tests for the static watch-page and video-sitemap contract."""
import unittest
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET
from check_seo import ROOT, NS, Document, video_errors


class VideoSitemapTests(unittest.TestCase):
    def setUp(self):
        entries = ET.parse(ROOT / 'sitemap.xml').findall('s:url', NS)
        self.entry = next(e for e in entries if e.find('video:video', NS) is not None)
        self.doc = Document((ROOT / 'brand-film.html').read_text(encoding='utf-8')).root
        self.robots = RobotFileParser()
        self.robots.parse(['User-agent: *', 'Allow: /'])

    def errors(self):
        return video_errors(self.entry, self.doc, self.robots)

    def test_valid_watch_page(self):
        self.assertEqual(self.errors(), [])

    def test_wrong_thumbnail(self):
        self.entry.find('video:video/video:thumbnail_loc', NS).text = 'https://celdyque.com/images/pa2.jpg'
        self.assertIn('Video thumbnail differs from player poster', self.errors())

    def test_wrong_source(self):
        self.entry.find('video:video/video:content_loc', NS).text = 'https://celdyque.com/brand-film.html'
        self.assertIn('Video sitemap source differs from player', self.errors())

    def test_blocked_video(self):
        self.robots = RobotFileParser()
        self.robots.parse(['User-agent: *', 'Disallow: /videos/'])
        self.assertIn('Video content_loc blocked', self.errors())

    def test_controls_required(self):
        del self.doc.find('video')[0].attrs['controls']
        self.assertIn('Watch page needs one controlled video', self.errors())

    def test_invalid_duration(self):
        self.entry.find('video:video/video:duration', NS).text = 'unknown'
        self.assertIn('Invalid video duration', self.errors())

    def test_missing_description(self):
        self.entry.find('video:video/video:description', NS).text = ''
        self.assertIn('Video sitemap missing description', self.errors())

    def test_title_must_match_visible_page(self):
        self.entry.find('video:video/video:title', NS).text = 'Unrelated product demonstration'
        self.assertIn('Video title differs from visible H1', self.errors())

    def test_schema_alone_is_not_a_visible_description(self):
        self.doc.find('p', id='film-description')[0].children = []
        self.assertIn('Video description is not visible on page', self.errors())


if __name__ == '__main__':
    unittest.main()
