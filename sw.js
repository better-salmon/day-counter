const CACHE_NAME = "day-counter-v2";
const urlsToCache = ["/day-counter/", "/day-counter/index.html", "/day-counter/manifest.json"];

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
async function updateBadge() {
  try {
    const dayCount = calculateDaysPassed();

    // Update the badge if the Badging API is supported
    if ("setAppBadge" in navigator) {
      await navigator.setAppBadge(Math.abs(dayCount));
    }

    // For debugging - you can remove this in production
    console.log(`Badge updated with day count: ${dayCount}`);
  } catch (error) {
    console.error("Error updating badge:", error);
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
    updateBadge();
  }
});

// Update badge periodically (every minute)
setInterval(updateBadge, 60 * 1000);

// Also update badge when the service worker starts
updateBadge();
