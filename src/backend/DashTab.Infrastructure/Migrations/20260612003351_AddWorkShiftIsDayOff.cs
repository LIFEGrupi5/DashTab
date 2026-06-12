using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DashTab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkShiftIsDayOff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_day_off",
                table: "work_shifts",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_day_off",
                table: "work_shifts");
        }
    }
}
