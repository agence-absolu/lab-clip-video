import 'lenis/dist/lenis.css'
import './style.scss'
import '@mux/mux-background-video/html';
import { Scroll } from './Scroll.js'
import { VideoReveal } from './VideoReveal.js'
import { PageAnimation } from './PageAnimation.js'

const progressDash = document.querySelector('.progress-dash')

// Scroll bloqué jusqu'à la fin de l'apparition du titre
const scroll = new Scroll({ progressDash })

const videoReveal = new VideoReveal({
  muxElement: document.querySelector('mux-background-video'),
  canvas: document.querySelector('canvas.reveal'),
})

const pageAnimation = new PageAnimation({
  title: document.querySelector('h1'),
  scrollArrow: document.querySelector('.scroll-arrow'),
  scrollArrowWrap: document.querySelector('.scroll-arrow-wrap'),
  progressDash,
  scroll,
  videoReveal,
})

videoReveal.start()
pageAnimation.start()
