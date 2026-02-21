using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Clean.Domain.Entities;
using Clean.Domain.Entities.Enums;

namespace Clean.Application.Services;

public class CustomIdGeneratorService
{
    public string GenerateId(string formatJson, int nextSequence)
    {
        var elements = JsonSerializer.Deserialize<List<CustomIdElement>>(formatJson) 
                       ?? new List<CustomIdElement>();
        var sb = new StringBuilder();
        foreach (var element in elements)
        {
            switch (element.Type)
            {
                case IdElementType.DateTime:
                    sb.Append(DateTime.UtcNow.ToString(element.Format ?? "yyyyMMdd"));
                    break;
                case IdElementType.Guid:
                    sb.Append(Guid.NewGuid().ToString("N").Substring(0, 8)); // Usually truncated for readability, or use full Guid
                    break;
                case IdElementType.FixedText:
                    sb.Append(element.Value);
                    break;
                case IdElementType.Sequence:
                    sb.Append(nextSequence.ToString(element.Format ?? "D")); 
                    break;
                case IdElementType.Random6Digit:
                    sb.Append(RandomNumberGenerator.GetInt32(100000, 999999).ToString());
                    break;
                case IdElementType.Random9Digit:
                    sb.Append(RandomNumberGenerator.GetInt32(1000000000, 999999999).ToString());
                    break;
                case IdElementType.Random20Bit:
                    int val20 = RandomNumberGenerator.GetInt32(0, 1048576); 
                    sb.Append(val20.ToString(element.Format ?? "D")); 
                    break;
                case IdElementType.Random32Bit:
                    byte[] bytes = RandomNumberGenerator.GetBytes(4);
                    uint val32 = BitConverter.ToUInt32(bytes, 0);
                    sb.Append(val32.ToString(element.Format ?? "D"));
                    break;
            }
        }
        return sb.ToString();
    }
}