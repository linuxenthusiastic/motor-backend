from abc import ABC, abstractmethod
from multiprocessing import Event


class EventObserver(ABC):
    @abstractmethod
    def handle(self, event_type: str, payload: dict) -> None: ...


class EventBus:
    def __init__(self):
        self._observers: list[EventObserver] = []

    def subscribe(self, observer: EventObserver) -> None:
        self._observers.append(observer)

    def publish(self, event_type: str, payload: dict) -> None:
        for observer in self._observers:
            observer.handle(event_type, payload)


event_bus = EventBus()
