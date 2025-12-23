# PixelCV Frontend

Frontend Next.js para PixelCV - Interfaz moderna con gamificación.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Crear archivo de entorno
cp .env.local.example .env.local

# Iniciar servidor de desarrollo
npm run dev
```

Abre http://localhost:3000

## 📚 Estructura

```
frontend/
├── app/
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Layout global
│   ├── editor/               # Editor de CVs
│   │   └── page.tsx
│   ├── cv/[slug]/            # Landing page de CV público
│   │   └── page.tsx
│   ├── community/            # Galería de CVs
│   │   └── page.tsx
│   ├── leaderboard/          # Ranking de usuarios
│   │   └── page.tsx
│   ├── dashboard/            # Dashboard del usuario
│   │   └── page.tsx
│   ├── login/                # Página de login
│   │   └── page.tsx
│   └── register/             # Página de registro
│       └── page.tsx
├── components/               # Componentes reutilizables
├── styles/
│   └── globals.css           # Estilos globales
└── package.json              # Dependencias
```

## 🎨 Diseño

El diseño usa un estilo **gamer/futurista** con:
- Gradientes púrpura/rosa
- Glassmorphism con backdrop-blur
- Bordes brillantes
- Animaciones suaves
- Emojis como iconos

### Colores Principales

- **Background**: Slate-900 → Purple-900
- **Acentos**: Purple-400, Pink-400
- **Texto**: White, Purple-300
- **Cards**: Black/40 con backdrop-blur

## 🔌 Integración con API

Configuración en `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Ejemplo de llamada a API

```typescript
// Registro
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, username, password })
});

const data = await response.json();
localStorage.setItem('token', data.token);
```

### Auth

```typescript
// Con JWT
const token = localStorage.getItem('token');
const response = await fetch(`${API_URL}/auth/me`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 📄 Páginas

### Homepage (`/`)
- Hero con gradiente
- Características principales
- CTA para registro

### Editor (`/editor`)
- Formulario de CV
- Vista previa en tiempo real
- Integración con RenderCV

### CV Público (`/cv/[slug]`)
- Landing page del CV
- Stats (visitas, likes, comentarios)
- Botón de like
- Enlace a PDF

### Comunidad (`/community`)
- Grid de CVs públicos
- Filtros: Recientes, Populares, Más visitados
- Cards con info y stats

### Leaderboard (`/leaderboard`)
- Tabla de ranking
- Badges visuales
- Niveles y puntos

### Dashboard (`/dashboard`)
- Stats del usuario
- Progreso de nivel
- Badges desbloqueados
- Enlace a crear CV

### Auth (`/login`, `/register`)
- Formularios de autenticación
- Validación básica
- Redirección tras login

## 🛠️ Scripts

```bash
npm run dev       # Iniciar desarrollo
npm run build     # Build para producción
npm start         # Iniciar producción
npm run lint      # Linting
```

## 📦 Dependencias Principales

- `next`: Framework React
- `react`: Librería UI
- `tailwindcss`: Framework CSS
- `typescript`: Type safety

## 🧩 Componentes Reutilizables

Para crear, añadir en `components/`:

```typescript
// components/Badge.tsx
interface BadgeProps {
  name: string;
  icon: string;
  description: string;
}

export function Badge({ name, icon, description }: BadgeProps) {
  return (
    <div className="bg-purple-900/50 rounded-lg px-4 py-3 flex items-center gap-2">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-white font-semibold">{name}</div>
        <div className="text-purple-300 text-sm">{description}</div>
      </div>
    </div>
  );
}
```

## 🎨 Estilos Personalizados

Estilos globales en `styles/globals.css`:

```css
/* Scrollbar personalizado */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #0f172a; }
::-webkit-scrollbar-thumb { 
  background: #9333ea; 
  border-radius: 9999px; 
}

/* Animaciones */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
```

## 🚀 Deploy

### Vercel

```bash
npm run build
vercel deploy
```

### Otros

```bash
npm run build
npm start
```

## 📱 Responsive

El diseño es completamente responsive con Tailwind:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

## 🔍 SEO

Metadata en `layout.tsx`:

```typescript
export const metadata = {
  title: 'PixelCV - CVs con Gamificación',
  description: 'Crea CVs profesionales, compártelos y gana puntos'
}
```

## 🐛 Debugging

```typescript
// Ver API responses
console.log('API Response:', data);

// Ver errores
console.error('Error:', error);

// DevTools de React
npm install @axe-core/react
```

## 📝 Convenciones

- Componentes: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase con `use` (`useGamification.ts`)
- Utils: camelCase (`formatDate.ts`)
- Types: PascalCase (`User.ts`)

## 🤝 Contribuir

1. Fork el repo
2. Crea una rama
3. Haz tus cambios
4. Crea PR

---

**Hecho con Next.js 14 y Tailwind CSS** 🚀
