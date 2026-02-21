using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain.Entities;

namespace Clean.Application.Services;

public class InventoryCommentService(IInventoryCommentRepository repository) : IInventoryCommentService
{
    public async Task<PagedResponse<InventoryCommentGetDto>> GetAll(InventoryCommentFilter filter)
    {
        var result = await repository.GetAll(filter);
        var dto = result.Comments.Select(c => new InventoryCommentGetDto
        {
            Id = c.Id,
            InventoryId = c.InventoryId,
            UserId = c.UserId,
            Content = c.Content,
            CreatedAt = c.CreatedAt
        }).ToList();
        return new PagedResponse<InventoryCommentGetDto>(dto, filter.PageNumber, filter.PageSize, result.Total, "Success");
    }

    public async Task<Response<InventoryCommentGetDto>> GetById(int id)
    {
        var comment = await repository.GetById(id);
        if (comment == null) return new Response<InventoryCommentGetDto>(404, "Inventory comment not found", null);
        var dto = new InventoryCommentGetDto
        {
            Id = comment.Id,
            InventoryId = comment.InventoryId,
            UserId = comment.UserId,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt
        };
        return new Response<InventoryCommentGetDto>(200, "Success", dto);
    }

    public async Task<Response<string>> Create(InventoryCommentCreateDto dto)
    {
        var model = new InventoryComment
        {
            InventoryId = dto.InventoryId,
            UserId = dto.UserId,
            Content = dto.Content
        };
        await repository.Create(model);
        return new Response<string>(200, "Inventory comment created");
    }

    public async Task<Response<string>> Delete(int id)
    {
        var result = await repository.Delete(id);
        if (result == -1) return new Response<string>(404, "Inventory comment not found");
        return new Response<string>(200, "Inventory comment deleted");
    }
}
