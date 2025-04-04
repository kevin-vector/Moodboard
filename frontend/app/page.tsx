"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useInView, useAnimation, useScroll } from "framer-motion"
import {
  ArrowRight,
  Sparkles,
  Lock,
  Palette,
  RefreshCw,
  Download,
  ChevronDown,
  Star,
  MousePointer,
  ImageIcon,
  Layers,
  Check,
} from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeDemo, setActiveDemo] = useState("design") // "design", "branding", "creative"
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showScrollHint, setShowScrollHint] = useState(true)

  // Refs for scroll animations
  const heroRef = useRef<HTMLElement | null>(null)
  const featuresRef = useRef<HTMLElement | null>(null)
  const howItWorksRef = useRef<HTMLElement | null>(null)
  const testimonialsRef = useRef<HTMLElement | null>(null)

  // Scroll animation controls
  const { scrollYProgress } = useScroll()
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 })
  const howItWorksInView = useInView(howItWorksRef, { once: true, amount: 0.2 })
  const testimonialsInView = useInView(testimonialsRef, { once: true, amount: 0.2 })

  const featuresControls = useAnimation()
  const howItWorksControls = useAnimation()
  const testimonialsControls = useAnimation()

  // Demo examples with fewer images
  const demoExamples = {
    design: {
      title: "Design Inspiration",
      description: "Perfect for UI/UX designers seeking visual inspiration",
      image: "sample1.png",
      color: "from-violet-600 to-fuchsia-500",
      tags: ["UI design", "minimalism", "typography", "gradient"],
    },
    branding: {
      title: "Brand Identity",
      description: "Create cohesive brand moodboards in seconds",
      image: "https://source.unsplash.com/random/600x400?branding",
      color: "from-blue-600 to-cyan-500",
      tags: ["branding", "logo design", "color palette", "identity"],
    },
    creative: {
      title: "Creative Projects",
      description: "Spark creativity for your next artistic endeavor",
      image: "https://source.unsplash.com/random/600x400?creative-art",
      color: "from-amber-500 to-pink-500",
      tags: ["illustration", "vibrant", "artistic", "creative"],
    },
  }

  // Handle scroll animations
  useEffect(() => {
    if (featuresInView) featuresControls.start("visible")
    if (howItWorksInView) howItWorksControls.start("visible")
    if (testimonialsInView) testimonialsControls.start("visible")
  }, [featuresInView, howItWorksInView, testimonialsInView])

  // Handle scroll progress
  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((v) => setScrollProgress(v))

    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollHint(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      unsubscribe()
    }
  }, [scrollYProgress])

  const handleGetStarted = () => {
    setIsLoading(true)
    // Navigate to the moodboard generator
    router.push("/moodboard")
  }

  // Scroll to section
  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
      if (ref.current) {
        ref.current.scrollIntoView({ behavior: "smooth" })
      }
    }

  // Animated background shapes
  const AnimatedShape = ({
    delay = 0,
    size = 300,
    x = 0,
    y = 0,
    rotation = 0,
    color = "from-pink-200/20 to-blue-200/20",
  }) => (
    <motion.div
      className={`absolute rounded-full bg-gradient-to-br ${color} blur-xl`}
      style={{
        width: size,
        height: size,
        x,
        y,
        rotate: rotation,
      }}
      animate={{
        x: [x, x + Math.random() * 50 - 25],
        y: [y, y + Math.random() * 50 - 25],
        rotate: [rotation, rotation + 10],
      }}
      transition={{
        duration: 15 + Math.random() * 10,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
        ease: "easeInOut",
        delay,
      }}
    />
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 overflow-x-hidden">
      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-violet-600 to-fuchsia-500 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <AnimatedShape delay={0} size={400} x={-100} y={-100} color="from-violet-200/20 to-blue-200/20" />
        <AnimatedShape
          delay={2}
          size={300}
          x={window.innerWidth - 200}
          y={100}
          color="from-pink-200/20 to-purple-200/20"
        />
        <AnimatedShape
          delay={4}
          size={350}
          x={window.innerWidth / 2 - 150}
          y={window.innerHeight - 200}
          color="from-blue-200/20 to-cyan-200/20"
        />
        <AnimatedShape
          delay={6}
          size={250}
          x={window.innerWidth - 300}
          y={window.innerHeight - 300}
          color="from-amber-200/20 to-pink-200/20"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <motion.div
            className="flex items-center gap-2 text-2xl font-bold text-violet-600"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="h-6 w-6" />
            <span>MoodBoard</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            <motion.button
              className="text-gray-600 hover:text-violet-600 transition-colors"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onClick={() => scrollToSection(featuresRef)}
            >
              Features
            </motion.button>
            <motion.button
              className="text-gray-600 hover:text-violet-600 transition-colors"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onClick={() => scrollToSection(howItWorksRef)}
            >
              How It Works
            </motion.button>
            <motion.button
              className="text-gray-600 hover:text-violet-600 transition-colors"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              onClick={() => scrollToSection(testimonialsRef)}
            >
              Testimonials
            </motion.button>
          </div>

          <motion.button
            className="px-4 py-2 rounded-full bg-white shadow-md text-violet-600 font-medium hover:shadow-lg transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={handleGetStarted}
          >
            Get Started
          </motion.button>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 container mx-auto px-4 pt-16 pb-24">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4"
          >
            <span className="px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-sm font-medium">
              Inspiration Made Easy
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 text-transparent bg-clip-text mb-6">
            Create Stunning Moodboards in Seconds
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate beautiful, cohesive moodboards with a single click. Find inspiration, lock what you love, and
            discover similar styles instantly.
          </p>

          <motion.div
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.button
              className="px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Start Creating <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
            <motion.button
              className="px-6 py-3 rounded-full bg-white text-violet-600 font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection(howItWorksRef)}
            >
              See How It Works <ChevronDown className="h-5 w-5" />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Interactive Demo */}
        <motion.div
          className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {/* Demo Controls */}
          <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 p-4 flex justify-between items-center">
            <div className="text-white font-medium flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span>Interactive Demo</span>
            </div>
            <div className="flex gap-2">
              {Object.keys(demoExamples).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveDemo(key)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    activeDemo === key ? "bg-white text-violet-600" : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Demo Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {Object.entries(demoExamples).map(
                ([key, demo]) =>
                  activeDemo === key && (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <div className="flex flex-col justify-between">
                        <div>
                          <motion.h3
                            className="text-2xl font-bold text-gray-800 mb-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                          >
                            {demo.title}
                          </motion.h3>
                          <motion.p
                            className="text-gray-600 mb-6"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                          >
                            {demo.description}
                          </motion.p>

                          <motion.div
                            className="flex flex-wrap gap-2 mb-6"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                          >
                            {demo.tags.map((tag, i) => (
                              <motion.span
                                key={i}
                                className={`px-2 py-1 bg-gradient-to-r ${demo.color} bg-clip-text text-transparent border border-violet-100 rounded-full text-xs`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                              >
                                {tag}
                              </motion.span>
                            ))}
                          </motion.div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                              <Lock className="h-5 w-5 text-violet-600" />
                            </div>
                            <div className="text-sm text-gray-600">Lock images you love to find similar styles</div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                              <RefreshCw className="h-5 w-5 text-violet-600" />
                            </div>
                            <div className="text-sm text-gray-600">Refresh to generate new inspiration</div>
                          </div>

                          <motion.button
                            className="flex items-center gap-2 text-violet-600 font-medium"
                            whileHover={{ x: 5 }}
                            onClick={handleGetStarted}
                          >
                            Try this style <ArrowRight size={16} />
                          </motion.button>
                        </div>
                      </div>

                      <div className="relative">
                        <motion.div
                          className="absolute -top-4 -left-4 w-full h-full rounded-lg bg-gradient-to-r from-violet-200 to-pink-200 opacity-50"
                          animate={{
                            rotate: [0, 2, 0, -2, 0],
                            scale: [1, 1.01, 1, 0.99, 1],
                          }}
                          transition={{
                            duration: 10,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "loop",
                          }}
                        />
                        <motion.div
                          className="relative rounded-lg overflow-hidden shadow-lg"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.3 }}
                        >
                          <img
                            src={demo.image || "/placeholder.svg"}
                            alt={demo.title}
                            className="w-full h-[300px] object-cover"
                          />

                          {/* Animated overlay elements */}
                          <div className="absolute top-3 right-3">
                            <motion.div
                              className="p-2 bg-white rounded-full shadow-md"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Lock size={16} className="text-violet-600" />
                            </motion.div>
                          </div>

                          <motion.div
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4"
                            initial={{ y: 60 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                          >
                            <div className="text-white font-medium">{demo.title} Moodboard</div>
                            <div className="text-white/80 text-sm">Press spacebar to refresh</div>
                          </motion.div>
                        </motion.div>

                        {/* Floating elements */}
                        <motion.div
                          className="absolute -bottom-6 -right-6 p-3 bg-white rounded-lg shadow-lg"
                          animate={{
                            y: [0, -10, 0],
                            rotate: [0, 5, 0],
                          }}
                          transition={{
                            duration: 6,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "reverse",
                          }}
                        >
                          <ImageIcon className="h-6 w-6 text-violet-500" />
                        </motion.div>

                        <motion.div
                          className="absolute top-1/2 -right-10 p-3 bg-white rounded-lg shadow-lg"
                          animate={{
                            x: [0, 10, 0],
                            rotate: [0, -5, 0],
                          }}
                          transition={{
                            duration: 7,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "reverse",
                            delay: 1,
                          }}
                        >
                          <Palette className="h-6 w-6 text-violet-500" />
                        </motion.div>
                      </div>
                    </motion.div>
                  ),
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <AnimatePresence>
          {showScrollHint && (
            <motion.div
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
              >
                <ChevronDown className="h-6 w-6 text-violet-500" />
              </motion.div>
              <span className="text-sm text-gray-500">Scroll to explore</span>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresControls}
            variants={{
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              hidden: { opacity: 0, y: 20 },
            }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
              Powerful Features, Effortless Creation
            </h2>
            <p className="text-lg text-gray-600">
              Our platform combines powerful AI with an intuitive interface to help you create stunning moodboards in
              seconds.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <Sparkles className="h-10 w-10 text-violet-500" />,
                title: "Instant Moodboards",
                description:
                  "Generate complete, cohesive moodboards with a single click. No more hunting for matching images.",
                color: "from-violet-600 to-fuchsia-500",
                animation: {
                  rotate: [0, 10, 0, -10, 0],
                  scale: [1, 1.1, 1, 0.9, 1],
                },
              },
              {
                icon: <Lock className="h-10 w-10 text-violet-500" />,
                title: "Similarity Search",
                description: "Lock an image you love and instantly find similar styles to create cohesive moodboards.",
                color: "from-blue-600 to-cyan-500",
                animation: {
                  y: [0, -10, 0, 10, 0],
                  scale: [1, 1.05, 1, 0.95, 1],
                },
              },
              {
                icon: <Layers className="h-10 w-10 text-violet-500" />,
                title: "Smart Categorization",
                description: "Browse by medium, style, color, mood, and more with our comprehensive tagging system.",
                color: "from-amber-500 to-pink-500",
                animation: {
                  x: [0, 10, 0, -10, 0],
                  scale: [1, 1.05, 1, 0.95, 1],
                },
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="bg-white p-8 rounded-xl shadow-md relative overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                animate={featuresControls}
                variants={{
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, delay: i * 0.1 },
                  },
                  hidden: { opacity: 0, y: 30 },
                }}
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              >
                {/* Animated background gradient */}
                <motion.div
                  className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-r ${feature.color} opacity-10 blur-xl`}
                  animate={feature.animation}
                  transition={{
                    duration: 8,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                />

                <div className="relative">
                  <motion.div
                    className="mb-4 p-3 bg-gradient-to-br from-purple-50 to-pink-50 inline-block rounded-lg shadow-sm"
                    whileHover={{ rotate: [0, 10, -10, 0], transition: { duration: 0.5 } }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Animated Feature Showcase */}
          <motion.div
            className="mt-20 bg-white rounded-xl shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={featuresControls}
            variants={{
              visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.3 } },
              hidden: { opacity: 0, y: 40 },
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="p-8 flex flex-col justify-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={featuresControls}
                  variants={{
                    visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.4 } },
                    hidden: { opacity: 0, x: -20 },
                  }}
                >
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">Drag, Drop, and Transform</h3>
                  <p className="text-gray-600 mb-6">
                    Easily rearrange your moodboard with intuitive drag and drop functionality. Lock images you love and
                    watch as our AI finds perfectly matching visuals to complete your vision.
                  </p>

                  <ul className="space-y-3">
                    {[
                      "Intuitive drag-and-drop interface",
                      "Smart image locking for similarity search",
                      "One-click moodboard generation",
                      "Export as high-quality images",
                    ].map((item, i) => (
                      <motion.li
                        key={i}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={featuresControls}
                        variants={{
                          visible: { opacity: 1, x: 0, transition: { duration: 0.3, delay: 0.5 + i * 0.1 } },
                          hidden: { opacity: 0, x: -20 },
                        }}
                      >
                        <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                          <Check className="h-3 w-3 text-violet-600" />
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              <div className="relative bg-gradient-to-br from-violet-50 to-pink-50 p-8 flex items-center justify-center">
                {/* Animated moodboard illustration */}
                <motion.div
                  className="relative w-full max-w-md"
                  initial={{ opacity: 0 }}
                  animate={featuresControls}
                  variants={{
                    visible: { opacity: 1, transition: { duration: 0.5, delay: 0.6 } },
                    hidden: { opacity: 0 },
                  }}
                >
                  {/* Main board */}
                  <motion.div
                    className="bg-white rounded-lg shadow-xl p-4 grid grid-cols-3 gap-3"
                    animate={{
                      y: [0, -10, 0],
                      rotate: [0, 1, 0, -1, 0],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                  >
                    {/* Image placeholders */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={`aspect-square rounded-md bg-gradient-to-br ${
                          i % 3 === 0
                            ? "from-violet-200 to-violet-300"
                            : i % 3 === 1
                              ? "from-pink-200 to-pink-300"
                              : "from-blue-200 to-blue-300"
                        } flex items-center justify-center`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={featuresControls}
                        variants={{
                          visible: {
                            opacity: 1,
                            scale: 1,
                            transition: { duration: 0.3, delay: 0.7 + i * 0.1 },
                          },
                          hidden: { opacity: 0, scale: 0.8 },
                        }}
                      >
                        <ImageIcon className="h-8 w-8 text-white/70" />
                      </motion.div>
                    ))}

                    {/* Floating elements */}
                    <motion.div
                      className="absolute -top-6 -right-6 p-3 bg-white rounded-lg shadow-lg"
                      animate={{
                        y: [0, -10, 0],
                        rotate: [0, 5, 0],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      }}
                    >
                      <Lock className="h-6 w-6 text-violet-500" />
                    </motion.div>

                    <motion.div
                      className="absolute -bottom-6 -left-6 p-3 bg-white rounded-lg shadow-lg"
                      animate={{
                        y: [0, 10, 0],
                        rotate: [0, -5, 0],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        delay: 1,
                      }}
                    >
                      <Download className="h-6 w-6 text-violet-500" />
                    </motion.div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="relative z-10 bg-white py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={howItWorksControls}
            variants={{
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              hidden: { opacity: 0, y: 20 },
            }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">How It Works</h2>
            <p className="text-lg text-gray-600">
              Creating the perfect moodboard has never been easier. Follow these simple steps to get started.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-violet-100 -translate-y-1/2 z-0"></div>

            {[
              {
                icon: <MousePointer className="h-8 w-8 text-violet-500" />,
                title: "Choose Your Theme",
                description: "Select a theme or search for specific tags to generate your initial moodboard.",
                step: "01",
                animation: {
                  y: [0, -15, 0],
                  transition: { duration: 3, repeat: Number.POSITIVE_INFINITY },
                },
              },
              {
                icon: <Lock className="h-8 w-8 text-violet-500" />,
                title: "Lock What You Love",
                description: "Found an image you like? Lock it and we'll find similar styles to match.",
                step: "02",
                animation: {
                  rotate: [0, 10, 0, -10, 0],
                  transition: { duration: 5, repeat: Number.POSITIVE_INFINITY },
                },
              },
              {
                icon: <Download className="h-8 w-8 text-violet-500" />,
                title: "Save & Share",
                description: "Download your moodboard as a single image or share it directly with your team.",
                step: "03",
                animation: {
                  scale: [1, 1.1, 1],
                  transition: { duration: 4, repeat: Number.POSITIVE_INFINITY },
                },
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-xl shadow-md p-8 relative z-10"
                initial={{ opacity: 0, y: 30 }}
                animate={howItWorksControls}
                variants={{
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, delay: i * 0.2 },
                  },
                  hidden: { opacity: 0, y: 30 },
                }}
              >
                <motion.div
                  className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md"
                  whileHover={{ scale: 1.1 }}
                  animate={step.animation}
                >
                  {step.step}
                </motion.div>
                <div className="mt-6 mb-4 flex justify-center">
                  <motion.div
                    className="p-3 bg-violet-50 rounded-full"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    {step.icon}
                  </motion.div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center text-gray-800">{step.title}</h3>
                <p className="text-gray-600 text-center">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={howItWorksControls}
            variants={{
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.6 } },
              hidden: { opacity: 0, y: 20 },
            }}
          >
            <motion.button
              className="px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
            >
              Start Creating Now <ArrowRight className="h-5 w-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        ref={testimonialsRef}
        className="relative z-10 bg-gradient-to-br from-violet-50 via-blue-50 to-pink-50 py-24"
      >
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={testimonialsControls}
            variants={{
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              hidden: { opacity: 0, y: 20 },
            }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">What Our Users Say</h2>
            <p className="text-lg text-gray-600">
              Join thousands of designers and creatives who have transformed their workflow with MoodBoard.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "MoodBoard has completely transformed how I start new design projects. The similarity search is a game-changer!",
                author: "Sarah Johnson",
                role: "UI/UX Designer",
                avatar: "https://source.unsplash.com/random/100x100?portrait=1",
              },
              {
                quote:
                  "I use MoodBoard daily for client presentations. Being able to quickly generate cohesive visual references has saved me countless hours.",
                author: "Michael Chen",
                role: "Creative Director",
                avatar: "https://source.unsplash.com/random/100x100?portrait=2",
              },
              {
                quote:
                  "As a freelancer, MoodBoard helps me quickly align with my clients' vision. The ability to save and share boards is incredibly useful.",
                author: "Emma Rodriguez",
                role: "Brand Strategist",
                avatar: "https://source.unsplash.com/random/100x100?portrait=3",
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-xl shadow-md p-8 relative overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                animate={testimonialsControls}
                variants={{
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, delay: i * 0.2 },
                  },
                  hidden: { opacity: 0, y: 30 },
                }}
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              >
                {/* Animated background element */}
                <motion.div
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-r from-violet-200 to-pink-200 opacity-20 blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 45, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                    delay: i * 2,
                  }}
                />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={testimonialsControls}
                        variants={{
                          visible: {
                            opacity: 1,
                            scale: 1,
                            transition: { duration: 0.3, delay: 0.3 + i * 0.1 },
                          },
                          hidden: { opacity: 0, scale: 0 },
                        }}
                      >
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <motion.img
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.author}
                      className="w-10 h-10 rounded-full object-cover"
                      whileHover={{ scale: 1.1 }}
                    />
                    <div>
                      <div className="font-medium text-gray-800">{testimonial.author}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-12 text-center">
              <motion.h2
                className="text-3xl md:text-4xl font-bold mb-4 text-white"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                Ready to Transform Your Creative Process?
              </motion.h2>
              <motion.p
                className="text-lg text-white/90 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                Join thousands of designers and creatives who have already revolutionized their workflow with MoodBoard.
              </motion.p>
              <motion.button
                className="px-8 py-4 rounded-full bg-white text-violet-600 font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                onClick={handleGetStarted}
              >
                Get Started for Free <ArrowRight className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-50 py-12 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xl font-bold text-violet-600 mb-4">
                <Sparkles className="h-5 w-5" />
                <span>MoodBoard</span>
              </div>
              <p className="text-gray-600 text-sm">
                Create stunning moodboards in seconds with our AI-powered platform.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-600 mb-4 md:mb-0">© 2023 MoodBoard Generator. All rights reserved.</div>
            <div className="flex gap-4">
              <a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-violet-600 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

