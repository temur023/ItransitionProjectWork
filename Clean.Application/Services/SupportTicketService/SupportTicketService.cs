using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Clean.Application.Dtos;
using Clean.Application.Responses;
using Microsoft.Extensions.Configuration;

namespace Clean.Application.Services.SupportTicketService;

public class SupportTicketService(IConfiguration configuration, HttpClient httpClient):ISupportTicketService
{
    public async Task<Response<string>> UploadTicket(SupportTicketDto dto)
    {
        try
        {
        var accessToken = configuration["Dropbox:AccessToken"];
        var ticketJson = JsonSerializer.Serialize(new
        {
            reported_by = dto.ReportedBy,
            summary = dto.Summary,
            priority = dto.Priority,
            inventory_title = dto.InventoryTitle,
            link = dto.Link,
            admin_emails = dto.AdminEmails
        });
        var fileName = $"/SupportTickets/ticket_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";
        var request = new HttpRequestMessage(HttpMethod.Post,
            "https://content.dropboxapi.com/2/files/upload");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Add("Dropbox-API-Arg", JsonSerializer.Serialize(new
        {
            path = fileName,
            mode = "add",
            autorename = true
        }));
        request.Content = new ByteArrayContent(
            Encoding.UTF8.GetBytes(ticketJson));
        request.Content.Headers.ContentType =
            new MediaTypeHeaderValue("application/octet-stream");
        var response = await httpClient.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
            return new Response<string>(400, $"Error: {content}");
        return new Response<string>(200, "Ticket uploaded successfully");
    }
    catch (Exception ex)
    {
        return new Response<string>(400, ex.Message);
    }
}
}