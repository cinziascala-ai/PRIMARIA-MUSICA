import { DrumGrooveDefinition, DrumPieceDefinition } from '../types/music';

export const DRUM_PIECES: DrumPieceDefinition[] = [
  {
    id: 'cassa',
    name: 'Gran Cassa',
    soundWord: 'BUM!',
    notehead: 'circle',
    staffStep: 1,
    positionLabel: '1° spazio in basso',
    color: '#DC2626',
    tip: 'La Gran Cassa si suona col piede ed è la più bassa di tutte: abita proprio al 1° spazio in basso, con la testina tonda!',
    level: 'base',
  },
  {
    id: 'timpano',
    name: 'Timpano',
    soundWord: 'BOM!',
    notehead: 'circle',
    staffStep: 3,
    positionLabel: '2° spazio dal basso',
    color: '#EA580C',
    tip: 'Il Timpano sta al 2° piano (2° spazio), subito tra la Gran Cassa e il Rullante, e ha un suono grave e rotondo.',
    level: 'avanzato',
  },
  {
    id: 'rullante',
    name: 'Rullante',
    soundWord: 'CIÀ!',
    notehead: 'circle',
    staffStep: 5,
    positionLabel: '3° spazio (nel cuore del pentagramma)',
    color: '#2563EB',
    tip: 'Il Rullante è il protagonista delle mani: abita al 3° spazio, nella parte alta del centro, ed ha la testina tonda!',
    level: 'base',
  },
  {
    id: 'tom_alto',
    name: 'Tom Alto',
    soundWord: 'TUM!',
    notehead: 'circle',
    staffStep: 7,
    positionLabel: '4° spazio (in alto)',
    color: '#4F46E5',
    tip: 'Il Tom Alto sta nel 4° spazio, proprio sotto i piatti, e ha la testina tonda perché è un tamburo con la pelle!',
    level: 'avanzato',
  },
  {
    id: 'charleston',
    name: 'Charleston (Hi-Hat)',
    soundWord: 'TS!',
    notehead: 'x',
    staffStep: 9,
    positionLabel: 'Sopra la 5ª riga, con la X',
    color: '#D97706',
    tip: 'È un piatto metallico! Ecco perché si disegna con una X sopra l\'ultima riga in cima al pentagramma!',
    level: 'base',
  },
  {
    id: 'piatto_crash',
    name: 'Piatto Crash',
    soundWord: 'TSSSH!',
    notehead: 'x',
    staffStep: 10,
    positionLabel: 'Sopra il pentagramma col taglietto, con la X',
    color: '#059669',
    tip: 'Il Crash è il piatto più brillante di tutti: sta ancora più in alto del Charleston e ha la X attraversata da un taglietto!',
    level: 'avanzato',
  },
];

export const DRUM_TIPS = [
  {
    title: 'La Chiave Neutra (le due stanghette)',
    kicker: 'Segreto 1 · Niente Do, Re, Mi',
    body: 'All\'inizio dello spartito per batteria ci sono due piccole barre verticali: significano che ogni spazio indica un tamburo o un piatto diverso, invece di una nota cantata.',
  },
  {
    title: 'Testina Tonda = Tamburi · Testina a X = Piatti',
    kicker: 'Segreto 2 · Riconosci subito il materiale',
    body: 'Se la nota è una pallina nera rotonda si colpisce un tamburo (Cassa, Timpano, Rullante, Tom). Se vedi una X, invece, si colpisce un piatto di metallo (Charleston o Crash)!',
  },
  {
    title: 'Dal basso verso l\'alto come nella realtà',
    kicker: 'Segreto 3 · Piedi giù, mani su',
    body: 'Proprio come quando sei seduto alla batteria: il piede sulla Gran Cassa sta nello spazio più in basso, il Rullante sta al centro e i Piatti brillano in cima!',
  },
];

export const DRUM_GROOVES: DrumGrooveDefinition[] = [
  {
    id: 'marcia',
    title: 'Marcia di Classe Terza',
    description: 'Alterna il passo della Gran Cassa al colpo deciso del Rullante!',
    level: 'base',
    steps: ['cassa', 'rullante', 'cassa', 'rullante'],
  },
  {
    id: 'rock-facile',
    title: 'Ritmo Rock Facile',
    description: 'Un vero giro rock: Cassa, Charleston, Rullante, Charleston!',
    level: 'base',
    steps: ['cassa', 'charleston', 'rullante', 'charleston'],
  },
  {
    id: 'rullata',
    title: 'Scala dei Tamburi',
    description: 'Scendi dai tamburi acuti fino alla Cassa e chiudi col Piatto Crash!',
    level: 'avanzato',
    steps: ['tom_alto', 'timpano', 'cassa', 'piatto_crash'],
  },
  {
    id: 'concerto',
    title: 'Gran Finale da Concerto',
    description: 'Un ritmo completo con Rullante, Charleston, Cassa e Crash finale!',
    level: 'avanzato',
    steps: ['cassa', 'rullante', 'charleston', 'piatto_crash'],
  },
];
