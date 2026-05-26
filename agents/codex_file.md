# Codex Task: Add Pixel Bunny Mascot and Animated Hourglass

## Goal

Update the existing retro pixel-art productivity timer app by adding:

1. A pixel bunny mascot that changes based on timer state.
2. A pixel hourglass that animates based on Pomodoro, Break, Stopwatch, paused, and completed states.

The existing UI must remain the same. Do not redesign the app.

---

## Very Important Rules

Do not change the existing app design.

Keep the current UI exactly the same unless a small change is required to place the bunny or hourglass safely.

Preserve:

- Existing layout
- Existing colors
- Existing typography
- Existing timer panel
- Existing mode buttons
- Existing start button
- Existing task input
- Existing Add button
- Existing Tasks button
- Existing timer logic
- Existing spacing as much as possible
- Existing retro pixel-art style

Do not add:

- Modern gradients
- Glassmorphism
- Smooth vector styling
- Modern soft shadows
- New design system
- Unnecessary packages
- Large rewrites

Only add the bunny mascot, motivational speech bubble, and animated hourglass.

---

## Asset Locations

The raw Gemini-generated images should be placed here:

```text
public/assets/raw/bunny-sheet.png
public/assets/raw/hourglass-sheet.png
```

The final processed sprites should be saved here:

```text
public/assets/sprites/
```

Create these folders if they do not already exist.

Expected folder structure:

```text
public/
  assets/
    raw/
      bunny-sheet.png
      hourglass-sheet.png
    sprites/
      bunny-pomodoro.png
      bunny-complete.png
      bunny-motivation.png
      bunny-break.png
      hourglass-frame-1.png
      hourglass-frame-2.png
      hourglass-frame-3.png
      hourglass-frame-4.png
      hourglass-frame-5.png
      hourglass-frame-6.png
      hourglass-clean-sheet.png
```

---

## Raw Bunny Sheet Details

The bunny sheet is a single horizontal image containing 4 bunny sprites.

From left to right:

### Bunny 1: Pomodoro Bunny

Description:

- Bunny sitting or standing with a small clock beside it.

Use for:

- Pomodoro mode
- Focus mode
- Normal active focus state

Output file:

```text
public/assets/sprites/bunny-pomodoro.png
```

---

### Bunny 2: Complete Bunny

Description:

- Bunny holding a blank board/sign.

Use for:

- Pomodoro completed
- Session completed
- All tasks finished
- Final success state

Output file:

```text
public/assets/sprites/bunny-complete.png
```

---

### Bunny 3: Motivation Bunny

Description:

- Happy cheering bunny.

Use for:

- Motivational popup moments
- Encouragement while timer starts
- Optional active celebration moment

Output file:

```text
public/assets/sprites/bunny-motivation.png
```

---

### Bunny 4: Break Bunny

Description:

- Sleeping bunny on a pillow with ZZZ.

Use for:

- Break mode
- Rest state

Output file:

```text
public/assets/sprites/bunny-break.png
```

---

## Raw Hourglass Sheet Details

The hourglass sheet is a single horizontal image containing 6 hourglass frames.

From left to right:

1. Frame 1: sand mostly at the top
2. Frame 2: sand beginning to fall
3. Frame 3: sand midway
4. Frame 4: more sand at the bottom
5. Frame 5: almost finished
6. Frame 6: sand mostly/full at the bottom

Create these output files:

```text
public/assets/sprites/hourglass-frame-1.png
public/assets/sprites/hourglass-frame-2.png
public/assets/sprites/hourglass-frame-3.png
public/assets/sprites/hourglass-frame-4.png
public/assets/sprites/hourglass-frame-5.png
public/assets/sprites/hourglass-frame-6.png
```

Also create a clean same-frame-size horizontal sprite sheet:

```text
public/assets/sprites/hourglass-clean-sheet.png
```

Use the clean sheet for CSS `steps(6)` animation if possible.

---

## Image Processing Requirements

Create a small script to process the images.

Suggested file:

```text
scripts/extract-sprites.js
```

or:

```text
scripts/extract-sprites.py
```

Use whichever is easiest based on the project environment.

The script should:

1. Load:

```text
public/assets/raw/bunny-sheet.png
public/assets/raw/hourglass-sheet.png
```

2. Extract the 4 bunny sprites.
3. Extract the 6 hourglass frames.
4. Remove the checkerboard background if it is baked into the PNG.
5. Preserve real transparency if the PNG already has it.
6. Save clean transparent PNGs.
7. Keep pixel-art quality sharp.
8. Avoid blur, smoothing, antialiasing, or lossy output.
9. Ensure hourglass frames have identical canvas sizes so the animation does not jump.
10. Verify all output files exist after processing.

Important: If automatic background removal is risky, crop the sprites cleanly and preserve the best possible transparency. Do not destroy the artwork.

---

## Checkerboard Background Handling

The Gemini preview may show a gray checkerboard transparency background.

If the checkerboard is only a preview and the PNG has real transparency, leave transparency as-is.

