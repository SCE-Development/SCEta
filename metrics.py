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
    API_RESPONSE_CODES = (
        "api_response_codes",
        "Response codes of requests made to 511 API",
        prometheus_client.Counter,
        ['code'],
    )
    API_LATENCY = (
        "api_latency",
        "Latency/ response time of requests made to 511 API",
        prometheus_client.Summary,
    )
    CACHE_LAST_UPDATED = (
        "cache_last_updated",
        "Timestamp of when our cache was last updated",
        prometheus_client.Gauge,
    )
    HTTP_CODE = (
        "http_code",
        "Count of each HTTP Response code",
        prometheus_client.Counter,
        ['code'],
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