from unittest.mock import Mock

import pytest

import mealie.services.openai.transcription as transcription_module
from mealie.services.openai import transcription
from mealie.services.recipe.import_workflow.compilers.transcription import TranscriptionCompiler


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", True),
        ("https://www.facebook.com/reel/1433866715330175/", True),
        ("https://www.facebook.com/share/r/1DWziuVHRi/", False),
        ("https://example.com/recipe", False),
        ("", False),
    ],
)
def test_is_video_url(url: str, expected: bool):
    """
    yt-dlp's Facebook extractor matches /reel/ but not /share/r/ share links.
    Those are handled by following redirects in the import workflow.
    """

    assert transcription.is_video_url(url) is expected


def test_transcription_compiler_uses_resolved_url(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        transcription,
        "is_video_url",
        lambda url: url == "https://www.facebook.com/reel/1433866715330175/",
    )

    ctx = Mock()
    ctx.input.url = "https://www.facebook.com/share/r/1DWziuVHRi/"
    ctx.resolved_url = "https://www.facebook.com/reel/1433866715330175/"
    ctx.ai.provider_settings.audio_provider_enabled = True

    compiler = TranscriptionCompiler(ctx)
    assert compiler.can_compile() is True
    assert compiler._url() == ctx.resolved_url


class _SettingsStub:
    YTDLP_COOKIEFILE: str | None = None


@pytest.fixture()
def settings_stub(monkeypatch):
    s = _SettingsStub()

    def _fake_get_app_settings():
        return s

    monkeypatch.setattr(transcription_module, "get_app_settings", _fake_get_app_settings)
    return s


class _FakeYoutubeDL:
    """Records the ydl_opts it was constructed with instead of hitting the network."""

    last_opts: dict | None = None
    calls: list[tuple[dict, bool]] = []
    captions: str | None = None
    caption_error: bool = False

    def __init__(self, opts: dict):
        _FakeYoutubeDL.last_opts = opts
        self.opts = opts

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def extract_info(self, url: str, download: bool = True):
        self.calls.append((self.opts.copy(), download))
        if download and self.opts["skip_download"] and self.caption_error:
            raise RuntimeError("caption service unavailable")
        if download and self.opts["skip_download"] and self.captions is not None:
            from pathlib import Path

            Path(self.opts["outtmpl"].replace("%(ext)s", "en.vtt")).write_text(self.captions)
        return {
            "title": "Fake Title",
            "description": "Fake Description",
            "thumbnail": None,
            "subtitles": {"en": [{}], "fr": [{}]} if self.captions is not None else {},
        }


@pytest.fixture()
def fake_yt_dlp(monkeypatch):
    _FakeYoutubeDL.last_opts = None
    _FakeYoutubeDL.calls = []
    _FakeYoutubeDL.captions = None
    _FakeYoutubeDL.caption_error = False
    monkeypatch.setattr("yt_dlp.YoutubeDL", _FakeYoutubeDL)
    return _FakeYoutubeDL


def test_download_video_omits_cookiefile_by_default(settings_stub, fake_yt_dlp, tmp_path):
    transcription_module.download_video("https://example.com/video", tmp_path)

    assert "cookiefile" not in fake_yt_dlp.last_opts


def test_download_video_passes_configured_cookiefile(settings_stub, fake_yt_dlp, tmp_path):
    settings_stub.YTDLP_COOKIEFILE = "/data/cookies.txt"

    transcription_module.download_video("https://example.com/video", tmp_path)

    assert fake_yt_dlp.last_opts["cookiefile"] == "/data/cookies.txt"


def test_captions_skip_audio_download_and_conversion(settings_stub, fake_yt_dlp, tmp_path):
    fake_yt_dlp.captions = "WEBVTT\n\n00:00.000 --> 00:02.000\nAdd the flour\n"
    result = transcription.download_video("https://example.com/video", tmp_path)
    assert result["transcription"] == "Add the flour"
    assert len(fake_yt_dlp.calls) == 2
    assert all(opts["skip_download"] for opts, _ in fake_yt_dlp.calls)
    assert fake_yt_dlp.last_opts["subtitleslangs"] == ["en"]
    assert fake_yt_dlp.last_opts["postprocessors"] == []


@pytest.mark.parametrize("caption_error", [False, True])
def test_unusable_captions_fall_back_to_audio(settings_stub, fake_yt_dlp, tmp_path, caption_error):
    fake_yt_dlp.captions = "WEBVTT\n\n"
    fake_yt_dlp.caption_error = caption_error
    result = transcription.download_video("https://example.com/video", tmp_path)
    assert result["transcription"] == ""
    assert result["subtitle"] is None
    assert not fake_yt_dlp.last_opts["skip_download"]
    assert not fake_yt_dlp.last_opts["writesubtitles"]
    assert not fake_yt_dlp.last_opts["writeautomaticsub"]


def test_no_captions_downloads_audio_with_bounded_retries(settings_stub, fake_yt_dlp, tmp_path):
    transcription.download_video("https://example.com/video", tmp_path)
    assert len(fake_yt_dlp.calls) == 2
    assert fake_yt_dlp.last_opts["socket_timeout"] == 15
    assert fake_yt_dlp.last_opts["retries"] == 2
    assert fake_yt_dlp.last_opts["noplaylist"] is True
