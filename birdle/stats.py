import json
import re
import tkinter as tk
from tkinter import ttk, messagebox
import webbrowser

DATA = "birds.json"

with open(DATA, "r", encoding="utf-8") as f:
    data = json.load(f)

missing = []
url_only = []
correct = []
species_objects = {}
recorders = set()
unsaved_changes = False

for order in data["birds"].values():
    for family in order.values():
        for genus, genus_obj in family.items():
            if genus in ("name", "queries"):
                continue

            for epithet, species_obj in genus_obj.items():
                if epithet == "queries":
                    continue

                species_name = f"{genus} {epithet}"
                species_objects[species_name] = species_obj

                if "recordings" not in species_obj:
                    missing.append(species_name)
                    continue

                recordings = species_obj["recordings"]

                if not recordings:
                    missing.append(species_name)
                elif all(
                    isinstance(recording, dict)
                    and "url" in recording
                    and "rec" in recording
                    for recording in recordings
                ):
                    correct.append(species_name)
                elif any(
                    isinstance(recording, str)
                    for recording in recordings
                ):
                    url_only.append(species_name)

                for recording in recordings:
                    if isinstance(recording, dict) and isinstance(recording["rec"], str) and recording["rec"] != "":
                        recorders.add(recording["rec"])


root = tk.Tk()
root.title(f"Bird Recordings — {len(species_objects)} species loaded")
root.geometry("700x500")
root.minsize(800, 550)

root.columnconfigure(0, weight=1)
root.columnconfigure(1, weight=1)
root.rowconfigure(0, weight=1)


# ---------------------------------------------------------------------
# Left side: species lists
# ---------------------------------------------------------------------

left_frame = ttk.Frame(root, padding=10)
left_frame.grid(row=0, column=0, sticky="nsew")

left_frame.columnconfigure(0, weight=1)

left_frame.rowconfigure(1, weight=1)
left_frame.rowconfigure(3, weight=1)
left_frame.rowconfigure(5, weight=1)


# Correct recording format
correct_label = ttk.Label(
    left_frame,
    text=f"{len(correct)} species with correct recording format"
)
correct_label.grid(
    row=0,
    column=0,
    pady=(0, 5),
    sticky="w"
)

correct_list_frame = ttk.Frame(left_frame)
correct_list_frame.grid(
    row=1,
    column=0,
    pady=(0, 15),
    sticky="nsew"
)

correct_list_frame.columnconfigure(0, weight=1)
correct_list_frame.rowconfigure(0, weight=1)

correct_scrollbar = ttk.Scrollbar(
    correct_list_frame,
    orient="vertical"
)
correct_scrollbar.grid(row=0, column=1, sticky="ns")

correct_listbox = tk.Listbox(
    correct_list_frame,
    yscrollcommand=correct_scrollbar.set,
    exportselection=False
)
correct_listbox.grid(row=0, column=0, sticky="nsew")

correct_scrollbar.config(
    command=correct_listbox.yview
)

for species in correct:
    correct_listbox.insert(tk.END, species)


# Recordings missing credit
url_label = ttk.Label(
    left_frame,
    text=f"{len(url_only)} species with recordings missing credit"
)
url_label.grid(
    row=2,
    column=0,
    pady=(0, 5),
    sticky="w"
)

url_list_frame = ttk.Frame(left_frame)
url_list_frame.grid(
    row=3,
    column=0,
    pady=(0, 15),
    sticky="nsew"
)

url_list_frame.columnconfigure(0, weight=1)
url_list_frame.rowconfigure(0, weight=1)

url_scrollbar = ttk.Scrollbar(
    url_list_frame,
    orient="vertical"
)
url_scrollbar.grid(row=0, column=1, sticky="ns")

url_listbox = tk.Listbox(
    url_list_frame,
    yscrollcommand=url_scrollbar.set,
    exportselection=False
)
url_listbox.grid(row=0, column=0, sticky="nsew")

url_scrollbar.config(
    command=url_listbox.yview
)

