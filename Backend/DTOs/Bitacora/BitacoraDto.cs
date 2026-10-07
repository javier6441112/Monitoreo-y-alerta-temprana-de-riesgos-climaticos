namespace WeatherRisk.Api.DTOs.Bitacora;

public class BitacoraDto
{
    public int Id { get; set; }
    public int? UsuarioId { get; set; }
    public string UsuarioNombre { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string Entidad { get; set; } = string.Empty;
    public int? EntidadId { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; }
}
