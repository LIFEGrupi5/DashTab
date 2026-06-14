using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DashTab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "subscriptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    restaurant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    stripe_customer_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    stripe_subscription_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    stripe_session_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    current_period_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_subscriptions", x => x.id);
                    table.ForeignKey(
                        name: "fk_subscriptions_restaurants_restaurant_id",
                        column: x => x.restaurant_id,
                        principalTable: "restaurants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_subscriptions_restaurant_id",
                table: "subscriptions",
                column: "restaurant_id",
                unique: true);

            // Grant the pre-existing Default Restaurant (seeded in AddMultiTenancy) an
            // active Enterprise subscription so existing demo accounts aren't gated out.
            migrationBuilder.Sql("""
                INSERT INTO subscriptions (id, restaurant_id, plan, status, current_period_end, created_at, updated_at)
                VALUES (
                    gen_random_uuid(),
                    '00000000-0000-0000-0000-000000000000',
                    'Enterprise',
                    'Active',
                    NOW() + INTERVAL '100 years',
                    NOW(),
                    NOW())
                ON CONFLICT (restaurant_id) DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "subscriptions");
        }
    }
}
