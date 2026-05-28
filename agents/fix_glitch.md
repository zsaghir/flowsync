# FlowSync Music Timer Fix Guide

This README describes the safe way to fix the current music-setting glitch without changing the rest of the app workflow.

## Problem

The selected music is saved from `app/components/Setting.tsx`, but playback is controlled mostly by the Pomodoro play button in `app/components/Timer.tsx`.

That creates these glitches:

- Changing the music setting does not reliably control the saved music state used by the timer.
- Music starts from the Pomodoro button path only.
- Stopwatch does not share the same music behavior.
- Music can keep playing unless every stop path manually pauses it.

## Target Behavior

- The Settings popup owns music selection.
- Music changes only become the app's saved music choice when the user clicks `Save Settings`.
- Starting a Pomodoro timer plays the saved music, unless the saved value is `None`.
- Starting the stopwatch plays the saved music, unless the saved value is `None`.
- Pausing, stopping, resetting, switching modes, or completing a timer stops the music.
- When the Pomodoro timer finishes and the notification bell rings, the music stops first.
- Music does not play while the app is paused.
- Music does not play during break mode unless that is intentionally added later.
- Existing timer saving, auth, task, and UI workflows stay the same.

## Files To Edit

Only edit these files for this fix:

- `app/components/Timer.tsx`
- `app/components/Setting.tsx`, only if the save behavior is not already working
- `app/page.tsx`, only if the settings provider is missing `music` or `setMusic`
- `app/components/Contexts.tsx`, only if the settings type is missing `music` or `setMusic`

Do not edit the API routes, task components, auth code, database code, Docker files, or package files for this bug.

## Current State

The settings side is mostly correct already:

- `app/page.tsx` stores `music` in state.
- `SettingsContext.Provider` passes `music` and `setMusic`.
- `Setting.tsx` keeps a temporary music choice in `tempmusic`.
- `handleSave()` calls `settingsInfo.setMusic(tempmusic)`.

The unsafe part is in `Timer.tsx`:

- `handleMusicChange()` directly starts audio.
- The Pomodoro play button calls `handleMusicChange()`.
- Stopwatch start does not call the same music logic.
- Stop paths manually pause audio in several places.

## Safe Implementation Plan

### 1. Keep settings as the source of truth

Keep the current `Setting.tsx` flow:

```tsx
const [tempmusic, settempMusic] = useState(
  typeof settingsInfo.music === "string" ? settingsInfo.music : "None",
);

const handleSave = () => {
  settingsInfo.setPomodoroTime(tempPomodoro);
  settingsInfo.setBreakTime(tempBreak);
  if (settingsInfo.setMusic) settingsInfo.setMusic(tempmusic);
  closePopup();
};
```

Selecting an item in the dropdown should only change `tempmusic`. It should not start or stop audio. Clicking `Save Settings` commits the music choice to `SettingsContext`.

### 2. Move playback control into timer state

In `Timer.tsx`, remove the idea that the Pomodoro button controls music selection. Replace `handleMusicChange()` with small timer-owned helpers:

```tsx
function shouldPlayMusic() {
  return (
    isRunning &&
    (mode === "pomodoro" || mode === "stopwatch") &&
    settingsInfo.music &&
    settingsInfo.music !== "None"
  );
}

function stopMusic() {
  if (!audioRef.current) return;
  audioRef.current.pause();
  audioRef.current.currentTime = 0;
}

function playSavedMusic() {
  if (!audioRef.current || !settingsInfo.music || settingsInfo.music === "None") return;
  audioRef.current.src = settingsInfo.music;
  audioRef.current.loop = true;
  audioRef.current.currentTime = 0;
  audioRef.current.play().catch(() => {});
}
```

### 3. Add one sync effect for saved music

Add a `useEffect` in `Timer.tsx` that reacts to timer running state, active mode, and saved music:

```tsx
useEffect(() => {
  if (shouldPlayMusic()) {
    playSavedMusic();
    return;
  }

  stopMusic();
}, [isRunning, mode, settingsInfo.music]);
```

This makes `Save Settings` matter immediately:

- If the timer is paused, saving a new music choice only updates state.
- If Pomodoro or stopwatch is running, saving a new music choice switches to that track.
- If the user saves `None`, current music stops.

### 4. Remove Pomodoro-only music calls

In the Pomodoro play button handler, remove this line:

```tsx
handleMusicChange();
```

The play button should only start the timer. The effect above decides whether saved music should play.

### 5. Let all stop paths stop music through the same state

Do not rely on scattered manual audio calls as the main behavior. These state changes should be enough to stop music through the sync effect:

- Pomodoro pause sets `isPaused` to `true`.
- Stopwatch stop sets `swRunning` to `false`.
- Stopwatch reset sets `swRunning` to `false`.
- Mode switching sets running state to paused/stopped.
- Timer completion sets `isPaused` to `true` before ringing the bell.

It is still okay to call `stopMusic()` directly right before the notification bell plays so the bell is clean:

```tsx
stopMusic();
bellRef.current.currentTime = 0;
bellRef.current.play().catch(() => {});
```

### 6. Be careful with React state timing

`isRunning` is calculated from React state:

```tsx
const isRunning = mode === "stopwatch" ? swRunning : !isPaused;
```

So do not read `isRunning` immediately after calling `setIsPaused(false)` or `setSwRunning(true)` and expect it to already be updated. Let the `useEffect` run after React updates the state.

## Manual Test Checklist

Run the app with:

```bash
npm run dev
```

Then verify:

- Open Settings, choose `Focus`, click `Save Settings`, start Pomodoro: music plays.
- Pause Pomodoro: music stops.
- Resume Pomodoro: music plays again.
- Let Pomodoro finish: music stops and the bell rings.
- Open Settings while paused, choose `Rain`, click `Save Settings`, start Pomodoro: rain plays.
- Open Settings while Pomodoro is running, choose `Lo-fi`, click `Save Settings`: music changes to lo-fi.
- Open Settings while Pomodoro is running, choose `None`, click `Save Settings`: music stops.
- Switch to Stopwatch, start it: saved music plays.
- Stop Stopwatch: music stops.
- Reset Stopwatch: music stays stopped.
- Switch to Break mode and start break: music stays stopped.

## What Not To Change

- Do not persist music in `data/db.json` for this fix.
- Do not add a new package.
- Do not change auth or tasks.
- Do not change the timer API payload.
- Do not remove stopwatch timer persistence.
- Do not make the dropdown start or stop audio directly.

## Expected Result

After this fix, the Settings popup controls the saved music choice, and the timer controls when audio is allowed to play. Music playback is based on one rule:

```txt
play music only when saved music is not None and Pomodoro or Stopwatch is running
```
