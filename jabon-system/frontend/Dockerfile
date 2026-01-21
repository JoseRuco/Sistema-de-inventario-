# ===================================
# Etapa 1: Construcción
# ===================================
FROM node:20-alpine as builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build

# ===================================
# Etapa 2: Producción con Nginx
# ===================================
FROM nginx:alpine

# Copiar los archivos construidos desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# La configuración de Nginx se monta desde docker-compose.yml
# Esto permite actualizarla sin reconstruir la imagen

# Exponer el puerto 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]

