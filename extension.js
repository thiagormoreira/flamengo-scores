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

const FLAMENGO_TEAM_ID = 1953;
const BRASILEIRAO_LEAGUE_ID = 71;
const API_BASE = 'https://v3.football.api-sports.io';
const POLL_INTERVAL_NORMAL = 3600;
const POLL_INTERVAL_LIVE = 30;

let extension;

export default class FlamengoScoresExtension extends Extension {
  enable() {
    extension = this;
    this._settings = this.getSettings();
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
    const apiKey = this._settings.get_string('api-key');
    if (!apiKey || apiKey === '') {
      this._indicator?.showError('Configure API key');
      return;
    }

    this._fetchNextMatches(apiKey);
    this._fetchLiveMatch(apiKey);
  }

  _fetchNextMatches(apiKey) {
    const url = `${API_BASE}/fixtures?team=${FLAMENGO_TEAM_ID}&next=5`;
    this._apiCall(url, apiKey, (data) => {
      if (data && data.response) {
        this._indicator?.updateMatches(data.response);
      }
    });
  }

  _fetchLiveMatch(apiKey) {
    const url = `${API_BASE}/fixtures?live=all`;
    this._apiCall(url, apiKey, (data) => {
      if (data && data.response) {
        const liveMatches = data.response.filter(m => 
          m.teams.home.id === FLAMENGO_TEAM_ID || m.teams.away.id === FLAMENGO_TEAM_ID
        );
        this._indicator?.updateLive(liveMatches);
        if (liveMatches.length > 0) {
          this._setPollInterval(POLL_INTERVAL_LIVE);
        } else {
          this._setPollInterval(POLL_INTERVAL_NORMAL);
        }
      }
    });
  }

  _apiCall(url, apiKey, callback) {
    try {
      const session = new Soup.Session();
      const message = Soup.Message.new('GET', url);
      message.request_headers.append('x-apisports-key', apiKey);
      
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
      text: 'Fla',
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

  updateMatches(matches) {
    this._matchesSection.removeAll();
    
    if (!matches || matches.length === 0) {
      const item = new PopupMenu.PopupMenuItem('Nenhum jogo encontrado');
      this._matchesSection.addMenuItem(item);
      return;
    }

    matches.forEach(match => {
      const date = new Date(match.fixture.date);
      const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const home = match.teams.home.name;
      const away = match.teams.away.name;
      const homeScore = match.goals.home ?? '-';
      const awayScore = match.goals.away ?? '-';
      const status = match.fixture.status.short;
      
      let text;
      if (['1H', 'HT', '2H', 'ET', 'P', 'BT'].includes(status)) {
        text = `AO VIVO: ${home} ${homeScore} x ${awayScore} ${away}`;
      } else if (status === 'FT') {
        text = `${dateStr} ${home} ${homeScore} x ${awayScore} ${away}`;
      } else {
        text = `${dateStr} ${timeStr} - ${home} x ${away}`;
      }
      
      const item = new PopupMenu.PopupMenuItem(text);
      this._matchesSection.addMenuItem(item);
    });
    
    const nextMatch = matches.find(m => ['NS', 'TBD'].includes(m.fixture.status.short));
    if (nextMatch) {
      const date = new Date(nextMatch.fixture.date);
      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      this._label.set_text(`${dateStr} ${timeStr}`);
    }
  }

  updateLive(matches) {
    this._liveSection.removeAll();
    
    if (!matches || matches.length === 0) {
      return;
    }
    
    matches.forEach(match => {
      const home = match.teams.home.name;
      const away = match.teams.away.name;
      const homeScore = match.goals.home ?? 0;
      const awayScore = match.goals.away ?? 0;
      const elapsed = match.fixture.status.elapsed ?? 0;
      
      const text = `⚽ ${home} ${homeScore} x ${awayScore} ${away} (${elapsed}')`;
      const item = new PopupMenu.PopupMenuItem(text);
      this._liveSection.addMenuItem(item);
      
      this._label.set_text(`${homeScore} x ${awayScore}`);
    });
  }

  showError(msg) {
    this._label.set_text(msg);
  }
});
