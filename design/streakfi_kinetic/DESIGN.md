```markdown
# Design System Specification: Kinetic High-Energy DeFi

## 1. Overview & Creative North Star: "The Kinetic Engine"
The Creative North Star for this design system is **"The Kinetic Engine."** In the world of DeFi, data is often static and cold. This system rejects that clinical approach, instead treating the UI as a living, high-performance machine fueled by momentum. 

We break the "standard template" look through **Intentional Friction and Momentum**. By utilizing aggressive typography scales, overlapping glass layers, and radiant heat-maps (glows), we create a sense of urgency and "gamified" progression. The layout should feel like a cockpit: high-density information delivered with premium, editorial precision.

---

## 2. Colors & Surface Architecture
The palette is built on a foundation of high-contrast energy. We use **Deep Night (#0c1322)** as our void, allowing the **Streak Orange** and **Torque Indigo** to punch through with maximum luminosity.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. They create visual "stutter." Boundaries must be defined through **Background Color Shifts** (e.g., a `surface-container-low` card resting on a `surface` background) or **Tonal Transitions**. Let the elevation do the work, not the stroke.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of "Smart Glass." 
- **Base Layer:** `surface` (#0c1322).
- **Secondary Sections:** `surface-container-low` (#141b2b).
- **Interactive Cards:** `surface-container` (#191f2f).
- **Active/Promoted Elements:** `surface-container-highest` (#2e3545).

### The "Glass & Gradient" Rule
To achieve the high-end "gamified" feel, use **Glassmorphism** for all floating panels. 
- **Effect:** Background Blur (20px - 40px) + `surface-variant` at 40% opacity.
- **Signature Gradients:** For primary CTAs and high-momentum "Streaks," use a linear gradient from `primary` (#ffb690) to `primary-container` (#f97316) at a 135° angle to simulate fire and heat.

---

## 3. Typography: Editorial Authority
The typography system uses **Inter** across all weights to maintain a cohesive, modern technical feel, but relies on extreme weight variance to create hierarchy.

- **Display & Headlines (The Power Scale):** Use `display-lg` to `headline-sm`. These must be set to **Inter Black (900)** with tight letter-spacing (-0.04em). This conveys the "Bold/Modern" energy required for high-stakes DeFi.
- **Large Numbers:** Yields, balances, and streak counts should use `display-md` or `display-sm`. Numbers are the "Hero" of the experience.
- **Body & Labels:** Use `body-md` for standard text and `label-md` for metadata. These should be set to **Inter Regular (400)** or **Medium (500)** to ensure maximum legibility against the dark background.

---

## 4. Elevation & Depth: Tonal Layering
We move away from the "shadow-only" approach to depth, opting for a more sophisticated "Atmospheric Perspective."

- **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` card placed on a `surface-container-low` section creates a natural "sunken" or "lifted" feel without artificial outlines.
- **Ambient Glows (The "Heat" Effect):** Instead of standard grey shadows, use **Tinted Ambient Glows**. For streak-related cards, use a 32px blur shadow with 8% opacity of `primary`. For "Powered by Torque" components, use `secondary` (#c0c1ff).
- **The "Ghost Border" Fallback:** If containment is required for accessibility, use a **Ghost Border**: `outline-variant` (#584237) at 15% opacity. This provides a "hint" of a boundary without closing off the layout.

---

## 5. Components: The Kinetic Toolset

### Buttons
- **Primary (The Streak):** `primary-container` background, `on-primary-container` text. Bold weight. 12px outer glow on hover.
- **Secondary (The Torque):** `secondary-container` background with a subtle indigo `surface-tint`.
- **Tertiary:** Transparent background with `primary` text. No border; interaction is signaled by a slight background shift to `surface-container-high`.

### Data Cards
**No dividers.** Separate "Asset Name" from "Balance" using vertical white space (8px or 12px from the scale) and a weight shift (Black to Medium). Use `surface-container` for the card body.

### Flame Chips (Gamification)
Use `tertiary-container` (#2cb055) for positive streaks and `primary-container` (#f97316) for active "On Fire" statuses. These should have a slight 2px inner-glow to feel "vibrant."

### Input Fields
Fields should be "Sunken." Use `surface-container-lowest` (#070e1d) with a `surface-variant` top-border (2px) to simulate depth. Labels use `label-md` in `on-surface-variant`.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use intentional asymmetry. Overlap a glass card 20px over a section header to create depth.
- **Do** use large-scale typography for data points (e.g., "15% APY" should be twice the size of its label).
- **Do** lean into the Indigo/Orange contrast. Use Indigo for "System/Protocol" logic and Orange for "User/Growth" momentum.

### Don't:
- **Don't** use 100% opaque borders. They kill the "Glassmorphism" aesthetic.
- **Don't** use standard "Drop Shadows" (Black/Grey). Always tint shadows with the primary or secondary brand colors.
- **Don't** clutter the UI with dividers. If you need a divider, use a 24px-32px gap of empty space instead.
- **Don't** use rounded corners smaller than `md` (0.75rem). Everything should feel smooth and premium.

---

## 7. Branding Integration: "Powered by Torque"
To honor the Torque Protocol attribution, every high-level dashboard should feature an "Engine Component." This is a `secondary_container` (#3131c0) element with a `surface_bright` (#323949) glass overlay. Use the **Torque Indigo** specifically for technical attribution, security badges, and "Verified" states to instill trust through the sub-brand.```