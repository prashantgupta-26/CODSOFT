const BASE_URL = "";

/**
 * Custom fetch wrapper to handle API requests, base URL prepending, and JWT headers automatically.
 */
export async function apiRequest(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("neurochat_token") : null;
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Silently logs in or registers a demo user in the background.
 * This satisfies the auth requirement while keeping the UI form-free for now.
 */
export async function ensureDemoAuthentication() {
  if (typeof window === "undefined") return null;

  const existingToken = localStorage.getItem("neurochat_token");
  if (existingToken) {
    return existingToken;
  }

  const demoUser = {
    name: "Guest User",
    email: "guest@neurochat.ai",
    password: "neurochatdemo123",
  };

  try {
    console.log("Attempting silent login for guest user...");
    const loginData = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: demoUser.email, password: demoUser.password }),
    });

    localStorage.setItem("neurochat_token", loginData.token);
    localStorage.setItem("neurochat_user", JSON.stringify(loginData));
    console.log("Guest login successful.");
    return loginData.token;
  } catch (error) {
    // If login fails, try to register the guest user first
    console.log("Guest login failed, attempting guest registration...", error);
    try {
      const registerData = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(demoUser),
      });

      localStorage.setItem("neurochat_token", registerData.token);
      localStorage.setItem("neurochat_user", JSON.stringify(registerData));
      console.log("Guest registration and login successful.");
      return registerData.token;
    } catch (regError) {
      console.error("Failed to silently authenticate guest user:", regError);
      return null;
    }
  }
}
