param([string]$InitFile)
$ErrorActionPreference = 'Stop'
$serverRoot = Split-Path -Parent $PSScriptRoot
$dataRoot = Join-Path $serverRoot '.local-mysql'
$mysqlExe = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe'
if (-not (Test-Path -LiteralPath (Join-Path $dataRoot 'data\mysql'))) {
  throw 'No existe el directorio de datos local inicializado.'
}
$mysqlArguments = @(
  '--no-defaults',
  ('--datadir="{0}"' -f (Join-Path $dataRoot 'data')),
  '--port=3307',
  '--bind-address=127.0.0.1',
  '--mysqlx=OFF',
  ('--log-error="{0}"' -f (Join-Path $dataRoot 'mysql.log')),
  ('--pid-file="{0}"' -f (Join-Path $dataRoot 'mysql.pid'))
)
if ($InitFile) { $mysqlArguments += ('--init-file="{0}"' -f $InitFile) }
$mysqlProcess = Start-Process -FilePath $mysqlExe -ArgumentList $mysqlArguments -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 3
if ($mysqlProcess.HasExited) { throw 'MySQL no pudo iniciar. Revisar .local-mysql/mysql.log.' }
Write-Output 'MySQL local iniciado en 127.0.0.1:3307.'
