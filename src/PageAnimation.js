import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

// Marge de chaque côté du titre, en part de la largeur de la page
const TITLE_GUTTER = 0.04

/**
 * Animations de la page : apparition du titre lettre par lettre, indicateurs
 * de scroll (flèche, tiret) et animations liées au scroll (réduction du
 * cercle vidéo, disparition de la flèche).
 */
export class PageAnimation {
  constructor({ title, scrollArrow, scrollArrowWrap, progressDash, scroll, videoReveal }) {
    this.title = title
    this.scrollArrow = scrollArrow
    this.scrollArrowWrap = scrollArrowWrap
    this.progressDash = progressDash
    this.scroll = scroll
    this.videoReveal = videoReveal

    this.fitTitle()
    window.addEventListener('resize', this.fitTitle)
    // Au clic sur la flèche, scroll fluide jusqu'au contenu
    this.scrollArrow.addEventListener('click', () => this.scroll.scrollTo('.content'))
  }

  start() {
    this.shrinkCircleOnScroll()
    this.hideArrowOnScroll()
    // Remesure une fois Instrument Serif chargée (sinon on mesure la police de
    // secours) puis fait apparaître le titre : on attend la police pour éviter
    // un saut de taille pendant l'animation
    document.fonts.ready.then(() => this.revealTitle())
  }

  // Titre à la largeur de l'écran : on mesure à une taille de référence,
  // puis on met à l'échelle (la largeur du texte est proportionnelle au font-size)
  fitTitle = () => {
    this.title.style.fontSize = '100px'
    const width = this.title.getBoundingClientRect().width
    // clientWidth exclut la scrollbar verticale, contrairement à innerWidth
    const available = document.documentElement.clientWidth * (1 - TITLE_GUTTER * 2)
    this.title.style.fontSize = `${100 * available / width}px`
  }

  revealTitle() {
    // Découpe en lettres (SplitText ajoute un aria-label au titre pour les
    // lecteurs d'écran), puis remesure : le découpage peut modifier le crénage
    const split = SplitText.create(this.title, { type: 'chars' })
    this.fitTitle()
    // Le titre devient visible, ce sont les lettres qui partent de 0
    gsap.set(this.title, { autoAlpha: 1 })
    // Fade-in lettre par lettre, dans un ordre aléatoire (tiré à chaque chargement).
    // Durée totale : 2,8 s par lettre + 4,2 s de décalage réparti = 7 s
    gsap.from(split.chars, {
      autoAlpha: 0,
      duration: 2.8,
      ease: 'none',
      stagger: { amount: 4.2, from: 'random' },
      // Fin de l'apparition : on libère le scroll et on montre la flèche et le tiret
      onComplete: () => {
        this.scroll.start()
        this.showScrollHints()
      },
    })
  }

  // Flèche en bas de l'entête et tiret de progression : apparaissent en fondu
  // après le titre, quand le scroll est libre
  showScrollHints() {
    gsap.to([this.scrollArrow, this.progressDash], { autoAlpha: 1, duration: 1.5, ease: 'sine.out' })
  }

  // Échelle du cercle pilotée par le scroll : 1 en haut de page, 0 après
  // deux hauteurs d'écran scrollées
  shrinkCircleOnScroll() {
    gsap.to(this.videoReveal, {
      scale: 0,
      ease: 'none',
      scrollTrigger: {
        start: 0,
        // Fonction : recalculée par ScrollTrigger quand la fenêtre est redimensionnée
        end: () => window.innerHeight * 2,
        scrub: true,
      },
    })
  }

  // Disparition de la flèche liée au scroll, sur 30 % d'écran. Elle porte sur le
  // conteneur pour ne pas entrer en conflit avec le fondu d'apparition du bouton ;
  // autoAlpha masque aussi le bouton (visibility), qui n'est alors plus cliquable
  hideArrowOnScroll() {
    gsap.to(this.scrollArrowWrap, {
      autoAlpha: 0,
      ease: 'none',
      scrollTrigger: {
        start: 0,
        end: () => window.innerHeight * 0.3,
        scrub: true,
      },
    })
  }
}
