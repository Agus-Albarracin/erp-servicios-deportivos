# Planificación previa para GitHub Projects

Prioridad de esta regla: **CRÍTICA**, por preferencia explícita del usuario.

## Cuándo aplicarla

Antes de implementar una funcionalidad, corrección, refactorización, cambio de
configuración o documentación, presentar en la conversación los ítems propuestos
para GitHub Projects. Se permite inspeccionar código y contexto primero para
definir un alcance concreto. No comenzar a modificar archivos de la tarea sin
haber presentado la propuesta. Las consultas informativas y revisiones sin
cambios no necesitan generar ítems.

Si la tarea ya tiene un issue o ítem, reutilizarlo y completar lo que falte.
No proponer duplicados cada vez que el usuario pide un avance o un commit.
Si el pedido es únicamente ordenar o guardar cambios ya realizados, proponer
ítems retrospectivos, identificarlos como tales y no fingir planificación previa.

## Tamaño y contenido

Un ítem representa un resultado verificable, no un archivo ni un commit. Una
funcionalidad pequeña necesita un solo ítem; dividir las grandes por resultados
que se puedan revisar de forma independiente. Usar un ítem padre cuando ayude
a coordinar cambios de server, client y backoffice.

Presentar cada ítem listo para copiar, en español:

```markdown
### PLAN-01 · <Título concreto orientado al resultado>
- Tipo: feat | fix | refactor | docs | chore
- Prioridad sugerida: <según impacto; no siempre crítica>
- Repositorios afectados: <server / client / backoffice>
- Objetivo y alcance: <qué cambia y para quién>
- Criterios de aceptación:
  - [ ] <comportamiento observable>
  - [ ] <validación adecuada al cambio>
- Dependencias: <otro ítem, contrato o ninguna>
- Rama propuesta: <feat|fix|refactor|docs|chore>/<descripcion>
- Avances previstos: <divisiones coherentes que podrían convertirse en commits>
```

`PLAN-01` es una referencia local de la propuesta, no un número de issue de
GitHub. Usar la URL o el número real únicamente cuando estén verificados.
Los campos de tipo y prioridad son sugerencias: no suponer que el Project ya
tiene campos con esos nombres. No inventar responsables, fechas ni estimaciones.
Para un ajuste trivial, condensar la ficha en unas pocas líneas manteniendo
objetivo, aceptación, repositorio y rama.

## Continuidad, ramas y commits

Una vez presentada la propuesta, continuar con el trabajo ya autorizado.
Esta regla exige proponer ítems, no pedir una aprobación adicional ni esperar
a que el usuario los cargue en GitHub. Si falta una decisión indispensable,
consultarla sin detener el trabajo independiente.

Crear la rama de cada tarea independiente desde `main` actualizada, antes de editar. Si hay cambios sin commit, preservarlos y no descartarlos para cambiar de rama. Una rama por funcionalidad;
si afecta varios repositorios, usar el mismo nombre en los involucrados y declarar
la base real. Si depende de una rama aún no integrada, indicarlo explícitamente.
Conservar cambios ajenos. Si hay varios trabajos simultáneos, considerar worktrees.

Mantener una correspondencia entre ítem, rama, commits y validaciones. Al cerrar
la tarea, informar qué criterios se cumplieron, los hashes creados y lo pendiente.
Si cambia el alcance, ajustar la propuesta antes de implementar la ampliación.
No crear un ítem nuevo por cada commit ni obligar a tener commits vacíos para
satisfacer el plan. La organización de ramas corresponde a git-workflow-and-versioning;
el agrupamiento y la preparación precisa de commits corresponden a atomic-commits.

## Publicación en GitHub

Preparar la propuesta localmente no autoriza crear issues, editar un Project,
publicar comentarios ni hacer push. Publicar solo con autorización explícita
vigente del usuario y con repositorio y Project identificados. Reutilizar la
autorización existente sin volver a pedirla. Verificar el resultado de cada
escritura antes de informar que un ítem fue creado o actualizado.

Si no hay acceso al Project o no se conoce su destino, entregar los textos
listos para copiar y continuar con la implementación autorizada. Nunca afirmar
que los ítems están en GitHub cuando solo se prepararon en la conversación.
