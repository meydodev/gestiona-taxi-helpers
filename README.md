# @utils/gestiona-taxi-helpers

Paquete de utilidades compartidas para proyectos de Gestiona Taxi. No registra web
components. Al importarlo, sus funciones también se registran globalmente.

## Instalación

```bash
npm install @utils/gestiona-taxi-helpers
```

## Uso

```js
import {
  configureHelpers,
  formatCurrency,
  getTheme,
  navigation,
  setLanguage,
  setTheme,
  t,
  todayLabel,
} from '@utils/gestiona-taxi-helpers';

configureHelpers({
  locales: {
    es: { welcome: 'Bienvenido' },
    en: { welcome: 'Welcome' },
  },
});

setLanguage('es');
console.log(t('welcome'));       // Bienvenido
console.log(formatCurrency(12)); // 12,00 €
console.log(todayLabel());

setTheme(getTheme());
navigation('/inicio');
```

También se pueden usar directamente después de importar una sola vez el paquete:

```js
import '@utils/gestiona-taxi-helpers';

setLanguage('es');
console.log(formatCurrency(12));
navigation('/inicio');
```

En el navegador están disponibles tanto como `formatCurrency()` como mediante
`window.formatCurrency()`.

## Integración opcional con Capacitor

El paquete no obliga a instalar Capacitor. Si el proyecto lo utiliza, se inyecta
su adaptador al configurar las utilidades:

```js
import { StatusBar } from '@capacitor/status-bar';
import { configureHelpers } from '@utils/gestiona-taxi-helpers';

configureHelpers({ statusBar: StatusBar });
```

Las funciones que usan el DOM son seguras durante SSR: fuera del navegador no
producen efectos.
