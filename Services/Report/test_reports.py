import unittest
from main import rainfall, safe_fetcher
class Reports(unittest.TestCase):
    def test_rate_is_integrated_not_summed(self):
        readings=[{"sensorId":1,"tipo":"LLUVIA","valor":10,"fechaHora":"2026-10-21T10:00:00Z"},
                  {"sensorId":1,"tipo":"LLUVIA","valor":20,"fechaHora":"2026-10-21T10:30:00Z"}]
        self.assertEqual(rainfall(readings),5)
    def test_renderer_rejects_network_and_files(self):
        for url in ["http://127.0.0.1/private","file:///etc/passwd"]:
            with self.assertRaises(ValueError):
                safe_fetcher(url)
if __name__=="__main__":
    unittest.main()
