# BirdDex App Guide

How to use every feature in BirdDex — a collectible field guide to birds.

## Getting Started

### Signing In

Tap **Log in** in the top-right corner. BirdDex uses Google sign-in — tap "Continue with Google" and pick your Google account. That's it, no passwords.

Once signed in you unlock personal features: observations, collection tracking, saved locations, photos, and personalized Ask Robin answers.

### Navigation

The top header has links to all sections:

- **Birds** — the main catalog of all bird cards
- **Observations** — all your logged observations in one place (signed-in only)
- **Locations** — your saved birding spots (signed-in only)
- **Photos** — gallery of your observation photos (signed-in only)
- **Ask Robin** — AI chat assistant for bird questions

On mobile, use the hamburger menu to access these same sections.

The header also shows your observation progress as a counter (e.g. "12 / 45") — how many species you've observed out of the total catalog.

---

## Bird Catalog

The Birds page (`/birds`) is the main screen. It shows all bird species as collectible-style cards in a grid.

### Searching

Use the search bar at the top to find birds by English name or Latin name. Results update instantly as you type.

### Filtering

The toolbar above the grid combines search, filters, and your collection status in one bar. If signed in, an **All / Seen / Not seen** switcher sits next to the search bar (below it on mobile) so you can jump between your whole collection and what you have or haven't observed yet, without opening the filter panel.

Tap the **Filters** button to open the filter panel for more specific filtering. You can filter by:

- **My Collection** (signed-in only): show all birds, only observed, or not yet observed — mirrors the All/Seen/Not seen switcher
- **Observed as** (signed-in only): filter to birds you've seen, heard, or photographed
- **Rarity**: Common, Uncommon, Rare, Epic, or Legendary
- **Biome**: forest, wetland, grassland, urban, etc.
- **Food**: insects, seeds, fish, berries, etc.
- **Behaviour**: nocturnal, predator, songbird, etc.

You can also filter directly from a bird card front by clicking its rarity badge, food icons, habitat icons, or behaviour tags — this toggles the same filter as picking it in the panel.

Every active filter (except All/Seen/Not seen, shown separately) appears as a removable chip below the toolbar — tap the **×** on a chip to clear just that filter. The badge on the Filters button shows how many filters are active in total. Tap **Reset** next to the Filters button (or **Reset Filters** at the bottom of the panel) to clear everything at once.

### Bird Cards

Each card in the grid shows:

- Bird photo
- English and Latin name
- Rarity badge (color-coded frame)
- Food and habitat icons
- A short humorous field note

If you're signed in, observed birds show a checkmark. You can also tap the binoculars icon on a card to log an observation directly from the catalog.

### Admin: Editing and Deleting Birds

Admins see a small **"⋮" (three dots)** icon next to the bird's name on each card. Tapping it opens a menu with:

- **Edit** — opens the bird's edit page to update its details
- **Delete** — opens a confirmation modal asking you to confirm the deletion. Confirming removes the bird from the catalog. If the bird has observations logged against it, deletion is blocked and the modal shows a message asking you to remove those observations first.

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
4. **Observation quality** — rate how well you observed the bird using a 5-star picker: 1 (Brief glance), 2 (Partial view), 3 (Good view), 4 (Great view), 5 (Excellent encounter). Hover or tap stars to see the label and description. This rates the observation itself, not the photo or bird rarity.
5. **Notes** — free-text field for what happened (handwriting-style font, up to 2000 characters)
6. **Photo** — appears when "Photographed" is toggled on; upload a photo of your sighting (auto-resized for you)

Tap **Save** to record the observation. You can edit or delete observations later from the card's back side.

---

## Observations Page

The Observations page (`/observations`) shows all your logged observations in one place, grouped by month. Each entry shows:

- Bird photo thumbnail (or placeholder)
- Bird name (linked to its detail page)
- Date of observation
- How observed icons (seen, heard, photographed)
- Location name (if recorded)
- Notes preview (truncated)

The counter at the top shows your total number of observations. If you have no observations yet, a friendly empty state guides you to the bird catalog to log your first sighting.

---

## Saved Locations

The Locations page (`/locations`) lets you save birding spots you visit often. This saves time when logging observations — instead of pinning a location on the map each time, you can just pick a saved spot.

Your saved locations are shown as cards with a photo preview (if uploaded), location name, coordinates, and observation stats (how many observations and species you've logged there). If you have no saved locations, a friendly empty state guides you to add your first one.

To add a location:
- Go to the Locations page
- Tap **+ Add location** (or "Add your first location" if you have none)
- Enter a name for the place (e.g. "City park", "Backyard feeder")
- Search for an address or click the map to drop a pin
- The selected coordinates are shown below the map
- Optionally upload a photo of the place
- Tap **Save location** when both the name and pin are set

To view a location:
- Tap the eye icon on any saved location card to open its detail page
- The detail page (`/locations/[id]`) shows the full photo, coordinates, observation statistics (total observations, species count, last visit date, most seen bird, observation types), and a list of recent observations at that location
- Each observation links to its bird detail page
- You can also change or remove the location photo from the detail page

To edit a location:
- Tap the pencil icon on any saved location card
- An inline edit form opens with the current name, map pin, and habitats pre-filled
- Change any fields you want, then tap **Save changes**
- If you rename a location, all your observations at that location are updated automatically
- Tap **Cancel** to discard changes

To delete a location:
- Tap the trash icon on any saved location card, or use the Delete button on the detail page
- Confirm the deletion in the confirmation prompt
- Your observations will keep their location data

Saved locations appear in the "Saved" tab when logging observations.

---

## Photo Gallery

The Photos page (`/photos`) shows all photos you've uploaded with your observations in one place. It's a simple gallery view with a count of total photos.

---

## Ask Robin (AI Chat)

The Ask Robin (`/ask-robin`) is an AI-powered birding assistant. It can help with:

- **Bird identification** — describe what you saw and it'll suggest species, confidence level, and what to check next
- **Habitat & behaviour** — where to find specific birds, what they eat, how they behave
- **Seasonal patterns** — best times of year to spot certain species
- **Observation tips** — practical field craft advice
- **Your personal data** — if you're signed in, it knows your observation history and can answer questions like "which birds have I only heard?" or "what's my most photographed bird?"

### How to Use Ask Robin

1. Go to the Ask Robin page
2. Type a question in the input field at the bottom, or tap one of the **suggested questions** to get started
3. The AI streams its answer in real time
4. Keep chatting — it remembers the conversation context (up to 20 messages)
5. Tap the **Clear** button (trash icon) to start a fresh conversation

### Suggested Questions

When you first open Ask Robin, you'll see starter questions tailored to you:

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

---

## Admin: Adding a New Bird

Admins see an **"Add Bird"** link in the header (marked with an admin badge), linking to `/admin/add-bird`.

To add a bird:

1. Type the bird's name (English or Latin) into the search field
2. Tap **Draft with AI** — this calls AI to draft all card fields: English name, Latin name, rarity, food, habitats, behaviour, field note, best months, wingspan, etc.
3. Review and edit any field in the form — nothing is saved yet
4. Tap **Save** to create the new catalog entry

The new bird then appears in the main catalog immediately.
