import { create } from "zustand";

// Form data for uploading
export const useFormStore = create((set) => ({
  formData: null,
  setFormData: (data) => set({ formData: data }),
}));

// Moderator Login Global State
export const useModeratorStore = create((set) => ({
  isLoggedIn: false,
  logIn: () => {
    set({ isLoggedIn: true });
  },
  logOut: () => {
    set({ isLoggedIn: false });
  },
}));

// Hotline GUI Toggle Global State
export const useHotlineGUI = create((set) => ({
  isVisible: false,
  setVisible: (state) => {
    set({ isVisible: state })
  }
}))

// Geolocation Global State
const initialState = {
  error: false,
  errorData: null,
  locationCoordinates: null,
  locationCountryCode: null,
  locationEmergencyNumbers: null,
  loading: false,
};

export const useGetLocationData = create((set) => ({
  ...initialState,

  execute: async () => {
    set({ ...initialState, loading: true });

    try {
      // Convert getCurrentPosition to Promise
      const getPosition = () => {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by this browser."));
          }

          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
      };

      // Get coordinates
      const position = await getPosition();
      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Get emergency numbers (server handles geonames lookup)
      const emergencyResponse = await fetch("/api/hotlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: coordinates.latitude, lon: coordinates.longitude }),
      });
      const emergencyNumbers = await emergencyResponse.json();

      // Update state with all data
      set({
        ...initialState,
        loading: false,
        locationCoordinates: coordinates,
        locationEmergencyNumbers: emergencyNumbers,
      });

    } catch (err) {
      console.error("Error in data fetch:", err);
      set({
        ...initialState,
        loading: false,
        error: true,
        errorData: err.message,
      });
    }
  },
}));
