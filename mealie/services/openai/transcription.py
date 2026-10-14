import functools
import re
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import TypedDict

from mealie.core import exceptions
from mealie.core.config import get_app_settings
from mealie.core.root_logger import get_logger

from .openai import OpenAIService

SUBTITLE_LANGS = ["en", "fr", "es", "de", "it"]

logger = get_logger()


class TranscribedAudio(TypedDict):
    audio: Path
    subtitle: Path | None
    title: str
    description: str
    thumbnail_url: str | None
    transcription: str


@functools.cache
def get_yt_dlp_extractors() -> list:
    """Build and cache the yt-dlp extractor list once per process lifetime."""
    import yt_dlp
    from yt_dlp.extractor.generic import GenericIE

    return [ie for ie in yt_dlp.extractor.gen_extractors() if ie.working() and not isinstance(ie, GenericIE)]


def is_video_url(url: str) -> bool:
    """Whether yt-dlp recognizes the URL as something it can download."""

    if not url:
        return False

    return any(ie.suitable(url) for ie in get_yt_dlp_extractors())


def parse_subtitle_content(subtitle_content: str) -> str:
    # TODO: is there a better way to parse subtitles that's more efficient?

    lines = []
    for line in subtitle_content.split("\n"):
        if line.strip() and not line.startswith("WEBVTT") and "-->" not in line and not line.isdigit():
            lines.append(line.strip())

    raw_content = " ".join(lines)
    content = re.sub(r"<[^>]+>", "", raw_content)
    return content


def download_video(url: str, temp_path: Path) -> TranscribedAudio:
    """Fetches one caption track first, downloading audio only when it is needed."""

    import yt_dlp

    output_template = temp_path / "mealie"  # No extension here

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": str(output_template) + ".%(ext)s",
        "quiet": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": SUBTITLE_LANGS,
        "skip_download": False,
        "ignoreerrors": False,
        "noplaylist": True,
        "socket_timeout": 15,
        "retries": 2,
        "extractor_retries": 2,
        "fragment_retries": 2,
        "subtitlesformat": "vtt",
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "32",
            }
        ],
        "postprocessor_args": ["-ac", "1"],
    }

    settings = get_app_settings()
    if settings.YTDLP_COOKIEFILE:
        ydl_opts["cookiefile"] = settings.YTDLP_COOKIEFILE

    try:
        # Metadata is small; choose one track rather than downloading every translation.
        caption_opts = {**ydl_opts, "skip_download": True, "postprocessors": []}
        with yt_dlp.YoutubeDL(caption_opts) as ydl:
            info = ydl.extract_info(url, download=False)
        if not info:
            raise exceptions.VideoDownloadError("Failed to extract video information")

        available = {**(info.get("automatic_captions") or {}), **(info.get("subtitles") or {})}
        language = next((lang for lang in SUBTITLE_LANGS if lang in available), None)
        if language is None:
            language = next((lang for lang in available if lang != "live_chat"), None)

        video_data: TranscribedAudio = {
            "audio": output_template.with_suffix(".mp3"),
            "subtitle": None,
            "title": info.get("title", ""),
            "description": info.get("description", ""),
            "thumbnail_url": info.get("thumbnail") or None,
            "transcription": "",
        }
        if language:
            try:
                caption_opts["subtitleslangs"] = [language]
                with yt_dlp.YoutubeDL(caption_opts) as ydl:
                    ydl.extract_info(url, download=True)
                subtitle_path = output_template.with_suffix(f".{language}.vtt")
                if subtitle_path.exists():
                    video_data["subtitle"] = subtitle_path
                    video_data["transcription"] = read_subtitles(video_data)
                    if video_data["transcription"].strip():
                        return video_data
            except Exception:
                logger.warning("Captions unavailable; falling back to audio", exc_info=True)
            video_data["subtitle"] = None
            video_data["transcription"] = ""

        # Captions may be unavailable or empty. Do not request them again during audio download.
        audio_opts = {**ydl_opts, "writesubtitles": False, "writeautomaticsub": False}
        with yt_dlp.YoutubeDL(audio_opts) as ydl:
            audio_info = ydl.extract_info(url, download=True)
        if not audio_info:
            raise exceptions.VideoDownloadError("Failed to download video audio")
        return video_data
    except exceptions.VideoDownloadError:
        raise
    except Exception as e:
        raise exceptions.VideoDownloadError(f"Failed to download video: {e}") from e


def read_subtitles(video_data: TranscribedAudio) -> str:
    """Reads the downloaded subtitle file, if there is one. Returns an empty string on failure."""

    subtitle_path = video_data["subtitle"]
    if not subtitle_path:
        return ""

    try:
        with open(subtitle_path, encoding="utf-8") as f:
            subtitle_content = f.read()

        logger.info("Using subtitles from video instead of transcription")
        return parse_subtitle_content(subtitle_content)
    except Exception:
        logger.exception("Failed to read subtitles, falling back to transcription")
        return ""


async def resolve_transcription(
    video_data: TranscribedAudio,
    openai_service: OpenAIService,
    before_transcribe: Callable[[], Awaitable[None]] | None = None,
) -> str:
    """
    Resolves a video's transcript, preferring one that's already known, then its subtitles,
    and falling back to transcribing the audio with AI. `before_transcribe` is awaited only
    if that fallback is needed.
    """

    if video_data["transcription"]:
        return video_data["transcription"]

    if subtitles := read_subtitles(video_data):
        return subtitles

    if before_transcribe:
        await before_transcribe()

    try:
        transcript = await openai_service.transcribe_audio(video_data["audio"])
    except exceptions.RateLimitError:
        raise
    except Exception as e:
        raise exceptions.OpenAIServiceError(f"Failed to transcribe audio: {e}") from e

    if not transcript:
        raise exceptions.OpenAIServiceError("No transcription returned from OpenAI")

    return transcript
