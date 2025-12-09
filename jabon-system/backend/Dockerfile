FROM node:20-alpine

# Instalar dependencias necesarias para compilar módulos nativos (como better-sqlite3)
RUN apk add --no-cache python3 make g++

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Crear directorio para la base de datos (persistencia)
RUN mkdir -p /app/data

# Exponer el puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "src/server.js"]
