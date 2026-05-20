import React, { useMemo, useState } from "react"

type Carte = {
  couleur: string
  valeur: number | string
}

type Joueur = {
  nom: string
  score: number
  main: Carte[]
}

type Action = {
  joueur: number
  pile: Carte[]
  mode: "Souple" | "Strict"
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

function valide(c: Carte, centre: Carte) {
  if (c.couleur === "Joker") return true

  return c.couleur === centre.couleur || c.valeur === centre.valeur
}

function strictOK(cartes: Carte[], centre: Carte) {
  const normales = cartes.filter((c) => c.couleur !== "Joker")

  if (normales.length <= 1) return true

  const couleur = normales.every((c) => c.couleur === centre.couleur)
  const valeur = normales.every((c) => c.valeur === centre.valeur)

  return couleur || valeur
}

function couleurClass(c: string) {
  switch (c) {
    case "Rouge":
      return "bg-red-600"
    case "Bleu":
      return "bg-blue-600"
    case "Vert":
      return "bg-green-600"
    case "Jaune":
      return "bg-yellow-400 text-black"
    case "Violet":
      return "bg-purple-600"
    default:
      return "bg-zinc-700"
  }
}

function ia(main: Carte[], centre: Carte, prochaine?: Carte) {
  const bonnes = main.filter((c) => valide(c, centre))
  const mauvaises = main.filter((c) => !valide(c, centre))

  const utilesPlusTard = main.filter((c) => {
    if (!prochaine) return false

    if (c.couleur === "Joker") return true

    return (
      c.couleur === prochaine.couleur || c.valeur === prochaine.valeur
    )
  })

  const reserve = new Set(utilesPlusTard)

  let jouables = bonnes.filter((c) => !reserve.has(c))

  if (jouables.length === 0) {
    jouables = bonnes
  }

  let pile: Carte[] = []

  if (jouables.length >= 4) {
    pile = melanger(jouables).slice(0, jouables.length)
  } else if (jouables.length >= 2) {
    pile = melanger(jouables).slice(0, Math.max(2, jouables.length))
  } else if (jouables.length === 1) {
    pile = [jouables[0]]

    const cartesInutiles = mauvaises.filter((c) => {
      if (!prochaine) return true

      if (c.couleur === "Joker") return false

      return !(
        c.couleur === prochaine.couleur ||
        c.valeur === prochaine.valeur
      )
    })

    while (pile.length < 3 && cartesInutiles.length > 0) {
      pile.push(cartesInutiles.shift() as Carte)
    }
  }

  if (pile.length === 0 && mauvaises.length > 0) {
    pile = melanger(mauvaises).slice(0, Math.min(3, mauvaises.length))
  }

  if (pile.length >= 2 && pile.length < 3 && mauvaises.length > 0) {
    const bluff = mauvaises.find((c) => !pile.includes(c))

    if (bluff) {
      pile.push(bluff)
    }
  }

  if (pile.length === 1 && mauvaises.length >= 2) {
    pile.push(mauvaises[0])
    pile.push(mauvaises[1])
  }

  let mode: "Souple" | "Strict" = "Souple"

  const cartesValides = pile.filter((c) => valide(c, centre))

  if (
    cartesValides.length >= 3 &&
    strictOK(cartesValides, centre) &&
    Math.random() < 0.6
  ) {
    mode = "Strict"
  }

  pile = melanger(pile)

  return {
    pile,
    mode,
    main: main.filter((c) => !pile.includes(c)),
  }
}

export default function ZoneGrise() {
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
        if (c) j.main.push(c)
      }
    })

    const centres: Carte[] = []

    while (centres.length < 6) {
      const c = deck.pop()

      if (!c) break

      if (c.couleur !== "Joker") {
        centres.push(c)
      }
    }

    return { joueurs, deck, centres }
  }, [])

  const [joueurs, setJoueurs] = useState(setup.joueurs)
  const [deck, setDeck] = useState(setup.deck)
  const [defausse, setDefausse] = useState<Carte[]>([])
  const [centres] = useState(setup.centres)
  const [manche, setManche] = useState(1)
  const [selection, setSelection] = useState<number[]>([])
  const [mode, setMode] = useState<"Souple" | "Strict">("Souple")
  const [phase, setPhase] = useState<"jeu" | "accusation" | "fin">("jeu")
  const [actions, setActions] = useState<Action[]>([])
  const [logs, setLogs] = useState<string[]>([])

  const centre = centres[manche - 1]

  function toggle(i: number) {
    if (selection.includes(i)) {
      setSelection(selection.filter((x) => x !== i))
    } else {
      setSelection([...selection, i])
    }
  }

  function repioche(main: Carte[], d: Carte[], def: Carte[]) {
    let deckLocal = [...d]
    let defausseLocal = [...def]
    const m = [...main]

    while (m.length < 7) {
      if (deckLocal.length === 0) {
        deckLocal = melanger(defausseLocal)
        defausseLocal = []
      }

      const c = deckLocal.pop()

      if (!c) break

      m.push(c)
    }

    return {
      main: m,
      deck: deckLocal,
      defausse: defausseLocal,
    }
  }

  function jouer() {
    if (selection.length === 0) return

    const copie = [...joueurs]

    const pileHumain = selection.map((i) => copie[0].main[i])

    copie[0].main = copie[0].main.filter((_, i) => !selection.includes(i))

    const acts: Action[] = [
      {
        joueur: 0,
        pile: pileHumain,
        mode,
      },
    ]

    for (let i = 1; i < copie.length; i++) {
      const r = ia(copie[i].main, centre, centres[manche])

      copie[i].main = r.main

      acts.push({
        joueur: i,
        pile: r.pile,
        mode: r.mode,
      })
    }

    setJoueurs(copie)
    setActions(acts)
    setPhase("accusation")

    setLogs(
      acts.map(
        (a) =>
          `${copie[a.joueur].nom} joue ${a.pile.length} carte(s) en ${a.mode}`
      )
    )
  }

  function resoudre(accuse: number | null) {
    const copie = [...joueurs]

    const logsRound: string[] = []

    const accusations: { accuse: number; accusateur: number }[] = []

    if (accuse !== null) {
      accusations.push({ accuse, accusateur: 0 })
    }

    actions.forEach((a) => {
      if (a.joueur === 0) return

      let aDenonce = false

      actions.forEach((cible) => {
        if (cible.joueur === a.joueur) return

        let suspicion = 0

        if (cible.mode === "Strict") suspicion += 0.2
        if (cible.pile.length === 3) suspicion += 0.12
        if (cible.pile.length >= 4) suspicion += 0.35

        if (!aDenonce && Math.random() < suspicion) {
          accusations.push({
            accuse: cible.joueur,
            accusateur: a.joueur,
          })

          aDenonce = true
        }
      })
    })

    const joueursDenonces = new Set(accusations.map((a) => a.accuse))

    const resultats = actions.map((a) => {
      const revele = joueursDenonces.has(a.joueur)

      let cartesValides = a.pile.filter((c) => valide(c, centre))

      let triche = cartesValides.length !== a.pile.length

      const strictValide =
        a.mode === "Strict" && strictOK(cartesValides, centre)

      if (a.mode === "Strict" && !strictOK(cartesValides, centre)) {
        triche = true
      }

      const total = revele ? cartesValides.length : a.pile.length

      return {
        joueur: a.joueur,
        total,
        triche,
        strictValide,
        revele,
        totalReel: cartesValides.length,
      }
    })

    const classement = [...resultats].sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total
      }

      if (a.strictValide && !b.strictValide) return -1
      if (b.strictValide && !a.strictValide) return 1

      return 0
    })

    logsRound.push("📊 Classement de la manche :")

    classement.forEach((c, i) => {
      const joueur = copie[c.joueur]

      if (c.revele) {
        logsRound.push(
          `${i + 1}. ${joueur.nom} — ${c.totalReel} carte(s) valides révélées${c.strictValide ? " • Strict valide" : ""}${c.triche ? " • Triche détectée" : ""}`
        )
      } else {
        logsRound.push(
          `${i + 1}. ${joueur.nom} — ${c.total} carte(s) annoncées non révélées`
        )
      }
    })

    const bareme = [2, 1, 1, 0]

    let index = 0
    let position = 0

    while (index < classement.length) {
      const groupe = [classement[index]]

      while (
        index + groupe.length < classement.length &&
        classement[index + groupe.length].total === classement[index].total &&
        classement[index + groupe.length].strictValide === classement[index].strictValide
      ) {
        groupe.push(classement[index + groupe.length])
      }

      const points = bareme[position + groupe.length - 1]

      groupe.forEach((g) => {
        copie[g.joueur].score += points

        logsRound.push(
          `${copie[g.joueur].nom} gagne ${points} point(s)`
        )
      })

      position += groupe.length
      index += groupe.length
    }

    accusations.forEach(({ accuse, accusateur }) => {
      const r = resultats.find((x) => x.joueur === accuse)

      if (!r) return

      if (r.triche) {
        copie[accuse].score -= 1

        logsRound.push(
          `${copie[accusateur].nom} dénonce ${copie[accuse].nom} correctement : ${copie[accuse].nom} perd 1 point`
        )
      } else {
        copie[accusateur].score -= 1

        logsRound.push(
          `${copie[accusateur].nom} accuse à tort ${copie[accuse].nom} et perd 1 point`
        )
      }
    })

    let deckLocal = [...deck]
    let defausseLocal = [...defausse, ...actions.flatMap((a) => a.pile)]

    copie.forEach((j) => {
      const r = repioche(j.main, deckLocal, defausseLocal)

      j.main = r.main
      deckLocal = r.deck
      defausseLocal = r.defausse
    })

    setLogs((l) => [...l, ...logsRound])

    setDeck(deckLocal)
    setDefausse(defausseLocal)
    setJoueurs(copie)

    const scores = copie.map((j) => j.score)

    if (Math.max(...scores) - Math.min(...scores) >= 8 || manche >= 6) {
      setPhase("fin")
      return
    }

    setSelection([])
    setMode("Souple")
    setManche(manche + 1)
    setPhase("jeu")
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-5xl font-bold">🎴 JEU ZONE GRISE + AI</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {joueurs.map((j, i) => (
            <div key={i} className="bg-zinc-800 rounded-2xl p-4">
              <div className="text-2xl font-bold">{j.nom}</div>
              <div className="text-4xl mt-2">{j.score}</div>
              <div>{j.main.length} cartes</div>
            </div>
          ))}
        </div>

        <div className="bg-zinc-800 rounded-2xl p-6">
          <div className="flex gap-4 flex-wrap">
            {centres.map((c, i) => {
              const visible = i < manche + 2

              if (!visible) {
                return (
                  <div
                    key={i}
                    className="w-24 h-36 rounded-2xl bg-zinc-950 border border-zinc-700 flex items-center justify-center"
                  >
                    ?
                  </div>
                )
              }

              return (
                <div
                  key={i}
                  className={`w-24 h-36 rounded-2xl flex flex-col items-center justify-center font-bold ${
                    i === manche - 1
                      ? couleurClass(c.couleur)
                      : "bg-zinc-700 opacity-40"
                  }`}
                >
                  <div>{c.couleur}</div>
                  <div className="text-4xl">{c.valeur}</div>
                </div>
              )
            })}
          </div>
        </div>

        {phase === "jeu" && (
          <div className="bg-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-wrap gap-4">
              {joueurs[0].main.map((c, i) => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className={`w-24 h-36 rounded-2xl border-4 flex flex-col items-center justify-center font-bold transition ${couleurClass(
                    c.couleur
                  )} ${selection.includes(i) ? "border-white scale-110" : "border-transparent"}`}
                >
                  <div>{c.couleur}</div>
                  <div className="text-4xl">{c.valeur}</div>
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setMode("Souple")}
                className={`px-6 py-3 rounded-xl ${mode === "Souple" ? "bg-blue-600" : "bg-zinc-700"}`}
              >
                Souple
              </button>

              <button
                onClick={() => setMode("Strict")}
                className={`px-6 py-3 rounded-xl ${mode === "Strict" ? "bg-red-600" : "bg-zinc-700"}`}
              >
                Strict
              </button>

              <button
                onClick={jouer}
                className="px-6 py-3 rounded-xl bg-green-600"
              >
                Valider
              </button>
            </div>
          </div>
        )}

        {phase === "accusation" && (
          <div className="bg-red-950 rounded-2xl p-6 border border-red-500">
            <div className="text-4xl font-bold mb-6">
              Phase de dénonciation
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {actions
                .filter((a) => a.joueur !== 0)
                .map((a) => (
                  <button
                    key={a.joueur}
                    onClick={() => resoudre(a.joueur)}
                    className="bg-red-600 rounded-2xl p-6 text-left"
                  >
                    <div className="text-2xl font-bold">
                      {joueurs[a.joueur].nom}
                    </div>

                    <div>{a.pile.length} cartes</div>
                    <div>{a.mode}</div>
                  </button>
                ))}
            </div>

            <button
              onClick={() => resoudre(null)}
              className="mt-6 px-6 py-3 rounded-xl bg-zinc-700"
            >
              Ne dénoncer personne
            </button>
          </div>
        )}

        {phase === "fin" && (
          <div className="bg-green-900 rounded-2xl p-8 text-center">
            <div className="text-5xl font-bold mb-6">FIN DE PARTIE</div>

            {[...joueurs]
              .sort((a, b) => b.score - a.score)
              .map((j, i) => (
                <div key={i} className="text-2xl">
                  {i + 1}. {j.nom} — {j.score} pts
                </div>
              ))}
          </div>
        )}

        <div className="bg-zinc-800 rounded-2xl p-6">
          <div className="text-2xl font-bold mb-4">Journal</div>

          {logs.map((l, i) => (
            <div key={i}>• {l}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
