import requests
query = """
[out:json][timeout:25];
(
  node["building"](28.50,77.10,28.70,77.30);
);
out center limit 2;
"""
print("Querying overpass...")
res = requests.post("http://overpass-api.de/api/interpreter", data={'data': query})
if res.status_code == 200:
    print(res.json())
else:
    print("Error:", res.status_code, res.text)
