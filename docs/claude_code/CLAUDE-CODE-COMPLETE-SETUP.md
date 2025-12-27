# 🚀 CLAUDE CODE - CONFIGURACIÓN COMPLETA AUTO-SETUP
**Última Actualización: Diciembre 2025**
**Versión: 2.0 - Production Ready**

---

## 📋 TABLA DE CONTENIDOS

1. [Introducción](#introducción)
2. [El Prompt Completo](#el-prompt-completo)
3. [Qué se Instalará](#qué-se-instalará)
4. [Instrucciones de Uso](#instrucciones-de-uso)
5. [Verificación Post-Setup](#verificación-post-setup)
6. [Troubleshooting](#troubleshooting)
7. [Próximos Pasos](#próximos-pasos)

---

## Introducción

Este documento contiene una **configuración automática completa** para Claude Code que instala:

- **110+ agentes especializados** para todos los lenguajes y frameworks
- **25+ MCP servers** integrados con desarrollo
- **26 skills profesionales** de la comunidad
- **Comandos personalizados** para workflow rápido
- **Estándares del proyecto** documentados

**Tiempo estimado**: 5-15 minutos  
**Espacio requerido**: ~300-500MB  
**Requisitos**: Claude Code instalado, terminal bash/zsh

---

## El Prompt Completo

Copia el bloque completo entre los ``` y pégalo en Claude Code.

```
You are an expert Claude Code configuration architect. Your mission is to set up a comprehensive, production-ready development environment with the most popular battle-tested agents, MCP servers, and skills from the global developer community. This is a one-time, complete setup.

=== PHASE 1: INSTALL 110+ SPECIALIZED AGENTS ===

Create all agents in ~/.claude/agents/ with professional SKILL.md format. Each agent needs:
- name: in YAML frontmatter
- description: clear use case
- System Prompt section with:
  * Purpose statement
  * Key responsibilities (numbered)
  * Always/Never guidelines
  * Tools allowed section
  * Output format specification
- Real-world code examples
- Best practices and anti-patterns
- References to official docs

LANGUAGE SPECIALISTS (22 agents):
1. python-pro: Python 3.12+ expert, async, FastAPI, Django, data science
2. php-pro: PHP 8.2+, Laravel, Symfony, backend patterns
3. javascript-pro: Modern JavaScript, ES2025, Node.js, async patterns
4. typescript-pro: Strict TypeScript, interfaces, generics, type safety
5. react-specialist: React 18+, hooks, state management, performance
6. nextjs-developer: Next.js 15+, SSR, API routes, edge computing
7. vue-expert: Vue 3, composition API, Pinia, ecosystem
8. angular-architect: Angular 18+, RxJS, dependency injection
9. java-architect: Java 21+, Spring Boot, design patterns
10. golang-pro: Go concurrency, interfaces, error handling
11. rust-engineer: Rust ownership, safety, async/await, WASM
12. swift-expert: Swift iOS/macOS development, SwiftUI
13. csharp-developer: C# .NET 8+, async, LINQ
14. kotlin-specialist: Kotlin, Android, coroutines
15. ruby-expert: Ruby, Rails, metaprogramming
16. django-developer: Django ORM, signals, admin, security
17. sql-pro: SQL optimization, indexing, execution plans
18. cpp-pro: C++20, memory management, STL
19. dockerfile-expert: Docker optimization, multi-stage builds, security
20. kubernetes-specialist: Kubernetes orchestration, manifests, patterns
21. terraform-engineer: Infrastructure as code, modules, state
22. node-expert: Node.js patterns, event loop, streams

CORE DEVELOPMENT AGENTS (9 agents):
1. frontend-developer: React, Vue, HTML/CSS, responsive design
2. backend-developer: APIs, databases, business logic, scaling
3. fullstack-developer: Both frontend and backend expertise
4. mobile-developer: iOS, Android, React Native, Expo
5. api-designer: REST/GraphQL API architecture, documentation
6. graphql-architect: GraphQL schema design, resolvers, performance
7. microservices-architect: Service design, communication, patterns
8. websocket-engineer: Real-time communication, Socket.io, WebRTC
9. electron-pro: Desktop app development, IPC, packaging

INFRASTRUCTURE & DEVOPS AGENTS (12 agents):
1. devops-engineer: CI/CD pipelines, automation, infrastructure
2. cloud-architect: AWS, GCP, Azure architecture and design
3. kubernetes-specialist: K8s architecture, scaling, networking
4. terraform-engineer: IaC best practices, modules, state management
5. docker-expert: Container optimization, security, orchestration
6. database-administrator: Database management, backup, recovery
7. database-optimizer: Query optimization, indexing, performance tuning
8. postgres-pro: PostgreSQL advanced features, extensions
9. redis-expert: Redis patterns, caching, pub/sub, streams
10. monitoring-engineer: Observability, metrics, logging, alerting
11. sre-engineer: Site reliability, incident response, automation
12. platform-engineer: Platform services, developer experience

TESTING & QUALITY AGENTS (12 agents):
1. test-automator: Test frameworks, automation, CI integration
2. qa-expert: QA strategy, test planning, manual testing
3. code-reviewer: Code quality, best practices, architecture
4. security-auditor: Vulnerability assessment, compliance, hardening
5. penetration-tester: Security testing, ethical hacking techniques
6. performance-engineer: Performance profiling, optimization, tuning
7. accessibility-tester: WCAG compliance, a11y patterns
8. error-detective: Debugging, error analysis, troubleshooting
9. debugger: Interactive debugging, breakpoints, stack traces
10. architect-reviewer: Architecture review, design patterns
11. compliance-auditor: Regulatory compliance, audit trails
12. chaos-engineer: Chaos engineering, resilience testing

DATA & AI AGENTS (12 agents):
1. data-scientist: Statistics, ML, analysis, visualization
2. machine-learning-engineer: ML models, training, deployment
3. data-engineer: Data pipelines, ETL, data warehousing
4. data-analyst: Analytics, business intelligence, dashboards
5. ai-engineer: AI/LLM applications, prompt optimization
6. llm-architect: LLM system design, chain-of-thought patterns
7. prompt-engineer: Prompt optimization, few-shot learning
8. nlp-engineer: NLP, text processing, transformers
9. mlops-engineer: ML operations, model serving, monitoring
10. ml-engineer: General machine learning expert
11. quant-analyst: Financial models, algorithms, backtesting
12. risk-manager: Risk analysis, modeling, mitigation

DEVELOPER EXPERIENCE AGENTS (9 agents):
1. documentation-engineer: Technical docs, API docs, guides
2. refactoring-specialist: Code refactoring, simplification
3. legacy-modernizer: Legacy code updates, modernization
4. cli-developer: CLI tools, command design, usability
5. build-engineer: Build systems, bundling, compilation
6. dependency-manager: Dependency management, security scanning
7. git-workflow-manager: Git workflows, branching, rebasing
8. dx-optimizer: Developer experience optimization
9. tooling-engineer: Development tools, IDE setup, automation

SPECIALIZED DOMAINS (10 agents):
1. blockchain-developer: Blockchain, Web3, smart contracts
2. game-developer: Game development, engines, mechanics
3. embedded-systems: Embedded C, hardware, firmware
4. iot-engineer: IoT systems, edge computing, protocols
5. fintech-engineer: Financial technology, payments, trading
6. payment-integration: Payment systems, PCI compliance
7. api-documenter: API documentation, Swagger, OpenAPI
8. mobile-app-developer: Mobile app architecture, native features
9. realtime-engineer: Real-time systems, WebSockets, MQTT
10. ai-safety-expert: AI safety, alignment, guardrails

ORCHESTRATION & META (8 agents):
1. multi-agent-coordinator: Agent coordination, delegation
2. task-distributor: Task distribution, load balancing
3. workflow-orchestrator: Workflow automation, sequencing
4. context-manager: Context optimization, compression
5. error-coordinator: Error handling, recovery, fallbacks
6. knowledge-synthesizer: Knowledge synthesis, summarization
7. performance-monitor: Performance tracking, metrics
8. agent-organizer: Agent management, organization

=== PHASE 2: CONFIGURE MCP SERVERS ===

Set up ~/.claude/settings.json with complete MCP configuration:

ESSENTIAL MCPs (Use official names from ModelContextProtocol.io):
- @modelcontextprotocol/server-filesystem - Local file access
- @modelcontextprotocol/server-postgres - PostgreSQL database
- @modelcontextprotocol/server-mongodb - MongoDB operations
- @modelcontextprotocol/server-github - GitHub API (needs GITHUB_TOKEN env var)
- @modelcontextprotocol/server-slack - Slack workspace (needs SLACK_BOT_TOKEN)
- @modelcontextprotocol/server-gmail - Gmail API (needs GMAIL_API_KEY)
- @modelcontextprotocol/server-google-drive - Drive integration
- @modelcontextprotocol/server-stripe - Payment processing
- @modelcontextprotocol/server-openai - OpenAI API
- @modelcontextprotocol/server-anthropic - Anthropic API

DEVELOPMENT MCPs:
- @modelcontextprotocol/server-git - Git operations and repository info
- @modelcontextprotocol/server-docker - Docker container management
- @modelcontextprotocol/server-kubernetes - Kubernetes cluster operations
- @modelcontextprotocol/server-aws - AWS services (needs AWS credentials)
- @modelcontextprotocol/server-gcp - Google Cloud Platform
- @modelcontextprotocol/server-azure - Microsoft Azure services
- @modelcontextprotocol/server-npm - NPM registry and package info
- @modelcontextprotocol/server-pypi - Python Package Index

DATA & ANALYSIS MCPs:
- @modelcontextprotocol/server-pandas - Data manipulation (Python)
- @modelcontextprotocol/server-numpy - Numerical computing
- @modelcontextprotocol/server-sql - SQL database operations
- @modelcontextprotocol/server-elasticsearch - Search and analytics
- @modelcontextprotocol/server-mqtt - IoT messaging protocol

UTILITY MCPs:
- @modelcontextprotocol/server-web-search - Web search (DuckDuckGo)
- @modelcontextprotocol/server-screenshot - Website screenshots
- @modelcontextprotocol/server-pdf - PDF processing and extraction
- @modelcontextprotocol/server-weather - Weather API
- @modelcontextprotocol/server-news - News feeds and articles

Configuration format in ~/.claude/settings.json:
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
    [... continue for others ...]
  }
}

=== PHASE 3: INSTALL OFFICIAL SKILLS ===

Create ~/.claude/skills/ with 26 professional skills from Anthropic collection:

DEVELOPMENT SKILLS (10):
1. code-review - Code quality assessment, patterns, best practices
2. writing-tests - Unit tests, integration tests, test patterns
3. documentation - Technical docs, API docs, markdown, diagrams
4. api-design - REST/GraphQL API design, versioning, security
5. database-design - Schema design, normalization, indexing
6. performance - Performance profiling, optimization techniques
7. security - OWASP, input validation, authentication, encryption
8. error-handling - Exception handling, error recovery patterns
9. logging - Structured logging, observability, log levels
10. caching - Cache strategies, invalidation, tools

LANGUAGE-SPECIFIC SKILLS (8):
1. python-best-practices - Python idioms, patterns, PEP 8
2. javascript-patterns - JS design patterns, async, promises
3. typescript-advanced - Advanced TS, generics, type guards
4. react-patterns - React hooks, context, performance patterns
5. vue-patterns - Vue 3 composition API, best practices
6. sql-optimization - Query optimization, execution plans
7. docker-best-practices - Docker patterns, security, optimization
8. kubernetes-patterns - K8s YAML, resources, best practices

WORKFLOW SKILLS (8):
1. git-commits - Conventional commits, commit messages
2. refactoring - Refactoring techniques, code smells
3. debugging - Debugging strategies, tools, techniques
4. testing-strategies - Testing approaches, test pyramids
5. architecture-patterns - Design patterns, architecture
6. clean-code - Code quality, naming, functions
7. solid-principles - SOLID design principles
8. design-patterns - Gang of Four patterns, applications

Each skill SKILL.md file should include:
---
name: skill-name
description: When to use this skill and what problems it solves
---

# [Skill Name]

## When to Use This Skill
[Clear scenarios for using this skill]

## Core Concepts
[Foundation concepts needed]

## Patterns and Best Practices
### Pattern 1
[Explanation with code example]

### Pattern 2
[Explanation with code example]

## Anti-Patterns to Avoid
- ❌ [Bad practice 1]
- ❌ [Bad practice 2]

## Quick Reference
[Cheat sheet information]

## Resources
[Links to official documentation]

=== PHASE 4: CREATE SLASH COMMANDS ===

Create .claude/commands/ with executable scripts:

1. /commit - Generate conventional commit messages
2. /review - Quick code quality review
3. /test - Generate test boilerplate
4. /docs - Generate documentation
5. /refactor - Suggest refactoring opportunities
6. /performance - Analyze performance issues
7. /security - Security vulnerability scan
8. /setup - Initialize project structure

=== PHASE 5: PROJECT STANDARDS ===

Create .claude/CLAUDE.md with:
- Project conventions
- Architecture overview
- Key dependencies and versions
- Testing strategy
- Deployment process
- Team guidelines
- Common commands reference
- Troubleshooting guides

=== PHASE 6: MCP PROJECT CONFIG ===

Create .mcp.json at project root with:
- Project-specific MCP servers
- Database connection references
- API integrations
- Environment-specific tools
- Security and authentication setup

=== PHASE 7: COMPREHENSIVE SETUP REPORT ===

After all creation, generate a detailed report including:

1. AGENT SUMMARY
   - Total agents created: [count by category]
   - List all agents organized by category
   - Quick invocation guide

2. MCP CONFIGURATION SUMMARY
   - Total MCP servers: [count]
   - Available tools and integrations
   - Authentication requirements

3. SKILLS LIBRARY SUMMARY
   - Total skills: [count]
   - Organized by category
   - When to use each skill

4. WORKFLOW OPTIMIZATION GUIDE
   - Best practices for agent orchestration
   - Recommended patterns for common tasks
   - Performance optimization tips

5. QUICK REFERENCE CARD
   - Common agent invocations
   - Slash command list
   - MCP server examples

6. TROUBLESHOOTING GUIDE
   - Common issues and solutions
   - Environment variable setup
   - Path configuration

7. NEXT STEPS
   - Customization recommendations
   - Performance tuning
   - Team onboarding

=== EXECUTION REQUIREMENTS ===

1. Create complete, production-ready content
2. Use proper YAML frontmatter for all skills
3. Include real-world code examples
4. Follow current industry standards (2025)
5. Ensure consistency across all files
6. Make content immediately actionable
7. Include error handling guidance
8. Provide decision matrices where relevant

=== COMPLETION CHECKLIST ===

After setup, verify:
- [ ] All 110+ agent files created in ~/.claude/agents/
- [ ] All 25+ MCP servers configured in ~/.claude/settings.json
- [ ] All 26 skills created in ~/.claude/skills/
- [ ] 8 slash commands created in .claude/commands/
- [ ] .claude/CLAUDE.md project standards created
- [ ] .mcp.json project configuration created
- [ ] Comprehensive setup report generated

=== SUCCESS CRITERIA ===

Setup is complete when you can:
1. Invoke any agent with @agent-name instruction
2. Use all slash commands /command
3. Access all MCP servers automatically
4. Reference any skill for guidance
5. Follow project standards from CLAUDE.md

BEGIN SETUP NOW.
```

---

## Qué se Instalará

### 📊 Estadísticas de Instalación

| Componente | Cantidad | Ubicación |
|-----------|----------|-----------|
| Agentes de Lenguajes | 22 | `~/.claude/agents/` |
| Agentes Core Desarrollo | 9 | `~/.claude/agents/` |
| Agentes DevOps/Cloud | 12 | `~/.claude/agents/` |
| Agentes Testing/QA | 12 | `~/.claude/agents/` |
| Agentes Data/AI | 12 | `~/.claude/agents/` |
| Agentes Developer Experience | 9 | `~/.claude/agents/` |
| Agentes Dominios Especiales | 10 | `~/.claude/agents/` |
| Agentes Orquestación | 8 | `~/.claude/agents/` |
| **TOTAL AGENTES** | **110+** | **~/.claude/agents/** |
| **MCP Servers** | **25+** | **~/.claude/settings.json** |
| **Skills Profesionales** | **26** | **~/.claude/skills/** |
| **Comandos Rápidos** | **8** | **.claude/commands/** |
| **Documentación** | **2 archivos** | **.claude/CLAUDE.md, .mcp.json** |

### 🎯 Cobertura de Tecnologías

**Lenguajes**: Python, PHP, JavaScript, TypeScript, Java, Go, Rust, Swift, C#, Kotlin, Ruby, C++, SQL, Dockerfile  

**Frameworks**: Django, Laravel, React, Vue, Angular, Next.js, Spring Boot, FastAPI, Express, Rails  

**Plataformas**: AWS, GCP, Azure, Kubernetes, Docker, Terraform  

**Bases de Datos**: PostgreSQL, MongoDB, Redis, Elasticsearch  

**Especialidades**: Machine Learning, Blockchain, Game Dev, IoT, Fintech, GraphQL, Microservices

---

## Instrucciones de Uso

### ✅ Paso 1: Preparación
```bash
# Asegúrate de estar en tu proyecto
cd /tu/proyecto

# Verifica que Claude Code está instalado
claude --version

# Debería mostrar algo como: 2.0.14 (Claude Code)
```

### ✅ Paso 2: Iniciar Claude Code
```bash
claude
```

### ✅ Paso 3: Copiar el Prompt
1. Copia el prompt completo desde la sección "El Prompt Completo" (arriba)
2. Asegúrate de copiar TODO desde "You are an expert..." hasta "BEGIN SETUP NOW."
3. El prompt tiene aprox. 400 líneas

### ✅ Paso 4: Pegar en Claude Code
1. En la ventana de Claude Code, pega el prompt
2. Claude comenzará a procesar automáticamente

### ✅ Paso 5: Espera a Completación
- **Duración estimada**: 5-15 minutos
- **No interrumpas el proceso**
- Claude creará miles de líneas de código configuración
- Verás "✅" cuando cada fase se completa

### ✅ Paso 6: Verifica la Instalación
```bash
# Después de que Claude termine, en terminal:

# Contar agentes instalados
ls ~/.claude/agents/ | wc -l
# Debería mostrar: ~110

# Contar skills instaladas
ls ~/.claude/skills/ | wc -l
# Debería mostrar: ~26

# Verificar configuración MCP
cat ~/.claude/settings.json | head -20
# Debería mostrar: "mcpServers": {

# Verificar archivos del proyecto
ls -la .claude/
# Debería mostrar: CLAUDE.md, commands/, agents/ (si aplica)
```

---

## Verificación Post-Setup

### 🔍 Test 1: Verificar Agentes
```bash
# En Claude Code:
@python-pro Tell me about async/await best practices

# Debería responder como un experto en Python
```

### 🔍 Test 2: Verificar Skills
```bash
# En Claude Code:
# Cuando pidas ayuda sobre testing, debería invocar automáticamente
# la skill "writing-tests"

Ask me to write tests for a function and I'll use the skill
```

### 🔍 Test 3: Verificar MCP
```bash
# En Claude Code:
/mcp list

# Debería mostrar todos los MCP servers configurados
```

### 🔍 Test 4: Verificar Comandos
```bash
# En Claude Code:
/commit

# Debería generar un commit message conventional
```

---

## Troubleshooting

### ❌ Problema: "Command not found: claude"
**Solución**:
```bash
# Asegúrate que Claude Code está en PATH
which claude

# Si no existe, instala Claude Code:
npm install -g @anthropic-ai/claude-code

# O con asdf:
asdf install nodejs latest
npm install -g @anthropic-ai/claude-code
```

### ❌ Problema: Los agentes no se crean
**Solución**:
- Verifica permisos en `~/.claude/`
- Asegúrate que `.claude/agents/` existe
- Intenta crear un agente manualmente primero
- Verifica que Claude Code tiene acceso de escritura

```bash
mkdir -p ~/.claude/agents/
chmod 755 ~/.claude/agents/
```

### ❌ Problema: MCP servers no aparecen
**Solución**:
- Verifica que `~/.claude/settings.json` existe
- Verifica que el JSON es válido (usa un validador JSON)
- Revisa que las rutas son correctas
- Instala los paquetes NPM si es necesario

```bash
# Validar JSON
cat ~/.claude/settings.json | python -m json.tool

# Reinstalar MCP servers
npm install -g @modelcontextprotocol/server-postgres
```

### ❌ Problema: Skills no se cargan
**Solución**:
- Verifica que `~/.claude/skills/` existe
- Asegúrate que cada skill tiene `SKILL.md`
- Verifica frontmatter YAML válido
- Revisa los permisos

```bash
ls -la ~/.claude/skills/
cat ~/.claude/skills/code-review/SKILL.md | head -5
```

### ❌ Problema: Variables de entorno de MCP
**Solución**:
```bash
# Algunas MCPs necesitan tokens. Configura en ~/.zshrc o ~/.bashrc:
export GITHUB_TOKEN="ghp_..."
export SLACK_BOT_TOKEN="xoxb-..."
export DATABASE_URL="postgresql://..."

# Luego:
source ~/.zshrc
```

---

## Próximos Pasos

### 🎯 Después de la Instalación Base

1. **Personalizar Agentes para tu Stack**
   ```bash
   # Crea versiones especializadas en .claude/agents/
   cp ~/.claude/agents/python-pro.md .claude/agents/python-pro-mycompany.md
   # Edita la versión local para tu caso de uso
   ```

2. **Agregar Credenciales a MCP**
   ```bash
   # En ~/.claude/settings.json, actualiza los env vars:
   "env": {
     "GITHUB_TOKEN": "${GITHUB_TOKEN}",
     "DATABASE_URL": "${DATABASE_URL}"
   }
   ```

3. **Crear Skills Personalizadas**
   ```bash
   mkdir -p .claude/skills/company-standards
   # Crea SKILL.md con tus estándares de empresa
   ```

4. **Configurar CI/CD Integration**
   ```bash
   # En .mcp.json, agrega:
   "github": { "enabled": true },
   "slack": { "notifications": true }
   ```

5. **Team Onboarding**
   - Comparte `.claude/CLAUDE.md` con el equipo
   - Documenta agentes personalizados
   - Crea guías específicas del proyecto

### 📚 Recursos para Seguir Aprendiendo

- **Claude Code Docs**: https://code.claude.com/docs
- **Agentes Community**: https://github.com/VoltAgent/awesome-claude-code-subagents
- **Skills Oficial**: https://github.com/anthropics/skills
- **MCP Documentación**: https://modelcontextprotocol.io
- **Plugin Hub**: https://claude-plugins.dev

### 🚀 Optimizaciones Avanzadas

1. **Multi-Agent Orchestration**
   - Usar `@multi-agent-coordinator` para tareas complejas
   - Combinar agentes especializados en serie/paralelo

2. **Context Compression**
   - El agente `@context-manager` optimiza memoria
   - Usar para proyectos muy grandes

3. **Performance Monitoring**
   - `@performance-monitor` rastrea métricas
   - Identifica cuellos de botella

4. **Knowledge Synthesis**
   - `@knowledge-synthesizer` resume hallazgos
   - Consolida múltiples análisis

---

## 📋 Cheat Sheet Rápido

Después de setup, puedes usar:

```bash
# Invocar agentes específicos
@python-pro Refactoriza este código
@react-specialist Mejora este componente
@security-auditor Revisa vulnerabilidades
@api-designer Diseña esta API

# Usar slash commands
/commit          # Genera commit message
/test            # Crea tests
/docs            # Genera documentación
/review          # Revisa código
/refactor        # Sugiere refactoring
/performance     # Analiza performance
/security        # Busca vulnerabilidades
/setup           # Inicializa proyecto

# Verificar estado
/mcp             # MCP servers disponibles
/agent list      # Agentes disponibles
/plugin list     # Plugins instalados
```

---

**¡Listo! Este es el archivo completo. Descárgalo y úsalo en Claude Code. 🚀**

Documento preparado: Diciembre 27, 2025  
Versión: 2.0 Production Ready  
Compatible con: Claude Code 2.0.14+, Anthropic Claude Opus 4.5+
