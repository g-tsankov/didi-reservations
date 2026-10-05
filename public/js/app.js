$(function () {
  function buildShell() {
    var $topbar = $('<div class="topbar py-2">').append(
      $('<div class="container d-flex align-items-center justify-content-between gap-3">').append(
        $('<div class="small text-truncate">').append(
          icon('geo-alt-fill').addClass('me-1'),
          $('<span id="address">')
        ),
        $('<div class="btn-group btn-group-sm lang-switch" role="group">').attr('aria-label', 'Language').append(
          $('<button type="button" class="btn btn-outline-light">').attr('data-lang', 'bg').text('BG'),
          $('<button type="button" class="btn btn-outline-light">').attr('data-lang', 'en').text('EN')
        )
      )
    );

    var $hero = $('<header class="hero text-center">').append(
      $('<div class="container">').append(
        $('<h1 class="display-5 fw-bold business-name mb-2">'),
        $('<p class="lead mb-0">').attr('data-i18n', 'heroSubtitle')
      )
    );

    var $main = $('<main class="container py-5">').append(
      $('<h2 class="h3 mb-4">').attr('data-i18n', 'upcomingClasses'),
      $('<div id="events-state" class="text-center py-5 text-body-secondary">'),
      $('<div id="events" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">')
    );

    var $footer = $('<footer class="contact-section py-5">').append(
      $('<div class="container">').append(
        $('<h2 class="h4 mb-3">').attr('data-i18n', 'contact'),
        $('<ul class="list-unstyled mb-0 contact-list">').append(
          $('<li>').append(icon('person-fill'), $('<span id="contact-name">')),
          $('<li>').append(icon('envelope-fill'), $('<a id="contact-email">')),
          $('<li>').append(icon('telephone-fill'), $('<a id="contact-phone">'))
        )
      )
    );

    var $modal = $('<div class="modal fade" id="reserveModal" tabindex="-1" aria-hidden="true">').attr('aria-labelledby', 'reserveModalLabel').append(
      $('<div class="modal-dialog modal-dialog-centered">').append(
        $('<div class="modal-content">').append(
          $('<div class="modal-header">').append(
            $('<h2 class="modal-title h5" id="reserveModalLabel">').attr('data-i18n', 'reserveTitle'),
            $('<button type="button" class="btn-close">').attr({ 'data-bs-dismiss': 'modal', 'aria-label': 'Close' })
          ),
          $('<div class="modal-body">').append(
            $('<div class="event-summary mb-3">').append(
              $('<h3 class="h5 mb-1" id="modal-event-name">'),
              $('<div class="text-body-secondary small" id="modal-event-when">'),
              $('<p class="mt-2 mb-0 event-description" id="modal-event-description">'),
              $('<div class="mt-2" id="modal-event-spots">')
            ),
            $('<div class="alert alert-success d-none" id="reserve-success" role="status">').append(
              icon('check-circle-fill').addClass('me-1'),
              $('<span>').attr('data-i18n', 'reservationSuccess')
            ),
            $('<form id="reserve-form" novalidate>').append(
              $('<div class="mb-3">').append(
                $('<label for="r-name" class="form-label">').attr('data-i18n', 'yourName'),
                $('<input type="text" class="form-control" id="r-name" name="name" maxlength="100" autocomplete="name" required>'),
                $('<div class="invalid-feedback">').attr('data-i18n', 'err.invalid_name')
              ),
              $('<div class="mb-3">').append(
                $('<label for="r-email" class="form-label">').attr('data-i18n', 'email'),
                $('<input type="email" class="form-control" id="r-email" name="email" maxlength="254" autocomplete="email" required>'),
                $('<div class="invalid-feedback">').attr('data-i18n', 'err.invalid_email')
              ),
              $('<div class="mb-3">').append(
                $('<label for="r-phone" class="form-label">').attr('data-i18n', 'phone'),
                $('<input type="tel" class="form-control" id="r-phone" name="phone" maxlength="20" autocomplete="tel" required>'),
                $('<div class="invalid-feedback">').attr('data-i18n', 'err.invalid_phone')
              ),
              $('<div class="alert alert-danger d-none" id="reserve-error" role="alert">'),
              $('<button type="submit" class="btn btn-primary w-100" id="reserve-submit">').append(
                $('<span class="spinner-border spinner-border-sm me-1 d-none">').attr('aria-hidden', 'true'),
                $('<span>').attr('data-i18n', 'confirmBooking')
              )
            )
          )
        )
      )
    );

    $('#app').append($topbar, $hero, $main, $footer, $modal);
  }

  buildShell();

  const cfg = window.SITE_CONFIG;
  const t = I18n.t;
  const modal = new bootstrap.Modal('#reserveModal');

  let events = null;   // null = not loaded yet
  let loadFailed = false;
  let current = null;  // event shown in the popup

  function renderStatic() {
    document.title = cfg.businessName + ' · ' + t('pageTitle');
    $('#address').text(cfg.address);
    $('.business-name').text(cfg.businessName);
    $('#contact-name').text(cfg.contact.name);
    $('#contact-email').text(cfg.contact.email).attr('href', 'mailto:' + cfg.contact.email);
    $('#contact-phone').text(cfg.contact.phone).attr('href', 'tel:' + cfg.contact.phone.replace(/[^+\d]/g, ''));
  }

  function spotsText(n) {
    return n === 1 ? t('spotsLeftOne') : t('spotsLeft', { n: n });
  }

  function statusOf(ev) {
    if (!ev.bookingOpen) return 'inProgress';
    return ev.spotsLeft > 0 ? 'open' : 'full';
  }

  function statusBadge(ev) {
    const $badge = $('<span class="badge rounded-pill">');
    switch (statusOf(ev)) {
      case 'open':
        return $badge.addClass(ev.spotsLeft <= 3 ? 'text-bg-warning' : 'text-bg-success').text(spotsText(ev.spotsLeft));
      case 'full':
        return $badge.addClass('text-bg-secondary').text(t('full'));
      default:
        return $badge.addClass('text-bg-info').text(t('inProgress'));
    }
  }

  function buildCard(ev) {
    const bookable = statusOf(ev) === 'open';

    const $date = $('<div class="event-date">').append(
      $('<span class="event-day">').text(Time.format(ev.startsAt, { day: 'numeric' })),
      $('<span class="event-month">').text(Time.format(ev.startsAt, { month: 'short' })),
    );

    const $info = $('<div class="flex-grow-1 min-w-0">').append(
      $('<h3 class="h5 card-title mb-1">').text(ev.name),
      $('<div class="small text-body-secondary mb-1">').append(
        icon('calendar3'), ' ', Time.format(ev.startsAt, { weekday: 'long' }),
      ),
      $('<div class="small text-body-secondary mb-2">').append(
        icon('clock'), ' ', Time.timeRange(ev.startsAt, ev.endsAt),
        ' · ', t('duration', { n: ev.durationMinutes }),
      ),
      statusBadge(ev),
    );

    const $card = $('<div class="card h-100 event-card">')
      .attr('data-id', ev.id)
      .append($('<div class="card-body d-flex gap-3">').append($date, $info));

    if (bookable) {
      $card.addClass('is-bookable').attr({ role: 'button', tabindex: 0 }).append(
        $('<div class="card-footer">').append(t('bookNow'), ' ', icon('arrow-right')),
      );
    } else {
      $card.addClass('is-unavailable').attr('aria-disabled', 'true');
    }

    return $('<div class="col">').append($card);
  }

  function renderEvents() {
    const $list = $('#events').empty();
    const $state = $('#events-state').empty().removeClass('d-none');

    if (loadFailed) {
      $state.append(
        $('<p>').text(t('loadError')),
        $('<button type="button" class="btn btn-outline-primary btn-sm" id="retry">').text(t('retry')),
      );
      return;
    }
    if (events === null) {
      $state.append($('<div class="spinner-border" role="status">').append(
        $('<span class="visually-hidden">').text(t('loading')),
      ));
      return;
    }
    if (!events.length) {
      $state.append(icon('calendar-x').addClass('fs-1 d-block mb-2'), $('<p>').text(t('noEvents')));
      return;
    }

    $state.addClass('d-none');
    events.forEach(function (ev) { $list.append(buildCard(ev)); });
  }

  function loadEvents() {
    loadFailed = false;
    return $.getJSON('/api/events')
      .done(function (data) { events = data.events; })
      .fail(function () { loadFailed = events === null; })
      .always(renderEvents);
  }

  // ---- Reservation popup ----

  function renderModalEvent() {
    if (!current) return;
    $('#modal-event-name').text(current.name);
    $('#modal-event-when').empty().append(
      icon('calendar3'), ' ', Time.longDate(current.startsAt), ' · ',
      icon('clock'), ' ', Time.timeRange(current.startsAt, current.endsAt),
    );
    $('#modal-event-description').text(current.description).toggleClass('d-none', !current.description);
    $('#modal-event-spots').empty().append(statusBadge(current));
  }

  function openReservation(id) {
    current = events.find(function (ev) { return ev.id === id; });
    if (!current) return;

    const form = $('#reserve-form')[0];
    form.reset();
    $(form).removeClass('was-validated d-none');
    $('#reserve-error, #reserve-success').addClass('d-none');
    renderModalEvent();
    modal.show();
  }

  function setBusy(busy) {
    $('#reserve-submit').prop('disabled', busy).find('.spinner-border').toggleClass('d-none', !busy);
  }

  $('#events').on('click', '.is-bookable', function () {
    openReservation($(this).data('id'));
  });
  $('#events').on('keydown', '.is-bookable', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openReservation($(this).data('id'));
    }
  });
  $('#events-state').on('click', '#retry', function () {
    events = null;
    loadFailed = false;
    renderEvents();
    loadEvents();
  });

  $('#reserveModal').on('shown.bs.modal', function () {
    $('#r-name').trigger('focus');
  });

  $('#reserve-form').on('submit', function (e) {
    e.preventDefault();
    const form = this;
    $('#reserve-error').addClass('d-none');

    if (!form.checkValidity()) {
      $(form).addClass('was-validated');
      return;
    }

    setBusy(true);
    $.ajax({
      url: '/api/events/' + current.id + '/reserve',
      method: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({
        name: $('#r-name').val(),
        email: $('#r-email').val(),
        phone: $('#r-phone').val(),
      }),
    })
      .done(function () {
        $(form).addClass('d-none');
        $('#reserve-success').removeClass('d-none');
        loadEvents().done(function () {
          const fresh = events.find(function (ev) { return ev.id === current.id; });
          if (fresh) { current = fresh; renderModalEvent(); }
        });
      })
      .fail(function (xhr) {
        $('#reserve-error').text(I18n.error(xhr)).removeClass('d-none');
        loadEvents();
      })
      .always(function () { setBusy(false); });
  });

  I18n.onChange(function () {
    renderStatic();
    renderEvents();
    renderModalEvent();
  });

  I18n.apply();
  renderStatic();
  renderEvents();
  loadEvents();
});
