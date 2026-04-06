# 🌍 ID Bassin Congo - Cadastral Land Parcels Map

Single-file web application for visualizing cadastral land parcels on an interactive map, with data fetched live from Supabase.

![Mapbox](https://img.shields.io/badge/Mapbox-GL%20JS%20v3.17-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Features

- **Interactive map** — satellite, street and terrain views
- **Real-time dashboard** — parcel count, total area, average area, largest parcel
- **Parcel list** — click any parcel to zoom to it on the map
- **Search** — filter parcels by name or ID
- **Click popup** — shows parcel ID, area in hectares and m²
- **GeoJSON export** — download all parcels as a `.geojson` file
- **Auto-zoom** — map fits all parcels on load

## 📁 Project Structure

```
Parcelles/
├── map-pro.html   # Entire application (HTML + CSS + JS, no build step)
├── README.md
└── .gitignore
```

## 🚀 Usage

Open `map-pro.html` directly in a browser — no installation or build step needed.

Or serve locally:

```bash
python -m http.server 8000
# Open http://localhost:8000/map-pro.html
```

## 🗄️ Supabase — Database Schema

The app reads from a `parcelles_geojson` table:

```sql
CREATE TABLE parcelles_geojson (
    id       SERIAL PRIMARY KEY,
    filename VARCHAR(255),
    geometry JSONB NOT NULL
);
```

The `geometry` column must contain a valid GeoJSON `Polygon` object, e.g.:

```json
{
  "type": "Polygon",
  "coordinates": [[[14.57, 1.66], [14.58, 1.66], [14.58, 1.67], [14.57, 1.66]]]
}
```

### RLS Policy

```sql
CREATE POLICY "Allow public read access"
ON parcelles_geojson FOR SELECT USING (true);
```

## ⚙️ Configuration

To connect to a different Supabase project, update these two lines in `map-pro.html`:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
```

To use a different Mapbox account:

```javascript
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';
```

## 🎨 Parcel Style

Parcel colors are defined in the `map.on('load')` block:

```javascript
'fill-color': '#2563eb',   // fill color
'fill-opacity': 0.2        // fill transparency

'line-color': '#2563eb',   // border color
'line-width': 3            // border thickness (px)
```

## 📊 Technologies

| Technology | Version | Role |
|------------|---------|------|
| Mapbox GL JS | 3.17.0 | Interactive map |
| Supabase JS | 2.x | Database client |
| HTML / CSS / JS | — | Frontend (no framework) |

## 🌐 Deployment

### GitHub Pages

1. Go to **Settings** → **Pages**
2. Source: **Deploy from a branch** → **main** / **root**
3. Access at: `https://idbassincongo.github.io/PROJECT-ID-BASSIN-CONGO/map-frontend/map-prototype.html`

### Netlify / Vercel

Connect the GitHub repo — deploys automatically on every push.

## 📝 License

MIT License — free to use and modify.

## 👤 Author

**ID Bassin Congo**

---

*Agricultural land parcel management for the Congo Basin*
