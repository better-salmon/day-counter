const CACHE_NAME = "day-counter-v2";
const urlsToCache = [
  "/day-counter/",
  "/day-counter/index.html",
  "/day-counter/manifest.json",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Function to calculate days passed
function calculateDaysPassed() {
  const targetDate = new Date("2025-02-26T00:00:00");
  const currentDate = new Date();

  const timeDifference = currentDate - targetDate;
  const daysPassed = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  return daysPassed;
}

// Function to update the badge
async function updateBadge(dayCount = null) {
  try {
    // Calculate days if not provided
    if (dayCount === null) {
      dayCount = calculateDaysPassed();
    }

    // Check for badge API support using the recommended method
    if (!navigator.setAppBadge) {
      console.log("Badge API not supported");
      return;
    }

    // Update the badge
    await navigator.setAppBadge(Math.abs(dayCount));
    console.log(`Badge updated with day count: ${dayCount}`);
  } catch (error) {
    console.error("Error updating badge:", error);

    // For iOS, if we get a permission error, clear the badge
    if (error.name === "NotAllowedError") {
      console.log("Badge permission denied - clearing badge");
      try {
        if (navigator.clearAppBadge) {
          await navigator.clearAppBadge();
        }
      } catch (clearError) {
        console.error("Error clearing badge:", clearError);
      }
    }
  }
}

// Function to clear the badge
async function clearBadge() {
  try {
    if (navigator.clearAppBadge) {
      await navigator.clearAppBadge();
      console.log("Badge cleared");
    }
  } catch (error) {
    console.error("Error clearing badge:", error);
  }
}

// Update badge immediately when service worker activates
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Update badge
      updateBadge(),
    ])
  );
});

// Set up periodic badge updates
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "UPDATE_BADGE") {
    updateBadge(event.data.dayCount);
  }
});

// Update badge periodically (every minute)
setInterval(updateBadge, 60 * 1000);

// Also update badge when the service worker starts
updateBadge();
