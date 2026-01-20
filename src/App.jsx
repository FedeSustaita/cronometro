import { useState, useEffect, useRef } from 'react'
import './App.css'

const PREPARACION = 3

function App() {
  const [tiempos, setTiempos] = useState([])
  const [tiemposDes, setTiemposDes] = useState([])
  const [repeticiones, setRepeticiones] = useState(1)
  const [descansoIntermedio, setDescansoIntermedio] = useState(false)

  const [enEjecucion, setEnEjecucion] = useState(false)
  const [pausado, setPausado] = useState(false)
  const [termino, setTermino] = useState(false)
  const [confirmandoSalida, setConfirmandoSalida] = useState(false)

  const [segundosRestantes, setSegundosRestantes] = useState(0)
  const [indiceActual, setIndiceActual] = useState(0)
  const [rondaActual, setRondaActual] = useState(1)
  const [modo, setModo] = useState('actividad')

  const audioRef = useRef(
    new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg')
  )

  const beep = () => {
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }

  useEffect(() => {
    let intervalo = null

    if (enEjecucion && !pausado && !confirmandoSalida && segundosRestantes > 0) {
      intervalo = setInterval(() => {
        setSegundosRestantes(prev => prev - 1)
      }, 1000)
    }

    if (
      segundosRestantes === 0 &&
      enEjecucion &&
      !pausado &&
      !confirmandoSalida
    ) {
      beep()
      avanzarFase()
    }

    return () => clearInterval(intervalo)
  }, [enEjecucion, pausado, confirmandoSalida, segundosRestantes])

  const iniciarRutina = (e) => {
    if (e) e.preventDefault()
    if (tiempos.length === 0) return alert('Ingresa tiempos de actividad')

    setIndiceActual(0)
    setRondaActual(1)
    setModo('preparacion')
    setSegundosRestantes(PREPARACION)
    setEnEjecucion(true)
    setPausado(false)
    setTermino(false)
    setConfirmandoSalida(false)
    beep()
  }

  const avanzarFase = () => {

    // 🔵 PREPARACIÓN → ACTIVIDAD
    if (modo === 'preparacion') {
      setModo('actividad')
      setSegundosRestantes(tiempos[indiceActual])
      return
    }

    const esUltimoEjercicio = indiceActual === tiempos.length - 1

    // 🟠 ACTIVIDAD → DESCANSO
    if (modo === 'actividad') {
      const tDescanso =
        tiemposDes[indiceActual] ||
        tiemposDes[tiemposDes.length - 1] ||
        0

      if (tDescanso > 0) {
        if (descansoIntermedio || (esUltimoEjercicio && rondaActual < repeticiones)) {
          setModo('descanso')
          setSegundosRestantes(tDescanso)
          return
        }
      }
    }

    const siguienteIndice = indiceActual + 1

    // 🟣 DESCANSO / ACTIVIDAD → PREPARACIÓN (SIGUIENTE EJERCICIO)
    if (siguienteIndice < tiempos.length) {
      setIndiceActual(siguienteIndice)
      setModo('preparacion')
      setSegundosRestantes(PREPARACION)
      return
    }

    // 🔁 NUEVA RONDA → PREPARACIÓN
    if (rondaActual < repeticiones) {
      setRondaActual(prev => prev + 1)
      setIndiceActual(0)
      setModo('preparacion')
      setSegundosRestantes(PREPARACION)
      return
    }

    // 🏁 FIN
    setEnEjecucion(false)
    setTermino(true)
  }

  const confirmarFinalizar = () => {
    setEnEjecucion(false)
    setPausado(false)
    setTermino(false)
    setConfirmandoSalida(false)
    setSegundosRestantes(0)
  }

  const formatearTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60)
    const secs = segundos % 60
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  if (enEjecucion) {
    const claseFondo = confirmandoSalida
      ? 'pausado'
      : pausado
      ? 'pausado'
      : modo

    return (
      <div className={`pantalla-entrenamiento ${claseFondo}`}>
        <div className="contenedor-reloj">
          {confirmandoSalida ? (
            <div className="menu-confirmacion">
              <h2>¿ESTÁS SEGURO?</h2>
              <div className="botones-accion">
                <button className="btn-control btn-stop" onClick={confirmarFinalizar}>
                  SÍ, FINALIZAR
                </button>
                <button
                  className="btn-control btn-resume"
                  onClick={() => setConfirmandoSalida(false)}
                >
                  VOLVER
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="etiqueta-estado">
                {pausado
                  ? 'PAUSA'
                  : modo === 'preparacion'
                  ? 'PREPÁRATE'
                  : modo.toUpperCase()}
              </h1>

              <div className="reloj-digital">
                {formatearTiempo(segundosRestantes)}
              </div>

              <div className="stats-contenedor">
                <div className="stat-item">
                  <span>RONDA</span>
                  <p>{rondaActual}/{repeticiones}</p>
                </div>
                <div className="stat-item">
                  <span>EJERCICIO</span>
                  <p>{indiceActual + 1}/{tiempos.length}</p>
                </div>
              </div>

              <div className="botones-accion">
                <button
                  className={`btn-control ${pausado ? 'btn-resume' : 'btn-pause'}`}
                  onClick={() => setPausado(!pausado)}
                >
                  {pausado ? 'REANUDAR' : 'PAUSAR'}
                </button>
                <button
                  className="btn-control btn-stop"
                  onClick={() => setConfirmandoSalida(true)}
                >
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
          <span style={{ fontSize: '5rem' }}>🏆</span>
          <h1>¡RUTINA COMPLETADA!</h1>
          <button className="btn-control btn-resume" onClick={iniciarRutina}>
            REPETIR
          </button>
          <button className="btn-control btn-stop" onClick={confirmarFinalizar}>
            INICIO
          </button>
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
            <label>Tiempos de actividad (s):</label>
            <input
              type="text"
              placeholder="Ej: 30, 20, 15"
              required
              onChange={(e) =>
                setTiempos(
                  e.target.value
                    .split(',')
                    .map(t => Number(t.trim()))
                    .filter(t => t > 0)
                )
              }
            />
          </div>

          <div className="campo">
            <label>
              Tiempos de descanso (s)
              <br />
              (poner varios solo si se activa descanso entre ejercicios):
            </label>
            <input
              type="text"
              placeholder="Ej: 10, 15, 10"
              onChange={(e) =>
                setTiemposDes(
                  e.target.value
                    .split(',')
                    .map(t => Number(t.trim()))
                    .filter(t => t > 0)
                )
              }
            />
          </div>

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
            <label>Número de rondas:</label>
            <input
              type="number"
              min="1"
              defaultValue="1"
              onChange={(e) => setRepeticiones(Number(e.target.value))}
            />
          </div>

          <button type="submit" className="btn-iniciar">
            EMPEZAR AHORA
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
