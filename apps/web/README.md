# Kontecst Web Application

Next.js web application for Kontecst.

## Development

```bash
npm run dev
```

## Troubleshooting

### Webpack Cache Errors

If you encounter webpack cache errors like:

```
[webpack.cache.PackFileCacheStrategy] Restoring pack failed: TypeError: Cannot read properties of undefined (reading 'hasStartTime')
```

This indicates corrupted webpack cache files. To fix:

**Option 1: Clean cache only**
```bash
npm run clean:cache
```

**Option 2: Clean entire build directory**
```bash
npm run clean
```

**Option 3: Clean and restart dev server**
```bash
npm run dev:clean
```

### When to Clear Cache

Clear the cache when you:
- Update Next.js or webpack versions
- Experience build errors after dependency updates
- See "Fast Refresh had to perform a full reload" warnings repeatedly
- Encounter module resolution issues

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Remove .next directory
- `npm run clean:cache` - Remove webpack cache only
- `npm run dev:clean` - Clean and start dev server
