#!groovy
properties([
    buildDiscarder(
        logRotator(
            artifactDaysToKeepStr: '5',
            artifactNumToKeepStr: '10',
            daysToKeepStr: '5',
            numToKeepStr: '10')),
    parameters([
         string(
            defaultValue: '3.17.100',
            description: 'Версия',
            name: 'version'),
         string(
            defaultValue: 'rc-3.17.100',
            description: '',
            name: 'branch_engine'),
         string(
            defaultValue: 'rc-3.17.100',
            description: '',
            name: 'branch_ws'),
         string(
            defaultValue: 'rc-3.31',
            description: '',
            name: 'branch_atf'),
         choice(
            choices: "\nfieldlink\nfilterbutton\natplace\nformcontroller\nglobalpanel\nrichedit\nmove\nscroll\nsearch\nprint\nmerge",
            description: '',
            name: 'Tag1'),
         choice(
            choices: "\nfieldlink\nfilterbutton\natplace\nformcontroller\nglobalpanel\nrichedit\nmove\nscroll\nsearch\nprint\nmerge",
            description: '',
            name: 'Tag2'),
         choice(
            choices: "\nfieldlink\nfilterbutton\natplace\nformcontroller\nglobalpanel\nrichedit\nmove\nscroll\nsearch\nprint\nmerge",
            description: '',
            name: 'Tag3'),
         choice(
            choices: "online\npresto\ncarry\ngenie",
            description: '',
            name: 'theme'),
        choice(choices: "chrome\nff", description: '', name: 'browser_type'),
        choice(choices: "all\nonly_reg\nonly_int\nonly_unit", description: '', name: 'run_tests')]),
    pipelineTriggers([])
])

