using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DashTab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiTenancy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "restaurant_id",
                table: "users",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "restaurant_id",
                table: "orders",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "restaurant_id",
                table: "menu_items",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "restaurant_id",
                table: "menu_categories",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "restaurant_id",
                table: "audit_logs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "restaurants",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_restaurants", x => x.id);
                });

            // Seed a default restaurant so existing rows (which got restaurant_id = Guid.Empty
            // as their column default) satisfy the FK before it is enforced below.
            migrationBuilder.Sql("""
                INSERT INTO restaurants (id, name, slug, is_active, created_at)
                VALUES ('00000000-0000-0000-0000-000000000000', 'Default Restaurant', 'default', true, NOW())
                ON CONFLICT (id) DO NOTHING;
                """);

            migrationBuilder.CreateIndex(
                name: "ix_users_restaurant_id",
                table: "users",
                column: "restaurant_id");

            migrationBuilder.CreateIndex(
                name: "ix_orders_restaurant_id",
                table: "orders",
                column: "restaurant_id");

            migrationBuilder.CreateIndex(
                name: "ix_menu_items_restaurant_id",
                table: "menu_items",
                column: "restaurant_id");

            migrationBuilder.CreateIndex(
                name: "ix_menu_categories_restaurant_id",
                table: "menu_categories",
                column: "restaurant_id");

            migrationBuilder.AddForeignKey(
                name: "fk_menu_categories_restaurants_restaurant_id",
                table: "menu_categories",
                column: "restaurant_id",
                principalTable: "restaurants",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_menu_items_restaurants_restaurant_id",
                table: "menu_items",
                column: "restaurant_id",
                principalTable: "restaurants",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_orders_restaurants_restaurant_id",
                table: "orders",
                column: "restaurant_id",
                principalTable: "restaurants",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_users_restaurants_restaurant_id",
                table: "users",
                column: "restaurant_id",
                principalTable: "restaurants",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_menu_categories_restaurants_restaurant_id",
                table: "menu_categories");

            migrationBuilder.DropForeignKey(
                name: "fk_menu_items_restaurants_restaurant_id",
                table: "menu_items");

            migrationBuilder.DropForeignKey(
                name: "fk_orders_restaurants_restaurant_id",
                table: "orders");

            migrationBuilder.DropForeignKey(
                name: "fk_users_restaurants_restaurant_id",
                table: "users");

            migrationBuilder.DropTable(
                name: "restaurants");

            migrationBuilder.DropIndex(
                name: "ix_users_restaurant_id",
                table: "users");

            migrationBuilder.DropIndex(
                name: "ix_orders_restaurant_id",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "ix_menu_items_restaurant_id",
                table: "menu_items");

            migrationBuilder.DropIndex(
                name: "ix_menu_categories_restaurant_id",
                table: "menu_categories");

            migrationBuilder.DropColumn(
                name: "restaurant_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "restaurant_id",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "restaurant_id",
                table: "menu_items");

            migrationBuilder.DropColumn(
                name: "restaurant_id",
                table: "menu_categories");

            migrationBuilder.DropColumn(
                name: "restaurant_id",
                table: "audit_logs");
        }
    }
}
