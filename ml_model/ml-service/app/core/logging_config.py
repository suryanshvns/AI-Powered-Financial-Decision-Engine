from __future__ import annotations

import logging
import os
import sys
from typing import TYPE_CHECKING, Union

from rich.console import Console
from rich.highlighter import ReprHighlighter
from rich.logging import RichHandler
from rich.theme import Theme
from rich.traceback import install as install_rich_traceback

if TYPE_CHECKING:
    from app.core.config import Settings

_LOG_THEME = Theme(
    {
        "logging.level.debug": "italic dim cyan",
        "logging.level.info": "bold chartreuse1",
        "logging.level.warning": "bold gold1",
        "logging.level.error": "bold bright_red",
        "logging.level.critical": "bold white on bright_red",
        "log.time": "bright_blue",
        "log.path": "magenta",
        "repr.str": "spring_green1",
        "repr.number": "bright_cyan",
        "repr.attrib_name": "yellow",
        "repr.attrib_value": "bright_white",
    },
)


def _is_color_requested() -> bool:
    if os.environ.get("NO_COLOR"):
        return False
    if os.environ.get("FORCE_COLOR", "").lower() in ("1", "true", "yes"):
        return True
    return sys.stdout.isatty()


def setup_rich_logging(level: Union[int, str] = logging.INFO) -> None:
    """Configure the root logger with Rich (color levels, highlighted values, tracebacks)."""
    if isinstance(level, str):
        level = getattr(logging, level.upper(), logging.INFO)

    use_color = _is_color_requested()
    console = Console(
        file=sys.stdout,
        soft_wrap=True,
        theme=_LOG_THEME,
        force_terminal=use_color,
        color_system="truecolor" if use_color else None,
        highlight=True,
    )
    width = console.width if console.width else 120
    install_rich_traceback(
        show_locals=False,
        width=min(120, width),
        suppress=[logging],
    )

    handler = RichHandler(
        console=console,
        show_time=True,
        show_path=True,
        markup=True,
        rich_tracebacks=True,
        tracebacks_show_locals=False,
        log_time_format="[%X]",
        omit_repeated_times=True,
        highlighter=ReprHighlighter(),
    )
    handler.setLevel(level)

    logging.basicConfig(
        level=level,
        format="%(message)s",
        handlers=[handler],
        force=True,
    )

    root = logging.getLogger()
    root.setLevel(level)

    for name in ("uvicorn", "uvicorn.error", "uvicorn.asgi"):
        lg = logging.getLogger(name)
        lg.handlers.clear()
        lg.propagate = True
        lg.setLevel(level)

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def configure_logging(settings: Settings) -> None:
    """Apply logging from application settings (call from FastAPI lifespan)."""
    setup_rich_logging(settings.log_level)
