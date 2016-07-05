chcp 1251

set VERSION=%~1
set SBIS3_number=%~2
set VER=%VERSION:~0,1%%VERSION:~2,1%%VERSION:~4,1%%VERSION:~6,1%
set INTEST_ROOT=C:\inetpub\InTestControls%VER%
set SITE_ROOT=%INTEST_ROOT%
set BOOST_DIR=C:\Program Files\Boost_1_53
set WORK_DIR_TRUNK=\\test-osr-source\d$\���������\%PLATFORM_version%\%SBIS3_number%
set MODULES_FROM=%WORK_DIR%\www\service\������
set MODULES_TO=%INTEST_ROOT%\service\������
set JINNEE_TO=%WORKSPACE%\jinnee

@echo --------------------------------------
@echo ���������� ��������� ���������� � ���� PostgreSQL
@echo --------------------------------------
SET host=sbis-dev6
SET port=5432
SET dbname=css_%VER%
SET username=postgres
SET password=postgres
SET PGPASSWORD=postgres


@echo --------------------------------------
@echo �������� � ��������� Jinnee �� ������
@echo --------------------------------------
@echo ������� Jinnee
@time /t
@if not exist "%WORKSPACE%\1" (
 md "%WORKSPACE%\"
)
robocopy "1" "%JINNEE_TO%" /NP /E /MT /PURGE /LOG:"%WORKSPACE%\LOGS\delete_jinnee_%VERSION%.log"
@if exist "%JINNEE_TO%" (
 rd /s /q "%JINNEE_TO%"
)
del jinnee.zip
@time /t
@echo �������� Jinnee
xcopy "%FINAL_DIR%\jinnee.zip" "%WORKSPACE%\*.*" /y
@if errorlevel 1 (
 @echo "�������� �������� ��� ����������� jinnee"
 rem echo int_test 1 >>%WORK_DIR%\testing.txt
 exit /b 1
 rem goto :ERROR
)
@time /t
@echo ��������� �� ������
@"C:\Program Files\7-Zip\7z" x "%WORKSPACE%\jinnee.zip" -o"%WORKSPACE%" -y >"%WORKSPACE%\extract_jinnee.log"
@if errorlevel 1 (
 @echo "�������� �������� ���������� �� ������"
 echo int_test 1 >>%WORK_DIR%\testing.txt
 exit /b 1
)

rem ----------------------------------
rem ������ ��� ��������� ��
rem -----------------------------------

if exist "%WORKSPACE%\site_%VER%\distrib\InTest.dbschema" (
  del /Q /F "%WORKSPACE%\site_%VER%\distrib\InTest.dbschema"
)

echo ^<?xml version="1.0" encoding="WINDOWS-1251"?^> ^
   ^<deployment_schema template_id="9c69e54b-7b6a-4acb-8b7c-1b0439a7d662" template_name="�������� �����"^> ^
    ^<database compliance="" host="%host%" login="%username%" name="%dbname%" password="%password%" port="%port%" template_id="00fceca1-e956-49ce-b34e-dfb0486272cd" template_name="�������� ��"/^> ^
    ^<host name="%host%" threads="6"/^> ^
   ^</deployment_schema^> > "%WORKSPACE%\site_%VER%\distrib\InTest.dbschema"

if not exist "%WORKSPACE%\site_%VER%\distrib\InTest.dbschema" (
  @echo ---- �� �������� ���� "%WORKSPACE%\site_%VER%\distrib\InTest.dbschema" 
  exit /b 1
)

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
jinnee.exe /project="%WORKSPACE%\site_%VER%\distrib\InTest.s3cld" /deploy_db="%WORKSPACE%\site_%VER%\distrib\InTest.dbschema" /logs_dir="%WORKSPACE%\logs" 
@if not %errorlevel%==0 (
 @echo "�������� �������� ��� �������������� ����"
 rem echo int_test 1 >>%WORK_DIR%\testing.txt
 exit /b 1
)
popd

@echo --------------------------------------
@echo c������� �����������
@echo --------------------------------------
@time /t
@if exist "%WORKSPACE%\InTest.zip" (
 @echo ����� "%WORKSPACE%\InTest.zip"
 del /Q /F "%WORKSPACE%\InTest.zip"
 @echo --- ������� ���� "%WORKSPACE%\InTest.zip"
)
pushd "%JINNEE_TO%"
jinnee.exe /project="%WORKSPACE%\site_%VER%\distrib\InTest.s3cld" /create_distributive="%WORKSPACE%\site_%VER%\distrib\InTest.s3distr" /logs="%WORKSPACE%\Logs\build_distr.log"
if not exist "%WORKSPACE%\InTest.zip" (
 @echo ---- ���� ������ ��� ������ ������������ - �� ������ ���� "%WORKSPACE%\InTest.zip" 
 exit /b 1
)
popd
 
@echo --------------------------------------
@echo ������������� ��������� �����������
@echo --------------------------------------
@time /t
pushd "%JINNEE_TO%"
jinnee.exe /distributive="%WORKSPACE%\InTest.zip" /deploy_distributive="%WORKSPACE%\site_%VER%\distrib\InTest.s3deploy" /logs="%WORKSPACE%\Logs\deploy_distr.log"
@if %errorlevel% NEQ 0 (
 @echo ========= ERROR: ������ ��� ������������� �� ������������, ��� ������ %errorlevel% =======
 exit /b 1
)
popd

@echo --------------------------------------
@echo ������ ����� � ���� � IIS
@echo --------------------------------------
%windir%\system32\inetsrv\appcmd start apppool InTestControls%VER%
%windir%\system32\inetsrv\appcmd start site InTestControls%VER%

