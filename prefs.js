import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const PIX_KEY = 'loganguns@gmail.com';
const KOFI_URL = 'https://ko-fi.com/loganguns';
const GITHUB_SPONSORS_URL = 'https://github.com/sponsors/thiagormoreira';

export default class FlamengoScoresPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const pageGeneral = new Adw.PreferencesPage({
            title: 'Geral',
            iconName: 'preferences-other-symbolic',
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
                stepIncrement: 5,
                pageIncrement: 60,
                value: settings.get_int('refresh-interval'),
            }),
        });
        refreshRow.connect('notify::value', () => {
            settings.set_int('refresh-interval', refreshRow.get_value());
        });
        refreshGroup.add(refreshRow);

        const pageAbout = new Adw.PreferencesPage({
            title: 'Sobre',
            iconName: 'dialog-information-symbolic',
        });
        window.add(pageAbout);

        const aboutGroup = new Adw.PreferencesGroup();
        pageAbout.add(aboutGroup);

        const meta = this.metadata;

        const titleRow = new Adw.ActionRow({
            title: 'Flamengo Scores',
            subtitle: `v${meta.version ?? '1.0.0'}`,
        });
        aboutGroup.add(titleRow);

        const descRow = new Adw.ActionRow({
            title: 'Descrição',
            subtitle: 'Mostra próximos jogos do Flamengo e placar ao vivo',
        });
        aboutGroup.add(descRow);

        const devRow = new Adw.ActionRow({
            title: 'Desenvolvedor',
            subtitle: 'Thiago Moreira',
        });
        aboutGroup.add(devRow);

        const emailRow = new Adw.ActionRow({
            title: 'E-mail',
            subtitle: 'loganguns@gmail.com',
        });
        aboutGroup.add(emailRow);

        const pageSupport = new Adw.PreferencesPage({
            title: 'Suporte',
            iconName: 'help-browser-symbolic',
        });
        window.add(pageSupport);

        const donateGroup = new Adw.PreferencesGroup({
            title: 'Apoie o projeto',
            description: 'Se essa extensão te ajuda a acompanhar o Mengão, considere apoiar',
        });
        pageSupport.add(donateGroup);

        const pixRow = new Adw.ActionRow({
            title: 'PIX',
            subtitle: PIX_KEY,
        });
        const pixCopyButton = new Gtk.Button({
            iconName: 'edit-copy-symbolic',
            valign: Gtk.Align.CENTER,
            cssClasses: ['flat'],
            tooltipText: 'Copiar chave PIX',
        });
        let pixResetTimeoutId = null;
        pixCopyButton.connect('clicked', () => {
            window.get_clipboard().set_text(PIX_KEY);
            pixRow.subtitle = 'Chave copiada!';
            if (pixResetTimeoutId) GLib.source_remove(pixResetTimeoutId);
            pixResetTimeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
                pixRow.subtitle = PIX_KEY;
                pixResetTimeoutId = null;
                return GLib.SOURCE_REMOVE;
            });
        });
        window.connect('close-request', () => {
            if (pixResetTimeoutId) {
                GLib.source_remove(pixResetTimeoutId);
                pixResetTimeoutId = null;
            }
            return false;
        });
        pixRow.add_suffix(pixCopyButton);
        donateGroup.add(pixRow);

        const kofiRow = new Adw.ActionRow({
            title: 'Ko-fi',
            subtitle: 'ko-fi.com/loganguns',
            activatable: true,
        });
        kofiRow.add_suffix(new Gtk.Image({
            iconName: 'external-link-symbolic',
        }));
        kofiRow.connect('activated', () => {
            Gtk.show_uri(window, KOFI_URL, 0);
        });
        donateGroup.add(kofiRow);

        const sponsorsRow = new Adw.ActionRow({
            title: 'GitHub Sponsors',
            subtitle: 'github.com/sponsors/thiagormoreira',
            activatable: true,
        });
        sponsorsRow.add_suffix(new Gtk.Image({
            iconName: 'external-link-symbolic',
        }));
        sponsorsRow.connect('activated', () => {
            Gtk.show_uri(window, GITHUB_SPONSORS_URL, 0);
        });
        donateGroup.add(sponsorsRow);

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
            iconName: 'external-link-symbolic',
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
            iconName: 'external-link-symbolic',
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
            iconName: 'external-link-symbolic',
        }));
        githubLinkRow.connect('activated', () => {
            Gtk.show_uri(window, 'https://github.com/thiagormoreira/flamengo-scores/issues', 0);
        });
        docsGroup.add(githubLinkRow);
    }
}
