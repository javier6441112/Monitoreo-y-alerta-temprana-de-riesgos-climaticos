import unittest
from migrate import validate, alert_payload
class MigrationTests(unittest.TestCase):
    def source(self):
        return {"Usuarios":[{"id":1,"activo":True,"rol":"ADMIN","passwordhash":"PBKDF2$100000$salt$hash"}],
                "Comunidades":[{"id":2,"nombre":"Comunidad"}],
                "Sensores":[{"id":3,"comunidadid":2,"nombre":"Sensor"}]}
    def test_dangling_reference_rejected(self):
        source=self.source()
        source["Sensores"][0]["comunidadid"]=999
        with self.assertRaises(ValueError): validate(source)
    def test_ids_thresholds_and_dates_preserved(self):
        source=self.source()
        validate(source)
        result=alert_payload({"id":5,"sensorid":3,"fenomeno":"INUNDACION","nivel":"ROJO","mensaje":"Prueba",
            "valordetectado":"4.500","valorminimo":"3.000","fechahora":"2026-10-21T12:00:00","activa":True},source)
        self.assertEqual((result["id"],result["sensorId"],result["comunidadId"]),(5,3,2))
        self.assertEqual(result["valorMinimo"],3)
        self.assertTrue(result["fechaHora"].endswith("+00:00"))
if __name__=="__main__": unittest.main()
