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

function initStickyHeader() {
  const header = document.querySelector(".site-header");

  if (!header) {
    return;
  }

  const OPEN_MS = 3000;
  let closeTimer = 0;

  function syncCollapsed() {
    header.classList.toggle("is-collapsed", window.scrollY > 40);
  }

  function scheduleClose() {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => header.classList.remove("is-open"), OPEN_MS);
  }

  function open() {
    window.clearTimeout(closeTimer);
    header.classList.add("is-open");
  }

  header.addEventListener("pointerenter", open);
  header.addEventListener("pointerdown", open);
  header.addEventListener("pointerleave", scheduleClose);
  header.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "mouse") {
      scheduleClose();
    }
  });
  header.addEventListener("focusin", open);
  header.addEventListener("focusout", scheduleClose);

  window.addEventListener("scroll", syncCollapsed, { passive: true });
  syncCollapsed();
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
    "images/fotos/AC_Luco_SF_Content_01.jpg",
    "images/fotos/AC_Luco_SF_Content_03.jpg",
    "images/fotos/AC_Luco_SF_Content_04.jpg",
    "images/fotos/AC_Luco_SF_Content_05.jpg",
    "images/fotos/AC_Luco_SF_Content_11.jpg",
    "images/fotos/AC_Luco_SF_Content_12.jpg",
    "images/fotos/AC_Luco_SF_Content_14.jpg",
    "images/fotos/AC_Luco_SF_Content_16.jpg",
    "images/fotos/AC_Luco_SF_Content_19.jpg",
    "images/fotos/AC_Luco_SF_Content_27.jpg",
    "images/fotos/AC_Luco_SF_Educacion_01.jpg",
    "images/fotos/AC_Luco_SF_Educacion_04.jpg",
    "images/fotos/AC_Luco_SF_Educacion_05.jpg",
    "images/fotos/AC_Luco_SF_Educacion_10.jpg",
    "images/fotos/AC_Luco_SF_Educacion_12.jpg",
    "images/fotos/AC_Luco_SF_Educacion_15.jpg",
    "images/fotos/AC_Luco_SF_Educacion_17.jpg",
    "images/fotos/AC_Luco_SF_Educacion_18.jpg",
    "images/fotos/AC_Luco_SF_Educacion_23.jpg",
    "images/fotos/AC_Luco_SF_Local_01.jpg",
    "images/fotos/AC_Luco_SF_Local_03.jpg",
    "images/fotos/AC_Luco_SF_Local_05.jpg",
  ];
  let activeIndex = 0;
  let trackBuilt = false;

  function buildTrack() {
    if (trackBuilt) {
      return;
    }
    trackBuilt = true;

    // Safari fails to trigger native lazy-loading for images that only enter
    // the viewport via a CSS transform animation, leaving them blank forever
    // and forcing constant re-layout checks (visible as a very slow marquee).
    // Images are appended eagerly once the section is about to be visible.
    imageSources.forEach((source, index) => {
      const image = document.createElement("img");
      image.className = "marquee__image";
      image.src = source;
      image.alt = `Galeria Luco imagen ${index + 1}`;
      image.dataset.galleryIndex = String(index);
      image.decoding = "async";
      track.appendChild(image);
    });

    imageSources.forEach((source) => {
      const image = document.createElement("img");
      image.className = "marquee__image";
      image.src = source;
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      image.decoding = "async";
      track.appendChild(image);
    });

    startMarquee();
  }

  // Safari's CSS animation implementation doesn't reliably recompute the
  // translateX keyframe once the track's width changes after images are
  // appended, causing the loop to stall or skip images. Driving the
  // movement from JS with the track's actual measured width avoids that.
  function startMarquee() {
    const gapPx = parseFloat(getComputedStyle(track).gap) || 0;
    let halfWidth = (track.scrollWidth - gapPx) / 2;
    let offset = 0;
    let lastTimestamp = null;

    function updateHalfWidth() {
      halfWidth = (track.scrollWidth - gapPx) / 2;
    }

    window.addEventListener("resize", updateHalfWidth);

    function frame(timestamp) {
      if (lastTimestamp !== null && halfWidth > 0 && !document.hidden) {
        const delta = timestamp - lastTimestamp;
        const pixelsPerMs = halfWidth / 84000;
        offset = (offset + delta * pixelsPerMs) % halfWidth;
        track.style.transform = `translateX(${-offset}px)`;
      }
      lastTimestamp = timestamp;
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  const gallerySection = track.closest(".galeria");

  if (gallerySection && "IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries, observer) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          buildTrack();
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    sectionObserver.observe(gallerySection);
  } else {
    buildTrack();
  }

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
  initStickyHeader();
  initCarousel();
  initGallery();
});
