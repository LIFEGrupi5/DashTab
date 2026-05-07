using DashTab.Application.Dtos;
using DashTab.Application.Mappings;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;

namespace DashTab.UnitTests.Mappings;

public class UserMapperTests
{
    private readonly UserMapper _mapper = new();

    [Theory]
    [InlineData(Role.Owner, "owner")]
    [InlineData(Role.Manager, "manager")]
    [InlineData(Role.Waiter, "waiter")]
    [InlineData(Role.Kitchen, "kitchen")]
    public void ToDto_RoleIsLowercaseString(Role role, string expected)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Alice",
            Email = "alice@example.com",
            Role = role,
            IsActive = true,
        };

        var dto = _mapper.ToDto(user);

        Assert.Equal(expected, dto.Role);
    }

    [Fact]
    public void ToDto_RenamesFullNameAndIsActive()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Bob Smith",
            Email = "bob@example.com",
            Role = Role.Waiter,
            IsActive = false,
        };

        var dto = _mapper.ToDto(user);

        Assert.Equal("Bob Smith", dto.Name);
        Assert.False(dto.Active);
    }

    [Fact]
    public void ToEntity_ParsesRoleAndStartDate()
    {
        var req = new CreateStaffRequest("Carol", "carol@example.com", "Manager", "2025-03-15", "Bio text");

        var user = _mapper.ToEntity(req);

        Assert.Equal("Carol", user.FullName);
        Assert.Equal("carol@example.com", user.Email);
        Assert.Equal(Role.Manager, user.Role);
        Assert.Equal(new DateOnly(2025, 3, 15), user.HireStartDate);
        Assert.Equal("Bio text", user.Bio);
    }

    [Fact]
    public void ToEntity_NullStartDate_BecomesNullDateOnly()
    {
        var req = new CreateStaffRequest("Dave", "dave@example.com", "kitchen", null, null);

        var user = _mapper.ToEntity(req);

        Assert.Null(user.HireStartDate);
        Assert.Null(user.Bio);
    }

    [Fact]
    public void ToEntity_InvalidStartDateString_BecomesNull()
    {
        var req = new CreateStaffRequest("Eve", "eve@example.com", "owner", "not-a-date", null);

        var user = _mapper.ToEntity(req);

        Assert.Null(user.HireStartDate);
    }

    [Fact]
    public void Update_DoesNotTouchIsActiveOrAuditFields()
    {
        var existingId = Guid.NewGuid();
        var createdAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var user = new User
        {
            Id = existingId,
            FullName = "Old Name",
            Email = "old@example.com",
            Role = Role.Waiter,
            IsActive = true,
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
            HireStartDate = new DateOnly(2024, 1, 1),
        };
        var req = new UpdateStaffRequest("New Name", "new@example.com", "Manager", "new bio", "http://photo");

        _mapper.Update(req, user);

        Assert.Equal("New Name", user.FullName);
        Assert.Equal("new@example.com", user.Email);
        Assert.Equal(Role.Manager, user.Role);
        Assert.Equal("new bio", user.Bio);
        Assert.Equal("http://photo", user.PhotoUrl);
        Assert.True(user.IsActive);
        Assert.Equal(existingId, user.Id);
        Assert.Equal(createdAt, user.CreatedAt);
        Assert.Equal(new DateOnly(2024, 1, 1), user.HireStartDate);
    }
}
