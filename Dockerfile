FROM php:8.2-apache

RUN docker-php-ext-install pdo_mysql

WORKDIR /var/www/html
COPY . /var/www/html

RUN printf '#!/bin/sh\nset -e\nPORT="${PORT:-8080}"\nsed -i "s/^Listen .*/Listen ${PORT}/g" /etc/apache2/ports.conf\nsed -i "s/<VirtualHost \\*:[0-9]*>/<VirtualHost *:${PORT}>/g" /etc/apache2/sites-available/000-default.conf\nexec apache2-foreground\n' > /usr/local/bin/start-apache.sh \
    && chmod +x /usr/local/bin/start-apache.sh

EXPOSE 8080
CMD ["/usr/local/bin/start-apache.sh"]
