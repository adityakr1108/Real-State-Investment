import requests
query = """
[out:json][timeout:25];
(
  node["amenity"="hospital"](28.50,77.10,28.70,77.30);
);
out center limit 2;
"""
res = requests.get("https://overpass-api.de/api/interpreter", params={'data': query})
print(res.status_code)
print(res.text[:500])
