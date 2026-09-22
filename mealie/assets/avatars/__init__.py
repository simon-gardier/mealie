from pathlib import Path

CWD = Path(__file__).parent

DEFAULT_AVATAR = "emile"

AVATARS: dict[str, Path] = {
    "chef": CWD / "chef.webp",
    "colette": CWD / "colette.webp",
    "django": CWD / "django.webp",
    "ego": CWD / "ego.webp",
    "emile": CWD / "emile.webp",
    "linguini": CWD / "linguini.webp",
    "remy": CWD / "remy.webp",
    "skinner": CWD / "skinner.webp",
}


def get_avatar_path(name: str | None) -> Path:
    return AVATARS.get(name or DEFAULT_AVATAR, AVATARS[DEFAULT_AVATAR])
