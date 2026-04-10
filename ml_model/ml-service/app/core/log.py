from __future__ import annotations

import logging


def get_logger(name: str) -> logging.Logger:
    """Module logger; output is styled by Rich after configure_logging runs."""
    return logging.getLogger(name)
