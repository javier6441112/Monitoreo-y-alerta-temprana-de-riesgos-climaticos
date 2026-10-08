namespace WeatherRisk.Api.DTOs.Usuarios;

public class UsuarioDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? UltimoAcceso { get; set; }
}

public class CreateUsuarioRequestDto
{
    public string Username { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Rol { get; set; } = "OPERADOR";
    public bool Activo { get; set; } = true;
}

public class UpdateUsuarioRequestDto
{
    public string Username { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Rol { get; set; } = "OPERADOR";
    public bool Activo { get; set; } = true;
    public string? Password { get; set; }
}

public class UpdateUsuarioEstadoRequestDto
{
    public bool Activo { get; set; }
}


public class UsuarioDtoCrear
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;

    public string contrasena { get; set; } = string.Empty;

    public string Nombre { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? UltimoAcceso { get; set; }
}