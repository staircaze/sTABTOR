"use strict";

function createStrings(pitches, labels = pitches.map((pitch) => `${pitch} string`)) {
	return pitches.map((pitch, index) => ({ pitch, label: labels[index] }));
}

const tuningByInstrument = {
	bass: {
		4: createStrings(["G", "D", "A", "E"]),
		5: createStrings(["G", "D", "A", "E", "B"]),
		6: createStrings(["C", "G", "D", "A", "E", "B"]),
	},
	guitar: {
		6: createStrings(
			["e", "B", "G", "D", "A", "E"],
			["High E string", "B string", "G string", "D string", "A string", "Low E string"],
		),
		7: createStrings(
			["e", "b", "G", "D", "A", "E", "B"],
			["High E string", "B string", "G string", "D string", "A string", "Low E string", "Low B string"],
		),
	},
};

const noteForm = document.querySelector("#note-form");
const instrumentChoice = document.querySelector("#instrument-choice");
const stringCount = document.querySelector("#string-count");
const stringChoice = document.querySelector("#string-choice");
const fretNumber = document.querySelector("#fret-number");
const durationChoice = document.querySelector("#duration-choice");
const fingerChoice = document.querySelector("#finger-choice");
const rightFingerChoice = document.querySelector("#right-finger-choice");
const techniqueChoice = document.querySelector("#technique-choice");
const slideControl = document.querySelector("#slide-control");
const slideTarget = document.querySelector("#slide-target");
const tabPreview = document.querySelector("#tab-preview");
const entryCount = document.querySelector("#entry-count");
const exportButton = document.querySelector("#export-tab");
const repeatCountInput = document.querySelector("#repeat-count");
const undoButton = document.querySelector("#undo-entry");
const clearAllButton = document.querySelector("#clear-all");
const newLineButton = document.querySelector("#new-line");
const sectionTextInput = document.querySelector("#section-text");
const tabFileInput = document.querySelector("#tab-file");
const importedSection = document.querySelector("#imported-section");
const importedName = document.querySelector("#imported-name");
const importedPreview = document.querySelector("#imported-preview");
const importError = document.querySelector("#import-error");
const entries = [];
const selectedStringCounts = { bass: "4", guitar: "6" };
let activeInstrument = instrumentChoice.value;

/* Tablature height adjuster */
function updatePreviewHeight() {
    const heights = {
        "4": 220,
        "5": 275,
        "6": 330,
        "7": 385
    };

    tabPreview.style.maxHeight =
        `${heights[stringCount.value] || 220}px`;
}

function getCurrentTuning() {
	return tuningByInstrument[instrumentChoice.value][stringCount.value];
}

function renderStringCountChoices() {
	const counts = Object.keys(tuningByInstrument[instrumentChoice.value]);
	stringCount.replaceChildren(
		...counts.map((count) => new Option(`${count} strings`, count)),
	);
	stringCount.value = selectedStringCounts[instrumentChoice.value];
}

function renderStringChoices() {
	const tuning = getCurrentTuning();
	const previousChoice = stringChoice.value;
	stringChoice.replaceChildren(
		...tuning.map((string, index) => new Option(string.label, String(index))),
	);

	if (previousChoice !== "" && Number(previousChoice) < tuning.length) {
		stringChoice.value = previousChoice;
	}
}



