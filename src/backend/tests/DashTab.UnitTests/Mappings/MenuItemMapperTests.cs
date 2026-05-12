using DashTab.Application.Dtos;
using DashTab.Application.Mappings;
using DashTab.Domain.Entities;

namespace DashTab.UnitTests.Mappings;

public class MenuItemMapperTests
{
    private readonly MenuItemMapper _mapper = new();

    [Fact]
    public void ToDto_FlattensCategoryName_AndRenamesIsAvailable()
    {
        var item = new MenuItem
        {
            Id = Guid.NewGuid(),
            CategoryId = Guid.NewGuid(),
            Name = "Espresso",
            Description = "Strong coffee",
            Price = 2.50m,
            IsAvailable = true,
            Category = new MenuCategory { Name = "Drinks", DisplayOrder = 1 },
        };

        var dto = _mapper.ToDto(item);

        Assert.Equal(item.Id, dto.Id);
        Assert.Equal("Espresso", dto.Name);
        Assert.Equal("Drinks", dto.Category);
        Assert.Equal(2.50m, dto.Price);
        Assert.Equal("Strong coffee", dto.Description);
        Assert.True(dto.Available);
    }

    [Fact]
    public void ToEntity_RenamesAvailableToIsAvailable()
    {
        var categoryId = Guid.NewGuid();
        var req = new CreateMenuItemRequest("Latte", categoryId, 3.50m, "With milk", Available: false);

        var item = _mapper.ToEntity(req);

        Assert.Equal("Latte", item.Name);
        Assert.Equal(categoryId, item.CategoryId);
        Assert.Equal(3.50m, item.Price);
        Assert.Equal("With milk", item.Description);
        Assert.False(item.IsAvailable);
        Assert.Equal(Guid.Empty, item.Id);
    }

    [Fact]
    public void Update_PreservesIdAndAudit()
    {
        var existingId = Guid.NewGuid();
        var createdAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var item = new MenuItem
        {
            Id = existingId,
            Name = "Old",
            CategoryId = Guid.NewGuid(),
            Price = 1m,
            Description = "old",
            IsAvailable = true,
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
        };
        var newCategoryId = Guid.NewGuid();
        var req = new UpdateMenuItemRequest("New", newCategoryId, 9.99m, "new", Available: false);

        _mapper.Update(req, item);

        Assert.Equal("New", item.Name);
        Assert.Equal(newCategoryId, item.CategoryId);
        Assert.Equal(9.99m, item.Price);
        Assert.False(item.IsAvailable);
        Assert.Equal(existingId, item.Id);
        Assert.Equal(createdAt, item.CreatedAt);
    }
}
