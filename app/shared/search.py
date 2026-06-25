import os

from elasticsearch import Elasticsearch, NotFoundError

ES_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
es = Elasticsearch(ES_URL)
VEHICLES_INDEX = "vehicles"


def index_vehicle(vehicle: dict) -> None:
    try:
        es.index(
            index=VEHICLES_INDEX,
            id=vehicle["id"],
            document={
                "brand": vehicle.get("brand"),
                "model": vehicle.get("model"),
                "year": vehicle.get("year"),
                "color": vehicle.get("color"),
                "plate": vehicle.get("plate"),
                "vin": vehicle.get("vin"),
                "dealer_id": vehicle.get("dealer_id"),
                "dealer_email": vehicle.get("dealer_email"),
                "is_published": vehicle.get("is_published", True),
            },
        )
    except Exception as e:
        print(f"[search] index_vehicle failed: {e}")


def remove_vehicle(vehicle_id: str) -> None:
    try:
        es.delete(index=VEHICLES_INDEX, id=vehicle_id)
    except NotFoundError:
        pass
    except Exception as e:
        print(f"[search] remove_vehicle failed: {e}")


def search_vehicles(query: str) -> list[dict]:
    try:
        result = es.search(
            index=VEHICLES_INDEX,
            query={
                "multi_match": {
                    "query": query,
                    "fields": ["brand^2", "model^2", "color", "plate", "vin", "dealer_email"],
                    "fuzziness": "AUTO",
                }
            },
        )
        return [{"id": hit["_id"], **hit["_source"]} for hit in result["hits"]["hits"]]
    except Exception as e:
        print(f"[search] search_vehicles failed: {e}")
        return []
