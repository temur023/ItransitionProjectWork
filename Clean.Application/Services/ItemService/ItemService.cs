using System.Security.Claims;
using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain.Entities;
using Clean.Domain.Entities.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Clean.Application.Services;

public class ItemService(IItemRepository repository, IInvetoryRepository invetoryRepository,
    IUserRepository userRepository,
    CustomIdGeneratorService customIdGenerator, HttpContextAccessor httpContextAccessor):IItemService
{
    private int? GetCurrentUserId() => int.TryParse(httpContextAccessor.HttpContext?.User
        .FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId) ? userId : null;
    public async Task<PagedResponse<ItemGetDto>> GetAll(ItemFilter filter, int invId)
    {
        var itms = await repository.GetAll(filter, invId);
        var dto = itms.Items.Select(u=>new ItemGetDto()
        {
            Id = u.Id,
            InventoryId = u.InventoryId,
            CustomId = u.CustomId,
            CreatedById =  u.CreatedById,
            CreatedAt = DateTime.UtcNow,
            UpdatedById =  u.UpdatedById,
            UpdatedAt = DateTime.UtcNow,
            Version = u.Version,
        }).ToList();
        return new PagedResponse<ItemGetDto>(dto,filter.PageNumber, filter.PageSize,itms.Total,"Success");
    }

    public async Task<Response<ItemGetDto>> GetById(int id)
    {
        var itm = await repository.GetById(id);
        var dto = new ItemGetDto()
        {
            Id = itm.Id,
            CustomId = itm.CustomId,
            InventoryId = itm.InventoryId,
            CreatedById =  itm.CreatedById,
            CreatedAt = DateTime.UtcNow,
            UpdatedById =  itm.UpdatedById,
            UpdatedAt = itm.UpdatedAt,
            Version = itm.Version,
        };
        return new Response<ItemGetDto>(200, "Success", dto);
    }

    public async Task<Response<string>> Create(ItemCreateDto dto)
    {
        var currentUser = GetCurrentUserId();
        var inventory = await invetoryRepository.GetById(dto.InventoryId);
        if (currentUser == null)
        {
            return new Response<string>(404,"You are not allowed to write");
        }
        var user = await userRepository.GetById((int)currentUser);
        if(inventory.UserAccesses.Any (u => u.UserId != currentUser)
           && inventory.CreatedById != currentUser && user.Role!=UserRole.Admin)
        {
            return new Response<string>(404,"You are not allowed to write");
        }
        var model = new Item()
        {
            InventoryId = dto.InventoryId,
            CreatedById = (int)currentUser,
            UpdatedById = (int)currentUser,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Version = 1,
        };
        try 
        {
            Func<int, string> generatorFunc = (seq) => 
               customIdGenerator.GenerateId(inventory.CustomIdFormatJson, seq);

            var result = await repository.Create(model, generatorFunc);
        
            return new Response<string>(200, $"Success. Created with ID: {result.FinalCustomId}");
        }
        catch (DbUpdateException)
        {
            return new Response<string>(409, "A duplicate Custom ID was generated. Please try again or enter a manual ID.");
        }
    }

    public async Task<Response<string>> Update(ItemCreateDto dto)
    {
        var itm = await repository.GetById(dto.Id);
        var currentUser = GetCurrentUserId();
        var inventory = await invetoryRepository.GetById(itm.InventoryId);
        if (currentUser == null)
        {
            return new Response<string>(404,"You are not allowed to write");
        }
        var user = await userRepository.GetById((int)currentUser);
        if(inventory.UserAccesses.Any (u => u.UserId != currentUser)
           && inventory.CreatedById != currentUser && user.Role!=UserRole.Admin)
        {
            return new Response<string>(404,"You are not allowed to write");
        }
        itm.Description = dto.Description;
        itm.Name = dto.Name;
        itm.UpdatedAt = DateTime.UtcNow;
        itm.UpdatedById = (int)currentUser;
        await repository.SaveChanges();
        return new Response<string>(200, "Success");
    }

    public async Task<Response<string>> Delete(int id)
    {
        var currentUser = GetCurrentUserId();
        var itm =  await repository.GetById(id);
        var inventory = await invetoryRepository.GetById(itm.InventoryId);
        if (currentUser == null)
        {
            return new Response<string>(404,"You are not allowed to write");
        }
        var user = await userRepository.GetById((int)currentUser);
        if(inventory.UserAccesses.Any (u => u.UserId != currentUser)
           && inventory.CreatedById != currentUser && user.Role!=UserRole.Admin)
        {
            return new Response<string>(404,"You are not allowed to write");
        }
        
        var item = await repository.Delete(id);
        if(item == -1) return new Response<string>(404," not found");
        return new Response<string>(200, "deleted");
    }
}