@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 로스트포인트 — 이 창을 닫으면 앱이 꺼집니다

echo.
echo   로스트포인트를 켭니다.
echo.
echo   * 브라우저가 자동으로 열립니다. 안 열리면 아래 주소를 직접 입력하세요:
echo       http://localhost:8791/index.html
echo.
echo   * 블루투스로 IKAWA에 연결하려면 반드시 이 방법으로 여셔야 합니다.
echo     (index.html 을 더블클릭해서 열면 블루투스가 동작하지 않습니다)
echo.
echo   * 다 쓰신 뒤에는 이 창을 닫으세요.
echo.

start "" "http://localhost:8791/index.html"

python -m http.server 8791
if errorlevel 1 (
  echo.
  echo   파이썬을 찾지 못했습니다. py 로 다시 시도합니다...
  py -m http.server 8791
)

pause
