import React, { useState, useEffect, useMemo, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Source, Layer, Popup } from 'react-map-gl/maplibre';
import { Activity, TrendingUp, DollarSign, Building, Search, Layers, Loader2, Target, MapPin } from 'lucide-react';
import { LineChart, Line, XAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const CARTODB_DARK = {
  version: 8,
  sources: { 'carto-dark': { type: 'raster', tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'], tileSize: 256, attribution: '&copy; OpenStreetMap contributors &copy; CARTO' } },
  layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark', minzoom: 0, maxzoom: 22 }]
};

const heatmapLayer = {
  id: 'heatmap', type: 'heatmap',
  paint: {
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'growth_velocity_score'], 0, 0, 100, 1],
    'heatmap-intensity': 1.5,
    'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0, 0, 255, 0)', 0.2, '#312879', 0.4, '#7000ff', 0.6, '#ff0055', 0.8, '#ff5e00', 1, '#00f0ff'],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 10, 9, 25, 15, 60],
    'heatmap-opacity': 0.8
  }
};

const pointsLayer = {
  id: 'points', type: 'circle',
  paint: {
    'circle-radius': 6, 'circle-color': '#00f0ff', 'circle-stroke-width': 1, 'circle-stroke-color': '#ffffff', 'circle-opacity': 0.8
  }
};

const tenderOverlayLayer = {
  id: 'tender-points', type: 'circle',
  paint: {
    'circle-radius': 8,
    'circle-color': '#ff0055',
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.9,
    'circle-pitch-alignment': 'map'
  }
};

