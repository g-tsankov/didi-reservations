$(() => {
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
    }).fail(xhr => {
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

  $('#login-form').on('submit', e => {
    e.preventDefault();
    $('#login-submit').prop('disabled', true);
    api('POST', '/api/admin/login', { password: $('#password').val() })
      .done(showApp)
      .fail(xhr => showLogin(I18n.error(xhr)))
      .always(() => { $('#login-submit').prop('disabled', false); });
  });

  $('#logout').on('click', () => {
    api('POST', '/api/admin/logout').always(() => showLogin());
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
    const visible = events.filter(ev => {
      const status = statusOf(ev);
      if (filter === 'upcoming') return status !== 'past';
      if (filter === 'past') return status === 'past';
      return true;
    });

    $('#events-empty').toggleClass('d-none', visible.length > 0);

    visible.forEach(ev => {
      const status = statusOf(ev);
      const badge = STATUS_BADGE[status];
      $body.append(
        $('<tr>').attr('data-id', ev.id).toggleClass('is-past', status === 'past').append(
          $('<td class="fw-semibold">').text(ev.name),
          $('<td>').append(
            $('<div>').text(Time.longDate(ev.startsAt, true)),
            $('<div class="small text-body-secondary">').text(Time.timeRange(ev.startsAt, ev.endsAt)),
          ),
          $('<td class="text-center">').text(`${ev.booked} / ${ev.capacity}`),
          $('<td>').append($('<span class="badge">').addClass(badge[0]).text(t(badge[1]))),
        ),
      );
    });
  }

  function loadEvents() {
    return api('GET', '/api/admin/events').done(data => {
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
    api('GET', `/api/admin/events/${$(this).data('id')}`).done(data => openModal(data));
  });

  $('#new-event').on('click', () => openModal(null));

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
    list.forEach(r => {
      $body.append(
        $('<tr>').append(
          $('<td>').text(r.name),
          $('<td>').append($('<a>').attr('href', `mailto:${r.email}`).text(r.email)),
          $('<td class="text-nowrap">').append($('<a>').attr('href', `tel:${r.phone.replace(/[^+\d]/g, '')}`).text(r.phone)),
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

  $('#eventModal').on('shown.bs.modal', () => {
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
      startsAt,
      durationMinutes: Number($('#e-duration').val()),
      capacity: Number($('#e-capacity').val()),
    };
    const request = current
      ? api('PUT', `/api/admin/events/${current.event.id}`, body)
      : api('POST', '/api/admin/events', body);

    $('#save-event').prop('disabled', true);
    request
      .done(data => {
        current = data;
        $('#event-form').removeClass('was-validated');
        fillForm();
        renderModal();
        $('#event-saved').removeClass('d-none');
        loadEvents();
      })
      .fail(xhr => {
        if (xhr.status !== 401) $('#event-error').text(I18n.error(xhr)).removeClass('d-none');
      })
      .always(() => { $('#save-event').prop('disabled', false); });
  });

  $('#delete-event').on('click', () => {
    if (!current || !window.confirm(t('admin.confirmDelete'))) return;
    api('DELETE', `/api/admin/events/${current.event.id}`)
      .done(() => {
        modal.hide();
        loadEvents();
      })
      .fail(xhr => {
        if (xhr.status !== 401) $('#event-error').text(I18n.error(xhr)).removeClass('d-none');
      });
  });

  $('#signups-body').on('click', '.remove-signup', function () {
    const $btn = $(this);
    if (!window.confirm(t('admin.confirmRemove', { name: $btn.data('name') }))) return;

    $btn.prop('disabled', true);
    api('DELETE', `/api/admin/reservations/${$btn.data('id')}`)
      .then(() => api('GET', `/api/admin/events/${current.event.id}`))
      .done(data => {
        current = data;
        renderSignups();
        loadEvents();
      })
      .fail(xhr => {
        $btn.prop('disabled', false);
        if (xhr.status !== 401) $('#event-error').text(I18n.error(xhr)).removeClass('d-none');
      });
  });

  // ---- Start-up ----

  I18n.onChange(() => {
    document.title = `${t('admin.title')} · ${SITE_CONFIG.businessName}`;
    renderTable();
    if ($('#eventModal').hasClass('show')) renderModal();
  });

  I18n.apply();
  document.title = `${t('admin.title')} · ${SITE_CONFIG.businessName}`;
  $('.business-name').text(SITE_CONFIG.businessName);

  api('GET', '/api/admin/session')
    .done(showApp)
    .fail(xhr => {
      showLogin(xhr.status === 401 ? '' : I18n.error(xhr));
    });
});
