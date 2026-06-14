using DashTab.Application.Dtos;
using DashTab.Application.Mappings;
using DashTab.Domain.Entities;

namespace DashTab.UnitTests.Mappings;

public class MenuCategoryMapperTests
{
    private readonly MenuCategoryMapper _mapper = new();

    [Fact]
    public void ToDto_CopiesCoreFields()
    {
        var cat = new MenuCategory
        {
            Id = Guid.NewGuid(),
            Name = "Drinks",
            DisplayOrder = 2,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false,
        };

        var dto = _mapper.ToDto(cat);

        Assert.Equal(cat.Id, dto.Id);
        Assert.Equal("Drinks", dto.Name);
        Assert.Equal(2, dto.DisplayOrder);
    }

    [Fact]
    public void ToEntity_PopulatesRequestFields_LeavesIdAndAuditAlone()
    {
        var req = new CreateCategoryRequest("Mains", 5);

        var cat = _mapper.ToEntity(req);

        Assert.Equal("Mains", cat.Name);
        Assert.Equal(5, cat.DisplayOrder);
        Assert.Equal(Guid.Empty, cat.Id);
        Assert.Equal(default, cat.CreatedAt);
        Assert.False(cat.IsDeleted);
    }

    [Fact]
    public void Update_OverwritesRequestFields_PreservesAuditAndId()
    {
        var existingId = Guid.NewGuid();
        var createdAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var cat = new MenuCategory
        {
            Id = existingId,
            Name = "Old",
            DisplayOrder = 1,
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
            IsDeleted = false,
        };
        var req = new UpdateCategoryRequest("New", 9);

        _mapper.Update(req, cat);

        Assert.Equal("New", cat.Name);
        Assert.Equal(9, cat.DisplayOrder);
        Assert.Equal(existingId, cat.Id);
        Assert.Equal(createdAt, cat.CreatedAt);
    }
}
