#!/bin/bash
set -e

# Railway inyecta $PORT en runtime. Configuramos Apache para escuchar en ese puerto.
PORT="${PORT:-80}"

# Actualiza el puerto en la configuración de Apache
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-enabled/000-default.conf

echo "Starting Apache on port ${PORT}..."
exec apache2-foreground
