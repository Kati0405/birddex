# BirdDex App Guide

How to use every feature in BirdDex — a collectible field guide to birds.

## Getting Started

### Signing In

Tap **Log in** in the top-right corner. BirdDex uses Google sign-in — tap "Continue with Google" and pick your Google account. That's it, no passwords.

Once signed in you unlock personal features: observations, collection tracking, saved locations, photos, and personalized Bird Guide answers.

### Navigation

The top header has links to all sections:

- **Birds** — the main catalog of all bird cards
- **Locations** — your saved birding spots (signed-in only)
- **Photos** — gallery of your observation photos (signed-in only)
- **Bird Guide** — AI chat assistant for bird questions

On mobile, use the hamburger menu to access these same sections.

The header also shows your observation progress as a counter (e.g. "12 / 45") — how many species you've observed out of the total catalog.

---

## Bird Catalog

The Birds page (`/birds`) is the main screen. It shows all bird species as collectible-style cards in a grid.

### Searching

Use the search bar at the top to find birds by English name or Latin name. Results update instantly as you type.

### Filtering

Tap the **Filters** button next to the search bar to open the filter panel. You can filter by:

- **My Collection** (signed-in only): show all birds, only observed, or not yet observed
- **Observed as** (signed-in only): filter to birds you've seen, heard, or photographed
- **Rarity**: Common, Uncommon, Rare, Epic, or Legendary
- **Biome**: forest, wetland, grassland, urban, etc.
- **Food**: insects, seeds, fish, berries, etc.

You can combine multiple filters. The badge on the Filters button shows how many filters are active. Tap **Reset Filters** at the bottom to clear everything.

### Bird Cards

Each card in the grid shows:

- Bird photo
- English and Latin name
- Rarity badge (color-coded frame)
- Food and habitat icons
- A short humorous field note

If you're signed in, observed birds show a checkmark. You can also tap the binoculars icon on a card to log an observation directly from the catalog.

### Infinite Scroll

The catalog loads 20 birds at a time. Scroll down and more birds load automatically.

---

## Bird Detail Page

Tap any bird card to open its full detail page (`/birds/[id]`). Here you'll see:

- **Large photo** of the bird
- **Name** (English and Latin) and **rarity** badge
- **Sound button** — tap to hear the bird's call
- **Food icons** — what the bird eats (hexagonal icons)
- **Habitat icons** — where the bird lives (hexagonal icons)
- **Field note** — a short, witty description
- **Behaviour tags** — traits like "nocturnal", "songbird", "urban survivor", etc.
- **Best months chart** — which months are best to observe this bird
- **Wingspan** — displayed in cm with wing icons

### Collecting a Bird

If you're signed in, you'll see a **"+ Collect"** button at the bottom of the detail page. Tap it to add the bird to your collection. It toggles to "✓ Collected" — tap again to uncollect.

---

## Logging Observations

Observations are how you record when and where you spotted a bird. You can log an observation from:

- The **binoculars icon** on any bird card in the catalog
- The detail page of a bird

The observation form lets you record:

1. **How observed** — toggle Seen, Heard, and/or Photographed (you can select multiple)
2. **Date** — defaults to today; tap to pick a different date from the calendar (can't be in the future)
3. **Location** — two modes:
   - **Saved**: pick from your saved locations (if you have any)
   - **Map**: tap on the map to drop a pin at the exact spot
4. **Quality** — rate your sighting: Brief glance, Good view, or Excellent
5. **Notes** — free-text field for what happened (handwriting-style font, up to 2000 characters)
6. **Photo** — appears when "Photographed" is toggled on; upload a photo of your sighting (auto-resized for you)

Tap **Save** to record the observation. You can edit observations later by opening the same bird's observation panel.

---

## Saved Locations

The Locations page (`/locations`) lets you save birding spots you visit often. This saves time when logging observations — instead of pinning a location on the map each time, you can just pick a saved spot.

To add a location:
- Go to the Locations page
- Add a name and coordinates for your spot
- It appears in the "Saved" tab when logging observations

---

## Photo Gallery

The Photos page (`/photos`) shows all photos you've uploaded with your observations in one place. It's a simple gallery view with a count of total photos.

---

## Bird Guide (AI Chat)

The Bird Guide (`/bird-guide`) is an AI-powered birding assistant. It can help with:

- **Bird identification** — describe what you saw and it'll suggest species, confidence level, and what to check next
- **Habitat & behaviour** — where to find specific birds, what they eat, how they behave
- **Seasonal patterns** — best times of year to spot certain species
- **Observation tips** — practical field craft advice
- **Your personal data** — if you're signed in, it knows your observation history and can answer questions like "which birds have I only heard?" or "what's my most photographed bird?"

### How to Use Bird Guide

1. Go to the Bird Guide page
2. Type a question in the input field at the bottom, or tap one of the **suggested questions** to get started
3. The AI streams its answer in real time
4. Keep chatting — it remembers the conversation context (up to 20 messages)
5. Tap the **Clear** button (trash icon) to start a fresh conversation

### Suggested Questions

When you first open Bird Guide, you'll see starter questions tailored to you:

- **Not signed in**: general birding questions like "What birds are easiest to spot for beginners?"
- **Signed in with observations**: personalized questions based on your data, like "What's interesting about the [your most photographed bird]?" or "How do I spot a [bird you've only heard]?"

### Tips for Best Results

- Be specific: "I saw a small brown bird with a red chest near a lake" works better than "what bird did I see?"
- Ask follow-ups: "What does its song sound like?" or "Where does it nest?"
- Ask about your collection: "Which rare birds haven't I found yet?" or "What should I look for this month?"
- The guide works for any bird, even those not in the BirdDex catalog yet

---

## Account

### Observation Counter

When signed in, the header shows your progress: how many species you've observed vs. the total in the catalog.

### Logging Out

On desktop: tap **Log out** next to your avatar in the header.
On mobile: open the menu and tap Log out.
