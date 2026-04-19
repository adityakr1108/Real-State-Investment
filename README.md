# Aura Predex - Predictive Real Estate Platform

Aura Predex is a full-stack, predictive real estate analytics platform designed to identify high-growth investment zones. By seamlessly replacing static mock data with live geospatial infrastructure data from the OpenStreetMap Overpass API, the platform dynamically generates real-time institutional-grade investment insights. 

Aura Predex features a rich interactive map, utilizing spatial intelligence proxy models to score geographic zones based on planned infrastructure (tenders) and existing property values, projecting growth velocity trajectories.

## Key Features

- **Dynamic Regional Pipeline:** Search globally for any coordinates (or use Nominatim-based search for location names), and automatically extract live active construction/infrastructure and residential data within a dynamically calculated 30x30km bounding box.
- **Growth Velocity Scoring:** Proprietary heuristics combining the volume of government/infrastructure tenders and real estate arrays to score the investment viability of a real estate sector.
- **Interactive Geospatial Dashboard:** High-performance React, MapLibre GL, and Recharts-based frontend interface featuring:
  - Global region search functionality
  - Responsive heatmap visualizations of growth
  - Filterable zoning overlays to visualize new commercial and infrastructure developments
  - Intuitive analytics sidebar breaking down price trajectories and metric comparisons

## Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Mapping:** `react-map-gl`, `maplibre-gl` (with Carto Dark styling)
- **Data Visualization:** `recharts` for pricing trajectory models
- **Styling UI:** Responsive, CSS-driven UI with fluid glassmorphism aesthetics and `lucide-react` iconography

### Backend
- **Framework:** Flask (Python) with Flask-CORS
- **Database:** SQLite & SQLAlchemy for fast temporal orchestration of geographical data (`Zone`, `Tender`, `Property` relationships)
- **Data Scraping / Gathering:** Custom integration with the OpenStreetMap Overpass API (`scraper.overpass_api`) to curate and fetch live residential and government-infrastructure zoning models in real-time.

## Project Structure

```text
real_estate/
├── backend/
│   ├── app.py                  # Main Flask API REST framework
│   ├── live_pipeline.py        # Core generation pipeline (Scraper -> Scoring -> Hydration)
│   ├── models.py               # SQLAlchemy Database schemas
│   ├── real_estate.db          # Auto-generated spatial DB instance
│   └── scraper/
│       └── overpass_api.py     # OSM Overpass querying handler
└── frontend/
    ├── src/
    │   ├── App.jsx             # Core Map and Analytics dashboard structure
    │   ├── index.css           # Custom theme layout and visual system
    │   └── main.jsx
    ├── package.json            # Vite configuration and package dependencies
    └── vite.config.js
```

## Setup & Installation

### 1. Backend Setup

From the `backend/` directory:

1. Optionally create a virtual environment:
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # On Windows PowerShell
   ```
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   python app.py
   ```
   > Note: Ensure your Flask API is running gracefully on port `5000` (the default port that the Vite frontend dials into).

### 2. Frontend Setup

From the `frontend/` directory:

1. Install project dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open your browser to the local Vite frontend address (`http://localhost:5173` typically).
2. The map default centers on a designated hub (e.g., New Delhi).
3. Utilize the **Search Region** function in the top navigator to find a new town or neighborhood. The app will coordinate with the server, flush the local database, poll live Overpass mapping data, run the heuristics pipeline, and orchestrate the new visualizations in real-time.
4. Toggle **Zoning Overlays** and click on areas in the **Growth Heatmap** to open the in-depth Analytical Sidebar for score reports and pricing trajectories.
