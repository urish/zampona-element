import { LitElement, html, property } from '@polymer/lit-element';
import { ZamponaSoundEngine } from './sound-engine';
import { notes, INoteInfo } from './zampona-notes';

export class ZamponaElement extends LitElement {
  private soundEngine = new ZamponaSoundEngine();
  @property() private activeNotes = new Set<INoteInfo>();
  @property() labels = true;

  playNote(note: INoteInfo) {
    this.activeNotes.add(note);
    this.soundEngine.playNote(note.pitch);
    this.update(new Map()); // TODO there must be a better way
  }

  stopNote(note: INoteInfo) {
    this.activeNotes.delete(note);
    this.soundEngine.stopNote(note.pitch);
    this.update(new Map()); // TODO there must be a better way
  }

  private get instrumentElement() {
    return this.shadowRoot.querySelector('.instrument') as HTMLDivElement;
  }

  touchevent(e: TouchEvent) {
    const oldNotes = new Set(this.activeNotes);
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.target) {
        const x = touch.pageX - this.instrumentElement.offsetLeft;
        const y = touch.pageY - this.instrumentElement.offsetTop;
        for (const note of notes) {
          const [top, left, height, width] = note.rect;
          if (left < x && left + width > x && top < y && top + height > y) {
            this.playNote(note);
            oldNotes.delete(note);
          }
        }
      }
    }
    for (const note of oldNotes) {
      this.stopNote(note);
    }
  }

  touchend() {
    for (const note of this.activeNotes) {
      this.stopNote(note);
    }
  }

  renderNote(note: INoteInfo) {
    const [top, left, height, width] = note.rect;
    const rectStyle = `
      left: ${left}px;
      top: ${top}px;
      width: ${width}px;
      height: ${height}px;
    `;

    const [highlightY, highlightX] = note.center;
    const highlightStyle = `
      top: ${highlightY}px;
      left: ${highlightX}px;
    `;

    const [labelTop, labelLeft] = note.labelPos;
    const labelStyle = `
      top: ${labelTop}px;
      left: ${labelLeft}px;
    `;
    const highlight = this.activeNotes.has(note);

    return html`
      <div class="note-highlight ${highlight && 'active'}" style="${highlightStyle}"></div>
      <label class="note-label" style="${labelStyle}" ?hidden="${!this.labels}">${note.name}</label>
      <button
        @mousedown="${(e) => e.button === 0 && this.playNote(note)}"
        @mouseup="${(e) => e.button === 0 && this.stopNote(note)}"
        @mouseenter="${
          (e) => {
            e.buttons & 1 && this.playNote(note);
          }
        }"
        @mouseleave="${() => this.stopNote(note)}"
        class="note-button"
        style="${rectStyle}"
      ></button>
    `;
  }

  render() {
    return html`
      <style>
        :host {
          display: block;
          --highlight-radius: 30px;
        }

        [hidden] {
          display: none;
        }

        .instrument {
          position: relative;
          width: 480px;
          height: 320px;
          background: url(/images/zampona-full.png);
          margin: 0 auto;
        }

        .note-button {
          position: absolute;
          background: transparent;
          border: none;
          outline: none;
        }

        .note-label {
          position: absolute;
          color: white;
          margin: -10px 0 0 -50px;
          width: 100px;
          text-align: center;
          pointer-events: none;
        }

        .note-highlight {
          position: absolute;
          height: calc(var(--highlight-radius) * 2);
          width: calc(var(--highlight-radius) * 2);
          border-radius: var(--highlight-radius);
          margin: calc(-1 * var(--highlight-radius)) 0 0 calc(-1 * var(--highlight-radius));
        }

        .note-highlight.active {
          background: radial-gradient(
            circle at center,
            rgba(31, 166, 255, 1) 0,
            rgba(31, 176, 251, 0) 60%
          );
        }
      </style>
      <div
        class="instrument"
        @touchstart="${(e) => this.touchevent(e)}"
        @touchmove="${(e) => this.touchevent(e)}"
        @touchend="${(e) => this.touchend()}"
      >
        ${notes.map((note) => this.renderNote(note))}
      </div>
    `;
  }
}
