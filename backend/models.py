from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Zone(db.Model):
    __tablename__ = 'zones'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    
    # ML Outputs
    growth_velocity_score = db.Column(db.Float, default=0.0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tenders = db.relationship('Tender', backref='zone', lazy=True)
    properties = db.relationship('Property', backref='zone', lazy=True)

class Tender(db.Model):
    __tablename__ = 'tenders'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    zone_id = db.Column(db.String(50), db.ForeignKey('zones.id'), nullable=False)
    
    title = db.Column(db.String(255), nullable=False)
    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)
    description = db.Column(db.Text, nullable=True)
    estimated_budget = db.Column(db.Float, nullable=True) # e.g., in millions
    tender_date = db.Column(db.DateTime, nullable=False)
    source_url = db.Column(db.String(500), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Property(db.Model):
    __tablename__ = 'properties'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    zone_id = db.Column(db.String(50), db.ForeignKey('zones.id'), nullable=False)
    
    property_type = db.Column(db.String(50), nullable=False) # e.g., 'residential', 'commercial'
    status = db.Column(db.String(50), nullable=False) # e.g., 'ready_to_move', 'under_construction'
    
    price = db.Column(db.Float, nullable=False)
    area_sqft = db.Column(db.Float, nullable=False)
    price_per_sqft = db.Column(db.Float, nullable=False)
    monthly_rent = db.Column(db.Float, nullable=True)
    
    listing_date = db.Column(db.DateTime, default=datetime.utcnow)
    source_url = db.Column(db.String(500), nullable=True)
