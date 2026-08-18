import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import Soup from 'gi://Soup';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const FLAMENGO_TEAM_ID = '819';
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const ESPN_LEAGUES = ['bra.1', 'conmebol.libertadores'];
const POLL_INTERVAL_NORMAL = 3600;
const POLL_INTERVAL_LIVE = 30;
const LIVE_STATES = ['in'];
const MAX_MATCHES = 5;

let extension;

export default class FlamengoScoresExtension extends Extension {
  enable() {
    extension = this;
    this._enabled = true;
    this._settings = this.getSettings();
    this._indicator = new FlamengoIndicator(this.path);
    Main.panel.addToStatusArea(this.metadata.uuid, this._indicator);
    this._fetchData();
    this._setPollInterval(POLL_INTERVAL_NORMAL);
    this._settingsChangedId = this._settings.connect('changed::refresh-interval', () => {
      this._fetchData();
    });
  }

  disable() {
    this._enabled = false;
    if (this._settingsChangedId) {
      this._settings.disconnect(this._settingsChangedId);
      this._settingsChangedId = null;
    }
    if (this._timeout) {
      GLib.source_remove(this._timeout);
      this._timeout = null;
    }
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
    this._settings = null;
  }

  _fetchData() {
    const now = new Date();
    const from = this._formatApiDate(now);
    const to = new Date(now.getTime() + 180 * 24 * 3600 * 1000);
    const toStr = this._formatApiDate(to);
    const range = `${from}-${toStr}`;
    let pending = ESPN_LEAGUES.length;
    const allEvents = [];

    ESPN_LEAGUES.forEach(league => {
      const url = `${ESPN_API_BASE}/${league}/scoreboard?dates=${range}`;
      this._apiCall(url, (data) => {
        if (data && data.events) {
          data.events.forEach(event => {
            const competitors = event.competitions?.[0]?.competitors || [];
            const isFlamengo = competitors.some(c => c.team?.id === FLAMENGO_TEAM_ID);
            if (isFlamengo) {
              allEvents.push(event);
            }
          });
        }
        pending--;
        if (pending === 0) {
          this._processEvents(allEvents);
        }
      });
    });
  }

  _formatApiDate(date) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
  }

  _processEvents(events) {
    events.sort((a, b) => a.date.localeCompare(b.date));

    const live = events.filter(e =>
      LIVE_STATES.includes(e.competitions?.[0]?.status?.type?.state));
    const upcoming = events.filter(e =>
      e.competitions?.[0]?.status?.type?.state === 'pre');

    this._indicator?.updateLive(live);
    this._indicator?.updateMatches(upcoming.slice(0, MAX_MATCHES));

    this._setPollInterval(live.length > 0
      ? POLL_INTERVAL_LIVE
      : Math.max(this._settings?.get_int('refresh-interval') ?? POLL_INTERVAL_NORMAL, 15));
  }

  _apiCall(url, callback) {
    try {
      const session = new Soup.Session();
      const message = Soup.Message.new('GET', url);
      message.get_request_headers().append('User-Agent', 'curl/8.18.0');

      session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (session, result) => {
        try {
          const bytes = session.send_and_read_finish(result);
          const decoder = new TextDecoder('utf-8');
          const text = decoder.decode(bytes.get_data());
          const data = JSON.parse(text);
          callback(data);
        } catch (e) {
          console.error('Flamengo Scores API error:', e.message);
          callback(null);
        }
      });
    } catch (e) {
      console.error('Flamengo Scores fetch error:', e.message);
      callback(null);
    }
  }

  _setPollInterval(seconds) {
    if (this._timeout) {
      GLib.source_remove(this._timeout);
    }
    this._timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, seconds, () => {
      this._fetchData();
      return GLib.SOURCE_CONTINUE;
    });
  }
}

const FlamengoIndicator = GObject.registerClass(
class FlamengoIndicator extends PanelMenu.Button {
  _init(extensionPath) {
    super._init(0.0, '');
    
    this._box = new St.BoxLayout({
      style_class: 'panel-status-indicators-box',
    });
    
    // Usar escudo do Flamengo como ícone
    const iconPath = GLib.build_filenamev([extensionPath, 'flamengo.svg']);
    const file = Gio.File.new_for_path(iconPath);
    const gicon = new Gio.FileIcon({ file });
    this._icon = new St.Icon({
      gicon: gicon,
      style_class: 'system-status-icon',
    });
    this._box.add_child(this._icon);
    
    this._label = new St.Label({
      text: '',
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER,
    });
    this._box.add_child(this._label);
    
    this.add_child(this._box);
    
    this._liveSection = null;
    this._matchesSection = null;
    this._buildMenu();
  }

  _buildMenu() {
    this._liveSection = new PopupMenu.PopupMenuSection();
    this.menu.addMenuItem(this._liveSection);
    
    this._matchesSection = new PopupMenu.PopupMenuSection();
    this.menu.addMenuItem(this._matchesSection);
    
    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    
    const settingsItem = new PopupMenu.PopupMenuItem('Configurações');
    settingsItem.connect('activate', () => {
      extension?.openPreferences();
    });
    this.menu.addMenuItem(settingsItem);
  }

  _formatEventTime(event) {
    const date = new Date(event.date);
    if (isNaN(date.getTime())) return '';
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  }

  _competitors(event) {
    const comp = event.competitions?.[0];
    const list = comp?.competitors || [];
    const home = list.find(c => c.homeAway === 'home') || list[0];
    const away = list.find(c => c.homeAway === 'away') || list[1];
    return { home, away };
  }

  _leagueLabel(event) {
    const note = event.competitions?.[0]?.altGameNote;
    if (!note) return '';
    const base = note.replace(/,\s*Round of \d+.*/, '');
    return base === 'Brazil Serie A' ? 'Brasileirão' : base;
  }

  updateMatches(matches) {
    this._matchesSection.removeAll();

    if (!matches || matches.length === 0) {
      const item = new PopupMenu.PopupMenuItem('Nenhum jogo encontrado');
      this._matchesSection.addMenuItem(item);
      return;
    }

    matches.forEach(event => {
      const { home, away } = this._competitors(event);
      const dateStr = this._formatEventTime(event).split(' ')[0] || '';
      const timeStr = this._formatEventTime(event).split(' ')[1] || '';
      const league = this._leagueLabel(event);

      let text = `${dateStr} ${timeStr} - ${home?.team?.displayName} x ${away?.team?.displayName}`;
      if (league) text += ` (${league})`;

      const item = new PopupMenu.PopupMenuItem(text);
      this._matchesSection.addMenuItem(item);
    });

    const nextMatch = matches[0];
    if (nextMatch) {
      const formatted = this._formatEventTime(nextMatch);
      if (formatted) this._label.set_text(formatted);
    }
  }

  updateLive(matches) {
    this._liveSection.removeAll();

    if (!matches || matches.length === 0) {
      return;
    }

    matches.forEach(event => {
      const { home, away } = this._competitors(event);
      const homeScore = home?.score ?? 0;
      const awayScore = away?.score ?? 0;
      const status = event.competitions?.[0]?.status?.type?.shortDetail ?? '';

      const text = `⚽ ${home?.team?.displayName} ${homeScore} x ${awayScore} ${away?.team?.displayName} (${status})`;
      const item = new PopupMenu.PopupMenuItem(text);
      this._liveSection.addMenuItem(item);

      this._label.set_text(`${homeScore} x ${awayScore}`);
    });
  }
});
