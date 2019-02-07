#!groovy
import java.time.*
import java.lang.Math

def version = "19.100"

@NonCPS
def get_run_commit() {
    def log = currentBuild.rawBuild.getLog(100)
    def commit = (log =~ /Jenkinsfile from ([0-9a-z]+)/)
    echo "COMMIT: ${commit[0][1]}"
    return commit[0][1]
}
env.GIT_COMMIT = get_run_commit()

def gitlabStatusUpdate() {
     if ( currentBuild.currentResult in ["UNSTABLE", "FAILURE", "ABORTED"] ) {
        send_status_in_gitlab('failed')
    } else if ( currentBuild.currentResult == "SUCCESS" ) {
        send_status_in_gitlab('success')
    }
}
def exception(err, reason) {
    currentBuild.displayName = "#${env.BUILD_NUMBER} ${reason}"
    currentBuild.description = "${err}"
    error(err)
}

def send_status_in_gitlab(state) {
    def request_url = "http://ci-platform.sbis.ru:8000/set_status"
    def request_data = """{"hub": "gitlab", "project_name":"sbis/controls", "branch_name":"${BRANCH_NAME}", "commit":"${GIT_COMMIT}", "state": "${state}", "build_url":"${BUILD_URL}"}"""
    echo "${request_data}"
    sh """curl -sS --header \"Content-Type: application/json\" --request POST --data  '${request_data}' ${request_url}"""
}

def build_description(job, path, skip_test) {
    def param_skip = ''
    def title = ''
    if (skip_test) {
        param_skip="-s"
    }
    def description = sh returnStdout: true, script: "python3 get_err_from_rc.py -j '${job}' -f ${path} ${param_skip}"
    if (description) {
        title = description.tokenize('|')[0]
        description = description.tokenize('|')[1]
        echo "${title}"
        echo "${description}"
        if (title && description) {
            return [title, description]
        }

    }
}

def return_test_for_run(tests_files) {
    tests_files = tests_files.replace('\n', '')
    echo "Будут запущены ${tests_files}"
    def run_reg_sbis3 = ""
    def run_reg_vdom = ""
    def run_int_sbis3 = ""
    def run_int_vdom = ""
    echo "Делим общий список на int и reg тесты"
    type_tests = tests_files.split(';')
    temp_var = type_tests[0].split('reg_sbis3:')
    if ( temp_var.length == 2) {
        run_reg_sbis3 = "--files_to_start ${temp_var[1]}"
    }
    temp_var = type_tests[1].split('reg_vdom:')
    if ( temp_var.length == 2) {
        run_reg_vdom = "--files_to_start ${temp_var[1]}"
    }
    temp_var = type_tests[2].split('int_sbis3:')
    if ( temp_var.length == 2 ) {
        run_int_sbis3 = "--files_to_start ${temp_var[1]}"
    }
    temp_var = type_tests[3].split('int_vdom:')
    if ( temp_var.length == 2 ) {
        run_int_vdom = "--files_to_start ${temp_var[1]}"
    }

    return [run_int_sbis3, run_int_vdom, run_reg_sbis3, run_reg_vdom]
}

def download_coverage_json(version, type_tests, type_controls) {
    echo "Выкачиваем файл с зависимостями"
    url = "${env.JENKINS_URL}view/${version}/job/coverage_${version}/job/coverage_${type_controls}_controls_${version}/lastSuccessfulBuild/artifact/controls/tests/${type_tests}/${type_controls}/coverage/result.json"
    script = """
        if [ `curl -s -w "%{http_code}" --compress -o tmp_result_${type_tests}.json "${url}"` = "200" ]; then
        echo "result_${type_tests}.json exitsts"; mv -f tmp_result_${type_tests}.json result_${type_tests}.json
        else rm -f result_${type_tests}.json
        fi
        """
    sh returnStdout: true, script: script
    def exist_json = fileExists 'result.json'
    return exist_json

}


def build_title(t_int_sbis3, t_int_vdom, t_reg_sbis3, t_reg_vdom) {
    if (!t_int_sbis3 && !t_reg_sbis3 && !t_int_vdom && !t_reg_vdom) {
        currentBuild.displayName = "#${env.BUILD_NUMBER}"

    } else if (t_int_sbis3 && !t_reg_sbis3 && !t_int_vdom && !t_reg_vdom) {
        currentBuild.displayName = "#${env.BUILD_NUMBER} ${t_int_sbis3}"
    } else if (!t_int_sbis3 && t_reg_sbis3 && !t_int_vdom && !t_reg_vdom) {
        currentBuild.displayName = "#${env.BUILD_NUMBER} ${t_reg_vdom}"

    }else if (!t_int_sbis3 && !t_reg_sbis3 && t_int_vdom && !t_reg_vdom) {
        currentBuild.displayName = "#${env.BUILD_NUMBER} ${t_int_vdom}"
    } else if (!t_int_sbis3 && !t_reg_sbis3 && !t_int_vdom && t_reg_vdom) {
        currentBuild.displayName = "#${env.BUILD_NUMBER} ${t_reg_vdom}"

    } else if (t_int_sbis3 && t_reg_sbis3 && t_int_sbis3==t_reg_sbis3 && !t_int_vdom && !t_reg_vdom) {
        currentBuild.displayName = "#${env.BUILD_NUMBER} ${t_int_sbis3}"
    } else if (t_int_vdom && t_reg_vdom && t_int_vdom==t_reg_vdom && !t_int_sbis3 && !t_reg_sbis3) {
        currentBuild.displayName = "#${env.BUILD_NUMBER} ${t_int_vdom}"

    } else if (t_int_sbis3.contains('FAIL')) {
        currentBuild.displayName = "#${env.BUILD_NUMBER} ${t_int_sbis3}"
    } else if (t_int_vdom.contains('FAIL')) {
        currentBuild.displayName = "#${env.BUILD_NUMBER} ${t_int_vdom}"

    } else if (t_reg_sbis3.contains('FAIL')) {
        currentBuild.displayName = "#${env.BUILD_NUMBER} ${t_reg_sbis3}"
    } else if (t_reg_vdom.contains('FAIL')) {
        currentBuild.displayName = "#${env.BUILD_NUMBER} ${t_reg_vdom}"
    }
}

