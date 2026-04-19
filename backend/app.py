import os
from flask import Flask, jsonify
from flask_cors import CORS
from models import db, Zone, Tender, Property

app = Flask(__name__)
CORS(app)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'real_estate.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/api/zones/heatmap', methods=['GET'])
def get_heatmap_data():
    zones = Zone.query.all()
    features = []
    
    for zone in zones:
        # Calculate dynamic metrics from relations
        tenders = zone.tenders
        properties = zone.properties
        
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [zone.lng, zone.lat]
            },
            "properties": {
                "id": zone.id,
                "name": zone.name,
                "growth_velocity_score": zone.growth_velocity_score,
                "metrics": {
                    "tender_volume_10km": len(tenders),
                    "rental_yield_pct": 4.5, # Mock fallback
                    "price_velocity_pct": 2.1, # Mock fallback
                    "avg_property_price": sum(p.price for p in properties)/len(properties) if properties else 0
                }
            }
        })
    
    return jsonify({
        "type": "FeatureCollection",
        "features": features
    })

@app.route('/api/zones/<zone_id>', methods=['GET'])
def get_zone_details(zone_id):
    zone = Zone.query.get(zone_id)
    if not zone:
        return jsonify({"error": "Zone not found"}), 404
        
    return jsonify({
        "id": zone.id,
        "name": zone.name,
        "growth_score": zone.growth_velocity_score,
        "tenders": [{"title": t.title, "budget": t.estimated_budget} for t in zone.tenders],
        "properties": [{"type": p.property_type, "price": p.price} for p in zone.properties]
    })

@app.route('/api/tenders', methods=['GET'])
def get_tenders_geojson():
    tenders = Tender.query.all()
    features = []
    for t in tenders:
        if t.lat and t.lng:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [t.lng, t.lat]
                },
                "properties": {
                    "id": t.id,
                    "title": t.title,
                    "budget": t.estimated_budget,
                    "date": t.tender_date.strftime("%Y-%m-%d") if t.tender_date else ""
                }
            })
    return jsonify({
        "type": "FeatureCollection",
        "features": features
    })

from flask import request

@app.route('/api/generate_region', methods=['POST'])
def generate_region():
    data = request.json
    lat = data.get('lat')
    lng = data.get('lng')
    if lat is None or lng is None:
        return jsonify({"error": "Missing lat or lng"}), 400
    
    # Lazy load to avoid circular import issues
    from live_pipeline import run_pipeline_for_location
    run_pipeline_for_location(float(lat), float(lng))
    
    return jsonify({"success": True, "message": "Region generated successfully!"})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
