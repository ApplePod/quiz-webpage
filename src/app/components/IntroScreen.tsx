import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { AdminButton } from './AdminButton'
import type { Team } from '../types'

type IntroScreenProps = {
  teams: Team[]
  onStart: () => void
  onAdminClick: () => void
}

const gold = '#f9c059'

const introPosterBase = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}intro-posters/`

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
      { id: '—', name: '팀 로딩 중', coins: 0, password: '' },
    ] as Team[]
  }, [teams])

  const loopTeams = useMemo(() => {
    if (marqueeTeams.length === 0) return marqueeTeams
    if (marqueeTeams.length >= 10) return marqueeTeams
    const copies = Math.ceil(12 / marqueeTeams.length)
    return Array.from({ length: copies }, () => marqueeTeams).flat()
  }, [marqueeTeams])

  const startIndex = useMemo(() => {
    // Start from the middle so the carousel can move both directions.
    return Math.floor(loopTeams.length / 2)
  }, [loopTeams.length])

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: loopTeams.length > 1,
    dragFree: false,
    align: 'center',
    containScroll: false,
    startIndex,
  })

  const femaleCrewTokens = useMemo(() => {
    return '준우 비누 슈엘 알려줘21 겨란후라이 에르나 이부리 포틀'
      .split(' ')
      .map((s) => s.trim())
      .filter(Boolean)
  }, [])

  const maleCrewTokens = useMemo(() => {
    return '석석 with 프위메 깡지 인계동카카시 몬지 냥녕늉'
      .split(' ')
      .map((s) => s.trim())
      .filter(Boolean)
  }, [])

  // Teams in initialData are ordered; we treat the first half as 여자, second half as 남자.
  const femaleCount = Math.max(1, Math.floor(marqueeTeams.length / 2))

  const getGenderAndCrew = (baseIndex: number) => {
    const isFemale = baseIndex < femaleCount
    if (isFemale) {
      const crew = femaleCrewTokens[baseIndex % Math.max(1, femaleCrewTokens.length)]
      return { genderLabel: 'F', genderIcon: 'F', crewName: crew ?? '—' }
    }
    const maleIndex = baseIndex - femaleCount
    const crew = maleCrewTokens[maleIndex % Math.max(1, maleCrewTokens.length)]
    return { genderLabel: 'M', genderIcon: 'M', crewName: crew ?? '—' }
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
  }, [emblaApi, loopTeams, applyCoverflow, startIndex])

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
                        className="w-[140px] sm:w-[190px] h-[200px] sm:h-[260px] overflow-hidden rounded-sm shadow-[0_16px_60px_rgba(0,0,0,0.7)] bg-zinc-900/80"
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,transparent_18%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.82)_100%)]" />
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 py-10 px-4 min-h-0 overflow-x-hidden">
        <div className="relative z-10 w-full max-w-5xl space-y-3">
          <p className="text-center text-[10px] sm:text-xs tracking-[0.4em] text-white/45 uppercase">
            Participants
          </p>

          <div className="intro-participants-carousel relative w-screen max-w-[100vw] left-1/2 -translate-x-1/2 py-2">
            <div
              className="embla__viewport intro-marquee-mask overflow-hidden cursor-grab active:cursor-grabbing outline-none ring-0"
              ref={emblaRef}
              tabIndex={0}
              role="region"
              aria-roledescription="carousel"
              aria-label="참가 팀 카드"
            >
              <div className="embla__container flex gap-4 pl-8 pr-8 py-6 [transform-style:preserve-3d]">
                {loopTeams.map((team, idx) => (
                  <div
                    ref={setSlideNode(idx)}
                    className="embla__slide min-w-[160px] sm:min-w-[200px] max-w-[220px] flex-[0_0_auto] will-change-transform transition-[filter] duration-300 [transform-style:preserve-3d]"
                    key={`${team.id}-${team.name}-${idx}`}
                  >
                    <div className="relative h-full overflow-hidden rounded-sm border border-white/25 bg-black/55 backdrop-blur-sm shadow-[0_0_0_1px_rgba(249,192,89,0.08),0_12px_40px_rgba(0,0,0,0.45)] aspect-[3/4] flex flex-col select-none">
                      <div
                        className="absolute inset-0 opacity-[0.15] bg-cover bg-center pointer-events-none"
                        style={{
                          backgroundImage: 'url("/sherlock/assets/images/menu-bg.png")',
                        }}
                      />
                      <div className="relative flex-1 flex flex-col items-center justify-center p-3 text-center gap-2">
                        <span
                          className="inline-flex h-11 w-11 items-center justify-center border text-lg font-bold text-white"
                          style={{ borderColor: `${gold}55` }}
                        >
                          {team.id}
                        </span>
                        {(() => {
                          const baseIndex = marqueeTeams.length ? idx % marqueeTeams.length : 0
                          const { genderIcon, genderLabel, crewName } = getGenderAndCrew(baseIndex)
                          return (
                            <>
                              <span className="text-sm font-semibold text-white leading-tight line-clamp-3">
                                {crewName}
                              </span>
                              <span className="text-[10px] tracking-widest uppercase text-white/40 flex items-center gap-1">
                                <span className="text-white/60">{genderIcon}</span>
                                {genderLabel}
                              </span>
                            </>
                          )
                        })()}
                      </div>
                      <div
                        className="relative border-t border-white/15 px-2 py-2 text-center text-[11px] tabular-nums"
                        style={{ color: `${gold}cc` }}
                      >
                        {team.coins} coins
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
          className="relative z-10 w-full max-w-lg mystery-card p-8 sm:p-10 overflow-hidden border-[#f9c059]/20"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 20%, rgba(249,192,89,0.35), transparent 45%)',
            }}
          />
          <div className="relative text-center">
            <div className="mx-auto mb-5 w-[104px] h-[104px] border border-white/15 bg-black/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_60px_rgba(249,192,89,0.14)]">
              <img
                src="/brand/logo-white.png"
                alt=""
                className="w-24 h-24 object-contain opacity-95"
                draggable={false}
              />
            </div>

            <div className="text-xs tracking-[0.2em] text-[#f9c059]/85">
              윤월주관
            </div>

            <h1 className="mt-3 text-3xl sm:text-4xl font-bold mystery-title">
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
                className="w-full border font-semibold py-7 text-lg bg-black/30 hover:bg-[#f9c059]/12"
                style={{ borderColor: `${gold}66`, color: '#fff' }}
              >
                <Sparkles className="w-5 h-5 mr-2" style={{ color: gold }} />
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
