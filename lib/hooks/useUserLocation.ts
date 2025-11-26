import { useEffect } from "react";

/**
 * Hook to detect and save user's country on login
 * Uses a free geolocation API to detect country from IP
 */
export function useUserLocation() {
  useEffect(() => {
    const updateUserCountry = async () => {
      try {
        // Check if we've already captured country in this session
        const captured = sessionStorage.getItem('country_captured');
        if (captured) return;

        // Use ipapi.co free API to get country from IP (1000 requests/day free)
        const response = await fetch('https://ipapi.co/json/');

        if (!response.ok) {
          console.error('Failed to fetch location data');
          return;
        }

        const data = await response.json();

        if (data.country_name && data.country_code) {
          // Save to database
          await fetch('/api/user/update-country', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              country: data.country_name,
              country_code: data.country_code,
            }),
          });

          // Mark as captured for this session
          sessionStorage.setItem('country_captured', 'true');
        }
      } catch (error) {
        console.error('Error updating user country:', error);
      }
    };

    updateUserCountry();
  }, []);
}
