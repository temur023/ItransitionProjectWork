using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Clean.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class LatestChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CanWrite",
                table: "InventoryUserAccesses");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "InventoryUserAccesses",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UserName",
                table: "InventoryUserAccesses",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Email",
                table: "InventoryUserAccesses");

            migrationBuilder.DropColumn(
                name: "UserName",
                table: "InventoryUserAccesses");

            migrationBuilder.AddColumn<bool>(
                name: "CanWrite",
                table: "InventoryUserAccesses",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
