from tkinter import *
from PIL.ImageTk import PhotoImage
from PIL import Image
import json

with open('birds.json','r',encoding='utf8') as bird_file:
    bird_data = json.load(bird_file)

def nothing_here():
    global window
    popup = Toplevel(window)
    popup.title("Browse Birds")
    Label(popup, text="Nothing Here Yet.", font=("Helvetica",14), bd=25).pack()

    subframe = Frame(popup, bd=15)
    subframe.pack()

    Button(subframe, text="Ok", width=20, bd=3, command=lambda:popup.destroy()).pack()
    pass

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
Button(mainframe, text="Add Bird", width=50, bd=3).pack()
Button(mainframe, text="Save & Exit", width=50, bd=3, command=lambda:window.destroy()).pack()

# show the window
window.mainloop()
