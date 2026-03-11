using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Clean.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class final : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxMultiLineLength",
                table: "InventoryFields",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxNumberLength",
                table: "InventoryFields",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxSingleLineLength",
                table: "InventoryFields",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MinNumberLength",
                table: "InventoryFields",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxMultiLineLength",
                table: "InventoryFields");

            migrationBuilder.DropColumn(
                name: "MaxNumberLength",
                table: "InventoryFields");

            migrationBuilder.DropColumn(
                name: "MaxSingleLineLength",
                table: "InventoryFields");

            migrationBuilder.DropColumn(
                name: "MinNumberLength",
                table: "InventoryFields");
        }
    }
}
