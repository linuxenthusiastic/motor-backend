import json

import redis

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

CACHE_TTL_SECONDS = 60


def get_cached(key: str):
    value = redis_client.get(key)
    if value is None:
        return None
    return json.loads(value)


def set_cached(key: str, value, ttl: int = CACHE_TTL_SECONDS):
    redis_client.set(key, json.dumps(value), ex=ttl)
