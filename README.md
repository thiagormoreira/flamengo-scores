# Flamengo Scores

Extensão GNOME Shell para acompanhar jogos do Flamengo em tempo real.

## Funcionalidades

- **Placar ao vivo** — Mostra gols e status durante jogos em andamento
- **Próximos jogos** — Lista os próximos jogos do Flamengo
- **Atualização automática** — Polling a cada 30s durante jogos, 1h quando ocioso
- **Ícone do escudo** — Escudo do Flamengo no painel do GNOME

## Requisitos

- GNOME Shell 46+

## Instalação

```bash
# Opção 1: copiar para o diretório de extensões
cp -r * ~/.local/share/gnome-shell/extensions/flamengo-scores@loganguns/

# Opção 2: usar o Makefile (se disponível)
make install
```

Depois reinicie a extensão:
```bash
gnome-extensions disable flamengo-scores@loganguns && gnome-extensions enable flamengo-scores@loganguns
```

## Configuração

Não é necessária nenhuma chave de API — a extensão usa a ESPN gratuita. As preferências (abas General/About/Support) estão disponíveis no GNOME Extensions App.

## API Usage

A extensão usa a ESPN (gratuita, sem chave):
- **Endpoint**: `site.api.espn.com/apis/site/v2/sports/soccer/{liga}/scoreboard?dates=YYYYMMDD-YYYYMMDD` para próximos jogos e placar ao vivo
- **Ligas consultadas**: `bra.1` (Brasileirão) e `conmebol.libertadores` (Libertadores)
- **Polling**: 30s durante jogos, 1h quando ocioso

## Estrutura

```
flamengo-scores/
├── extension.js      # Lógica principal da extensão
├── prefs.js          # Interface de preferências (Adw)
├── metadata.json     # Metadados da extensão
├── flamengo.svg      # Escudo do Flamengo
├── schemas/
│   └── org.gnome.shell.extensions.flamengo-scores.gschema.xml
└── README.md
```

## Licença

GPL-3.0-or-later

O escudo do Flamengo (flamengo.svg) é marca registrada do Clube de Regatas do Flamengo.
