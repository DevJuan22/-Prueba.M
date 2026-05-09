// ══════════════════════════════════════════════
//  BANCO DE PALABRAS — Evaluación de Desempeño
//  Se eligen aleatoriamente en cada partida
// ══════════════════════════════════════════════
const WORD_BANK = [
  { word: 'RETROALIMENTACION', clue: 'Información que se devuelve al colaborador sobre su actuación para que pueda mejorar.' },
  { word: 'DESEMPENO',         clue: 'Nivel de rendimiento y resultados que logra un colaborador en el ejercicio de su cargo.' },
  { word: 'COMPETENCIAS',      clue: 'Conocimientos, habilidades y actitudes que hacen eficaz a una persona en su rol.' },
  { word: 'AUTOEVALUACION',    clue: 'Proceso en que el propio colaborador reflexiona y valora su propio rendimiento.' },
  { word: 'INDICADORES',       clue: 'Métricas y datos objetivos usados para medir el cumplimiento de metas y el rendimiento.' },
  { word: 'ENTREVISTA',        clue: 'Conversación formal entre evaluador y evaluado para compartir resultados y acordar compromisos.' },
  { word: 'CARRERA',           clue: 'Trayectoria profesional que gestiona el crecimiento del empleado dentro de la organización.' },
  { word: 'LIDERAZGO',         clue: 'Capacidad de guiar, motivar e influir en un equipo hacia el logro de objetivos.' },
  { word: 'RESULTADOS',        clue: 'Logros concretos y medibles que produce un colaborador en un período determinado.' },
  { word: 'METAS',             clue: 'Objetivos específicos y medibles que se fijan al inicio del período de evaluación.' },
  { word: 'PLAN',              clue: 'Conjunto de acciones de mejora acordadas tras la evaluación de desempeño.' },
  { word: 'NOMINA',            clue: 'Registro de remuneraciones que puede verse afectado por los resultados de la evaluación.' },
  { word: 'RECENCIA',          clue: 'Sesgo que ocurre cuando solo se considera lo sucedido más recientemente al evaluar.' },
  { word: 'OBJETIVO',          clue: 'Propósito o fin concreto que se establece para guiar el trabajo del colaborador.' },
  { word: 'TALENTO',           clue: 'Conjunto de capacidades naturales y desarrolladas de un colaborador.' },
  { word: 'CLIMA',             clue: 'Ambiente laboral percibido por los empleados dentro de la organización.' },
  { word: 'RENDIMIENTO',       clue: 'Medida de la eficiencia y eficacia con que un empleado cumple sus funciones.' },
  { word: 'CAPACITACION',      clue: 'Proceso de formación para mejorar las habilidades y conocimientos del empleado.' },
  { word: 'PRODUCTIVIDAD',     clue: 'Relación entre los resultados obtenidos y los recursos utilizados por un colaborador.' },
  { word: 'MOTIVACION',        clue: 'Impulso interno o externo que lleva al colaborador a actuar y alcanzar sus metas.' },
  { word: 'FEEDBACK',          clue: 'Retroalimentación constructiva que recibe el empleado sobre su trabajo (anglicismo).' },
  { word: 'GESTION',           clue: 'Conjunto de acciones coordinadas para dirigir y administrar el talento humano.' },
  { word: 'PERFIL',            clue: 'Descripción de los requisitos, funciones y competencias de un puesto de trabajo.' },
  { word: 'CARGO',             clue: 'Posición o rol específico que ocupa un colaborador dentro de la organización.' },
  { word: 'EQUIPO',            clue: 'Grupo de personas que trabajan de manera colaborativa hacia un objetivo común.' },
];

// Exportado como variable global (no ES module) para compatibilidad sin bundler
