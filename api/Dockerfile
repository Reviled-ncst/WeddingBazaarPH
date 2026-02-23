FROM php:8.2-apache

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set the document root to /var/www/html
ENV APACHE_DOCUMENT_ROOT=/var/www/html

# Configure Apache to allow .htaccess
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Configure Apache to listen on PORT env variable (Railway sets this)
RUN sed -i 's/Listen 80/Listen ${PORT}/g' /etc/apache2/ports.conf
RUN sed -i 's/:80/:${PORT}/g' /etc/apache2/sites-available/000-default.conf

# Copy the API files (from api folder when built from root)
COPY api/ /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Create uploads directory with proper permissions
RUN mkdir -p /var/www/html/uploads/services \
    && chown -R www-data:www-data /var/www/html/uploads \
    && chmod -R 777 /var/www/html/uploads

# Default port (Railway will override with PORT env var)
ENV PORT=8080
EXPOSE 8080

# Start Apache with environment variable substitution
CMD ["sh", "-c", "sed -i \"s/\\${PORT}/$PORT/g\" /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf && apache2-foreground"]
