using Microsoft.EntityFrameworkCore.Migrations;
using Pgvector;

#nullable disable

namespace DashTab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMenuItemEmbedding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Enable pgvector extension if not already present.
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS vector;");

            migrationBuilder.AddColumn<Vector>(
                name: "embedding",
                table: "menu_items",
                type: "vector(1536)",
                nullable: true);

            // HNSW index for fast approximate cosine-similarity search.
            // Allows semantic queries to run in milliseconds rather than doing
            // a full table scan across all menu items.
            migrationBuilder.Sql(@"
                CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_menu_items_embedding_hnsw
                ON menu_items
                USING hnsw (embedding vector_cosine_ops);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "embedding",
                table: "menu_items");
        }
    }
}
