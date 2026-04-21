# Random Shape Whiteboard Training Manual

This manual describes how to use the training features in Random Shape Whiteboard. It is intended to be updated as new exercises and controls are added.

The app is a visual attention training surface. It generates a whiteboard of randomly arranged colored shapes, then provides optional scaffolds for spatial sequencing, beat-paced attentional shifts, response tracking, and timed practice blocks.

## Core Idea

Each board contains many randomly placed shapes. Every shape has a black center dot. In exercise modes, the app highlights target shapes so the user can direct attention from one target to the next.

The training features are optional. You can use the board as a free exploration surface, a paced attention drill, a memory replay task, or a timed practice session.

## Basic Board Controls

Use **New board** to generate a fresh random board. The keyboard shortcut is `N`, or `Ctrl+Enter` / `Cmd+Enter`.

Use **Number of shapes** to control board density. Lower counts make targets easier to find. Higher counts increase visual search load and distractor density.

Use **Width** and **Height** to change the board dimensions. Larger boards increase search area and make scanning more demanding.

Use **Grid** to add spatial reference structure:

- **No grid**: clean whiteboard.
- **Square grid**: regular horizontal and vertical reference lines.
- **Hexagonal grid**: honeycomb-style reference structure.

Use **Grid faintness** to adjust the visibility of the grid.

## Shape Appearance Controls

The **Board & appearance** section controls how shapes are generated and displayed.

### Shape Types

Use the shape type toggles to include or exclude shape families:

- Circle
- Rectangle
- Triangle
- Pentagon
- Hexagon
- Diamond
- Star
- Capsule
- Ring

At least one shape type always remains enabled. If you want a simpler board, use only one or two shape types. If you want more visual variety, enable all types.

### Palette

Use **Palette** to choose the color set:

- **Bright**: saturated, high-energy colors.
- **Muted**: calmer colors with less visual intensity.
- **Pastel**: soft colors with lower contrast.
- **High contrast**: strong colors, including very dark and very light shapes.
- **Grayscale**: removes hue as a cue and emphasizes form, size, and location.

### Shape Size

Use **Shape size** to adjust visual scale:

- **Small**: more empty space around each shape, more precise visual targeting.
- **Medium**: balanced scale.
- **Large**: stronger salience and more crowding.
- **Mixed**: randomized size variation across the board.

### Rotation

Use **Rotation** to control orientation variation:

- **None**: all shapes use stable orientation.
- **Subtle**: small random rotations.
- **Full random**: wide orientation variation.

Rotation is useful for increasing visual diversity without changing the exercise rules.

### Fill Style

Use **Fill style** to change how the inside of each shape is rendered:

- **Solid**: opaque colored shapes.
- **Translucent**: colored shapes with adjustable opacity.
- **Outline only**: no interior fill, emphasizing contours and center markers.

Use **Fill opacity** to tune the translucency level when translucent fill is selected.

### Borders

Use **Border style** to control outlines:

- **None**: no added outline unless outline-only fill is selected.
- **Thin**: light outline.
- **Medium**: default outline.
- **Bold**: heavy outline for stronger separation.
- **Dashed**: segmented outline for additional visual variety.

Use **Border color** to set the outline color.

### Corners

Use **Corners** to change rectangle-like shape geometry:

- **Sharp**: squared corners.
- **Soft rounded**: moderate rounding.
- **Round**: stronger rounding.

Capsules remain rounded by design.

### Center Markers

Use **Center marker** to change the black dot at each shape center:

- **Dot**: filled circular marker.
- **Ring**: hollow circular marker.
- **Crosshair**: crossing lines through the center.
- **None**: hides center markers.

Use **Marker color** and **Marker size** to customize marker appearance.

### Labels

Borders, outlines, and center markers improve shape separation, especially with pastel or grayscale palettes.

Use **Show labels below shapes** in free practice mode to display labels. Labels can be random words or sequential numbers.

In paced exercise modes, labels are automatically numeric so target order is clear.

## Exercise Modes

Use **Attention mode** to choose how targets are assigned.

### Free Practice

Free practice does not assign a target. Use it for open visual exploration, visual search, board inspection, or self-directed drills.

Useful settings:

- Turn labels on for naming or verbal scanning exercises.
- Use grayscale to reduce color reliance.
- Increase shape count for harder visual search.

### Sequential Stepping

Sequential stepping highlights targets in numeric order. The target advances according to the pacing setting and beat count.

Use this to practice smooth visual shifts across the board.

Suggested use:

- Start with `1 target every 2 beats`.
- Keep BPM low, around 50-70.
- Track clicks if you want confirmation feedback.
- Increase BPM or shape count after performance stabilizes.

### Anchor-Return Drill

Anchor-return alternates between moving through targets and periodically returning to target 1. Target 1 is treated as the anchor.

Use **Anchor return** to choose how often the drill returns to the anchor:

- Every 4 target steps
- Every 6 target steps
- Every 8 target steps

Use this to practice re-centering attention after exploring other targets.

Suggested use:

- Choose a moderate shape count.
- Use `1 target every 2 beats`.
- Keep target 1 visually in mind as the return point.

### Alternating-Feature Drill

Alternating-feature mode switches target selection between two feature classes.

Available patterns:

- **Triangle / circle**: alternates between triangle targets and circle targets when available.
- **Warm / cool color**: alternates between warm-colored and cool-colored shapes.

Use this to practice shifting attention based on features, not just sequence position.

Suggested use:

- Use mixed shapes and the bright or muted palette.
- Start with `1 target every 2 beats`.
- Enable the tempo ladder only after the pattern feels stable.

### Memory Replay

Memory replay shows a short sequence of highlighted targets, then hides the labels and asks the user to click the same targets in order.

Use **Memory length** to choose sequence length:

