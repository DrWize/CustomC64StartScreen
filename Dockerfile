# C64 Boot Screen Editor - Docker Image
# Lightweight HTTP server with directory listing for font library
# Uses httpd (Apache) which has autoindex enabled by default

FROM httpd:2.4-alpine

# Cache-busting: use current date to ensure fresh builds
RUN echo "Building at: $(date)" > /dev/null

# Copy application files to htdocs
COPY . /usr/local/apache2/htdocs

# Expose port 8064 (default)
EXPOSE 8064

# Configure httpd to listen on port 8064
RUN sed -i 's/^Listen .*/Listen 8064/' /usr/local/apache2/conf/httpd.conf \
    && echo 'ServerName localhost' >> /usr/local/apache2/conf/httpd.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8064/ || exit 1

CMD ["httpd-foreground"]
