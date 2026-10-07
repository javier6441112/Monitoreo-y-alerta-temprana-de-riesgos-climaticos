using Microsoft.EntityFrameworkCore;
using WeatherRisk.Api.Data;
using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Services;

public sealed class TokenRevocationService
{
    private readonly WeatherDbContext _context;

    public TokenRevocationService(WeatherDbContext context)
    {
        _context = context;
    }

    public Task<bool> IsRevokedAsync(string tokenId, CancellationToken cancellationToken = default) =>
        _context.RevokedTokens.AnyAsync(token => token.TokenId == tokenId, cancellationToken);

    public async Task RevokeAsync(string tokenId, DateTime expiresAtUtc, CancellationToken cancellationToken = default)
    {
        await _context.RevokedTokens
            .Where(token => token.ExpiresAtUtc <= DateTime.UtcNow)
            .ExecuteDeleteAsync(cancellationToken);

        if (await IsRevokedAsync(tokenId, cancellationToken))
            return;

        _context.RevokedTokens.Add(new RevokedToken
        {
            TokenId = tokenId,
            ExpiresAtUtc = expiresAtUtc
        });
        await _context.SaveChangesAsync(cancellationToken);
    }
}