interface AdminEvent {
  id: number;
  name: string;
  description: string;
  startsAt: number;
  endsAt: number;
  durationMinutes: number;
  booked: number;
  capacity: number;
}

interface Reservation {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: number;
}

interface EventDetails {
  event: AdminEvent;
  reservations: Reservation[];
}

class AdminPage {
  private modal: bootstrap.Modal;
  private events: AdminEvent[] = [];
  private filter = 'all';
  private current: EventDetails | null = null; // { event, reservations } while editing; null when creating

  private readonly STATUS_BADGE: Record<string, [string, TranslationKey]> = {
    upcoming: ['text-bg-success', 'admin.statusUpcoming'],
    inProgress: ['text-bg-info', 'admin.statusInProgress'],
    past: ['text-bg-secondary', 'admin.statusPast'],
  };

  constructor() {
    this.modal = new bootstrap.Modal('#eventModal');

    $('#login-form').on('submit', e => {
      e.preventDefault();
      $('#login-submit').prop('disabled', true);
      this.api('POST', '/api/admin/login', { password: $('#password').val() })
        .done(() => this.showApp())
        .fail((xhr: JQueryXHR) => this.showLogin(I18n.error(xhr)))
        .always(() => { $('#login-submit').prop('disabled', false); });
    });

    $('#logout').on('click', () => {
      this.api('POST', '/api/admin/logout').always(() => this.showLogin());
    });

    $('#filter').on('click', '[data-filter]', (e) => {
      const el = e.currentTarget as HTMLElement;
      this.filter = $(el).data('filter') as string;
      $('#filter [data-filter]').removeClass('active');
      $(el).addClass('active');
      this.renderTable();
    });

    $('#events-body').on('click', 'tr', (e) => {
      const el = e.currentTarget as HTMLElement;
      this.api('GET', `/api/admin/events/${$(el).data('id') as number}`).done((data: EventDetails) => this.openModal(data));
    });

    $('#new-event').on('click', () => this.openModal(null));

    $('#eventModal').on('shown.bs.modal', () => {
      if (!this.current) $('#e-name').trigger('focus');
    });

    $('#event-form').on('submit', (e: JQuery.SubmitEvent) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;
      this.clearMessages();

      const startsAt = Time.fromSofiaInput(`${$('#e-start-date').val() as string}T${$('#e-start-time').val() as string}`);
      if (!form.checkValidity()) {
        $(form).addClass('was-validated');
        return;
      }

      const body = {
        name: $('#e-name').val() as string,
        description: $('#e-description').val() as string,
        startsAt: startsAt as number,
        durationMinutes: Number($('#e-duration').val()),
        capacity: Number($('#e-capacity').val()),
      };
      const request = this.current
        ? this.api('PUT', `/api/admin/events/${this.current.event.id}`, body)
        : this.api('POST', '/api/admin/events', body);

      $('#save-event').prop('disabled', true);
      request
        .done((data: EventDetails) => {
          this.current = data;
          $('#event-form').removeClass('was-validated');
          this.fillForm();
          this.renderModal();
          $('#event-saved').removeClass('d-none');
          this.loadEvents();
        })
        .fail((xhr: JQueryXHR) => {
          if (xhr.status !== 401) $('#event-error').text(I18n.error(xhr)).removeClass('d-none');
        })
        .always(() => { $('#save-event').prop('disabled', false); });
    });

    $('#delete-event').on('click', () => {
      if (!this.current || !window.confirm(I18n.t('admin.confirmDelete'))) return;
      this.api('DELETE', `/api/admin/events/${this.current.event.id}`)
        .done(() => {
          this.modal.hide();
          this.loadEvents();
        })
        .fail((xhr: JQueryXHR) => {
          if (xhr.status !== 401) $('#event-error').text(I18n.error(xhr)).removeClass('d-none');
        });
    });

    $('#signups-body').on('click', '.remove-signup', (e) => {
      const el = e.currentTarget as HTMLElement;
      const $btn = $(el);
      if (!window.confirm(I18n.t('admin.confirmRemove', { name: $btn.data('name') as string }))) return;

      $btn.prop('disabled', true);
      this.api('DELETE', `/api/admin/reservations/${$btn.data('id') as number}`)
        .then(() => this.api('GET', `/api/admin/events/${this.current!.event.id}`))
        .done((data: EventDetails) => {
          this.current = data;
          this.renderSignups();
          this.loadEvents();
        })
        .fail((xhr: JQueryXHR) => {
          $btn.prop('disabled', false);
          if (xhr.status !== 401) $('#event-error').text(I18n.error(xhr)).removeClass('d-none');
        });
    });

    // ---- Start-up ----

    I18n.onChange(() => {
      document.title = `${I18n.t('admin.title')} · ${SITE_CONFIG.businessName}`;
      this.renderTable();
      if ($('#eventModal').hasClass('show')) this.renderModal();
    });

