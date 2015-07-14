# UNIT-тесты платформенных компонентов

## Запуск через браузер

`http://localhost:666/test/unit-webdriver.html`

## Запуск из командной строки через Selenium webdriver
1. Установить selenium-standalone и webdriverio:

    a) Добавить в PATH путь к бинарникам Java (если его еще там нет, требуется для запуска selenium standalone server): `https://java.com/en/download/help/path.xml`

    б) Выполнить в консоли (в корневой папке репозитория):

        npm install selenium-standalone
        node node_modules/selenium-standalone/bin/selenium-standalone install
        npm install webdriverio

2. Выполнить в консоли (в корневой папке репозитория), предварительно запустив http-сервер (`grunt run`):

        node test/unit-webdriver.run

При добавлении новых тестов их список можно построить заново:

    node test/list.build

## Запуск из командной строки через node в изолированном режиме
Выполнить в консоли (в корневой папке репозитория):

    mocha -t 10000 test/unit-isolated.run

или в формате XUnit:

    mocha -t 10000 -R XUnit test/unit-isolated.run

## Отчет о покрытии
Выполнить в консоли (в корневой папке репозитория):

    node test/jscoverage.run

Результаты можно смотреть тут:
`http://localhost:666/test/jscoverage-report/jscoverage.html`

## Команды Grunt
- `grunt tests` - прогнать unit тесты и тест покрытия;
- `grunt tests-run-webdriver` - прогнать unit тесты через webdriver;
- `grunt tests-run-isolated` - прогнать unit тесты изолированно;
- `grunt tests-run-coverage` - прогнать тест покрытия через webdriver;
- `grunt tests-list-build` - пересобрать список тестов для webdriver.


# Jenkins
Настройки сборки в Jenkins

## Управление исходным кодом
✓ Multiple SCMs

    +GIT:

        Repository URL: git@git.sbis.ru:root/sbis3-controls.git

        Credentials: gitread

        Branches to build: */master

        Additional Behaviours:

            +Advanced clone behaviours

                ✓ Shallow clone

    +GIT:

        Repository URL: git@git.sbis.ru:root/sbis3-ws.git

        Credentials: gitread

        Branches to build: */master

        Additional Behaviours:

            +Advanced clone behaviours

                ✓ Shallow clone


            +Check out to a sub-directory:
                Local subdirectory for repo: sbis3-ws

## Среда сборки
✓ Inject environment variables to the build process

    Properties Content:
    TEST_ENV=build

Также могут оказаться полезными:

`UNIT_WEBDRIVER_url_host` - хост, на котором запущен http server

`WEBDRIVER_manual` - запускать локальный Selenium server вручную (или использовать готовый)

`WEBDRIVER_remote_host` - хост, на котором запущен Selenium server

`WEBDRIVER_remote_port` - порт, на котором запущен Selenium server

`WEBDRIVER_remote_desiredCapabilities_browserName` - браузер, в котором будут проводится тесты

`WEBDRIVER_remote_desiredCapabilities_version` - версия бразузера, в которой будут проводится тесты

`JSCOVERAGE_params_port` - порт, на котором будет запущен jscoverage server

`JSCOVERAGE_webdriver_host` - хост, на который будет обращаться webdriver за отчетом jscoverage


✓ Abort the build if it's stuck

    Timeout minutes: 10
    Time-out actions: Abort the build

## Сборка
+Выполнить команду Windows

    call npm install
    call npm install grunt-cli

    rem [if Node.js version installed < 10]
    if not exist test\bin\nodejs\node.exe "C:\Program Files\7-Zip\7z" x test\bin\nodejs.zip -y -otest\bin
    SET PATH=%WORKSPACE%\test\bin\nodejs;%PATH%
    rem [/if Node.js version installed < 10]

    node "node_modules/grunt-cli/bin/grunt" tests

## Послесборочные операции
Publish JUnit test result report

    XML файлы с отчетами о тестировани: test/xunit-report.xml

    ✓ Retain long standard output/error

Publish documents

    Title: Отчет о покрытии

    Directory to archive: test/jscoverage-report/

    Index file: jscoverage.html
