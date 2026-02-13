"use client"

import { useRef, useEffect, useCallback } from "react"
import Matter from "matter-js"
import "./matrix-rain.css"

const CHARACTERS = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const SPAWN_INTERVAL = 200
const PHYSICS_CHANCE = 0.3
const LETTER_LIFETIME = 8000
const COLLISION_SPARK_LIFETIME = 600
const SHIELD_PULSE_DURATION = 1500
const PERFORMANCE_THRESHOLD = 10

interface MatrixRainCanvasProps {
  loginBoxRef: React.RefObject<HTMLDivElement | null>
  onCollision?: () => void
}

export function MatrixRainCanvas({
  loginBoxRef,
  onCollision,
}: MatrixRainCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const animFrameRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const physicsLettersRef = useRef<Map<number, HTMLDivElement>>(new Map())
  const loginBoxBodyRef = useRef<Matter.Body | null>(null)
  const wallsRef = useRef<Matter.Body[]>([])

  const createCollisionSpark = useCallback((x: number, y: number) => {
    const spark = document.createElement("div")
    spark.className = "collision-spark"
    spark.style.left = `${x}px`
    spark.style.top = `${y}px`
    document.body.appendChild(spark)
    setTimeout(() => spark.remove(), COLLISION_SPARK_LIFETIME)
  }, [])

  // Main physics + rain effect
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Create engine
    const engine = Matter.Engine.create()
    engine.gravity.y = 0.8
    engine.gravity.x = 0
    engineRef.current = engine

    // Create login box static body
    const createLoginBoxBody = () => {
      if (!loginBoxRef.current) return null
      const rect = loginBoxRef.current.getBoundingClientRect()
      return Matter.Bodies.rectangle(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        rect.width,
        rect.height,
        {
          isStatic: true,
          restitution: 0.8,
          friction: 0.3,
          frictionAir: 0.01,
          label: "loginBox",
        }
      )
    }

    // Create walls
    const createWalls = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      return [
        Matter.Bodies.rectangle(w / 2, h + 50, w, 100, {
          isStatic: true,
          label: "ground",
        }),
        Matter.Bodies.rectangle(-50, h / 2, 100, h, {
          isStatic: true,
          label: "leftWall",
        }),
        Matter.Bodies.rectangle(w + 50, h / 2, 100, h, {
          isStatic: true,
          label: "rightWall",
        }),
      ]
    }

    // Initialize bodies
    const loginBody = createLoginBoxBody()
    if (loginBody) {
      loginBoxBodyRef.current = loginBody
      Matter.Composite.add(engine.world, loginBody)
    }

    const walls = createWalls()
    wallsRef.current = walls
    Matter.Composite.add(engine.world, walls)

    // Collision detection
    Matter.Events.on(engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair

        if (bodyA.label === "loginBox" || bodyB.label === "loginBox") {
          const letterBody =
            bodyA.label === "matrixLetter" ? bodyA : bodyB.label === "matrixLetter" ? bodyB : null

          if (letterBody) {
            const letterElement = physicsLettersRef.current.get(letterBody.id)
            if (letterElement) {
              letterElement.classList.add("physics-active")
              createCollisionSpark(
                letterBody.position.x,
                letterBody.position.y
              )
              onCollision?.()

              // Random velocity boost for dynamic bouncing
              Matter.Body.setVelocity(letterBody, {
                x: letterBody.velocity.x + (Math.random() - 0.5) * 5,
                y: letterBody.velocity.y - Math.random() * 3,
              })
            }
          }
        }
      })
    })

    // Performance tracking
    let frameCount = 0
    let lastTime = performance.now()
    let frameDrops = 0
    let lastFrameTime = performance.now()

    // Physics update loop
    const updatePhysics = () => {
      frameCount++
      Matter.Engine.update(engine, 1000 / 60)

      // Update letter positions from physics
      physicsLettersRef.current.forEach((element, bodyId) => {
        const bodies = Matter.Composite.allBodies(engine.world)
        const body = bodies.find((b) => b.id === bodyId)
        if (body) {
          element.style.left = `${body.position.x}px`
          element.style.top = `${body.position.y}px`
          element.style.transform = `rotate(${body.angle}rad)`

          // Remove off-screen letters
          if (
            body.position.y > window.innerHeight + 100 ||
            body.position.x < -100 ||
            body.position.x > window.innerWidth + 100
          ) {
            Matter.Composite.remove(engine.world, body)
            element.remove()
            physicsLettersRef.current.delete(bodyId)
          }
        }
      })

      // Performance monitoring
      const currentTime = performance.now()
      const frameDelta = currentTime - lastFrameTime
      if (frameDelta > 20) {
        frameDrops++
      }
      lastFrameTime = currentTime

      if (currentTime - lastTime > 1000) {
        if (frameDrops > PERFORMANCE_THRESHOLD) {
          engine.gravity.y = 1.2 // Faster falling on low perf
        }
        frameCount = 0
        frameDrops = 0
        lastTime = currentTime
      }

      animFrameRef.current = requestAnimationFrame(updatePhysics)
    }

    // Create matrix letter
    const createMatrixLetter = () => {
      const letter = document.createElement("div")
      letter.className = "matrix-letter"
      letter.textContent =
        CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
      letter.style.left = `${Math.random() * window.innerWidth}px`
      letter.style.top = "-20px"
      container.appendChild(letter)

      if (Math.random() < PHYSICS_CHANCE) {
        // Physics body
        const physicsBody = Matter.Bodies.circle(
          parseFloat(letter.style.left),
          -20,
          8,
          {
            restitution: 0.7,
            friction: 0.1,
            frictionAir: 0.01,
            density: 0.001,
            label: "matrixLetter",
          }
        )

        Matter.Body.setVelocity(physicsBody, {
          x: (Math.random() - 0.5) * 2,
          y: Math.random() * 3 + 2,
        })

        Matter.Composite.add(engine.world, physicsBody)
        physicsLettersRef.current.set(physicsBody.id, letter)
      } else {
        // CSS-only falling animation
        letter.classList.add("falling")
        letter.style.animationDuration = `${Math.random() * 3 + 4}s`
        letter.style.animationDelay = `${Math.random() * 2}s`

        setTimeout(() => {
          if (letter.parentNode) {
            letter.remove()
          }
        }, LETTER_LIFETIME)
      }
    }

    // Start everything
    animFrameRef.current = requestAnimationFrame(updatePhysics)
    intervalRef.current = setInterval(createMatrixLetter, SPAWN_INTERVAL)

    // Cleanup
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      cancelAnimationFrame(animFrameRef.current)

      // Remove all dynamic DOM elements
      physicsLettersRef.current.forEach((el) => el.remove())
      physicsLettersRef.current.clear()

      // Clean container children
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }

      // Remove any sparks left in body
      document
        .querySelectorAll(".collision-spark")
        .forEach((el) => el.remove())

      Matter.Events.off(engine, "collisionStart")
      Matter.World.clear(engine.world, false)
      Matter.Engine.clear(engine)
      engineRef.current = null
      loginBoxBodyRef.current = null
    }
  }, [loginBoxRef, onCollision, createCollisionSpark])

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const engine = engineRef.current
      if (!engine || !loginBoxRef.current) return

      // Update login box body position
      const loginBody = loginBoxBodyRef.current
      if (loginBody) {
        const rect = loginBoxRef.current.getBoundingClientRect()
        Matter.Body.setPosition(loginBody, {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        })
      }

      // Recreate walls
      const oldWalls = wallsRef.current
      oldWalls.forEach((wall) => Matter.Composite.remove(engine.world, wall))

      const w = window.innerWidth
      const h = window.innerHeight
      const newWalls = [
        Matter.Bodies.rectangle(w / 2, h + 50, w, 100, {
          isStatic: true,
          label: "ground",
        }),
        Matter.Bodies.rectangle(-50, h / 2, 100, h, {
          isStatic: true,
          label: "leftWall",
        }),
        Matter.Bodies.rectangle(w + 50, h / 2, 100, h, {
          isStatic: true,
          label: "rightWall",
        }),
      ]
      wallsRef.current = newWalls
      Matter.Composite.add(engine.world, newWalls)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [loginBoxRef])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
    />
  )
}
