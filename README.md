# Stabtor

Stabtor is a browser-based ASCII bass and guitar tablature editor inspired by AdiBASS 2.0 built in year 2002 by P Hadiwijaya.
It uses plain HTML, CSS, and JavaScript with no build step or external dependencies.

## Version update
- Version 1.0
- Updated on 15/10/2026

## Features

- Four-, five-, and six-string bass tunings; six- and seven-string standard guitar tunings
- Fret entry from 0 to 24, note durations, left- and right-hand finger indicators
- Hammer-ons, pull-offs, bends, vibrato, slap, pop, tap, harmonics, muting, and slides
- Rests, single and repeat-paired double bars, named section headings, new tablature lines, and undo
- Metadata and `.TAB` import/export with an always-included reading guide

## Controls

### Instrument and note settings

- **Instrument** switches between Bass and Guitar. Bass offers 4, 5, or 6 strings; Guitar offers 6 or 7. Each instrument remembers its last selected string count.
- **String number** selects the tuning and number of staff lines.
- **Note on string** chooses the individual string for the next note. Guitar strings with the same pitch, such as high E and low E, remain separate choices.
- **Fret** selects a fret from 0 through 24.
- **Duration (above tab)** selects the rhythm symbol shown above the tablature column. Dotted values end in a period.
- **Left finger (below tab)** selects none or fingers 1-5. A selected number is printed beneath the staff.
- **Right finger (tab bottom)** selects none or i, m, r, p, or t. A selected letter is printed on the line below the left-finger indicators.
- **Technique** adds a notation symbol to the fret: hammer-on (h), pull-off (p), bend (b), vibrato (v), slap (S), pop (P), tap (t), harmonic (H), or muted (x). For **Slide**, enter the destination in **Slide to fret**; the direction is shown as `/` or `\`.

### Tablature actions

- **Add note** adds a note using the current string, fret, duration, finger, and technique selections.
- **Add rest** inserts a rest using the selected duration. The rest is shown as r/e/s/t down the first four string lines.
- **Add bar** inserts a single bar line.
- **Add double bar** inserts a double-bar boundary. Double bars pair in order: the first opens a repeated section and the next closes it. Set **Times** before adding the closing double bar; its `Nx` marker appears above the closing bar.
- **New line** starts a new tablature staff.
- **Undo** removes the most recently added note or tablature event.
- **Clear** asks for confirmation, then removes all tablature events. Metadata and instrument settings remain.
- **Section text** plus **Add section** adds a heading such as `Intro:` above a tablature block. When added after notes, the heading starts a new block. The text field must not be empty.
- **Readme** opens this guide in a new browser tab.

### TAB META data and file actions

- **Title**, **Artist / group**, **Info**, and **Transcribed by** inputs are shown in the downloaded file header. Blank fields receive default inputs where applicable.
- **Open .TAB** opens a user-selected `.TAB` file in a separate read-only text view. Imported text is not converted into editable notes.
- **Download .TAB** downloads the current tablature and reading guide as `Title_Artist.TAB`. Enter at least one tablature event before downloading.

## Basic Workflow

1. Choose Bass or Guitar, then choose a string count.
2. Set the note's string, fret, duration, fingers, and technique; select **Add note**.
3. Add rests, bar lines, repeat sections, new lines, or section headings as needed.
4. Enter the file details and select **Download .TAB**.

## File Handling

Stabtor does not write directly to arbitrary folders. Use **Download .TAB** to
save the current composition through the browser, and **Open .TAB** to choose an
existing file for viewing. Imported files are not parsed into editable notes.

Compositions are held in memory while the page is open. Download the `.TAB`
before refreshing or closing the page to keep your work.

## Browser Support

The app uses standard browser features including the File API, Blob downloads,
and file inputs. Core editor interactions and file reading/Blob generation were
checked in VS Code's Chrome 150-based runtime. Standalone Chrome and Edge were
smoke-tested by rendering screenshots; their full workflows were not tested.
Firefox and Safari were not available for testing.