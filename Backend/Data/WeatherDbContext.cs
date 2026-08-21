using Microsoft.EntityFrameworkCore;
using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Data;

public class WeatherDbContext : DbContext
{
    public WeatherDbContext(DbContextOptions<WeatherDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Sensor> Sensores { get; set; }
    public DbSet<LecturaSensor> LecturasSensores { get; set; }
    public DbSet<Alerta> Alertas { get; set; }
    public DbSet<HistorialEvento> HistorialEventos { get; set; }
    public DbSet<Bitacora> Bitacora { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("Usuarios");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Username).HasMaxLength(100).IsRequired();
            entity.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Nombre).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Rol).HasMaxLength(50).IsRequired();
            entity.Property(x => x.FechaCreacion).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Sensor>(entity =>
        {
            entity.ToTable("Sensores");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Nombre).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Tipo).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Unidad).HasMaxLength(30).IsRequired();
            entity.Property(x => x.ValorActual).HasColumnType("decimal(18,3)");
            entity.Property(x => x.FechaCreacion).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<LecturaSensor>(entity =>
        {
            entity.ToTable("LecturasSensores");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Valor).HasColumnType("decimal(18,3)");
            entity.Property(x => x.FechaHora).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Alerta>(entity =>
        {
            entity.ToTable("Alertas");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Nivel).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Fenomeno).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Mensaje).HasMaxLength(500).IsRequired();
            entity.Property(x => x.ValorDetectado).HasColumnType("decimal(18,3)");
            entity.Property(x => x.FechaHora).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<HistorialEvento>(entity =>
        {
            entity.ToTable("HistorialEventos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Fenomeno).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Nivel).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Mensaje).HasMaxLength(500).IsRequired();
            entity.Property(x => x.FechaHora).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Bitacora>(entity =>
        {
            entity.ToTable("Bitacora");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Usuario).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Accion).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Descripcion).HasMaxLength(500).IsRequired();
            entity.Property(x => x.FechaHora).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Usuario>().HasData(
            new Usuario { Id = 1, Username = "admin", PasswordHash = "admin123", Nombre = "Administrador", Rol = "ADMIN", Activo = true, FechaCreacion = DateTime.UtcNow },
            new Usuario { Id = 2, Username = "operador", PasswordHash = "operador123", Nombre = "Operador", Rol = "OPERADOR", Activo = true, FechaCreacion = DateTime.UtcNow }
        );

        modelBuilder.Entity<Sensor>().HasData(
            new Sensor { Id = 1, Nombre = "Sensor Temperatura 01", Tipo = "TEMPERATURA", Unidad = "°C", Activo = true, ComunidadId = 1, ValorActual = 27.5m, UltimaLectura = DateTime.UtcNow.AddMinutes(-5), FechaCreacion = DateTime.UtcNow },
            new Sensor { Id = 2, Nombre = "Sensor Humedad 01", Tipo = "HUMEDAD", Unidad = "%", Activo = true, ComunidadId = 1, ValorActual = 78m, UltimaLectura = DateTime.UtcNow.AddMinutes(-4), FechaCreacion = DateTime.UtcNow },
            new Sensor { Id = 3, Nombre = "Sensor Viento 01", Tipo = "VIENTO", Unidad = "km/h", Activo = true, ComunidadId = 1, ValorActual = 42m, UltimaLectura = DateTime.UtcNow.AddMinutes(-3), FechaCreacion = DateTime.UtcNow },
            new Sensor { Id = 4, Nombre = "Sensor Lluvia 01", Tipo = "LLUVIA", Unidad = "mm/h", Activo = true, ComunidadId = 1, ValorActual = 18.5m, UltimaLectura = DateTime.UtcNow.AddMinutes(-2), FechaCreacion = DateTime.UtcNow },
            new Sensor { Id = 5, Nombre = "Sensor Río 01", Tipo = "NIVEL_RIO", Unidad = "m", Activo = true, ComunidadId = 1, ValorActual = 2.8m, UltimaLectura = DateTime.UtcNow.AddMinutes(-1), FechaCreacion = DateTime.UtcNow }
        );
    }
}
