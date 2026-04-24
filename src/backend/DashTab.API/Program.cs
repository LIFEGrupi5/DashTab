using DashTab.Application.Interfaces;
using DashTab.Infrastructure.Persistence;
using DashTab.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Database — swap AppDbContext for EF Core DbContext once DB is configured
builder.Services.AddSingleton<AppDbContext>();

// Services
builder.Services.AddScoped<IOrderService, OrderService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseHttpsRedirection();
}

app.UseAuthorization();
app.MapControllers();
app.Run();
