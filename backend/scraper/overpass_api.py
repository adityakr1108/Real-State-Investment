import requests

class OverpassScraper:
    def __init__(self):
        self.endpoint = "https://overpass-api.de/api/interpreter"
        self.headers = {'User-Agent': 'AuraPredex_Analytics/1.0 (test@aurapredex.com)'}

    def fetch_infrastructure(self, bbox_str):
        # Queries OSM for live construction zones, planned railways, and hospitals
        query = f"""
        [out:json][timeout:25];
        (
          node["building"]({bbox_str});
          way["building"~"commercial|retail"]({bbox_str});
          node["railway"="station"]({bbox_str});
          node["amenity"~"hospital|clinic"]({bbox_str});
        );
        out center;
        """
        response = requests.post(self.endpoint, data={'data': query}, headers=self.headers)
        
        results = []
        if response.status_code == 200:
            data = response.json()
            for element in data.get('elements', []):
                lat = element.get('lat') or element.get('center', {}).get('lat')
                lng = element.get('lon') or element.get('center', {}).get('lon')
                tags = element.get('tags', {})
                
                name = tags.get('name', 'Development Project')
                type_desc = 'Commercial' if 'building' in tags else (
                    'Transport Hub' if tags.get('railway') else 'Civil Amenity'
                )
                
                if lat and lng:
                    results.append({
                        "title": f"{type_desc}: {name}",
                        "lat": lat,
                        "lng": lng,
                        "estimated_budget": 50.0  # Synthesized budget proxy
                    })
        else:
            print("INFRA ERROR", response.status_code, response.text)
        return results

    def fetch_residential(self, bbox_str):
        # Queries OSM for actual residential complexes/buildings
        query = f"""
        [out:json][timeout:25];
        (
          way["building"~"residential|apartments|house"]({bbox_str});
        );
        out center;
        """
        response = requests.post(self.endpoint, data={'data': query}, headers=self.headers)
        
        results = []
        if response.status_code == 200:
            data = response.json()
            for element in data.get('elements', []):
                lat = element.get('lat') or element.get('center', {}).get('lat')
                lng = element.get('lon') or element.get('center', {}).get('lon')
                
                if lat and lng:
                    results.append({
                        "lat": lat,
                        "lng": lng
                    })
        else:
            print("RES ERROR", response.status_code, response.text)
        return results