function renderSystem(systemEntries, tuning, repeatLabels) {
    const centerText = (text, width, fill = " ") => {
        const leftPadding = Math.floor((width - text.length) / 2);

        return (
            fill.repeat(leftPadding) +
            text +
            fill.repeat(width - text.length - leftPadding)
        );
    };

    const columns = systemEntries.map((entry) => {
        let text = "";

        if (entry.type === "rest") {
            text = "r";
        } else if (entry.type === "bar") {
            text = entry.glyph === "||" ? "-||" : entry.glyph;
        } else if (entry.technique === "x") {
            text = "x";
        } else {
            text = String(entry.fret);

            if (entry.technique === "slide") {
                text += `${entry.slideTarget >= entry.fret ? "/" : "\\"}${entry.slideTarget}`;
            } else {
                text += entry.technique;
            }
        }

        const duration = entry.duration || "";
        const finger = entry.finger || "";
        const rightFinger = entry.rightFinger || "";
        const repeatLabel = repeatLabels.get(entry) || "";

        return {
            ...entry,
            text,
            duration,
            finger,
            rightFinger,
            repeatLabel,
            width: Math.max(
                entry.type === "bar" ? 1 : 3,
                text.length + (entry.type === "note" ? 2 : 0),
                duration.length,
                finger.length + (entry.type === "note" ? 2 : 0),
                rightFinger.length + (entry.type === "note" ? 2 : 0),
                repeatLabel.length
            )
        };
    });

    const durationLine = `  ${columns
        .map((column) => {
            const duration = centerText(column.duration, column.width);

            if (column.repeatLabel) {
                return duration + " ".repeat(column.repeatLabel.length + 2);
            }

            return duration;
        })
        .join("")}`;

    const repeatIndex = columns.findIndex((column) => column.repeatLabel);
    const repeatLabel =
        repeatIndex >= 0 ? columns[repeatIndex].repeatLabel : "";

    const hasFollowingEntries =
        repeatIndex >= 0 && repeatIndex < columns.length - 1;

    const tabLines = tuning.map((string, stringIndex) => {
        const cells = columns.map((column) => {
            if (column.type === "bar") {
                return column.text.padEnd(column.width, "-");
            }

            if (column.type === "rest") {
                const restLetter = "rest"[stringIndex];

                return restLetter
                    ? centerText(restLetter, column.width, "-")
                    : "-".repeat(column.width);
            }

            if (column.stringIndex !== stringIndex) {
                return "-".repeat(column.width);
            }

            return centerText(column.text, column.width, "-");
        });

        const lastColumn = columns[columns.length - 1];
        const hasEndingBar = lastColumn?.type === "bar";

        const tabLine =
            `${string.pitch}|${cells.length ? cells.join("") : "--"}` +
            (hasEndingBar ? "" : "|");

        if (repeatIndex < 0 || !repeatLabel) {
            return tabLine;
        }

        const prefixLength =
            `${string.pitch}|${cells
                .slice(0, repeatIndex + 1)
                .join("")}`.length;

        const prefix = tabLine.slice(0, prefixLength);
        const suffix = tabLine.slice(prefixLength);

        const repeatGap = ` ${repeatLabel} `;

        // No extra separator when the repeat bar is the final entry.
        if (!hasFollowingEntries) {
            if (stringIndex === tuning.length - 1) {
                return `${prefix}${repeatGap}`;
            }

            return `${prefix}${" ".repeat(repeatGap.length)}`;
        }

        // If more entries follow, align the next tablature column
        // across every string and place the repeat label on the bottom.
        if (stringIndex === tuning.length - 1) {
            return `${prefix}${repeatGap}|${suffix}`;
        }

        return `${prefix}${" ".repeat(repeatGap.length)}|${suffix}`;
    });

    const fingerLine = `  ${columns
        .map((column) =>
            centerText(
                column.type === "note" ? column.finger : "",
                column.width
            )
        )
        .join("")}`;

    const rightFingerLine = `  ${columns
        .map((column) =>
            centerText(
                column.type === "note" ? column.rightFinger : "",
                column.width
            )
        )
        .join("")}`;

    return [
        durationLine,
        ...tabLines,
        fingerLine,
        rightFingerLine
    ].join("\n");
}


