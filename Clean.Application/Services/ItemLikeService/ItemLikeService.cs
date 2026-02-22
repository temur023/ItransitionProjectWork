using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain;

namespace Clean.Application.Services;

public class ItemLikeService(IItemLikeRepository repository) : IItemLikeService
{
    public async Task<PagedResponse<ItemLikeGetDto>> GetAll(ItemLikeFilter filter)
    {
        var result = await repository.GetAll(filter);
        var dto = result.Likes.Select(l => new ItemLikeGetDto
        {
            ItemId = l.ItemId,
            UserId = l.UserId,
            CreatedAt = l.CreatedAt
        }).ToList();
        return new PagedResponse<ItemLikeGetDto>(dto, filter.PageNumber, filter.PageSize, result.Total, "Success");
    }

    public async Task<Response<ItemLikeGetDto>> GetByItemAndUser(int itemId, int userId)
    {
        var like = await repository.GetByItemAndUser(itemId, userId);
        if (like == null) return new Response<ItemLikeGetDto>(404, "Item like not found", null);
        var dto = new ItemLikeGetDto
        {
            ItemId = like.ItemId,
            UserId = like.UserId,
            CreatedAt = like.CreatedAt
        };
        return new Response<ItemLikeGetDto>(200, "Success", dto);
    }

    public async Task<Response<string>> Create(ItemLikeCreateDto dto)
    {
        var model = new ItemLike
        {
            ItemId = dto.ItemId,
            UserId = dto.UserId
        };
        await repository.Create(model);
        return new Response<string>(200, "Item like created");
    }

    public async Task<Response<string>> Delete(int itemId, int userId)
    {
        var deleted = await repository.Delete(itemId, userId);
        if (!deleted) return new Response<string>(404, "Item like not found");
        return new Response<string>(200, "Item like deleted");
    }
}
