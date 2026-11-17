import { createRouter, createWebHashHistory } from 'vue-router'
import Accueil from './views/AccueilView.vue'
import Enquete from './views/EnqueteView.vue'
import EtapeView from './views/EtapeView.vue'
import Fresque from './views/FresqueView.vue'
import QrEntry from './views/QrEntryView.vue'

export const router = createRouter({
  // Historique « hash » : fonctionne aussi en fichier unique, sans configuration serveur.
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'accueil', component: Accueil },
    { path: '/enquete/:id', name: 'enquete', component: Enquete, props: (r) => ({ id: Number(r.params.id) }) },
    { path: '/enquete/:id/etape/:ordre', name: 'etape', component: EtapeView, props: (r) => ({ id: Number(r.params.id), ordre: Number(r.params.ordre) }) },
    { path: '/enquete/:id/fresque', name: 'fresque', component: Fresque, props: (r) => ({ id: Number(r.params.id) }) },
    // URL encodée dans les QR codes posés sur place (cf. dossier v1.1, p. 16).
    { path: '/e/:etapeId', name: 'qr', component: QrEntry, props: (r) => ({ etapeId: Number(r.params.etapeId) }) },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
