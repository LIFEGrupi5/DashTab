using DashTab.Application.Dtos;
using DashTab.Application.Storage;
using FluentValidation;

namespace DashTab.Application.Validators;

public class ImageUploadRequestValidator : AbstractValidator<ImageUploadRequest>
{
    public ImageUploadRequestValidator()
    {
        var allowed = string.Join(", ", ImagePolicy.AllowedExtensions.Keys.Distinct(StringComparer.OrdinalIgnoreCase));

        RuleFor(x => x.FileExtension)
            .NotEmpty()
            .Must(ext => ImagePolicy.ResolveContentType(ext) is not null)
            .WithMessage($"Unsupported image extension. Allowed: {allowed}.");
    }
}
