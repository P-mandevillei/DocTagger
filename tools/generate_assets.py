"""Generate Marketplace-ready PNG branding assets from simple vector shapes."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SITE_ASSETS = ROOT / "site" / "assets"
SCALE = 4


def scaled(points):
    return tuple(int(value * SCALE) for value in points)


def font(size, bold=False):
    candidates = [
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size * SCALE)
    return ImageFont.load_default()


def draw_mark(size):
    image = Image.new("RGBA", (size * SCALE, size * SCALE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    factor = size / 1024

    def p(values):
        return tuple(int(value * factor * SCALE) for value in values)

    draw.polygon(
        [p((130, 230)), p((622, 158)), p((930, 512)), p((622, 866)), p((130, 794))],
        fill="#163B5C",
    )
    draw.ellipse(p((220, 442, 360, 582)), fill="#48B8B2")
    for bounds in ((430, 358, 724, 412), (430, 485, 658, 539), (430, 612, 724, 666)):
        draw.rounded_rectangle(p(bounds), radius=max(1, int(27 * factor * SCALE)), fill="white")
    return image.resize((size, size), Image.Resampling.LANCZOS)


def make_icons():
    ASSETS.mkdir(parents=True, exist_ok=True)
    SITE_ASSETS.mkdir(parents=True, exist_ok=True)
    for size in (32, 128):
        image = draw_mark(size)
        image.save(ASSETS / f"icon-{size}.png", optimize=True)
        image.save(SITE_ASSETS / f"icon-{size}.png", optimize=True)


def make_banner():
    width, height = 220, 140
    image = Image.new("RGB", scaled((width, height)), "#F2F7FA")
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(scaled((8, 8, 212, 132)), radius=scaled((16,))[0], fill="#E4F1F2")
    icon = draw_mark(72).resize(scaled((72, 72)), Image.Resampling.LANCZOS)
    image.paste(icon, scaled((16, 34)), icon)
    draw.text(scaled((94, 42)), "Doc Tag", font=font(21, bold=True), fill="#163B5C")
    draw.text(scaled((94, 67)), "Index", font=font(21, bold=True), fill="#163B5C")
    draw.text(scaled((94, 98)), "Tags · counts · links", font=font(9), fill="#2D6F73")
    image.resize((width, height), Image.Resampling.LANCZOS).save(
        ASSETS / "card-banner-220x140.png", optimize=True
    )


if __name__ == "__main__":
    make_icons()
    make_banner()
