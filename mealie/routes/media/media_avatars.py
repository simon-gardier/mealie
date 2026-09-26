from fastapi import APIRouter, HTTPException, status
from starlette.responses import FileResponse

from mealie.assets import avatars as avatars_assets

router = APIRouter(prefix="/avatars")


@router.get("")
async def get_avatar_options() -> dict:
    """Returns the list of preset avatar names available for users to select from"""
    return {
        "avatars": sorted(avatars_assets.AVATARS.keys()),
        "default": avatars_assets.DEFAULT_AVATAR,
    }


@router.get("/{name}", response_class=FileResponse)
async def get_avatar_image(name: str):
    """Returns a preset avatar image"""
    avatar_path = avatars_assets.AVATARS.get(name)

    if avatar_path is None or not avatar_path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND)

    return FileResponse(avatar_path, media_type="image/webp")
