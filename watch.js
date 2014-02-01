var gaze = require('gaze'),
    sys   = require('sys'),
    spawn = require('child_process').spawn,
    argv = require('optimist')
           .usage('Watch latex files and compile them.\nUsage: $0')
           .demand('c')
           .alias('c', 'command')
           .describe('c', 'list of commands to run. e.g latex,bibtex,pdflatex')
           .demand('t')
           .alias('t', 'tex')
           .describe('t', 'tex file to compile on changes')
           .alias('b','bib')
           .describe('b', 'bib file used (required if bibtex is used)')
           .default('c', 'pdflatex').argv,
    texName = argv.t,
    bibName = argv.bib,
    commands = argv.c,

    compileBibtex = function(cb){
      process.stdout.write('bibtex ');
      var bibtex      = spawn('bibtex', [bibName]);
      bibtex.on('exit', function (code) {
        process.stdout.write((code==0 ? '✓' : '×') + '\n');
        if(cb != undefined) cb();
      });
    },

    displayErrors = function(cb){
      //grep -n -A 1 ^! main.log
      var logfilename = texName.split("/").pop().split('.')[0];
      var grep = spawn('grep', ['-n', '-A', '1', '^!', logfilename+'.log']);
      grep.stdout.pipe(process.stdout);
      grep.on('exit', function(code){
        if(cb!=undefined) cb();
      });
    },

    compileLatex = function(cb){
      process.stdout.write('latex ');
      var latex      = spawn('latex', ['-interaction=nonstopmode',texName]);
      latex.on('exit', function (code) {
        process.stdout.write((code==0 ? '✓' : '×') + '\n');
        if(code != 0){
          displayErrors(cb);
        } else if(cb != undefined) cb();
      });
    },

    compilePDFLatex = function(cb){
      process.stdout.write('pdflatex ');
      var pdflatex      = spawn('pdflatex', ['-interaction=nonstopmode',texName]);
      pdflatex.on('exit', function (code) {
        process.stdout.write((code==0 ? '✓' : '×') + '\n');
        if(code != 0){
          displayErrors(cb);
        } else if(cb != undefined) cb();
      });
    },

    getCommandChain = function(csvCommands, start, end){
      var commands = csvCommands.split(',');


      var getNextCallback = function(i){
        // console.log("Genenerating "+i+": "+commands[i]);
        if(i < commands.length){
          if(commands[i] === 'latex'){
            return function(){
              compileLatex(getNextCallback(i+1));
            };
          } else if (commands[i] === 'pdflatex') {
            return function(){
              compilePDFLatex(getNextCallback(i+1));
            };
          } else if (commands[i] === 'bibtex') {
            return function(){
              compileBibtex(getNextCallback(i+1));
            };
          }
        } else {
          // do this in the NEXT callback!
          if(end!=undefined) end();
        }
      };

      return function(){
        if(start!=undefined) start();
        getNextCallback(0)();
      };
    },

    compileAll = getCommandChain(commands);

console.log("Watching");
// compile first now.
compileAll();

// Watch all .tex files/dirs in process.cwd()
gaze(['**/*.tex', '**/*.bib'], function(err, watcher) {

  // On changed/added/deleted
  this.on('all', function(event, filepath) {
    console.log(filepath + ' was ' + event);
    compileAll();
  });

});
