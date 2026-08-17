@echo off
chcp 65001 >nul
setlocal
title 로스트포인트
cd /d "%~dp0"

rem 괄호가 든 환경변수는 if 블록 안에서 깨지므로 미리 담아둔다
set "PF=%ProgramFiles%"
set "PF86=%ProgramFiles(x86)%"

set "WEB=https://roastpoint.pages.dev/"
set "PORT=8791"
set "LOCAL=http://localhost:%PORT%/index.html"

cls
echo.
echo   ==================================================
echo               로스트포인트 실행
echo   ==================================================
echo.
echo   인터넷 연결을 확인하는 중...

curl -s -o nul -m 4 "%WEB%"
if errorlevel 1 goto OFFLINE

echo   인터넷 - 연결됨
goto MENU

:OFFLINE
echo   인터넷 - 연결 안 됨
echo   그래도 [1]이 열릴 수 있습니다. 앱이 저장해둔 사본으로 뜹니다.

:MENU
echo.
echo   --------------------------------------------------
echo    [1] 웹으로 열기   ^<== 권장
echo        %WEB%
echo        폰과 같은 저장 공간을 씁니다.
echo        인터넷이 끊겨도 대부분 그대로 열립니다.
echo.
echo    [2] 이 컴퓨터에서 열기
echo        %LOCAL%
echo        [1]이 정말 안 열릴 때만 쓰세요.
echo        주의 - 저장 공간이 웹과 따로입니다.
echo               여기서 만든 기록은 웹 쪽에서 안 보입니다.
echo.
echo    [Q] 닫기
echo   --------------------------------------------------
echo.

choice /c 12Q /n /t 15 /d 1 /m "   번호를 고르세요 (15초 후 자동으로 1번): "
if errorlevel 3 goto END
if errorlevel 2 goto RUNLOCAL
goto RUNWEB

:RUNWEB
echo.
echo   웹으로 엽니다...
call :OPENURL "%WEB%"
echo.
echo   블루투스로 IKAWA에 연결하려면 [머신] 탭으로 가세요.
timeout /t 3 >nul
goto END

:RUNLOCAL
echo.
echo   이 컴퓨터에서 서버를 켭니다.
echo   * 이 창을 닫으면 앱도 닫힙니다.
echo   * 브라우저가 안 열리면 주소창에 직접 넣으세요: %LOCAL%
echo.
call :OPENURL "%LOCAL%"
python -m http.server %PORT% 2>nul
if not errorlevel 1 goto END
echo.
echo   python 을 찾지 못했습니다. py 로 다시 시도합니다...
py -m http.server %PORT%
if not errorlevel 1 goto END
echo.
echo   파이썬이 없어 서버를 켜지 못했습니다. [1] 웹으로 열기를 쓰세요.
pause
goto END

:OPENURL
set "U=%~1"
if exist "%PF%\Google\Chrome\Application\chrome.exe" goto OC1
if exist "%PF86%\Google\Chrome\Application\chrome.exe" goto OC2
if exist "%PF86%\Microsoft\Edge\Application\msedge.exe" goto OE1
if exist "%PF%\Microsoft\Edge\Application\msedge.exe" goto OE2
start "" "%U%"
goto :eof
:OC1
start "" "%PF%\Google\Chrome\Application\chrome.exe" "%U%"
goto :eof
:OC2
start "" "%PF86%\Google\Chrome\Application\chrome.exe" "%U%"
goto :eof
:OE1
start "" "%PF86%\Microsoft\Edge\Application\msedge.exe" "%U%"
goto :eof
:OE2
start "" "%PF%\Microsoft\Edge\Application\msedge.exe" "%U%"
goto :eof

:END
endlocal
