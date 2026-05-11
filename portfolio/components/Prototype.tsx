'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './Prototype.module.css';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

/* ------------------------------------------------------------------ */
/*  Daten                                                             */
/* ------------------------------------------------------------------ */

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

type Card = {
  id: string;
  title: string;
  rank: string;          // z.B. "A", "K", "Q", "J"
  suit: Suit;
  tagline: string;       // kurzer Untertitel auf der Karte
  body: React.ReactNode; // Inhalt im Info-Panel
};

const CARDS: Card[] = [
  {
    id: 'about',
    title: 'Über mich',
    rank: 'A',
    suit: 'spades',
    tagline: 'Wer ist Fabio?',
    body: (
      <>
        <p>
          Hi, ich bin <strong>Fabio Voelkner</strong>. Ausgebildeter
          Fachinformatiker für Anwendungsentwicklung und gerade dabei,
          meinen Bachelor of Arts in Medienproduktion abzuschließen.
        </p>
        <p>
          Mein Ziel: <strong>Game Designer</strong>. Was ich liebe, ist die
          Schnittstelle zwischen sauberem Code und durchdachtem Spielgefühl
          – Systeme, die sich gut anfühlen, weil jemand wirklich darüber
          nachgedacht hat.
        </p>
        <p>
          In meinem letzten Job habe ich mit <strong>React</strong>{' '}
          gearbeitet, in einem Studienprojekt mit <strong>Angular</strong>.
          Diese Seite hier ist mit Next.js, TypeScript und dnd-kit gebaut –
          und ja, das war Absicht: eine Portfolio-Seite, die selbst ein
          kleines Spielsystem ist.
        </p>
      </>
    ),
  },
  {
    id: 'projects',
    title: 'Projekte',
    rank: 'K',
    suit: 'hearts',
    tagline: 'Was ich gebaut habe',
    body: (
      <>
        <p>
          Eine Auswahl meiner Arbeiten – von Web-Anwendungen bis zu kleinen
          Spielprototypen auf itch.io.
        </p>
        <ul>
          <li>
            <strong>Diese Seite</strong> – Karten-basierte Navigation mit
            dnd-kit, gebaut als Mini-Game-System.
          </li>
          <li>
            <strong>Angular-Studienprojekt</strong> – kollaborative Web-App
            mit komplexem State-Handling.
          </li>
          <li>
            <strong>React-Tools (Ausbildung)</strong> – Produktions-Code in
            einem echten Team-Setup.
          </li>
          <li>
            <strong>Game-Jam-Prototypen</strong> – auf itch.io. Kleine
            Ideen, die als Studie für Mechanik &amp; Game-Feel dienen.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Kontakt',
    rank: 'Q',
    suit: 'diamonds',
    tagline: 'Lass uns reden',
    body: (
      <>
        <p>
          Du suchst jemanden für ein Game-Design-Projekt, ein Praktikum
          oder hast einfach Lust auf einen Austausch? Schreib mir.
        </p>
        <ul className={styles.contactList}>
          <li>
            <span className={styles.contactLabel}>E-Mail</span>
            <a href="mailto:hello@fabio-voelkner.de">hello@fabio-voelkner.de</a>
          </li>
          <li>
            <span className={styles.contactLabel}>LinkedIn</span>
            <a href="#" target="_blank" rel="noreferrer">
              /in/fabio-voelkner
            </a>
          </li>
          <li>
            <span className={styles.contactLabel}>GitHub</span>
            <a href="#" target="_blank" rel="noreferrer">
              github.com/fvoelkner
            </a>
          </li>
          <li>
            <span className={styles.contactLabel}>itch.io</span>
            <a href="#" target="_blank" rel="noreferrer">
              fvoelkner.itch.io
            </a>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'playground',
    title: 'Playground',
    rank: 'J',
    suit: 'clubs',
    tagline: 'Experimente & Dev-Diary',
    body: (
      <>
        <p>
          Hier landet alles, was nicht in eine saubere Projektseite passt:
          UI-Patterns, kleine Game-Feel-Experimente, Notizen aus dem
          Entwicklungsalltag.
        </p>
        <p>
          Aktuell beschäftigt mich: <em>Was macht ein UI-Element</em>{' '}
          <em>&bdquo;spielerisch&ldquo;, ohne kindisch zu wirken?</em> – diese Seite ist
          mein erster ernsthafter Versuch einer Antwort.
        </p>
      </>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Hilfs-Komponenten                                                 */
/* ------------------------------------------------------------------ */

const SUIT_GLYPH: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

/** Visueller Karten-Body – wiederverwendet für Hand-Karten + DragOverlay */
function CardFace({ card }: { card: Card }) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  return (
    <div className={`${styles.cardFace} ${isRed ? styles.cardRed : styles.cardBlack}`}>
      <div className={styles.cornerTL}>
        <span className={styles.cornerRank}>{card.rank}</span>
        <span className={styles.cornerSuit}>{SUIT_GLYPH[card.suit]}</span>
      </div>

      <div className={styles.cardCenter}>
        <span className={styles.cardCenterSuit} aria-hidden>
          {SUIT_GLYPH[card.suit]}
        </span>
        <span className={styles.cardCenterTitle}>{card.title}</span>
        <span className={styles.cardCenterTagline}>{card.tagline}</span>
      </div>

      <div className={styles.cornerBR}>
        <span className={styles.cornerRank}>{card.rank}</span>
        <span className={styles.cornerSuit}>{SUIT_GLYPH[card.suit]}</span>
      </div>
    </div>
  );
}

/** Drop-Zone — useDroppable läuft hier (NICHT in Prototype!),
 *  damit der Hook den DndContext findet. Wird er außerhalb des Providers
 *  aufgerufen, registriert er sich ins Leere und `e.over` ist beim Drop
 *  immer null — das war der eigentliche Bug. */
function DropZone({
  hasCard,
  card,
}: {
  hasCard: boolean;
  card: Card | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'drop-zone' });

  return (
    <div
      ref={setNodeRef}
      className={[
        styles.dropZone,
        isOver ? styles.dropZoneOver : '',
        hasCard ? styles.dropZoneFilled : '',
      ].join(' ')}
      aria-label="Karten-Bereich (ziehe eine Karte hierher)"
    >
      {hasCard && card ? (
        <div className={styles.placedCardWrap}>
          <div className={styles.placedCard}>
            <CardFace card={card} />
          </div>
        </div>
      ) : (
        <div className={styles.dropHintInner}>
          <div className={styles.dropZoneCorner} aria-hidden />
          <p className={styles.dropHint}>
            {isOver ? 'Loslassen, um die Karte zu spielen' : 'Ziehe eine Karte auf den Tisch'}
          </p>
          <div className={styles.dropZoneCornerBR} aria-hidden />
        </div>
      )}
    </div>
  );
}

/** Hand-Karte (im Fan platziert, ziehbar) */
/** Fan-Layout — bestimmt die Position einer Karte im Bogen. */
function fanStyle(idx: number, total: number): React.CSSProperties {
  const mid = (total - 1) / 2;
  const offsetFromMid = idx - mid;
  const angle = offsetFromMid * 6;             // grad pro Schritt
  const yOffset = Math.abs(offsetFromMid) * 10; // Mitte = oben, Ränder leicht abgesenkt
  const xOffset = offsetFromMid * 8;            // leichte horizontale Streuung
  return {
    zIndex: 10 + idx,
    '--angle': `${angle}deg`,
    '--y-offset': `${yOffset}px`,
    '--x-offset': `${xOffset}px`,
    touchAction: 'none',
  } as React.CSSProperties;
}

/** Hand-Karte (im Fan platziert, ziehbar) — nur clientseitig nutzen.
 *  Hintergrund: useDraggable hängt aria-describedby an mit interner ID,
 *  die SSR/Client unterschiedlich vergibt → Hydration-Mismatch.
 *  Daher wird diese Komponente erst nach dem mount gerendert. */
function HandCard({
  card,
  idx,
  total,
  isSelected,
  isDraggingThis,
}: {
  card: Card;
  idx: number;
  total: number;
  isSelected: boolean;
  isDraggingThis: boolean;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: card.id,
    data: { cardId: card.id },
  });

  const style: React.CSSProperties = {
    ...fanStyle(idx, total),
    // Originalkarte bleibt an ihrer Fan-Position; das Ziehen visualisiert
    // der DragOverlay. Während *diese* Karte gezogen wird, blenden wir sie aus.
    opacity: isDraggingThis ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className={[
        styles.handCard,
        isSelected ? styles.handCardSelected : '',
      ].join(' ')}
      style={style}
      {...listeners}
      {...attributes}
      aria-label={`Karte ${card.title} – ziehe sie auf den Tisch`}
    >
      <CardFace card={card} />
    </div>
  );
}

/** Statische Hand-Karte für den Server-Render. Visuell identisch, aber
 *  ohne dnd-kit-Attribute → identischer HTML-Output auf Server & Client. */
function HandCardStatic({
  card,
  idx,
  total,
}: {
  card: Card;
  idx: number;
  total: number;
}) {
  return (
    <div
      className={styles.handCard}
      style={fanStyle(idx, total)}
      aria-label={`Karte ${card.title}`}
    >
      <CardFace card={card} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Haupt-Komponente                                                  */
/* ------------------------------------------------------------------ */

export default function Prototype() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Hydration-Fix: dnd-kit generiert intern IDs (DndDescribedBy-N), die
  // beim Server-Render und Client-Render auseinanderlaufen können.
  // Wir rendern den DndContext daher erst nach dem mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const cardById = useMemo(() => {
    const map = new Map<string, Card>();
    CARDS.forEach((c) => map.set(c.id, c));
    return map;
  }, []);

  // Sensors: kleine Aktivierungs-Distanz vermeidet "versehentliches" Draggen
  // beim Klicken – Drag startet erst nach 6px Bewegung. Das ist der
  // Schlüssel zu einem flüssigen Gefühl.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  // Kombinierter Kollisionsalgorithmus: zuerst Pointer-Position prüfen
  // (der zuverlässigste Weg bei DragOverlay-basierten UIs), als Fallback
  // rectIntersection — falls der Cursor knapp neben der Drop-Zone landet,
  // wird sie trotzdem getroffen, solange das gezogene Element sie überlappt.
  const collisionDetection: CollisionDetection = (args) => {
    const pointer = pointerWithin(args);
    if (pointer.length > 0) return pointer;
    return rectIntersection(args);
  };

  const selectedCard = selectedId ? cardById.get(selectedId) ?? null : null;
  const draggingCard = activeDragId ? cardById.get(activeDragId) ?? null : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveDragId(e.active.id as string);
  }
  function handleDragEnd(e: DragEndEvent) {
    const overId = e.over?.id;
    const id = e.active?.id as string | undefined;
    if (overId === 'drop-zone' && id) {
      setSelectedId(id);
    }
    setActiveDragId(null);
  }
  function handleDragCancel() {
    setActiveDragId(null);
  }

  // Pre-Mount-Render: visuell identische, statische Variante ohne dnd-kit.
  // Sobald mounted = true ist, schalten wir nahtlos auf den interaktiven
  // DndContext-Pfad um.
  if (!mounted) {
    return (
      <div className={styles.wrapper}>
        <header className={styles.hero}>
          <p className={styles.heroKicker}>Portfolio · Game Design &amp; Web</p>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroFirst}>Fabio</span>{' '}
            <span className={styles.heroLast}>Voelkner</span>
          </h1>
          <p className={styles.heroSub}>
            Ziehe eine Karte aus der Hand auf den Tisch, um mehr zu erfahren.
          </p>
        </header>

        <section className={styles.middle}>
          <div
            className={styles.dropZone}
            aria-label="Karten-Bereich (ziehe eine Karte hierher)"
          >
            <div className={styles.dropHintInner}>
              <div className={styles.dropZoneCorner} aria-hidden />
              <p className={styles.dropHint}>Ziehe eine Karte auf den Tisch</p>
              <div className={styles.dropZoneCornerBR} aria-hidden />
            </div>
          </div>
          <aside className={styles.infoPanel}>
            <div className={styles.infoEmpty}>
              <span className={styles.infoEmptyGlyph} aria-hidden>♠ ♥ ♦ ♣</span>
              <h2 className={styles.infoTitle}>Noch keine Karte gespielt.</h2>
              <p className={styles.infoTagline}>
                Wähle unten eine Karte und zieh sie auf den Tisch.
              </p>
            </div>
          </aside>
        </section>

        <section className={styles.hand} aria-label="Karten-Hand">
          <div className={styles.handInner}>
            {CARDS.map((card, idx) => (
              <HandCardStatic
                key={card.id}
                card={card}
                idx={idx}
                total={CARDS.length}
              />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={styles.wrapper}>
        {/* Hero / Titel */}
        <header className={styles.hero}>
          <p className={styles.heroKicker}>Portfolio · Game Design &amp; Web</p>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroFirst}>Fabio</span>{' '}
            <span className={styles.heroLast}>Voelkner</span>
          </h1>
          <p className={styles.heroSub}>
            Ziehe eine Karte aus der Hand auf den Tisch, um mehr zu erfahren.
          </p>
        </header>

        {/* Mittlerer Bereich: Drop-Zone links, Info rechts */}
        <section className={styles.middle}>
          <DropZone hasCard={!!selectedCard} card={selectedCard} />

          <aside className={styles.infoPanel} aria-live="polite">
            {selectedCard ? (
              <>
                <div className={styles.infoHeader}>
                  <span className={styles.infoSuit} aria-hidden>
                    {SUIT_GLYPH[selectedCard.suit]}
                  </span>
                  <div>
                    <h2 className={styles.infoTitle}>{selectedCard.title}</h2>
                    <p className={styles.infoTagline}>{selectedCard.tagline}</p>
                  </div>
                </div>
                <div className={styles.infoBody}>{selectedCard.body}</div>
              </>
            ) : (
              <div className={styles.infoEmpty}>
                <span className={styles.infoEmptyGlyph} aria-hidden>♠ ♥ ♦ ♣</span>
                <h2 className={styles.infoTitle}>Noch keine Karte gespielt.</h2>
                <p className={styles.infoTagline}>
                  Wähle unten eine Karte und zieh sie auf den Tisch.
                </p>
              </div>
            )}
          </aside>
        </section>

        {/* Hand – fest am unteren Rand */}
        <section className={styles.hand} aria-label="Karten-Hand">
          <div className={styles.handInner}>
            {CARDS.map((card, idx) => (
              <HandCard
                key={card.id}
                card={card}
                idx={idx}
                total={CARDS.length}
                isSelected={selectedId === card.id}
                isDraggingThis={activeDragId === card.id}
              />
            ))}
          </div>
        </section>
      </div>

      {/* DragOverlay – die einzige Karte, die während des Drags durchs Bild fliegt.
          Sie ist nicht Teil des Layouts -> keine Kollision mit Fan-Transforms,
          das ist der eigentliche Trick für ein flüssiges Drag-Gefühl. */}
      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.2, 0.9, 0.25, 1)' }}>
        {draggingCard ? (
          <div className={styles.dragGhost}>
            <CardFace card={draggingCard} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