If the checkerboard is baked into the actual image:

- Remove the checkerboard background.
- Make the background transparent.
- Keep the bunny and hourglass pixels intact.
- Avoid damaging black outlines, pale highlights, beige sand, bunny fur, or blue-green accents.

Be careful with colors that are close to the UI palette. Do not make bunny or hourglass pixels transparent accidentally.

---

## Pixel Quality Requirements

All final PNGs must preserve pixel-art quality.

Do:

```css
image-rendering: pixelated;
image-rendering: crisp-edges;
```

Do not:

- Blur
- Smooth
- Anti-alias
- Upscale with filtering
- Convert to JPG
- Add gradients
- Add modern shadows
- Add vector redraws

Use PNG only.

---

## App Integration

Find the existing timer component and existing timer state.

Do not rewrite the app.

Add a small BunnyMascot component or equivalent markup.

Add a small PixelHourglass component or equivalent markup.

Connect the components to the existing timer state.

Use existing state variables where possible, such as:

- current mode
- Pomodoro mode
- Break mode
- Stopwatch mode
- isRunning
- isPaused
- isComplete
- remaining time
- task completion state

Do not invent an entirely new timer state system unless the app truly does not have one.

---

## Bunny Behavior

Use these images:

```text
/assets/sprites/bunny-pomodoro.png
/assets/sprites/bunny-complete.png
/assets/sprites/bunny-motivation.png
/assets/sprites/bunny-break.png
```

State mapping:

### Pomodoro / Focus

Show:

```text
/assets/sprites/bunny-pomodoro.png
```

When:

- Current mode is Pomodoro/focus
- Timer is not completed
- App is in normal focus state

---

### Break

Show:

```text
/assets/sprites/bunny-break.png
```

When:

- Current mode is break
- User is resting
- Break timer is active or selected

---

### Complete

Show:

```text
/assets/sprites/bunny-complete.png
```

When:

- Pomodoro completes
- Session completes
- All tasks are finished
- Timer reaches the end of a focus block

---

### Motivation

Show or briefly switch to:

```text
/assets/sprites/bunny-motivation.png
```

When:

- Timer starts
- A motivational bubble appears
- The app wants to encourage the user while running

This bunny can appear briefly, then return to the correct mode bunny.

---

## Bunny Placement

Place the bunny near the existing main timer card.

Preferred locations:

- Right side of the timer panel
- Lower-right side of the timer area
- Slightly overlapping the timer card only if it does not block anything

The bunny must not cover:

- Timer digits
- Pomodoro button
- Stopwatch button
- Break button
- Start button
- Task input
- Add button
- Tasks button

Recommended size:

Desktop:

```text
72px to 96px
```

Small screens:

```text
56px to 72px
```

Use CSS so the bunny does not cause layout shift.

Decorative image accessibility:

```html
alt=""
aria-hidden="true"
```

unless the bunny image is needed for context.

---

## Motivational Speech Bubble

Add a small retro pixel-style speech bubble near the bunny.

The bubble should:

- Appear when the timer starts.
- Appear when break starts.
- Appear when Pomodoro completes.
- Appear when all tasks are complete.
- Auto-hide after 3 to 5 seconds.
- Not cause layout shift.
- Not block controls.
- Use real text, not text baked into the image.

Messages:

Timer starts, randomly choose one:

```text
You got this!
One focus block!
Keep going!
Tiny steps!
Stay with it!
```

Pomodoro completes:

```text
Nice work!
```

Break starts:

```text
Break time!
```

All tasks complete:

```text
All done!
```

Speech bubble style:

- Off-white fill
- Black pixel border
- Dark brown offset shadow
- Pixel font
- Same retro UI style as existing app
- No gradients
- No glass effect
- No modern rounded design

---

## Hourglass Behavior

Use these files:

```text
/assets/sprites/hourglass-frame-1.png
/assets/sprites/hourglass-frame-2.png
/assets/sprites/hourglass-frame-3.png
/assets/sprites/hourglass-frame-4.png
/assets/sprites/hourglass-frame-5.png
/assets/sprites/hourglass-frame-6.png
/assets/sprites/hourglass-clean-sheet.png
```

Preferred implementation:

- Use `hourglass-clean-sheet.png`.
- Animate using CSS `steps(6)`.
- Use CSS classes to control running, paused, break, stopwatch, and completed states.

Suggested CSS classes:

```css
.pixel-hourglass
.pixel-hourglass.running
.pixel-hourglass.paused
.pixel-hourglass.break-mode
.pixel-hourglass.stopwatch-mode
.pixel-hourglass.completed
```

State mapping:

### Pomodoro Running

- Animate from frame 1 to frame 6.
- Normal countdown speed.
- Animation should play.

### Pomodoro Paused / Stopped

- Pause the animation.
- Keep current frame if easy.
- Otherwise show frame 1.

### Pomodoro Complete

- Show frame 6.

### Break Running

- Animate slowly or calmly.
- Slower than focus mode.

### Break Paused

- Pause animation.

### Stopwatch Running

