# MeetHalfway

**Stop arguing about where to meet. Let AI figure out what's fair.**

[**Live Demo →**](https://meethalfway-3v7f4va5u-vrushikeshb10s-projects.vercel.app)

---

## The Problem

"Let's meet somewhere in the middle" sounds simple. It isn't.

Geographic midpoints ignore how cities actually work — a point equidistant on a map can mean a 10-minute drive for one person and a 45-minute commute for the other. Most people default to suggesting venues near *themselves*, which creates friction and quiet resentment. The person who always travels further just stops making plans.

## Who It's For

- Friends split across a city who want to grab coffee without the back-and-forth
- Colleagues planning a team lunch when everyone's commuting from different neighborhoods
- Long-distance couples or family members meeting halfway between cities
- Anyone tired of the "you pick" / "no you pick" loop

## How It Works

**1. Enter two locations**
Type any address, neighborhood, or landmark. No coordinates, no fuss.

**2. Choose your vibe and travel mode**
Romantic dinner, casual hangout, or something adventurous — by transit, driving, or on foot.

**3. Get 3 fair suggestions**
MeetHalfway finds the point where both people's commute times are genuinely balanced, searches for real nearby venues, and shows you exact travel times for each person to each spot.

---

## Product Decisions Worth Explaining

### Why "fair commute time" instead of geographic midpoint

The obvious approach — split the lat/lng coordinates — produces a map pin, not a fair meeting. A geographic midpoint in a city with asymmetric transit coverage (think: one person near a metro line, one person not) can still be deeply unfair. MeetHalfway runs an iterative algorithm: it computes the geographic midpoint, checks actual transit times from both people, then nudges the search area toward the person with the longer commute until the difference is minimized. The goal is felt fairness, not mathematical symmetry.

### Why three options instead of one "best" pick

One recommendation feels like a black box. Three lets users apply context the app can't know — one person is vegetarian, one venue is too loud for a first date, one neighborhood feels sketchy at night. Three also creates a natural conversation: "I like option 2 or 3, you?" That's a better user outcome than a single autocratic suggestion.

### Why vibe selection drives the search

Search terms like "restaurant" return everything from street stalls to Michelin stars. Leading with vibe (romantic / casual / adventurous) narrows the keyword space before a single API call is made. It also shifts the user's mental model from *logistics* ("where is equidistant?") to *experience* ("what kind of evening do we want?"), which is the question that actually matters.

### Why Claude orchestrates instead of hardcoded logic

The midpoint algorithm involves geocoding, travel time calculation, candidate adjustment, and venue search — and the right sequence depends on intermediate results. A hardcoded pipeline would need branching logic for every edge case (no transit routes, zero venues in radius, one location outside city limits). Delegating orchestration to Claude with Google Maps as tools means the system adapts: if a keyword returns no venues, Claude tries a broader term; if transit returns no route, Claude falls back to driving. This flexibility would require significant defensive code to replicate statically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS v4, Framer Motion |
| AI Orchestration | Claude API (Sonnet) with tool-use agent loop |
| Location & Venues | Google Maps API (Geocoding, Places, Distance Matrix) |
| Deployment | Vercel |

---

## Running Locally

```bash
git clone <repo>
cd meethalfway
npm install
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY and GOOGLE_MAPS_API_KEY
npm run dev
```

Required Google Maps APIs: Geocoding API, Places API, Distance Matrix API.

---

## Known Limitations

- **Travel times reflect current conditions, not meetup time.** A search at 9pm returns evening traffic data regardless of when the meetup is actually planned. A Friday-afternoon search for a Saturday-morning coffee gives misleading commute estimates.
  - *v2 fix:* Let users input their intended meetup time and pass the `departure_time` parameter to the Distance Matrix API — Google Maps supports time-aware routing natively.

---

## What's Next

- **Saved sessions** — share a link so both people can see the same suggestions
- **Calendar integration** — propose a time alongside a place
- **Group mode** — balance commutes across 3+ people
