using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using DashTab.API.Middleware;
using DashTab.API.Realtime;
using DashTab.Infrastructure.Middleware;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Application.Validators;
using DashTab.Infrastructure.Caching;
using DashTab.Infrastructure.Messaging;
using DashTab.Infrastructure.Persistence;
using DashTab.Infrastructure.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Formatting.Compact;
using Serilog.Sinks.Elasticsearch;
using DashTab.API.Hangfire;
using DashTab.Infrastructure.Services.Jobs;
using DashTab.Infrastructure.Services.Storage;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.Extensions.Options;
using Minio;


var builder = WebApplication.CreateBuilder(args);

// ── Logging (Serilog → stdout JSON; also → Elasticsearch when configured) ─────
builder.Host.UseSerilog((ctx, cfg) =>
{
    cfg.ReadFrom.Configuration(ctx.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "DashTab.API")
        .WriteTo.Console(new CompactJsonFormatter());

    // Ship to Elasticsearch only when Elasticsearch:Uri is set (cluster); local
    // dev is unaffected. Daily indices: dashtab-logs-YYYY.MM.dd.
    var esUri = ctx.Configuration["Elasticsearch:Uri"];
    if (!string.IsNullOrWhiteSpace(esUri))
    {
        cfg.WriteTo.Elasticsearch(new ElasticsearchSinkOptions(new Uri(esUri))
        {
            AutoRegisterTemplate = false,
            IndexFormat = "dashtab-logs-{0:yyyy.MM.dd}",
            TypeName = null,
        });
    }
});

// ── Persistence ───────────────────────────────────────────────────────────────
builder.Services.AddDbContext<DashTabDbContext>(options =>
    options
        .UseNpgsql(builder.Configuration.GetConnectionString("Default"))
        .UseSnakeCaseNamingConvention());

// ── Health checks ─────────────────────────────────────────────────────────────
// /health/live  = liveness, no dependency checks (don't restart on a DB blip).
// /health/ready = readiness, includes the DB check (tagged "ready").
builder.Services.AddHealthChecks()
    .AddDbContextCheck<DashTabDbContext>("database", tags: ["ready"]);

// ── Distributed cache (Redis with in-memory fallback) ─────────────────────────
var redisConn = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrWhiteSpace(redisConn))
    builder.Services.AddStackExchangeRedisCache(o => o.Configuration = redisConn);
else
    builder.Services.AddDistributedMemoryCache();

// ── Validation ────────────────────────────────────────────────────────────────
builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();
// MVC auto-validation stays on during the CQRS migration so not-yet-converted
// endpoints keep validating; once every feature dispatches through MediatR the
// ValidationBehavior below becomes the sole validation path (see task 1.10).
builder.Services.AddFluentValidationAutoValidation();

// ── MediatR (CQRS) + validation pipeline ──────────────────────────────────────
builder.Services.AddMediatR(cfg =>
{
    // Requests/queries live in Application; their handlers live in Infrastructure
    // (they depend on DashTabDbContext), so scan both assemblies.
    cfg.RegisterServicesFromAssemblyContaining<DashTab.Application.IApplicationMarker>();
    cfg.RegisterServicesFromAssemblyContaining<DashTab.Infrastructure.IInfrastructureMarker>();
    cfg.AddOpenBehavior(typeof(DashTab.Application.Behaviors.ValidationBehavior<,>));
});

// ── JSON: camelCase property names + lowercase string enums ───────────────────
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    o.JsonSerializerOptions.Converters.Add(
        new JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase));
});

builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(o =>
{
    o.InvalidModelStateResponseFactory = ctx =>
    {
        var errors = ctx.ModelState
            .Where(e => e.Value?.Errors.Count > 0)
            .ToDictionary(e => e.Key, e => e.Value!.Errors.Select(x => x.ErrorMessage).ToArray());

        var problem = new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = 422,
            Title = "Validation Failed",
            Extensions = { ["errors"] = errors }
        };
        return new Microsoft.AspNetCore.Mvc.UnprocessableEntityObjectResult(problem);
    };
});