function renderTab() {
	const tuning = getCurrentTuning();
	const systems = [{ section: "", entries: [] }];
	const repeatLabels = new Map();
	let doubleBarCount = 0;
	for (const entry of entries) {
		if (entry.type === "bar" && entry.glyph === "||") {
			doubleBarCount += 1;
			if (doubleBarCount % 2 === 0) {
				repeatLabels.set(entry, `x${entry.repeatCount || 2}`);
			}
		}
		if (entry.type === "lineBreak") {
			systems.push({ section: "", entries: [] });
		} else if (entry.type === "section") {
			const currentSystem = systems[systems.length - 1];
			if (currentSystem.entries.length === 0 && !currentSystem.section) {
				currentSystem.section = entry.text;
			} else {
				systems.push({ section: entry.text, entries: [] });
			}
		} else {
			systems[systems.length - 1].entries.push(entry);
		}
	}

	tabPreview.textContent = systems
		.map(({ section, entries: systemEntries }) => {
			const renderedSystem = renderSystem(systemEntries, tuning, repeatLabels);
			return section ? `${section}\n${renderedSystem}` : renderedSystem;
		})
		.join("\n\n");
		tabPreview.scrollTop = tabPreview.scrollHeight;

	entryCount.textContent = `${entries.length} ${entries.length === 1 ? "event" : "events"}`;
	exportButton.disabled = entries.length === 0;
	undoButton.disabled = entries.length === 0;
	clearAllButton.disabled = entries.length === 0;
	newLineButton.disabled = entries.length === 0 || entries[entries.length - 1].type === "lineBreak";
}

function addSection() {
	const text = sectionTextInput.value.trim();
	if (!text) {
		sectionTextInput.focus();
		return;
	}
	entries.push({ type: "section", text: `[${text}]` });
	sectionTextInput.value = "";
	renderTab();
}

function createTabText() {
	const separator = "=".repeat(99);
	const tuning = getCurrentTuning();
	const instrumentName = instrumentChoice.selectedOptions[0].textContent;
	const info = document.querySelector("#tab-info").value.trim() || `${tuning.length} Strings Standard ${instrumentName}`;
	const date = new Date();
	const dateStamp = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getFullYear()).slice(-2)}`;
	const timeStamp = [date.getHours(), date.getMinutes(), date.getSeconds()]
		.map((part) => String(part).padStart(2, "0"))
		.join(":");
	const title = document.querySelector("#tab-title").value.trim() || "Untitled";
	const artist = document.querySelector("#tab-artist").value.trim() || "Unknown";
	const creator = document.querySelector("#tab-creator").value.trim() || "NoName";
	const readingGuide = [
		"-".repeat(99),
		"TABS READING GUIDE:",
		"-".repeat(99),
		"Note length (above the strings):",
		"   w = whole, h = half, q = quarter, e = eighth, s = sixteenth, t = thirty-second.",
		"   a period after a duration symbol marks a dotted note.",
		"Left finger (below the strings):",
		"   1 = index, 2 = middle, 3 = ring, 4 = pinkie, 5 = thumb.",
		"Right finger (at tab bottom):",
		"   i = index, m = middle, r = ring, p = pinkie, t = thumb.",
		"Special note symbols:",
		"   h = hammer-on, p = pull-off, b = bend, v = vibrato, / = slide up; \\ = slide down,",
		"   S = slap, P = pop, t = tap, H = harmonic, x = muted note,",
		"   | = bar line; || = double bar line.",
		"Repeat count:",
		"   xNRepeat beside a closing double bar marks NRepeat times the section between double bars repeat.",
		`   <<< Generated with sTABTOR by PHAD | https://staircaze.github.io/sTABTOR >>>`,
		separator,
	];
	const formatHeaderLine = (label, value) => `${label.padEnd(15, " ")}: ${value}`;

	return [
		separator,
		formatHeaderLine("Title", title),
		formatHeaderLine("Artist/Group", artist),
		formatHeaderLine("Info", info),
		formatHeaderLine("Date - Time", `${dateStamp} - ${timeStamp}`),
		formatHeaderLine("Transcribed by", creator),
		separator,
		"",
		tabPreview.textContent.replace(/\r?\n/g, "\r\n").trimEnd(),
		"",
		...readingGuide,
	].join("\r\n");
}

