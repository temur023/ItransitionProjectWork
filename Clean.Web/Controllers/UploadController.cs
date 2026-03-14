using Clean.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ProjectWork.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UploadController(IHttpClientFactory _httpClientFactory,DataContext _db,IConfiguration _config ) : ControllerBase
{

    [HttpPost("profile-image/{userId}")]
    public async Task<IActionResult> UploadProfileImage(int userId, [FromForm] IFormFile file)
    {
        var result = await ProcessUpload(file, $"user_{userId}", "profile-picture");
        if (result is BadRequestObjectResult || result is NotFoundResult || result is ObjectResult { StatusCode: 500 })
            return result;

        var imageUrl = (result as OkObjectResult)?.Value?.GetType().GetProperty("imageUrl")?.GetValue((result as OkObjectResult).Value)?.ToString();
        
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();
        user.ProfileImage = imageUrl;
        await _db.SaveChangesAsync();

        return result;
    }

    private async Task<IActionResult> ProcessUpload(IFormFile file, string fileNamePrefix, string bucketName)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file provided" });

        var allowedTypes = new Dictionary<string, string>
        {
            { "image/jpeg", "jpg" },
            { "image/png", "png" },
            { "image/webp", "webp" }
        };

        if (!allowedTypes.ContainsKey(file.ContentType))
            return BadRequest(new { message = "Only JPEG, PNG and WebP allowed" });

        try
        {
            var supabaseUrl = _config["Supabase:Url"]?.TrimEnd('/');
            var serviceKey = _config["Supabase:ServiceKey"];

            if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(serviceKey))
                return BadRequest(new { message = "Supabase configuration is missing in appsettings.json" });

            var extension = allowedTypes[file.ContentType];
            var fileName = $"{fileNamePrefix}.{extension}";
            var uploadUrl = $"{supabaseUrl}/storage/v1/object/{bucketName}/{fileName}";
            
            Console.WriteLine($"Uploading to: {uploadUrl}");

            using var stream = file.OpenReadStream();
            using var content = new StreamContent(stream);
            content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);

            var http = _httpClientFactory.CreateClient();
            http.DefaultRequestHeaders.Add("Authorization", $"Bearer {serviceKey}");
            http.DefaultRequestHeaders.Add("apikey", serviceKey);
            
            var response = await http.PutAsync(uploadUrl + "?upsert=true", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                return BadRequest(new { message = "Upload failed: " + error });
            }
            
            var publicUrl = $"{supabaseUrl}/storage/v1/object/public/{bucketName}/{fileName}";
            return Ok(new { imageUrl = publicUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
