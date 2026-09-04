function getActiveIndex(viewport, slides) {
  if (slides.length <= 1) {
    return 0;
  }

  const viewportRect = viewport.getBoundingClientRect();
  const viewportCenter = viewportRect.left + viewportRect.width / 2;

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  slides.forEach((slide, index) => {
    const slideRect = slide.getBoundingClientRect();
    const slideCenter = slideRect.left + slideRect.width / 2;
    const distance = Math.abs(slideCenter - viewportCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function createDots(container, totalSlides) {
  container.innerHTML = "";

  for (let index = 0; index < totalSlides; index += 1) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel__dot";
    dot.setAttribute("aria-label", `Ir a tarjeta ${index + 1}`);
    dot.setAttribute("aria-pressed", "false");
    dot.dataset.index = String(index);
    container.appendChild(dot);
  }
}

function getDots(container) {
  return Array.from(container.querySelectorAll(".carousel__dot"));
}

function initCarousel() {
  const carousels = document.querySelectorAll("[data-carousel]");

  carousels.forEach((carouselElement) => {
    const viewport = carouselElement.querySelector(".carousel__viewport");
    const slides = carouselElement.querySelectorAll(".service-card");
    const dotsContainer = carouselElement.querySelector("[data-carousel-dots]");

    if (!viewport || !dotsContainer || slides.length === 0) {
      return;
    }

    let dots = getDots(dotsContainer);

    if (dots.length !== slides.length) {
      createDots(dotsContainer, slides.length);
      dots = getDots(dotsContainer);
    }

    function setActiveDot() {
      const activeIndex = getActiveIndex(viewport, Array.from(slides));
      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-pressed", String(isActive));
      });
    }

    function goTo(index) {
      const targetSlide = slides[index];

      if (!targetSlide) {
        return;
      }

      targetSlide.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
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

document.addEventListener("DOMContentLoaded", () => {
  initCarousel();
});
