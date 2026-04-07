import axios from "axios";
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

      // Get country code
      const { data: countryDataResponse } = await axios.get(
        `https://api.geonames.org/countryCodeJSON?lat=${coordinates.latitude}&lng=${coordinates.longitude}&username=${process.env.NEXT_PUBLIC_GEONAMES_USERNAME}`
      );
      const countryCode = countryDataResponse.countryCode;

      // Get emergency numbers
      const emergencyResponse = await fetch("/api/hotlines", {
        method: "POST",
        body: JSON.stringify({ countryCode }),
      });
      const emergencyNumbers = await emergencyResponse.json();

      // Update state with all data
      set({
        ...initialState,
        loading: false,
        locationCoordinates: coordinates,
        locationCountryCode: countryCode,
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