    I18n.apply();
    document.title = `${I18n.t('admin.title')} · ${SITE_CONFIG.businessName}`;
    $('.business-name').text(SITE_CONFIG.businessName);

    this.api('GET', '/api/admin/session')
      .done(() => this.showApp())
      .fail((xhr: JQueryXHR) => {
        this.showLogin(xhr.status === 401 ? '' : I18n.error(xhr));
      });
  }

  private api(method: string, url: string, body?: unknown): JQueryXHR {
    const settings: JQueryAjaxSettings = {
      url,
      method,
      dataType: 'json',
    };
    if (body !== undefined) {
      settings.contentType = 'application/json';
      settings.data = JSON.stringify(body);
    }
    return $.ajax(settings).fail((xhr: JQueryXHR) => {
      // Login and the start-up session check handle their own 401s.
      if (xhr.status === 401 && url !== '/api/admin/login' && url !== '/api/admin/session') {
        this.modal.hide();
        this.showLogin(I18n.error(xhr));
      }
    });
  }

  // ---- Login / logout ----

  private showLogin(message?: string): void {
    $('#app-view').addClass('d-none');
    $('#logout').addClass('d-none');
    $('#login-view').removeClass('d-none');
    $('#login-error').text(message || '').toggleClass('d-none', !message);
    $('#password').val('').trigger('focus');
  }

  private showApp(): void {
    $('#login-view').addClass('d-none');
    $('#app-view, #logout').removeClass('d-none');
    this.loadEvents();
  }

  // ---- Event list ----

  private statusOf(ev: AdminEvent): 'past' | 'inProgress' | 'upcoming' {
    const now = Date.now();
    if (ev.endsAt <= now) return 'past';
    if (ev.startsAt <= now) return 'inProgress';
    return 'upcoming';
  }

  private renderTable(): void {
    const $body = $('#events-body').empty();
    const visible = this.events.filter(ev => {
      const status = this.statusOf(ev);
      if (this.filter === 'upcoming') return status !== 'past';
      if (this.filter === 'past') return status === 'past';
      return true;
    });

    $('#events-empty').toggleClass('d-none', visible.length > 0);

    visible.forEach(ev => {
      const status = this.statusOf(ev);
      const badge = this.STATUS_BADGE[status];
      $body.append(
        $('<tr>').attr('data-id', ev.id).toggleClass('is-past', status === 'past').append(
          $('<td class="fw-semibold">').text(ev.name),
          $('<td>').append(
            $('<div>').text(Time.longDate(ev.startsAt, true)),
            $('<div class="small text-body-secondary">').text(Time.timeRange(ev.startsAt, ev.endsAt)),
          ),
          $('<td class="text-center">').text(`${ev.booked} / ${ev.capacity}`),
          $('<td>').append($('<span class="badge">').addClass(badge[0]).text(I18n.t(badge[1]))),
        ),
      );
    });
  }

  private loadEvents(): JQueryXHR {
    return this.api('GET', '/api/admin/events').done((data: { events: AdminEvent[] }) => {
      this.events = data.events;
      this.renderTable();
    });
  }

  // ---- Create / edit popup ----

  private clearMessages(): void {
    $('#event-error, #event-saved').addClass('d-none');
  }

  private renderModal(): void {
    const editing = this.current !== null;
    $('#eventModalLabel').text(I18n.t(editing ? 'admin.editClass' : 'admin.createClass'));
    $('#delete-event, #signups').toggleClass('d-none', !editing);
    if (editing) this.renderSignups();
  }

  private fillForm(): void {
    const ev = this.current && this.current.event;
    $('#e-name').val(ev ? ev.name : '');
    $('#e-description').val(ev ? ev.description : '');
    const sofiaStr = ev ? Time.toSofiaInput(ev.startsAt) : '';
    $('#e-start-date').val(sofiaStr ? sofiaStr.split('T')[0] : '');
    $('#e-start-time').val(sofiaStr ? sofiaStr.split('T')[1] : '');
    $('#e-duration').val(ev ? ev.durationMinutes : 60);
    $('#e-capacity').val(ev ? ev.capacity : 12);
  }

  private openModal(details: EventDetails | null): void {
    this.current = details;
    $('#event-form').removeClass('was-validated');
    this.clearMessages();
    this.fillForm();
    this.renderModal();
    this.modal.show();
  }

  private renderSignups(): void {
    const ev = this.current!.event;
    const list = this.current!.reservations;
    $('#signups-title').text(I18n.t('admin.signups', { n: list.length, cap: ev.capacity }));
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
              .attr({ 'data-id': r.id, 'data-name': r.name, title: I18n.t('admin.remove'), 'aria-label': I18n.t('admin.remove') })
              .append(icon('x-lg')),
          ),
        ),
      );
    });
  }
}

$(() => { new AdminPage(); });
