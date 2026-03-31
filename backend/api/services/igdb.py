import requests
import os
from datetime import datetime

class IGDBService:
    def __init__(self):
        self.client_id = os.getenv("IGDB_CLIENT_ID")
        self.client_secret = os.getenv("IGDB_CLIENT_SECRET")
        self.access_token = None

    def _get_token(self):
        """Internal helper to get a fresh Twitch OAuth token."""
        url = "https://id.twitch.tv/oauth2/token"
        params = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "client_credentials"
        }
        res = requests.post(url, params=params)
        res.raise_for_status()
        self.access_token = res.json()['access_token']

    def fetch_games(self, query_body: str):
        """Execute a raw IGDB query."""
        if not self.access_token:
            self._get_token()

        url = "https://api.igdb.com/v4/games"
        headers = {
            "Client-ID": self.client_id,
            "Authorization": f"Bearer {self.access_token}"
        }
        
        response = requests.post(url, headers=headers, data=query_body)
        
        # If token expired, refresh and try once more
        if response.status_code == 401:
            self._get_token()
            headers["Authorization"] = f"Bearer {self.access_token}"
            response = requests.post(url, headers=headers, data=query_body)

        data = response.json()
        
        # CLEANUP LOGIC: IGDB returns cover IDs or small thumbnails.
        # We transform them into high-res '1080p' URLs for the Netflix look.
        for game in data:
            if 'cover' in game:
                game['cover_url'] = game['cover']['url'].replace('t_thumb', 't_1080p')
            else:
                game['cover_url'] = "https://via.placeholder.com/1080x1350?text=No+Cover"
        
        return data

igdb_client = IGDBService()