for species in url_only:
    url_listbox.insert(tk.END, species)


# Missing recordings
missing_label = ttk.Label(
    left_frame,
    text=f"{len(missing)} species missing recordings"
)
missing_label.grid(
    row=4,
    column=0,
    pady=(0, 5),
    sticky="w"
)

missing_list_frame = ttk.Frame(left_frame)
missing_list_frame.grid(
    row=5,
    column=0,
    sticky="nsew"
)

missing_list_frame.columnconfigure(0, weight=1)
missing_list_frame.rowconfigure(0, weight=1)

missing_scrollbar = ttk.Scrollbar(
    missing_list_frame,
    orient="vertical"
)
missing_scrollbar.grid(row=0, column=1, sticky="ns")

missing_listbox = tk.Listbox(
    missing_list_frame,
    yscrollcommand=missing_scrollbar.set,
    exportselection=False
)
missing_listbox.grid(row=0, column=0, sticky="nsew")

missing_scrollbar.config(
    command=missing_listbox.yview
)

for species in missing:
    missing_listbox.insert(tk.END, species)


# ---------------------------------------------------------------------
# Right side: recording editor
# ---------------------------------------------------------------------

right_frame = ttk.Frame(root, padding=10)
right_frame.grid(row=0, column=1, sticky="nsew")

right_frame.columnconfigure(1, weight=1)
right_frame.rowconfigure(3, weight=1)


selected_species_label = ttk.Label(
    right_frame,
    text="Select a species",
    font=("TkDefaultFont", 11, "bold")
)
selected_species_label.grid(
    row=0,
    column=0,
    columnspan=2,
    pady=(0, 10),
    sticky="w"
)


recording_label = ttk.Label(
    right_frame,
    text="Recordings"
)
recording_label.grid(
    row=1,
    column=0,
    columnspan=2,
    sticky="w"
)


recording_list_frame = ttk.Frame(right_frame)
recording_list_frame.grid(
    row=2,
    column=0,
    columnspan=2,
    pady=(5, 15),
    sticky="nsew"
)

recording_list_frame.columnconfigure(0, weight=1)
recording_list_frame.rowconfigure(0, weight=1)

recording_scrollbar = ttk.Scrollbar(
    recording_list_frame,
    orient="vertical"
)
recording_scrollbar.grid(row=0, column=1, sticky="ns")

recording_listbox = tk.Listbox(
    recording_list_frame,
    yscrollcommand=recording_scrollbar.set,
    height=8,
    exportselection=False
)
recording_listbox.grid(row=0, column=0, sticky="nsew")

recording_scrollbar.config(command=recording_listbox.yview)


# ---------------------------------------------------------------------
# Recording form
# ---------------------------------------------------------------------

form_frame = ttk.Frame(right_frame)
form_frame.grid(
    row=3,
    column=0,
    columnspan=2,
    sticky="new"
)

form_frame.columnconfigure(1, weight=1)


recording_number_label = ttk.Label(
    form_frame,
    text="Recording number:"
)
recording_number_label.grid(
    row=0,
    column=0,
    padx=(0, 8),
    pady=5,
    sticky="w"
)

recording_number_var = tk.StringVar()

recording_number_entry = ttk.Entry(
    form_frame,
    textvariable=recording_number_var
)
recording_number_entry.grid(
    row=0,
    column=1,
    pady=5,
    sticky="ew"
)


recorder_label = ttk.Label(
    form_frame,
    text="Recorder:"
)
recorder_label.grid(
    row=1,
    column=0,
    padx=(0, 8),
    pady=5,
    sticky="w"
)

recorder_var = tk.StringVar()

recorder_entry = ttk.Combobox(
    form_frame,
    textvariable=recorder_var,
    values=sorted(recorders),
    state="normal"
)
recorder_entry.grid(
    row=1,
    column=1,
    pady=5,
    sticky="ew"
)