node('controls') {
    def version = "${env.version}"
    def ver = version.replaceAll('.','')
    def python_ver = 'python3'
    def SDK = ""
    def items_1 = ""

    echo "${env.JOB_NAME}"
    def TAGS = ""
    if ("${env.Tag1}" != "")
        TAGS = "${env.Tag1}"
    if ("${env.Tag2}" != "")
        TAGS = "${TAGS}, ${env.Tag2}"
    if ("${env.Tag3}" !="")
        TAGS = "${TAGS}, ${env.Tag3}"
    if ("${TAGS}" != "")
        TAGS = "--TAGS_TO_START ${TAGS}"

    stage("Checkout"){
        // Контролы
        dir("${env.WORKSPACE}") {
            checkout([$class: 'GitSCM',
               branches: [[name: "${env.BRANCH_NAME}"]],
               doGenerateSubmoduleConfigurations: false,
               extensions: [[
                   $class: 'RelativeTargetDirectory',
                   relativeTargetDir: "controls"
                ]],
                submoduleCfg: [],
                userRemoteConfigs: [[
                    credentialsId: 'ae2eb912-9d99-4c34-ace5-e13487a9a20b',
                    url: 'git@git.sbis.ru:sbis/controls.git']]
            ])
        }
        // Выкачиваем platform
        dir("${env.WORKSPACE}") {
            checkout([$class: 'GitSCM',
            branches: [[name: "rc-${env.version}"]],
            doGenerateSubmoduleConfigurations: false,
            extensions: [[
                $class: 'RelativeTargetDirectory',
                relativeTargetDir: "constructor"
                ]],
                submoduleCfg: [],
                userRemoteConfigs: [[
                    credentialsId: 'ae2eb912-9d99-4c34-ace5-e13487a9a20b',
                    url: 'git@git.sbis.ru:sbis-ci/platform.git']]
            ])
            checkout([$class: 'GitSCM',
            branches: [[name: '1.0']],
            doGenerateSubmoduleConfigurations: false,
            extensions: [[
                $class: 'RelativeTargetDirectory',
                relativeTargetDir: "cdn"
                ]],
                submoduleCfg: [],
                userRemoteConfigs: [[
                    credentialsId: 'ae2eb912-9d99-4c34-ace5-e13487a9a20b',
                    url: 'git@git.sbis.ru:root/sbis3-cdn.git']]
            ])
        }
        // Выкачиваем constructor и cdn
        dir("./constructor") {
            checkout([$class: 'GitSCM',
            branches: [[name: "rc-${env.version}"]],
            doGenerateSubmoduleConfigurations: false,
            extensions: [[
                $class: 'RelativeTargetDirectory',
                relativeTargetDir: "Constructor"
                ]],
                submoduleCfg: [],
                userRemoteConfigs: [[
                    credentialsId: 'ae2eb912-9d99-4c34-ace5-e13487a9a20b',
                    url: 'git@git.sbis.ru:sbis-ci/constructor.git']]
            ])

        }
        // Выкачиваем atf
        dir("./controls/tests/int") {
        checkout([$class: 'GitSCM',
            branches: [[name: "${env.branch_atf}"]],
            doGenerateSubmoduleConfigurations: false,
            extensions: [[
                $class: 'RelativeTargetDirectory',
                relativeTargetDir: "atf"
                ]],
                submoduleCfg: [],
                userRemoteConfigs: [[
                    credentialsId: 'ae2eb912-9d99-4c34-ace5-e13487a9a20b',
                    url: 'git@git.sbis.ru:autotests/atf.git']]
            ])
        }

        // Выкачиваем engine
        dir("./controls/tests"){
            checkout([$class: 'GitSCM',
            branches: [[name: "${env.branch_engine}"]],
            doGenerateSubmoduleConfigurations: false,
            extensions: [[
                $class: 'RelativeTargetDirectory',
                relativeTargetDir: "sbis3-app-engine"
                ]],
                submoduleCfg: [],
                userRemoteConfigs: [[
                    credentialsId: 'ae2eb912-9d99-4c34-ace5-e13487a9a20b',
                    url: 'git@git.sbis.ru:sbis/engine.git']]
            ])
        }
        // Выкачиваем demo_stand
        dir("${env.WORKSPACE}") {
            checkout([$class: 'GitSCM',
            branches: [[name: 'master']],
            doGenerateSubmoduleConfigurations: false,
            extensions: [[
                $class: 'RelativeTargetDirectory',
                relativeTargetDir: "demo_stand"
                ]],
                submoduleCfg: [],
                userRemoteConfigs: [[
                    credentialsId: 'ae2eb912-9d99-4c34-ace5-e13487a9a20b',
                    url: 'git@git.sbis.ru:ka.sannikov/demo_stand.git']]
            ])
        }
        // Копируем /demo_stand/client в /tests/stand/client
        sh "cp -rf ./demo_stand/client ./controls/tests/stand"

        // Выкачиваем ws
        if ("${env.branch_ws}" == "rc-${env.version}")
        {
        items_1 = "controls:${env.WORKSPACE}/controls"
        echo "${items_1}"
        } else {
            dir("${env.WORKSPACE}") {
                checkout([$class: 'GitSCM',
                branches: [[name: "${env.branch_ws}"]],
                doGenerateSubmoduleConfigurations: false,
                extensions: [[
                    $class: 'RelativeTargetDirectory',
                    relativeTargetDir: "WIS-git-temp"
                    ]],
                    submoduleCfg: [],
                    userRemoteConfigs: [[
                    credentialsId: 'ae2eb912-9d99-4c34-ace5-e13487a9a20b',
                    url: 'git@git.sbis.ru:sbis/ws.git']]
                ])
            }
            dir("${env.WORKSPACE}") {
                sh "${python_ver} ./constructor/build_ws.py ${env.WORKSPACE}/WIS-git-temp 'release' ${env.WORKSPACE}/WIS-git-temp_build ${env.BUILD_NUMBER} --not_web_sdk NOT_WEB_SDK"

                items_1="controls:${env.WORKSPACE}/controls, ws:${env.WORKSPACE}/WIS-git-temp_build"
            }
        }
    }
    stage("Разворот стенда"){
        dir("./constructor/Constructor/SDK") {
            // Определяем SDK
            SDK = sh returnStdout: true, script: "${python_ver} getSDK.py ${env.version} --conf linux_x86_64 -b"
            SDK = SDK.trim()
            echo "${SDK}"
        }
        // Собираем controls
        dir("./controls")
        {
            sh "${python_ver} ${env.WORKSPACE}/constructor/build_controls.py ${env.WORKSPACE}/controls ${env.BUILD_NUMBER}"
        }
        // Создаем sbis-rpc-service.ini
        def host_db = "test-autotest-db1"
        def port_db = "5432"
        def name_db = "css_${env.NODE_NAME}${ver}1"
        def user_db = "postgres"
        def password_db = "postgres"
        writeFile file: "./controls/tests/stand/conf/sbis-rpc-service.ini", text: """[Базовая конфигурация]
            АдресСервиса=${env.NODE_NAME}:10001
            ПаузаПередЗагрузкойМодулей=0
            ХранилищеСессий=host=\'dev-sbis3-autotest\' port=\'6380\' dbindex=\'2\'
            БазаДанных=postgresql: host=\'${host_db}\' port=\'${port_db}\' dbname=\'${name_db}\' user=\'${user_db}\' password=\'${password_db}\'
            РазмерКэшаСессий=3
            Конфигурация=ini-файл
            [Ядро.Сервер приложений]
            ПосылатьОтказВОбслуживанииПриОтсутствииРабочихПроцессов=Нет
            МаксимальноеВремяЗапросаВОчереди=60000
            ЧислоРабочихПроцессов=4
            [Ядро.Права]
            Проверять=Нет
            [Ядро.Асинхронные сообщения]
            БрокерыОбмена=amqp://test-rabbitmq.unix.tensor.ru
            [Ядро.Логирование]
            Уровень=Параноидальный
            ОграничениеДляВходящегоВызова=1024
            ОграничениеДляИсходящегоВызова=1024
            ОтправлятьНаСервисЛогов=Нет
            [Тест]
            Адрес=http://${env.NODE_NAME}:10001"""
        // Копируем шаблоны
        sh """cp -f ./controls/tests/stand/intest/pageTemplates/branch/* ./controls/tests/stand/intest/pageTemplates"""
        sh """
            cd "${env.WORKSPACE}/tests/stand/intest/"
            sudo python3 "change_theme.py" ${env.theme}
            cd "${env.WORKSPACE}
        """
        sh """
            sudo chmod -R 0777 ${env.WORKSPACE}
            ${python_ver} "./constructor/updater.py" "${env.version}" "/home/sbis/Controls1" "css_${env.NODE_NAME}${ver}1" "./controls/tests/stand/conf/sbis-rpc-service.ini" "./controls/tests/stand/distrib_branch_new" --sdk_path "${SDK}" --items "${items_1}" --host test-autotest-db1 --stand nginx_branch --daemon_name Controls1
            sudo chmod -R 0777 ${env.WORKSPACE}
            sudo chmod -R 0777 /home/sbis/Controls1
        """

        //Пакуем данные
        writeFile file: "/home/sbis/Controls1/Core.package.json", text: """
            {
            "modules" : [
            "Core/core",
            "WS.Data/Source/SbisService",
            "WS.Data/Source/Memory",
            "WS.Data/Entity/Model",
            "WS.Data/Collection/RecordSet",
            "SBIS3.CONTROLS.ItemsControlMixin"
            ],
                "output" : "/resources/Core.module.js"
            }"""

        sh """
            cd ./jinnee/distrib/builder
            node ./node_modules/grunt-cli/bin/grunt custompack --root=/home/sbis/Controls1 --application=/
        """
    }
    writeFile file: "./controls/tests/int/config.ini", text:
        """# UTF-8
        [general]
        browser = ${env.browser_type}
        SITE = http://${NODE_NAME}:30001
        fail_test_repeat_times = 0
        DO_NOT_RESTART = True
        SOFT_RESTART = True
        NO_RESOURCES = True
        STREAMS_NUMBER = 20
        DELAY_RUN_TESTS = 2
        TAGS_NOT_TO_START = iOSOnly
        ELEMENT_OUTPUT_LOG = locator
        WAIT_ELEMENT_LOAD = 20
        HTTP_PATH = http://${NODE_NAME}:2100/sbis3-controls_${env.version}/${env.BRANCH_NAME}/controls/tests/int/
        SERVER = test-autotest-db1
        BASE_VERSION = css_${NODE_NAME}${ver}1
        server_address = http://10.76.163.98:4380/wd/hub"""


    if ( "${env.theme}" != "online" ): {
         writeFile file: "./controls/tests/reg/config.ini",
         text:
            """# UTF-8
            [general]
            browser = ${env.browser_type}
            SITE = http://${NODE_NAME}:30001
            fail_test_repeat_times = 0
            DO_NOT_RESTART = True
            SOFT_RESTART = False
            NO_RESOURCES = True
            STREAMS_NUMBER = 40
            DELAY_RUN_TESTS = 2
            TAGS_NOT_TO_START = ${env.theme}
            ELEMENT_OUTPUT_LOG = locator
            WAIT_ELEMENT_LOAD = 20
            HTTP_PATH = http://${NODE_NAME}:2100/sbis3-controls_${env.version}/${env.BRANCH_NAME}/controls/tests/reg/
            SERVER = test-autotest-db1
            BASE_VERSION = css_${NODE_NAME}${ver}1
            RUN_REGRESSION=True
            server_address = http://10.76.159.209:4444/wd/hub
            CHROME_BINARY_LOCATION=C:\\chrome64_58\\chrome.exe
            [regression]
            IMAGE_DIR = capture_${env.theme}"""
    } else {
         writeFile file: "./controls/tests/reg/config.ini",
         text:
            """# UTF-8
            [general]
            browser = ${env.browser_type}
            SITE = http://${NODE_NAME}:30001
            fail_test_repeat_times = 0
            DO_NOT_RESTART = True
            SOFT_RESTART = False
            NO_RESOURCES = True
            STREAMS_NUMBER = 15
            DELAY_RUN_TESTS = 2
            TAGS_NOT_TO_START = ${env.theme}
            ELEMENT_OUTPUT_LOG = locator
            WAIT_ELEMENT_LOAD = 20
            HTTP_PATH = http://${NODE_NAME}:2100/sbis3-controls_${env.version}/${env.BRANCH_NAME}/controls/tests/reg/
            SERVER = test-autotest-db1
            BASE_VERSION = css_${NODE_NAME}${ver}1
            RUN_REGRESSION=True
            server_address = http://10.76.159.209:4444/wd/hub
            CHROME_BINARY_LOCATION=C:\\chrome64_58\\chrome.exe"""
    }

    stage("Инт.тесты"){
        if ("${env.run_tests}" != "only_reg"){
            def site = "http://${NODE_NAME}:7777"
            site.trim()
            if ( "${TAGS}" != "") {
               def run_tags="--TAGS_TO_START ${TAGS}"
            }
            dir("./controls/tests/int"){
                sh """
                source /home/sbis/venv_for_test/venv_for_test/bin/activate
                python start_tests.py --RESTART_AFTER_BUILD_MODE ${run_tags}
                deactivate
                """
            }
        }
    }
    stage("Рег.тесты"){
        if ("${env.run_tests}" != "only_int"){
            sh "cp -R ./controls/tests/int/atf/ ./controls/tests/reg/atf/"
            dir("./controls/tests/reg"){
                sh """
                    source /home/sbis/venv_for_test/venv_for_test/bin/activate
                    python start_tests.py --RESTART_AFTER_BUILD_MODE
                    deactivate
                """
            }
            publishHTML([allowMissing: true, alwaysLinkToLastBuild: false, keepAll: false, reportDir: "./controls/tests/reg/capture_report/", reportFiles: "report.html", reportName: "Regression Report", reportTitles: ""])
        }
    }
    stage("Результаты"){
        junit keepLongStdio: true, testResults: "**/test-reports/*.xml"
        archiveArtifacts allowEmptyArchive: true, artifacts: '**/report.zip', caseSensitive: false
        archiveArtifacts allowEmptyArchive: true, artifacts: '**/result.db', caseSensitive: false
    }

}
