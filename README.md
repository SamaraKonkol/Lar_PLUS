# LAR+

A **Lar+** é uma plataforma web de divulgação, locação e gerenciamento de imóveis. O projeto está em evolução contínua e possui uma arquitetura full stack com frontend separado da API, banco de dados persistente e armazenamento de arquivos em nuvem.

A plataforma utiliza uma única conta por usuário. Visitantes podem navegar pelo catálogo e visualizar imóveis; recursos interativos e de gerenciamento exigem autenticação.

## Funcionalidades atuais

- Cadastro e login de usuários
- Autenticação com JWT
- Catálogo de imóveis
- Visualização de detalhes dos imóveis
- Publicação de imóveis
- Upload de fotos e documentos para Amazon S3
- Favoritos
- Dashboard com imóveis do usuário
- Exclusão dos próprios imóveis
- Filtros e ordenação no catálogo
- Galeria de fotos
- Localização do imóvel em mapa incorporado

## Funcionalidades em desenvolvimento

- Edição de imóveis
- Edição de perfil e foto de usuário
- Agendamento de visitas
- Fluxo de locação
- Contratos digitais
- Carteira e meios de pagamento
- Pagamentos pela plataforma
- Gestão completa da locação
- Notificações

## Tecnologias

### Frontend

- HTML5
- CSS3
- JavaScript
- GitHub Pages

### Backend

- Node.js
- Express.js
- PostgreSQL
- JWT
- bcrypt
- Multer
- dotenv
- CORS
- Render

### Infraestrutura

- PostgreSQL no Render para dados persistentes
- Amazon S3 para fotos e documentos
- IAM para controle de acesso ao S3

## Estrutura principal

```text
Lar_PLUS/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── database/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── css/
├── img/
├── js/
├── index.html
├── catalogo.html
├── detalhes.html
├── cadastro.html
├── login.html
├── dashboard.html
├── favoritos.html
└── cadastrar-imovel.html
```

## Segurança

Credenciais, chaves e segredos não devem ser armazenados no repositório. As variáveis necessárias estão documentadas em `backend/.env.example` e devem ser configuradas separadamente em cada ambiente.

A API valida autenticação e propriedade dos recursos protegidos no backend. Arquivos privados são armazenados no Amazon S3 e servidos pela API quando necessário.

## Status

A Lar+ está em estágio de MVP funcional. A base de autenticação, publicação, catálogo, favoritos, dashboard, PostgreSQL e S3 já está integrada; os módulos de locação, contratos e pagamentos ainda estão em desenvolvimento.

## Autora

**Samara Konkol**  
Engenharia de Software
