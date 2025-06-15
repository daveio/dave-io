// dave.io Interactive Script
// Cyberpunk terminal aesthetic with modern functionality

// trunk-ignore-all(semgrep/javascript.browser.security.insecure-document-method.insecure-document-method): scratchpad

// Global state
const state = {
  isClipboardSupported: !!navigator.clipboard,
  animationEnabled: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  currentTheme: "cyberpunk"
}

// Utility functions
const utils = {
  // Debounce function for performance
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },

  // Check if element is in viewport
  isInViewport(element) {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  },

  // Generate random cyberpunk glitch text
  glitchText(text, duration = 2000) {
    const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?~`"
    const originalText = text
    const iterations = 0
    const _maxIterations = duration / 100

    const interval = setInterval(() => {
      return originalText
        .split("")
        .map((_char, index) => {
          if (index < iterations) {
            return originalText[index]
          }
          return chars[Math.floor(Math.random() * chars.length)]
        })
        .join("")
    }, 100)

    setTimeout(() => {
      clearInterval(interval)
    }, duration)

    return interval
  },

  // Play cyberpunk sound effect
  playCyberSound(frequency = 800, duration = 0.1, type = "square") {
    if (typeof AudioContext !== "undefined" || typeof webkitAudioContext !== "undefined") {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = frequency
        oscillator.type = type

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + duration)
      } catch (_error) {
        console.log("Audio not supported or blocked")
      }
    }
  }
}

// Copy to clipboard functionality
async function copyToClipboard() {
  const copyBtn = document.getElementById("copy-btn")
  const command = document.getElementById("curl-command")

  if (!copyBtn || !command) {
    return
  }

  const originalText = copyBtn.innerHTML
  const commandText = command.textContent || command.innerText

  try {
    // Play cyber sound
    utils.playCyberSound(1200, 0.05)

    if (state.isClipboardSupported) {
      await navigator.clipboard.writeText(commandText)
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = commandText
      textArea.style.position = "fixed"
      textArea.style.left = "-9999px"
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }

    // Success feedback
    copyBtn.innerHTML = `
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Copied!
        `
    copyBtn.classList.add("btn-success")
    copyBtn.classList.remove("btn-primary")

    // Reset after 2 seconds
    setTimeout(() => {
      copyBtn.innerHTML = originalText
      copyBtn.classList.remove("btn-success")
      copyBtn.classList.add("btn-primary")
    }, 2000)
  } catch (error) {
    console.error("Failed to copy:", error)

    // Error feedback
    copyBtn.innerHTML = `
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Failed
        `
    copyBtn.classList.add("btn-error")
    copyBtn.classList.remove("btn-primary")

    setTimeout(() => {
      copyBtn.innerHTML = originalText
      copyBtn.classList.remove("btn-error")
      copyBtn.classList.add("btn-primary")
    }, 2000)
  }
}

// Scroll animations
function initScrollAnimations() {
  const revealElements = document.querySelectorAll(".scroll-reveal")

  if (!revealElements.length) {
    return
  }

  const revealOnScroll = utils.debounce(() => {
    // biome-ignore lint/complexity/noForEach: performance is acceptable for UI effects
    revealElements.forEach((element) => {
      if (utils.isInViewport(element)) {
        element.classList.add("revealed")
      }
    })
  }, 100)

  window.addEventListener("scroll", revealOnScroll)
  revealOnScroll() // Check initial state
}

// Terminal typing animation
function initTerminalAnimation() {
  const terminalElements = document.querySelectorAll("[data-terminal-type]")

  // biome-ignore lint/complexity/noForEach: terminal animation setup needs iteration
  terminalElements.forEach((element) => {
    const text = element.textContent
    const speed = Number.parseInt(element.dataset.terminalSpeed) || 50

    element.textContent = ""

    let i = 0
    const typeWriter = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i)
        i++
        setTimeout(typeWriter, speed)
      }
    }

    // Start typing animation when element comes into view
    const observer = new IntersectionObserver((entries) => {
      // biome-ignore lint/complexity/noForEach: intersection observer callback iteration
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          typeWriter()
          observer.unobserve(entry.target)
        }
      })
    })

    observer.observe(element)
  })
}

// Matrix rain effect for background
// biome-ignore lint/correctness/noUnusedVariables: unused function is intentional for optional feature
function initMatrixRain() {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  canvas.style.position = "fixed"
  canvas.style.top = "0"
  canvas.style.left = "0"
  canvas.style.width = "100%"
  canvas.style.height = "100%"
  canvas.style.zIndex = "-1"
  canvas.style.opacity = "0.1"
  canvas.style.pointerEvents = "none"

  document.body.appendChild(canvas)

  const resizeCanvas = function() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  resizeCanvas()
  window.addEventListener("resize", resizeCanvas)

  const characters = "01"
  const fontSize = 14
  const columns = canvas.width / fontSize
  const drops = Array(Math.floor(columns)).fill(1)

  const draw = function() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "#00ff00"
    ctx.font = `${fontSize}px monospace`

    for (let i = 0; i < drops.length; i++) {
      const text = characters[Math.floor(Math.random() * characters.length)]
      ctx.fillText(text, i * fontSize, drops[i] * fontSize)

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0
      }
      drops[i]++
    }
  }

  if (state.animationEnabled) {
    setInterval(draw, 35)
  }
}

// Cyberpunk glitch effects
function initGlitchEffects() {
  const glitchElements = document.querySelectorAll(".glitch")

  // biome-ignore lint/complexity/noForEach: glitch effect setup needs iteration
  glitchElements.forEach((element) => {
    element.addEventListener("mouseenter", () => {
      if (state.animationEnabled) {
        utils.playCyberSound(600, 0.1, "sawtooth")
      }
    })
  })
}

// Konami code easter egg
function initKonamiCode() {
  const konamiCode = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "KeyB",
    "KeyA"
  ]

  let konamiIndex = 0

  document.addEventListener("keydown", (e) => {
    if (e.code === konamiCode[konamiIndex]) {
      konamiIndex++
      if (konamiIndex === konamiCode.length) {
        // Easter egg activated!
        document.body.style.filter = "hue-rotate(180deg)"
        utils.playCyberSound(1000, 0.5, "sine")

        setTimeout(() => {
          document.body.style.filter = ""
        }, 3000)

        konamiIndex = 0
      }
    } else {
      konamiIndex = 0
    }
  })
}

// Theme switcher
function initThemeSwitcher() {
  const themeToggle = document.getElementById("theme-toggle")

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme")
      const newTheme = currentTheme === "cyberpunk" ? "dark" : "cyberpunk"

      document.documentElement.setAttribute("data-theme", newTheme)
      localStorage.setItem("preferred-theme", newTheme)

      utils.playCyberSound(800, 0.1)
    })
  }
}

// Accessibility enhancements
function initAccessibility() {
  // Skip to main content link
  const skipLink = document.createElement("a")
  skipLink.href = "#main"
  skipLink.textContent = "Skip to main content"
  skipLink.className =
    "sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary text-primary-content p-2 z-50"
  document.body.insertBefore(skipLink, document.body.firstChild)

  // Focus management for modals and dropdowns
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      // Close any open modals or dropdowns
      const openModal = document.querySelector(".modal-open")
      if (openModal) {
        openModal.checked = false
      }
    }
  })
}

// Performance monitoring
function initPerformanceMonitoring() {
  if ("performance" in window) {
    window.addEventListener("load", () => {
      const perfData = performance.getEntriesByType("navigation")[0]
      console.log("Page load time:", perfData.loadEventEnd - perfData.loadEventStart, "ms")
    })
  }
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 dave.io cyberpunk terminal initializing...")

  // Load saved theme
  const savedTheme = localStorage.getItem("preferred-theme") || "cyberpunk"
  document.documentElement.setAttribute("data-theme", savedTheme)
  state.currentTheme = savedTheme

  // Initialize all features
  initScrollAnimations()
  initTerminalAnimation()
  initGlitchEffects()
  initKonamiCode()
  initThemeSwitcher()
  initAccessibility()
  initPerformanceMonitoring()

  // Initialize matrix rain effect only if animations are enabled and user hasn't disabled them
  if (state.animationEnabled && !localStorage.getItem("disable-matrix")) {
    // Uncomment the line below if you want the matrix rain effect
    // initMatrixRain();
  }

  console.log("✅ dave.io cyberpunk terminal ready!")

  // Play startup sound
  setTimeout(() => {
    utils.playCyberSound(1200, 0.1)
  }, 500)
})

// Error handling
window.addEventListener("error", (e) => {
  console.error("dave.io error:", e.error)

  // Optional: Send error reports to analytics
  if (typeof gtag !== "undefined") {
    gtag("event", "exception", {
      description: e.error.message,
      fatal: false
    })
  }
})

// Export functions for global access
window.daveIO = {
  copyToClipboard,
  utils,
  state
}
