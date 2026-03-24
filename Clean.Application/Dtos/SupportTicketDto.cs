namespace Clean.Application.Dtos;

public class SupportTicketDto
{
    public string Summary { get; set; }
    public string Priority { get; set; }
    public string ReportedBy { get; set; }
    public string? InventoryTitle { get; set; }
    public string Link { get; set; }
    public List<string> AdminEmails { get; set; } = new();
}