from tkinter import *
from PIL.ImageTk import PhotoImage
from PIL import Image
import json
import subprocess
import sys
from pathlib import Path

regions = [
    "Palearctic",
    "Indomalayan",
    "Afrotropical",
    "Nearctic",
    "Neotropical",
    "Australasia",
    "Oceanian",
    "Antarctic"
]

# data stuff

with open('birds.json','r',encoding='utf8') as bird_file:
    bird_data = json.load(bird_file)

genuses = {}
families = {}

for order in bird_data["birds"]:
    order_data = bird_data["birds"][order]
    
    for family in order_data:
        family_data = order_data[family]
        families[family] = family_data
        
        for genus in family_data:
            if genus == "name": # ignore this field
                continue
            if genus == "queries":
                continue
            genuses[genus] = family_data[genus]

def add_bird(popup, common_name_e, scientific_name_e, region, recording_e, recording2_e, cleaner, size_e):
    common_name = common_name_e.get().lower()
    scientific_name = scientific_name_e.get().lower()
    size = size_e.get().lower()
    #recording = recording_e.get()
    #recording2 = recording2_e.get()
    
    if common_name and scientific_name and region and size:# and recording and recording2:
        binomial_parts = scientific_name.split(" ", 1)
        data = {"name":common_name, "size":int(size), "region":region}

        if (binomial_parts[0] in genuses):
            print("Bird Data Added:", end=" ")
            print(data) # test
            genuses[binomial_parts[0]][binomial_parts[1]] = data

            # prepare for next bird
            cleaner()
        else:
            add_genus_form(popup, binomial_parts[0], binomial_parts[1], data, cleaner)

def save():
    with open('birds.json', 'w+', encoding='utf8') as bird_file:
        json.dump(bird_data, bird_file, indent=4, ensure_ascii=False)

# gui stuff

def nothing_here():
    global window
    popup = Toplevel(window)
    popup.title("Browse Birds")
    Label(popup, text="Nothing Here Yet.", font=("Helvetica",14), bd=25).pack()

    subframe = Frame(popup, bd=15)
    subframe.pack()

    Button(subframe, text="Ok", width=20, bd=3, command=lambda:popup.destroy()).pack()
    pass

def close(window):
    popup = Toplevel(window)
    popup.title("Are you sure?")
    Label(popup, text="Are you sure you want to exit?", font=("Helvetica",8), bd=25).pack()

    subframe = Frame(popup, bd=5)
    subframe.pack()

    Button(subframe, text="Yes", width=15, bd=3, command=lambda:window.destroy()).grid(row=0,column=0)
    Button(subframe, text="No", width=15, bd=3, command=lambda:popup.destroy()).grid(row=0,column=1)

def add_genus_form(window, genus_name, species, data, cleaner):
    popup = Toplevel(window)
    popup.title("Add Genus")

    subframe = Frame(popup, bd=15)
    subframe.pack()

    Label(subframe, text="Genus Name", bd=5).grid(row=0)
    name_entry = Entry(subframe)
    name_entry.grid(row=0,column=1)
    name_entry.insert(0, genus_name)

    Label(subframe, text="Family", bd=5).grid(row=1)
    family = StringVar()
    family.set("columbidae")

    family_names = list(families.keys())
    family_names.sort()
    
    OptionMenu(subframe, family, *family_names).grid(row=1,column=1)

    subframe = Frame(popup, bd=10)
    subframe.pack()

    def add_genus():
        genus_name_i = name_entry.get().lower()

        if genus_name_i:
            genus = {}
            genus[species] = data
            families[family.get()][genus_name_i] = genus
            genuses[genus_name_i] = genus
            
            cleaner()
            popup.destroy()

    Button(subframe, text="Add Genus", width=20, bd=3, command=add_genus).pack()
    Button(subframe, text="Cancel", width=20, bd=3, command=lambda:popup.destroy()).pack()

