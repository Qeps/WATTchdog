# logger.py
import os
import logging


class Logger:
    # Base log folder
    BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs", "rpiBackendLogs")

    # Dictionary to hold separate loggers for each level
    _loggers = {}

    @classmethod
    def _getLogger(cls, level_name: str):
        """Get or create a logger for a specific log level."""
        if level_name in cls._loggers:
            return cls._loggers[level_name]

        # Ensure log directory exists
        os.makedirs(cls.BASE_DIR, exist_ok=True)

        # Log file path
        log_file = os.path.join(cls.BASE_DIR, f"{level_name.lower()}.log")

        # Create logger
        logger = logging.getLogger(level_name)
        logger.setLevel(getattr(logging, level_name))
        logger.propagate = False  # Avoid duplicate logs in root

        # File handler
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(getattr(logging, level_name))
        formatter = logging.Formatter(
            "%(asctime)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

        # Save in dictionary
        cls._loggers[level_name] = logger
        return logger

    @classmethod
    def debug(cls, message: str):
        cls._getLogger("DEBUG").debug(message)

    @classmethod
    def info(cls, message: str):
        cls._getLogger("INFO").info(message)

    @classmethod
    def warning(cls, message: str):
        cls._getLogger("WARNING").warning(message)

    @classmethod
    def error(cls, message: str):
        cls._getLogger("ERROR").error(message)