// ── CORS (dev only — prod uses same-origin via the reverse proxy) ─────────────
// Allowed origins come from config (Cors:AllowedOrigins). Defaults to the local
// dev frontend; in the cluster the deployed app origin is supplied via env.
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000"];
builder.Services.AddCors(cors => cors.AddPolicy("Frontend", policy => policy
    .WithOrigins(corsOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

// -- Authentication with JWT Bearer tokens from Keycloak ─────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.Authority = builder.Configuration["Keycloak:Authority"];
        opts.Audience = builder.Configuration["Keycloak:Audience"];
        opts.RequireHttpsMetadata = false;
        opts.MapInboundClaims = false;
        opts.TokenValidationParameters.RoleClaimType = "roles";
        // In Docker the API talks to keycloak:8080 internally, but Keycloak always puts
        // localhost:8080 in the discovery doc (issuer + jwks_uri). We fix both:
        // 1. Override ValidIssuer so the token's iss (localhost:8080) is accepted.
        // 2. Rewrite backchannel requests so jwks_uri fetches succeed via keycloak:8080.
        var validIssuer = builder.Configuration["Keycloak:ValidIssuer"];
        if (!string.IsNullOrEmpty(validIssuer))
        {
            opts.TokenValidationParameters.ValidIssuer = validIssuer;
            opts.BackchannelHttpHandler = new KeycloakBackchannelHandler(
                publicBase: validIssuer,
                internalBase: opts.Authority!);
        }

        // Token resolution order:
        //  1. ?access_token= query param  — SignalR WebSocket upgrade (JS can't
        //     set Authorization headers on WS, so the old query-param path stays).
        //  2. access_token httpOnly cookie — every other authenticated request.
        //     This is the new primary path after the localStorage → cookie migration.
        //  3. Authorization: Bearer header — kept as a fallback (Swagger UI, scripts).
        opts.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"].ToString();
                if (string.IsNullOrEmpty(token))
                    token = ctx.Request.Cookies["access_token"] ?? string.Empty;
                if (!string.IsNullOrEmpty(token))
                    ctx.Token = token;
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();

builder.Services.AddRateLimiter(o =>
  {
      o.RejectionStatusCode = 429;
      o.OnRejected = (ctx, _) =>
      {
          ctx.HttpContext.Response.Headers["Retry-After"] = "60";
          return ValueTask.CompletedTask;
      };
      o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
    {
        var isAuth = ctx.User.Identity?.IsAuthenticated == true;
        var key = isAuth
            ? ctx.User.FindFirst("sub")?.Value ?? "auth"
            : ctx.Connection.RemoteIpAddress?.ToString() ?? "anon";

        return RateLimitPartition.GetSlidingWindowLimiter(key, _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = isAuth ? 300 : 60,
            Window = TimeSpan.FromMinutes(1),
            SegmentsPerWindow = 6
        });
    });
      o.AddSlidingWindowLimiter("auth-login", opt =>
      {
          opt.PermitLimit = 10;
          opt.Window = TimeSpan.FromMinutes(1);
          opt.SegmentsPerWindow = 6;
      });
      o.AddSlidingWindowLimiter("auth-refresh", opt =>
      {
          opt.PermitLimit = 5;
          opt.Window = TimeSpan.FromMinutes(1);
          opt.SegmentsPerWindow = 6;
      });
  });

// ── OpenAPI / Swagger ─────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o =>
  {
      o.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
      {
          Type = SecuritySchemeType.Http,
          Scheme = "bearer",
          BearerFormat = "JWT",
          In = ParameterLocation.Header,
          Description = "Paste your access token here."
      });
      o.AddSecurityRequirement(new OpenApiSecurityRequirement
      {
          [new OpenApiSecurityScheme
          {
              Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
          }] = []
      });
  });

// ── ProblemDetails for unhandled exceptions ───────────────────────────────────
builder.Services.AddExceptionHandler<DashTabExceptionHandler>();
builder.Services.AddProblemDetails();

// ── Messaging (RabbitMQ) ──────────────────────────────────────────────────────
builder.Services.Configure<RabbitMqOptions>(builder.Configuration.GetSection(RabbitMqOptions.SectionName));
var rabbitMqUri = builder.Configuration.GetConnectionString("RabbitMQ");
if (!string.IsNullOrWhiteSpace(rabbitMqUri))
{
    builder.Services.AddSingleton<RabbitMqConnection>();
    builder.Services.AddScoped<IEventPublisher, RabbitMqEventPublisher>();
    builder.Services.AddHostedService<RabbitMqTopologyInitializer>();
    builder.Services.AddHostedService<RabbitMqConsumerService>();
    builder.Services.AddHostedService<KitchenBridgeConsumer>();
}
else
{
    builder.Services.AddSingleton<IEventPublisher, NullEventPublisher>();
}

