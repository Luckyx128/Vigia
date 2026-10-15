"""Integração de notificações via HTTP com a Notch do Cortinho."""
import logging
from typing import Optional
import httpx

from vigia.config import NOTCH_TIMEOUT, NOTCH_URL

logger = logging.getLogger("vigia.notifier")


def notify_notch(message: str, kind: str = "alert", notch_url: Optional[str] = None) -> bool:
    """
    Envia uma notificação para o servidor da Notch (Cortinho).
    
    Args:
        message: Texto da notificação.
        kind: Tipo do alerta ('success', 'alert', 'error').
        notch_url: URL opcional para override (default config.NOTCH_URL).
        
    Returns:
        True se a notificação foi enviada e aceita com sucesso (200 OK), False caso contrário.
    """
    url = notch_url or NOTCH_URL
    payload = {
        "message": message,
        "kind": kind,
    }

    try:
        with httpx.Client(timeout=NOTCH_TIMEOUT) as client:
            response = client.post(url, json=payload)
            if response.status_code == 200:
                logger.info(f"Notch notification sent successfully: {message}")
                return True
            else:
                logger.warning(
                    f"Notch notification failed with status {response.status_code}: {response.text}"
                )
                return False
    except httpx.RequestError as exc:
        logger.warning(f"Could not connect to Notch at {url}: {exc}")
        return False
    except Exception as exc:
        logger.error(f"Unexpected error notifying Notch: {exc}")
        return False
