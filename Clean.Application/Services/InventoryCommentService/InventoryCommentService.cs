using System.Security.Claims;
using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain.Entities;
using Clean.Domain.Entities.Enums;
using Microsoft.AspNetCore.Http;

namespace Clean.Application.Services;

public class InventoryCommentService(IInventoryCommentRepository repository
    ,IHttpContextAccessor httpContextAccessor,IUserRepository userRepository, IInventoryCommentNotifier notifier) : IInventoryCommentService
{
    private int? GetCurrentUserId() =>
        int.TryParse(httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)
            ?.Value, out var userId) ? userId : null;
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
            CreatedAt = comment.CreatedAt,
        };
        return new Response<InventoryCommentGetDto>(200, "Success", dto);
    }

    public async Task<Response<string>> Create(InventoryCommentCreateDto dto)
    {
        var curentUserId = GetCurrentUserId();
        if(curentUserId == null)
            return new Response<string>(400,"Not Authorized");
        var model = new InventoryComment
        {
            InventoryId = dto.InventoryId,
            UserId = dto.UserId,
            Content = dto.Content,
            CreatedAt = DateTime.UtcNow
        };
        var commentDto = new InventoryCommentGetDto
        {
            InventoryId = model.InventoryId,
            UserId = model.UserId,
            Content = model.Content,
            CreatedAt = model.CreatedAt
        };

        await notifier.NotifyCommentCreated(dto.InventoryId, commentDto);
        await repository.Create(model);
        return new Response<string>(200, "Inventory comment created");
    }

    public async Task<Response<string>> Delete(int id)
    {
        var curentUserId = GetCurrentUserId();
        if(curentUserId == null)
            return new Response<string>(403,"Not Authorized");
        var comment = await repository.GetById(id);
        var usr = await userRepository.GetById((int)curentUserId);
        if (comment.UserId != curentUserId && usr.Role!=UserRole.Admin)
        {
            return new Response<string>(403,"Not Authorized");
        }
        var result = await repository.Delete(id);
        if (result == -1) return new Response<string>(404, "Inventory comment not found");
        await notifier.NotifyCommentDeleted(comment.InventoryId, id);
        return new Response<string>(200, "Inventory comment deleted");
    }
}
