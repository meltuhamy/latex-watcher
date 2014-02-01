latex-watcher
=============

A (very) simple latex file watcher to auto-compile tex files.

Usage
-----

1. You will need [node.js](http://nodejs.org/download/)
2. Copy ```watch.js``` and ```package.json``` into your latex project folder, where your main ```.tex``` file is.
3. In your latex project folder, install node dependencies by running ```npm install```.
4. Start the watcher script by running ```node watch.js```. Check options below:

Options
-------

    -c, --command  list of commands to run. e.g latex,bibtex,pdflatex  [required]  [default: "pdflatex"]
    -t, --tex      tex file to compile on changes                      [required]
    -b, --bib      bib file used (required if bibtex is used)        

The currently allowed commands are:
- latex
- pdflatex
- bibtex


Example
-------
The command below compiles the ```main.tex``` file with latex, then bibtex (using ```main.bib```), then latex again, then pdflatex every time any .tex files are changed, added or removed.

    ❯ node watch.js -c latex,bibtex,latex,pdflatex -t main -b main
    Watching
    latex ✓
    bibtex ✓
    latex ✓
    pdflatex ✓


Notes
-----
Installing dependencies will create a node_modules folder. You can add this to your .gitignore to avoid it being versioned if you wish.

The project uses [gaze](https://github.com/shama/gaze) for file watching and [optimist](https://github.com/substack/node-optimist) for awesome command-line argument stuff.

I've only tested and implemented this based on my own personal use. It currently works for me with Linux and OSX.