- 4 targets
- 6 targets
- 8 targets
- 10 targets

Use **Preview sequence** to begin or restart the preview. During preview, labels are shown and targets highlight one by one. During recall, click the remembered targets in order.

Suggested use:

- Start with 4 or 6 targets.
- Use fewer shapes while learning the task.
- Increase shape count or sequence length after recall accuracy improves.

## Pacing And Metronome

The metronome is an optional pacing scaffold. It is meant to support controlled attentional timing, not to turn the task into a rhythm game.

Use **Start metronome** and **Stop metronome** to control beat pacing.

The metronome uses scheduled beat timing internally. When audio is available, ticks are scheduled against the browser's audio clock; visual pulses and target advances are aligned to those scheduled beat times.

Use **Tempo** to set BPM.

Use **Pacing** to set target dwell:

- **1 target per beat**: target changes every beat.
- **1 target every 2 beats**: slower dwell.
- **1 target every 4 beats**: slowest dwell.

Use **Meter** to set beats per bar. The app shows the current beat within the bar.

Optional pulse settings:

- **Accent first beat**: emphasizes the first beat of each bar.
- **Audio pulse**: plays a tick sound.
- **Visual pulse**: flashes the board subtly on each beat.

Audio may require a user interaction before the browser allows playback.

## Tempo Ladder

The tempo ladder gradually increases BPM during a timed session.

Turn on **Use ladder** to enable it. Choose:

- **Step**: how many BPM are added at each stage.
- **Every**: how often the BPM increases.

The ladder only advances while a session timer is running. While the ladder is active during a session, manual tempo editing is locked so the pace stays predictable.

Suggested use:

- Start at a BPM that feels easy.
- Use small steps, such as `+2` or `+4 BPM`.
- Use longer intervals if accuracy drops quickly.

## Response Tracking

Use **Track clicks** to enable target click tracking in exercise modes.

When tracking is enabled, click the currently highlighted target. The app records:

- Attempts
- Correct clicks
- Accuracy percentage

Feedback appears after each click:

- Correct target clicks are marked correct.
- Incorrect clicks show the expected target and the clicked target.

Use **Reset metrics** to clear the current response stats.

Response tracking is disabled in free practice because there is no assigned target.

## Session Timer

Use the **Session timer** to create bounded practice blocks.

Available durations:

- 1 minute
- 3 minutes
- 5 minutes
- 10 minutes

Controls:

- **Start timer**: begins the session.
- **Pause timer**: pauses the countdown.
- **Reset timer**: resets the current duration.
- **Save snapshot**: manually records the current block, even if incomplete.

When the timer completes, the metronome stops automatically and the session is saved to the log.

## Session Log

The session log stores the five most recent session records for the current page session.

Each record includes:

- Exercise mode
- Whether it was completed or manually saved
- Elapsed time
- BPM or BPM range
- Correct clicks
- Attempts
- Accuracy

Use **Clear log** to remove the current log.

Use **Export log** to download the current log as a JSON file.

The session log is saved in the browser's local storage and should survive page reloads on the same device and browser. Clearing browser site data will remove the saved log.

## Practice Presets

Practice presets configure a coherent drill in one click. Applying a preset does not automatically start the metronome or timer.

Current presets:

- **Steady sequence**: slow sequential stepping for calibration.
- **Anchor return**: periodic return to target 1 for re-centering.
- **Feature switch**: alternating-feature mode with a gentle tempo ladder.
- **Memory replay**: six-target memory sequence.

After applying a preset, all controls remain editable.

## Random Alerts

The app can display random alert prompts at unpredictable intervals.

Use:

- **Alert min (s)**: shortest possible time between alerts.
- **Alert max (s)**: longest possible time between alerts.

These alerts can be used as interruption cues, orientation checks, or prompts to re-stabilize attention.

## Suggested Training Patterns

### Beginner Spatial Sequencing

1. Choose **Steady sequence**.
2. Use 30-50 shapes.
3. Set pacing to `1 target every 2 beats`.
4. Start the metronome.
5. Click each highlighted target.
6. Run a 3-minute session.

### Anchor Re-Centering

1. Choose **Anchor return**.
2. Keep target 1 in mind as the home base.
3. Use `Every 4 target steps`.
4. Start with a low BPM.
5. Increase the anchor interval only after the return feels reliable.

### Feature Switching

1. Choose **Feature switch**.
2. Select either triangle/circle or warm/cool.
3. Use a bright or muted palette.
4. Enable click tracking.
5. Use a tempo ladder only after accuracy is stable.

### Memory Replay

1. Choose **Memory replay**.
2. Start with 4 or 6 targets.
3. Press **Preview sequence**.
4. Watch the highlighted sequence.
5. Click the remembered targets in order during recall.
6. Increase memory length or board density gradually.

### Form-Focused Search

1. Use free practice or sequential stepping.
2. Choose the grayscale palette.
3. Disable some shape types so only a few remain.
4. Turn rotation to full random.
5. Increase shape count as the search becomes easier.

## Difficulty Levers

To make a drill easier:

- Reduce shape count.
- Use larger shapes.
- Use bright or high contrast colors.
- Reduce rotation.
- Use slower BPM.
- Use more beats per target.
- Use shorter memory sequences.

To make a drill harder:

- Increase shape count.
- Use mixed sizes.
- Use grayscale or pastel palettes.
- Enable more shape types.
- Use full random rotation.
- Increase BPM.
- Use the tempo ladder.
- Increase memory length.

## Notes For Future Updates

This manual should be updated when new features are added, especially if the app gains:

- Persistent session history
- Exportable performance data
- Additional exercise modes
- More shape fill styles or border controls
- Guided multi-block workouts
- More precise audio scheduling
- Automated test coverage for exercise logic
