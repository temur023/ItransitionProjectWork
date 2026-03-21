using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Clean.Application.Dtos.SalesforceDtos;
using Clean.Application.Responses;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Clean.Application.Services.SalesforceService;

public class SalesforceService(HttpClient httpClient, IConfiguration config):ISalesforceService
{
    public async Task<Response<SalesforceDto>> GetAccessToken()
    {
        Console.WriteLine("Attempting Salesforce authentication...");
        Console.WriteLine($"AuthUrl: {config["Authentication:Salesforce:AuthUrl"]}");
        Console.WriteLine($"ClientId: {config["Authentication:Salesforce:ClientId"]}");
        Console.WriteLine($"Username: {config["Authentication:Salesforce:Username"]}");
        var authUrl = config["Authentication:Salesforce:AuthUrl"];
        var clientId = config["Authentication:Salesforce:ClientId"];
        var clientSecret = config["Authentication:Salesforce:ClientSecret"];
        var username = config["Authentication:Salesforce:Username"];
        var password = config["Authentication:Salesforce:Password"];
        

        var formData = new FormUrlEncodedContent(new []
        {
            new KeyValuePair<string, string>("grant_type", "password"),
            new KeyValuePair<string, string>("client_id",clientId!),
            new KeyValuePair<string, string>("client_secret", clientSecret!),
            new KeyValuePair<string, string>("username", username!),
            new KeyValuePair<string, string>("password",password!)
        });
        var response = await httpClient.PostAsync(authUrl, formData);
        var content = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            Console.WriteLine($"Salesforce auth failed: {content}");
            return new Response<SalesforceDto>(400,$"Salesforce authentication failed: {content}");
        }

        var json = JsonSerializer.Deserialize<JsonElement>(content);
        var accessToken = json.GetProperty("access_token").GetString();
        if(accessToken == null)
            return new Response<SalesforceDto>(404,"Salesforce authentication failed because of access token");
        var instanceUrl = json.GetProperty("instance_url").GetString();
        if(instanceUrl == null)
            return new Response<SalesforceDto>(404,"Salesforce authentication failed because of instance url");
        var dto = new SalesforceDto()
        {
            AccessToken = accessToken,
            InstanceUrl = instanceUrl
        };
        return new Response<SalesforceDto>(200,"Salesforce authentication successed", dto);
    }

    public async Task<Response<string>> CreateAccount(SalesforceCreateDto dto)
    {
        var url = dto.InstanceUrl + "/services/data/v57.0/sobjects/Account";
        var body = JsonSerializer.Serialize(new { Name = dto.CompanyName });
    
        var request = new HttpRequestMessage(HttpMethod.Post, url); // ← url here
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", dto.AccessToken);
        request.Content = new StringContent(body, Encoding.UTF8, "application/json");

        var response = await httpClient.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
    
        if (!response.IsSuccessStatusCode)
            return new Response<string>(400, $"Failed to create account: {content}");
    
        var json = JsonSerializer.Deserialize<JsonElement>(content);
        return new Response<string>(200, "Account created", json.GetProperty("id").GetString());
    }

    public async Task<Response<string>> CreateContact(SalesforceCreateDto dto, string accountId)
    {
        var url = dto.InstanceUrl + "/services/data/v57.0/sobjects/Contact";
        var body = JsonSerializer.Serialize(new 
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Phone = dto.Phone,
                AccountId = accountId
            });
        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", dto.AccessToken);
        request.Content = new StringContent(body, Encoding.UTF8, "application/json");

        var response = await httpClient.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
            return new Response<string>(400, $"Failed to create contact: {content}");
        var json = JsonSerializer.Deserialize<JsonElement>(content);
        return new Response<string>(200, "Contact created", json.GetProperty("id").GetString());
    }
    public async Task<Response<string>> CreateAccountAndContact(SalesforceCreateDto dto)
    {
        try
        {
            Console.WriteLine("=== SALESFORCE: CreateAccountAndContact START ===");
            Console.WriteLine($"DTO received - FirstName: {dto.FirstName}, LastName: {dto.LastName}, Email: {dto.Email}, Phone: {dto.Phone}, CompanyName: {dto.CompanyName}");
            
            Console.WriteLine("=== SALESFORCE: Calling GetAccessToken... ===");
            var authResponse = await GetAccessToken();
            Console.WriteLine($"=== SALESFORCE: GetAccessToken returned StatusCode: {authResponse.StatusCode}, Message: {authResponse.Message} ===");
            if (authResponse.StatusCode != 200)
                return new Response<string>(400, $"Salesforce authentication failed: {authResponse.Message}");

            dto.AccessToken = authResponse.Data.AccessToken;
            dto.InstanceUrl = authResponse.Data.InstanceUrl;
            Console.WriteLine($"=== SALESFORCE: Auth OK. InstanceUrl: {dto.InstanceUrl} ===");

            Console.WriteLine("=== SALESFORCE: Creating Account... ===");
            var accountResponse = await CreateAccount(dto);
            Console.WriteLine($"=== SALESFORCE: CreateAccount returned StatusCode: {accountResponse.StatusCode}, Message: {accountResponse.Message} ===");
            if (accountResponse.StatusCode != 200)
                return new Response<string>(400, $"Failed to create account: {accountResponse.Message}");

            Console.WriteLine($"=== SALESFORCE: Account created with ID: {accountResponse.Data} ===");
            Console.WriteLine("=== SALESFORCE: Creating Contact... ===");
            var contactResponse = await CreateContact(dto, accountResponse.Data);
            Console.WriteLine($"=== SALESFORCE: CreateContact returned StatusCode: {contactResponse.StatusCode}, Message: {contactResponse.Message} ===");
            if (contactResponse.StatusCode != 200)
                return new Response<string>(400, $"Failed to create contact: {contactResponse.Message}");

            Console.WriteLine($"=== SALESFORCE: SUCCESS! Contact ID: {contactResponse.Data} ===");
            return new Response<string>(200, "Successfully created in Salesforce", contactResponse.Data);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"=== SALESFORCE: EXCEPTION: {ex.GetType().Name}: {ex.Message} ===");
            Console.WriteLine($"=== SALESFORCE: StackTrace: {ex.StackTrace} ===");
            return new Response<string>(400, ex.Message);
        }
    }
}