function createFileName() {
	const safeFilePart = (value, fallback) => value
		.trim()
		.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
		.replace(/\s+/g, " ")
		.replace(/[. ]+$/g, "") || fallback;
	const title = safeFilePart(document.querySelector("#tab-title").value, "Untitled");
	const artist = safeFilePart(document.querySelector("#tab-artist").value, "Unknown");
	return `${title}_${artist}.TAB`;
}

function downloadTab() {
	const tabFile = new Blob([createTabText()], { type: "text/plain;charset=utf-8" });
	const fileUrl = URL.createObjectURL(tabFile);
	const downloadLink = document.createElement("a");
	downloadLink.href = fileUrl;
	downloadLink.download = createFileName();
	downloadLink.hidden = true;
	document.body.append(downloadLink);
	downloadLink.click();
	downloadLink.remove();
	setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
}

async function showImportedTab(file) {
	importedSection.hidden = false;
	importError.hidden = true;
	importedPreview.textContent = "";
	importedName.textContent = file.name;

	try {
		importedPreview.textContent = await file.text();
	} catch {
		importError.textContent = `Could not read ${file.name}.`;
		importError.hidden = false;
	}
}

function addRest() {
	entries.push({
		type: "rest",
		duration: durationChoice.value,
	});
	renderTab();
}

function addBar(glyph) {
	const repeatCount = Math.max(2, Math.trunc(Number(repeatCountInput.value) || 2));
	entries.push({ type: "bar", glyph, repeatCount: glyph === "||" ? repeatCount : null });
	renderTab();
}

stringCount.addEventListener("change", () => {
	selectedStringCounts[instrumentChoice.value] = stringCount.value;
	renderStringChoices();
	updatePreviewHeight();
	renderTab();
});

instrumentChoice.addEventListener("change", () => {
	selectedStringCounts[activeInstrument] = stringCount.value;
	activeInstrument = instrumentChoice.value;
	renderStringCountChoices();
	renderStringChoices();
	renderTab();
});

noteForm.addEventListener("submit", (event) => {
	event.preventDefault();
	entries.push({
		type: "note",
		stringIndex: Number(stringChoice.value),
		fret: Number(fretNumber.value),
		duration: durationChoice.value,
		finger: fingerChoice.value,
		rightFinger: rightFingerChoice.value,
		technique: techniqueChoice.value,
		slideTarget: Number(slideTarget.value),
	});
	renderTab();
});

document.querySelector("#add-rest").addEventListener("click", addRest);
document.querySelector("#add-bar").addEventListener("click", () => addBar("|"));
document.querySelector("#add-double-bar").addEventListener("click", () => addBar("||"));
document.querySelector("#add-section").addEventListener("click", addSection);
newLineButton.addEventListener("click", () => {
	if (!newLineButton.disabled) {
		entries.push({ type: "lineBreak" });
		renderTab();
	}
});
document.querySelector("#open-tab").addEventListener("click", () => tabFileInput.click());
tabFileInput.addEventListener("change", async () => {
	const file = tabFileInput.files[0];
	tabFileInput.value = "";
	if (file) {
		await showImportedTab(file);
	}
});
document.querySelector("#close-import").addEventListener("click", () => {
	importedSection.hidden = true;
	importedPreview.textContent = "";
	importedName.textContent = "";
	importError.textContent = "";
	importError.hidden = true;
});
undoButton.addEventListener("click", () => {
	if (entries.length > 0) {
		entries.pop();
		renderTab();
	}
});
clearAllButton.addEventListener("click", () => {
	if (entries.length > 0 && window.confirm("Clear all tablature events? This cannot be undone.")) {
		entries.length = 0;
		renderTab();
	}
});
exportButton.addEventListener("click", downloadTab);
techniqueChoice.addEventListener("change", () => {
	const isSlide = techniqueChoice.value === "slide";
	slideControl.hidden = !isSlide;
	slideTarget.disabled = !isSlide;
});

renderStringCountChoices();
renderStringChoices();
updatePreviewHeight();
renderTab();