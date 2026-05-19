using System.ComponentModel;
using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using ModelContextProtocol.Server;

namespace DashTab.API.Mcp;

[McpServerToolType]
public static class StaffTools
{
    [McpServerTool(Name = "list_staff")]
    [Description("List staff users. Optionally filter by role or active status.")]
    public static async Task<IEnumerable<StaffUserDto>> ListStaff(
        IUserService users,
        [Description("Filter by role (e.g. Owner, Manager, Kitchen, Waiter). Case-insensitive. Omit for all roles.")]
        string? role = null,
        [Description("Filter by active status. true = only active, false = only inactive, omit for both.")]
        bool? active = null,
        [Description("Max number of staff to return (1-200). Defaults to 50.")]
        int take = 50)
    {
        take = Math.Clamp(take, 1, 200);
        var result = await users.ListAsync();
        if (!string.IsNullOrWhiteSpace(role))
            result = result.Where(u => string.Equals(u.Role, role, StringComparison.OrdinalIgnoreCase));
        if (active is { } a)
            result = result.Where(u => u.Active == a);
        return result.Take(take);
    }

    [McpServerTool(Name = "get_staff_member")]
    [Description("Get a single staff user by their id.")]
    public static Task<StaffUserDto?> GetStaffMember(
        IUserService users,
        [Description("Staff user id (GUID).")] Guid id) =>
        users.GetByIdAsync(id);
}
