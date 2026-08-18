import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class FlamengoScoresPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    const pageGeneral = new Adw.PreferencesPage({
      title: 'General',
      icon_name: 'preferences-other-symbolic',
    });
    window.add(pageGeneral);

    const apiGroup = new Adw.PreferencesGroup({
      title: 'Fonte de dados',
      description: 'Usa a ESPN gratuita — nenhuma chave necessária',
    });
    pageGeneral.add(apiGroup);

    const apiKeyRow = new Adw.ActionRow({
      title: 'ESPN (grátis)',
      subtitle: 'Próximos jogos do Flamengo sem cadastro',
    });
    apiGroup.add(apiKeyRow);

    const refreshGroup = new Adw.PreferencesGroup({
      title: 'Atualização',
    });
    pageGeneral.add(refreshGroup);

    const refreshRow = new Adw.SpinRow({
      title: 'Intervalo de atualização (segundos)',
      subtitle: 'Menor valor = mais atualizado, mas mais requisições',
      adjustment: new Gtk.Adjustment({
        lower: 15,
        upper: 3600,
        step_increment: 5,
        page_increment: 60,
        value: settings.get_int('refresh-interval'),
      }),
    });
    refreshRow.connect('notify::value', () => {
      settings.set_int('refresh-interval', refreshRow.get_value());
    });
    refreshGroup.add(refreshRow);

    const pageAbout = new Adw.PreferencesPage({
      title: 'About',
      icon_name: 'dialog-information-symbolic',
    });
    window.add(pageAbout);

    const aboutGroup = new Adw.PreferencesGroup({
      title: 'Flamengo Scores',
      description: 'Extensão GNOME Shell para acompanhar jogos do Flamengo',
    });
    pageAbout.add(aboutGroup);

    const versionRow = new Adw.ActionRow({
      title: 'Versão',
    });
    const meta = this.metadata;
    versionRow.add_suffix(new Gtk.Label({
      label: String(meta.version ?? '1.0.0'),
      css_classes: ['dim-label'],
    }));
    aboutGroup.add(versionRow);

    const uuidRow = new Adw.ActionRow({
      title: 'UUID',
    });
    uuidRow.add_suffix(new Gtk.Label({
      label: meta.uuid,
      css_classes: ['dim-label'],
    }));
    aboutGroup.add(uuidRow);

    const shellRow = new Adw.ActionRow({
      title: 'GNOME Shell',
    });
    shellRow.add_suffix(new Gtk.Label({
      label: meta['shell-version']?.join(', ') ?? '?',
      css_classes: ['dim-label'],
    }));
    aboutGroup.add(shellRow);

    const pageSupport = new Adw.PreferencesPage({
      title: 'Support',
      icon_name: 'help-browser-symbolic',
    });
    window.add(pageSupport);

    const apiGroup2 = new Adw.PreferencesGroup({
      title: 'ESPN',
      description: 'API gratuita sem cadastro usada pela extensão',
    });
    pageSupport.add(apiGroup2);

    const apiLinkRow = new Adw.ActionRow({
      title: 'Site da ESPN',
      activatable: true,
    });
    apiLinkRow.add_suffix(new Gtk.Image({
      icon_name: 'external-link-symbolic',
    }));
    apiLinkRow.connect('activated', () => {
      Gtk.show_uri(window, 'https://www.espn.com.br/futebol/', 0);
    });
    apiGroup2.add(apiLinkRow);

    const docsGroup = new Adw.PreferencesGroup({
      title: 'Documentação',
      description: 'Saiba mais sobre a extensão',
    });
    pageSupport.add(docsGroup);

    const docsLinkRow = new Adw.ActionRow({
      title: 'Documentação da API ESPN',
      activatable: true,
    });
    docsLinkRow.add_suffix(new Gtk.Image({
      icon_name: 'external-link-symbolic',
    }));
    docsLinkRow.connect('activated', () => {
      Gtk.show_uri(window, 'https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b', 0);
    });
    docsGroup.add(docsLinkRow);

    const githubLinkRow = new Adw.ActionRow({
      title: 'Reportar um problema',
      activatable: true,
    });
    githubLinkRow.add_suffix(new Gtk.Image({
      icon_name: 'external-link-symbolic',
    }));
    githubLinkRow.connect('activated', () => {
      Gtk.show_uri(window, 'https://github.com/thiagormoreira/flamengo-scores/issues', 0);
    });
    docsGroup.add(githubLinkRow);
  }
}
