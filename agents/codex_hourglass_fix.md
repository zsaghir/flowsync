````md
# Codex Follow-Up Task: Refine Hourglass Timing and Placement

## Goal

Continue from the current implementation.

The hourglass animation is now correctly showing as one fixed hourglass instead of a sliding sprite sheet. Keep that fix.

Now update only these things:

1. Move the hourglass slightly:
   - 20–30px more left
   - 10–15px higher

2. Change the hourglass animation timing:
   - For Pomodoro and Break countdown modes, the hourglass animation should be tied to the timer duration.
   - Use the formula:

```text
animation duration = total timer duration / 4
```
````

3. The final/empty hourglass frame should appear when the timer finishes.

Do not change the bunny unless absolutely necessary.

Do not redesign the UI.

---

## Do Not Change

Do not change:

- Bunny placement
- Timer layout
- Timer digits
- Mode buttons
- Start/Pause button
- Task input
- Add button
- Tasks button
- Existing color scheme
- Existing pixel-art style
- Existing timer logic, except where needed to connect hourglass timing correctly

Do not add:

- Gradients
- Modern shadows
- Glass effects
- Smooth object movement
- New design system
- Unnecessary packages

---

## Hourglass Placement Update

The hourglass is currently close, but it needs to be adjusted.

Move the hourglass:

```text
20–30px more left
10–15px higher
```

This means:

- If the hourglass is positioned with `right`, increase the `right` value by around `20px` to `30px`.
- If the hourglass is positioned with `left`, decrease the `left` value by around `20px` to `30px`.
- If the hourglass is positioned with `top`, decrease the `top` value by around `10px` to `15px`.

Example:

```css
/* If current CSS is like this */
.pixel-hourglass {
  top: 118px;
  right: 70px;
}

/* Change approximately to this */
.pixel-hourglass {
  top: 104px;
  right: 95px;
}
```

Use the actual current values in the project and adjust them accordingly.

Acceptance for placement:

- Hourglass is 20–30px more left than before.
- Hourglass is 10–15px higher than before.
- Hourglass does not cover timer digits.
- Hourglass does not cover buttons.
- Hourglass feels balanced inside the timer panel.
- Bunny remains in its current good placement.

---

## Hourglass Animation Timing Requirement

For Pomodoro and Break countdown modes, the hourglass animation should be based on the timer duration.

Use this formula:

```text
hourglass animation duration = total timer duration / 4
```

Meaning:

- If Pomodoro duration is 25 minutes, the hourglass animation should take 6.25 minutes for one full cycle.
- If Break duration is 5 minutes, the hourglass animation should take 1.25 minutes for one full cycle.
- The animation can loop during the timer, but the final frame must be shown when the timer finishes.

Use seconds or milliseconds in code.

Example logic:

```js
const totalDurationSeconds =
  mode === "break" ? breakDurationSeconds : pomodoroDurationSeconds;

const hourglassAnimationDurationSeconds = totalDurationSeconds / 4;
```

Then pass that to CSS using an inline style or CSS variable:

```jsx
<div
  className={hourglassClassName}
  style={{
    "--hourglass-duration": `${hourglassAnimationDurationSeconds}s`,
  }}
/>
```

CSS:

```css
.pixel-hourglass.running {
  animation-duration: var(--hourglass-duration);
}
```

Important:

- Do not hardcode the Pomodoro hourglass speed to `1.2s`.
- Do not hardcode the Break hourglass speed to `2.4s`.
- Use the real timer duration divided by 4.
- Stopwatch mode can still use a short looping animation because stopwatch has no fixed end time.

---

## Stopwatch Timing

Stopwatch does not have a fixed total duration, so do not use `time / 4` for stopwatch.

For Stopwatch mode:

```text
Use a continuous short loop, around 1.2s to 2s.
```

Example:

```css
.pixel-hourglass.stopwatch-mode.running {
  animation-duration: 1.5s;
  animation-iteration-count: infinite;
}
```

---

## Completed / Timer Finished Behavior

When Pomodoro or Break finishes:

- Stop the hourglass animation.
- Show the final hourglass frame.
- The final frame should be the last image/frame where the hourglass is empty at the top and full/finished at the bottom.

Use:

```text
/assets/sprites/hourglass-frame-6.png
```

or the equivalent final frame in the sprite sheet.

If using CSS sprite background:

```css
.pixel-hourglass.completed {
  animation: none;
  background-position: 100% 0;
}
```

If using individual frame image swapping:

```js
const completedFrame = "/assets/sprites/hourglass-frame-6.png";
```

Acceptance:

- When Pomodoro finishes, the hourglass shows the final/empty frame.
- When Break finishes, the hourglass shows the final/empty frame.
- It should not reset immediately to frame 1 after completion.
- It should remain on the final frame until the next timer mode/session starts or the user resets.

---

## Running / Paused Behavior

### Pomodoro Running

- Use the total Pomodoro duration divided by 4 as the animation duration.
- The hourglass stays fixed.
- Only the sand/frame changes.

### Pomodoro Paused

- Pause the animation.
- Do not reset the frame unless the existing app reset behavior requires it.

