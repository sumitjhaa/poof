import httpx
from dataclasses import dataclass
from typing import Optional


@dataclass
class Webhook:
    id: str
    url: str
    secret_id: str
    event: str  # "expired", "consumed", "created"
    created_at: str


class WebhookStore:
    def __init__(self):
        self._webhooks: dict[str, Webhook] = {}

    def add(self, webhook: Webhook):
        self._webhooks[webhook.id] = webhook

    def get_by_secret(self, secret_id: str) -> list[Webhook]:
        return [w for w in self._webhooks.values() if w.secret_id == secret_id]

    def remove(self, webhook_id: str):
        self._webhooks.pop(webhook_id, None)


webhook_store = WebhookStore()


async def notify_webhooks(secret_id: str, event: str):
    webhooks = webhook_store.get_by_secret(secret_id)

    async with httpx.AsyncClient() as client:
        for webhook in webhooks:
            try:
                await client.post(
                    webhook.url,
                    json={
                        "event": event,
                        "secret_id": secret_id,
                        "webhook_id": webhook.id,
                    },
                    timeout=5,
                )
            except Exception:
                pass

            webhook_store.remove(webhook.id)
