import logging.config
import atexit
import json
from app.core.config import LOG_LEVEL


def setup_logging(config_file_path: str):
    """Sets up logging configuration from a JSON file."""
    with open(config_file_path, 'r') as logging_config:
        config = json.load(logging_config)

    logging.config.dictConfig(config)
    logging.getLogger().setLevel(LOG_LEVEL)

    queue_handler = logging.getHandlerByName("queue_handler")
    if queue_handler is not None:
        queue_handler.listener.start() # type: ignore
        atexit.register(queue_handler.listener.stop) # type: ignore
