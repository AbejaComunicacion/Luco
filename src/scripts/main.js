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
  const wideControlsQuery = window.matchMedia(
    "(min-width: 719px) and (max-width: 1919.84px) and (max-height: 800px)",
  );

  carousels.forEach((carouselElement) => {
    const viewport = carouselElement.querySelector(".carousel__viewport");
    const slideList = Array.from(carouselElement.querySelectorAll(".service-card"));
    const dotsContainer = carouselElement.querySelector("[data-carousel-dots]");
    const prevButton = carouselElement.querySelector("[data-carousel-prev]");
    const nextButton = carouselElement.querySelector("[data-carousel-next]");

    if (!viewport || !dotsContainer || slideList.length === 0) {
      return;
    }

    function syncWideControls() {
      carouselElement.classList.toggle("carousel--wide-controls", wideControlsQuery.matches);
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
    wideControlsQuery.addEventListener("change", syncWideControls);

    syncWideControls();
    setActiveDot();
  });
}

function initSiteNav() {
  const siteNav = document.querySelector(".site-nav");
  const menuLinks = siteNav?.querySelectorAll(".site-nav__panel a");

  if (!siteNav) {
    return;
  }

  const desktopQuery = window.matchMedia("(min-width: 48rem)");

  function syncMenuMode() {
    siteNav.open = desktopQuery.matches;
  }

  function closeMenu(event) {
    if (!desktopQuery.matches && !siteNav.contains(event.target)) {
      siteNav.removeAttribute("open");
    }
  }

  menuLinks?.forEach((link) => {
    link.addEventListener("click", () => {
      if (!desktopQuery.matches) {
        siteNav.removeAttribute("open");
      }
    });
  });

  syncMenuMode();
  desktopQuery.addEventListener("change", syncMenuMode);
  document.addEventListener("click", closeMenu);
}

function initGallery() {
  const track = document.querySelector("[data-gallery-track]");
  const dialog = document.querySelector("[data-gallery-dialog]");
  const dialogImage = dialog?.querySelector("[data-gallery-image]");
  const counter = dialog?.querySelector("[data-gallery-counter]");
  const closeButton = dialog?.querySelector("[data-gallery-close]");
  const previousButton = dialog?.querySelector("[data-gallery-prev]");
  const nextButton = dialog?.querySelector("[data-gallery-next]");

  if (!track || !dialog || !dialogImage || !counter) {
    return;
  }

  const imageSources = [
    ...Array.from({ length: 22 }, (_, index) => {
      const imageNumber = String(index + 1).padStart(2, "0");
      return `images/fotos/AC_Luco_SF_Content_${imageNumber}.png`;
    }),
    ...Array.from({ length: 4 }, (_, index) => {
      const imageNumber = String(index + 23).padStart(2, "0");
      return `images/fotos/AC_Luco_SF_Educacion_${imageNumber}.png`;
    }),
    "images/fotos/AC_Luco_SF_Content_27.png",
    "images/fotos/AC_Luco_SF_Content_28.png",
  ];
  let activeIndex = 0;

  imageSources.forEach((source, index) => {
    const image = document.createElement("img");
    image.className = "marquee__image";
    image.src = source;
    image.alt = `Galeria Luco imagen ${index + 1}`;
    image.dataset.galleryIndex = String(index);
    track.appendChild(image);
  });

  imageSources.forEach((source) => {
    const image = document.createElement("img");
    image.className = "marquee__image";
    image.src = source;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    track.appendChild(image);
  });

  function showImage(index) {
    activeIndex = (index + imageSources.length) % imageSources.length;
    dialogImage.src = imageSources[activeIndex];
    dialogImage.alt = `Galeria Luco imagen ${activeIndex + 1}`;
    counter.textContent = `${activeIndex + 1} / ${imageSources.length}`;
  }

  function openGallery(index) {
    showImage(index);
    dialog.showModal();
    document.body.classList.add("gallery-is-open");
  }

  function closeGallery() {
    dialog.close();
    document.body.classList.remove("gallery-is-open");
  }

  track.addEventListener("click", (event) => {
    const image = event.target.closest("[data-gallery-index]");
    if (image) {
      openGallery(Number(image.dataset.galleryIndex));
    }
  });

  closeButton.addEventListener("click", closeGallery);
  previousButton.addEventListener("click", () => showImage(activeIndex - 1));
  nextButton.addEventListener("click", () => showImage(activeIndex + 1));

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      closeGallery();
    }
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("gallery-is-open");
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      showImage(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      showImage(activeIndex + 1);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initSiteNav();
  initCarousel();
  initGallery();
});