### Pomodoro Finished

- Show final frame.
- Stop animation.

### Break Running

- Use the total Break duration divided by 4 as the animation duration.
- The hourglass stays fixed.
- Only the sand/frame changes.

### Break Paused

- Pause the animation.
- Do not reset the frame unless the existing app reset behavior requires it.

### Break Finished

- Show final frame.
- Stop animation.

### Stopwatch Running

- Use a continuous short loop, around 1.2s to 2s.
- Do not use `time / 4`.

### Stopwatch Paused

- Pause the animation.

---

## Implementation Notes

Find the current `PixelHourglass` component or equivalent.

Update it so it receives or calculates:

```js
mode;
isRunning;
isPaused;
isCompleted;
totalDurationSeconds;
```

Then calculate:

```js
const isCountdownMode = mode === "pomodoro" || mode === "break";

const hourglassAnimationDurationSeconds = isCountdownMode
  ? totalDurationSeconds / 4
  : 1.5;
```

Use a CSS variable:

```jsx
style={{
  "--hourglass-duration": `${hourglassAnimationDurationSeconds}s`,
}}
```

Then in CSS:

```css
.pixel-hourglass.running {
  animation-duration: var(--hourglass-duration);
}
```

Make sure the animation still uses discrete frame switching, not smooth sliding.

---

## CSS Requirements

Keep or update CSS so the hourglass object itself does not move.

Do not animate:

- `top`
- `right`
- `left`
- `bottom`
- `margin`
- `transform`
- `translateX`
- `translateY`
- `object-position`

Only animate:

```css
background-position
```

or switch image frame source in JavaScript.

Example CSS direction:

```css
.pixel-hourglass {
  width: 52px;
  height: 52px;
  background-image: url("/assets/sprites/hourglass-clean-sheet.png");
  background-repeat: no-repeat;
  background-size: 600% 100%;
  background-position: 0 0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  position: absolute;

  /* Adjust based on current values:
     Move 20–30px left and 10–15px higher. */
  top: 104px;
  right: 95px;

  overflow: hidden;
  pointer-events: none;
}

.pixel-hourglass.running {
  animation-name: hourglassFrames;
  animation-duration: var(--hourglass-duration);
  animation-timing-function: steps(5);
  animation-iteration-count: infinite;
}

.pixel-hourglass.paused {
  animation-play-state: paused;
}

.pixel-hourglass.completed {
  animation: none;
  background-position: 100% 0;
}

.pixel-hourglass.stopwatch-mode.running {
  animation-duration: 1.5s;
}

@keyframes hourglassFrames {
  from {
    background-position: 0% 0;
  }

  to {
    background-position: 100% 0;
  }
}
```

Important:

Use the actual current position values in the code. Do not blindly use `top: 104px` and `right: 95px` if the current CSS uses different values.

The required visual change is:

```text
20–30px more left
10–15px higher
```

---

## If Using Individual Frame Images Instead of CSS Sprite

If the current implementation uses individual PNG frame swapping, keep that approach.

Update the frame interval based on:

```text
total timer duration / 4
```

There are 6 frames, so calculate the delay per frame like this:

```js
const animationCycleSeconds = totalDurationSeconds / 4;
const frameDelayMs = (animationCycleSeconds * 1000) / 6;
```

For Stopwatch:

```js
const frameDelayMs = 250;
```

When Pomodoro or Break finishes:

```js
setCurrentFrame(5); // frame 6 if using zero-based index
```

or:

```js
setCurrentFrameSrc("/assets/sprites/hourglass-frame-6.png");
```

Do not continue cycling after completion.

---

## Reduced Motion

Keep reduced motion support.

```css
@media (prefers-reduced-motion: reduce) {
  .pixel-hourglass {
    animation: none !important;
  }
}
```

If using JavaScript frame swapping, stop or slow frame cycling when reduced motion is preferred.

---

## Acceptance Criteria

This task is complete only when:

1. Bunny placement remains unchanged.
2. Hourglass is moved 20–30px more left.
3. Hourglass is moved 10–15px higher.
4. Hourglass does not cover the timer digits.
5. Hourglass object stays fixed in one place.
6. Only the sand/frame changes.
7. Pomodoro animation duration uses:

```text
pomodoro total duration / 4
```

8. Break animation duration uses:

```text
break total duration / 4
```

9. Stopwatch uses a short continuous loop instead of `time / 4`.
10. When Pomodoro finishes, the hourglass shows the final/empty frame.
11. When Break finishes, the hourglass shows the final/empty frame.
12. The final frame remains visible after completion until the next session/reset.
13. Existing UI remains visually the same.
14. App builds successfully.

---

## Final Response Required From Codex

After finishing, report:

1. Files modified.
2. Whether CSS sprite animation or individual frame swapping is being used.
3. The exact hourglass position values before and after.
4. How the `time / 4` animation duration was implemented.
5. How the final frame is shown on Pomodoro/Break completion.
6. Build/test command run.
7. Whether any issues remain.

Do not commit.
Do not push.
Ask before making any git commit.

```

```