def autocomplete_recorder(event):
    typed_text = recorder_var.get().lower()

    matching_recorders = [
        recorder
        for recorder in sorted(recorders)
        if typed_text in recorder.lower()
    ]

    recorder_entry["values"] = matching_recorders


recorder_entry.bind(
    "<KeyRelease>",
    autocomplete_recorder
)

# ---------------------------------------------------------------------
# Buttons
# ---------------------------------------------------------------------


def open_recording_webpage():
    selection = recording_listbox.curselection()

    if not selection or current_species is None:
        messagebox.showerror(
            "No recording selected",
            "Select a recording first."
        )
        return

    recordings = species_objects[current_species].get(
        "recordings",
        []
    )

    recording = recordings[selection[0]]

    if isinstance(recording, str):
        url = recording
    else:
        url = recording.get("url", "")

    recording_number = get_recording_number(url)

    if recording_number is None:
        messagebox.showerror(
            "Invalid recording URL",
            "The selected recording does not have a valid "
            "Xeno-Canto URL."
        )
        return

    webpage_url = (
        f"https://xeno-canto.org/{recording_number}"
    )

    webbrowser.open(webpage_url)

def search_species():
    if current_species is None:
        messagebox.showerror(
            "No species selected",
            "Select a species first."
        )
        return

    search_url = (
        "https://xeno-canto.org/explore"
        f"?query=sp:%22{current_species}%22"
    )

    webbrowser.open(search_url)

button_frame = ttk.Frame(right_frame)
button_frame.grid(
    row=4,
    column=0,
    columnspan=2,
    pady=(15, 0),
    sticky="ew"
)

button_frame.columnconfigure(0, weight=1)
button_frame.columnconfigure(1, weight=1)
button_frame.columnconfigure(2, weight=1)


update_button = ttk.Button(
    button_frame,
    text="Update recording"
)
update_button.grid(
    row=0,
    column=0,
    padx=(0, 5),
    sticky="ew"
)


add_button = ttk.Button(
    button_frame,
    text="Add new recording"
)
add_button.grid(
    row=0,
    column=1,
    padx=5,
    sticky="ew"
)

open_button = ttk.Button(
    button_frame,
    text="Open web page",
    command=open_recording_webpage
)
open_button.grid(
    row=0,
    column=2,
    padx=(5, 0),
    sticky="ew"
)

search_species_button = ttk.Button(
    right_frame,
    text="Search Species",
    command=search_species
)
search_species_button.grid(
    row=5,
    column=0,
    columnspan=2,
    pady=(10, 0),
    sticky="ew"
)

save_button = ttk.Button(
    right_frame,
    text="Save JSON file"
)
save_button.grid(
    row=6,
    column=0,
    columnspan=2,
    pady=(15, 0),
    sticky="ew"
)


current_species = None


# ---------------------------------------------------------------------
# Functions
# ---------------------------------------------------------------------

def get_recording_number(url):
    match = re.fullmatch(
        r"https://xeno-canto\.org/(\d+)/download",
        url.strip()
    )

    if match:
        return match.group(1)

    return None


def display_recording(recording):
    """
    Load either the old string format or the newer dictionary format.
    Old URL-only recordings can be viewed, but saving them requires
    entering a recorder name.
    """
    if isinstance(recording, str):
        url = recording
        recorder = ""
    else:
        url = recording.get("url", "")
        recorder = recording.get("rec", "")

    recording_number = get_recording_number(url)

    recording_number_var.set(recording_number or "")
    recorder_var.set(recorder)


def refresh_recording_list(select_index=None):
    recording_listbox.delete(0, tk.END)

    if current_species is None:
        return

    recordings = species_objects[current_species].get(
        "recordings",
        []
    )

    for index, recording in enumerate(recordings, start=1):
        if isinstance(recording, str):
            text = f"{index}: {recording} [old format]"
        else:
            url = recording.get("url", "")
            recorder = recording.get("rec", "")
            text = f"{index}: {url} ({recorder})"

        recording_listbox.insert(tk.END, text)

    if select_index is not None and recordings:
        select_index = min(select_index, len(recordings) - 1)

        recording_listbox.selection_set(select_index)
        recording_listbox.activate(select_index)
        recording_listbox.see(select_index)

        display_recording(recordings[select_index])