# good luck reading this
def add_bird_form():
    global window, regions
    popup = Toplevel(window)
    popup.title("Add a Bird")

    subframe = Frame(popup, bd=15)
    subframe.pack()
    
    Label(subframe, text="Common Name", bd=5).grid(row=0)
    Label(subframe, text="Scientific Name", bd=5).grid(row=1)
    name_entry = Entry(subframe)
    name_entry.grid(row=0,column=1)
    sci_entry = Entry(subframe)
    sci_entry.grid(row=1,column=1)

    Label(subframe, text="Average Size", bd=5).grid(row=2)
    size_entry = Entry(subframe)
    size_entry.grid(row=2,column=1)

    Label(subframe, text="Region", bd=5).grid(row=3)
    rfwrapper = Frame(subframe)
    rfwrapper.grid(row=3,column=1)

    Label(subframe, text="Please add recording URLs with stats.py", bd=5).grid(row=4)
    #recording = Entry(subframe)
    #recording.grid(row=4,column=1)
    #recording2 = Entry(subframe)
    #recording2.grid(row=5,column=1)

    rfinner = []
    rfinner.append(Frame(rfwrapper, bd=5))
    rfinner[0].pack()

    # required in init region frame and outside, so goes here
    bird_regions = []
    region = StringVar()
    region.set("Palearctic")

    def initialise_region_frame(regionframe):
        # Region Section
        other_regions_frame = Frame(regionframe)
        other_regions_frame.pack()
        
        OptionMenu(regionframe, region, *regions).pack()

        killme = []

        def next_region():
            killme[0].destroy()
            Label(other_regions_frame, text=region.get(), bd=5).pack()
            bird_regions.append(region.get().lower())
            killme[0] = Button(regionframe, text="+", command=next_region)
            killme[0].pack()
            region.set("Palearctic")

        killme.append(Button(regionframe, text="+", command=next_region))
        killme[0].pack()

    initialise_region_frame(rfinner[0])

    # Button Bit
    subframe = Frame(popup, bd=10)
    subframe.pack()

    def cleaner():
        name_entry.delete(0,len(name_entry.get()))
        sci_entry.delete(0,len(sci_entry.get()))
        size_entry.delete(0,len(size_entry.get()))
        #recording.delete(0,len(recording.get()))
        #recording2.delete(0,len(recording2.get()))
        
        del bird_regions[:]
        rfinner[0].destroy()
        rfinner[0] = Frame(rfwrapper, bd=5)
        rfinner[0].pack()
        region.set("Palearctic")
        initialise_region_frame(rfinner[0])
    
    def add_bird_():
        bird_regions.append(region.get().lower())
        add_bird(popup, name_entry, sci_entry, bird_regions[0] if len(bird_regions) == 1 else bird_regions.copy(), None, None, cleaner, size_entry)

    Button(subframe, text="Add Bird", width=20, bd=3, command=add_bird_).pack()
    Button(subframe, text="Exit", width=20, bd=3, command=lambda:close(popup)).pack()

