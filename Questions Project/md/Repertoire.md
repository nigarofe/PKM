# Repertoire of things 
Make table update smoother

Add question

Filters

Time slider (In a way that I can see the table as if I were 10 days on the past, 12 days, etc), so I can get a better grasp of my progress

User preferences (autoSaveEnabled, displayOptions, etc) on the .csv

Separate script.js and server.js in a way that the processing of the .csv is made entirely server.js. 




# Design choices
This application design choices prioritize development simplicity.
Spending time making this application more secure or performing goes against this project's goals at this moment.

## Compartimentalization
The idea is to create black boxes: I shouldn't need to understand what each file of the code base does. I should actively hide what I'm not going to interact with so it doesn't load on my own working memory.

## File structure
main.js
questions.csv
matrixManipulation.js

UI
    index.html
    style.css
    ui.js
Server
    server.js
    other node.js stuff
