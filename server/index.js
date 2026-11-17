// API Express minimale (routes publiques du dossier, section « Contrats API »).
// Données lues depuis le même JSON que le front ; à remplacer par PostgreSQL.
import express from 'express'
import cors from 'cors'
import { readFile } from 'node:fs/promises'

const app = express()
app.use(cors())
app.use(express.json())

const load = async () => JSON.parse(await readFile(new URL('../src/data/enquete-pilote.json', import.meta.url), 'utf8'))
const enquetes = async () => [await load()]

app.get('/api/enquetes', async (_req, res) => {
  const list = (await enquetes()).filter((e) => e.statut === 'publie')
  res.json(list.map(({ id, titre, questionCentrale }) => ({ id, titre, questionCentrale })))
})

app.get('/api/enquetes/:id', async (req, res) => {
  const e = (await enquetes()).find((x) => x.id === Number(req.params.id) && x.statut === 'publie')
  e ? res.json(e) : res.status(404).json({ error: 'Enquête introuvable' })
})

app.get('/api/etapes/:id', async (req, res) => {
  for (const e of await enquetes()) {
    const etape = e.etapes.find((s) => s.id === Number(req.params.id))
    if (etape) return res.json({ enqueteId: e.id, etape })
  }
  res.status(404).json({ error: 'Étape introuvable' })
})

app.get('/api/lieux', async (_req, res) => {
  const lieux = (await enquetes()).flatMap((e) => e.etapes.map((s) => s.lieu).filter(Boolean))
  res.json(lieux.filter((l) => l.accessible))
})

// Les routes /api/auth/login et /api/admin/* (rôles éditeur / validateur) sont prévues
// dans le dossier mais hors du périmètre de ce prototype visiteur.

const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => console.log(`API prête sur http://localhost:${PORT}`))
