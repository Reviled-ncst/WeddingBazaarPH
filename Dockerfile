FROM php:8.2-cli

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql

# Set working directory
WORKDIR /var/www/html

# Copy the API files
COPY api/ /var/www/html/

# Create uploads directory with proper permissions
RUN mkdir -p /var/www/html/uploads/services \
    && chmod -R 777 /var/www/html/uploads

# Default port
EXPOSE 8080

# Start PHP built-in server
CMD ["php", "-S", "0.0.0.0:8080", "-t", "/var/www/html"]
