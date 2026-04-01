# backend/api/routers/games.py

from fastapi import APIRouter, HTTPException, Query
from api.services.igdb import igdb_client

router = APIRouter()

@router.get("/trending")
def get_trending_games(
    limit: int = Query(20, ge=1, le=50), 
    offset: int = Query(0, ge=0)
):
    """Fetches high-rated recent games with pagination for the Discovery Matrix."""
    # Production-ready flat query
    query = f'fields name, cover.url, rating, genres.name; sort rating_count desc; where rating_count > 100; limit {limit}; offset {offset};'
    
    try:
        return igdb_client.fetch_games(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
def search_games(
    q: str, 
    limit: int = Query(20, ge=1, le=50), 
    offset: int = Query(0, ge=0)
):
    """Powers the Search Matrix and Discover search bar with pagination."""
    # Sanitize search input to prevent breaking IGDB syntax
    safe_q = q.replace('"', '\\"') 
    
    query = f'search "{safe_q}"; fields name, cover.url, rating, genres.name; limit {limit}; offset {offset};'
    
    try:
        return igdb_client.fetch_games(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))