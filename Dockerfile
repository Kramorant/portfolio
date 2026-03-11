FROM php:8.2-apache

# Habilita mod_rewrite para URLs limpias
RUN a2enmod rewrite

# Copia todo el proyecto al directorio web
COPY . /var/www/html/

# Crea los directorios que necesitan escritura y ajusta permisos
RUN mkdir -p /var/www/html/projects/data \
    && mkdir -p /var/www/html/assets/img/projects \
    && chown -R www-data:www-data /var/www/html/projects \
    && chown -R www-data:www-data /var/www/html/assets/img/projects \
    && chmod -R 775 /var/www/html/projects \
    && chmod -R 775 /var/www/html/assets/img/projects

# Configurar Apache para usar el puerto dinámico de Railway ($PORT)
RUN sed -i 's/Listen 80/Listen ${PORT}/' /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/' /etc/apache2/sites-enabled/000-default.conf

EXPOSE 80
