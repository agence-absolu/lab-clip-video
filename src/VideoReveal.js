import { lerp } from './utils.js'

// Diamètre du cercle vidéo qui suit la souris, en part de la largeur d'écran
// (0.35 ≈ 500 px sur un écran de 1440 px)
const CIRCLE_DIAMETER = 0.35
// Intensité du lerp de suivi : part de l'écart rattrapée à chaque frame
// (proche de 0 = cercle très en retard, 1 = colle à la souris)
const FOLLOW_EASE = 0.1
// Étirement du cercle : il devient une ellipse allongée dans la direction du
// mouvement, proportionnellement à la vitesse, et redevient rond à l'arrêt
const STRETCH_FACTOR = 0.003 // étirement par px d'écart entre souris et cercle
const STRETCH_MAX = 0 // étirement max (grand axe × 1.6, petit axe ÷ 1.6)
// Intensité du lerp de l'étirement : vitesse à laquelle il suit sa cible
const STRETCH_EASE = 0.1
// Flou du bord du cercle, en part de la largeur d'écran
// (0.1 ≈ 150 px sur un écran de 1440 px)
const EDGE_BLUR = 0.1

/**
 * Vidéo Mux peinte dans un canvas, à l'intérieur d'un cercle qui suit la souris.
 *
 * `scale` (0 à 1) règle la taille du cercle ; il est animé de l'extérieur.
 */
export class VideoReveal {
  scale = 1

  constructor({ muxElement, canvas }) {
    // Le shadow root est « open » : le composant expose le <video> interne via le getter `video`
    this.video = muxElement.video
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')

    // Au chargement, le cercle part du centre de l'écran (souris et position
    // lissée identiques : pas de mouvement ni d'étirement au départ)
    this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    this.smooth = { ...this.pos }
    this.velocity = { x: 0, y: 0 }

    document.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('resize', this.resize)
    this.resize()
  }

  onMouseMove = (e) => {
    this.pos.x = e.clientX
    this.pos.y = e.clientY
  }

  // Taille du buffer = taille de la fenêtre × densité de pixels (net sur écran Retina)
  resize = () => {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = Math.round(window.innerWidth * dpr)
    this.canvas.height = Math.round(window.innerHeight * dpr)
  }

  start() {
    this.render()
  }

  // Peint la vidéo recadrée façon object-fit: cover : on découpe dans la vidéo
  // la zone qui a les proportions du canvas, centrée
  drawVideoCover(context) {
    const { width, height } = context.canvas
    const vw = this.video.videoWidth
    const vh = this.video.videoHeight
    const scale = Math.max(width / vw, height / vh)
    const sw = width / scale
    const sh = height / scale
    const sx = (vw - sw) / 2
    const sy = (vh - sh) / 2
    context.drawImage(this.video, sx, sy, sw, sh, 0, 0, width, height)
  }

  render = () => {
    const { pos, smooth, velocity, ctx, canvas } = this
    smooth.x = lerp(smooth.x, pos.x, FOLLOW_EASE)
    smooth.y = lerp(smooth.y, pos.y, FOLLOW_EASE)
    // L'écart entre la souris et la position lissée sert de vecteur vitesse.
    // On lisse le vecteur (et non l'angle) pour éviter les sauts de rotation à ±180°
    velocity.x = lerp(velocity.x, pos.x - smooth.x, STRETCH_EASE)
    velocity.y = lerp(velocity.y, pos.y - smooth.y, STRETCH_EASE)
    const speed = Math.hypot(velocity.x, velocity.y)
    const angle = Math.atan2(velocity.y, velocity.x)
    const stretch = 1 + Math.min(STRETCH_MAX, speed * STRETCH_FACTOR)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // On attend qu'une frame soit disponible (HAVE_CURRENT_DATA)
    if (this.video.readyState >= 2) {
      ctx.save()
      ctx.beginPath()
      // canvas.width est déjà en pixels physiques (largeur × devicePixelRatio)
      const radius = (CIRCLE_DIAMETER / 2) * canvas.width * this.scale
      const blur = EDGE_BLUR * canvas.width
      // Ellipse orientée selon le mouvement : allongée sur le grand axe, affinée
      // sur le petit, pour garder une surface à peu près constante
      ctx.ellipse(
        smooth.x * devicePixelRatio,
        smooth.y * devicePixelRatio,
        radius * stretch,
        radius / stretch,
        angle,
        0,
        Math.PI * 2,
      )
      // Masque : la forme floutée, puis la vidéo peinte uniquement dedans
      // (source-in reprend l'alpha du masque, d'où des bords adoucis)
      ctx.filter = `blur(${blur}px)`
      ctx.fill()
      ctx.filter = 'none'
      ctx.globalCompositeOperation = 'source-in'
      this.drawVideoCover(ctx)
      ctx.restore()
    }
    requestAnimationFrame(this.render)
  }
}
