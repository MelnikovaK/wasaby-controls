'use strict';
const helpers = require('./helpers'),
    fs = require('fs'),
    ProgressBar = require('progress'),
    path = require('path'),
    humanize = require('humanize'),
    less = require('less'),
    getModuleNameRegExp = new RegExp('\/resources\/([^/]+)'),
    DEFAULT_THEME = 'online',
    themes = ['online', 'carrynew', 'prestonew'];
    let errors = [];

/**
 @workaround Временно ресолвим текущую тему по названию модуля.
*/
function resolveThemeName(filepath) {

    let regexpMathch = filepath.match(getModuleNameRegExp, ''),
        s3modName = regexpMathch ? regexpMathch[1] : 'smth';

    switch (s3modName) {
        case 'Upravlenie_oblakom':
            return 'cloud';
          case 'Presto':
              return 'presto';
        case 'sbis.ru':
            return 'sbisru';
        case 'Retail':
            return 'carry';
        default:
            return 'online';
    }
}

function itIsControl(path) {
  return ~path.indexOf('components');
}

module.exports = function less1by1Task(grunt) {
  let root = grunt.option('root') || '',
      app = grunt.option('application') || '',
      rootPath = path.join(root, app),
      themesPath = path.join(rootPath, './themes/');

  function processLessFile(data, filePath, error, theme, itIsControl) {

      let lessData = data.toString(),
        imports = theme ?
        `
            @import '${themesPath}${theme}/variables';
            @import '${themesPath}mixins';
            @themeName: ${theme};

            ` : '';

    less.render(imports + lessData, {
        filename: filePath,
        cleancss: false,
        relativeUrls: true,
        strictImports: true
    }, function writeCSS(compileLessError, output) {

        if (compileLessError) {
            errors.push(`\n\n ${compileLessError.message} in file: ${compileLessError.filename} on line: ${compileLessError.line}`);
        }

        let suffix = '';

        if (itIsControl) {
          suffix = ( theme === DEFAULT_THEME ) ? '' : `__${theme}`;
        }

        let newName = `${path.dirname(filePath)}/${path.basename(filePath, '.less')}${suffix}.css`;

        if (output) {
            fs.writeFile(newName, output.css, function writeFileCb(writeFileError) {
                if (writeFileError) {
                  errors.push(`\n\n Не могу записать файл. Ошибка: ${writeFileError.message}.`);
                }
               // grunt.log.ok(`file ${filePath} successfuly compiled. Theme: ${theme}`);
            });
        }
    });
  }

    grunt.registerMultiTask('less1by1', 'Компилит каждую лесску, ложит cssку рядом. Умеет в темы', function() {

        let lessName = grunt.option('name')||'*',
            foundFile = false;

        grunt.log.ok(`\n\n ${humanize.date('H:i:s')} : Запускается задача less1by1.`);

        if (lessName !== '*') {
            grunt.log.ok(`Ищем файл: ${lessName}.less`);
        }
        let taskDone = this.async();
          var bar = new ProgressBar('  compiling [:bar] :file', {
            complete: '♥',
            incomplete: '_',
            width: 30,
            total: 134
        });
        helpers.recurse(rootPath, function(filepath, cb) {
          let relpath = path.relative(rootPath, filepath);
          if (helpers.validateFile(relpath, [grunt.config.get('changed') || `components/**/${lessName}.less`])
              || helpers.validateFile(relpath, [grunt.config.get('changed') || `themes/**/${lessName}.less`])
               || helpers.validateFile(relpath, [grunt.config.get('changed') || `demo/**/${lessName}.less`])) {
                foundFile = true;
                fs.readFile(filepath, function readFileCb(readFileError, data) {
                  let theme = resolveThemeName(filepath);
                    if (itIsControl(filepath)) {
                            bar.tick(1, {

                                "file": filepath
                            });

                      for (let themeName of themes) {
                        processLessFile(data, filepath, readFileError, themeName, true);
                      }
                    }
                    else {
                       if (!~filepath.indexOf('theme.less')) {
                          processLessFile(data, filepath, readFileError, theme, false);
                       }
                    }
                });
            }
            cb();
        }, function() {

            if(!foundFile) {
                grunt.log.ok(`Файл не найден!`);
            }
            grunt.log.ok(`${humanize.date('H:i:s')} : Задача less1by1 выполнена.`);
            errors.forEach((err) => {
                grunt.log.error(err);
            });
            errors = [];
            taskDone();
        });
    });
};
