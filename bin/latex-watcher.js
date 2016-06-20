#!/usr/bin/env node
/*
The MIT License (MIT)

Copyright (c) 2014 Mohamed Eltuhamy

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
var gaze = require('gaze'),
    sys   = require('sys'),
    spawn = require('child_process').spawn,
    colors = require('colors'),
    fs = require('fs'),
    argv = require('optimist')
           .usage('Watch latex files and compile them.\nUsage: $0')
           .demand('c')
           .alias('c', 'command')
           .describe('c', 'list of commands to run. e.g latex,bibtex,pdflatex,cleanup')
           .demand('t')
           .alias('t', 'tex')
           .describe('t', 'tex file to compile on changes')
           .describe('once', 'only run the commands once (no watching)')
           .describe('shell-escape', 'invoke pdflatex with shell-escape')
           .alias('e', 'shell-escape')
           .describe('endings', 'additional filendings to watch')
           .describe('subfolders', 'additional subfolders to watch')
           .default('c', 'pdflatex').argv,
    texName = argv.t,
    commands = argv.c

    tempFiles = ['.blg','.bbl','.aux','.log','.brf','.nlo','.out','.dvi','.ps',
      '.lof','.toc','.fls','.fdb_latexmk','.pdfsync','.synctex.gz','.ind','.ilg','.idx']
      .map(function(extension) {
        return texName + extension;
      }),

    lastError = '',
    displayErrors = function(cb){
      //grep -n -A 1 ^! main.log
      var logfilename = texName.split("/").pop().split('.')[0];
      var grep = spawn('grep', ['-A', '1', '^!', logfilename+'.log']);

      grep.stdout.on('data', function(data) {
        var errorString = data.toString();
        if(errorString != '' && errorString != lastError){
          lastError = errorString;
          console.error("  "+lastError.replace("\n","\n  ").grey);
        }
      });
      // grep.stdout.pipe(process.stdout);
      grep.on('exit', function(code){
        if(cb!=undefined) cb();
      });


    },

    compileLatex = function(cb){
      process.stdout.write('  » latex');
      var args = ['-interaction=nonstopmode']
      if (argv.e) {
        args.push('-shell-escape')
      }
      args.push(texName)
      var latex      = spawn('latex', args);
      latex.on('exit', function (code) {
        process.stdout.write((code==0 ? '\r  ✓ latex'.green : '\r  × latex'.red) + '\n');
        if(code != 0){
          displayErrors(cb);
        } else if(cb != undefined) cb();
      });
    },

    compilePDFLatex = function(cb){
      process.stdout.write('  » pdflatex');
      var args = ['-interaction=nonstopmode']
      if (argv.e) {
        args.push('-shell-escape')
      }
      args.push(texName)
      var pdflatex      = spawn('pdflatex', args);
      pdflatex.on('exit', function (code) {
        process.stdout.write((code==0 ? '\r  ✓ pdflatex'.green : '\r  × pdflatex'.red) + '\n');
        if(code != 0){
          displayErrors(cb);
        } else if(cb != undefined) cb();
      });
    },

    compileBibtex = function(cb){
      process.stdout.write('  » bibtex');
      var bibtex      = spawn('bibtex', [texName]);
      bibtex.on('exit', function (code) {
        process.stdout.write((code==0 ? '\r  ✓ bibtex'.green : '\r  × bibtex'.red) + '\n');
        if(cb != undefined) cb();
      });
    },

    cleanUp = function(cb){
      process.stdout.write('  » cleanup');
      tempFiles.forEach(function(file) {
        fs.existsSync(file) && fs.unlink(file);
      });
      process.stdout.write('\r  ✓ cleanup'.green + '\n');
      if(cb != undefined) cb();
    },

    exit = function(){
      if(lastError){
        process.exit(code=1);
      } else {
        process.exit(code=0);
      }
    },

    getCommandChain = function(csvCommands, start, end){
      var commands = csvCommands.split(',');
      var cmdMap = {
        latex: compileLatex,
        pdflatex: compilePDFLatex,
        bibtex: compileBibtex,
        cleanup: cleanUp,
        exit: exit
      };

      var getNextCallback = function(i){
        if(i < commands.length){
          if (commands[i] in cmdMap){
            return function(){
              cmdMap[commands[i]](getNextCallback(i+1));
            };
          }
        } else {
          // do this in the NEXT callback!
          if(end!=undefined) return end;
        }
      };

      return function(){
        if(start!=undefined) start();
        getNextCallback(0)();
      };
    },
    cwd = process.cwd(),
    compileAll = function(event, filepath){
      lastError='';
      var d = new Date(), h = d.getHours(), m = d.getMinutes(), s = d.getSeconds(),
          timeString = (h<10?'0':'')+h+":"+(m<10?'0':'')+m+":"+(s<10?'0':'')+s,
          filePath = filepath != undefined ? '.'+filepath.split(cwd).pop() : '';
      if(event != undefined){
        console.log(("\n» "+filePath+" "+event+" at "+timeString).yellow);
      } else {
        console.log("» Compiling".yellow);
      }
      getCommandChain(commands)();
    };


if(!argv.once) {
  compileAll();
  // Watch all .tex files/dirs in process.cwd()

  var watchEndings = argv.endings ?
    argv.endings.split(',').map(function(ending) { return '**/*.' + ending }) :
    [];
  var watchDirectories = argv.subfolders ? 
    argv.subfolders.split(',').map(function(subfolder) { return subfolder + '/**/*' }) : 
    [];

  var watchPaths = ['**/*.tex', '**/*.bib']
    .concat(watchEndings)
    .concat(watchDirectories)

  gaze(watchPaths, function(err, watcher) {
    this.on('all', compileAll);
  });
} else {
  commands = commands.concat(',exit');
  compileAll();
}