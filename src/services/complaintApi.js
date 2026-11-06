const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export async function getComplaints() {
  const response = await fetch(`${API_BASE_URL}/complaints/`);

  if (!response.ok) {
    throw new Error(`Failed to load complaints: ${response.status}`);
  }

  return response.json();
}