namespace Clean.Application.Dtos.SalesforceDtos;

public class SalesforceCreateDto
{
    public string AccessToken { get; set; }
    public string InstanceUrl { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; } 
    public string CompanyName { get; set; }
}