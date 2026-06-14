@echo off
setlocal
cd /d "%~dp0"

set "NODE_EXE="

where node.exe >nul 2>&1
if not errorlevel 1 set "NODE_EXE=node.exe"

if not defined NODE_EXE (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  )
)

if not defined NODE_EXE (
  if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
  )
)

if not defined NODE_EXE (
  echo.
  echo Node.js bulunamadi.
  echo Lutfen https://nodejs.org adresinden Node.js LTS surumunu kurun.
  echo.
  pause
  exit /b 1
)

"%NODE_EXE%" "scripts\configure-supabase.mjs" --check
if errorlevel 1 (
  echo.
  echo Supabase ayarlari henuz yapilmamis.
  echo Project URL ve Publishable key bilgileri simdi istenecek.
  echo.
  "%NODE_EXE%" "scripts\configure-supabase.mjs"

  if errorlevel 1 (
    echo.
    echo Supabase ayarlari tamamlanamadi.
    pause
    exit /b 1
  )
)

if not exist "node_modules\next\dist\bin\next" (
  echo.
  echo Proje paketleri bulunamadi.
  echo Bu klasorde once "npm install" komutunu calistirin.
  echo.
  pause
  exit /b 1
)

"%NODE_EXE%" "scripts\start-dev.mjs"

if errorlevel 1 (
  echo.
  echo Uygulama baslatilamadi. Yukaridaki hata mesajini kontrol edin.
  pause
)

endlocal
