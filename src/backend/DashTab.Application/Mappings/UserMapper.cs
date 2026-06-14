using DashTab.Application.Dtos;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using Riok.Mapperly.Abstractions;

namespace DashTab.Application.Mappings;

[Mapper(EnumNamingStrategy = EnumNamingStrategy.CamelCase)]
public partial class UserMapper
{
    [MapProperty(nameof(User.FullName), nameof(StaffUserDto.Name))]
    [MapProperty(nameof(User.IsActive), nameof(StaffUserDto.Active))]
    [MapperIgnoreSource(nameof(User.HireStartDate))]
    [MapperIgnoreSource(nameof(User.Bio))]
    [MapperIgnoreSource(nameof(User.PhotoUrl))]
    [MapperIgnoreSource(nameof(User.CreatedAt))]
    [MapperIgnoreSource(nameof(User.UpdatedAt))]
    [MapperIgnoreSource(nameof(User.IsDeleted))]
    [MapperIgnoreSource(nameof(User.Orders))]
    public partial StaffUserDto ToDto(User user);

    [MapProperty(nameof(CreateStaffRequest.FullName), nameof(User.FullName))]
    [MapProperty(nameof(CreateStaffRequest.StartDate), nameof(User.HireStartDate))]
    [MapperIgnoreTarget(nameof(User.Id))]
    [MapperIgnoreTarget(nameof(User.CreatedAt))]
    [MapperIgnoreTarget(nameof(User.UpdatedAt))]
    [MapperIgnoreTarget(nameof(User.IsDeleted))]
    [MapperIgnoreTarget(nameof(User.IsActive))]
    [MapperIgnoreTarget(nameof(User.PhotoUrl))]
    [MapperIgnoreTarget(nameof(User.Orders))]
    public partial User ToEntity(CreateStaffRequest request);

    [MapProperty(nameof(UpdateStaffRequest.FullName), nameof(User.FullName))]
    [MapperIgnoreTarget(nameof(User.Id))]
    [MapperIgnoreTarget(nameof(User.CreatedAt))]
    [MapperIgnoreTarget(nameof(User.UpdatedAt))]
    [MapperIgnoreTarget(nameof(User.IsDeleted))]
    [MapperIgnoreTarget(nameof(User.IsActive))]
    [MapperIgnoreTarget(nameof(User.HireStartDate))]
    [MapperIgnoreTarget(nameof(User.Orders))]
    public partial void Update(UpdateStaffRequest request, User target);

    private static Role MapRoleString(string role) => Enum.Parse<Role>(role, ignoreCase: true);

    private static DateOnly? MapStartDate(string? raw) =>
        DateOnly.TryParse(raw, out var d) ? d : null;
}
