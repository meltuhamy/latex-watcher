var gaze = require('gaze'),
    sys   = require('sys'),
    spawn = require('child_process').spawn,

    compileBibtex = function(cb){
      var bibtex      = spawn('bibtex', ['main']);
      bibtex.on('exit', function (code) {
        if(code != 0){
          console.error("bibtex exited with error " + code);
        }
        if(cb != undefined) cb();
      });
    },

    displayErrors = function(){
      //grep -n -A 1 ^! main.log
      var grep = spawn('grep', ['-n', '-A', '1', '^!', 'main.log']);
      grep.stdout.pipe(process.stdout);
    },

    compileLatex = function(cb){
      var pdflatex      = spawn('pdflatex', ['-interaction=nonstopmode','main']);
      pdflatex.on('exit', function (code) {
        if(code != 0){
          console.error("pdflatex exited with error " + code);
          displayErrors();
        } else if(cb != undefined) cb();
      });
    },

    compileAll = function(cb){
      console.log("Compiling...");
      compileLatex(function(){
        compileBibtex(function(){
          compileLatex(function(){
            compileLatex(function(){
              console.log("Done.");
            });
          });
        });
      });
    };

// compile first now.
compileAll();

// Watch all .tex files/dirs in process.cwd()
gaze(['**/*.tex', '**/*.bib'], function(err, watcher) {

  console.log("Watching")

  // On changed/added/deleted
  this.on('all', function(event, filepath) {
    console.log(filepath + ' was ' + event);
    compileAll();
  });

});
