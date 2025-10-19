// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})

// Copy code functionality
function copyCode() {
  const code = document.querySelector(".code-content code").textContent
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.querySelector(".copy-btn")
    const originalText = btn.innerHTML
    btn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 10L8 13L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Copiado!'
    setTimeout(() => {
      btn.innerHTML = originalText
    }, 2000)
  })
}

// Navbar scroll effect
let lastScroll = 0
const navbar = document.querySelector(".navbar")

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset

  if (currentScroll > 100) {
    navbar.style.boxShadow = "0 2px 16px rgba(0, 0, 0, 0.08)"
  } else {
    navbar.style.boxShadow = "none"
  }

  lastScroll = currentScroll
})

// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1"
      entry.target.style.transform = "translateY(0)"
    }
  })
}, observerOptions)

// Observe elements for animation
document.querySelectorAll(".step, .feature-card, .feature-item").forEach((el) => {
  el.style.opacity = "0"
  el.style.transform = "translateY(20px)"
  el.style.transition = "opacity 0.6s ease, transform 0.6s ease"
  observer.observe(el)
})
