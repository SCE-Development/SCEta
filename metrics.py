import enum

import prometheus_client

class Metrics(enum.Enum):
    STOPS_COUNT = (
        "stops_count", 
        "Number of stops checked",
        prometheus_client.Counter,
    )
    PREDICTIONS_COUNT = (
        "predictions_count", 
        "Number of predictions made (one for each incoming bus)",
        prometheus_client.Counter,
    )

    def __init__(self, title, description, prometheus_type, labels=()):
        self.title = title
        self.description = description
        self.prometheus_type = prometheus_type
        self.labels = labels

class MetricsHandler:
    _instance = None

    def __init__(self):
        raise RuntimeError('Call MetricsHandler.instance() instead')

    def init(self) -> None:
        for metric in Metrics:
            setattr(
                self,
                metric.title,
                metric.prometheus_type(
                    metric.title, metric.description, labelnames=metric.labels
                ),
            )

    @classmethod
    def instance(cls):
        if cls._instance is None:
            cls._instance = cls.__new__(cls)
            cls.init(cls)
        return cls._instance