import asyncio

from models import EventModel, JsonObject


def make_event(event_type: str, detail: str, payload: JsonObject | None = None) -> EventModel:
    return EventModel(type=event_type, detail=detail, public_payload=payload or {})


class EventStreamHub:
    def __init__(self) -> None:
        self.state: dict[str, list[asyncio.Queue[EventModel]]] = {}

    def register(self, thread_id: str) -> asyncio.Queue[EventModel]:
        queue: asyncio.Queue[EventModel] = asyncio.Queue()
        self.state.setdefault(thread_id, []).append(queue)
        return queue

    def unregister(self, thread_id: str, queue: asyncio.Queue[EventModel]) -> None:
        listeners = self.state.get(thread_id, [])
        if queue in listeners:
            listeners.remove(queue)
        if not listeners:
            self.state.pop(thread_id, None)

    def listener_count(self, thread_id: str | None = None) -> int:
        if thread_id is not None:
            return len(self.state.get(thread_id, []))
        return sum(len(listeners) for listeners in self.state.values())

    async def publish(self, thread_id: str, event: EventModel) -> None:
        for queue in list(self.state.get(thread_id, [])):
            await queue.put(event)
