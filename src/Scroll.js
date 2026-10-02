import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Scroll fluide (Lenis) et indicateur de progression.
 *
 * Lenis est piloté par le ticker de GSAP pour que ScrollTrigger reste
 * synchronisé avec la position lissée. Le scroll démarre bloqué : c'est
 * à l'appelant de le libérer avec start().
 */
export class Scroll {
  constructor({ progressDash }) {
    this.lenis = new Lenis()
    this.lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => this.lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)

    // On repart toujours du haut de page (pas de restauration de la
    // position au rechargement), scroll bloqué
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    this.stop()

    // Indicateur de progression (remplace la scrollbar, masquée en CSS) :
    // un tiret qui descend le long du bord droit au fil du scroll
    this.progressDash = progressDash
    this.lenis.on('scroll', this.updateProgress)
    window.addEventListener('resize', this.updateProgress)
    this.updateProgress()
  }

  updateProgress = () => {
    const track = this.progressDash.parentElement.clientHeight - this.progressDash.offsetHeight
    this.progressDash.style.transform = `translateY(${this.lenis.progress * track}px)`
  }

  start() {
    this.lenis.start()
  }

  stop() {
    this.lenis.stop()
  }

  scrollTo(target) {
    this.lenis.scrollTo(target)
  }
}
