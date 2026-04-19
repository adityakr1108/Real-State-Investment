import random

def generate_mock_zones():
    # Mock some zones (e.g., using lat/long clusters)
    zones = []
    base_lat, base_lng = 28.6139, 77.2090 # Base Coordinates
    
    for i in range(1, 21): # 20 micro-markets
        lat = base_lat + random.uniform(-0.1, 0.1)
        lng = base_lng + random.uniform(-0.1, 0.1)
        
        # Features
        tender_volume = random.randint(0, 15)
        rental_yield = round(random.uniform(2.0, 6.5), 2)
        price_velocity = round(random.uniform(-2.0, 8.0), 2)
        under_construction_premium = round(random.uniform(5, 20), 1)
        
        # Simple Mock ML formula for Growth velocity
        raw_score = (tender_volume * 1.5) + (rental_yield * 2) - (price_velocity * 1.2) + (under_construction_premium * 0.5)
        # Normalize to 0-100
        score = min(max(int((raw_score + 10) * 2.5), 0), 100)
        
        zones.append({
            "id": f"zone_{i}",
            "name": f"Micro-Market {i}",
            "lat": lat,
            "lng": lng,
            "metrics": {
                "tender_volume_10km": tender_volume,
                "rental_yield_pct": rental_yield,
                "price_velocity_pct": price_velocity,
                "under_construction_premium_pct": under_construction_premium
            },
            "growth_velocity_score": score
        })
    
    return zones