- Loop through all 6 frames continuously.

### Stopwatch Paused / Stopped

- Pause the animation.

---

## Hourglass Placement

Place the hourglass near the timer display.

Preferred locations:

- Inside the main timer panel near the timer digits
- Beside the large timer numbers
- Near the timer card without changing the layout

The hourglass must not:

- Shift the timer digits
- Cover the timer digits
- Cover buttons
- Cover task controls
- Force a UI redesign

Recommended size:

```text
48px to 64px
```

Use:

```css
image-rendering: pixelated;
image-rendering: crisp-edges;
```

---

## Reduced Motion

Respect reduced motion.

Add something like:

```css
@media (prefers-reduced-motion: reduce) {
  .pixel-hourglass {
    animation: none !important;
  }

  .bunny-speech-bubble {
    transition: none !important;
    animation: none !important;
  }
}
```

---

## Suggested Implementation Plan

Follow this order:

1. Inspect the project structure.
2. Identify the app framework.
3. Identify the main timer component.
4. Identify current timer state variables.
5. Create asset directories if needed:

```text
public/assets/raw/
public/assets/sprites/
scripts/
```

6. Confirm the raw PNG files exist.
7. Create and run the sprite extraction script.
8. Verify output PNG files exist.
9. Add BunnyMascot component or markup.
10. Add PixelHourglass component or markup.
11. Add CSS for placement, pixel rendering, sprite animation, responsive behavior, and reduced motion.
12. Connect bunny state to existing Pomodoro / Break / Complete / Motivation states.
13. Connect hourglass animation to existing running / paused / stopwatch / break / completed states.
14. Add motivational speech bubble logic.
15. Run lint/build/test commands if available.
16. Report changed files and how to run the app.

---

## If Cropping Is Hard

If automatic cropping fails, use this fallback:

### Bunny fallback

Divide the bunny sheet into 4 equal horizontal sections.

Each section corresponds to one bunny state:

1. Pomodoro
2. Complete
3. Motivation
4. Break

Then crop transparent padding within each section as safely as possible.

### Hourglass fallback

Divide the hourglass sheet into 6 equal horizontal sections.

Each section corresponds to one animation frame.

Keep all hourglass frames on the same canvas size so the animation does not jump.

---

## If CSS Sprite Sheet Is Easier

For the hourglass, CSS sprite animation is preferred.

Create:

```text
public/assets/sprites/hourglass-clean-sheet.png
```

It should contain 6 equal-width frames in one horizontal row.

Then animate with CSS similar to:

```css
.pixel-hourglass {
  width: 56px;
  height: 56px;
  background-image: url("/assets/sprites/hourglass-clean-sheet.png");
  background-repeat: no-repeat;
  background-size: 600% 100%;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.pixel-hourglass.running {
  animation: hourglass-frames 1.2s steps(6) infinite;
}

.pixel-hourglass.break-mode.running {
  animation-duration: 2.4s;
}

.pixel-hourglass.paused {
  animation-play-state: paused;
}

.pixel-hourglass.completed {
  animation: none;
  background-position: 100% 0;
}

@keyframes hourglass-frames {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 100% 0;
  }
}
```

Adjust the exact CSS to fit the app.

---

## If Individual Frames Are Easier

If using image elements instead of CSS sprite animation:

- Cycle through the 6 hourglass frame PNGs while running.
- Stop cycling when paused.
- Show frame 6 when completed.
- Loop continuously for stopwatch mode.
- Use a slower interval for break mode.

Do not use canvas unless absolutely necessary.

---

## Final Acceptance Criteria

The task is complete only when all of the following are true:

1. `bunny-sheet.png` and `hourglass-sheet.png` are processed into clean PNG assets.
2. The bunny sprites exist:
   - `bunny-pomodoro.png`
   - `bunny-complete.png`
   - `bunny-motivation.png`
   - `bunny-break.png`
3. The hourglass frames exist:
   - `hourglass-frame-1.png`
   - `hourglass-frame-2.png`
   - `hourglass-frame-3.png`
   - `hourglass-frame-4.png`
   - `hourglass-frame-5.png`
   - `hourglass-frame-6.png`
4. The clean hourglass sprite sheet exists:
   - `hourglass-clean-sheet.png`
5. Bunny states work:
   - Clock bunny during Pomodoro/focus
   - Sleeping bunny during break
   - Board/sign bunny when finished
   - Cheering bunny for motivation moments
6. Hourglass states work:
   - Pomodoro running animates
   - Pomodoro paused/stopped pauses
   - Break running animates slower
   - Stopwatch running loops continuously
   - Completed state shows final frame
7. Existing UI remains visually the same.
8. No timer controls are blocked.
9. No layout shift occurs when the bunny or speech bubble appears.
10. Pixel art stays sharp.
11. The app builds and runs successfully.

---

## Final Response Required

After completing the work, report:

1. Which files were created.
2. Which files were modified.
3. Which command was used to process the sprites.
4. Which command was used to build or test the app.
5. How to run the app locally.
6. Any assumptions made.