def edit_categories_form():
    global window, bird_data
    popup = Toplevel(window)
    popup.title("Edit Categories")
    popup.geometry("600x400")

    subframe = Frame(popup, bd=15)
    subframe.pack(fill="both", expand=True)

    subframe.rowconfigure(1, weight=1)
    subframe.columnconfigure(0, weight=1, uniform="columns")
    subframe.columnconfigure(1, weight=2, uniform="columns")
    
    Label(subframe, text="Collections", bd=5).grid(row=0, column=0, sticky="nsew")
    collection_label = Label(subframe, text="Select a Collection", bd=5)
    collection_label.grid(row=0, column=1, sticky="nsew")

    collection_editor = Frame(subframe)
    collection_editor.grid(row=1,column=1, sticky="nsew")
    
    ## Collection subsubframe Contents ##
    added_list = None
    removed_list = None
    unsorted_list = None
    add_button = None
    remove_button = None
    pend_button = None
    ##############

    collections_list = Listbox(subframe)

    def onselect(event):
        nonlocal added_list, removed_list, unsorted_list
        nonlocal add_button, remove_button, pend_button
        w = event.widget
        # guard against deselect (by focus change)
        if len(w.curselection()) == 0:
            return
        
        index = int(w.curselection()[0])
        value = w.get(index)
        #print('You selected item %d: "%s"' % (index, value))
        collection_label.config(text=value)

        # Find collection
        collection = None
        for item in bird_data["collections"]:
            collection = bird_data["collections"][item]
            if collection["name"] == value:
                break

        # Behaviours
        selected_bird_i = None
        selected_bird = None
        selected_list = None
        def on_bird_select(event):
            nonlocal selected_bird_i, selected_bird, selected_list
            w = event.widget
            if len(w.curselection()) == 0:
                return
            index = int(w.curselection()[0])

            selected_bird_i = index
            selected_bird = w.get(index)
            selected_list = w

        def on_move_button(to_list: Listbox, to_arr: list):
            # filter requests that don't do anything
            if selected_list == to_list:
                return
            # filter no selection
            if selected_bird_i is None:
                return

            # Transfer visually (yes this is not MVC)
            selected_list.delete(selected_bird_i)

            copy_tup = to_list.get(0, END)
            insert_idx = to_list.size()
            for i in range(len(copy_tup)):
                if selected_bird.replace("-", " ") < copy_tup[i].replace("-", " "):
                    insert_idx = i
                    break
            to_list.insert(insert_idx, selected_bird)

            # Transfer actually (it should be same index)
            from_arr = None
            if selected_list == added_list:
                from_arr = collection["species"]
            elif selected_list == unsorted_list:
                from_arr = collection["_unsorted"]
            elif selected_list == removed_list:
                # avoid error
                from_arr = [ selected_bird ]
            
            from_arr.remove(selected_bird)
            to_arr.insert(insert_idx, selected_bird)

        def on_add_button():
            on_move_button(added_list, collection["species"])

        def on_remove_button():
            on_move_button(removed_list, [])

        def on_pend_button():
            on_move_button(unsorted_list, collection["_unsorted"])

        # Update contents of internal listboxes (or add them)
        if added_list is None:
            collection_editor.rowconfigure(0, weight=1)

            added_list = Listbox(collection_editor)
            added_list.grid(row=0, column=0, columnspan=3, sticky="nsew")
            unsorted_list = Listbox(collection_editor)
            unsorted_list.grid(row=2, column=0, rowspan=3, sticky="nsew")
            removed_list = Listbox(collection_editor)
            removed_list.grid(row=2, column=1, rowspan=3, sticky="nsew")

            Label(collection_editor, text="Unsorted").grid(row=1, column=0)
            Label(collection_editor, text="Removed").grid(row=1, column=1)

            add_button = Button(collection_editor, text = "Add", command=on_add_button)
            add_button.grid(row=2, column=2, sticky="nsew")
            remove_button = Button(collection_editor, text = "Remove", command=on_remove_button)
            remove_button.grid(row=3, column=2, sticky="nsew")
            pend_button = Button(collection_editor, text = "Unsort", command=on_pend_button)
            pend_button.grid(row=4, column=2, sticky="nsew")

            added_list.bind('<<ListboxSelect>>', on_bird_select)
            removed_list.bind('<<ListboxSelect>>', on_bird_select)
            unsorted_list.bind('<<ListboxSelect>>', on_bird_select)
        else:
            # update selection
            selected_bird_i = None
            selected_bird = None
            selected_list = None

            added_list.delete(0, END)
            removed_list.delete(0, END)
            unsorted_list.delete(0, END)

        # Add new contents
        all_birds = [species for _, genus in genuses.items() for epithet, species in genus.items() if epithet != "queries"]

        if "_unsorted" not in collection:
            collection["_unsorted"] = []
        unsort_remaining = collection["_unsorted"] == "*"
        
        temp_addlist = []
        temp_removelist = []
        temp_pendlist = []

        for bird in all_birds:
            mode = "UNSORT" if unsort_remaining else "REMOVE"
            names = [ bird["name"] ] if isinstance(bird["name"], str) else bird["name"]
            the_name  = names[0]
            for name in names:
                if name in collection["species"]:
                    mode = "ADD"
                    the_name = name
                    break
                if not unsort_remaining and name in collection["_unsorted"]:
                    mode = "UNSORT"
                    the_name = name
                    break
            
            if mode == "ADD":
                temp_addlist.append(the_name)
            elif mode == "REMOVE":
                temp_removelist.append(the_name)
            else:
                temp_pendlist.append(the_name)

        temp_addlist.sort()
        temp_removelist.sort()
        temp_pendlist.sort()

        i = 0
        for name in temp_addlist:
            added_list.insert(i, name)
            i += 1
        i = 0
        for name in temp_removelist:
            removed_list.insert(i, name)
            i += 1
        i = 0
        for name in temp_pendlist:
            unsorted_list.insert(i, name)
            i += 1

        # expand in the json too
        if unsort_remaining:
            collection["_unsorted"] = temp_pendlist

    i = 1
    for item in bird_data["collections"]:
        collection = bird_data["collections"][item]
        collections_list.insert(i, collection["name"])
        i += 1

    collections_list.grid(row=1,column=0, sticky="nsew")
    collections_list.bind('<<ListboxSelect>>', onselect)

def save_and_exit(window):
    save()
    window.destroy()

def launch_stats():
    here = Path(__file__).resolve().parent
    stats = here / "stats.py"
    subprocess.Popen([sys.executable, str(stats)])

# create window
window = Tk()
img=PhotoImage(Image.open("../assets/valoeghese.png"))

window.iconphoto(True, img)
window.title("Bird Editor")

# add the base widgets to it
title = Label(window, text="Birdle Bird Editor", font=("Helvetica",24), bd=10).pack()

Label(window, image=img).pack()

mainframe = Frame(window, bd=15)
mainframe.pack()

Button(mainframe, text="Browse Birds", width=50, bd=3, command=launch_stats).pack()
Button(mainframe, text="Add Bird", width=50, bd=3, command=add_bird_form).pack()
Button(mainframe, text="Collections Editor", width=50, bd=3, command=edit_categories_form).pack()

Frame(mainframe, height=10).pack()

Button(mainframe, text="Save & Exit", width=50, bd=3, command=lambda:save_and_exit(window)).pack()

# show the window
window.mainloop()
