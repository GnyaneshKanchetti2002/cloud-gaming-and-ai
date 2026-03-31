from fastapi import APIRouter, HTTPException
from ..services.igdb import igdb_client

router = APIRouter()

@router.get("/trending")
def get_trending_games():
    """Fetches high-rated recent games for the Netflix-style slider."""
    # Query: Get name, cover info, and rating for games released recently with high ratings
    query = """
    fields name, cover.url, total_rating, summary; 
    where total_rating > 80 & version_parent = n; 
    sort total_rating desc; 
    limit 20;
    """
    try:
        return igdb_client.fetch_games(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search/{name}")
def search_games(name: str):
    """Powers the Cmd+K Search Matrix."""
    query = f'fields name, cover.url; search "{name}"; limit 10;'
    return igdb_client.fetch_games(query)