import { useState } from 'react'

function Chevron({ open }) {
  return (
    <svg
      className={`chevron ${open ? 'open' : ''}`}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 5.25 7 9.25l4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Plain-language explanation of the simulator for newcomers.
export default function Guide() {
  const [open, setOpen] = useState(true)

  return (
    <section className="guide">
      <button
        className="guide-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>¿Qué estoy viendo? Guía para principiantes</span>
        <Chevron open={open} />
      </button>

      {open && (
        <div className="guide-body">
          <p>
            Imagina un <strong>tanque de agua industrial</strong>. Por abajo el
            agua se escapa constantemente por un <strong>desagüe</strong>, y por
            arriba una <strong>bomba</strong> lo vuelve a llenar. Tu meta es
            mantener el agua en un <strong>nivel objetivo</strong> (la línea
            naranja) sin quedarte vacío ni que se desborde.
          </p>

          <p>
            El problema: si dejas la bomba siempre al máximo, se desborda; si la
            apagas, se vacía. Aquí entra el <strong>controlador PID</strong>, un
            piloto automático que ajusta la velocidad de la bomba solo, muchas
            veces por segundo, midiendo el <strong>error</strong> (la diferencia
            entre el nivel actual y el objetivo).
          </p>

          <div className="guide-grid">
            <div className="guide-card">
              <h3>Las tres perillas del PID</h3>
              <ul>
                <li>
                  <strong>Kp (Proporcional):</strong> reacciona a qué tan lejos
                  estás del objetivo. Más alto responde más fuerte, pero puede
                  oscilar.
                </li>
                <li>
                  <strong>Ki (Integral):</strong> corrige el error acumulado con
                  el tiempo y elimina la diferencia que se queda pegada.
                </li>
                <li>
                  <strong>Kd (Derivativo):</strong> frena antes de pasarte,
                  suaviza la respuesta y reduce el rebote.
                </li>
              </ul>
            </div>
            <div className="guide-card">
              <h3>Los botones de perturbación</h3>
              <ul>
                <li>
                  <strong>Fuga aleatoria:</strong> abre un escape extra de
                  golpe, como si el tanque se agrietara.
                </li>
                <li>
                  <strong>Caída de presión:</strong> debilita la bomba por un
                  momento, como un bajón de energía.
                </li>
              </ul>
              <p className="guide-tip">
                Pruébalos y observa en la gráfica cómo el controlador recupera
                el nivel por su cuenta.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
