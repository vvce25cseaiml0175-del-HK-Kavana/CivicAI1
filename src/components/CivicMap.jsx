import { getComplaints } from "../services/complaintApi";
import { useState } from "react";
import { useEffect } from "react";
import { getComplaints } from "../services/complaintApi";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const complaints = [
  {
    id: 1,
    title: "Road pothole",
    lat: 12.9716,
    lng: 77.5946,
    status: "Pending",
  },
  {
    id: 2,
    title: "Garbage accumulation",
    lat: 12.975,
    lng: 77.6,
    status: "In Progress",
  },
  {
    id: 3,
    title: "Streetlight not working",
    lat: 12.968,
    lng: 77.59,
    status: "Resolved",
  },
];

function UserLocation() {
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

  const map = useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      setAccuracy(e.accuracy);
      onLocationFound(e.latlng);
      map.flyTo(e.latlng, 18);
    },
    locationerror() {
      alert("Unable to find your location. Please allow location access.");
    },
  });

  return position ? (
    <>
      <Circle
        center={position}
        radius={accuracy}
        pathOptions={{
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
        }}
      />
      <CircleMarker
        center={position}
        radius={8}
        pathOptions={{
          color: "#ffffff",
          fillColor: "#2563eb",
          fillOpacity: 1,
        }}
      >
        <Popup>
          <strong>Your location</strong>
          <br />
          Accuracy: approximately {Math.round(accuracy)} meters
        </Popup>
      </CircleMarker>
    </>
  ) : null;
}

function LocateButton() {
  const map = useMap();

  function locateUser() {
    map.locate({
      setView: false,
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000,
    });
  }

  return (
    <button
      onClick={locateUser}
      style={{
        position: "absolute",
        zIndex: 1000,
        top: 10,
        right: 10,
        padding: 10,
        cursor: "pointer",
      }}
    >
      Find My Location
    </button>
  );
}

  
export default function CivicMap() {
  const [locality, setLocality] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getComplaints()
      .then((data) => {
        setComplaints(data.results ?? data);
        setError("");
      })
      .catch(() => {
        setError(
          "Could not load complaints. Check whether the Django backend is running."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  async function handleLocationFound(position) {
  setAddressLoading(true);
  setLocality("");

  try {
    const url = new URL(
      "https://nominatim.openstreetmap.org/reverse"
    );

    url.search = new URLSearchParams({
      format: "jsonv2",
      lat: position.lat,
      lon: position.lng,
      zoom: "16",
      addressdetails: "1",
    });

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Address lookup failed");
    }

    const data = await response.json();
    const address = data.address || {};

    const name =
      address.neighbourhood ||
      address.suburb ||
      address.village ||
      address.town ||
      address.city ||
      address.county ||
      "";

    setLocality(name || data.display_name || "Address unavailable");
  } catch (error) {
    setLocality("Could not retrieve locality");
    console.error(error);
  } finally {
    setAddressLoading(false);
  }
}

  return (
    <>
      {loading && <p>Loading complaints...</p>}
      {error && <p>{error}</p>}
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="complaint-location">
          Complaint location
        </label>

        <input
          id="complaint-location"
          type="text"
          value={addressLoading ? "Finding locality..." : locality}
          placeholder="Press Find My Location to fill address"
          readOnly
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginTop: 6,
          }}
        />
      </div>

      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={14}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocateButton />
        <UserLocation onLocationFound={handleLocationFound} />

        {complaints.map((complaint) => (
          <Marker
            key={complaint.id}
            position={[
              complaint.latitude,
              complaint.longitude,
            ]}
          >
            <Popup>
              <strong>{complaint.title}</strong>
              <br />
              Status: {complaint.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
