import os
import random
from app import app, db
from models import Zone, Tender, Property
from scraper.municipal_scraper import MunicipalScraper
from scraper.real_estate_scraper import RealEstateScraper

def generate_mock_html(zone_id):
    # Generates a dummy HTML representing the target sites
    mun_html = f"""
    <table>
        <tr class='tender-row'>
            <td class='tender-title'>Metro Expansion {zone_id}</td>
            <td class='tender-desc'>Line extension to sector 4</td>
            <td class='tender-budget'>$45M</td>
        </tr>
    </table>
    """
    
    prop_html = ""
    for _ in range(random.randint(2, 6)):
        prop_html += f"""
        <div class='property-card'>
            <div class='price'>${random.randint(300, 900) * 1000}</div>
            <div class='area'>{random.randint(800, 2500)} sqft</div>
            <div class='type'>residential</div>
            <div class='status'>ready_to_move</div>
        </div>
        """
    return mun_html, prop_html

def seed():
    with app.app_context():
        # Clear existing
        db.drop_all()
        db.create_all()
        
        mun_scraper = MunicipalScraper("http://mock-municipal.gov")
        prop_scraper = RealEstateScraper("http://mock-realestate.com")
        
        base_lat, base_lng = 28.6139, 77.2090
        
        for i in range(1, 21):
            z_id = f"zone_{i}"
            z = Zone(
                id=z_id,
                name=f"Micro-Market {i}",
                lat=base_lat + random.uniform(-0.1, 0.1),
                lng=base_lng + random.uniform(-0.1, 0.1),
                growth_velocity_score=random.randint(40, 95)
            )
            db.session.add(z)
            db.session.commit()
            
            # Scrape using BeautifulSoup interfaces with mock HTML targets
            mun_html, prop_html = generate_mock_html(z_id)
            
            tenders = mun_scraper.parse_tenders_html(mun_html, z.id)
            for t_data in tenders:
                db.session.add(Tender(**t_data))
                
            properties = prop_scraper.parse_listings_html(prop_html, z.id)
            for p_data in properties:
                db.session.add(Property(**p_data))
                
        db.session.commit()
        print("Database seeded with Scraped data via Beautiful Soup interfaces.")

if __name__ == '__main__':
    seed()
