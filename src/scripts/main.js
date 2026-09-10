function getActiveIndex(viewport, slides) {
  if (slides.length <= 1) {
    return 0;
  }

  const currentScroll = viewport.scrollLeft;

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  slides.forEach((slide, index) => {
    const targetLeft = getSlideTargetLeft(viewport, slide);
    const distance = Math.abs(targetLeft - currentScroll);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function getSlideTargetLeft(viewport, slide) {
  const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const viewportRect = viewport.getBoundingClientRect();
  const slideRect = slide.getBoundingClientRect();
  const delta = slideRect.left - viewportRect.left;
  const centeredOffset = (viewportRect.width - slideRect.width) / 2;
  return Math.min(maxScrollLeft, Math.max(0, viewport.scrollLeft + delta - centeredOffset));
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
    const slideList = Array.from(carouselElement.querySelectorAll(".service-card"));
    const dotsContainer = carouselElement.querySelector("[data-carousel-dots]");
    const prevButton = carouselElement.querySelector("[data-carousel-prev]");
    const nextButton = carouselElement.querySelector("[data-carousel-next]");

    if (!viewport || !dotsContainer || slideList.length === 0) {
      return;
    }

    let dots = getDots(dotsContainer);

    if (dots.length !== slideList.length) {
      createDots(dotsContainer, slideList.length);
      dots = getDots(dotsContainer);
    }

    function setArrowState(activeIndex) {
      if (prevButton) {
        const isAtStart = activeIndex <= 0;
        prevButton.disabled = isAtStart;
        prevButton.setAttribute("aria-disabled", String(isAtStart));
      }

      if (nextButton) {
        const isAtEnd = activeIndex >= slideList.length - 1;
        nextButton.disabled = isAtEnd;
        nextButton.setAttribute("aria-disabled", String(isAtEnd));
      }
    }

    function setActiveDot() {
      const activeIndex = getActiveIndex(viewport, slideList);
      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-pressed", String(isActive));
      });
      setArrowState(activeIndex);
    }

    function goTo(index) {
      const targetSlide = slideList[index];

      if (!targetSlide) {
        return;
      }

      viewport.scrollTo({ left: getSlideTargetLeft(viewport, targetSlide), behavior: "smooth" });
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

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        const activeIndex = getActiveIndex(viewport, slideList);
        goTo(Math.max(0, activeIndex - 1));
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        const activeIndex = getActiveIndex(viewport, slideList);
        goTo(Math.min(slideList.length - 1, activeIndex + 1));
      });
    }

    viewport.addEventListener("scroll", setActiveDot, { passive: true });
    window.addEventListener("resize", setActiveDot);

    setActiveDot();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initCarousel();
});
