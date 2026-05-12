import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { AdminButton } from './AdminButton'
import type { Team } from '../types'
import { flattenIntroCardsFromTeams } from '../utils/teamParticipants'

type IntroScreenProps = {
  teams: Team[]
  onStart: () => void
  onAdminClick: () => void
}

const introPosterBase = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}intro-posters/`
const brandAsset = (file: string) =>
  `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}brand/${file}`

// Each marquee row = one couple (same characters/outfits in that row; different rows = different couples).
const INTRO_POSTER_ROWS = [
  ['intro-poster-n01.png', 'intro-poster-n02.png', 'intro-poster-n03.png'],
  ['intro-poster-n04.png', 'intro-poster-n05.png', 'intro-poster-n06.png', 'intro-poster-n07.png'],
  ['intro-poster-n08.png', 'intro-poster-n09.png', 'intro-poster-n10.png', 'intro-poster-n11.png'],
].map((row) => row.map((file) => `${introPosterBase}${file}`)) as readonly [string[], string[], string[]]

function buildMarqueeStrip(urls: readonly string[]): string[] {
  if (urls.length === 0) return []
  const triple = [...urls, ...urls, ...urls]
  return [...triple, ...triple, ...triple]
}

export function IntroScreen({ teams, onStart, onAdminClick }: IntroScreenProps) {
  const title = '신개념 방탈출 소개팅(BAR-O)'
  const chars = Array.from(title)
  const slideNodesRef = useRef<HTMLElement[]>([])

  const marqueeTeams = useMemo(() => {
    if (teams.length > 0) return teams
    return [
      {
        id: '—',
        name: '',
        participants: [{ name: '불러오는 중…', gender: null }],
        coins: 0,
        password: '',
      },
    ] as Team[]
  }, [teams])

  const baseIntroCards = useMemo(() => flattenIntroCardsFromTeams(marqueeTeams), [marqueeTeams])

  const loopIntroCards = useMemo(() => {
    if (baseIntroCards.length === 0) {
      return [{ key: 'empty', name: '—', gender: null as const }]
    }
    if (baseIntroCards.length >= 10) return baseIntroCards
    const copies = Math.ceil(12 / baseIntroCards.length)
    return Array.from({ length: copies }, () => baseIntroCards).flat()
  }, [baseIntroCards])

  const startIndex = useMemo(() => {
    // Start from the middle so the carousel can move both directions.
    return Math.floor(loopIntroCards.length / 2)
  }, [loopIntroCards.length])

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: loopIntroCards.length > 1,
    dragFree: false,
    align: 'center',
    containScroll: false,
    startIndex,
  })

  // 카드 순서 기준 자동 성별: 앞쪽 절반 F, 뒤 M (개별 지정이 없을 때만 사용)
  const femaleCount = Math.max(1, Math.floor(Math.max(1, baseIntroCards.length) / 2))

  const getGenderLetter = (teamIndex: number) => {
    const isFemale = teamIndex < femaleCount
    return isFemale ? 'F' : 'M'
  }

  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

  const setSlideNode = useCallback((idx: number) => {
    return (node: HTMLElement | null) => {
      if (!node) return
      slideNodesRef.current[idx] = node
    }
  }, [])

  const applyCoverflow = useCallback(() => {
    if (!emblaApi) return

    const engine = emblaApi.internalEngine()
    const scrollProgress = emblaApi.scrollProgress()
    const snaps = emblaApi.scrollSnapList()
    const slides = slideNodesRef.current

    for (let i = 0; i < snaps.length; i += 1) {
      const snap = snaps[i]
      let diffToTarget = snap - scrollProgress

      if (engine.options.loop) {
        // Adjust diffs for loop so center tilt behaves correctly.
        engine.slideLooper.loopPoints.forEach((loopPoint) => {
          const target = loopPoint.target()
          if (loopPoint.index === i && target !== 0) {
            const sign = Math.sign(target)
            if (sign === -1) diffToTarget = snap - (1 + scrollProgress)
            if (sign === 1) diffToTarget = snap + (1 - scrollProgress)
          }
        })
      }

      const t = clamp(diffToTarget * 2.25, -1, 1)
      const abs = Math.abs(t)
      const rotateY = t * -48
      const translateZ = (1 - abs) * 140
      const scale = 1 - abs * 0.18
      const opacity = 0.35 + (1 - abs) * 0.65

      const slide = slides[i]
      if (!slide) continue
      slide.style.transform = `perspective(1200px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`
      slide.style.opacity = String(opacity)
      slide.style.zIndex = String(Math.round((1 - abs) * 100))
    }
  }, [emblaApi])

  useEffect(() => {
    emblaApi?.reInit()
    // Ensure we land in the center even after data refresh/re-init.
    emblaApi?.scrollTo(startIndex, true)
    applyCoverflow()
  }, [emblaApi, loopIntroCards, applyCoverflow, startIndex])

  useEffect(() => {
    if (!emblaApi) return
    applyCoverflow()
    emblaApi.on('reInit', applyCoverflow)
    emblaApi.on('scroll', applyCoverflow)
    emblaApi.on('select', applyCoverflow)
    return () => {
      emblaApi.off('reInit', applyCoverflow)
      emblaApi.off('scroll', applyCoverflow)
      emblaApi.off('select', applyCoverflow)
    }
  }, [emblaApi, applyCoverflow])

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Fixed full-viewport layer: not clipped by App `container` / main overflow; reads well on deploy subpaths */}
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-1/2 w-[min(220vw,2800px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.52] sm:opacity-[0.58]"
          style={{ rotate: '-18deg' }}
        >
          {(['left', 'right', 'left'] as const).map((dir, rowIdx) => {
            const speed = rowIdx === 0 ? 'fast' : rowIdx === 1 ? 'mid' : 'slow'
            const rowUrls = INTRO_POSTER_ROWS[rowIdx] ?? INTRO_POSTER_ROWS[0]
            const rowImages = buildMarqueeStrip(rowUrls)
            return (
              <div key={rowIdx} className={rowIdx === 0 ? '' : 'mt-6'}>
                <div className="overflow-hidden">
                  <div
                    className="intro-poster-row"
                    data-dir={dir === 'right' ? 'right' : 'left'}
                    data-speed={speed}
                  >
                    {rowImages.map((src, idx) => (
                      <div
                        key={`${rowIdx}-${src}-${idx}`}
                        className="w-[140px] sm:w-[190px] h-[200px] sm:h-[260px] overflow-hidden rounded-md shadow-[0_16px_60px_rgba(32,26,34,0.18)] bg-white/30"
                      >
                        <img
                          src={src}
                          alt=""
                          className="w-full h-full object-cover"
                          draggable={false}
                          loading="eager"
                          decoding="async"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.0)_18%,rgba(255,255,255,0.55)_56%,rgba(255,255,255,0.82)_100%)]" />
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 py-10 px-4 min-h-0 overflow-x-hidden">
        <div className="relative z-10 w-full max-w-5xl space-y-3">
          <p className="text-center text-[10px] sm:text-xs tracking-[0.4em] text-foreground/60 uppercase">
            Participants
          </p>

          <div className="intro-participants-carousel relative w-screen max-w-[100vw] left-1/2 -translate-x-1/2 py-2">
            <div
              className="embla__viewport intro-marquee-mask overflow-hidden cursor-grab active:cursor-grabbing outline-none ring-0"
              ref={emblaRef}
              tabIndex={0}
              role="region"
              aria-roledescription="carousel"
              aria-label="참가자 카드"
            >
              <div className="embla__container flex gap-4 pl-8 pr-8 py-6 [transform-style:preserve-3d]">
                {loopIntroCards.map((card, idx) => (
                  <div
                    ref={setSlideNode(idx)}
                    className="embla__slide min-w-[160px] sm:min-w-[200px] max-w-[220px] flex-[0_0_auto] will-change-transform transition-[filter] duration-300 [transform-style:preserve-3d]"
                    key={`${card.key}-${idx}`}
                  >
                    <div className="relative h-full overflow-hidden rounded-lg border border-border bg-white/75 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,79,167,0.10),0_18px_55px_rgba(32,26,34,0.16)] aspect-[3/4] flex flex-col select-none">
                      <div
                        className="absolute inset-0 opacity-[0.08] bg-cover bg-center pointer-events-none"
                        style={{
                          backgroundImage:
                            'radial-gradient(circle at 30% 20%, rgba(255,79,167,0.18), transparent 52%), radial-gradient(circle at 80% 70%, rgba(130,102,255,0.16), transparent 58%)',
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.88),rgba(255,255,255,0.65),rgba(255,255,255,0.92))]" />
                      <div className="relative flex-1 flex flex-col items-center justify-center p-3 text-center gap-2">
                        {(() => {
                          const baseIndex =
                            baseIntroCards.length === 0 ? 0 : idx % baseIntroCards.length
                          const genderLetter =
                            card.gender === 'F' || card.gender === 'M'
                              ? card.gender
                              : getGenderLetter(baseIndex)
                          return (
                            <>
                              <span
                                className="text-sm font-semibold text-foreground leading-tight line-clamp-4"
                                style={{ textShadow: '0 1px 0 rgba(255,255,255,0.9)' }}
                              >
                                {card.name}
                              </span>
                              <span
                                className="text-[10px] tracking-widest uppercase text-foreground/65"
                                style={{ textShadow: '0 1px 0 rgba(255,255,255,0.9)' }}
                              >
                                {genderLetter}
                              </span>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative z-10 w-full max-w-lg mystery-card p-8 sm:p-10 overflow-hidden"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 20%, rgba(249,192,89,0.35), transparent 45%)',
            }}
          />
          <div className="relative text-center">
            <div className="mx-auto mb-5 flex justify-center">
              <img
                src={brandAsset('logo.svg')}
                alt="BAR-O"
                className="h-[92px] w-auto max-w-[min(240px,85vw)] object-contain"
                draggable={false}
              />
            </div>

            <div className="text-xs tracking-[0.2em] text-black font-medium">
              윤월주관
            </div>

            <h1 className="mt-3 text-xl leading-snug sm:text-2xl md:text-3xl font-bold mystery-title px-1">
              <motion.span
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.035, delayChildren: 0.12 } },
                }}
                aria-label={title}
              >
                {chars.map((ch, idx) => (
                  <motion.span
                    key={`${ch}-${idx}`}
                    variants={{
                      hidden: { opacity: 0, y: 10, filter: 'blur(6px)' },
                      show: {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] },
                      },
                    }}
                    className="inline-block"
                  >
                    {ch === ' ' ? '\u00A0' : ch}
                  </motion.span>
                ))}
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mt-3 mystery-subtitle leading-relaxed text-sm sm:text-base"
            >
              아래 팀 인증 후 문제를 풀면서 자연스럽게 친해져요.
            </motion.p>

            <div className="mt-8">
              <Button
                onClick={onStart}
                className="w-full rounded-xl border border-pink-300/55 bg-gradient-to-b from-pink-100 to-pink-200/95 text-pink-950 font-semibold py-7 text-lg shadow-[0_10px_28px_rgba(255,79,167,0.16)] hover:from-pink-200 hover:to-pink-300/95 hover:border-pink-400/45 transition-colors"
              >
                <Sparkles className="w-5 h-5 mr-2 text-primary shrink-0" />
                입장하기
              </Button>
            </div>

            <div className="mt-5">
              <AdminButton onClick={onAdminClick} />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
