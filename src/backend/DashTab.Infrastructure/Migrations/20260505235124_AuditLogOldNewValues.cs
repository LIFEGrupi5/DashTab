using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DashTab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AuditLogOldNewValues : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "diff",
                table: "audit_logs",
                newName: "old_values");

            migrationBuilder.AddColumn<string>(
                name: "new_values",
                table: "audit_logs",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "new_values",
                table: "audit_logs");

            migrationBuilder.RenameColumn(
                name: "old_values",
                table: "audit_logs",
                newName: "diff");
        }
    }
}