@NonCPS
def getBuildUser() {
    def cause = currentBuild.rawBuild.getCause(Cause.UserIdCause)
    def userId = ''
    try {
        userId = cause.getUserId()
    }catch (java.lang.NullPointerException e) {
        //ничего не делаем
    }

    return userId
}

def getParams(user) {
    def common_params = [
            string(
                defaultValue: 'sdk',
                description: '',
                name: 'ws_revision'),
            string(
                defaultValue: 'sdk',
                description: '',
                name: 'ws_data_revision'),
            string(
                defaultValue: '',
                description: '',
                name: 'branch_engine'),
            string(
                defaultValue: '',
                description: '',
                name: 'branch_navigation'),
            string(
                defaultValue: '',
                description: '',
                name: 'branch_viewsettings'),
            string(
                defaultValue: '',
                description: '',
                name: 'branch_themes'),
            string(
                defaultValue: "",
                description: '',
                name: 'branch_atf'),
            choice(
                choices: "online\npresto\ncarry\ngenie",
                description: '',
                name: 'theme'),
            choice(choices: "chrome\nff\nie\nedge", description: 'Тип браузера', name: 'browser_type'),
            booleanParam(defaultValue: true, description: "Тип контролов SBIS3.CONTROLS", name: 'run_sbis3'),
            booleanParam(defaultValue: true, description: "Tип контролов VDOM", name: 'run_vdom'),
            booleanParam(defaultValue: false, description: "Запуск интеграционных тестов по изменениям. Список формируется на основе coverage существующих тестов", name: 'run_int'),
            booleanParam(defaultValue: false, description: "Запуск тестов верстки по изменениям. Список формируется на основе coverage существующих тестов", name: 'run_reg'),
            booleanParam(defaultValue: false, description: "Запуск ВСЕХ интеграционных тестов", name: 'run_all_int'),
            booleanParam(defaultValue: false, description: "Запуск ВСЕХ тестов верстки", name: 'run_all_reg'),
            booleanParam(defaultValue: false, description: "Запуск unit тестов", name: 'run_unit'),
            booleanParam(defaultValue: false, description: "Пропустить тесты, которые падают в RC по функциональным ошибкам на текущий момент", name: 'skip')
            ]
    if ( ["kraynovdo", "ls.baranova", "ma.rozov"].contains(user) ) {
        common_params.add(choice(choices: "default\n1", description: "Запустить сборку с приоритетом. 'default' - по умолчанию, '1' - самый высокий", name: 'build_priority'))
    }
    if ( ["ls.baranova", "da.dubenec", "mitin", "ea.proshin"].contains(user) ) {
        common_params.add(booleanParam(defaultValue: false, description: "Я разработчик автотестов", name: 'run_boss'))
    }
    return common_params
}
def user_name = getBuildUser()
echo "Ветка в GitLab: https://git.sbis.ru/sbis/controls/tree/${env.BRANCH_NAME}"
echo "Генерируем параметры"
    properties([
    disableConcurrentBuilds(),
    gitLabConnection('git'),
    buildDiscarder(
        logRotator(
            artifactDaysToKeepStr: '3',
            artifactNumToKeepStr: '3',
            daysToKeepStr: '3',
            numToKeepStr: '3')),
        parameters(getParams(user_name)),
        pipelineTriggers([])
    ])

def regr = params.run_reg
def all_regr = params.run_all_reg
def unit = params.run_unit
def inte = params.run_int
def all_inte = params.run_all_int
def boss = params.run_boss
def only_fail = false
def vdom_controls = params.run_vdom
def sbis3_controls = params.run_sbis3


node('master') {
    if ( "${env.BUILD_NUMBER}" != "1" && !( all_regr|| regr || unit|| inte || all_inte || only_fail || boss)) {
        send_status_in_gitlab("failed")
        exception('Ветка запустилась по пушу, либо запуск с некоректными параметрами', 'TESTS NOT BUILD')
    }else {
        // если встала в очередь на билдере
        send_status_in_gitlab("running")
    }
}

