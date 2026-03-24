using Clean.Application.Dtos;
using Clean.Application.Responses;

namespace Clean.Application.Services.SupportTicketService;

public interface ISupportTicketService
{
    Task<Response<string>> UploadTicket(SupportTicketDto dto);
}