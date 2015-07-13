chcp 1251

set VERSION=%~1
set SBIS3_number=%~2
set SITE_ROOT=%DIR_SITE%
set BOOST_DIR=C:\Program Files\Boost_1_53

set MODULES_FROM=%PLATFORMT_DIR%\www\service\������
set MODULES_TO=%DIR_SITE%\service\������
set JINNEE_TO=%WORKSPACE%\jinnee

@echo --------------------------------------
@echo ���������� ��������� ���������� � ���� PostgreSQL
@echo --------------------------------------
SET host=sbis-dev38
SET port=5432
SET dbname=css_%VER%
SET username=postgres
SET password=postgres
SET PGPASSWORD=postgres


@echo --------------------------------------
@echo ����������� DLL ��������� ���� 3.0
@echo --------------------------------------
set DLL=sbis-python300.dll sbis-lib300.dll sbis-loader300.dll sbis-redis-client300.dll sbis-rpc300.dll sbis-rpc-service300.dll sbis-rpc-worker300.exe ^
sbis-xerces300.dll sbis-xml300.dll sbis-communication300.dll sbis-rpc-client300.dll sbis-log-sender300.dll rabbitmq.dll sbis-resources300.dll ^
boost_python-vc100-mt-1_53.dll boost_thread-vc100-mt-1_53.dll boost_system-vc100-mt-1_53.dll icudt51.dll icuuc51.dll sbis-lang300.dll sbis-berkeley300.dll

robocopy "%PLATFORMT_DIR%\test\sbis" "%DIR_SITE%\service" %DLL% /mt 
robocopy "%PLATFORMT_DIR%\test\sbis\������\i18n"	"%DIR_SITE%\service" sbis-lang300.dll 

@echo --------------------------------------
@echo �������� ������
@echo --------------------------------------
@set counter=0
:prev
set flag=true

set MODULES_FROM_PATH=www\service\������
set SOURCE_FOR_COPY=c:\inetpub\tests\css_tmp\%SBIS3_number%
set COPY_MODULS="ws" "%MODULES_FROM_PATH%\������-������" "%MODULES_FROM_PATH%\������ � ��" "%MODULES_FROM_PATH%\Python" "%MODULES_FROM_PATH%\Python Core" "%MODULES_FROM_PATH%\�����������" "www\service\sbis_root" "%MODULES_FROM_PATH%\���������������� ���������" "%MODULES_FROM_PATH%\������������"
@if not exist "%SOURCE_FOR_COPY%" ( 
	md "%SOURCE_FOR_COPY%" 
	@echo ---- ������� ����� %SOURCE_FOR_COPY%
)
"C:\Program Files\7-Zip\7z.exe" x "%PLATFORMT_DIR%\Platforma.7z" %COPY_MODULS% -o"%SOURCE_FOR_COPY%" -y >%SOURCE_FOR_COPY%\log_verstka.log
@if %errorlevel% NEQ 0 (
	@echo -------- ������ ���������� �� ������!
	exit /b 1
)

set MODULES_FROM=%SOURCE_FOR_COPY%\www\service\������
set MODULES_FROM_CLIENT=%SOURCE_FOR_COPY%\client
@echo �������� �������- ������-������
robocopy "%MODULES_FROM%\������-������" "%MODULES_TO%\������-������" /E /MT /PURGE /LOG:"%LOG_SPACE%\copy_moduls_%VERSION%_verstka.log"
@if errorlevel 4 (
	@echo "�������� �������� ��� ����������� �������"
	exit /b 1
)
@echo �������� �������- ������ � ��
robocopy "%MODULES_FROM%\������ � ��" "%MODULES_TO%\������ � ��" /E /MT /PURGE /LOG+:"%LOG_SPACE%\copy_moduls_%VERSION%_verstka.log"
@if errorlevel 4 (
	@echo "�������� �������� ��� ����������� �������"
	exit /b 1
)
@echo �������� �������- Python
robocopy "%MODULES_FROM%\Python" "%MODULES_TO%\Python" /E /MT /PURGE /LOG+:"%LOG_SPACE%\copy_moduls_%VERSION%_verstka.log"
@if errorlevel 4 (
	@echo "�������� �������� ��� ����������� �������"
	exit /b 1
)
@echo �������� �������- Python Core
robocopy "%MODULES_FROM%\Python Core" "%MODULES_TO%\Python Core" /E /MT /PURGE /LOG+:"%LOG_SPACE%\copy_moduls_%VERSION%_verstka.log"
@if errorlevel 4 (
	@echo "�������� �������� ��� ����������� �������"
	exit /b 1
)
@echo �������� �������- �����������
robocopy "%MODULES_FROM%\�����������" "%MODULES_TO%\�����������" /E /MT /PURGE /LOG+:"%LOG_SPACE%\copy_moduls_%VERSION%_verstka.log"
@if errorlevel 4 (
	@echo "�������� �������� ��� ����������� �������"
	exit /b 1
)
@echo �������� �������- ���������������� ���������
robocopy "%MODULES_FROM%\���������������� ���������" "%MODULES_TO%\���������������� ���������" /E /MT /PURGE /LOG+:"%LOG_SPACE%\copy_moduls_%VERSION%_verstka.log"
@if errorlevel 4 (
	@echo "�������� �������� ��� ����������� �������"
	exit /b 1
)
@echo �������� �������- ������������
robocopy "%MODULES_FROM%\������������" "%MODULES_TO%\������������" /E /MT /PURGE /LOG+:"%LOG_SPACE%\copy_moduls_%VERSION%_verstka.log"
@if errorlevel 4 (
	@echo "�������� �������� ��� ����������� �������"
	exit /b 1
)

