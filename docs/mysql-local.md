# MySQL local en Windows

`scripts/start-local-mysql.ps1` inicia una instancia local ya inicializada usando MySQL Server 8.0 instalado en la ruta indicada en el script. Usa `127.0.0.1:3307` y `.local-mysql/data`; no crea la base, usuarios ni migraciones. La carpeta `.local-mysql/` está excluida de Git. El parámetro opcional `-InitFile` ejecuta el archivo SQL proporcionado al iniciar: usarlo solo intencionalmente, nunca versionar credenciales en ese archivo. Esta herramienta no configura ni ejecuta un despliegue.
