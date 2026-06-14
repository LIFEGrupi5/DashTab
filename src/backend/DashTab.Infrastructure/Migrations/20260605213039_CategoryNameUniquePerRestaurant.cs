using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DashTab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CategoryNameUniquePerRestaurant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_menu_categories_name",
                table: "menu_categories");

            migrationBuilder.DropIndex(
                name: "ix_menu_categories_restaurant_id",
                table: "menu_categories");

            migrationBuilder.CreateIndex(
                name: "ix_menu_categories_restaurant_id_name",
                table: "menu_categories",
                columns: new[] { "restaurant_id", "name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_menu_categories_restaurant_id_name",
                table: "menu_categories");

            migrationBuilder.CreateIndex(
                name: "ix_menu_categories_name",
                table: "menu_categories",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_menu_categories_restaurant_id",
                table: "menu_categories",
                column: "restaurant_id");
        }
    }
}
