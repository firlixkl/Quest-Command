FROM nginx:alpine

RUN rm -rf /var/www/html

RUN mkdir -p /var/www/pentesthub \
    && rm -f /etc/nginx/conf.d/default.conf

COPY index.html style.css app.js /var/www/pentesthub/
COPY data/ /var/www/pentesthub/data/

RUN chmod -R 755 /var/www/pentesthub \
    && chown -R nginx:nginx /var/www/pentesthub

COPY nginx-pentesthub.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