def select_species(species):
    global current_species

    current_species = species
    selected_species_label.config(text=species)

    recording_number_var.set("")
    recorder_var.set("")

    refresh_recording_list()


def species_list_selected(event):
    listbox = event.widget
    selection = listbox.curselection()

    if selection:
        species = listbox.get(selection[0])
        select_species(species)


def recording_selected(event):
    selection = recording_listbox.curselection()

    if not selection or current_species is None:
        return

    recordings = species_objects[current_species].get(
        "recordings",
        []
    )

    display_recording(recordings[selection[0]])


def validate_recording():
    if current_species is None:
        messagebox.showerror(
            "No species selected",
            "Select a species before editing recordings."
        )
        return None

    recording_number = recording_number_var.get().strip()
    recorder = recorder_var.get().strip()

    if not recording_number.isdigit():
        messagebox.showerror(
            "Invalid recording number",
            "The recording number must contain digits only."
        )
        return None

    if not recorder:
        messagebox.showerror(
            "Missing recorder",
            "A recorder name is required."
        )
        return None

    url = (
        f"https://xeno-canto.org/"
        f"{recording_number}/download"
    )

    return {
        "url": url,
        "rec": recorder
    }


def update_recording():
    global unsaved_changes

    recording = validate_recording()

    if recording is None:
        return

    selection = recording_listbox.curselection()

    if not selection:
        messagebox.showerror(
            "No recording selected",
            "Select a recording to update."
        )
        return

    recordings = species_objects[current_species].setdefault(
        "recordings",
        []
    )

    recordings[selection[0]] = recording
    unsaved_changes = True

    refresh_recording_list(selection[0])

    #messagebox.showinfo(
    #    "Recording updated",
    #    "The recording was updated in memory.\n\n"
    #    "Click 'Save JSON file' to write the changes to disk."
    #)


def add_new_recording():
    global unsaved_changes

    recording = validate_recording()

    if recording is None:
        return

    recordings = species_objects[current_species].setdefault(
        "recordings",
        []
    )

    recordings.append(recording)
    unsaved_changes = True

    refresh_recording_list(len(recordings) - 1)

    #messagebox.showinfo(
    #    "Recording added",
    #    "The recording was added in memory.\n\n"
    #    "Click 'Save JSON file' to write the changes to disk."
    #)


def save_json():
    global unsaved_changes

    try:
        with open(DATA, "w", encoding="utf-8") as f:
            json.dump(
                data,
                f,
                indent=4,
                ensure_ascii=False
            )

        unsaved_changes = False

        messagebox.showinfo(
            "Saved",
            f"Changes were saved to {DATA}."
        )

    except OSError as error:
        messagebox.showerror(
            "Save error",
            f"Could not save {DATA}:\n\n{error}"
        )

def close_program():
    if not unsaved_changes:
        root.destroy()
        return

    result = messagebox.askyesnocancel(
        "Unsaved changes",
        "You have unsaved changes.\n\n"
        "Would you like to save before closing?"
    )

    if result is True:
        save_json()

        # Only close if saving succeeded.
        if not unsaved_changes:
            root.destroy()

    elif result is False:
        root.destroy()

# ---------------------------------------------------------------------
# Bind events and start the GUI
# ---------------------------------------------------------------------

correct_listbox.bind(
    "<<ListboxSelect>>",
    species_list_selected
)

url_listbox.bind(
    "<<ListboxSelect>>",
    species_list_selected
)

missing_listbox.bind(
    "<<ListboxSelect>>",
    species_list_selected
)

recording_listbox.bind(
    "<<ListboxSelect>>",
    recording_selected
)

update_button.config(command=update_recording)
add_button.config(command=add_new_recording)
save_button.config(command=save_json)

root.protocol(
    "WM_DELETE_WINDOW",
    close_program
)

root.mainloop()
