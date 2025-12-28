// ===== CONFIG =====
const apiKey = '97122cc221b94421bbac823b16748d9c';
const DEFAULT_LAT = 27.7172;
const DEFAULT_LNG = 85.3240;
const COUNTRY = "Nepal";

// ===== MAP INIT =====
const map = L.map("mapContainer").setView([DEFAULT_LAT, DEFAULT_LNG], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { draggable: true }).addTo(map);

// ===== HELPERS =====
function updateLatLng(lat, lng) {
    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lng;
}

function updateAddressFields(components = {}, roadInfo = {}) {
    document.getElementById("province").value =
        components.state || components.province || "from coordinates";

    document.getElementById("district").value =
        components.county || components.city || "from coordinates";

    document.getElementById("place").value =
        roadInfo.road || components.suburb || components.town || components.village || "from coordinates";

    document.getElementById("landmark").value =
        components.neighbourhood || components.town || components.road || "from coordinates";
}

// ===== OPENCAGE =====
async function geocodeAddress(address) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
        address
    )}&key=${apiKey}&countrycode=np&limit=1`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.results?.length) return null;

    const r = data.results[0];
    return {
        lat: r.geometry.lat,
        lng: r.geometry.lng,
        components: r.components,
        roadInfo: r.annotations.roadinfo || {}
    };
}

async function reverseGeocode(lat, lng) {
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}&countrycode=np&limit=1`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.results?.length) return null;

  return {components: data.results[0].components, roadInfo: data.results[0].annotations.roadinfo || {} };
}

// ===== MARKER DRAG =====
marker.on("dragend", async () => {
    const { lat, lng } = marker.getLatLng();

    updateLatLng(lat, lng);

    const location = await reverseGeocode(lat, lng);
    if (location) updateAddressFields(location.components, location.roadInfo);
});

function updateMapFromLatAndLng(lat, lng) {
    map.setView([lat, lng], 16);
    marker.setLatLng([lat, lng]);
    marker.dragging.disable();
}
