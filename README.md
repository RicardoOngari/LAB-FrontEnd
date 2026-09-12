# NOC Dashboard PRO 4.0 — Laboratório 6

Projeto Full-Stack do NOC atualizado para o Laboratório 6, mantendo a interface do NOC e adicionando arquitetura Back-end em camadas, carga massiva de Big Data e CRUD completo com proteção por limite.

## Tecnologias
- React 18 + Vite
- React Router
- Bootstrap 5
- Node.js + Express
- SQLite3
- Fetch API / REST
- Web Audio API
- Google Maps Universal URLs

## Arquitetura atual
```text
NOC-Dashboard-PRO-3.0-DEFINITIVO/
├── src/
│   ├── components/          # Front-end React
│   ├── services/            # Comunicação com a API
│   ├── config/
│   │   ├── database.js      # Conexão SQLite
│   │   └── seed.js          # Carga massiva de 100.000 registros
│   ├── repositories/
│   │   └── frotaRepository.js
│   ├── controllers/
│   │   └── frotaController.js
│   ├── routes/
│   │   └── frotaRoutes.js
│   └── server.js             # API Express
├── package.json
└── vite.config.js
```

## Instalação
Na raiz do projeto:
```bash
npm install
```

## 1. Gerar a base Big Data
Atenção: o seed apaga e recria o arquivo SQLite para garantir uma carga limpa de laboratório. Execute somente quando quiser recriar a base:

```bash
npm run seed
```

O script cria `noc_bigdata.sqlite` com **100.000 veículos**, distribuídos em 10 categorias, dentro de uma transação SQLite.

Depois da geração, o banco não é recriado ao iniciar o servidor. Isso evita apagar os dados a cada execução.

## 2. Iniciar o projeto
Use duas janelas de terminal, ou uma única com o script concorrente:

```bash
npm start
```

Endereços:
- Front-end: http://localhost:5173
- API: http://localhost:3000
- Health: http://localhost:3000/api/health

Para recriar a base e iniciar tudo de uma vez, use conscientemente:
```bash
npm run start:clean
```

## API CRUD da frota
A rota principal exigida pelo laboratório é `/api/frota`.

### GET — leitura protegida
```http
GET http://localhost:3000/api/frota
```
Retorna **no máximo 500 veículos aleatórios**, mesmo com 100.000 registros no SQLite.

### GET — buscar por ID
```http
GET http://localhost:3000/api/frota/V-050000
```

### POST — criar
```http
POST http://localhost:3000/api/frota
Content-Type: application/json

{
  "id": "V-100001",
  "modelo": "🚛",
  "tipo": "Caminhão",
  "vel": "80",
  "latitude": "-23.5500",
  "longitude": "-46.6333"
}
```

### PUT — atualizar telemetria
```http
PUT http://localhost:3000/api/frota/V-050000
Content-Type: application/json

{
  "vel": "90",
  "latitude": "-12.9700",
  "longitude": "-38.5000"
}
```

Também foi mantido o endpoint antigo para compatibilidade:
```http
PUT http://localhost:3000/api/telemetria/V-050000
```

### DELETE — remover
```http
DELETE http://localhost:3000/api/frota/V-100001
```

## Endpoint integrado do dashboard
```http
GET http://localhost:3000/api/dados
```
Retorna:
- infraestrutura;
- uma amostra protegida de 500 veículos;
- total da frota;
- quantidade por categoria;
- coordenadas da base NOC.

## Por que o dashboard não recebe 100.000 veículos?
Porque o Laboratório 6 orienta que a API não devolva toda a carga em uma única requisição. A camada Repository usa `LIMIT 500` para proteger a interface. O dashboard mostra uma amostra operacional enquanto o SQLite mantém toda a carga massiva.

## Testes obrigatórios do laboratório
1. Rode `npm run seed`.
2. Rode `npm start`.
3. Em Postman, Insomnia ou Thunder Client, faça `GET /api/frota`.
4. Confirme que a resposta possui no máximo 500 registros.
5. Repita o GET e observe que a amostra muda.
6. Faça `PUT /api/frota/V-050000` com novas coordenadas.
7. Faça `GET /api/frota/V-050000` e confirme a alteração.
8. Faça um `POST` com um novo ID.
9. Consulte esse ID com `GET`.
10. Faça `DELETE` nesse ID e confirme `404` em um novo GET.

## Git
O banco está fora do versionamento por meio de `*.sqlite`, conforme solicitado no laboratório. Não faça commit do arquivo `noc_bigdata.sqlite`.

## Observação importante
Não execute `npm run seed` enquanto o servidor estiver usando o banco. Primeiro pare a API e depois rode o seed, porque o seed recria o arquivo SQLite do zero.

## Aba Banco de Dados (CRUD)

A interface ganhou a rota `/banco-dados`, acessível pela aba **Banco de Dados (CRUD)** da Navbar.

A tela possui três áreas:

- **POST /api/frota**: formulário para cadastrar um veículo diretamente no SQLite.
- **GET /api/frota**: tabela com a amostra protegida de até 500 veículos, com pesquisa e ações **PUT** e **DELETE**.
- **NODE.JS · CRUD LOGGER**: terminal visual que registra os eventos de SELECT, INSERT, UPDATE e DELETE executados na interface.

O banco continua podendo conter 100.000+ registros. A interface não tenta carregar a tabela inteira: o endpoint mantém o limite de 500 registros para proteger o navegador.
"# LAB-FrontEnd" 
"# LAB-FrontEnd" 
