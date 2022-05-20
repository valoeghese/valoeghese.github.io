from tkinter import *
from PIL.ImageTk import PhotoImage
from PIL import Image
import json

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
            genuses[genus] = family_data[genus]

def add_bird(popup, common_name_e, scientific_name_e, region, cleaner, size_e):
    common_name = common_name_e.get().lower()
    scientific_name = scientific_name_e.get().lower()
    size = size_e.get().lower()
    
    if common_name and scientific_name and region and size:
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
        json.dump(bird_data, bird_file, indent=4)

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
        
        del bird_regions[:]
        rfinner[0].destroy()
        rfinner[0] = Frame(rfwrapper, bd=5)
        rfinner[0].pack()
        region.set("Palearctic")
        initialise_region_frame(rfinner[0])
    
    def add_bird_():
        bird_regions.append(region.get().lower())
        add_bird(popup, name_entry, sci_entry, bird_regions[0] if len(bird_regions) == 1 else bird_regions.copy(), cleaner, size_entry)

    Button(subframe, text="Add Bird", width=20, bd=3, command=add_bird_).pack()
    Button(subframe, text="Exit", width=20, bd=3, command=lambda:close(popup)).pack()

def save_and_exit(window):
    save()
    window.destroy()

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

Button(mainframe, text="Browse Birds", width=50, bd=3, command=nothing_here).pack()
Button(mainframe, text="Add Bird", width=50, bd=3, command=add_bird_form).pack()

Frame(mainframe, height=10).pack()

Button(mainframe, text="Save & Exit", width=50, bd=3, command=lambda:save_and_exit(window)).pack()

# show the window
window.mainloop()