rd /s /q "%DIR_SITE%\ws"
robocopy "%SOURCE_FOR_COPY%\ws" "%DIR_SITE%\ws" /E /MT /PURGE /LOG:"%LOG_SPACE%\copy_ws_%VERSION%_verstka.log"
@if errorlevel 4 (
	@echo "�������� �������� ��� ����������� �������"
	exit /b 1
)

@echo --------------------------------------
@echo �������� � ��������� Jinnee �� ������
@echo --------------------------------------
@echo ������� Jinnee
@time /t
@if not exist "%WORKSPACE%\1" (
	md "%WORKSPACE%\"
)
robocopy "1" "%JINNEE_TO%" /NP /E /MT /PURGE /LOG:"%LOG_SPACE%\delete_jinnee_%VERSION%_verstka.log"
@if exist "%JINNEE_TO%" (
	rd /s /q "%JINNEE_TO%"
)
del jinnee.zip
@time /t
@echo �������� Jinnee
xcopy "%FINAL_DIR%\jinnee.zip" "%WORKSPACE%\*.*" /y
@if errorlevel 1 (
	@echo "�������� �������� ��� ����������� jinnee"
	exit /b 1
)
@time /t
@echo ��������� �� ������
@"C:\Program Files\7-Zip\7z" x "%WORKSPACE%\jinnee.zip" -o"%WORKSPACE%" -y >"%WORKSPACE%\extract_jinnee.log"
@if errorlevel 1 (
	@echo "�������� �������� ���������� �� ������"
	exit /b 1
)
@time /t
@echo --------------------------------------
@echo ��������� ����� �������
@echo --------------------------------------
pushd "%PLATFORMT_DIR%\script"
py.exe -3 CreateSimpleCloud.py -i "%MODULES_TO%" -o "%MODULES_TO%\����.s3cld" --global-parameters "0" --host "%host%" --port "%port%" --dbname "%dbname%" --username "%username%" --password "%password%" --resources-root "/resources/" --ws-root "/ws/" --site-root "%SITE_ROOT%" --start-window-module "intest" --start-window "./index.xaml" "������-������" "������ � ��" "������" "Python" "Python Core" "�����������" "intest" "���� �������" "���������������� ���������" "������������" "SBIS3.ENGINE" "SBIS3.CONTROLS"
popd

@time /t
@echo --------------------------------------
@echo ������� ������ ��
@echo --------------------------------------
SET sqlDropDB="DROP DATABASE IF EXISTS \"%dbname%\""
SET sqlUserSession="SELECT pg_terminate_backend(procpid) FROM pg_stat_activity WHERE datname = '%dbname%' AND procpid <> pg_backend_pid()"
pushd "C:\Program Files\PostgreSQL\9.1\bin"
psql --host=%host% --port=%port% --username=%username% --command=%sqlDropDB%
@if %errorlevel% GTR 0 ( 
	psql --host=%host% --port=%port% --username=%username% --command=%sqlUserSession% --dbname=%dbname% 
	psql --host=%host% --port=%port% --username=%username% --command=%sqlDROPDB%
)
if %errorlevel% GTR 0 @echo ---- �� ������� ������� ������ ��! ---- & exit /b 1
popd

@echo --------------------------------------
@echo ������������� ���� ������
@echo --------------------------------------
pushd "%JINNEE_TO%"
jinnee.exe /project="%MODULES_TO%\����.s3cld" /deploy_db="%MODULES_TO%\����.dbschema" /logs_dir="%MODULES_TO%\logs" 
@if not %errorlevel%==0 (
	@echo "�������� �������� ��� �������������� ����"
	exit /b 1
)
popd

@echo --------------------------------------
@echo ������ ����� � ���� � IIS
@echo --------------------------------------
%windir%\system32\inetsrv\appcmd start apppool test_css%ver%
%windir%\system32\inetsrv\appcmd start site test_css%ver%


@echo --------------------------------------
@echo ������������ ������� ����������
@echo --------------------------------------
pushd "%JINNEE_TO%"
jinnee.exe /project="%MODULES_TO%\����.s3cld" /deploy_resources="%MODULES_TO%\����.rsschema" /logs_dir="%MODULES_TO%\logs" 
@if not %errorlevel%==0 (
	@echo "�������� �������� ��� ����������� ��������"
	exit /b 1
)
popd