export default function App() {
  const mapRef = useRef();
  const [zones, setZones] = useState(null);
  const [tenders, setTenders] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [hoverInfo, setHoverInfo] = useState(null);
  
  // HUD States
  const [overlaysActive, setOverlaysActive] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const [zoneRes, tenderRes] = await Promise.all([
        fetch('http://localhost:5000/api/zones/heatmap'),
        fetch('http://localhost:5000/api/tenders')
      ]);
      const zoneData = await zoneRes.json();
      const tenderData = await tenderRes.json();
      setZones(zoneData);
      setTenders(tenderData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  const generateRegionData = async (lat, lng) => {
    setIsGenerating(true);
    setSelectedZone(null); // Clear sidebar during generation
    try {
      const res = await fetch('http://localhost:5000/api/generate_region', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      if (res.ok) {
        await fetchMapData();
      } else {
        alert("Server failed to generate region data.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error orchestrating region generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        mapRef.current?.flyTo({
          center: [lon, lat],
          zoom: 11,
          duration: 2500,
          essential: true
        });
        setSearchOpen(false);
        // Trigger Dynamic Generation Pipeline!
        await generateRegionData(lat, lon);
      } else {
        alert("Location not found via Nominatim OpenStreetMap.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch location data.");
    } finally {
      setIsSearching(false);
    }
  };

  const locatMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsGenerating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 12,
          duration: 2500,
          essential: true
        });
        await generateRegionData(latitude, longitude);
      },
      (error) => {
        setIsGenerating(false);
        alert("Failed to retrieve your location.");
      }
    );
  };

  const chartData = useMemo(() => {
    if (!selectedZone) return [];
    
    const metrics = typeof selectedZone.properties.metrics === 'string' 
       ? JSON.parse(selectedZone.properties.metrics) 
       : selectedZone.properties.metrics || {};
       
    const base = metrics.price_velocity_pct || 0;
    const avg = metrics.avg_property_price || 5000;
    
    return [
      { name: '12M Ago', price: avg - (base * 100) },
      { name: '6M Ago', price: avg - (base * 50) },
      { name: 'Now', price: avg },
      { name: 'Target (24M)', price: avg * (1 + (selectedZone.properties.growth_velocity_score / 100) * 0.5) }
    ];
  }, [selectedZone]);

  const onHover = (event) => {
    if (isGenerating) return;
    const feature = event.features?.[0];
    if (feature && feature.layer.id !== 'tender-points') {
      setHoverInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        feature: feature
      });
    } else {
      setHoverInfo(null);
    }
  };

  return (
    <div className="app-container">
      {/* Loading Overlay when generating dynamic pipeline */}
      {isGenerating && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(10,12,20,0.85)', zIndex: 9999, 
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <Loader2 className="pulse-icon" size={64} color="var(--accent-primary)" style={{ marginBottom: '24px' }} />
          <h2 style={{ fontSize: '28px', margin: '0 0 12px 0' }}>Orchestrating Real Estate Analytics</h2>
          <p style={{ color: 'var(--text-muted)' }}>Extracting OpenStreetMap Infrastructure & Generating ML Growth Scores...</p>
        </div>
      )}

      {/* HUD Navigation */}
      <nav className="top-nav glass-panel">
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => setSelectedZone(null)}>
          <Activity size={24} color="var(--accent-primary)" />
          <span>AURA PREDEX</span>
        </div>
        
        {searchOpen && (
           <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', position: 'absolute', left: '260px', zIndex: 100 }}>
              <input 
                autoFocus
                type="text" 
                placeholder="Search global region..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)',
                  background: 'var(--bg-dark)', color: '#fff', outline: 'none', width: '280px', fontFamily: 'inherit'
                }} 
              />
              <button type="submit" className="btn active" disabled={isSearching}>
                {isSearching ? <Loader2 size={16} className="pulse-icon"/> : <Target size={16}/>}
              </button>
           </form>
        )}

        <div className="controls">
          <button className="btn" onClick={locatMe} title="Locate Me">
            <MapPin size={16} color="var(--accent-primary)" />
          </button>

          <button className="btn active"><Layers size={16} /> Growth Heatmap</button>
          
          <button 
             className={`btn ${overlaysActive ? 'active' : ''}`}
             onClick={() => setOverlaysActive(!overlaysActive)}
             style={overlaysActive ? { borderColor: 'var(--accent-tertiary)', color: 'var(--accent-tertiary)', background: 'rgba(255,0,85,0.1)' } : {}}
          >
            <Building size={16} /> Zoning Overlays
          </button>
          
          <button 
             className="btn" 
             onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search size={16} /> {searchOpen ? "Close Search" : "Search Region"}
          </button>
        </div>
      </nav>

      {/* Main Map Canvas */}
      <div className="map-container">
        {loading && !isGenerating ? (
           <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Loader2 className="pulse-icon" size={48} color="var(--accent-primary)" />
           </div>
        ) : (
          <Map
            ref={mapRef}
            initialViewState={{ longitude: 77.2090, latitude: 28.6139, zoom: 11 }}
            mapStyle={CARTODB_DARK}
            interactiveLayerIds={!isGenerating ? ['points', 'tender-points'] : []}
            onMouseMove={onHover}
            onClick={(e) => {
              if (isGenerating) return;
              const f = e.features?.[0];
              if (f && f.layer.id !== 'tender-points') setSelectedZone(f);
            }}
            cursor={hoverInfo && !isGenerating ? 'pointer' : 'default'}
          >
            {zones && (
              <Source type="geojson" data={zones}>
                <Layer {...heatmapLayer} />
                <Layer {...pointsLayer} />
              </Source>
            )}
            
            {/* Gov Infrastructure Tenders Overlay */}
            {overlaysActive && tenders && (
               <Source type="geojson" data={tenders}>
                 <Layer {...tenderOverlayLayer} />
               </Source>
            )}

            {/* Hover Tooltip */}
            {hoverInfo && hoverInfo.feature.properties.growth_velocity_score && (
              <Popup longitude={hoverInfo.longitude} latitude={hoverInfo.latitude} closeButton={false} closeOnClick={false} anchor="bottom">
                <div style={{ padding: '4px' }}>
                  <strong style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}>
                    {hoverInfo.feature.properties.name}
                  </strong>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                    Score: {hoverInfo.feature.properties.growth_velocity_score}
                  </span>
                </div>
              </Popup>
            )}
            
            {/* Tender Info Tooltip */}
            {hoverInfo && hoverInfo.feature.layer.id === 'tender-points' && (
              <Popup longitude={hoverInfo.longitude} latitude={hoverInfo.latitude} closeButton={false} closeOnClick={false} anchor="bottom">
                <div style={{ padding: '4px' }}>
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--accent-tertiary)' }}>
                    GOV TENDER
                  </strong>
                  <span>{hoverInfo.feature.properties.title}</span><br/>
                  <span style={{ color: 'var(--text-muted)' }}>Budget: ${hoverInfo.feature.properties.budget}M</span>
                </div>
              </Popup>
            )}
          </Map>
        )}
      </div>

      {/* Analytics Sidebar for Selected Zone */}
      {selectedZone && !isGenerating && (
        <aside className="sidebar glass-panel">
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
              {selectedZone.properties.name}
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-primary)', padding: '4px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>
                Target Zone Identified
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Growth Velocity Score</span><TrendingUp size={16} color="var(--accent-primary)" />
            </div>
            <div className="stat-value">
              {selectedZone.properties.growth_velocity_score} <span className="stat-unit">/ 100</span>
            </div>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${selectedZone.properties.growth_velocity_score}%` }}></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="stat-card">
               <div className="stat-header">Gov Tenders</div>
               <div className="stat-value" style={{ fontSize: '24px' }}>
                 {typeof selectedZone.properties.metrics === 'string' ? JSON.parse(selectedZone.properties.metrics).tender_volume_10km : (selectedZone.properties.metrics?.tender_volume_10km || 0)}
               </div>
            </div>
            <div className="stat-card">
               <div className="stat-header">Avg Property</div>
               <div className="stat-value" style={{ fontSize: '24px' }}>
                 ${Math.round(typeof selectedZone.properties.metrics === 'string' ? JSON.parse(selectedZone.properties.metrics).avg_property_price : (selectedZone.properties.metrics?.avg_property_price || 0))}
               </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Price Trajectory</span><DollarSign size={16} color="var(--text-muted)" />
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <RechartsTooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="price" stroke="url(#colorGradient)" strokeWidth={3} dot={{ fill: 'var(--accent-primary)', strokeWidth: 2 }} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--accent-secondary)" />
                      <stop offset="100%" stopColor="var(--accent-primary)" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <button className="btn active" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={() => setSelectedZone(null)}>Close Analysis</button>
          </div>
        </aside>
      )}
    </div>
  );
}
