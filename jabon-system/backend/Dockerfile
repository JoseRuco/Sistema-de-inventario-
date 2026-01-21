# ===================================
# Etapa 1: Construcción de dependencias
# ===================================
FROM node:20-alpine AS dependencies

# Instalar dependencias necesarias para compilar módulos nativos (como better-sqlite3)
RUN apk add --no-cache python3 make g++

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# ===================================
# Etapa 2: Imagen de producción
# ===================================
FROM node:20-alpine

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Crear usuario no-root para ejecutar la aplicación
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar dependencias desde la etapa anterior
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar el resto del código
COPY --chown=nodejs:nodejs . .

# Crear directorio para la base de datos con permisos correctos
RUN mkdir -p /app/db && chown -R nodejs:nodejs /app/db

# Cambiar a usuario no-root
USER nodejs

# Exponer el puerto
EXPOSE 3000

# Healthcheck para verificar que el servidor responde
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar dumb-init para manejo correcto de señales (importante para Docker)
ENTRYPOINT ["dumb-init", "--"]

# Comando de inicio
CMD ["node", "src/server.js"]

