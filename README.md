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

Não é necessária nenhuma chave de API — a extensão usa a TheSportsDB gratuita. As preferências (abas General/About/Support) estão disponíveis no GNOME Extensions App.

## API Usage

A extensão usa a TheSportsDB (gratuita, sem chave):
- **Endpoint**: `/api/v1/json/123/eventsnext.php?id=134287` para próximos jogos
- **Placar ao vivo**: polling de `/lookupevent.php?id=<idEvent>` a cada 30s durante o jogo
- **Polling**: 30s durante jogos, 1h quando ocioso

## Estrutura

```
flamengo-scores/
├── extension.js      # Lógica principal da extensão
├── prefs.js          # Interface de preferências (Adw)
├── metadata.json     # Metadados da extensão
├── flamengo.svg      # Escudo do Flamengo
├── stylesheet.css    # Estilos CSS
├── schemas/
│   └── org.gnome.shell.extensions.flamengo-scores.gschema.xml
└── README.md
```

## API Usage

A extensão usa a API-Football v3:
- **Endpoint**: `/v3/fixtures` para jogos e `/v3/fixtures?id=X` para placar ao vivo
- **Rate limit**: 100 requisições/dia (plano gratuito)
- **Polling**: 30s durante jogos, intervalo configurável quando ocioso

## Licença

MIT
