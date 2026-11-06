import unittest
from unittest.mock import Mock

from bridge import Api, parse_reading


class BridgeTests(unittest.TestCase):
    def test_valid_reading(self):
        self.assertEqual(parse_reading('{"temperatura":26,"humedad":64}'), (26, 64))

    def test_reject_invalid_measurements(self):
        for line in ('{"error":"lectura_fallida"}', '[]', '{}',
                     '{"temperatura":true,"humedad":64}',
                     '{"temperatura":26,"humedad":101}',
                     '{"temperatura":NaN,"humedad":64}'):
            with self.subTest(line=line), self.assertRaises(ValueError):
                parse_reading(line)

    def test_expired_token_logs_in_and_retries(self):
        api = Api({"api_url": "https://example.com/api", "username": "operator"}, "secret")
        api.token = "expired"
        api.session = Mock()
        api.session.request.side_effect = [Mock(status_code=401), Mock(status_code=200)]
        login = Mock(status_code=200)
        login.json.return_value = {"token": "renewed"}
        api.session.post.return_value = login
        api.send(12, 26)
        self.assertEqual(api.session.request.call_count, 2)
        self.assertEqual(api.session.request.call_args.kwargs["headers"],
                         {"Authorization": "Bearer renewed"})
        self.assertEqual(api.session.request.call_args.kwargs["json"], {"sensorId": 12, "valor": 26})

    def test_timeout_does_not_repeat_uncertain_post(self):
        import requests
        api = Api({"api_url": "https://example.com/api"}, "secret")
        api.token = "token"
        api.session = Mock()
        api.session.request.side_effect = requests.Timeout()
        with self.assertRaises(requests.Timeout):
            api.send(12, 26)
        self.assertEqual(api.session.request.call_count, 1)


if __name__ == "__main__":
    unittest.main()
