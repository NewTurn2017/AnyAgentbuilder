from copy import deepcopy

from demo_data import initial_state
from models import ConversationStateModel, EventModel


class ConversationMemory:
    def __init__(self) -> None:
        self.memory: dict[str, ConversationStateModel] = {}

    def get_conversation(self, thread_id: str) -> ConversationStateModel:
        if thread_id not in self.memory:
            self.memory[thread_id] = deepcopy(initial_state())
        return self.memory[thread_id]

    def append_event(self, thread_id: str, event: EventModel) -> ConversationStateModel:
        conversation = self.get_conversation(thread_id)
        conversation.events.append(event)
        return conversation
