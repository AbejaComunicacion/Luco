function getStepDistance(viewport) {
  return viewport.clientWidth;
}

function getActiveIndex(viewport, totalSlides) {
  if (totalSlides <= 1) {
    return 0;
  }

  const step = getStepDistance(viewport);
  const rawIndex = Math.round(viewport.scrollLeft / step);
  return Math.max(0, Math.min(totalSlides - 1, rawIndex));
}

function buildDots(container, totalSlides) {
  container.innerHTML = "";

  const dots = [];

  for (let index = 0; index < totalSlides; index += 1) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel__dot";
    dot.setAttribute("aria-label", `Ir a tarjeta ${index + 1}`);
    dot.setAttribute("aria-pressed", "false");
    dot.dataset.index = String(index);
    container.appendChild(dot);
    dots.push(dot);
  }

  return dots;
}

export function initCarousel() {
  const carousels = document.querySelectorAll("[data-carousel]");

  carousels.forEach((carouselElement) => {
    const viewport = carouselElement.querySelector(".carousel__viewport");
    const slides = carouselElement.querySelectorAll(".service-card");
    const dotsContainer = carouselElement.querySelector("[data-carousel-dots]");

    if (!viewport || !dotsContainer || slides.length === 0) {
      return;
    }

    const dots = buildDots(dotsContainer, slides.length);

    function setActiveDot() {
      const activeIndex = getActiveIndex(viewport, slides.length);
      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-pressed", String(isActive));
      });
    }

    function goTo(index) {
      const step = getStepDistance(viewport);
      viewport.scrollTo({ left: index * step, behavior: "smooth" });
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const index = Number(dot.dataset.index);

        if (Number.isNaN(index)) {
          return;
        }

        goTo(index);
      });
    });

    viewport.addEventListener("scroll", setActiveDot, { passive: true });
    window.addEventListener("resize", setActiveDot);

    setActiveDot();
  });
}
