$(function () {
  function buildShell() {
    var $navbar = $('<nav class="navbar topbar">').append(
      $('<div class="container gap-2">').append(
        $('<span class="navbar-brand text-white mb-0 h1 fs-5">').append(
          $('<span class="business-name">'),
          ' · ',
          $('<span>').attr('data-i18n', 'admin.title')
        ),
        $('<div class="d-flex align-items-center gap-2">').append(
          $('<a class="btn btn-sm btn-outline-light" target="_blank" rel="noopener">').attr('href', '/').append(
            icon('box-arrow-up-right'),
            $('<span class="d-none d-sm-inline">').attr('data-i18n', 'admin.viewSite')
          ),
          $('<div class="btn-group btn-group-sm lang-switch" role="group">').attr('aria-label', 'Language').append(
            $('<button type="button" class="btn btn-outline-light">').attr('data-lang', 'bg').text('BG'),
            $('<button type="button" class="btn btn-outline-light">').attr('data-lang', 'en').text('EN')
          ),
          $('<button type="button" class="btn btn-sm btn-light d-none" id="logout">').append(
            icon('box-arrow-right'),
            $('<span class="d-none d-sm-inline">').attr('data-i18n', 'admin.logout')
          )
        )
      )
    );

    var $loginView = $('<section id="login-view" class="container d-none">').append(
      $('<div class="card admin-login shadow-sm">').append(
        $('<div class="card-body p-4">').append(
          $('<h1 class="h4 mb-3">').attr('data-i18n', 'admin.loginTitle'),
          $('<form id="login-form">').append(
            $('<div class="mb-3">').append(
              $('<label for="password" class="form-label">').attr('data-i18n', 'admin.password'),
              $('<input type="password" class="form-control" id="password" autocomplete="current-password" required>')
            ),
            $('<div class="alert alert-danger d-none" id="login-error" role="alert">'),
            $('<button type="submit" class="btn btn-primary w-100" id="login-submit">').attr('data-i18n', 'admin.login')
          )
        )
      )
    );

    var $appView = $('<main id="app-view" class="container py-4 d-none">').append(
      $('<div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">').append(
        $('<h1 class="h3 mb-0">').attr('data-i18n', 'admin.classes'),
        $('<div class="d-flex flex-wrap gap-2">').append(
          $('<div class="btn-group btn-group-sm" role="group" id="filter">').append(
            $('<button type="button" class="btn btn-outline-secondary active">').attr({ 'data-filter': 'all', 'data-i18n': 'admin.filterAll' }),
            $('<button type="button" class="btn btn-outline-secondary">').attr({ 'data-filter': 'upcoming', 'data-i18n': 'admin.filterUpcoming' }),
            $('<button type="button" class="btn btn-outline-secondary">').attr({ 'data-filter': 'past', 'data-i18n': 'admin.filterPast' })
          ),
          $('<button type="button" class="btn btn-primary btn-sm" id="new-event">').append(
            icon('plus-lg'),
            ' ',
            $('<span>').attr('data-i18n', 'admin.newClass')
          )
        )
      ),
      $('<div class="card shadow-sm">').append(
        $('<div class="table-responsive">').append(
          $('<table class="table table-hover mb-0 events-table">').append(
            $('<thead>').append(
              $('<tr>').append(
                $('<th>').attr('data-i18n', 'admin.colName'),
                $('<th>').attr('data-i18n', 'admin.colDate'),
                $('<th class="text-center">').attr('data-i18n', 'admin.colBooked'),
                $('<th>').attr('data-i18n', 'admin.colStatus')
              )
            ),
            $('<tbody id="events-body">')
          )
        ),
        $('<div id="events-empty" class="text-center text-body-secondary py-5 d-none">').attr('data-i18n', 'admin.noClasses')
      )
    );

    var $eventModal = $('<div class="modal fade" id="eventModal" tabindex="-1" aria-hidden="true">').attr('aria-labelledby', 'eventModalLabel').append(
      $('<div class="modal-dialog modal-lg modal-dialog-scrollable">').append(
        $('<div class="modal-content">').append(
          $('<div class="modal-header">').append(
            $('<h2 class="modal-title h5" id="eventModalLabel">'),
            $('<button type="button" class="btn-close">').attr({ 'data-bs-dismiss': 'modal', 'aria-label': 'Close' })
          ),
          $('<div class="modal-body">').append(
            $('<form id="event-form" novalidate>').append(
              $('<div class="row g-3">').append(
                $('<div class="col-12">').append(
                  $('<label for="e-name" class="form-label">').attr('data-i18n', 'admin.name'),
                  $('<input type="text" class="form-control" id="e-name" maxlength="120" required>'),
                  $('<div class="invalid-feedback">').attr('data-i18n', 'err.invalid_name')
                ),
                $('<div class="col-12">').append(
                  $('<label for="e-description" class="form-label">').attr('data-i18n', 'admin.description'),
                  $('<textarea class="form-control" id="e-description" rows="3" maxlength="2000">')
                ),
                $('<div class="col-md-6">').append(
                  $('<label for="e-start" class="form-label">').attr('data-i18n', 'admin.start'),
                  $('<input type="datetime-local" class="form-control" id="e-start" required>'),
                  $('<div class="invalid-feedback">').attr('data-i18n', 'err.invalid_start')
                ),
                $('<div class="col-6 col-md-3">').append(
                  $('<label for="e-duration" class="form-label">').attr('data-i18n', 'admin.duration'),
                  $('<input type="number" class="form-control" id="e-duration" min="1" max="1440" step="1" required>'),
                  $('<div class="invalid-feedback">').attr('data-i18n', 'err.invalid_duration')
                ),
                $('<div class="col-6 col-md-3">').append(
                  $('<label for="e-capacity" class="form-label">').attr('data-i18n', 'admin.capacity'),
                  $('<input type="number" class="form-control" id="e-capacity" min="1" max="1000" step="1" required>'),
                  $('<div class="invalid-feedback">').attr('data-i18n', 'err.invalid_capacity')
                )
              ),
              $('<div class="alert alert-danger mt-3 mb-0 d-none" id="event-error" role="alert">'),
              $('<div class="alert alert-success mt-3 mb-0 d-none" id="event-saved" role="status">').attr('data-i18n', 'admin.saved'),
              $('<div class="d-flex justify-content-between gap-2 mt-3">').append(
                $('<button type="button" class="btn btn-outline-danger" id="delete-event">').append(
                  icon('trash'),
                  ' ',
                  $('<span>').attr('data-i18n', 'admin.deleteClass')
                ),
                $('<button type="submit" class="btn btn-primary ms-auto" id="save-event">').append(
                  icon('check-lg'),
                  ' ',
                  $('<span>').attr('data-i18n', 'admin.save')
                )
              )
            ),
            $('<section id="signups" class="mt-4 pt-3 border-top">').append(
              $('<h3 class="h6 mb-3" id="signups-title">'),
              $('<p class="text-body-secondary mb-0 d-none" id="signups-empty">').attr('data-i18n', 'admin.noSignups'),
              $('<div class="table-responsive">').append(
                $('<table class="table table-sm align-middle mb-0" id="signups-table">').append(
                  $('<thead>').append(
                    $('<tr>').append(
                      $('<th>').attr('data-i18n', 'yourName'),
                      $('<th>').attr('data-i18n', 'email'),
                      $('<th>').attr('data-i18n', 'phone'),
                      $('<th>').attr('data-i18n', 'admin.bookedAt'),
                      $('<th>')
                    )
                  ),
                  $('<tbody id="signups-body">')
                )
              )
            )
          )
        )
      )
    );

    $('#app').append($navbar, $loginView, $appView, $eventModal);
  }

  buildShell();

  const t = I18n.t;
  const modal = new bootstrap.Modal('#eventModal');

  let events = [];
  let filter = 'all';
  let current = null; // { event, reservations } while editing; null when creating

  function api(method, url, body) {
    return $.ajax({
      url: url,
      method: method,
      dataType: 'json',
      contentType: body ? 'application/json' : undefined,
      data: body ? JSON.stringify(body) : undefined,
    }).fail(function (xhr) {
      // Login and the start-up session check handle their own 401s.
      if (xhr.status === 401 && url !== '/api/admin/login' && url !== '/api/admin/session') {
        modal.hide();
        showLogin(I18n.error(xhr));
      }
    });
  }

  // ---- Login / logout ----

  function showLogin(message) {
    $('#app-view').addClass('d-none');
    $('#logout').addClass('d-none');
    $('#login-view').removeClass('d-none');
    $('#login-error').text(message || '').toggleClass('d-none', !message);
    $('#password').val('').trigger('focus');
  }

  function showApp() {
    $('#login-view').addClass('d-none');
    $('#app-view, #logout').removeClass('d-none');
    loadEvents();
  }

  $('#login-form').on('submit', function (e) {
    e.preventDefault();
    $('#login-submit').prop('disabled', true);
    api('POST', '/api/admin/login', { password: $('#password').val() })
      .done(showApp)
      .fail(function (xhr) { showLogin(I18n.error(xhr)); })
      .always(function () { $('#login-submit').prop('disabled', false); });
  });

  $('#logout').on('click', function () {
    api('POST', '/api/admin/logout').always(function () { showLogin(); });
  });

  // ---- Event list ----

  function statusOf(ev) {
    const now = Date.now();
    if (ev.endsAt <= now) return 'past';
    if (ev.startsAt <= now) return 'inProgress';
    return 'upcoming';
  }

  const STATUS_BADGE = {
    upcoming: ['text-bg-success', 'admin.statusUpcoming'],
    inProgress: ['text-bg-info', 'admin.statusInProgress'],
    past: ['text-bg-secondary', 'admin.statusPast'],
  };

  function renderTable() {
    const $body = $('#events-body').empty();
    const visible = events.filter(function (ev) {
      const status = statusOf(ev);
      if (filter === 'upcoming') return status !== 'past';
      if (filter === 'past') return status === 'past';
      return true;
    });

    $('#events-empty').toggleClass('d-none', visible.length > 0);

    visible.forEach(function (ev) {
      const status = statusOf(ev);
      const badge = STATUS_BADGE[status];
      $body.append(
        $('<tr>').attr('data-id', ev.id).toggleClass('is-past', status === 'past').append(
          $('<td class="fw-semibold">').text(ev.name),
          $('<td>').append(
            $('<div>').text(Time.longDate(ev.startsAt, true)),
            $('<div class="small text-body-secondary">').text(Time.timeRange(ev.startsAt, ev.endsAt)),
          ),
          $('<td class="text-center">').text(ev.booked + ' / ' + ev.capacity),
          $('<td>').append($('<span class="badge">').addClass(badge[0]).text(t(badge[1]))),
        ),
      );
    });
  }

  function loadEvents() {
    return api('GET', '/api/admin/events').done(function (data) {
      events = data.events;
      renderTable();
    });
  }

  $('#filter').on('click', '[data-filter]', function () {
    filter = $(this).data('filter');
    $('#filter [data-filter]').removeClass('active');
    $(this).addClass('active');
    renderTable();
  });

  $('#events-body').on('click', 'tr', function () {
    api('GET', '/api/admin/events/' + $(this).data('id')).done(function (data) {
      openModal(data);
    });
  });

  $('#new-event').on('click', function () {
    openModal(null);
  });

  // ---- Create / edit popup ----

  function clearMessages() {
    $('#event-error, #event-saved').addClass('d-none');
  }

  function renderModal() {
    const editing = current !== null;
    $('#eventModalLabel').text(t(editing ? 'admin.editClass' : 'admin.createClass'));
    $('#delete-event, #signups').toggleClass('d-none', !editing);
    if (editing) renderSignups();
  }

  function fillForm() {
    const ev = current && current.event;
    $('#e-name').val(ev ? ev.name : '');
    $('#e-description').val(ev ? ev.description : '');
    $('#e-start').val(ev ? Time.toSofiaInput(ev.startsAt) : '');
    $('#e-duration').val(ev ? ev.durationMinutes : 60);
    $('#e-capacity').val(ev ? ev.capacity : 12);
  }

  function openModal(details) {
    current = details;
    $('#event-form').removeClass('was-validated');
    clearMessages();
    fillForm();
    renderModal();
    modal.show();
  }

  function renderSignups() {
    const ev = current.event;
    const list = current.reservations;
    $('#signups-title').text(t('admin.signups', { n: list.length, cap: ev.capacity }));
    $('#signups-empty').toggleClass('d-none', list.length > 0);
    $('#signups-table').toggleClass('d-none', list.length === 0);

    const $body = $('#signups-body').empty();
    list.forEach(function (r) {
      $body.append(
        $('<tr>').append(
          $('<td>').text(r.name),
          $('<td>').append($('<a>').attr('href', 'mailto:' + r.email).text(r.email)),
          $('<td class="text-nowrap">').append($('<a>').attr('href', 'tel:' + r.phone.replace(/[^+\d]/g, '')).text(r.phone)),
          $('<td class="small text-body-secondary text-nowrap">').text(
            Time.format(r.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
          ),
          $('<td class="text-end">').append(
            $('<button type="button" class="btn btn-sm btn-outline-danger remove-signup">')
              .attr({ 'data-id': r.id, 'data-name': r.name, title: t('admin.remove'), 'aria-label': t('admin.remove') })
              .append(icon('x-lg')),
          ),
        ),
      );
    });
  }

  $('#eventModal').on('shown.bs.modal', function () {
    if (!current) $('#e-name').trigger('focus');
  });

  $('#event-form').on('submit', function (e) {
    e.preventDefault();
    clearMessages();

    const startsAt = Time.fromSofiaInput($('#e-start').val());
    $('#e-start')[0].setCustomValidity(startsAt ? '' : 'invalid');
    if (!this.checkValidity()) {
      $(this).addClass('was-validated');
      return;
    }

    const body = {
      name: $('#e-name').val(),
      description: $('#e-description').val(),
      startsAt: startsAt,
      durationMinutes: Number($('#e-duration').val()),
      capacity: Number($('#e-capacity').val()),
    };
    const request = current
      ? api('PUT', '/api/admin/events/' + current.event.id, body)
      : api('POST', '/api/admin/events', body);

    $('#save-event').prop('disabled', true);
    request
      .done(function (data) {
        current = data;
        $('#event-form').removeClass('was-validated');
        fillForm();
        renderModal();
        $('#event-saved').removeClass('d-none');
        loadEvents();
      })
      .fail(function (xhr) {
        if (xhr.status !== 401) $('#event-error').text(I18n.error(xhr)).removeClass('d-none');
      })
      .always(function () { $('#save-event').prop('disabled', false); });
  });

  $('#delete-event').on('click', function () {
    if (!current || !window.confirm(t('admin.confirmDelete'))) return;
    api('DELETE', '/api/admin/events/' + current.event.id)
      .done(function () {
        modal.hide();
        loadEvents();
      })
      .fail(function (xhr) {
        if (xhr.status !== 401) $('#event-error').text(I18n.error(xhr)).removeClass('d-none');
      });
  });

  $('#signups-body').on('click', '.remove-signup', function () {
    const $btn = $(this);
    if (!window.confirm(t('admin.confirmRemove', { name: $btn.data('name') }))) return;

    $btn.prop('disabled', true);
    api('DELETE', '/api/admin/reservations/' + $btn.data('id'))
      .then(function () { return api('GET', '/api/admin/events/' + current.event.id); })
      .done(function (data) {
        current = data;
        renderSignups();
        loadEvents();
      })
      .fail(function (xhr) {
        $btn.prop('disabled', false);
        if (xhr.status !== 401) $('#event-error').text(I18n.error(xhr)).removeClass('d-none');
      });
  });

  // ---- Start-up ----

  I18n.onChange(function () {
    document.title = t('admin.title') + ' · ' + SITE_CONFIG.businessName;
    renderTable();
    if ($('#eventModal').hasClass('show')) renderModal();
  });

  I18n.apply();
  document.title = t('admin.title') + ' · ' + SITE_CONFIG.businessName;
  $('.business-name').text(SITE_CONFIG.businessName);

  api('GET', '/api/admin/session')
    .done(showApp)
    .fail(function (xhr) {
      showLogin(xhr.status === 401 ? '' : I18n.error(xhr));
    });
});
