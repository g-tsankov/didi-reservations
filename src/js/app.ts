interface ClassEvent {
  id: number;
  name: string;
  description: string;
  startsAt: number;
  endsAt: number;
  durationMinutes: number;
  spotsLeft: number;
  bookingOpen: boolean;
}

class AppPage {
  private modal: bootstrap.Modal;
  private events: ClassEvent[] | null = null;   // null = not loaded yet
  private loadFailed = false;
  private current: ClassEvent | null = null;  // event shown in the popup

  constructor() {
    this.modal = new bootstrap.Modal('#reserveModal');

    $('#events').on('click', '.is-bookable', (e) => {
      const el = e.currentTarget as HTMLElement;
      this.openReservation($(el).data('id') as number);
    });
    $('#events').on('keydown', '.is-bookable', (e: JQuery.KeyDownEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const el = e.currentTarget as HTMLElement;
        this.openReservation($(el).data('id') as number);
      }
    });
    $('#events-state').on('click', '#retry', () => {
      this.events = null;
      this.loadFailed = false;
      this.renderEvents();
      this.loadEvents();
    });

    $('#reserveModal').on('shown.bs.modal', () => {
      $('#r-name').trigger('focus');
    });

    $('#reserve-form').on('submit', (e: JQuery.SubmitEvent) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;
      $('#reserve-error').addClass('d-none');

      if (!form.checkValidity()) {
        $(form).addClass('was-validated');
        return;
      }

      this.setBusy(true);
      $.ajax({
        url: `/api/events/${this.current!.id}/reserve`,
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
          name: $('#r-name').val(),
          email: $('#r-email').val(),
          phone: $('#r-phone').val(),
        }),
      })
        .done(() => {
          $(form).addClass('d-none');
          $('#reserve-success').removeClass('d-none');
          this.loadEvents().done(() => {
            const fresh = this.events && this.current ? this.events.find(ev => ev.id === this.current!.id) : undefined;
            if (fresh) { this.current = fresh; this.renderModalEvent(); }
          });
        })
        .fail((xhr: JQueryXHR) => {
          $('#reserve-error').text(I18n.error(xhr)).removeClass('d-none');
          this.loadEvents();
        })
        .always(() => this.setBusy(false));
    });

    I18n.onChange(() => {
      this.renderStatic();
      this.renderEvents();
      this.renderModalEvent();
    });

    I18n.apply();
    this.renderStatic();
    this.renderEvents();
    this.loadEvents();
  }

  private renderStatic(): void {
    const cfg = window.SITE_CONFIG;
    const t = I18n.t;
    document.title = `${cfg.businessName} · ${t('pageTitle')}`;
    $('#address').text(cfg.address);
    $('.business-name').text(cfg.businessName);
    $('#contact-name').text(cfg.contact.name);
    $('#contact-email').text(cfg.contact.email).attr('href', `mailto:${cfg.contact.email}`);
    $('#contact-phone').text(cfg.contact.phone).attr('href', `tel:${cfg.contact.phone.replace(/[^+\d]/g, '')}`);
  }

  private spotsText(n: number): string {
    return n === 1 ? I18n.t('spotsLeftOne') : I18n.t('spotsLeft', { n });
  }

  private statusOf(ev: ClassEvent): 'open' | 'full' | 'inProgress' {
    if (!ev.bookingOpen) return 'inProgress';
    return ev.spotsLeft > 0 ? 'open' : 'full';
  }

  private statusBadge(ev: ClassEvent): JQuery {
    const $badge = $('<span class="badge rounded-pill">');
    switch (this.statusOf(ev)) {
      case 'open':
        return $badge.addClass(ev.spotsLeft <= 3 ? 'text-bg-warning' : 'text-bg-success').text(this.spotsText(ev.spotsLeft));
      case 'full':
        return $badge.addClass('text-bg-secondary').text(I18n.t('full'));
      default:
        return $badge.addClass('text-bg-info').text(I18n.t('inProgress'));
    }
  }

  private buildCard(ev: ClassEvent): JQuery {
    const bookable = this.statusOf(ev) === 'open';

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
        ' · ', I18n.t('duration', { n: ev.durationMinutes }),
      ),
      this.statusBadge(ev),
    );

    const $card = $('<div class="card h-100 event-card">')
      .attr('data-id', ev.id)
      .append($('<div class="card-body d-flex gap-3">').append($date, $info));

    if (bookable) {
      $card.addClass('is-bookable').attr({ role: 'button', tabindex: 0 }).append(
        $('<div class="card-footer">').append(I18n.t('bookNow'), ' ', icon('arrow-right')),
      );
    } else {
      $card.addClass('is-unavailable').attr('aria-disabled', 'true');
    }

    return $('<div class="col">').append($card);
  }

  private renderEvents(): void {
    const $list = $('#events').empty();
    const $state = $('#events-state').empty().removeClass('d-none');

    if (this.loadFailed) {
      $state.append(
        $('<p>').text(I18n.t('loadError')),
        $('<button type="button" class="btn btn-outline-primary btn-sm" id="retry">').text(I18n.t('retry')),
      );
      return;
    }
    if (this.events === null) {
      $state.append($('<div class="spinner-border" role="status">').append(
        $('<span class="visually-hidden">').text(I18n.t('loading')),
      ));
      return;
    }
    if (!this.events.length) {
      $state.append(icon('calendar-x').addClass('fs-1 d-block mb-2'), $('<p>').text(I18n.t('noEvents')));
      return;
    }

    $state.addClass('d-none');
    this.events.forEach(ev => $list.append(this.buildCard(ev)));
  }

  private loadEvents(): JQueryXHR {
    this.loadFailed = false;
    return $.getJSON('/api/events')
      .done((data: { events: ClassEvent[] }) => { this.events = data.events; })
      .fail(() => { this.loadFailed = this.events === null; })
      .always(() => this.renderEvents());
  }

  // ---- Reservation popup ----

  private renderModalEvent(): void {
    if (!this.current) return;
    $('#modal-event-name').text(this.current.name);
    $('#modal-event-when').empty().append(
      icon('calendar3'), ' ', Time.longDate(this.current.startsAt), ' · ',
      icon('clock'), ' ', Time.timeRange(this.current.startsAt, this.current.endsAt),
    );
    $('#modal-event-description').text(this.current.description).toggleClass('d-none', !this.current.description);
    $('#modal-event-spots').empty().append(this.statusBadge(this.current));
  }

  private openReservation(id: number): void {
    if (!this.events) return;
    this.current = this.events.find(ev => ev.id === id) ?? null;
    if (!this.current) return;

    const form = $('#reserve-form')[0] as HTMLFormElement;
    form.reset();
    $(form).removeClass('was-validated d-none');
    $('#reserve-error, #reserve-success').addClass('d-none');
    this.renderModalEvent();
    this.modal.show();
  }

  private setBusy(busy: boolean): void {
    $('#reserve-submit').prop('disabled', busy).find('.spinner-border').toggleClass('d-none', !busy);
  }
}

$(() => { new AppPage(); });
