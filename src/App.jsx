import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  // Configuración
  const [tiempos, setTiempos] = useState([])
  const [tiempoDes, setTiempoDes] = useState(0)
  const [repeticiones, setRepeticiones] = useState(1)
  const [descansoIntermedio, setDescansoIntermedio] = useState(false)

  // Estado de ejecución
  const [enEjecucion, setEnEjecucion] = useState(false)
  const [pausado, setPausado] = useState(false)
  const [termino, setTermino] = useState(false)
  const [confirmandoSalida, setConfirmandoSalida] = useState(false) // NUEVO: Para la pregunta de seguridad
  
  // Contadores actuales
  const [segundosRestantes, setSegundosRestantes] = useState(0)
  const [indiceActual, setIndiceActual] = useState(0)
  const [rondaActual, setRondaActual] = useState(1)
  const [modo, setModo] = useState('actividad') // actividad | descanso

  const audioRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'))

  const beep = () => {
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(e => console.log("Audio play blocked"));
  }

  // Lógica del Cronómetro Principal
  useEffect(() => {
    let intervalo = null;

    // Solo corre si está en ejecución, NO está pausado y NO está en el menú de confirmación
    if (enEjecucion && !pausado && !confirmandoSalida && segundosRestantes > 0) {
      intervalo = setInterval(() => {
        setSegundosRestantes((prev) => prev - 1);
      }, 1000);
    } else if (segundosRestantes === 0 && enEjecucion && !pausado && !confirmandoSalida) {
      beep();
      avanzarFase();
    }

    return () => clearInterval(intervalo);
  }, [enEjecucion, pausado, confirmandoSalida, segundosRestantes]);

  const iniciarRutina = (e) => {
    if (e) e.preventDefault();
    if (tiempos.length === 0) return alert("Ingresa tiempos de actividad");
    
    setIndiceActual(0);
    setRondaActual(1);
    setModo('actividad');
    setSegundosRestantes(tiempos[0]);
    setEnEjecucion(true);
    setPausado(false);
    setTermino(false);
    setConfirmandoSalida(false);
    beep();
  }

  const avanzarFase = () => {
    if (modo === 'actividad' && descansoIntermedio && tiempoDes > 0) {
      setModo('descanso');
      setSegundosRestantes(tiempoDes);
      return;
    }

    const siguienteIndice = indiceActual + 1;
    if (siguienteIndice < tiempos.length) {
      setIndiceActual(siguienteIndice);
      setModo('actividad');
      setSegundosRestantes(tiempos[siguienteIndice]);
    } 
    else if (rondaActual < repeticiones) {
      if (tiempoDes > 0 && (modo === 'actividad' || !descansoIntermedio)) {
          setModo('descanso');
          setSegundosRestantes(tiempoDes);
      } else {
        nuevaRonda();
      }
    } 
    else {
      setEnEjecucion(false);
      setTermino(true);
      beep();
    }
  }

  const nuevaRonda = () => {
    setRondaActual(prev => prev + 1);
    setIndiceActual(0);
    setModo('actividad');
    setSegundosRestantes(tiempos[0]);
  }

  // Función para resetear de verdad
  const confirmarFinalizar = () => {
    setEnEjecucion(false);
    setPausado(false);
    setTermino(false);
    setConfirmandoSalida(false);
    setSegundosRestantes(0);
  }

  const formatearTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /* ================= RENDER ================= */

  if (enEjecucion) {
    const claseFondo = confirmandoSalida ? 'pausado' : (pausado ? 'pausado' : modo);

    return (
      <div className={`pantalla-entrenamiento ${claseFondo}`}>
        <div className="contenedor-reloj">
          
          {confirmandoSalida ? (
            /* VISTA DE CONFIRMACIÓN */
            <div className="menu-confirmacion">
              <h2>¿Estás seguro de finalizar?</h2>
              <p>Perderás el progreso de esta rutina.</p>
              <div className="botones-accion">
                <button className="btn-control btn-stop" onClick={confirmarFinalizar}>SÍ, FINALIZAR</button>
                <button className="btn-control btn-resume" onClick={() => setConfirmandoSalida(false)}>CANCELAR</button>
              </div>
            </div>
          ) : (
            /* VISTA NORMAL DEL CRONÓMETRO */
            <>
              <h1 className="etiqueta-estado">
                {pausado ? 'PAUSA' : modo.toUpperCase()}
              </h1>
              
              <div className="reloj-digital">
                {formatearTiempo(segundosRestantes)}
              </div>
              
              <div className="stats-contenedor">
                <div className="stat-item">
                  <span>RONDA</span>
                  <p>{rondaActual} / {repeticiones}</p>
                </div>
                <div className="stat-item">
                  <span>EJERCICIO</span>
                  <p>{indiceActual + 1} / {tiempos.length}</p>
                </div>
              </div>

              <div className="botones-accion">
                <button 
                  className={`btn-control ${pausado ? 'btn-resume' : 'btn-pause'}`} 
                  onClick={() => setPausado(!pausado)}
                >
                  {pausado ? 'REANUDAR' : 'PAUSAR'}
                </button>
                
                <button className="btn-control btn-stop" onClick={() => setConfirmandoSalida(true)}>
                  FINALIZAR
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (termino) {
    return (
      <div className="pantalla-final">
        <div className="card-final">
          <span className="emoji-celebracion">🏆</span>
          <h1>¡Rutina Completada!</h1>
          <div className="botones-finales">
            <button className="btn-principal" onClick={iniciarRutina}>Repetir</button>
            <button className="btn-secundario" onClick={confirmarFinalizar}>Configuración</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="formulario-principal">
      <div className="card-form">
        <h2>Configura tu HIIT</h2>
        <form onSubmit={iniciarRutina}>
          <div className="campo">
            <label>Tiempos de actividad (s): </label>
            <input
              type="text"
              placeholder="Ej: 30, 20, 15"
              required
              onChange={(e) =>
                setTiempos(e.target.value.split(',').map(t => Number(t.trim())).filter(t => t > 0))
              }
            />
          </div>
              <br />
          <div className="campo">
            <label>Tiempo de descanso (s): </label>
            <input type="number" placeholder="0" onChange={(e) => setTiempoDes(Number(e.target.value))} />
          </div>
              <br />
          <div className="campo-checkbox">
            <input
              type="checkbox"
              id="descansoInt"
              checked={descansoIntermedio}
              onChange={(e) => setDescansoIntermedio(e.target.checked)}
            />
            <label htmlFor="descansoInt">Descanso entre ejercicios</label>
          </div>
              <br />
          <div className="campo">
            <label>Número de rondas: </label>
            <input type="number" min="1" defaultValue="1" onChange={(e) => setRepeticiones(Number(e.target.value))} />
          </div>
              <br />
          <button type="submit" className="btn-iniciar">EMPEZAR AHORA</button>
        </form>
      </div>
    </div>
  )
}

export default App