# backend/api/services/igdb.py

import requests
import os
from fastapi import HTTPException

class IGDBService:
    def __init__(self):
        # Strip spaces to prevent env-var copy-paste bugs
        self.client_id = os.getenv("IGDB_CLIENT_ID", "").strip()
        self.client_secret = os.getenv("IGDB_CLIENT_SECRET", "").strip()
        self.access_token = None

    def _get_token(self):
        if not self.client_id or not self.client_secret:
            raise HTTPException(status_code=500, detail="IGDB credentials missing.")
            
        url = "https://id.twitch.tv/oauth2/token"
        params = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "client_credentials"
        }
        res = requests.post(url, params=params)
        
        if res.status_code != 200:
            print(f"IGDB Auth Error: {res.text}")
            raise HTTPException(status_code=500, detail="Twitch Auth Failed")
            
        self.access_token = res.json().get('access_token')

    def fetch_games(self, query_body: str):
        if not self.access_token:
            self._get_token()

        url = "https://api.igdb.com/v4/games"
        headers = {
            "Client-ID": self.client_id,
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
            "Content-Type": "text/plain"
        }
        
        response = requests.post(url, headers=headers, data=query_body.encode('utf-8'))
        
        if response.status_code == 401:
            self._get_token()
            headers["Authorization"] = f"Bearer {self.access_token}"
            response = requests.post(url, headers=headers, data=query_body.encode('utf-8'))

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="IGDB API error")

        data = response.json()
        
        # Cleanup Logic: Protocol fix + 1080p upgrade
        for game in data:
            if 'cover' in game and 'url' in game['cover']:
                cover_url = game['cover']['url']
                if cover_url.startswith("//"):
                    cover_url = "https:" + cover_url
                
                high_res = cover_url.replace('t_thumb', 't_1080p')
                game['cover_url'] = high_res
                game['cover']['url'] = high_res 
            else:
                placeholder = "https://images.igdb.com/igdb/image/upload/t_1080p/nocover.png"
                game['cover_url'] = placeholder
                game['cover'] = {'url': placeholder}
        
        return data

igdb_client = IGDBService()