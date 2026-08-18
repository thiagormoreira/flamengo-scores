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

const FLAMENGO_TEAM_ID = 134287;
const API_BASE = 'https://www.thesportsdb.com/api/v1/json/123';
const POLL_INTERVAL_NORMAL = 3600;
const POLL_INTERVAL_LIVE = 30;
const LIVE_STATUS = ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'];

let extension;

export default class FlamengoScoresExtension extends Extension {
  enable() {
    extension = this;
    this._settings = this.getSettings();
    this._nextEventId = null;
    this._indicator = new FlamengoIndicator(this.path);
    Main.panel.addToStatusArea(this.metadata.uuid, this._indicator);
    this._fetchData();
    this._timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, POLL_INTERVAL_NORMAL, () => {
      this._fetchData();
      return GLib.SOURCE_CONTINUE;
    });
  }

  disable() {
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
    this._fetchNextMatches();
    this._fetchLiveMatch();
  }

  _fetchNextMatches() {
    const url = `${API_BASE}/eventsnext.php?id=${FLAMENGO_TEAM_ID}`;
    this._apiCall(url, (data) => {
      if (data && data.events) {
        this._indicator?.updateMatches(data.events);
        if (data.events.length > 0) {
          this._nextEventId = data.events[0].idEvent;
        }
      }
    });
  }

  _fetchLiveMatch() {
    if (!this._nextEventId) {
      this._indicator?.updateLive([]);
      this._setPollInterval(POLL_INTERVAL_NORMAL);
      return;
    }

    const url = `${API_BASE}/lookupevent.php?id=${this._nextEventId}`;
    this._apiCall(url, (data) => {
      if (data && data.events && data.events.length > 0) {
        const event = data.events[0];
        if (LIVE_STATUS.includes(event.strStatus)) {
          this._indicator?.updateLive([event]);
          this._setPollInterval(POLL_INTERVAL_LIVE);
        } else {
          this._indicator?.updateLive([]);
          this._setPollInterval(POLL_INTERVAL_NORMAL);
        }
      }
    });
  }

  _apiCall(url, callback) {
    try {
      const session = new Soup.Session();
      const message = Soup.Message.new('GET', url);

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
    const ts = event.strTimestamp || `${event.dateEvent}T${event.strTime}`;
    const date = new Date(ts.endsWith('Z') ? ts : ts + 'Z');
    if (isNaN(date.getTime())) return '';
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  }

  updateMatches(matches) {
    this._matchesSection.removeAll();
    
    if (!matches || matches.length === 0) {
      const item = new PopupMenu.PopupMenuItem('Nenhum jogo encontrado');
      this._matchesSection.addMenuItem(item);
      return;
    }

    matches.forEach(event => {
      const dateStr = this._formatEventTime(event).split(' ')[0] || '';
      const timeStr = this._formatEventTime(event).split(' ')[1] || '';
      const home = event.strHomeTeam;
      const away = event.strAwayTeam;
      const homeScore = event.intHomeScore ?? '-';
      const awayScore = event.intAwayScore ?? '-';
      const status = event.strStatus;
      const league = event.strLeague || '';
      
      let text;
      if (LIVE_STATUS.includes(status)) {
        text = `AO VIVO: ${home} ${homeScore} x ${awayScore} ${away}`;
      } else if (status === 'FT') {
        text = `${dateStr} ${home} ${homeScore} x ${awayScore} ${away}`;
      } else {
        text = `${dateStr} ${timeStr} - ${home} x ${away}${league ? ` (${league})` : ''}`;
      }
      
      const item = new PopupMenu.PopupMenuItem(text);
      this._matchesSection.addMenuItem(item);
    });
    
    const nextMatch = matches.find(e => !LIVE_STATUS.includes(e.strStatus) && e.strStatus !== 'FT');
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
      const home = event.strHomeTeam;
      const away = event.strAwayTeam;
      const homeScore = event.intHomeScore ?? 0;
      const awayScore = event.intAwayScore ?? 0;
      const status = event.strStatus;
      
      const text = `⚽ ${home} ${homeScore} x ${awayScore} ${away} (${status})`;
      const item = new PopupMenu.PopupMenuItem(text);
      this._liveSection.addMenuItem(item);
      
      this._label.set_text(`${homeScore} x ${awayScore}`);
    });
  }

  showError(msg) {
    this._label.set_text(msg);
  }
});
