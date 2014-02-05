latex-watcher
=============

A (very) simple latex file watcher to auto-compile tex files.

Usage
-----

1. You will need [node.js](http://nodejs.org/download/) version >= 0.8 (check with ```node -v```).
2. Install latex-watcher using npm: ```npm install -g latex-watcher```
3. Run ```latex-watcher``` from your latex project directory. Check options below:

Options
-------

    -c, --command  list of commands to run. e.g latex,bibtex,pdflatex  [required]  [default: "pdflatex"]
    -t, --tex      tex file to compile on changes                      [required]
    -b, --bib      bib file used (required if bibtex is used)

The currently allowed commands are:
- latex
- pdflatex
- bibtex
- cleanup (removes temporary latex files after compilation)

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

The project uses [gaze](https://github.com/shama/gaze) for file watching, [colors](https://github.com/Marak/colors.js) for, er... colors, and [optimist](https://github.com/substack/node-optimist) for awesome command-line argument stuff.

I've only tested and implemented this based on my own personal use. It currently works for me with Linux and OSX.