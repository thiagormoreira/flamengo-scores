# Flamengo Scores

Extensão GNOME Shell para acompanhar jogos do Flamengo em tempo real.

## Funcionalidades

- **Placar ao vivo** — Mostra gols e tempo durante jogos em andamento
- **Próximos jogos** — Lista os próximos 5 jogos do Flamengo
- **Atualização automática** — Polling a cada 30s durante jogos, 1h quando ocioso
- **Ícone do escudo** —盾牌 do Flamengo no painel do GNOME

## Requisitos

- GNOME Shell 46+
- API key da API-Football (plano gratuito: 100 requisições/dia)
- Team ID do Flamengo: **1953**

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

1. Abra as preferências da extensão em GNOME Extensions App
2. Vá na aba **General**
3. Insira sua API key da API-Football
4. Ajuste o intervalo de atualização conforme necessidade

## Obter API Key

1. Acesse [dashboard.api-football.com](https://dashboard.api-football.com)
2. Crie uma conta gratuita
3. Copie sua API key e cole nas preferências

## Estrutura

```
flamengo-scores/
├── extension.js      # Lógica principal da extensão
├── prefs.js          # Interface de preferências (Adw)
├── metadata.json     # Metadados da extensão
├── flamengo.svg      #盾牌 do Flamengo
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
