FROM php:8.2-apache

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set the document root to /var/www/html
ENV APACHE_DOCUMENT_ROOT=/var/www/html

# Configure Apache to allow .htaccess
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Copy the API files
COPY . /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Create uploads directory with proper permissions
RUN mkdir -p /var/www/html/uploads/services \
    && chown -R www-data:www-data /var/www/html/uploads \
    && chmod -R 777 /var/www/html/uploads

# Expose port (Railway will set PORT env var)
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]
