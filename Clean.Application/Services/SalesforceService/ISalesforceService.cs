using Clean.Application.Dtos.SalesforceDtos;
using Clean.Application.Responses;

namespace Clean.Application.Services.SalesforceService;

public interface ISalesforceService
{
    Task<Response<SalesforceDto>> GetAccessToken();
    Task<Response<string>> CreateAccount(SalesforceCreateDto dto);
    Task<Response<string>> CreateContact( SalesforceCreateDto dto, string accountId);
    Task<Response<string>> CreateAccountAndContact(SalesforceCreateDto dto);
}