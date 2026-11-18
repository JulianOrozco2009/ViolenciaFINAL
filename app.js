(() => {
  const slides = [...document.querySelectorAll('.slide')];
  if (!slides.length) return;

  const $ = id => document.getElementById(id);
  const total = slides.length;
  let current = 0;
  let editMode = false;

  const prevBtn = $('prevBtn');
  const nextBtn = $('nextBtn');
  const currentSlide = $('currentSlide');
  const totalSlides = $('totalSlides');
  const progressBar = $('progressBar');
  const editBtn = $('editBtn');
  const overviewBtn = $('overviewBtn');
  const fullscreenBtn = $('fullscreenBtn');
  const overviewModal = $('overviewModal');
  const overviewGrid = $('overviewGrid');
  const closeOverview = $('closeOverview');
  const toast = $('toast');

  const storageKey = 'soata_violencia_presentacion_edits_v2';

  if (totalSlides) {
    totalSlides.textContent = String(total).padStart(2, '0');
  }

  // Numeración automática de las diapositivas.
  slides.forEach((slide, index) => {
    const number = slide.querySelector('.page-number');

    if (number) {
      number.textContent =
        `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    }
  });

  // Cambiar entre diapositivas.
  function updateSlide(index) {
    if (index < 0 || index >= total) return;

    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      slide.style.zIndex = i === index ? '2' : '1';

      if (i === index) {
        const canvas = slide.querySelector('.canvas');
        if (canvas) canvas.scrollTop = 0;
      }
    });

    current = index;

    if (currentSlide) {
      currentSlide.textContent = String(current + 1).padStart(2, '0');
    }

    if (progressBar) {
      progressBar.style.width = `${((current + 1) / total) * 100}%`;
    }

    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === total - 1;

    document.title =
      `${slides[current].dataset.title || 'Presentación'} · Violencia en Soatá`;
  }

  const next = () => updateSlide(Math.min(current + 1, total - 1));
  const prev = () => updateSlide(Math.max(current - 1, 0));

  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);

  // Mensajes temporales.
  function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(window.soataToastTimer);

    window.soataToastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 1800);
  }

  // Guardar los cambios realizados en el modo edición.
  function saveEdits() {
    const edits = {};

    document.querySelectorAll('.editable').forEach((element, index) => {
      edits[index] = element.innerHTML;
    });

    try {
      localStorage.setItem(storageKey, JSON.stringify(edits));
    } catch (_) {
      showToast('No se pudieron guardar los cambios en este navegador');
    }
  }

  // Recuperar los cambios guardados.
  function restoreEdits() {
    try {
      const edits = JSON.parse(
        localStorage.getItem(storageKey) || 'null'
      );

      if (!edits) return;

      document.querySelectorAll('.editable').forEach((element, index) => {
        if (edits[index] !== undefined) {
          element.innerHTML = edits[index];
        }
      });
    } catch (_) {
      showToast('No se pudieron recuperar las ediciones guardadas');
    }
  }

  // Activar o desactivar el modo edición.
  function toggleEdit() {
    editMode = !editMode;

    document.body.classList.toggle('edit-active', editMode);

    document.querySelectorAll('.editable').forEach(element => {
      element.contentEditable = editMode ? 'true' : 'false';
    });

    if (editBtn) {
      editBtn.style.color = editMode ? '#83c5ff' : '';
    }

    showToast(
      editMode
        ? 'Modo edición activado'
        : 'Modo edición desactivado'
    );
  }

  document.addEventListener('input', event => {
    if (
      editMode &&
      event.target.classList.contains('editable')
    ) {
      saveEdits();
    }
  });

  editBtn?.addEventListener('click', toggleEdit);

  // Cerrar la ventana de vista general.
  function closeOverviewModal() {
    overviewModal?.classList.remove('open');
  }

  // Crear las tarjetas de vista general.
  function buildOverview() {
    if (!overviewGrid) return;

    overviewGrid.innerHTML = '';

    slides.forEach((slide, index) => {
      const card = document.createElement('button');

      card.type = 'button';
      card.className = 'overview-card';

      const number = document.createElement('span');
      number.textContent = String(index + 1).padStart(2, '0');

      const title = document.createElement('b');
      title.textContent = slide.dataset.title || 'Diapositiva';

      card.append(number, title);

      card.addEventListener('click', () => {
        updateSlide(index);
        closeOverviewModal();
      });

      overviewGrid.appendChild(card);
    });
  }

  // Abrir la vista general.
  function openOverview() {
    buildOverview();
    overviewModal?.classList.add('open');
  }

  overviewBtn?.addEventListener('click', openOverview);
  closeOverview?.addEventListener('click', closeOverviewModal);

  overviewModal?.addEventListener('click', event => {
    if (event.target === overviewModal) {
      closeOverviewModal();
    }
  });

  // Activar pantalla completa.
  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_) {
      showToast('Pantalla completa no disponible en este navegador');
    }
  }

  fullscreenBtn?.addEventListener('click', toggleFullscreen);

  // Controles del teclado.
  document.addEventListener('keydown', event => {
    if (event.target?.isContentEditable) {
      if (event.key === 'Escape') {
        event.target.blur();
      }
      return;
    }

    if (overviewModal?.classList.contains('open')) {
      if (event.key === 'Escape') {
        closeOverviewModal();
      }
      return;
    }

    if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      next();
    }

    if (['ArrowLeft', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      prev();
    }

    if (event.key === 'Home') {
      event.preventDefault();
      updateSlide(0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      updateSlide(total - 1);
    }

    if (event.key.toLowerCase() === 'e') toggleEdit();
    if (event.key.toLowerCase() === 'o') openOverview();
    if (event.key.toLowerCase() === 'f') toggleFullscreen();
  });

  // Deslizamiento horizontal en pantallas táctiles.
  let touchStartX = null;
  let touchStartY = null;

  document.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener('touchend', event => {
    if (touchStartX === null || touchStartY === null) return;

    const dx = event.changedTouches[0].screenX - touchStartX;
    const dy = event.changedTouches[0].screenY - touchStartY;

    if (
      Math.abs(dx) > 55 &&
      Math.abs(dx) > Math.abs(dy) * 1.2
    ) {
      if (dx < 0) {
        next();
      } else {
        prev();
      }
    }

    touchStartX = null;
    touchStartY = null;
  }, { passive: true });

  // Inicializar presentación.
  restoreEdits();
  updateSlide(0);

  // Funciones disponibles desde otros scripts.
  window.presentation = {
    next,
    prev,
    updateSlide,
    openOverview,
    toggleEdit
  };

})();