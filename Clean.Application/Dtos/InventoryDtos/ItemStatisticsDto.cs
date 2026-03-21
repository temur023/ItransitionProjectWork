namespace Clean.Application.Dtos;

public class ItemStatisticsDto
{
    public int FieldId { get; set; }
    public string FieldName { get; set; }
    public int? MaxNumber { get; set; }
    public int? MinNumber { get; set; }
    public int? AvgNumber { get; set; }
    public List<string?> MostPopularValuesOfText { get; set; }
}