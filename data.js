/* ═══════════════════════════════════════════
   DECISIÓN FINAL — Mazo de Cartas (data.js)
   16 cartas: 4 oportunidad · 4 crisis · 4 innovación · 4 riesgo

   Reglas de puntuación por carta:
     Mejor opción  = +2
     Aceptable     = +1
     Neutra        =  0
     Mala decisión = -1
   Puntaje mínimo de jugador: 0
   ═══════════════════════════════════════════ */

const DECK = [

  /* ──────────────────────────────────────────
     OPORTUNIDAD (4 cartas)
     ────────────────────────────────────────── */
  {
    id: 1,
    tipo: "oportunidad",
    situacion:
      "Una empresa grande quiere comprar el 30% de tu startup a cambio de abrir distribución en 5 países. Es una oferta única, pero perderías control de decisiones clave.",
    opcionA: "Aceptar la inversión y expandir internacionalmente.",
    opcionB: "Rechazar y buscar crecer con recursos propios.",
    resultadoA:
      "La distribución global triplica tus ventas en un año. Fue la decisión correcta.",
    resultadoB:
      "Crecés despacio pero mantenés el control. No fue mala decisión, pero perdiste una ventana de oportunidad.",
    puntosA: 2,
    puntosB: 1,
    explicacion:
      "En oportunidades de expansión con socios sólidos, aceptar suele generar más valor que el miedo a perder control.",
  },
  {
    id: 2,
    tipo: "oportunidad",
    situacion:
      "Ganaste un concurso de innovación y te ofrecen $50,000 en mentoría o $30,000 en efectivo directo.",
    opcionA: "Tomar la mentoría de $50,000.",
    opcionB: "Tomar el efectivo de $30,000.",
    resultadoA:
      "La mentoría te conecta con inversionistas y mejora tu modelo de negocio radicalmente.",
    resultadoB:
      "El efectivo ayuda a corto plazo, pero no resuelve los problemas de fondo del modelo.",
    puntosA: 2,
    puntosB: 1,
    explicacion:
      "El conocimiento y las conexiones suelen generar más valor a largo plazo que el dinero inmediato.",
  },
  {
    id: 3,
    tipo: "oportunidad",
    situacion:
      "Un influencer famoso te ofrece promocionar tu producto gratis a cambio de ser embajador de marca por un año.",
    opcionA: "Aceptar la alianza con el influencer.",
    opcionB: "Declinar y enfocar el presupuesto en publicidad propia.",
    resultadoA:
      "La campaña se viraliza y ganás miles de clientes nuevos sin gastar en publicidad.",
    resultadoB:
      "Tu publicidad funciona, pero el crecimiento es lento y costoso.",
    puntosA: 2,
    puntosB: 0,
    explicacion:
      "Aprovechar alianzas estratégicas sin costo es una oportunidad que no se debe dejar pasar.",
  },
  {
    id: 4,
    tipo: "oportunidad",
    situacion:
      "Tu competidor principal entra en crisis financiera. Podés contratar a su mejor ingeniero que quedó libre.",
    opcionA: "Contratar al ingeniero inmediatamente.",
    opcionB: "No contratar para evitar conflictos legales con el competidor.",
    resultadoA:
      "El ingeniero aporta conocimiento clave y acelera tu desarrollo 6 meses.",
    resultadoB:
      "No hubo conflictos, pero tampoco avance. Otro competidor lo contrató.",
    puntosA: 2,
    puntosB: 0,
    explicacion:
      "El talento es el recurso más valioso. Si está disponible legalmente, actuar rápido es la mejor decisión.",
  },

  /* ──────────────────────────────────────────
     CRISIS (4 cartas)
     ────────────────────────────────────────── */
  {
    id: 5,
    tipo: "crisis",
    situacion:
      "Tu servidor principal se cae y tu app lleva 8 horas sin funcionar. Los clientes están furiosos en redes sociales.",
    opcionA:
      "Publicar un comunicado transparente y ofrecer compensación.",
    opcionB: "No decir nada y esperar a que se resuelva técnicamente.",
    resultadoA:
      "Los clientes aprecian la honestidad. La mayoría se queda y la reputación mejora.",
    resultadoB:
      "Sin comunicación, los clientes asumen lo peor. Perdés 20% de usuarios.",
    puntosA: 2,
    puntosB: -1,
    explicacion:
      "En una crisis, la transparencia y la comunicación directa siempre minimizan el daño.",
  },
  {
    id: 6,
    tipo: "crisis",
    situacion:
      "Tu socio cofundador decide irse de la empresa y llevarse al equipo de ventas justo antes de una ronda de inversión.",
    opcionA:
      "Negociar una salida ordenada con acuerdos legales claros.",
    opcionB: "Dejarlo ir sin negociación para evitar confrontación.",
    resultadoA:
      "La salida ordenada protege la empresa. Los inversionistas valoran la madurez.",
    resultadoB:
      "Sin acuerdos, el socio se lleva clientes y el equipo. La ronda de inversión se cae.",
    puntosA: 2,
    puntosB: -1,
    explicacion:
      "En crisis internas, negociar con cabeza fría protege el valor de la empresa mejor que evitar el conflicto.",
  },
  {
    id: 7,
    tipo: "crisis",
    situacion:
      "Una nueva regulación gubernamental prohíbe una de las funciones principales de tu producto. Tenés 60 días para adaptarte.",
    opcionA: "Invertir fuerte para adaptar el producto antes del plazo.",
    opcionB: "Ignorar la regulación y seguir operando igual.",
    resultadoA:
      "El producto adaptado cumple la ley y además abre un nicho que no existía antes.",
    resultadoB:
      "Te cierran operaciones temporalmente y la multa es enorme.",
    puntosA: 2,
    puntosB: -1,
    explicacion:
      "Cumplir regulaciones rápidamente puede transformar una crisis en ventaja competitiva.",
  },
  {
    id: 8,
    tipo: "crisis",
    situacion:
      "Una cadena de producción se rompe y no podés entregar pedidos a tus 3 clientes más grandes durante 2 semanas.",
    opcionA:
      "Comunicar el retraso, ofrecer descuento y buscar proveedor alternativo.",
    opcionB:
      "Prometer que se entregará a tiempo y esperar que se resuelva solo.",
    resultadoA:
      "Los clientes aceptan el retraso con la compensación. Encontrás un mejor proveedor.",
    resultadoB:
      "No cumplís la promesa. Perdés la confianza de los 3 clientes.",
    puntosA: 2,
    puntosB: -1,
    explicacion:
      "Prometer lo que no se puede cumplir destruye relaciones comerciales más rápido que admitir un problema.",
  },

  /* ──────────────────────────────────────────
     INNOVACIÓN (4 cartas)
     ────────────────────────────────────────── */
  {
    id: 9,
    tipo: "innovación",
    situacion:
      "Tu equipo propone usar inteligencia artificial para automatizar el servicio al cliente. La inversión es alta pero puede reducir costos un 40%.",
    opcionA: "Invertir en la automatización con IA.",
    opcionB: "Mantener el equipo humano actual sin cambios.",
    resultadoA:
      "La IA reduce costos y mejora tiempos de respuesta. Los clientes están más satisfechos.",
    resultadoB:
      "Los costos siguen subiendo y la competencia que sí automatizó te supera en eficiencia.",
    puntosA: 2,
    puntosB: 0,
    explicacion:
      "La innovación tecnológica requiere inversión, pero no invertir cuando el mercado avanza es más costoso.",
  },
  {
    id: 10,
    tipo: "innovación",
    situacion:
      "Podés lanzar una versión básica de tu nuevo producto ya, o esperar 4 meses para lanzar la versión completa.",
    opcionA: "Lanzar la versión básica ahora (MVP).",
    opcionB: "Esperar 4 meses para lanzar la versión completa.",
    resultadoA:
      "El MVP te da retroalimentación real y ajustás antes de la competencia.",
    resultadoB:
      "Cuando lanzás, un competidor ya copió tu idea con su propio MVP.",
    puntosA: 2,
    puntosB: -1,
    explicacion:
      "En innovación, lanzar rápido y mejorar sobre la marcha suele ser más efectivo que buscar la perfección.",
  },
  {
    id: 11,
    tipo: "innovación",
    situacion:
      "Un desarrollador te ofrece integrar blockchain a tu sistema de pagos. Suena moderno pero tus clientes nunca lo pidieron.",
    opcionA: "Implementar blockchain para diferenciarte.",
    opcionB:
      "No implementar y mejorar lo que los clientes sí pidieron.",
    resultadoA:
      "La implementación es costosa y los clientes no entienden el beneficio. Fue un gasto innecesario.",
    resultadoB:
      "Mejorar lo que los clientes pedían aumenta retención y satisfacción.",
    puntosA: -1,
    puntosB: 2,
    explicacion:
      "Innovar por moda sin validar la necesidad del cliente es un error costoso. La innovación debe resolver problemas reales.",
  },
  {
    id: 12,
    tipo: "innovación",
    situacion:
      "Tenés la oportunidad de crear una alianza con una universidad para desarrollar un nuevo material sostenible para tu producto.",
    opcionA: "Crear la alianza universidad-empresa.",
    opcionB: "No aliarte y seguir con materiales tradicionales.",
    resultadoA:
      "El material nuevo reduce costos un 25% y ganás un premio de sostenibilidad que atrae inversionistas.",
    resultadoB:
      "Seguís igual mientras competidores adoptan materiales más baratos y sostenibles.",
    puntosA: 2,
    puntosB: 0,
    explicacion:
      "Las alianzas con universidades combinan innovación y credibilidad. Rechazarlas limita el crecimiento.",
  },

  /* ──────────────────────────────────────────
     RIESGO (4 cartas)
     ────────────────────────────────────────── */
  {
    id: 13,
    tipo: "riesgo",
    situacion:
      "Te ofrecen invertir todo tu capital disponible en una criptomoneda que ha subido 300% en un mes.",
    opcionA: "Invertir todo en la criptomoneda.",
    opcionB: "No invertir y conservar el capital para operaciones.",
    resultadoA:
      "La criptomoneda se desploma la semana siguiente. Perdés casi todo.",
    resultadoB:
      "Conservás tu capital y podés seguir operando con estabilidad.",
    puntosA: -1,
    puntosB: 2,
    explicacion:
      "Invertir todo en un activo altamente volátil sin diversificar es un riesgo irresponsable para una empresa.",
  },
  {
    id: 14,
    tipo: "riesgo",
    situacion:
      "Querés abrir una segunda sucursal. Podés hacerlo con deuda bancaria o esperar a tener ahorros suficientes.",
    opcionA: "Pedir préstamo y abrir ahora.",
    opcionB: "Esperar y abrir cuando tengas el capital.",
    resultadoA:
      "La segunda sucursal aprovecha la demanda actual y genera ingresos que pagan el préstamo en 8 meses.",
    resultadoB:
      "Cuando tenés el capital, la demanda ya bajó. La sucursal no rinde como esperabas.",
    puntosA: 2,
    puntosB: 1,
    explicacion:
      "El riesgo calculado con deuda puede ser correcto si la oportunidad de mercado es clara y temporal.",
  },
  {
    id: 15,
    tipo: "riesgo",
    situacion:
      "Tu equipo quiere pivotar completamente el producto hacia un mercado que no conocen, abandonando los clientes actuales.",
    opcionA: "Pivotar completamente al nuevo mercado.",
    opcionB:
      "Mantener el mercado actual y explorar el nuevo gradualmente.",
    resultadoA:
      "El nuevo mercado no responde. Perdés los clientes actuales y los nuevos nunca llegan.",
    resultadoB:
      "Mantenés ingresos estables y probás el nuevo mercado sin arriesgar lo que funciona.",
    puntosA: -1,
    puntosB: 2,
    explicacion:
      "Pivotar sin validar el nuevo mercado y abandonando el actual es un riesgo desproporcionado.",
  },
  {
    id: 16,
    tipo: "riesgo",
    situacion:
      "Un contrato gigante aparece, pero exige que entregues en la mitad del tiempo y con el doble de calidad. Si fallás, hay penalización.",
    opcionA: "Aceptar el contrato ambicioso.",
    opcionB: "Rechazar y buscar contratos más realistas.",
    resultadoA:
      "Tu equipo logra cumplir bajo presión extrema. El contrato posiciona tu empresa como líder del sector.",
    resultadoB:
      "Encontrás contratos más seguros pero de menor impacto. Crecés lento pero estable.",
    puntosA: 2,
    puntosB: 1,
    explicacion:
      "Aceptar retos ambiciosos con equipos capaces puede generar resultados transformadores, aunque implique riesgo.",
  },
];
