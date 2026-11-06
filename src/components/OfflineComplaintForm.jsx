
import { useEffect, useState } from "react";
import {
  saveDraft,
  getDrafts,
  deleteDraft,
} from "../offline/complaintStorage";

export default function OfflineComplaintForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locality, setLocality] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [locating, setLocating] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [message, setMessage] = useState("");

  async function refreshDrafts() {
    const savedDrafts = await getDrafts();
    setDrafts(savedDrafts);
  }

  useEffect(() => {
    refreshDrafts();
  }, []);

  async function handleFindLocation() {
    if (!navigator.geolocation) {
      setMessage("Location is not supported by this browser.");
      return;
    }

    setLocating(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCoordinates({ latitude: lat, longitude: lng });

        try {
          const params = new URLSearchParams({
            format: "jsonv2",
            lat: String(lat),
            lon: String(lng),
            zoom: "16",
            addressdetails: "1",
          });

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${params}`
          );

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
            data.display_name ||
            "";

          setLocality(name);
          setMessage(
            name
              ? "Location detected and locality filled."
              : "Location detected, but locality was not found."
          );
        } catch (error) {
          console.error(error);
          setMessage(
            "GPS location found, but the locality lookup failed."
          );
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error(error);
        setMessage(
          "Unable to get your location. Allow location access and try again."
        );
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!title.trim() || !description.trim()) {
      setMessage("Please enter a title and description.");
      return;
    }

    const draft = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      locality: locality.trim(),
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      createdAt: new Date().toISOString(),
    };

    await saveDraft(draft);
    await refreshDrafts();

    setTitle("");
    setDescription("");
    setLocality("");
    setCoordinates(null);
    setMessage("Complaint saved locally!");
  }

  async function handleDelete(id) {
    await deleteDraft(id);
    await refreshDrafts();
  }

  return (
    <section style={{ marginTop: 30 }}>
      <h2>Offline Complaint Drafts</h2>
      <p>
        Save a complaint on this device, even when you are offline.
      </p>

      <form onSubmit={handleSave}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Complaint title"
          required
          style={{
            display: "block",
            width: "100%",
            marginBottom: 10,
            padding: 10,
          }}
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue"
          required
          rows={4}
          style={{
            display: "block",
            width: "100%",
            marginBottom: 10,
            padding: 10,
          }}
        />

        <label htmlFor="locality">Locality / landmark</label>
        <input
          id="locality"
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          placeholder="Street, ward, village"
          style={{
            display: "block",
            width: "100%",
            margin: "6px 0 10px",
            padding: 10,
          }}
        />

        <button
          type="button"
          onClick={handleFindLocation}
          disabled={locating}
        >
          {locating ? "Finding location..." : "Find My Location"}
        </button>

        {coordinates && (
          <p>
            Coordinates: {coordinates.latitude.toFixed(5)},{" "}
            {coordinates.longitude.toFixed(5)}
          </p>
        )}

        <button type="submit" style={{ marginTop: 12 }}>
          Save Draft
        </button>
      </form>

      {message && <p>{message}</p>}

      <h3>Saved Drafts ({drafts.length})</h3>

      {drafts.length === 0 ? (
        <p>No saved drafts yet.</p>
      ) : (
        drafts.map((draft) => (
          <article
            key={draft.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <strong>{draft.title}</strong>
            <p>{draft.description}</p>

            {draft.locality && <p>Locality: {draft.locality}</p>}

            {draft.latitude != null && draft.longitude != null && (
              <p>
                Coordinates: {draft.latitude}, {draft.longitude}
              </p>
            )}

            <small>
              Saved: {new Date(draft.createdAt).toLocaleString()}
            </small>
            <br />

            <button
              onClick={() => handleDelete(draft.id)}
              style={{ marginTop: 10 }}
            >
              Delete Draft
            </button>
          </article>
        ))
      )}
    </section>
  );
}