// ── Object storage (MinIO) ────────────────────────────────────────────────────
builder.Services.Configure<StorageOptions>(builder.Configuration.GetSection("Storage"));
builder.Services.AddSingleton<IMinioClient>(sp =>
{
    var opts = sp.GetRequiredService<IOptions<StorageOptions>>().Value;
    var endpoint = opts.Endpoint;
    Uri? uri = null;
    if (endpoint.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
        endpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        uri = new Uri(endpoint);

    var client = new MinioClient()
        .WithEndpoint(uri?.Host ?? endpoint, uri?.Port ?? 9000)
        .WithCredentials(opts.AccessKey, opts.SecretKey);

    if (opts.UseSsl || uri?.Scheme == "https")
        client = client.WithSSL();

    return client.Build();
});
builder.Services.AddScoped<IStorageService, MinioStorageService>();
builder.Services.AddHostedService<StorageBucketBootstrapper>();

// ── Application services ──────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IKeycloakAdminService, KeycloakAdminService>();
builder.Services.AddScoped<IStripeService, StripeService>();
builder.Services.AddScoped<IForecastService, ForecastService>();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddSingleton<ICacheService, CacheService>();
builder.Services.AddHangfire(cfg => cfg
      .UsePostgreSqlStorage(o => o.UseNpgsqlConnection(builder.Configuration.GetConnectionString("Default"))));
builder.Services.AddHangfireServer();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<OrderEmailJob>();

// ── Mappers (Mapperly-generated, stateless) ──────────────────────────────────
builder.Services.AddSingleton<MenuCategoryMapper>();
builder.Services.AddSingleton<MenuItemMapper>();
builder.Services.AddSingleton<UserMapper>();
builder.Services.AddSingleton<OrderMapper>();

// ── Realtime (SignalR + optional Redis backplane) ────────────────────────────
var signalR = builder.Services.AddSignalR();
if (!string.IsNullOrWhiteSpace(redisConn))
    signalR.AddStackExchangeRedis(redisConn, o =>
        o.Configuration.ChannelPrefix = StackExchange.Redis.RedisChannel.Literal("dashtab:signalr"));
builder.Services.AddSingleton<IKdsBroadcaster, KdsBroadcaster>();

// ── MCP server (read-only tools for AI agents) ───────────────────────────────
builder.Services.AddMcpServer()
    .WithHttpTransport()
    .WithToolsFromAssembly();

var app = builder.Build();

// Apply EF Core migrations on startup so the schema exists in fresh environments
// (e.g. a newly-provisioned cluster database). Single replica, so no migration race.
using (var migrationScope = app.Services.CreateScope())
{
    migrationScope.ServiceProvider.GetRequiredService<DashTabDbContext>().Database.Migrate();
}

// ── Dev only: Swagger UI ──────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ── Middleware pipeline ───────────────────────────────────────────────────────
app.UseExceptionHandler();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseSerilogRequestLogging();
app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseMiddleware<RestaurantContextMiddleware>();
app.UseAuthorization();
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = [new OwnerOnlyDashboardFilter()]
});
// Kubernetes probes (anonymous). Liveness runs no checks; readiness runs the
// "ready"-tagged checks (DB). Fully-qualified to avoid extra usings.
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false
});
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

app.MapControllers();
app.MapHub<KdsHub>("/hubs/kds");
app.MapMcp("/mcp")
    .RequireAuthorization(new AuthorizeAttribute { Roles = "Owner,Manager,Kitchen" });

app.Run();

// Rewrites any backchannel HTTP request (discovery, JWKS) that uses the public
// Keycloak URL to use the internal Docker hostname instead.
class KeycloakBackchannelHandler(string publicBase, string internalBase) : HttpClientHandler
{
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        var uri = request.RequestUri?.ToString();
        if (!string.IsNullOrEmpty(uri) && uri.StartsWith(publicBase))
            request.RequestUri = new Uri(uri.Replace(publicBase, internalBase));
        return base.SendAsync(request, ct);
    }
}
public partial class Program;