# Платформенные визуальные компоненты

## Окружение разработки

1. Клонировать репозиторий с контролами `sbis3-controls`:

		git clone git@git.sbis.ru:root/sbis3-controls.git /path/to/sbis3-controls

2. Клонировать репозиторий `sbis3-ws` в поддиректорию `sbis3-ws`:

        git clone git@git.sbis.ru:root/sbis3-ws.git /path/to/sbis3-controls/sbis3-ws

3. Установить [Node.js](http://nodejs.org/) и [NPM](http://npmjs.com).

4. Установить глобально интерфейс командной строки [Grunt.js](http://gruntjs.com):

        npm install -g grunt-cli

5. Из корневой директории репозитория установить пакеты, требуемые для разработки:

        npm install

6. Собрать проект:

        grunt

## Команды Grunt



- `grunt` или `grunt build` (по умолчанию) - полностью собрать проект;
- `grunt rebuild` - пересобрать проект, предварительно удалив предыдущую сборку;
- `grunt clean` - удалить текущую сборку проекта;
- `grunt build-dependencies` - построить файлы `contents.js` и `contents.json` зависимостей модулей;
- `grunt js` - провести статический анализ JS-кода (минификация JS-кода в будущем, если потребуется);
- `grunt css` - скомпилировать все темы LESS в CSS;
- `grunt css --theme=<theme>` - скомпилировать тему LESS с именем `<theme>` в CSS (опция `--theme` может быть
также передана и в составные команды Grunt, использующие команду `grunt css`, например: `grunt --theme=<theme>`);
- `grunt copy` - скопировать директории `components` и `themes` в директорию `SBIS3.CONTROLS`;
- `grunt watch` - следить за изменениями в LESS файлах тем и перекомпилировать их;
- `grunt run` - собрать проект, поднять тестовый локальный веб-сервер на 666-м порту и запустить `watch`.