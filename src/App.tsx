import { useMemo, useState } from "react"

type Carte = {
  couleur: string
  valeur: number | string
}

type Joueur = {
  nom: string
  score: number
  main: Carte[]
}

const couleurs = ["Bleu", "Rouge", "Jaune", "Vert", "Violet"]
const valeurs = [1, 2, 3, 4, 5]

function melanger<T>(array: T[]): T[] {
  const a = [...array]

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }

  return a
}

function creerDeck(): Carte[] {
  const deck: Carte[] = []

  couleurs.forEach((c) => {
    valeurs.forEach((v) => {
      deck.push({ couleur: c, valeur: v })
      deck.push({ couleur: c, valeur: v })
    })
  })

  for (let i = 0; i < 4; i++) {
    deck.push({ couleur: "Joker", valeur: "★" })
  }

  return melanger(deck)
}

function couleurClass(c: string) {
  switch (c) {
    case "Rouge":
      return "#dc2626"
    case "Bleu":
      return "#2563eb"
    case "Vert":
      return "#16a34a"
    case "Jaune":
      return "#facc15"
    case "Violet":
      return "#9333ea"
    default:
      return "#52525b"
  }
}

export default function App() {
  const setup = useMemo(() => {
    let deck = creerDeck()

    const joueurs: Joueur[] = [
      { nom: "Vous", score: 0, main: [] },
      { nom: "Alice", score: 0, main: [] },
      { nom: "Bob", score: 0, main: [] },
      { nom: "Charlie", score: 0, main: [] },
    ]

    joueurs.forEach((j) => {
      for (let i = 0; i < 7; i++) {
        const c = deck.pop()

        if (c) {
          j.main.push(c)
        }
      }
    })

    return joueurs
  }, [])

  const [joueurs] = useState(setup)

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#18181b",
        color: "white",
        padding: "30px",
        fontFamily: "Arial",
      }}
    >
      <h1
        style={{
          fontSize: "48px",
          marginBottom: "30px",
        }}
      >
        🎴 JEU ZONE GRISE + AI
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        {joueurs.map((j, i) => (
          <div
            key={i}
            style={{
              background: "#27272a",
              borderRadius: "20px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: "bold",
              }}
            >
              {j.nom}
            </div>

            <div
              style={{
                fontSize: "42px",
                marginTop: "10px",
              }}
            >
              {j.score}
            </div>

            <div>{j.main.length} cartes</div>
          </div>
        ))}
      </div>

      <h2
        style={{
          marginBottom: "20px",
          fontSize: "32px",
        }}
      >
        Votre main
      </h2>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {joueurs[0].main.map((c, i) => (
          <div
            key={i}
            style={{
              width: "100px",
              height: "140px",
              borderRadius: "16px",
              background: couleurClass(c.couleur),
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              fontWeight: "bold",
              color: c.couleur === "Jaune" ? "black" : "white",
            }}
          >
            <div>{c.couleur}</div>

            <div
              style={{
                fontSize: "42px",
              }}
            >
              {c.valeur}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}