node('controls') {
    LocalDateTime start_time = LocalDateTime.now();
    echo "Время запуска: ${start_time}"
    echo "Читаем настройки из файла version_application.txt"
    def props = readProperties file: "/home/sbis/mount_test-osr-source_d/Платформа/${version}/version_application.txt"
    echo "Определяем рабочую директорию"
    def workspace = "/home/sbis/workspace/controls_${version}/${BRANCH_NAME}"
    ws(workspace) {
        deleteDir()
        def skip = params.skip
        def changed_files
        def skip_tests_int_sbis3 = ""
        def skip_tests_int_vdom = ""
        def skip_tests_reg_sbis3 = ""
        def skip_tests_reg_vdom = ""
        def tests_for_run_int_sbis3 = ""
        def tests_for_run_int_vdom = ""
        def tests_for_run_reg_sbis3 = ""
        def tests_for_run_reg_vdom = ""
        def smoke_result = true
        def run_tests_int_sbis3 = false
        def run_tests_int_vdom = false
        def run_tests_reg_sbis3 = false
        def run_tests_reg_vdom = false

        try {
        echo "Назначаем переменные"
        def server_address=props["SERVER_ADDRESS"]
        def stream_number=props["snit"]
        def ver = version.replaceAll('.','')
        def python_ver = 'python3'
        def SDK = ""
        def items = "controls:${workspace}/controls, controls_new:${workspace}/controls, controls_theme:${workspace}/controls"
        def run_test_fail = ""
        def branch_atf
        if (params.branch_atf) {
            branch_atf = params.branch_atf
        } else {
            branch_atf = props["atf_co"]
        }
        def branch_engine
        if (params.branch_engine) {
            branch_engine = params.branch_engine
        } else {
            branch_engine = props["engine"]
        }
        def branch_themes
        if (params.branch_themes) {
            branch_themes = params.branch_themes
        } else {
            branch_themes = props["themes"]
        }
        def branch_navigation
        if (params.branch_navigation) {
            branch_navigation = params.branch_navigation
        } else {
            branch_navigation = props["navigation"]
        }
        def branch_viewsettings
        if (params.branch_viewsettings) {
            branch_viewsettings = params.branch_viewsettings
        } else {
            branch_viewsettings = props["viewsettings"]
        }

        if ("${env.BUILD_NUMBER}" == "1"){
            inte = true
            regr = true
            unit = true
        }
        if ( inte && all_inte ) {
            inte = false
        }
        if ( regr && all_regr ) {
            regr = false
        }
        if ( inte || all_inte || regr || all_regr) {
            unit = true
        }
        if ( boss ) {
            unit = false
            inte = true
            regr = true
        }

        if (vdom_controls && (inte || all_inte)) {
            run_tests_int_vdom = true
        }
        if (sbis3_controls && (inte || all_inte)) {
            run_tests_int_sbis3 = true
        }
        if (vdom_controls && (regr || all_regr)) {
            run_tests_reg_vdom = true
        }
        if (sbis3_controls && (regr || all_regr)) {
            run_tests_reg_sbis3 = true
        }

        if (!vdom_controls && !sbis3_controls && !unit) {
            exception('Не указан тип контролов для проверки', 'TESTS NOT BUILD')

        }
        dir(workspace){
            echo "УДАЛЯЕМ ВСЕ КРОМЕ ./controls"
            sh "ls | grep -v -E 'controls' | xargs rm -rf"
            dir("./controls"){
                sh "rm -rf ${workspace}/controls/tests/int/SBIS3.CONTROLS/atf"
                sh "rm -rf ${workspace}/controls/tests/int/VDOM/atf"
                sh "rm -rf ${workspace}/controls/tests/reg/SBIS3.CONTROLS/atf"
                sh "rm -rf ${workspace}/controls/tests/reg/VDOM/atf"
                sh "rm -rf ${workspace}/controls/sbis3-app-engine"
                sh "rm -rf ${workspace}/controls/tests/navigation"
                sh "rm -rf ${workspace}/controls/viewsettings"
                sh "rm -rf ${workspace}/controls/node_modules"
                sh "rm -rf ${workspace}/controls/package-lock.json"
            }
        }
        echo "Выкачиваем хранилища"
        stage("Checkout"){
            parallel (
                checkout1: {
                    echo "Выкачиваем controls "
                    dir(workspace) {
                        checkout([$class: 'GitSCM',
                        branches: [[name: env.BRANCH_NAME]],
                        doGenerateSubmoduleConfigurations: false,
                        extensions: [[
                            $class: 'RelativeTargetDirectory',
                            relativeTargetDir: "controls"
                            ]],
                            submoduleCfg: [],
                            userRemoteConfigs: [[
                                credentialsId: CREDENTIAL_ID_GIT,
                                url: 'git@git.sbis.ru:sbis/controls.git']]
                        ])

                    }
                    echo "Обновляемся из rc-${version}"
                    dir("./controls"){
                        sh """
                        git clean -fd
                        git fetch --all
                        git checkout ${env.BRANCH_NAME}
                        git pull
                        git merge origin/rc-${version}
                        """
                        def status_filter = ""
                        if ( boss ) {
                            status_filter="--diff-filter=MAR"   // добавление, изменения, переименование
                        }
                        changed_files = sh (returnStdout: true, script: "git diff origin/rc-${version} --name-only ${status_filter}| tr '\n' ' '")
                        if ( changed_files ) {
                            echo "Изменения были в файлах: ${changed_files}"
                        }
                    }

                    parallel (
                        checkout_atf:{
                            echo " Выкачиваем atf"
                            dir("./controls/tests/int") {
                            checkout([$class: 'GitSCM',
                                branches: [[name: branch_atf]],
                                doGenerateSubmoduleConfigurations: false,
                                extensions: [[
                                    $class: 'RelativeTargetDirectory',
                                    relativeTargetDir: "atf"
                                    ]],
                                    submoduleCfg: [],
                                    userRemoteConfigs: [[
                                        credentialsId: CREDENTIAL_ID_GIT,
                                        url: 'git@git.sbis.ru:autotests/atf.git']]
                                ])
                            sh "cp -rf ./atf/ ./SBIS3.CONTROLS/atf/"
                            sh "cp -rf ./atf/ ./VDOM/atf/"
                            sh "cp -rf ./atf/ ../reg/SBIS3.CONTROLS/atf/"
                            sh "cp -rf ./atf/ ../reg/VDOM/atf/"
                            }
                        },
                        checkout_engine: {
                            echo " Выкачиваем engine"
                            dir("./controls"){
                                checkout([$class: 'GitSCM',
                                branches: [[name: branch_engine]],
                                doGenerateSubmoduleConfigurations: false,
                                extensions: [[
                                    $class: 'RelativeTargetDirectory',
                                    relativeTargetDir: "sbis3-app-engine"
                                    ]],
                                    submoduleCfg: [],
                                    userRemoteConfigs: [[
                                        credentialsId: CREDENTIAL_ID_GIT,
                                        url: 'git@git.sbis.ru:sbis/engine.git']]
                                ])
                            }
                        },
                        checkout_navigation: {
                            echo " Выкачиваем Navigation"
                            dir("./controls/tests"){
                                checkout([$class: 'GitSCM',
                                branches: [[name: branch_navigation]],
                                doGenerateSubmoduleConfigurations: false,
                                extensions: [[
                                    $class: 'RelativeTargetDirectory',
                                    relativeTargetDir: "navigation"
                                    ]],
                                    submoduleCfg: [],
                                    userRemoteConfigs: [[
                                        credentialsId: CREDENTIAL_ID_GIT,
                                        url: 'git@git.sbis.ru:navigation-configuration/navigation.git']]
                                ])
                            }
                        },
                        checkout_viewsettings: {
                            echo " Выкачиваем viewsettings"
                            dir("./controls"){
                                checkout([$class: 'GitSCM',
                                branches: [[name: branch_viewsettings]],
                                doGenerateSubmoduleConfigurations: false,
                                extensions: [[
                                    $class: 'RelativeTargetDirectory',
                                    relativeTargetDir: "viewsettings"
                                    ]],
                                    submoduleCfg: [],
                                    userRemoteConfigs: [[
                                        credentialsId: CREDENTIAL_ID_GIT,
                                        url: 'git@git.sbis.ru:engine/viewsettings.git']]
                                ])
                            }
                        }
                    )
                },
                checkout2: {
                    echo " Выкачиваем сборочные скрипты"
                    dir(workspace) {
                        checkout([$class: 'GitSCM',
                        branches: [[name: "rc-${version}"]],
                        doGenerateSubmoduleConfigurations: false,
                        extensions: [[
                            $class: 'RelativeTargetDirectory',
                            relativeTargetDir: "constructor"
                            ]],
                            submoduleCfg: [],
                            userRemoteConfigs: [[
                                credentialsId: CREDENTIAL_ID_GIT,
                                url: 'git@git.sbis.ru:sbis-ci/platform.git']]
                        ])
                    }
                    dir("./constructor") {
                        checkout([$class: 'GitSCM',
                        branches: [[name: "rc-${version}"]],
                        doGenerateSubmoduleConfigurations: false,
                        extensions: [[
                            $class: 'RelativeTargetDirectory',
                            relativeTargetDir: "Constructor"
                            ]],
                            submoduleCfg: [],
                            userRemoteConfigs: [[
                                credentialsId: CREDENTIAL_ID_GIT,
                                url: 'git@git.sbis.ru:sbis-ci/constructor.git']]
                        ])
                    }
                },
                checkout3: {
                    dir(workspace) {
                        echo "Выкачиваем cdn"
                        checkout([$class: 'GitSCM',
                        branches: [[name: props["cdn"]]],
                        doGenerateSubmoduleConfigurations: false,
                        extensions: [[
                            $class: 'RelativeTargetDirectory',
                            relativeTargetDir: "cdn"
                            ]],
                            submoduleCfg: [],
                            userRemoteConfigs: [[
                                credentialsId: CREDENTIAL_ID_GIT,
                                url: 'git@git.sbis.ru:root/sbis3-cdn.git']]
                        ])
                    }
                },
                checkout4: {
                    dir(workspace) {
                        echo "Выкачиваем themes"
                        checkout([$class: 'GitSCM',
                        branches: [[name: branch_themes]],
                        doGenerateSubmoduleConfigurations: false,
                        extensions: [[
                            $class: 'RelativeTargetDirectory',
                            relativeTargetDir: "themes"
                            ]],
                            submoduleCfg: [],
                            userRemoteConfigs: [[
                                credentialsId: CREDENTIAL_ID_GIT,
                                url: 'git@git.sbis.ru:retail/themes.git']]
                        ])
                    }
                }
            )
        if ( only_fail ) {
            run_test_fail = "-sf"
            if (!inte && !regr) {
                exception('Не отмечены тип тестов для перезапуска. Укажите опции run_int и/или run_reg', 'USER FAIL')
            }
        }
    }

        stage("Сборка компонент"){
            echo " Определяем SDK"
            dir("./constructor/Constructor/SDK") {
                SDK = sh returnStdout: true, script: "export PLATFORM_version=${version} && source ${workspace}/constructor/Constructor/SDK/setToSDK.sh linux_x86_64"
                SDK = SDK.trim()
                echo SDK
            }
            parallel(
                ws: {
                    echo "Выкачиваем ws если указан сторонний бранч"
                    if ("${params.ws_revision}" != "sdk" ){
                        def ws_revision = params.ws_revision
                        if ("${params.ws_revision}" == "sdk" ){
                            ws_revision = sh returnStdout: true, script: "${python_ver} ${workspace}/constructor/read_meta.py -rev ${SDK}/meta.info ws"
                        } else {
                            sh "python3 ${workspace}/constructor/replace_package_json.py ${workspace}/controls/ sbis3-ws ${BRANCH_NAME}"
                        }
                        dir(workspace) {
                            checkout([$class: 'GitSCM',
                            branches: [[name: ws_revision]],
                            doGenerateSubmoduleConfigurations: false,
                            extensions: [[
                                $class: 'RelativeTargetDirectory',
                                relativeTargetDir: "WIS-git-temp"
                                ]],
                                submoduleCfg: [],
                                userRemoteConfigs: [[
                                credentialsId: CREDENTIAL_ID_GIT,
                                url: 'git@git.sbis.ru:sbis/ws.git']]
                            ])
                        }
                    }
                },
                ws_data: {
                    echo "Выкачиваем ws.data если указан сторонний бранч"
                    if ( "${params.ws_data_revision}" != "sdk" ){
                        def ws_data_revision = params.ws_data_revision
                        if ( "${params.ws_data_revision}" == "sdk" ){
                            ws_data_revision = sh returnStdout: true, script: "${python_ver} ${workspace}/constructor/read_meta.py -rev ${SDK}/meta.info ws_data"
                        }
                        dir(workspace) {
                            checkout([$class: 'GitSCM',
                            branches: [[name: ws_data_revision]],
                            doGenerateSubmoduleConfigurations: false,
                            extensions: [[
                                $class: 'RelativeTargetDirectory',
                                relativeTargetDir: "ws_data"
                                ]],
                                submoduleCfg: [],
                                userRemoteConfigs: [[
                                credentialsId: CREDENTIAL_ID_GIT,
                                url: 'git@git.sbis.ru:ws/data.git']]
                            ])
                        }
                    }
                }
            )
            echo "Собираем controls"
            dir("./controls"){
                sh "${python_ver} ${workspace}/constructor/build_controls.py ${workspace}/controls ${env.BUILD_NUMBER} --not_web_sdk NOT_WEB_SDK"
            }
            dir(workspace){
                echo "Собираем ws если задан сторонний бранч"
                if ("${params.ws_revision}" != "sdk"){
                    sh "rm -rf ${workspace}/WIS-git-temp2"
                    sh "mkdir ${workspace}/WIS-git-temp2"
                    sh "${python_ver} ${workspace}/constructor/build_ws.py ${workspace}/WIS-git-temp 'release' ${workspace}/WIS-git-temp2 ${env.BUILD_NUMBER} --not_web_sdk NOT_WEB_SDK"
                    echo "Добавляем в items"
                    items = items + ", ws:${workspace}/WIS-git-temp2, view:${workspace}/WIS-git-temp2, vdom:${workspace}/WIS-git-temp2, ws_deprecated:${workspace}/WIS-git-temp2, ws_core:${workspace}/WIS-git-temp2"
                }
                echo "Собираем ws.data только когда указан сторонний бранч"
                if ("${params.ws_data_revision}" != "sdk"){
                    echo "Добавляем в items"
                    items = items + ", ws_data:${workspace}/ws_data, data:${workspace}/ws_data"
                }
            }
            echo items
        }

        if ( unit ){
            dir("./controls"){
                sh """
                npm cache clean --force
                npm set registry https://registry.npmjs.org/
                """
                stage ("Unit тесты node"){
                    sh returnStatus: true, script: """
                    echo "run isolated"
                    export test_report="artifacts/test-isolated-report.xml"
                    sh ./bin/test-isolated
                    """
                    junit keepLongStdio: true, testResults: "**/artifacts/test-isolated-report.xml"
                    unit_result = currentBuild.result == null
                    if (!unit_result) {
                        exception('Unit тесты node падают с ошибками.', 'UNIT TEST FAIL')
                    }
                }
                stage ("Unit тесты browser"){
                    sh returnStatus: true, script: """
                    echo "run browser"
                    export test_url_host=${env.NODE_NAME}
                    export test_server_port=10253
                    export test_url_port=10253
                    export WEBDRIVER_remote_enabled=1
                    export WEBDRIVER_remote_host=10.76.159.209
                    export WEBDRIVER_remote_port=4444
                    export test_report=artifacts/test-browser-report.xml
                    sh ./bin/test-browser
                    """
                    junit keepLongStdio: true, testResults: "**/artifacts/test-browser-report.xml"
                    unit_result = currentBuild.result == null
                    if (!unit_result) {
                        exception('Unit тесты browser падают с ошибками.', 'UNIT TEST FAIL')
                    }
                }
            }
        }

        if ( all_regr|| regr || inte || all_inte ) {

        stage("Разворот стенда"){
            echo "Запускаем разворот стенда и подготавливаем окружение для тестов"
            // Создаем sbis-rpc-service.ini
            def host_db = "test-autotest-db1"
            def port_db = "5434"
            def name_db = "css_${env.NODE_NAME}${ver}1"
            def user_db = "postgres"
            def password_db = "postgres"
            writeFile file: "./controls/tests/stand/conf/sbis-rpc-service_ps2.ini", text: """[Базовая конфигурация]
                __sbis__url = /another/
                [Ядро.Http]
                Порт=10030
                [Ядро.Сервер приложений]
                ЧислоРабочихПроцессов=3
                ЧислоСлужебныхРабочихПроцессов=0
                ЧислоДополнительныхПроцессов=0
                ЧислоПотоковВРабочихПроцессах=10
                МаксимальныйРазмерВыборкиСписочныхМетодов=0
                [Presentation Service]
                WarmUpEnabled=No
                ExtractLicense=Нет
                ExtractRights=Нет
                ExtractSystemExtensions=Нет
                ExtractUserInfo=Нет"""
            writeFile file: "./controls/tests/stand/conf/sbis-rpc-service_ps.ini", text: """[Базовая конфигурация]
                [Ядро.Http]
                Порт=10020
                [Ядро.Сервер приложений]
                ЧислоРабочихПроцессов=3
                ЧислоСлужебныхРабочихПроцессов=0
                ЧислоДополнительныхПроцессов=0
                ЧислоПотоковВРабочихПроцессах=10
                МаксимальныйРазмерВыборкиСписочныхМетодов=0
                [Управление облаком.Очередь загрузки]
                Хранилище=test-redis.unix.tensor.ru:6436
                [Presentation Service]
                WarmUpEnabled=No
                ExtractLicense=Нет
                ExtractRights=Нет
                ExtractSystemExtensions=Нет
                ExtractUserInfo=Нет"""
            writeFile file: "./controls/tests/stand/conf/sbis-rpc-service.ini", text: """[Базовая конфигурация]
                АдресСервиса=${env.NODE_NAME}:10010
                ПаузаПередЗагрузкойМодулей=0
                ХранилищеСессий=host=\'dev-sbis3-autotest\' port=\'6380\' dbindex=\'2\'
                БазаДанных=postgresql: host=\'${host_db}\' port=\'${port_db}\' dbname=\'${name_db}\' user=\'${user_db}\' password=\'${password_db}\'
                РазмерКэшаСессий=3
                Конфигурация=ini-файл
                [Ядро.Сервер приложений]
                ПосылатьОтказВОбслуживанииПриОтсутствииРабочихПроцессов=Нет
                МаксимальноеВремяЗапросаВОчереди=60000
                ЧислоРабочихПроцессов=4
                МаксимальныйРазмерВыборкиСписочныхМетодов=0
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
                Адрес=http://${env.NODE_NAME}:10010"""
            // Копируем шаблоны
            sh """cp -f ./controls/tests/stand/Intest/pageTemplates/branch/* ./controls/tests/stand/Intest/pageTemplates"""
            sh """cp -fr ./controls/Examples/ ./controls/tests/stand/Intest/Examples/"""
            sh """
                cd "${workspace}/controls/tests/stand/Intest/"
                sudo python3 "change_theme.py" ${params.theme}
                cd "${workspace}"
            """
            sh """
                sudo chmod -R 0777 ${workspace}
                ${python_ver} "./constructor/updater.py" "${version}" "/home/sbis/Controls" "css_${env.NODE_NAME}${ver}1" "./controls/tests/stand/conf/sbis-rpc-service.ini" "./controls/tests/stand/distrib_branch_ps" --sdk_path "${SDK}" --items "${items}" --host test-autotest-db1 --stand nginx_branch --daemon_name Controls --use_ps --conf x86_64
                sudo chmod -R 0777 ${workspace}
                sudo chmod -R 0777 /home/sbis/Controls
            """
            }
        }
		def domain_name = ".unix.tensor.ru"
		
        if ( all_regr|| regr || inte || all_inte ) {
                def soft_restart = "True"
                if ( params.browser_type in ['ie', 'edge'] ){
                    soft_restart = "False"
                }
                if ( "${params.theme}" != "online" ) {
                    img_dir = "capture_${params.theme}"
                } else {
                    img_dir = "capture"
                }
                writeFile file: "./controls/tests/int/SBIS3.CONTROLS/config.ini", text:
                    """# UTF-8
                    [general]
                    browser = ${params.browser_type}
                    SITE = http://${env.NODE_NAME}${domain_name}:30010
                    SERVER = test-autotest-db1:5434
                    BASE_VERSION = css_${env.NODE_NAME}${ver}1
                    DO_NOT_RESTART = True
                    SOFT_RESTART = ${soft_restart}
                    NO_RESOURCES = True
                    DELAY_RUN_TESTS = 2
                    TAGS_NOT_TO_START = iOSOnly
                    ELEMENT_OUTPUT_LOG = locator
                    WAIT_ELEMENT_LOAD = 20
                    SHOW_CHECK_LOG = True
                    HTTP_PATH = http://${env.NODE_NAME}:2100/controls_${version}/${BRANCH_NAME}/controls/tests/int/SBIS3.CONTROLS"""

                writeFile file: "./controls/tests/int/VDOM/config.ini", text:
                    """# UTF-8
                    [general]
                    browser = ${params.browser_type}
                    SITE = http://${env.NODE_NAME}${domain_name}:30010
                    SERVER = test-autotest-db1:5434
                    BASE_VERSION = css_${env.NODE_NAME}${ver}1
                    DO_NOT_RESTART = True
                    SOFT_RESTART = ${soft_restart}
                    NO_RESOURCES = True
                    DELAY_RUN_TESTS = 2
                    TAGS_NOT_TO_START = iOSOnly
                    ELEMENT_OUTPUT_LOG = locator
                    WAIT_ELEMENT_LOAD = 20
                    SHOW_CHECK_LOG = True
                    HTTP_PATH = http://${env.NODE_NAME}:2100/controls_${version}/${BRANCH_NAME}/controls/tests/int/VDOM"""


                writeFile file: "./controls/tests/reg/SBIS3.CONTROLS/config.ini",
                    text:
                        """# UTF-8
                        [general]
                        browser = ${params.browser_type}
                        SITE = http://${env.NODE_NAME}${domain_name}:30010
                        DO_NOT_RESTART = True
                        SOFT_RESTART = False
                        NO_RESOURCES = True
                        DELAY_RUN_TESTS = 2
                        TAGS_TO_START = ${params.theme}
                        ELEMENT_OUTPUT_LOG = locator
                        WAIT_ELEMENT_LOAD = 20
                        HTTP_PATH = http://${env.NODE_NAME}:2100/controls_${version}/${BRANCH_NAME}/controls/tests/reg/SBIS3.CONTROLS
                        SERVER = test-autotest-db1:5434
                        BASE_VERSION = css_${env.NODE_NAME}${ver}1
                        #BRANCH=True
                        [regression]
                        IMAGE_DIR = ${img_dir}
                        RUN_REGRESSION=True"""

                writeFile file: "./controls/tests/reg/VDOM/config.ini",
                    text:
                        """# UTF-8
                        [general]
                        browser = ${params.browser_type}
                        SITE = http://${env.NODE_NAME}${domain_name}:30010
                        DO_NOT_RESTART = True
                        SOFT_RESTART = False
                        NO_RESOURCES = True
                        DELAY_RUN_TESTS = 2
                        TAGS_TO_START = ${params.theme}
                        ELEMENT_OUTPUT_LOG = locator
                        WAIT_ELEMENT_LOAD = 20
                        HTTP_PATH = http://${env.NODE_NAME}:2100/controls_${version}/${BRANCH_NAME}/controls/tests/reg/VDOM
                        SERVER = test-autotest-db1:5434
                        BASE_VERSION = css_${env.NODE_NAME}${ver}1
                        #BRANCH=True
                        [regression]
                        IMAGE_DIR = ${img_dir}
                        RUN_REGRESSION=True"""
                dir("./controls/tests/int/SBIS3.CONTROLS"){
                    sh"""
                        source /home/sbis/venv_for_test/bin/activate
                        ${python_ver} start_tests.py --files_to_start smoke_test.py --SERVER_ADDRESS ${server_address} --RESTART_AFTER_BUILD_MODE --BROWSER chrome --FAIL_TEST_REPEAT_TIMES 0
                        deactivate
                    """
                    junit keepLongStdio: true, testResults: "**/test-reports/*.xml"
                    sh "sudo rm -rf ./test-reports"
                    smoke_result = currentBuild.result == null
                }
                if ( smoke_result ) {
                    if ( only_fail ) {
                        step([$class: 'CopyArtifact', fingerprintArtifacts: true, projectName: "${env.JOB_NAME}", selector: [$class: 'LastCompletedBuildSelector']])
                    }
                    if ( !only_fail && changed_files ) {
                        dir("./controls/tests") {
                        if (inte && !boss) {
                            if (sbis3_controls) {
                                if ( download_coverage_json(version, "int", "SBIS3.CONTROLS") ) {
                                tests_files_int = sh returnStdout: true, script: "python3 coverage_handler.py -c ${changed_files} -rj result.json | tr '\n' ' '"
                                if (tests_files_int) {
                                    echo "${tests_files_int}"
                                    tests_for_run_int_sbis3 = "--files_to_start ${tests_files_int}"
                                }
                            }
                            }
                            if (vdom_controls) {
                                if ( download_coverage_json(version, "int", "VDOM") ) {
                                tests_files_int = sh returnStdout: true, script: "python3 coverage_handler.py -c ${changed_files} -rj result.json | tr '\n' ' '"
                                if (tests_files_int) {
                                    echo "${tests_files_int}"
                                    tests_for_run_int_vdom = "--files_to_start ${tests_files_int}"
                                }
                            }


                            }

                        }
                        if (regr && !boss) {
                            if (sbis3_controls) {
                            if ( download_coverage_json(version, "reg", "SBIS3.CONTROLS") ) {
                                 tests_files_reg = sh returnStdout: true, script: "python3 coverage_handler.py -c ${changed_files} -rj result.json| tr '\n' ' '"
                                 if (tests_files_reg) {
                                 echo "${tests_files_reg}"
                                     tests_for_run_reg_sbis3 = "--files_to_start ${tests_files_reg}"
                                 }
                               }
                            }
                            if (vdom_controls) {
                                if ( download_coverage_json(version, "reg", "VDOM") ) {
                                 tests_files_reg = sh returnStdout: true, script: "python3 coverage_handler.py -c ${changed_files} -rj result.json| tr '\n' ' '"
                                 if (tests_files_reg) {
                                 echo "${tests_files_reg}"
                                     tests_for_run_reg_vdom = "--files_to_start ${tests_files_reg}"
                                 }
                               }

                            }

                        }
                        if (boss) {
                            tests_files = sh returnStdout: true, script: "python3 coverage_handler.py -c ${changed_files} -d"
                            if ( tests_files ) {
                                (tests_for_run_int_sbis3, tests_for_run_int_vdom, tests_for_run_reg_sbis3, tests_for_run_reg_vdom) = return_test_for_run(tests_files)
                                if (!tests_for_run_int_sbis3) {
                                    run_tests_int_sbis3 = false
                                }
                                if (!tests_for_run_int_vdom) {
                                    run_tests_int_vdom = false
                                }
                                if (!tests_for_run_reg_sbis3) {
                                    run_tests_reg_sbis3 = false
                                }
                                if (!tests_for_run_reg_vdom) {
                                    run_tests_reg_vdom = false
                                }
                            }
                        }
                        }
                    }
                    if ( skip ) {
                        if (sbis3_controls) {
                         skip_tests_int_sbis3 = "--SKIP_TESTS_FROM_JOB '(int-${params.browser_type}) ${version} SBIS3.CONTROLS controls'"
                         skip_tests_reg_sbis3 = "--SKIP_TESTS_FROM_JOB '(reg-${params.browser_type}) ${version} SBIS3.CONTROLS controls'"
                         }
                         if (vdom_controls) {
                         skip_tests_int_vdom = "--SKIP_TESTS_FROM_JOB '(int-${params.browser_type}) ${version} VDOM controls'"
                         skip_tests_reg_vdom = "--SKIP_TESTS_FROM_JOB '(reg-${params.browser_type}) ${version} VDOM controls'"
                         }
                    }

                }

            parallel (
                int_test: {
                    stage("Инт.тесты"){
                        if ( (inte || all_inte) && smoke_result ){
                            echo "Запускаем интеграционные тесты"
                            parallel (
                            int_sbis3: {
                            if (run_tests_int_sbis3) {
                            dir("./controls/tests/int/SBIS3.CONTROLS"){
								timeout(time: 10, unit: 'MINUTES', activity: true) {
									sh """
									source /home/sbis/venv_for_test/bin/activate
									python start_tests.py --RESTART_AFTER_BUILD_MODE ${tests_for_run_int_sbis3} ${run_test_fail} ${skip_tests_int_sbis3} --SERVER_ADDRESS ${server_address} --STREAMS_NUMBER ${stream_number} --JENKINS_CONTROL_ADDRESS jenkins-control.tensor.ru --RECURSIVE_SEARCH True
									deactivate
									"""
								}
                            }
                            }
                            },
                            int_vdom: {

                            if (run_tests_int_vdom) {
                                 dir("./controls/tests/int/VDOM"){
								timeout(time: 10, unit: 'MINUTES', activity: true) {
									sh """
									source /home/sbis/venv_for_test/bin/activate
									python start_tests.py --RESTART_AFTER_BUILD_MODE ${tests_for_run_int_vdom} ${run_test_fail} ${skip_tests_int_vdom} --SERVER_ADDRESS ${server_address} --STREAMS_NUMBER ${stream_number} --JENKINS_CONTROL_ADDRESS jenkins-control.tensor.ru --RECURSIVE_SEARCH True
									deactivate
									"""
								}
                            }

                            }

                            }
                            )
                        }
                    }
                },
                reg_test: {
                    stage("Рег.тесты"){
                        if ( (all_regr || regr) && smoke_result ){
                            echo "Запускаем тесты верстки"
                            parallel(
                            reg_sbis3: {
                            if (run_tests_reg_sbis3) {
                            dir("./controls/tests/reg/SBIS3.CONTROLS"){
								timeout(time: 10, unit: 'MINUTES', activity: true) {
									sh """
										source /home/sbis/venv_for_test/bin/activate
										python start_tests.py --RESTART_AFTER_BUILD_MODE ${tests_for_run_reg_sbis3} ${run_test_fail} ${skip_tests_reg_sbis3} --SERVER_ADDRESS ${server_address} --STREAMS_NUMBER ${stream_number} --JENKINS_CONTROL_ADDRESS jenkins-control.tensor.ru --RECURSIVE_SEARCH True --DISABLE_GPU True
										deactivate
									"""
								}
                            }
                            }
                            },
                            reg_vdom: {
                            if (run_tests_reg_vdom) {
                                dir("./controls/tests/reg/VDOM"){
								timeout(time: 10, unit: 'MINUTES', activity: true) {
									sh """
										source /home/sbis/venv_for_test/bin/activate
										python start_tests.py --RESTART_AFTER_BUILD_MODE ${tests_for_run_reg_vdom} ${run_test_fail} ${skip_tests_reg_vdom} --SERVER_ADDRESS ${server_address} --STREAMS_NUMBER ${stream_number} --JENKINS_CONTROL_ADDRESS jenkins-control.tensor.ru --RECURSIVE_SEARCH True --DISABLE_GPU True
										deactivate
									"""
								}
                            }

                            }
                            }
                        )

                        }
                    }
                }
            )
            }
            if ( !smoke_result ) {
                exception('Стенд неработоспособен (не прошел smoke test).', 'SMOKE TEST FAIL')
            }
} catch (err) {
    echo "ERROR: ${err}"
    currentBuild.result = 'FAILURE'
    gitlabStatusUpdate()
} finally {
    sh """
        sudo chmod -R 0777 ${workspace}
    """
    def exists_dir = fileExists '/home/sbis/Controls'
    if ( exists_dir ){
        sh """
            sudo chmod -R 0777 /home/sbis/Controls
        """
    }
    if ( (all_regr|| regr || inte || all_inte) && (run_tests_int_sbis3 || run_tests_int_vdom  || run_tests_reg_sbis3 || run_tests_reg_vdom) ){
        dir(workspace){
            def exists_jinnee_logs = fileExists './jinnee/logs'
            if ( exists_jinnee_logs ){
                sh """
                7za a log_jinnee -t7z ${workspace}/jinnee/logs
                """
                archiveArtifacts allowEmptyArchive: true, artifacts: '**/log_jinnee.7z', caseSensitive: false
            }


            sh "mkdir logs_ps"
            if ( exists_dir ){
                dir('/home/sbis/Controls'){
                    def files_err = findFiles(glob: 'intest/logs/**/*_errors.log')
                    def files_ps_err = findFiles(glob: 'intest-ps/logs/**/*_errors.log')
                    if ( files_err.length > 0 ){
                        sh "sudo cp -Rf /home/sbis/Controls/intest/logs/**/*_errors.log ${workspace}/logs_ps/intest_errors.log"
                    }
					if (files_ps_err.length > 0){
                        sh "sudo cp -Rf /home/sbis/Controls/intest-ps/logs/**/*_errors.log ${workspace}/logs_ps/intest_ps_errors.log"
                    }
					dir ( workspace ){
						sh """7za a logs_ps -t7z ${workspace}/logs_ps """
						archiveArtifacts allowEmptyArchive: true, artifacts: '**/logs_ps.7z', caseSensitive: false
					}
                }
            }
        }
        archiveArtifacts allowEmptyArchive: true, artifacts: '**/result.db', caseSensitive: false
        junit keepLongStdio: true, testResults: "**/test-reports/*.xml"
        if ( smoke_result ) {
            dir("./controls/tests") {
                def int_title_sbis3 = ''
                def int_title_vdom = ''
                def reg_title_sbis3 = ''
                def reg_title_vdom = ''
                def description = ''

                if (inte) {
                    def int_description_sbis3
                    if (run_tests_int_sbis3) {
                        int_data_sbis3 = build_description("(int-${params.browser_type}) ${version} SBIS3.CONTROLS controls", "./int/SBIS3.CONTROLS/build_description.txt", skip)
                        if ( int_data_sbis3 ) {
                         int_title_sbis3 = int_data_sbis3[0]
                         int_description_sbis3= int_data_sbis3[1]
                         print("in int ${int_description_sbis3}")
                         if ( int_description_sbis3 ) {
                            description += "[INT_SBIS3] ${int_description_sbis3}"
                         }
                    }
                    }
                    if (run_tests_int_vdom) {
                     int_data_vdom = build_description("(int-${params.browser_type}) ${version} VDOM controls", "./int/VDOM/build_description.txt", skip)
                     if ( int_data_vdom ) {
                         int_title_vdom = int_data_vdom[0]
                         int_description_vdom= int_data_vdom[1]
                         print("in int ${int_description_vdom}")
                         if ( int_description_vdom ) {
                            description += "<br>[INT_VDOM] ${int_description_vdom}"
                         }
                    }
                }
                }
                if (regr ) {
                    if (run_tests_reg_sbis3) {
                    reg_data_sbis3 = build_description("(reg-${params.browser_type}) ${version} SBIS3.CONTROLS controls", "./reg/SBIS3.CONTROLS/build_description.txt", skip)
                    if ( reg_data_sbis3 ) {
                        reg_title_sbis3 = reg_data_sbis3[0]
                        reg_description_sbis3 = reg_data_sbis3[1]
                        print("in reg ${reg_description_sbis3}")
                        if ( description != reg_description_sbis3 ) {
                            description += "<br>[REG_SBIS3] ${reg_description_sbis3}"
                        }
                    }
                }
                }
                if (run_tests_reg_vdom) {
                    reg_data_vdom = build_description("(reg-${params.browser_type}) ${version} VDOM controls", "./reg/VDOM/build_description.txt", skip)
                    if ( reg_data_vdom ) {
                        reg_title_vdom = reg_data_vdom[0]
                        reg_description_vdom = reg_data_vdom[1]
                        print("in reg ${reg_description_vdom}")
                        if ( description != reg_description_vdom ) {
                            description += "<br>[REG_VDOM] ${reg_description_vdom}"
                        }
                    }

                }

                build_title(int_title_sbis3, int_title_vdom, reg_title_sbis3, reg_title_vdom)
                currentBuild.description = "${description}"
            }
        }
    }
    if ( unit ){
        junit keepLongStdio: true, testResults: "**/artifacts/*.xml"
    }
    if ( (regr || all_regr) && (run_tests_reg_sbis3 || run_tests_reg_vdom)){
        if (sbis3_controls) {
            dir("./controls/tests/reg/SBIS3.CONTROLS"){
                sh """mkdir -p reporter"""
                sh """mv capture_report/report.html reporter/report.html"""
                sh """mv capture_report/report.js reporter/report.js"""
                sh """mv capture_report/report.css reporter/report.css"""
                publishHTML([allowMissing: true, alwaysLinkToLastBuild: false, keepAll: false, reportDir: './reporter/', reportFiles: 'report.html', reportName: 'Regression Report SBIS3.CONTROLS', reportTitles: ''])
            }
        }
        if (vdom_controls) {
            dir("./controls/tests/reg/VDOM"){
                sh """mkdir -p reporter"""
                sh """mv capture_report/report.html reporter/report.html"""
                sh """mv capture_report/report.js reporter/report.js"""
                sh """mv capture_report/report.css reporter/report.css"""
                publishHTML([allowMissing: true, alwaysLinkToLastBuild: false, keepAll: false, reportDir: './reporter/', reportFiles: 'report.html', reportName: 'Regression Report VDOM', reportTitles: ''])
            }
        }
        archiveArtifacts allowEmptyArchive: true, artifacts: '**/report.zip', caseSensitive: false
    }
    gitlabStatusUpdate()
    if (!run_tests_int_sbis3 && !run_tests_int_vdom && !run_tests_reg_sbis3 && !run_tests_reg_vdom ) {
        currentBuild.displayName = "#${env.BUILD_NUMBER} TEST BY COVERAGE"
        currentBuild.description = "Нет тестов для запуска по изменениям в ветке"
    }
        }
    }
    LocalDateTime end_time = LocalDateTime.now();
    echo "Время завершения: ${end_time}"
    Duration duration = Duration.between(end_time, start_time);
    diff_time = Math.abs(duration.toMinutes());
    echo "Время сборки: ${diff_time} мин."
}
